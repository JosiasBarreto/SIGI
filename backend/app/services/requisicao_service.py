import uuid
from datetime import datetime, timedelta
from app.models.requisicao import (
    Requisicao, RequisicaoItem, EntregaRequisicao, DevolucaoMaterial,
    OcorrenciaMaterial, TipoRequisicao, SectorRequisicao, EstadoRequisicao, 
    TipoItemRequisicao, TipoOcorrencia, EstadoOcorrencia
)
from app.models.material import Material, TipoMaterial
from app.models.ingrediente import Ingrediente
from app.models.movimento_stock import MovimentoStock, TipoMovimento, OrigemMovimento, EntidadeMovimento
from app.models.pedido import Pedido, EstadoPedido
from app.models.ordem_producao import OrdemProducao, EstadoProducao, ConsumoIngrediente
from app.models.item_pedido import ItemPedido
from app.models.ficha_tecnica import FichaTecnica
from app.repositories.requisicao_repos import RequisicaoRepository, OcorrenciaMaterialRepository
from app.services.audit_service import AuditService
from app.core.database import db
from app.websocket.socket_manager import socketio
from sqlalchemy import func

class RequisicaoService:
    def __init__(self):
        self.req_repo = RequisicaoRepository()
        self.ocorrencia_repo = OcorrenciaMaterialRepository()

    def create_requisicao(self, data, user_id):
        itens_data = data.pop('itens', [])
        numero = f"REQ-{datetime.utcnow().strftime('%Y%M')}-{str(uuid.uuid4())[:6].upper()}"
        
        req = Requisicao(**data, numero=numero, responsavel_id=user_id)
        
        for item in itens_data:
            i = RequisicaoItem(**item)
            req.itens.append(i)
            
        self.req_repo.create(req)
        AuditService.log_action(user_id, "CREATE", "requisicoes", req.id)
        socketio.emit('nova_requisicao', {'numero': req.numero})
        return req, None

    def aprovar_requisicao(self, req_id, itens_aprovacao, user_id):
        req = self.req_repo.get_by_id(req_id)
        if not req: return None, "Requisição não encontrada"
        if req.estado != EstadoRequisicao.PENDENTE.value:
            return None, "Requisição não está pendente"
            
        for apr_item in itens_aprovacao:
            for req_item in req.itens:
                if req_item.id == apr_item.get('id') or req_item.item_id == apr_item.get('item_id'):
                    req_item.quantidade_aprovada = float(apr_item.get('quantidade_aprovada', 0))
                    
        req.estado = EstadoRequisicao.APROVADA.value
        db.session.commit()
        
        AuditService.log_action(user_id, "APROVAR_REQUISICAO", "requisicoes", req.id)
        socketio.emit('requisicao_aprovada', {'numero': req.numero})
        return req, None

    def entregar_requisicao(self, req_id, data, user_id):
        req = self.req_repo.get_by_id(req_id)
        if not req: return None, "Requisição não encontrada"
        if req.estado != EstadoRequisicao.APROVADA.value:
            return None, "Requisição não está Aprovada"
            
        entrega = EntregaRequisicao(
            requisicao_id=req.id,
            armazem_responsavel_id=user_id,
            observacao=data.get('observacao')
        )
        db.session.add(entrega)
        
        # O armazém entrega a mesma qtd aprovada (ou pode ser custom, simplificamos assumindo = aprovada)
        for item in req.itens:
            if item.quantidade_aprovada > 0:
                item.quantidade_entregue = item.quantidade_aprovada
                
                # Baixar Stock do Armazem
                if item.tipo_item == TipoItemRequisicao.INGREDIENTE.value:
                    ing = db.session.query(Ingrediente).filter_by(id=item.item_id).first()
                    ing.stock_atual = float(ing.stock_atual) - float(item.quantidade_entregue)
                    mov = MovimentoStock(
                        tipo=TipoMovimento.SAIDA, origem=OrigemMovimento.REQUISICAO,
                        entidade_tipo=EntidadeMovimento.INGREDIENTE, referencia_id=ing.id,
                        quantidade=item.quantidade_entregue, created_by=user_id,
                        justificacao=f"Entrega Requisição {req.numero}"
                    )
                    db.session.add(mov)
                elif item.tipo_item == TipoItemRequisicao.CONSUMIVEL.value:
                    from app.models.produto import Produto
                    from app.models.stock_movement import StockMovement, TipoMovimentoStock
                    prod = db.session.query(Produto).filter_by(id=item.item_id).first()
                    stock_ant = float(prod.stock_atual)
                    prod.stock_atual = stock_ant - float(item.quantidade_entregue)
                    mov = StockMovement(
                        produto_id=prod.id, tipo_movimento=TipoMovimentoStock.REQUISICAO,
                        quantidade=-float(item.quantidade_entregue),
                        stock_anterior=stock_ant, stock_posterior=prod.stock_atual,
                        referencia=f"Requisição #{req.numero}",
                        utilizador_id=user_id, observacao=f"Entrega Requisição {req.numero}"
                    )
                    db.session.add(mov)
                else:
                    mat = db.session.query(Material).filter_by(id=item.item_id).first()
                    mat.quantidade_disponivel = float(mat.quantidade_disponivel) - float(item.quantidade_entregue)
                    mat.estado = 'Em Uso'
                    mov = MovimentoStock(
                        tipo=TipoMovimento.SAIDA, origem=OrigemMovimento.REQUISICAO,
                        entidade_tipo=EntidadeMovimento.MATERIAL, referencia_id=mat.id,
                        quantidade=item.quantidade_entregue, created_by=user_id,
                        justificacao=f"Entrega Requisição {req.numero}"
                    )
                    db.session.add(mov)
                    
        req.estado = EstadoRequisicao.EM_USO.value
        db.session.commit()
        
        AuditService.log_action(user_id, "ENTREGAR_REQUISICAO", "requisicoes", req.id)
        return req, None

    def devolver_material(self, req_id, devolucoes_data, user_id):
        req = self.req_repo.get_by_id(req_id)
        if not req: return None, "Requisição não encontrada"
        if req.estado not in [EstadoRequisicao.EM_USO.value, EstadoRequisicao.DEVOLUCAO_PARCIAL.value]:
            return None, "Requisição não está em uso"
            
        for d_data in devolucoes_data:
            mat_id = d_data['material_id']
            qtd_dev = float(d_data.get('quantidade_devolvida', 0))
            qtd_dan = float(d_data.get('quantidade_danificada', 0))
            qtd_per = float(d_data.get('quantidade_perdida', 0))
            
            if qtd_dan > 0 or qtd_per > 0:
                if 'justificacao' not in d_data or not d_data['justificacao'].strip():
                    return None, "Justificativa é obrigatória para materiais danificados ou perdidos."

            # Achar req_item
            req_item = next((i for i in req.itens if i.item_id == mat_id and i.tipo_item == TipoItemRequisicao.MATERIAL.value), None)
            if not req_item: continue
            
            # Validar limite
            total_dev = qtd_dev + qtd_dan + qtd_per + float(req_item.quantidade_devolvida) + float(req_item.quantidade_danificada) + float(req_item.quantidade_perdida)
            if total_dev > float(req_item.quantidade_entregue):
                return None, f"Devolução ultrapassa o entregue para o material ID {mat_id}"
                
            req_item.quantidade_devolvida = float(req_item.quantidade_devolvida) + qtd_dev
            req_item.quantidade_danificada = float(req_item.quantidade_danificada) + qtd_dan
            req_item.quantidade_perdida = float(req_item.quantidade_perdida) + qtd_per
            
            mat = db.session.query(Material).filter_by(id=mat_id).first()
            
            # Se devolução inteira -> volta para armazém
            if qtd_dev > 0:
                mat.quantidade_disponivel = float(mat.quantidade_disponivel) + qtd_dev
                mov = MovimentoStock(
                    tipo=TipoMovimento.ENTRADA, origem=OrigemMovimento.DEVOLUCAO,
                    entidade_tipo=EntidadeMovimento.MATERIAL, referencia_id=mat.id,
                    quantidade=qtd_dev, created_by=user_id,
                    justificacao=f"Devolução Requisição {req.numero}"
                )
                db.session.add(mov)
                
            # Gerar Ocorrencia para Danos ou Perdas
            if qtd_dan > 0:
                oc = OcorrenciaMaterial(
                    numero=f"OC-{str(uuid.uuid4())[:8].upper()}", material_id=mat.id,
                    responsavel_id=user_id, tipo=TipoOcorrencia.DANIFICADO,
                    quantidade=qtd_dan, justificacao=d_data.get('justificacao', 'Dano reportado na devolução')
                )
                db.session.add(oc)
                mat.quantidade_total = float(mat.quantidade_total) - qtd_dan # Perdeu total
                socketio.emit('alerta_material', {'msg': 'Material Danificado reportado!'})
                
            if qtd_per > 0:
                oc = OcorrenciaMaterial(
                    numero=f"OC-{str(uuid.uuid4())[:8].upper()}", material_id=mat.id,
                    responsavel_id=user_id, tipo=TipoOcorrencia.PERDA,
                    quantidade=qtd_per, justificacao=d_data.get('justificacao', 'Perda reportada na devolução')
                )
                db.session.add(oc)
                mat.quantidade_total = float(mat.quantidade_total) - qtd_per
                socketio.emit('alerta_material', {'msg': 'Material Perdido reportado!'})
                
            dev_log = DevolucaoMaterial(
                requisicao_id=req.id, material_id=mat.id,
                quantidade_entregue=req_item.quantidade_entregue,
                quantidade_devolvida=qtd_dev, quantidade_danificada=qtd_dan,
                quantidade_perdida=qtd_per, observacao=d_data.get('observacao')
            )
            db.session.add(dev_log)

        # Checar se todos os reutilizáveis foram devolvidos/contabilizados
        todos_devolvidos = True
        for item in req.itens:
            if item.tipo_item == TipoItemRequisicao.MATERIAL.value:
                mat = db.session.query(Material).filter_by(id=item.item_id).first()
                if mat and mat.tipo == TipoMaterial.REUTILIZAVEL.value:
                    total_processado = float(item.quantidade_devolvida) + float(item.quantidade_danificada) + float(item.quantidade_perdida)
                    if total_processado < float(item.quantidade_entregue):
                        todos_devolvidos = False
                        break
                        
        req.estado = EstadoRequisicao.DEVOLVIDA.value if todos_devolvidos else EstadoRequisicao.DEVOLUCAO_PARCIAL.value
        db.session.commit()
        AuditService.log_action(user_id, "DEVOLUCAO_MATERIAL", "requisicoes", req.id)
        return req, None

    def encerrar_requisicao(self, req_id, user_id):
        req = self.req_repo.get_by_id(req_id)
        if not req: return None, "Requisição não encontrada"
        if req.estado not in [EstadoRequisicao.DEVOLVIDA.value, EstadoRequisicao.EM_USO.value, EstadoRequisicao.DEVOLUCAO_PARCIAL.value]:
            return None, "Estado inválido para encerrar. A requisição deve estar em uso ou devolvida."
            
        # Conferência: Se ainda há material não devolvido -> Ocorrência de Não Devolvido
        for item in req.itens:
            if item.tipo_item == TipoItemRequisicao.MATERIAL.value:
                mat = db.session.query(Material).filter_by(id=item.item_id).first()
                if mat and mat.tipo == TipoMaterial.REUTILIZAVEL.value:
                    total_processado = float(item.quantidade_devolvida) + float(item.quantidade_danificada) + float(item.quantidade_perdida)
                    pendente = float(item.quantidade_entregue) - total_processado
                    
                    if pendente > 0:
                        oc = OcorrenciaMaterial(
                            numero=f"OC-{str(uuid.uuid4())[:8].upper()}", material_id=mat.id,
                            responsavel_id=user_id, tipo=TipoOcorrencia.NAO_DEVOLVIDO,
                            quantidade=pendente, justificacao="Encerramento de requisição com itens pendentes."
                        )
                        db.session.add(oc)
                        mat.quantidade_total = float(mat.quantidade_total) - pendente
                        item.quantidade_perdida = float(item.quantidade_perdida) + pendente # Marcamos como perdida contabilizada
                        socketio.emit('alerta_material', {'msg': 'Material Não Devolvido!'})
                        
        req.estado = EstadoRequisicao.ENCERRADA.value
        db.session.commit()
        AuditService.log_action(user_id, "ENCERRAR_REQUISICAO", "requisicoes", req.id)
        return req, None

class GeradorRequisicaoAutomatica:
    """ Servico para sugerir requisicao """
    @staticmethod
    def gerar_sugestao(sector: SectorRequisicao):
        hoje = datetime.utcnow().date()
        
        # Buscar ordens de produção de hoje para o sector
        ops = db.session.query(OrdemProducao).filter_by(
            sector=sector.value, data_producao=hoje
        ).filter(OrdemProducao.estado.in_([EstadoProducao.PENDENTE.value])).all()
        
        ingredientes_necessarios = {}
        for op in ops:
            for cons in op.consumos:
                if cons.ingrediente_id in ingredientes_necessarios:
                    ingredientes_necessarios[cons.ingrediente_id] += float(cons.quantidade_prevista)
                else:
                    ingredientes_necessarios[cons.ingrediente_id] = float(cons.quantidade_prevista)
                    
        res = []
        for ing_id, qtd in ingredientes_necessarios.items():
            ing = db.session.query(Ingrediente).filter_by(id=ing_id).first()
            if ing:
                res.append({
                    "tipo_item": TipoItemRequisicao.INGREDIENTE.value,
                    "item_id": ing.id,
                    "nome": ing.nome,
                    "quantidade_sugerida": qtd
                })
        
        return res

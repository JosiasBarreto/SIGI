import uuid
from datetime import datetime, timedelta
from app.models.ficha_tecnica import FichaTecnica, FichaTecnicaItem, TipoFicha
from app.models.ordem_producao import OrdemProducao, OrdemProducaoItem, SectorProducao, PrioridadeProducao, EstadoProducao, ConsumoIngrediente
from app.models.reserva import ReservaIngrediente, EstadoReserva
from app.models.pedido import Pedido, EstadoPedido
from app.models.item_pedido import ItemPedido, TipoItem
from app.models.produto import Produto
from app.models.ingrediente import Ingrediente
from app.models.movimento_stock import MovimentoStock, TipoMovimento, OrigemMovimento, EntidadeMovimento
from app.repositories.producao_repos import FichaTecnicaRepository, OrdemProducaoRepository
from app.services.audit_service import AuditService
from app.core.database import db
from app.websocket.socket_manager import socketio
from sqlalchemy import func

class ProducaoService:
    def __init__(self):
        self.ficha_repo = FichaTecnicaRepository()
        self.ordem_repo = OrdemProducaoRepository()

    # --- Fichas Técnicas ---
    def create_ficha(self, data, user_id):
        itens_data = data.pop('itens', [])
        ficha = FichaTecnica(**data, created_by=user_id)
        
        for item in itens_data:
            i = FichaTecnicaItem(
                ingrediente_id=item['ingrediente_id'],
                quantidade=item['quantidade'],
                unidade=item['unidade'],
                observacao=item.get('observacao')
            )
            ficha.itens.append(i)
            
        self.ficha_repo.create(ficha)
        AuditService.log_action(user_id, "CREATE", "fichas_tecnicas", ficha.id)
        return ficha, None

    # --- Criação Automática de Ordem ---
    def gerar_ordens_por_pedido(self, pedido_id, user_id):
        pedido = db.session.query(Pedido).filter_by(id=pedido_id).first()
        if not pedido: return False, "Pedido não encontrado"
        
        # Determine if it's scheduled future production
        hoje = datetime.utcnow().date()
        producao_futura = pedido.data_entrega and pedido.data_entrega > hoje
        
        itens_por_setor = {
            SectorProducao.COZINHA: [],
            SectorProducao.PASTELARIA: []
        }
        ordens_criadas = []
        
        for item in pedido.itens:
            # Só interessa para ordens se for produto ACABADO e que tenha Ficha Tecnica
            if item.tipo_item != TipoItem.PRODUTO_ACABADO.value:
                continue
                
            ficha = db.session.query(FichaTecnica).filter_by(produto_acabado_id=item.produto_id, ativo=True).first()
            if not ficha:
                continue
                
            setor = SectorProducao.COZINHA if ficha.tipo == TipoFicha.COZINHA.value else SectorProducao.PASTELARIA
            itens_por_setor[setor].append((item, ficha))
            
        for setor, items in itens_por_setor.items():
            if not items:
                continue
                
            numero = f"OP-{setor.value[:3].upper()}-{datetime.utcnow().strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}"
            ordem = OrdemProducao(
                numero=numero,
                pedido_id=pedido.id,
                sector=setor,
                prioridade=PrioridadeProducao.MEDIA,
                data_producao=pedido.data_entrega if producao_futura else hoje,
                estado=EstadoProducao.PENDENTE,
                created_by=user_id
            )
            db.session.add(ordem)
            db.session.flush() # Para gerar o ID da ordem
            ordens_criadas.append(ordem)
            
            for item, ficha in items:
                # Cria o item na ordem de producao
                op_item = OrdemProducaoItem(
                    ordem_producao_id=ordem.id,
                    produto_id=item.produto_id,
                    quantidade=item.quantidade,
                    observacoes=item.observacoes
                )
                db.session.add(op_item)
                
                # Consumos previstos e reservas
                for req in ficha.itens:
                    qtd_total_prevista = float(req.quantidade) * float(item.quantidade)
                    
                    consumo = ConsumoIngrediente(
                        ordem_producao_id=ordem.id,
                        ingrediente_id=req.ingrediente_id,
                        quantidade_prevista=qtd_total_prevista
                    )
                    db.session.add(consumo)
                    
                    # Se for agendado para o futuro, criar reserva
                    if producao_futura:
                        reserva = ReservaIngrediente(
                            ingrediente_id=req.ingrediente_id,
                            pedido_id=pedido.id,
                            quantidade=qtd_total_prevista
                        )
                        db.session.add(reserva)
        
        db.session.commit()
        for ordem in ordens_criadas:
            AuditService.log_action(user_id, "CREATE", "ordens_producao", ordem.id)
            
        socketio.emit('nova_ordem_producao', {'pedido_id': pedido.id})
        return True, None

    # --- Controle de Ordem ---
    def alterar_estado_ordem(self, ordem_id, estado_novo, user_id):
        ordem = self.ordem_repo.get_by_id(ordem_id)
        if not ordem: return None, "Ordem não encontrada"
        
        estado_antigo = ordem.estado
        ordem.estado = estado_novo
        
        if estado_novo == EstadoProducao.EM_PRODUCAO.value:
            ordem.hora_inicio = datetime.utcnow()
            socketio.emit('producao_iniciada', {'ordem_numero': ordem.numero})
            
        elif estado_novo == EstadoProducao.PRONTO.value:
            ordem.hora_fim = datetime.utcnow()
            
            # Consumir ingredientes
            for consumo in ordem.consumos:
                # Assume que consumiu o previsto, por defeito.
                consumo.quantidade_consumida = consumo.quantidade_prevista
                    
                consumo.data_consumo = datetime.utcnow()
                
                # Atualizar stock
                ing = db.session.query(Ingrediente).filter_by(id=consumo.ingrediente_id).first()
                if ing:
                    if float(ing.stock_atual) < float(consumo.quantidade_consumida):
                        socketio.emit('alerta_stock', {'ingrediente': ing.nome, 'msg': 'Stock insuficiente após consumo!'})
                    
                    ing.stock_atual = float(ing.stock_atual) - float(consumo.quantidade_consumida)
                    
                    # Movimentação
                    mov = MovimentoStock(
                        tipo=TipoMovimento.SAIDA,
                        origem=OrigemMovimento.ARMAZEM,
                        entidade_tipo=EntidadeMovimento.INGREDIENTE,
                        referencia_id=ing.id,
                        quantidade=consumo.quantidade_consumida,
                        justificacao=f"Consumo ordem produção {ordem.numero}",
                        created_by=user_id
                    )
                    db.session.add(mov)

            # Check if reservations exist for this, mark utilized
            reservas = db.session.query(ReservaIngrediente).filter_by(pedido_id=ordem.pedido_id, estado=EstadoReserva.ATIVA.value).all()
            for r in reservas:
                r.estado = EstadoReserva.UTILIZADA.value
            
            socketio.emit('producao_concluida', {'ordem_numero': ordem.numero})
            
        db.session.commit()
        AuditService.log_action(user_id, "UPDATE_ESTADO_OP", "ordens_producao", ordem.id)
        return ordem, None

    def update_ordem(self, ordem_id, data, user_id):
        ordem = self.ordem_repo.get_by_id(ordem_id)
        if not ordem: return None, "Ordem não encontrada"
        
        if 'turno' in data:
            ordem.turno = data['turno']
            
        if 'data_producao' in data:
            ordem.data_producao = data['data_producao']

        db.session.commit()
        AuditService.log_action(user_id, "UPDATE_OP", "ordens_producao", ordem.id)
        return ordem, None

    # --- Planeamento ---
    def prever_consumo(self, dias=7):
        hoje = datetime.utcnow().date()
        data_limite = hoje + timedelta(days=dias)
        
        consumos = db.session.query(
            ConsumoIngrediente.ingrediente_id,
            Ingrediente.nome,
            func.sum(ConsumoIngrediente.quantidade_prevista).label('total_previsto')
        ).join(OrdemProducao).join(Ingrediente).filter(
            OrdemProducao.data_producao >= hoje,
            OrdemProducao.data_producao <= data_limite,
            OrdemProducao.estado.in_([EstadoProducao.PENDENTE.value, EstadoProducao.EM_PRODUCAO.value])
        ).group_by(ConsumoIngrediente.ingrediente_id, Ingrediente.nome).all()
        
        return [{"ingrediente_id": c[0], "nome": c[1], "quantidade_necessaria": float(c[2])} for c in consumos]

from datetime import datetime, date
from decimal import Decimal
from typing import Tuple, Optional, Dict, Any, List
from sqlalchemy import or_, and_, desc
from app.core.database import db
from app.models.inventario import (
    Inventario, InventarioItem, TipoInventario,
    EstadoInventario, SituacaoDivergencia, MotivoAjusteInventario
)
from app.models.armazem import Armazem, ProdutoStockArmazem, MaterialStockArmazem
from app.models.produto import Produto
from app.models.material import Material
from app.models.stock_movement import StockMovement, TipoMovimentoStock
from app.models.movimento_stock import MovimentoStock, TipoMovimento, OrigemMovimento, EntidadeMovimento
from app.services.audit_service import AuditService

class InventarioService:
    def __init__(self):
        pass

    def gerar_numero_inventario(self) -> str:
        ano = datetime.utcnow().year
        prefixo = f"INV-{ano}-"
        ultimo = Inventario.query.filter(Inventario.numero.like(f"{prefixo}%"))\
                                 .order_by(desc(Inventario.id)).first()
        if ultimo and ultimo.numero:
            try:
                seq_str = ultimo.numero.split('-')[-1]
                seq = int(seq_str) + 1
            except (ValueError, IndexError):
                seq = 1
        else:
            seq = 1
        return f"{prefixo}{seq:05d}"

    def criar_inventario(self, data: Dict[str, Any], user_id: int) -> Tuple[Optional[Inventario], Optional[str]]:
        armazem_id = data.get('armazem_id')
        if not armazem_id:
            return None, "Armazém é obrigatório para criar inventário."

        armazem = Armazem.query.get(armazem_id)
        if not armazem:
            return None, f"Armazém com ID {armazem_id} não encontrado."

        tipo_str = str(data.get('tipo', 'COMPLETO')).upper()
        if tipo_str not in [TipoInventario.COMPLETO.value, TipoInventario.PARCIAL.value]:
            return None, f"Tipo de inventário inválido: {tipo_str}. Deve ser COMPLETO ou PARCIAL."

        # Validar inventário ativo concorrente para o mesmo armazém
        inventario_ativo = Inventario.query.filter(
            Inventario.armazem_id == armazem_id,
            Inventario.estado.in_([EstadoInventario.EM_CONTAGEM, EstadoInventario.EM_CONFERENCIA, EstadoInventario.APROVADO])
        ).first()

        if inventario_ativo:
            return None, f"Já existe um inventário ativo ({inventario_ativo.numero}) no armazém {armazem.nome}. Finalize ou cancele-o antes de iniciar outro."

        data_inv_str = data.get('data_inventario')
        if data_inv_str:
            try:
                data_inventario = datetime.strptime(data_inv_str, '%Y-%m-%d').date()
            except ValueError:
                data_inventario = date.today()
        else:
            data_inventario = date.today()

        numero = self.gerar_numero_inventario()

        inventario = Inventario(
            numero=numero,
            armazem_id=armazem_id,
            tipo=TipoInventario(tipo_str),
            estado=EstadoInventario.RASCUNHO,
            data_inventario=data_inventario,
            responsavel_id=user_id,
            observacao=data.get('observacao')
        )
        db.session.add(inventario)
        db.session.flush()

        # Se for PARCIAL e já foram passados itens na criação
        itens_solicitados = data.get('itens', [])
        if tipo_str == TipoInventario.PARCIAL.value and itens_solicitados:
            for it in itens_solicitados:
                p_id = it.get('produto_id')
                m_id = it.get('material_id')
                if (p_id and m_id) or (not p_id and not m_id):
                    db.session.rollback()
                    return None, "Cada item deve conter exclusivamente 'produto_id' OU 'material_id'."
                
                um_id = None
                if p_id:
                    prod = Produto.query.get(p_id)
                    if not prod:
                        db.session.rollback()
                        return None, f"Produto com ID {p_id} não encontrado."
                    um_id = prod.unidade_medida_id
                elif m_id:
                    mat = Material.query.get(m_id)
                    if not mat:
                        db.session.rollback()
                        return None, f"Material com ID {m_id} não encontrado."
                    um_id = mat.unidade_medida_id

                inv_item = InventarioItem(
                    inventario_id=inventario.id,
                    produto_id=p_id,
                    material_id=m_id,
                    unidade_medida_id=um_id,
                    quantidade_sistema=Decimal('0.0'),
                    situacao=SituacaoDivergencia.NAO_CONTADO
                )
                db.session.add(inv_item)

        try:
            db.session.commit()
        except Exception as exc:
            db.session.rollback()
            return None, f"Não foi possível gravar o inventário: {str(exc)}"
        AuditService.log_action(
            user_id=user_id,
            action="CRIAR_INVENTARIO",
            entidade="inventarios",
            record_id=inventario.id,
            new_values=inventario.to_dict(include_resumo=False),
            modulo="ARMAPE"
        )
        return inventario, None

    def iniciar_inventario(self, inventario_id: int, user_id: int) -> Tuple[Optional[Inventario], Optional[str]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None, "Inventário não encontrado."
        if inventario.estado != EstadoInventario.RASCUNHO:
            return None, f"Apenas inventários em estado RASCUNHO podem ser iniciados (estado atual: {inventario.estado.value})."

        armazem_id = inventario.armazem_id

        # 1. Se for COMPLETO, carregar todos os produtos e materiais elegíveis vinculados ao armazém
        if inventario.tipo == TipoInventario.COMPLETO:
            # Limpar itens anteriores caso existam
            InventarioItem.query.filter_by(inventario_id=inventario.id).delete()

            # Snapshot de Produtos no Armazém
            prod_stocks = ProdutoStockArmazem.query.filter_by(armazem_id=armazem_id).all()
            prod_ids_adicionados = set()
            for ps in prod_stocks:
                prod = Produto.query.get(ps.produto_id)
                if prod:
                    prod_ids_adicionados.add(prod.id)
                    item = InventarioItem(
                        inventario_id=inventario.id,
                        produto_id=prod.id,
                        material_id=None,
                        unidade_medida_id=prod.unidade_medida_id,
                        quantidade_sistema=Decimal(str(ps.stock_atual or 0.0)),
                        situacao=SituacaoDivergencia.NAO_CONTADO
                    )
                    db.session.add(item)

            # Adicionar também produtos do catálogo que ainda não possuam linha na tabela armazém (stock 0)
            todos_produtos = Produto.query.all()
            for p in todos_produtos:
                if p.id not in prod_ids_adicionados:
                    item = InventarioItem(
                        inventario_id=inventario.id,
                        produto_id=p.id,
                        material_id=None,
                        unidade_medida_id=p.unidade_medida_id,
                        quantidade_sistema=Decimal('0.0'),
                        situacao=SituacaoDivergencia.NAO_CONTADO
                    )
                    db.session.add(item)

            # Snapshot de Materiais no Armazém
            mat_stocks = MaterialStockArmazem.query.filter_by(armazem_id=armazem_id).all()
            mat_ids_adicionados = set()
            for ms in mat_stocks:
                mat = Material.query.get(ms.material_id)
                if mat:
                    mat_ids_adicionados.add(mat.id)
                    item = InventarioItem(
                        inventario_id=inventario.id,
                        produto_id=None,
                        material_id=mat.id,
                        unidade_medida_id=mat.unidade_medida_id,
                        quantidade_sistema=Decimal(str(ms.stock_atual or 0.0)),
                        situacao=SituacaoDivergencia.NAO_CONTADO
                    )
                    db.session.add(item)

            todos_materiais = Material.query.all()
            for m in todos_materiais:
                if m.id not in mat_ids_adicionados:
                    item = InventarioItem(
                        inventario_id=inventario.id,
                        produto_id=None,
                        material_id=m.id,
                        unidade_medida_id=m.unidade_medida_id,
                        quantidade_sistema=Decimal('0.0'),
                        situacao=SituacaoDivergencia.NAO_CONTADO
                    )
                    db.session.add(item)

        elif inventario.tipo == TipoInventario.PARCIAL:
            # Atualizar o snapshot para os itens já cadastrados no inventário parcial
            for it in inventario.items:
                if it.produto_id:
                    ps = ProdutoStockArmazem.query.filter_by(produto_id=it.produto_id, armazem_id=armazem_id).first()
                    it.quantidade_sistema = Decimal(str(ps.stock_atual if ps else 0.0))
                elif it.material_id:
                    ms = MaterialStockArmazem.query.filter_by(material_id=it.material_id, armazem_id=armazem_id).first()
                    it.quantidade_sistema = Decimal(str(ms.stock_atual if ms else 0.0))
                it.situacao = SituacaoDivergencia.NAO_CONTADO

        inventario.estado = EstadoInventario.EM_CONTAGEM
        inventario.iniciado_em = datetime.utcnow()
        db.session.commit()

        AuditService.log_action(
            user_id=user_id,
            action="INICIAR_INVENTARIO",
            entidade="inventarios",
            record_id=inventario.id,
            new_values={"estado": "EM_CONTAGEM", "iniciado_em": inventario.iniciado_em.isoformat()},
            modulo="ARMAPE"
        )
        return inventario, None

    def registar_contagem_item(self, inventario_id: int, item_id: int, data: Dict[str, Any], user_id: int) -> Tuple[Optional[InventarioItem], Optional[str]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None, "Inventário não encontrado."
        if inventario.estado != EstadoInventario.EM_CONTAGEM:
            return None, f"Contagens só podem ser registadas no estado EM_CONTAGEM (atual: {inventario.estado.value})."

        item = InventarioItem.query.filter_by(id=item_id, inventario_id=inventario_id).first()
        if not item:
            return None, f"Item com ID {item_id} não pertence a este inventário."

        if 'quantidade_contada' not in data or data['quantidade_contada'] is None:
            return None, "O campo 'quantidade_contada' é obrigatório."

        try:
            qtd_contada = Decimal(str(data['quantidade_contada']))
            if qtd_contada < Decimal('0.0'):
                return None, "A quantidade contada não pode ser negativa."
        except Exception:
            return None, "Quantidade contada inválida."

        qtd_sistema = Decimal(str(item.quantidade_sistema or 0.0))
        diferenca = qtd_contada - qtd_sistema

        # Classificação estrita no Backend
        if diferenca == Decimal('0.0'):
            situacao = SituacaoDivergencia.SEM_DIVERGENCIA
        elif diferenca < Decimal('0.0'):
            situacao = SituacaoDivergencia.FALTA
        else:
            situacao = SituacaoDivergencia.SOBRA

        motivo_str = data.get('motivo_ajuste')
        motivo_enum = None
        if motivo_str:
            try:
                motivo_enum = MotivoAjusteInventario(str(motivo_str).upper())
            except ValueError:
                return None, f"Motivo de ajuste '{motivo_str}' inválido. Valores aceites: {[m.value for m in MotivoAjusteInventario]}."
        elif situacao != SituacaoDivergencia.SEM_DIVERGENCIA:
            # Se houver divergência, é recomendável sugerir ou exigir motivo
            motivo_enum = MotivoAjusteInventario.VALIDACAO_INVENTARIO

        item.quantidade_contada = qtd_contada
        item.diferenca = diferenca
        item.situacao = situacao
        item.motivo_ajuste = motivo_enum
        item.observacao = data.get('observacao') or item.observacao
        item.contado_por = user_id
        item.contado_em = datetime.utcnow()

        db.session.commit()

        AuditService.log_action(
            user_id=user_id,
            action="REGISTAR_CONTAGEM",
            entidade="inventario_items",
            record_id=item.id,
            new_values={
                "item_id": item.id,
                "quantidade_contada": float(qtd_contada),
                "diferenca": float(diferenca),
                "situacao": situacao.value,
                "motivo": motivo_enum.value if motivo_enum else None
            },
            modulo="ARMAPE"
        )
        return item, None

    def registar_contagens_lote(self, inventario_id: int, contagens: List[Dict[str, Any]], user_id: int) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None, "Inventário não encontrado."
        if inventario.estado != EstadoInventario.EM_CONTAGEM:
            return None, f"Contagens só podem ser registadas no estado EM_CONTAGEM (atual: {inventario.estado.value})."

        if not isinstance(contagens, list) or len(contagens) == 0:
            return None, "Lista de contagens vazia ou em formato incorreto."

        itens_processados = []
        try:
            for idx, c in enumerate(contagens):
                item_id = c.get('item_id')
                if not item_id:
                    db.session.rollback()
                    return None, f"Linha {idx + 1}: 'item_id' é obrigatório."

                item = InventarioItem.query.filter_by(id=item_id, inventario_id=inventario_id).first()
                if not item:
                    db.session.rollback()
                    return None, f"Linha {idx + 1}: Item com ID {item_id} não pertence a este inventário."

                if 'quantidade_contada' not in c or c['quantidade_contada'] is None:
                    db.session.rollback()
                    return None, f"Linha {idx + 1}: 'quantidade_contada' é obrigatória."

                try:
                    qtd_contada = Decimal(str(c['quantidade_contada']))
                    if qtd_contada < Decimal('0.0'):
                        db.session.rollback()
                        return None, f"Linha {idx + 1}: Quantidade contada não pode ser negativa."
                except Exception:
                    db.session.rollback()
                    return None, f"Linha {idx + 1}: Valor de quantidade contada inválido."

                qtd_sistema = Decimal(str(item.quantidade_sistema or 0.0))
                diferenca = qtd_contada - qtd_sistema

                if diferenca == Decimal('0.0'):
                    situacao = SituacaoDivergencia.SEM_DIVERGENCIA
                elif diferenca < Decimal('0.0'):
                    situacao = SituacaoDivergencia.FALTA
                else:
                    situacao = SituacaoDivergencia.SOBRA

                motivo_str = c.get('motivo_ajuste')
                motivo_enum = None
                if motivo_str:
                    try:
                        motivo_enum = MotivoAjusteInventario(str(motivo_str).upper())
                    except ValueError:
                        db.session.rollback()
                        return None, f"Linha {idx + 1}: Motivo '{motivo_str}' inválido."
                elif situacao != SituacaoDivergencia.SEM_DIVERGENCIA:
                    motivo_enum = MotivoAjusteInventario.VALIDACAO_INVENTARIO

                item.quantidade_contada = qtd_contada
                item.diferenca = diferenca
                item.situacao = situacao
                item.motivo_ajuste = motivo_enum
                item.observacao = c.get('observacao') or item.observacao
                item.contado_por = user_id
                item.contado_em = datetime.utcnow()

                itens_processados.append(item.to_dict())

            db.session.commit()
            AuditService.log_action(
                user_id=user_id,
                action="REGISTAR_CONTAGEM_LOTE",
                entidade="inventarios",
                record_id=inventario.id,
                new_values={"total_contados_lote": len(itens_processados)},
                modulo="ARMAPE"
            )
            return {"total_contados": len(itens_processados), "itens": itens_processados}, None
        except Exception as e:
            db.session.rollback()
            return None, f"Erro ao processar contagens em lote: {str(e)}"

    def finalizar_contagem(self, inventario_id: int, user_id: int, forcar: bool = False) -> Tuple[Optional[Inventario], Optional[str]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None, "Inventário não encontrado."
        if inventario.estado != EstadoInventario.EM_CONTAGEM:
            return None, f"Apenas inventários no estado EM_CONTAGEM podem finalizar contagem (atual: {inventario.estado.value})."

        itens_pendentes = InventarioItem.query.filter_by(
            inventario_id=inventario_id,
            situacao=SituacaoDivergencia.NAO_CONTADO
        ).count()

        if itens_pendentes > 0 and not forcar:
            return None, f"Existem {itens_pendentes} item(ns) pendente(s) de contagem. Registe a contagem de todos ou use forcar=true."

        inventario.estado = EstadoInventario.EM_CONFERENCIA
        inventario.finalizado_em = datetime.utcnow()
        db.session.commit()

        AuditService.log_action(
            user_id=user_id,
            action="FINALIZAR_CONTAGEM",
            entidade="inventarios",
            record_id=inventario.id,
            new_values={"estado": "EM_CONFERENCIA", "finalizado_em": inventario.finalizado_em.isoformat()},
            modulo="ARMAPE"
        )
        return inventario, None

    def aprovar_inventario(self, inventario_id: int, user_id: int) -> Tuple[Optional[Inventario], Optional[str]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None, "Inventário não encontrado."
        if inventario.estado != EstadoInventario.EM_CONFERENCIA:
            return None, f"Apenas inventários em EM_CONFERENCIA podem ser aprovados (atual: {inventario.estado.value})."

        # Validar se todas as divergências possuem motivo
        itens_sem_motivo = InventarioItem.query.filter(
            InventarioItem.inventario_id == inventario_id,
            InventarioItem.situacao.in_([SituacaoDivergencia.FALTA, SituacaoDivergencia.SOBRA]),
            InventarioItem.motivo_ajuste == None
        ).count()

        if itens_sem_motivo > 0:
            return None, f"Existem {itens_sem_motivo} item(ns) com divergência sem motivo atribuído. Atribua os motivos antes de aprovar."

        inventario.estado = EstadoInventario.APROVADO
        inventario.aprovado_em = datetime.utcnow()
        inventario.aprovado_por = user_id
        db.session.commit()

        AuditService.log_action(
            user_id=user_id,
            action="APROVAR_INVENTARIO",
            entidade="inventarios",
            record_id=inventario.id,
            new_values={"estado": "APROVADO", "aprovado_em": inventario.aprovado_em.isoformat()},
            modulo="ARMAPE"
        )
        return inventario, None

    def aplicar_ajustes(self, inventario_id: int, user_id: int) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None, "Inventário não encontrado."
        if inventario.estado == EstadoInventario.APLICADO:
            return None, "INVENTORY_ALREADY_APPLIED: Os ajustes deste inventário já foram aplicados previamente."
        if inventario.estado != EstadoInventario.APROVADO:
            return None, f"O inventário precisa estar APROVADO antes de aplicar ajustes (estado atual: {inventario.estado.value})."

        armazem_id = inventario.armazem_id
        armazem = Armazem.query.get(armazem_id)
        if not armazem:
            return None, "Armazém associado não encontrado."

        ajustes_aplicados = []

        try:
            # Trava transacional nos itens do inventário
            itens = InventarioItem.query.filter_by(inventario_id=inventario_id).all()

            for item in itens:
                if item.diferenca is None or item.diferenca == Decimal('0.0'):
                    continue  # Sem ajuste necessário

                diff = Decimal(str(item.diferenca))

                if item.produto_id:
                    # Bloqueio pessimista no stock do armazém
                    stock_rel = db.session.query(ProdutoStockArmazem)\
                        .with_for_update()\
                        .filter_by(produto_id=item.produto_id, armazem_id=armazem_id)\
                        .first()

                    produto = db.session.query(Produto).with_for_update().get(item.produto_id)
                    if not produto:
                        raise ValueError(f"Produto {item.produto_id} não encontrado durante aplicação.")

                    if not stock_rel:
                        stock_rel = ProdutoStockArmazem(
                            produto_id=produto.id,
                            armazem_id=armazem_id,
                            stock_atual=Decimal('0.0'),
                            stock_minimo=produto.stock_minimo or Decimal('0.0')
                        )
                        db.session.add(stock_rel)
                        db.session.flush()

                    stock_anterior_rel = Decimal(str(stock_rel.stock_atual or 0.0))
                    novo_stock_rel = stock_anterior_rel + diff
                    if novo_stock_rel < Decimal('0.0'):
                        # Ajustar para 0 se política for não permitir stock negativo físico
                        novo_stock_rel = Decimal('0.0')

                    stock_rel.stock_atual = novo_stock_rel

                    # Atualizar produto consolidado
                    stock_anterior_prod = Decimal(str(produto.stock_atual or 0.0))
                    novo_stock_prod = stock_anterior_prod + diff
                    if novo_stock_prod < Decimal('0.0'):
                        novo_stock_prod = Decimal('0.0')
                    produto.stock_atual = novo_stock_prod

                    # Lançar Movimento de Stock Oficial (StockMovement)
                    tipo_mov = TipoMovimentoStock.INVENTARIO
                    mov = StockMovement(
                        produto_id=produto.id,
                        tipo_movimento=tipo_mov,
                        quantidade=abs(diff),
                        stock_anterior=stock_anterior_prod,
                        stock_atual=novo_stock_prod,
                        motivo=f"Inventário {inventario.numero}: {item.motivo_ajuste.value if item.motivo_ajuste else 'AJUSTE'}",
                        referencia=inventario.numero,
                        utilizador_id=user_id,
                        observacao=item.observacao or f"Ajuste de inventário ({'+' if diff > 0 else ''}{diff})"
                    )
                    db.session.add(mov)

                    # Lançar Movimentação de Armazém Oficial (MovimentoStock)
                    mov_armazem = MovimentoStock(
                        tipo=TipoMovimento.ENTRADA if diff > 0 else TipoMovimento.PERDA,
                        origem=OrigemMovimento.AJUSTE,
                        entidade_tipo=EntidadeMovimento.PRODUTO,
                        referencia_id=produto.id,
                        armazem_id=armazem_id,
                        quantidade=abs(diff),
                        quantidade_antes=stock_anterior_rel,
                        quantidade_depois=novo_stock_rel,
                        justificacao=f"Inventário {inventario.numero}: {item.motivo_ajuste.value if item.motivo_ajuste else 'AJUSTE'}"
                    )
                    db.session.add(mov_armazem)

                    ajustes_aplicados.append({
                        "item_id": item.id,
                        "tipo": "PRODUTO",
                        "codigo": produto.codigo,
                        "nome": produto.nome,
                        "stock_anterior": float(stock_anterior_rel),
                        "ajuste": float(diff),
                        "stock_final": float(novo_stock_rel)
                    })

                elif item.material_id:
                    stock_rel = db.session.query(MaterialStockArmazem)\
                        .with_for_update()\
                        .filter_by(material_id=item.material_id, armazem_id=armazem_id)\
                        .first()

                    material = db.session.query(Material).with_for_update().get(item.material_id)
                    if not material:
                        raise ValueError(f"Material {item.material_id} não encontrado durante aplicação.")

                    if not stock_rel:
                        stock_rel = MaterialStockArmazem(
                            material_id=material.id,
                            armazem_id=armazem_id,
                            stock_atual=Decimal('0.0'),
                            stock_minimo=Decimal('0.0')
                        )
                        db.session.add(stock_rel)
                        db.session.flush()

                    stock_anterior_rel = Decimal(str(stock_rel.stock_atual or 0.0))
                    novo_stock_rel = stock_anterior_rel + diff
                    if novo_stock_rel < Decimal('0.0'):
                        novo_stock_rel = Decimal('0.0')

                    stock_rel.stock_atual = novo_stock_rel

                    # Atualizar material consolidado
                    disp_ant = Decimal(str(material.quantidade_disponivel or 0.0))
                    tot_ant = Decimal(str(material.quantidade_total or 0.0))
                    material.quantidade_disponivel = max(Decimal('0.0'), disp_ant + diff)
                    material.quantidade_total = max(Decimal('0.0'), tot_ant + diff)

                    mov_armazem = MovimentoStock(
                        tipo=TipoMovimento.ENTRADA if diff > 0 else TipoMovimento.PERDA,
                        origem=OrigemMovimento.AJUSTE,
                        entidade_tipo=EntidadeMovimento.MATERIAL,
                        referencia_id=material.id,
                        armazem_id=armazem_id,
                        quantidade=abs(diff),
                        quantidade_antes=stock_anterior_rel,
                        quantidade_depois=novo_stock_rel,
                        justificacao=f"Inventário {inventario.numero}: {item.motivo_ajuste.value if item.motivo_ajuste else 'AJUSTE'}"
                    )
                    db.session.add(mov_armazem)

                    ajustes_aplicados.append({
                        "item_id": item.id,
                        "tipo": "MATERIAL",
                        "codigo": material.codigo,
                        "nome": material.nome,
                        "stock_anterior": float(stock_anterior_rel),
                        "ajuste": float(diff),
                        "stock_final": float(novo_stock_rel)
                    })

            # Atualizar estado do inventário para APLICADO
            inventario.estado = EstadoInventario.APLICADO
            inventario.aplicado_em = datetime.utcnow()
            inventario.aplicado_por = user_id

            db.session.commit()

            AuditService.log_action(
                user_id=user_id,
                action="APLICAR_AJUSTES_INVENTARIO",
                entidade="inventarios",
                record_id=inventario.id,
                new_values={
                    "total_ajustes": len(ajustes_aplicados),
                    "aplicado_em": inventario.aplicado_em.isoformat()
                },
                modulo="ARMAPE"
            )

            return {
                "inventario_id": inventario.id,
                "numero": inventario.numero,
                "estado": inventario.estado.value,
                "total_ajustes_aplicados": len(ajustes_aplicados),
                "ajustes": ajustes_aplicados
            }, None

        except Exception as e:
            db.session.rollback()
            return None, f"Falha crítica na aplicação atómica dos ajustes: {str(e)}"

    def cancelar_inventario(self, inventario_id: int, motivo: str, user_id: int) -> Tuple[Optional[Inventario], Optional[str]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None, "Inventário não encontrado."
        if inventario.estado == EstadoInventario.APLICADO:
            return None, "Inventário já aplicado não pode ser cancelado pois gerou movimentações contábeis de stock."
        if inventario.estado == EstadoInventario.CANCELADO:
            return None, "Inventário já se encontra cancelado."

        inventario.estado = EstadoInventario.CANCELADO
        inventario.cancelado_em = datetime.utcnow()
        inventario.cancelado_por = user_id
        inventario.motivo_cancelamento = motivo or "Cancelamento solicitado pelo operador"

        db.session.commit()

        AuditService.log_action(
            user_id=user_id,
            action="CANCELAR_INVENTARIO",
            entidade="inventarios",
            record_id=inventario.id,
            new_values={
                "estado": "CANCELADO",
                "motivo": inventario.motivo_cancelamento,
                "cancelado_em": inventario.cancelado_em.isoformat()
            },
            modulo="ARMAPE"
        )
        return inventario, None

    def listar_inventarios(self, filtros: Dict[str, Any]) -> Dict[str, Any]:
        query = Inventario.query

        if filtros.get('armazem_id'):
            query = query.filter(Inventario.armazem_id == filtros['armazem_id'])
        if filtros.get('estado'):
            query = query.filter(Inventario.estado == filtros['estado'])
        if filtros.get('tipo'):
            query = query.filter(Inventario.tipo == filtros['tipo'])
        if filtros.get('data_inicio'):
            query = query.filter(Inventario.data_inventario >= filtros['data_inicio'])
        if filtros.get('data_fim'):
            query = query.filter(Inventario.data_inventario <= filtros['data_fim'])
        if filtros.get('search'):
            termo = f"%{filtros['search']}%"
            query = query.filter(Inventario.numero.ilike(termo))

        page = int(filtros.get('page', 1))
        per_page = int(filtros.get('per_page', 20))

        pagination = query.order_by(desc(Inventario.id)).paginate(page=page, per_page=per_page, error_out=False)

        return {
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": pagination.page,
            "per_page": pagination.per_page,
            "items": [inv.to_dict(include_resumo=True) for inv in pagination.items]
        }

    def listar_itens(self, inventario_id: int, filtros: Dict[str, Any]) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        inventario = Inventario.query.get(inventario_id)
        if not inventario:
            return None, "Inventário não encontrado."

        query = InventarioItem.query.filter_by(inventario_id=inventario_id)

        if filtros.get('situacao'):
            query = query.filter(InventarioItem.situacao == filtros['situacao'])
        if filtros.get('tipo'):
            if filtros['tipo'].upper() == 'PRODUTO':
                query = query.filter(InventarioItem.produto_id != None)
            elif filtros['tipo'].upper() == 'MATERIAL':
                query = query.filter(InventarioItem.material_id != None)
        if filtros.get('motivo'):
            query = query.filter(InventarioItem.motivo_ajuste == filtros['motivo'])

        if filtros.get('search'):
            termo = f"%{filtros['search']}%"
            query = query.outerjoin(Produto, InventarioItem.produto_id == Produto.id)\
                         .outerjoin(Material, InventarioItem.material_id == Material.id)\
                         .filter(or_(
                             Produto.nome.ilike(termo),
                             Produto.codigo.ilike(termo),
                             Material.nome.ilike(termo),
                             Material.codigo.ilike(termo)
                         ))

        page = int(filtros.get('page', 1))
        per_page = int(filtros.get('per_page', 50))

        pagination = query.order_by(InventarioItem.id).paginate(page=page, per_page=per_page, error_out=False)

        return {
            "inventario_id": inventario.id,
            "numero": inventario.numero,
            "total": pagination.total,
            "pages": pagination.pages,
            "current_page": pagination.page,
            "per_page": pagination.per_page,
            "items": [it.to_dict() for it in pagination.items]
        }, None

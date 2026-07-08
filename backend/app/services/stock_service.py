from datetime import datetime
from app.core.database import db
from app.models.movimento_stock import MovimentoStock, TipoMovimento, OrigemMovimento, EntidadeMovimento
from app.models.produto import Produto, TipoProduto
from app.models.ingrediente import Ingrediente
from app.models.material import Material
from app.services.audit_service import AuditService

class StockService:
    def registrar_movimento(self, tipo_movimento, origem, entidade_tipo, referencia_id, quantidade, justificacao, user_id):
        quantidade = float(quantidade)
        if quantidade <= 0:
            return None, "Quantidade deve ser maior que zero"

        # Tenta pegar a entidade para atualizar o stock e validar
        entidade = None
        if entidade_tipo == EntidadeMovimento.PRODUTO.value:
            entidade = db.session.query(Produto).with_for_update().get(referencia_id)
            if entidade:
                if tipo_movimento == TipoMovimento.SAIDA.value and float(entidade.stock_atual) < quantidade:
                    # Permite saldo negativo se for Revenda ou Acabado? Não, normalmente bloqueia ou alerta.
                    # Mas para o nosso caso vamos deixar negativar, ou retornar erro?
                    # Vamos permitir negativar ou não? Apenas baixamos o stock.
                    pass
                if tipo_movimento == TipoMovimento.ENTRADA.value:
                    entidade.stock_atual = float(entidade.stock_atual) + quantidade
                elif tipo_movimento in [TipoMovimento.SAIDA.value, TipoMovimento.PERDA.value, TipoMovimento.DANIFICADO.value]:
                    entidade.stock_atual = float(entidade.stock_atual) - quantidade
        
        elif entidade_tipo == EntidadeMovimento.INGREDIENTE.value:
            entidade = db.session.query(Ingrediente).with_for_update().get(referencia_id)
            if entidade:
                if tipo_movimento == TipoMovimento.ENTRADA.value:
                    entidade.stock_atual = float(entidade.stock_atual) + quantidade
                elif tipo_movimento in [TipoMovimento.SAIDA.value, TipoMovimento.PERDA.value, TipoMovimento.DANIFICADO.value]:
                    entidade.stock_atual = float(entidade.stock_atual) - quantidade

        elif entidade_tipo == EntidadeMovimento.MATERIAL.value:
            entidade = db.session.query(Material).with_for_update().get(referencia_id)
            if entidade:
                if tipo_movimento == TipoMovimento.ENTRADA.value:
                    entidade.quantidade_disponivel = float(entidade.quantidade_disponivel) + quantidade
                    entidade.quantidade_total = float(entidade.quantidade_total) + quantidade
                elif tipo_movimento in [TipoMovimento.SAIDA.value, TipoMovimento.PERDA.value, TipoMovimento.DANIFICADO.value]:
                    entidade.quantidade_disponivel = float(entidade.quantidade_disponivel) - quantidade
                    entidade.quantidade_total = float(entidade.quantidade_total) - quantidade

        if not entidade:
            return None, f"Entidade {entidade_tipo} com ID {referencia_id} não encontrada"

        mov = MovimentoStock(
            tipo=tipo_movimento,
            origem=origem,
            entidade_tipo=entidade_tipo,
            referencia_id=referencia_id,
            quantidade=quantidade,
            justificacao=justificacao,
            created_by=user_id
        )
        db.session.add(mov)
        db.session.flush()

        AuditService.log_action(user_id, "MOVIMENTO_STOCK", "movimentacoes_armazem", mov.id, new_values={
            "tipo": tipo_movimento,
            "origem": origem,
            "entidade_tipo": entidade_tipo,
            "referencia_id": referencia_id,
            "quantidade": quantidade,
            "justificacao": justificacao
        })

        return mov, None

    def baixar_stock_venda(self, venda, user_id):
        # Percorrer os itens da venda e processar a baixa de stock
        from app.models.ficha_tecnica import FichaTecnica
        from app.models.ordem_producao import OrdemProducao

        for item in venda.itens:
            # item.item_tipo = 'Produto' etc
            if item.item_tipo == 'Produto':
                produto = db.session.query(Produto).get(item.item_id)
                if not produto:
                    continue

                if produto.tipo == TipoProduto.REVENDA.value:
                    # Baixar stock do produto de revenda
                    self.registrar_movimento(
                        tipo_movimento=TipoMovimento.SAIDA.value,
                        origem=OrigemMovimento.VENDA.value,
                        entidade_tipo=EntidadeMovimento.PRODUTO.value,
                        referencia_id=produto.id,
                        quantidade=item.quantidade,
                        justificacao=f"Venda {venda.numero_documento}",
                        user_id=user_id
                    )
                elif produto.tipo == TipoProduto.ACABADO.value:
                    # Verificar se já houve consumo na produção para este pedido (se a venda for oriunda de um pedido)
                    ja_consumiu_producao = False
                    if venda.pedido_id:
                        from app.models.ordem_producao import EstadoProducao
                        ordens = db.session.query(OrdemProducao).filter(
                            OrdemProducao.pedido_id == venda.pedido_id,
                            OrdemProducao.estado.in_([EstadoProducao.PRONTO.value, EstadoProducao.ENTREGUE.value])
                        ).all()
                        # Se há ordens de produção concluídas para este pedido, assumimos que os ingredientes foram descontados
                        if ordens:
                            ja_consumiu_producao = True
                    
                    if not ja_consumiu_producao:
                        # Baixar estoque do produto acabado.
                        # Ou, de acordo com a regra: "Caso seja um produto acabado comprado de terceiros: baixar normalmente."
                        # Se já consumiu produção, não fazemos nada (os ingredientes já saíram).
                        # Mas e se ele vendeu direto um produto acabado sem pedido? Baixamos do estoque de produto acabado.
                        self.registrar_movimento(
                            tipo_movimento=TipoMovimento.SAIDA.value,
                            origem=OrigemMovimento.VENDA.value,
                            entidade_tipo=EntidadeMovimento.PRODUTO.value,
                            referencia_id=produto.id,
                            quantidade=item.quantidade,
                            justificacao=f"Venda {venda.numero_documento}",
                            user_id=user_id
                        )


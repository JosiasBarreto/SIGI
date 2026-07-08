from datetime import datetime
from app.core.database import db
from app.models.comercial import Venda, VendaItem, TaxaIVA, SerieDocumento, TipoDocumento, EstadoVenda, FechoDiario
from app.repositories.comercial_repos import VendaRepository, TaxaIVARepository, SerieDocumentoRepository
from app.services.audit_service import AuditService
from app.models.produto import Produto, TipoProduto
from app.services.stock_service import StockService

class ComercialService:
    def __init__(self):
        self.venda_repo = VendaRepository()
        self.iva_repo = TaxaIVARepository()
        self.serie_repo = SerieDocumentoRepository()
        self.audit_service = AuditService()

    def generate_numero_documento(self, tipo_documento: str):
        ano_atual = datetime.utcnow().year
        # Lock transacional para série
        serie = SerieDocumento.query.with_for_update().filter_by(tipo_documento=tipo_documento, ano=ano_atual).first()
        
        if not serie:
            serie = SerieDocumento(tipo_documento=tipo_documento, ano=ano_atual, ultimo_numero=0)
            db.session.add(serie)
            db.session.flush()

        serie.ultimo_numero += 1
        numero = serie.ultimo_numero
        
        # Formatar
        return f"{tipo_documento} {ano_atual}/{numero:06d}"

    def create_venda(self, data: dict, user_id: int):
        # Transaction is expected to be managed by the controller, but we can assume db.session scope
        tipo_doc_str = data.get('tipo_documento')
        tipo_documento = TipoDocumento(tipo_doc_str)
        
        numero_documento = self.generate_numero_documento(tipo_documento.value)
        
        venda = Venda(
            numero_documento=numero_documento,
            tipo_documento=tipo_documento,
            cliente_id=data.get('cliente_id'),
            pedido_id=data.get('pedido_id'),
            estado=EstadoVenda.PENDENTE,
            observacoes=data.get('observacoes'),
            criado_por=user_id,
            valor_pago=0.0,
            saldo=0.0
        )
        
        db.session.add(venda)
        db.session.flush()

        subtotal = 0.0
        total_desconto = 0.0
        base_tributavel = 0.0
        total_iva = 0.0

        for item_data in data.get('itens', []):
            if item_data.get('item_tipo', 'Produto') == 'Produto' and item_data.get('item_id'):
                produto = Produto.query.get(item_data['item_id'])
                if produto and produto.tipo == TipoProduto.CONSUMIVEL.value:
                    db.session.rollback()
                    raise ValueError(f"O produto '{produto.nome}' é consumível e não pode ser vendido.")

            preco_unit = float(item_data['preco_unitario'])
            qtd = float(item_data['quantidade'])
            desc = float(item_data.get('desconto', 0))
            
            sub = preco_unit * qtd
            total_item = sub - desc
            
            taxa_iva = None
            if item_data.get('taxa_iva_id'):
                taxa_iva = TaxaIVA.query.get(item_data['taxa_iva_id'])
            
            iva_perc = float(taxa_iva.percentagem) if taxa_iva else 0.0
            valor_iva = total_item * (iva_perc / 100.0)
            
            venda_item = VendaItem(
                venda_id=venda.id,
                item_tipo=item_data.get('item_tipo', 'Produto'),
                item_id=item_data.get('item_id'),
                descricao=item_data['descricao'],
                quantidade=qtd,
                preco_unitario=preco_unit,
                desconto=desc,
                taxa_iva_id=taxa_iva.id if taxa_iva else None,
                taxa_iva=iva_perc,
                valor_iva=valor_iva,
                subtotal=sub,
                total=total_item + valor_iva
            )
            
            db.session.add(venda_item)
            
            subtotal += sub
            total_desconto += desc
            base_tributavel += total_item
            total_iva += valor_iva
            
        venda.subtotal = subtotal
        venda.desconto_total = total_desconto
        venda.base_tributavel = base_tributavel
        venda.total_iva = total_iva
        venda.total = base_tributavel + total_iva
        venda.saldo = venda.total
        
        # Process inline payments if provided
        pagamentos_data = data.get('pagamentos', [])
        for pag_data in pagamentos_data:
            self.add_pagamento(venda.id, pag_data, user_id, auto_commit=False)
        
        # Deduct stock
        stock_service = StockService()
        stock_service.baixar_stock_venda(venda, user_id)

        try:
            db.session.commit()
            
            self.audit_service.log_action(
                user_id=user_id,
                action='CREATE_VENDA',
                module='COMERCIAL',
                ip_address='',
                details={'venda_id': venda.id, 'numero': venda.numero_documento}
            )
            return venda
        except Exception as e:
            db.session.rollback()
            raise e

    def converter_evento_em_venda(self, evento_id, data, user_id):
        from app.models.evento import Evento, EstadoEvento
        from app.models.caixa import Caixa, MovimentoCaixa, TipoMovimentoCaixa
        from app.models.financeiro import Pagamento, FormaPagamento
        from app.models.comercial import Venda, VendaItem
        
        pagamento_info = data.get('pagamento', data) if isinstance(data, dict) else {}

        evento = Evento.query.get(evento_id)
        if not evento:
            return None, "Evento não encontrado."
            
        caixa = Caixa.query.with_for_update().filter_by(estado='Aberto').first()
        if not caixa:
            return None, "Não existe nenhum caixa aberto no momento. Abra o caixa primeiro para realizar vendas."
            
        valor_pagar = float(pagamento_info.get('valor', evento.saldo))
        forma_pg_id = pagamento_info.get('forma_pagamento_id')
        codigo_transf = pagamento_info.get('codigo_transferencia')
        emissor = pagamento_info.get('emissor')
        referencia = pagamento_info.get('referencia')
        observacoes = pagamento_info.get('observacoes', '')
        
        forma_db = FormaPagamento.query.get(forma_pg_id)
        if not forma_db:
            return None, "Forma de pagamento inválida."
            
        nome_forma = forma_db.nome.lower()
        if 'transferencia' in nome_forma or 'transferência' in nome_forma or 'pos' in nome_forma:
            if not codigo_transf:
                return None, "Código de transferência ou código de transação POS é obrigatório."
            if not emissor:
                return None, "Emissor/Remetente da operação de pagamento é obrigatório."
                
        numero_doc = self.generate_numero_documento('FR')
        
        venda = Venda(
            numero_documento=numero_doc,
            tipo_documento='FR',
            cliente_id=evento.cliente_id,
            # We don't have evento_id in Venda model natively, we use observacoes to link it or if it exists, use it.
            # Assuming there's no evento_id, we will put it in observacoes.
            subtotal=evento.valor_total,
            desconto_total=0,
            base_tributavel=evento.valor_total,
            total_iva=0,
            total=evento.valor_total,
            valor_pago=valor_pagar,
            saldo=float(evento.valor_total) - valor_pagar,
            estado='Pago' if (float(evento.valor_total) - valor_pagar) <= 0 else 'Parcialmente Pago',
            observacoes=f"Faturação referente ao Evento {evento.numero}. {observacoes}",
            criado_por=user_id
        )
        db.session.add(venda)
        db.session.flush()
        
        # Add itens based on event services
        for servico in evento.servicos:
            v_item = VendaItem(
                venda_id=venda.id,
                item_tipo='Servico',
                item_id=servico.id,
                descricao=f"Serviço de Evento: {servico.descricao or servico.tipo_servico}",
                quantidade=1,
                preco_unitario=servico.valor,
                subtotal=servico.valor,
                total=servico.valor
            )
            db.session.add(v_item)
            
        # Add items based on equipment/material
        for res in evento.reservas_material:
            v_item = VendaItem(
                venda_id=venda.id,
                item_tipo='Material',
                item_id=res.material_id,
                descricao=f"Reserva de Material: {res.material.nome if res.material else 'Material'}",
                quantidade=res.quantidade,
                preco_unitario=0, # If we want to charge, we'd need its price, but usually it's in the event total
                subtotal=0,
                total=0
            )
            db.session.add(v_item)
            
        pagamento = Pagamento(
            venda_id=venda.id,
            valor=valor_pagar,
            forma_pagamento_id=forma_db.id,
            estado='Pago',
            data_pagamento=datetime.utcnow(),
            codigo_transferencia=codigo_transf,
            emissor=emissor,
            referencia=referencia,
            observacoes=f"Pagamento do evento {evento.numero}. {observacoes}"
        )
        db.session.add(pagamento)
        
        desc_mov = f"Recebimento de Evento {evento.numero} via {forma_db.nome}"
        if codigo_transf:
            desc_mov += f" [Ref: {codigo_transf}, Emissor: {emissor}]"
            
        mov = MovimentoCaixa(
            caixa_id=caixa.id,
            tipo=TipoMovimentoCaixa.RECEBIMENTO,
            valor=valor_pagar,
            descricao=desc_mov,
            utilizador_id=user_id,
            codigo_transferencia=codigo_transf,
            emissor=emissor
        )
        db.session.add(mov)
        
        caixa.saldo_atual = float(caixa.saldo_atual) + valor_pagar
        
        evento.valor_pago = float(evento.valor_pago) + valor_pagar
        evento.saldo = float(evento.valor_total) - float(evento.valor_pago)
        
        if evento.saldo <= 0:
            evento.estado = EstadoEvento.CONCLUIDO
            
        # Deduct stock if there are any products sold, but events usually have services and materials.
        stock_service = StockService()
        stock_service.baixar_stock_venda(venda, user_id)

        try:
            db.session.commit()
            return venda, None
        except Exception as e:
            db.session.rollback()
            return None, f"Erro ao processar faturação do evento: {str(e)}"

    def get_vendas(self):
        return self.venda_repo.get_all()

    def get_venda(self, venda_id: int):
        return self.venda_repo.get_by_id(venda_id)

    def cancel_venda(self, venda_id: int, user_id: int, ip_address: str = ''):
        venda = self.get_venda(venda_id)
        if not venda:
            raise ValueError("Venda não encontrada")
            
        if venda.estado in [EstadoVenda.PAGO, EstadoVenda.CANCELADO]:
            raise ValueError("Não é possível cancelar uma venda já paga ou cancelada")
            
        venda.estado = EstadoVenda.CANCELADO
        
        try:
            db.session.commit()
            self.audit_service.log_action(
                user_id=user_id,
                action='CANCEL_VENDA',
                module='COMERCIAL',
                ip_address=ip_address,
                details={'venda_id': venda.id}
            )
            return venda
        except Exception as e:
            db.session.rollback()
            raise e

    def add_pagamento(self, venda_id, data, user_id, auto_commit=True):
        venda = self.get_venda(venda_id)
        if not venda:
            raise ValueError("Venda não encontrada")
            
        valor_entregue = float(data.get('valor', 0))
        if valor_entregue <= 0:
            raise ValueError("Valor do pagamento deve ser positivo")
            
        saldo_pendente = float(venda.saldo)
        valor_pagar_real = min(valor_entregue, saldo_pendente)
        troco = max(0.0, valor_entregue - saldo_pendente)
            
        from app.models.financeiro import Pagamento, EstadoPagamento
        from app.models.caixa import Caixa, MovimentoCaixa, TipoMovimentoCaixa

        # Verificar caixa aberto
        caixa = Caixa.query.with_for_update().filter_by(estado='Aberto').first()
        if not caixa:
            raise ValueError("Não existe nenhum caixa aberto no momento.")

        pagamento = Pagamento(
            venda_id=venda.id,
            valor=valor_entregue,
            troco=troco if hasattr(Pagamento, 'troco') else 0, # Se a model Pagamento não tiver troco, evitamos crash
            forma_pagamento_id=data.get('forma_pagamento_id'),
            referencia=data.get('referencia'),
            observacoes=f"Pagamento. Troco: {troco}. " + data.get('observacoes', ''),
            estado=EstadoPagamento.PAGO,
            data_pagamento=datetime.utcnow()
        )
        
        venda.valor_pago = float(venda.valor_pago) + valor_pagar_real
        venda.saldo = float(venda.total) - float(venda.valor_pago)
        
        if venda.saldo <= 0:
            venda.estado = EstadoVenda.PAGO
        else:
            venda.estado = EstadoVenda.PARCIALMENTE_PAGO
            
        db.session.add(pagamento)

        mov = MovimentoCaixa(
            caixa_id=caixa.id,
            tipo=TipoMovimentoCaixa.RECEBIMENTO,
            valor=valor_pagar_real,
            descricao=f"Recebimento de Venda {venda.numero_documento}. Troco: {troco}",
            utilizador_id=user_id
        )
        db.session.add(mov)
        caixa.saldo_atual = float(caixa.saldo_atual) + valor_pagar_real
        
        if auto_commit:
            try:
                db.session.commit()
                self.audit_service.log_action(user_id, 'ADD_PAGAMENTO', 'vendas', venda.id, new_values={'valor': valor_pagar_real, 'troco': troco})
                return pagamento
            except Exception as e:
                db.session.rollback()
                raise e
        else:
            self.audit_service.log_action(user_id, 'ADD_PAGAMENTO', 'vendas', venda.id, new_values={'valor': valor_pagar_real, 'troco': troco})
            return pagamento

    def get_todas_taxas_iva(self):
        return self.iva_repo.get_all()
        
    def create_taxa_iva(self, data: dict):
        try:
            iva = TaxaIVA(**data)
            db.session.add(iva)
            db.session.commit()
            return iva
        except Exception as e:
            db.session.rollback()
            raise e

    def update_taxa_iva(self, iva_id: int, data: dict):
        iva = self.iva_repo.get_by_id(iva_id)
        if not iva:
            raise ValueError("Taxa de IVA não encontrada")
            
        if 'descricao' in data:
            iva.descricao = data['descricao']
        if 'percentagem' in data:
            iva.percentagem = data['percentagem']
            
        try:
            db.session.commit()
            return iva
        except Exception as e:
            db.session.rollback()
            raise e
            
    def toggle_taxa_iva_status(self, iva_id: int):
        iva = self.iva_repo.get_by_id(iva_id)
        if not iva:
            raise ValueError("Taxa de IVA não encontrada")
            
        iva.ativo = not iva.ativo
        try:
            db.session.commit()
            return iva
        except Exception as e:
            db.session.rollback()
            raise e

    def fecho_diario(self, data_str: str, user_id):
        # implementation for fecho diario
        data_obj = datetime.strptime(data_str, '%Y-%m-%d').date()
        
        fecho = FechoDiario.query.filter_by(data=data_obj).first()
        if fecho:
            raise ValueError("Fecho diário já efetuado para esta data")
            
        vendas = Venda.query.filter(db.func.date(Venda.created_at) == data_obj).all()
        total_vendas = sum([v.total for v in vendas])
        total_recebido = sum([v.valor_pago for v in vendas])
        
        fecho = FechoDiario(
            data=data_obj,
            total_vendas=total_vendas,
            total_recebido=total_recebido,
            total_despesas=0,
            total_caixas=0,
            criado_por=user_id
        )
        db.session.add(fecho)
        try:
            db.session.commit()
            return fecho
        except Exception as e:
            db.session.rollback()
            raise e

    def converter_pedido_em_venda(self, pedido_id, data, user_id):
        from app.models.pedido import Pedido, EstadoPedido, EstadoPagamento
        from app.models.caixa import Caixa, MovimentoCaixa, TipoMovimentoCaixa
        from app.models.financeiro import Pagamento, FormaPagamento
        from app.models.comercial import Venda, VendaItem
        
        pagamento_info = data.get('pagamento', data) if isinstance(data, dict) else {}

        pedido = Pedido.query.get(pedido_id)
        if not pedido:
            return None, "Pedido não encontrado."
            
        caixa = Caixa.query.with_for_update().filter_by(estado='Aberto').first()
        if not caixa:
            return None, "Não existe nenhum caixa aberto no momento. Abra o caixa primeiro para realizar vendas."
            
        valor_pagar = float(pagamento_info.get('valor', pedido.saldo))
        forma_pg_id = pagamento_info.get('forma_pagamento_id')
        codigo_transf = pagamento_info.get('codigo_transferencia')
        emissor = pagamento_info.get('emissor')
        referencia = pagamento_info.get('referencia')
        observacoes = pagamento_info.get('observacoes', '')
        
        forma_db = FormaPagamento.query.get(forma_pg_id)
        if not forma_db:
            return None, "Forma de pagamento inválida."
            
        nome_forma = forma_db.nome.lower()
        if 'transferencia' in nome_forma or 'transferência' in nome_forma or 'pos' in nome_forma:
            if not codigo_transf:
                return None, "Código de transferência ou código de transação POS é obrigatório."
            if not emissor:
                return None, "Emissor/Remetente da operação de pagamento é obrigatório."
                
        numero_doc = self.generate_numero_documento('FR')
        
        venda = Venda(
            numero_documento=numero_doc,
            tipo_documento='FR',
            cliente_id=pedido.cliente_id,
            pedido_id=pedido.id,
            estado='Pendente',
            observacoes=observacoes,
            criado_por=user_id
        )
        db.session.add(venda)
        db.session.flush()
        
        subtotal = 0.0
        total_desconto = 0.0 # Could be passed in pagamento_info
        base_tributavel = 0.0
        total_iva = 0.0

        for item in pedido.itens:
            iva_perc = 0.0
            taxa_iva_id = None
            if item.produto and item.produto.taxa_iva:
                iva_perc = float(item.produto.taxa_iva.percentagem)
                taxa_iva_id = item.produto.taxa_iva_id
                
            item_sub = float(item.quantidade) * float(item.preco_unitario)
            item_desc = 0.0 # If PedidoItem has no discount, assume 0
            item_base = item_sub - item_desc
            item_iva_val = item_base * (iva_perc / 100.0)
            item_total = item_base + item_iva_val

            v_item = VendaItem(
                venda_id=venda.id,
                item_tipo=item.tipo_item.value if hasattr(item.tipo_item, 'value') else item.tipo_item,
                item_id=item.produto_id,
                descricao=item.descricao or (item.produto.nome if item.produto else "Item"),
                quantidade=item.quantidade,
                preco_unitario=item.preco_unitario,
                desconto=item_desc,
                taxa_iva_id=taxa_iva_id,
                taxa_iva=iva_perc,
                valor_iva=item_iva_val,
                subtotal=item_sub,
                total=item_total
            )
            db.session.add(v_item)
            
            subtotal += item_sub
            base_tributavel += item_base
            total_iva += item_iva_val
            
        venda.subtotal = subtotal
        venda.desconto_total = total_desconto
        venda.base_tributavel = base_tributavel
        venda.total_iva = total_iva
        venda.total = base_tributavel + total_iva
        
        # Recalculate balances based on Venda's actual total (which now includes IVA)
        venda.valor_pago = valor_pagar
        venda.saldo = float(venda.total) - valor_pagar
        venda.estado = 'Pago' if venda.saldo <= 0 else 'Parcialmente Pago'
            
        pagamento = Pagamento(
            pedido_id=pedido.id,
            venda_id=venda.id,
            valor=valor_pagar,
            forma_pagamento_id=forma_db.id,
            estado='Pago',
            data_pagamento=datetime.utcnow(),
            codigo_transferencia=codigo_transf,
            emissor=emissor,
            referencia=referencia,
            observacoes=f"Pagamento do pedido {pedido.numero}. {observacoes}"
        )
        db.session.add(pagamento)
        
        desc_mov = f"Recebimento de Pedido {pedido.numero} via {forma_db.nome}"
        if codigo_transf:
            desc_mov += f" [Ref: {codigo_transf}, Emissor: {emissor}]"
            
        mov = MovimentoCaixa(
            caixa_id=caixa.id,
            tipo=TipoMovimentoCaixa.RECEBIMENTO,
            valor=valor_pagar,
            descricao=desc_mov,
            utilizador_id=user_id,
            codigo_transferencia=codigo_transf,
            emissor=emissor,
            forma_pagamento=forma_db.nome
        )
        db.session.add(mov)
        
        pedido.valor_pago = float(pedido.valor_pago or 0) + valor_pagar
        pedido.saldo = float(pedido.valor_total) - float(pedido.valor_pago)
        
        if pedido.saldo <= 0:
            pedido.estado_pagamento = EstadoPagamento.PAGO
            pedido.estado = EstadoPedido.CONCLUIDO
        else:
            pedido.estado_pagamento = EstadoPagamento.PARCIAL
            pedido.estado = EstadoPedido.CONFIRMADO
            
        # Deduct stock
        stock_service = StockService()
        stock_service.baixar_stock_venda(venda, user_id)

        try:
            db.session.commit()
            return venda, None
        except Exception as e:
            db.session.rollback()
            return None, f"Erro ao processar checkout: {str(e)}"

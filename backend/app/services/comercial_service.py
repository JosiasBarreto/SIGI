from datetime import datetime
from app.core.database import db
from app.models.comercial import Venda, VendaItem, TaxaIVA, SerieDocumento, TipoDocumento, EstadoVenda, FechoDiario
from app.repositories.comercial_repos import VendaRepository, TaxaIVARepository, SerieDocumentoRepository
from app.services.audit_service import AuditService
from app.models.produto import Produto, TipoProduto
from app.services.stock_service import StockService
from app.services.venda_calculo_service import calcular_item_venda, calcular_venda

class StockInsuficienteError(Exception):
    def __init__(self, message="Stock insuficiente para esta operação."):
        self.message = message
        super().__init__(self.message)

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

    @staticmethod
    def _atualizar_pagamento_pedido(pedido):
        """Update only the financial dimension of a pedido.

        The operational state belongs to the production/delivery workflow and
        must never be marked Concluido merely because the invoice was paid.
        """
        from app.models.pedido import EstadoPagamento
        pedido.saldo = max(0.0, float(pedido.valor_total or 0) - float(pedido.valor_pago or 0))
        pedido.estado_pagamento = (
            EstadoPagamento.PAGO.value if pedido.saldo <= 0 else
            EstadoPagamento.PARCIAL.value if float(pedido.valor_pago or 0) > 0 else
            EstadoPagamento.PENDENTE.value
        )

    def create_venda(self, data: dict, user_id: int):
        # Transaction is expected to be managed by the controller, but we can assume db.session scope
        tipo_doc_str = data.get('tipo_documento')
        tipo_documento = TipoDocumento(tipo_doc_str)
        
        numero_documento = self.generate_numero_documento(tipo_documento.value)
        
        cliente_id = data.get('cliente_id')
        if not cliente_id and data.get('pedido_id'):
            from app.models.pedido import Pedido
            p = Pedido.query.get(data.get('pedido_id'))
            if p and p.cliente_id:
                cliente_id = p.cliente_id

        venda = Venda(
            numero_documento=numero_documento,
            tipo_documento=tipo_documento,
            cliente_id=cliente_id,
            pedido_id=data.get('pedido_id'),
            estado=EstadoVenda.PENDENTE,
            observacoes=data.get('observacoes'),
            criado_por=user_id,
            valor_pago=0.0,
            saldo=0.0
        )
        
        db.session.add(venda)
        db.session.flush()

        itens_calculados = []

        for item_data in data.get('itens', []):
            produto = None
            if item_data.get('item_tipo', 'Produto') == 'Produto' and item_data.get('item_id'):
                produto = Produto.query.get(item_data['item_id'])
                if produto and produto.tipo == TipoProduto.CONSUMIVEL.value:
                    db.session.rollback()
                    raise ValueError(f"O produto '{produto.nome}' é consumível e não pode ser vendido.")

            qtd = item_data.get('quantidade')
            
            preco_unit = 0.0
            taxa_iva = None
            if produto:
                preco_unit = produto.preco_venda if produto.preco_venda is not None else 0
                if produto.taxa_iva:
                    taxa_iva = produto.taxa_iva
                    
            if 'preco_unitario' in item_data and not produto:
                preco_unit = item_data['preco_unitario']
                
            if item_data.get('taxa_iva_id') and not taxa_iva:
                taxa_iva = TaxaIVA.query.get(item_data['taxa_iva_id'])
            
            iva_perc = taxa_iva.percentagem if taxa_iva else 0
            calculado = calcular_item_venda(
                preco_unit, qtd, iva_perc,
                desconto_percentual=item_data.get('desconto_percentual'),
                desconto_valor=None if item_data.get('desconto_percentual') is not None else item_data.get('desconto', 0),
            )
            
            venda_item = VendaItem(
                venda_id=venda.id,
                item_tipo=item_data.get('item_tipo', 'Produto'),
                item_id=item_data.get('item_id'),
                descricao=item_data.get('descricao', produto.nome if produto else 'Item'),
                quantidade=calculado.quantidade,
                preco_unitario=calculado.preco_unitario,
                desconto=calculado.desconto,
                taxa_iva_id=taxa_iva.id if taxa_iva else None,
                taxa_iva=calculado.taxa_iva,
                valor_iva=calculado.valor_iva,
                subtotal=calculado.subtotal,
                total=calculado.total
            )
            
            db.session.add(venda_item)
            
            itens_calculados.append(calculado)
            
        if venda.pedido_id:
            venda._subtotal = None
            venda._desconto_total = None
            venda._base_tributavel = None
            venda._total_iva = None
            venda._total = None
            venda._saldo = None
            venda._cliente_id = None
            venda._valor_pago = None
        else:
            totais = calcular_venda(itens_calculados)
            venda.subtotal = totais['subtotal']
            venda.desconto_total = totais['desconto']
            venda.base_tributavel = totais['base_tributavel']
            venda.total_iva = totais['valor_iva']
            venda.total = totais['total']
            venda.saldo = venda.total
        
        # Process inline payments if provided
        pagamentos_data = data.get('pagamentos', [])
        for pag_data in pagamentos_data:
            self.add_pagamento(venda.id, pag_data, user_id, auto_commit=False)

        if tipo_documento == TipoDocumento.FR and float(venda.saldo or 0) > 0.005:
            db.session.rollback()
            raise ValueError('FR só pode ser emitida quando a venda está totalmente paga. Emita FT para pagamento posterior ou parcial.')
        
        # A Pró-Forma is only a commercial proposal: it does not move stock.
        if tipo_documento != TipoDocumento.PROFORMA:
            stock_service = StockService()
            stock_service.baixar_stock_venda(venda, user_id)

        try:
            db.session.commit()
            
            self.audit_service.log_action(
                user_id=user_id,
                action='CREATE_VENDA',
                entidade='vendas',
                record_id=venda.id,
                new_values={'numero': venda.numero_documento},
                modulo='COMERCIAL'
            )
            return venda
        except Exception as e:
            db.session.rollback()
            raise e

    def converter_evento_em_venda(self, evento_id, data, user_id):
        from app.models.evento import Evento, EstadoEvento
        from app.models.caixa import Caixa, MovimentoCaixa, TipoMovimentoCaixa
        from app.models.financeiro import Pagamento, FormaPagamento, EstadoPagamento
        from app.models.comercial import Venda, VendaItem, TipoDocumento, EstadoVenda
        
        pagamento_info = data.get('pagamento', data) if isinstance(data, dict) else {}
        tipo_documento = str(pagamento_info.get('tipo_documento', 'FR')).upper()

        evento = Evento.query.get(evento_id)
        if not evento:
            return None, "Evento não encontrado."
            
        resumo = evento.calcular_resumo_financeiro()
        subtotal_evento = float(resumo['subtotal_geral'])
        iva_evento = float(resumo['total_iva_geral'])
        total_evento = float(resumo['total_geral'])
        desconto_evento = float(resumo['desconto_total'])
        saldo_evento = max(0.0, total_evento - float(evento.valor_pago or 0))

        if tipo_documento == TipoDocumento.PROFORMA.value or tipo_documento == 'FP':
            venda = Venda(
                numero_documento=self.generate_numero_documento(TipoDocumento.PROFORMA.value),
                tipo_documento=TipoDocumento.PROFORMA,
                cliente_id=evento.cliente_id,
                evento_id=evento.id,
                subtotal=subtotal_evento,
                desconto_total=desconto_evento,
                base_tributavel=max(0.0, subtotal_evento - desconto_evento),
                total_iva=iva_evento,
                total=total_evento,
                valor_pago=0,
                saldo=total_evento,
                estado=EstadoVenda.PENDENTE,
                observacoes=f'Fatura Proforma referente ao Evento {evento.numero}.',
                criado_por=user_id,
            )
            db.session.add(venda)
            db.session.flush()
            evento.venda_id = venda.id

            self._adicionar_itens_venda_evento(venda, evento, resumo)

            try:
                db.session.commit()
                return venda, None
            except Exception as exc:
                db.session.rollback()
                return None, f'Erro ao emitir Proforma do evento: {str(exc)}'

        if tipo_documento not in [TipoDocumento.FR.value, TipoDocumento.FT.value, 'FATURA', 'FATURA-RECIBO']:
            return None, 'Tipo de documento de evento inválido. Utilize FT (Fatura) ou FR (Fatura-Recibo).'

        tipo_doc_enum = TipoDocumento.FR if tipo_documento in [TipoDocumento.FR.value, 'FATURA-RECIBO'] else TipoDocumento.FT

        valor_pagar = float(pagamento_info.get('valor', saldo_evento if tipo_doc_enum == TipoDocumento.FR else 0.0))

        if tipo_doc_enum == TipoDocumento.FR and valor_pagar < (saldo_evento - 0.01):
            return None, 'Fatura-Recibo (FR) exige a liquidação total do valor. Para pagamentos fasedos/prestação, emita Fatura (FT).'

        if valor_pagar > (saldo_evento + 0.01):
            return None, "O valor do pagamento não pode ser superior ao saldo do evento."

        forma_db = None
        codigo_transf = None
        emissor = None
        referencia = None
        observacoes = pagamento_info.get('observacoes', '')

        if valor_pagar > 0:
            caixa = Caixa.query.with_for_update().filter_by(estado='Aberto', utilizador_abertura_id=user_id).first()
            if not caixa:
                return None, "Não possui nenhuma sessão de caixa aberta no momento. Abra a sua caixa primeiro para receber pagamentos."

            forma_pg_id = pagamento_info.get('forma_pagamento_id')
            codigo_transf = pagamento_info.get('codigo_transferencia')
            emissor = pagamento_info.get('emissor')
            referencia = pagamento_info.get('referencia')

            forma_db = FormaPagamento.query.get(forma_pg_id)
            if not forma_db:
                return None, "Forma de pagamento inválida."

            nome_forma = forma_db.nome.lower()
            if 'transferencia' in nome_forma or 'transferência' in nome_forma or 'pos' in nome_forma:
                if not codigo_transf:
                    return None, "Código de transferência ou transação POS é obrigatório."
                if not emissor:
                    return None, "Emissor/Remetente da operação de pagamento é obrigatório."

        numero_doc = self.generate_numero_documento(tipo_doc_enum.value)

        novo_pago_venda = float(evento.valor_pago or 0) + valor_pagar
        novo_saldo_venda = max(0.0, total_evento - novo_pago_venda)

        if novo_saldo_venda <= 0:
            estado_venda = EstadoVenda.PAGO
        elif valor_pagar > 0:
            estado_venda = EstadoVenda.PARCIALMENTE_PAGO
        else:
            estado_venda = EstadoVenda.PENDENTE

        venda = Venda(
            numero_documento=numero_doc,
            tipo_documento=tipo_doc_enum,
            cliente_id=evento.cliente_id,
            evento_id=evento.id,
            subtotal=subtotal_evento,
            desconto_total=desconto_evento,
            base_tributavel=max(0.0, subtotal_evento - desconto_evento),
            total_iva=iva_evento,
            total=total_evento,
            valor_pago=novo_pago_venda,
            saldo=novo_saldo_venda,
            estado=estado_venda,
            observacoes=f"Faturação ({tipo_doc_enum.value}) referente ao Evento {evento.numero}. {observacoes}",
            criado_por=user_id
        )
        db.session.add(venda)
        db.session.flush()
        evento.venda_id = venda.id

        self._adicionar_itens_venda_evento(venda, evento, resumo)

        if valor_pagar > 0 and forma_db:
            pagamento = Pagamento(
                venda_id=venda.id,
                evento_id=evento.id,
                valor=valor_pagar,
                forma_pagamento_id=forma_db.id,
                estado=EstadoPagamento.PAGO,
                data_pagamento=datetime.utcnow(),
                codigo_transferencia=codigo_transf,
                emissor=emissor,
                referencia=referencia,
                observacoes=f"Pagamento/Entrada do evento {evento.numero}. {observacoes}"
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
                emissor=emissor,
                forma_pagamento=forma_db.nome
            )
            db.session.add(mov)

        evento.valor_pago = novo_pago_venda
        evento.valor_total = total_evento
        evento.saldo = novo_saldo_venda

        if evento.saldo <= 0:
            evento.estado = EstadoEvento.FATURADO
        else:
            evento.estado = EstadoEvento.CONFIRMADO

        try:
            db.session.commit()
            return venda, None
        except Exception as exc:
            db.session.rollback()
            return None, f"Erro ao processar faturamento do evento: {str(exc)}"

    def _adicionar_itens_venda_evento(self, venda, evento, resumo):
        from app.models.comercial import VendaItem
        tem_item_deslocacao = False
        tem_item_outros = False

        if evento.itens and len(evento.itens) > 0:
            for it in evento.itens:
                q = float(it.quantidade or 1)
                pu = float(it.preco_unitario or 0)
                sub = float(it.subtotal if it.subtotal is not None else (q * pu))
                tot = float(it.total if it.total is not None else sub)
                desc = float(it.valor_desconto or 0)
                desc_str = str(it.descricao or '').lower()

                if 'desloca' in desc_str or 'transporte' in desc_str:
                    tem_item_deslocacao = True
                if 'outros' in desc_str or 'encargo' in desc_str:
                    tem_item_outros = True

                v_item = VendaItem(
                    venda_id=venda.id,
                    item_tipo=it.tipo_item.value if hasattr(it.tipo_item, 'value') else str(it.tipo_item),
                    item_id=it.referencia_id or it.produto_id or it.id,
                    descricao=it.descricao,
                    quantidade=q,
                    preco_unitario=pu,
                    desconto=desc,
                    subtotal=sub,
                    taxa_iva=float(it.taxa_iva or 0),
                    valor_iva=float(it.valor_iva or max(0.0, tot - sub)),
                    total=tot
                )
                db.session.add(v_item)
        else:
            for servico in (evento.servicos or []):
                q = float(servico.quantidade or 1)
                pu = float(servico.valor_unitario or 0)
                sub = q * pu
                v_item = VendaItem(
                    venda_id=venda.id,
                    item_tipo='Servico',
                    item_id=servico.id,
                    descricao=f"Serviço de Evento: {servico.descricao or servico.tipo}",
                    quantidade=q,
                    preco_unitario=pu,
                    subtotal=sub,
                    total=sub
                )
                db.session.add(v_item)

            for res in (evento.reservas_material or []):
                q = float(res.quantidade or 1)
                pu = float(res.valor_unitario or 0)
                sub = q * pu
                v_item = VendaItem(
                    venda_id=venda.id,
                    item_tipo='Material',
                    item_id=res.material_id,
                    descricao=f"Reserva de Material: {res.material.nome if hasattr(res, 'material') and res.material else 'Material'}",
                    quantidade=q,
                    preco_unitario=pu,
                    subtotal=sub,
                    total=sub
                )
                db.session.add(v_item)

            for r in (evento.reservas_espaco or []):
                pu = float(r.valor_aluguer or 0)
                esp_nome = r.espaco.nome if hasattr(r, 'espaco') and r.espaco else "Espaço"
                v_item = VendaItem(
                    venda_id=venda.id,
                    item_tipo='Espaco',
                    item_id=r.espaco_id,
                    descricao=f"Aluguer Espaço: {esp_nome}",
                    quantidade=1.0,
                    preco_unitario=pu,
                    subtotal=pu,
                    total=pu
                )
                db.session.add(v_item)

        desloc_val = float(resumo.get('subtotal_deslocacoes') or 0.0)
        if desloc_val > 0 and not tem_item_deslocacao:
            taxa_iva_serv = float(resumo.get('taxa_iva_servicos') or 0.0) if resumo.get('cobrar_iva_servicos') else 0.0
            val_iva_desl = desloc_val * (taxa_iva_serv / 100.0)
            tot_desl = desloc_val + val_iva_desl
            v_item = VendaItem(
                venda_id=venda.id,
                item_tipo='Deslocacao',
                descricao="Serviço de Transporte / Deslocação",
                quantidade=1.0,
                preco_unitario=desloc_val,
                desconto=0.0,
                subtotal=desloc_val,
                taxa_iva=taxa_iva_serv,
                valor_iva=val_iva_desl,
                total=tot_desl
            )
            db.session.add(v_item)

        outros_val = float(resumo.get('subtotal_outros') or 0.0)
        if outros_val > 0 and not tem_item_outros:
            taxa_iva_serv = float(resumo.get('taxa_iva_servicos') or 0.0) if resumo.get('cobrar_iva_servicos') else 0.0
            val_iva_outros = outros_val * (taxa_iva_serv / 100.0)
            tot_outros = outros_val + val_iva_outros
            v_item = VendaItem(
                venda_id=venda.id,
                item_tipo='Outros',
                descricao="Outras Despesas / Encargos Diversos",
                quantidade=1.0,
                preco_unitario=outros_val,
                desconto=0.0,
                subtotal=outros_val,
                taxa_iva=taxa_iva_serv,
                valor_iva=val_iva_outros,
                total=tot_outros
            )
            db.session.add(v_item)
            
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
                entidade='vendas',
                record_id=venda.id,
                modulo='COMERCIAL'
            )
            return venda
        except Exception as e:
            db.session.rollback()
            raise e

    def add_pagamento(self, venda_id, data, user_id, auto_commit=True):
        venda = self.get_venda(venda_id)
        if venda and venda.tipo_documento == TipoDocumento.PROFORMA:
            raise ValueError('Fatura Pró-Forma não aceita pagamentos. Emita uma FT para faturar o pedido.')
        if not venda:
            raise ValueError("Venda não encontrada")
            
        valor_entregue = float(data.get('valor', 0))
        if valor_entregue <= 0:
            raise ValueError("Valor do pagamento deve ser positivo")
            
        saldo_pendente = float(venda.saldo)
        if venda.tipo_documento == TipoDocumento.FR and float(data.get('valor', 0)) < saldo_pendente:
            raise ValueError('FR não aceita pagamento parcial. Registe pagamentos parciais numa FT.')
        valor_pagar_real = min(valor_entregue, saldo_pendente)
        troco = max(0.0, valor_entregue - saldo_pendente)
            
        from app.models.financeiro import Pagamento, EstadoPagamento, FormaPagamento
        from app.models.caixa import Caixa, MovimentoCaixa, TipoMovimentoCaixa

        # Verificar caixa aberto
        caixa = Caixa.query.with_for_update().filter_by(estado='Aberto', utilizador_abertura_id=user_id).first()
        if not caixa:
            raise ValueError("Não possui nenhuma sessão de caixa aberta no momento. Abra a sua caixa primeiro para realizar pagamentos.")

        pagamento = Pagamento(
            venda_id=venda.id,
            evento_id=venda.evento_id,
            valor=valor_entregue,
            forma_pagamento_id=data.get('forma_pagamento_id'),
            codigo_transferencia=data.get('codigo_transferencia'),
            emissor=data.get('emissor'),
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

        if venda.evento_id or getattr(venda, 'evento', None):
            from app.models.evento import Evento, EstadoEvento
            ev = venda.evento or Evento.query.get(venda.evento_id)
            if ev:
                ev.valor_pago = float(venda.valor_pago)
                ev.saldo = max(0.0, float(ev.valor_total) - float(ev.valor_pago))
                if ev.saldo <= 0:
                    ev.estado = EstadoEvento.FATURADO
            
        db.session.add(pagamento)

        mov = MovimentoCaixa(
            caixa_id=caixa.id,
            tipo=TipoMovimentoCaixa.RECEBIMENTO,
            valor=valor_pagar_real,
            descricao=f"Recebimento de Venda {venda.numero_documento}. Troco: {troco}",
            utilizador_id=user_id,
            forma_pagamento=(FormaPagamento.query.get(data.get('forma_pagamento_id')).nome if data.get('forma_pagamento_id') and FormaPagamento.query.get(data.get('forma_pagamento_id')) else None),
            codigo_transferencia=data.get('codigo_transferencia'),
            emissor=data.get('emissor')
        )
        db.session.add(mov)
        
        
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

    def emitir_documento_pedido(self, pedido_id: int, tipo_documento: str, user_id: int):
        """Issue an unpaid FT or a non-fiscal Proforma for an existing pedido.

        This deliberately does not move cash or stock: the pedido remains the
        operational instruction and the new Venda is the commercial document.
        """
        from app.models.pedido import Pedido
        try:
            tipo = TipoDocumento(tipo_documento)
        except ValueError as exc:
            raise ValueError('Tipo de documento inválido.') from exc
        if tipo not in (TipoDocumento.FT, TipoDocumento.PROFORMA):
            raise ValueError('Para pedido, emita FT ou PROFORMA. FR é reservado para venda direta paga.')

        pedido = Pedido.query.get(pedido_id)
        if not pedido:
            raise ValueError('Pedido não encontrado.')

        if tipo == TipoDocumento.PROFORMA:
            from app.services.proforma_service import ProformaService
            proforma_service = ProformaService()
            data = {
                'pedido_id': pedido.id,
                'cliente_id': pedido.cliente_id,
                'origem': 'Pedido',
                'observacoes': f'Fatura Pró-Forma emitida a partir do pedido {pedido.numero}.',
                'itens': []
            }
            for item in pedido.itens:
                data['itens'].append({
                    'item_tipo': item.tipo_item.value if hasattr(item.tipo_item, 'value') else item.tipo_item,
                    'item_id': item.produto_id,
                    'descricao': item.descricao or (item.produto.nome if item.produto else 'Item'),
                    'quantidade': float(item.quantidade),
                    'preco_unitario': float(item.preco_unitario),
                    'desconto': float(item.desconto or 0),
                    'taxa_iva': float(item.taxa_iva or 0)
                })
            
            return proforma_service.create_proforma(data, user_id)
            
        existente = Venda.query.filter_by(pedido_id=pedido.id, tipo_documento=tipo).first()
        if existente:
            return existente

        venda = Venda(
            numero_documento=self.generate_numero_documento(tipo.value),
            tipo_documento=tipo,
            cliente_id=pedido.cliente_id,
            pedido_id=pedido.id,
            estado=EstadoVenda.PENDENTE,
            observacoes=f'Documento {tipo.value} emitido a partir do pedido {pedido.numero}.',
            criado_por=user_id,
            _subtotal=None, _desconto_total=None, _base_tributavel=None,
            _total_iva=None, _total=None, _valor_pago=0, _saldo=None,
        )
        db.session.add(venda)
        db.session.flush()
        for item in pedido.itens:
            db.session.add(VendaItem(
                venda_id=venda.id,
                item_tipo=item.tipo_item.value if hasattr(item.tipo_item, 'value') else item.tipo_item,
                item_id=item.produto_id,
                descricao=item.descricao or (item.produto.nome if item.produto else 'Item'),
                quantidade=item.quantidade,
                preco_unitario=item.preco_unitario,
                desconto=item.desconto or 0,
                taxa_iva_id=item.taxa_iva_id,
                taxa_iva=item.taxa_iva or 0,
                valor_iva=item.valor_iva or 0,
                subtotal=item.subtotal,
                total=item.total,
            ))
        db.session.commit()
        self.audit_service.log_action(user_id, 'EMITIR_DOCUMENTO', 'vendas', venda.id,
                                      new_values={'tipo': tipo.value, 'pedido_id': pedido.id})
        return venda

    def liquidar_pedido_faturado(self, pedido, venda, data, user_id):
        """Regista parcela na fatura já emitida e mantém pedido/fatura sincronizados."""
        from app.models.pedido import EstadoPagamento
        pagamento_info = data.get('pagamento', data) if isinstance(data, dict) else {}
        valor = float(pagamento_info.get('valor', 0))
        saldo = float(pedido.saldo or 0)
        if valor <= 0:
            return None, "O valor do pagamento deve ser positivo."
        if valor > saldo + 0.01:
            return None, "O valor do pagamento nao pode ser superior ao saldo do pedido."
        self.add_pagamento(venda.id, pagamento_info, user_id, auto_commit=False)
        pedido.valor_pago = float(pedido.valor_pago or 0) + valor
        self._atualizar_pagamento_pedido(pedido)
        db.session.commit()
        return venda, None

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
            
        venda_existente = Venda.query.filter_by(pedido_id=pedido.id).first()

        # Compatibilidade com pedidos criados por versões anteriores do POS:
        # elas gravavam valor_pago no cabeçalho, mas não criavam Pagamento,
        # MovimentoCaixa nem fatura. O checkout atual passa a liquidá-los uma
        # única vez, em vez de bloquear uma venda que nunca foi registada.
        if float(pedido.saldo or 0) <= 0 and float(pedido.valor_pago or 0) > 0:
            pedido.valor_pago = 0
            pedido.saldo = pedido.valor_total
            pedido.estado_pagamento = EstadoPagamento.PENDENTE.value

        caixa = Caixa.query.with_for_update().filter_by(estado='Aberto', utilizador_abertura_id=user_id).first()
        if not caixa:
            return None, "Não possui nenhuma sessão de caixa aberta no momento. Abra a sua caixa primeiro para realizar vendas."
            
        valor_pagar = float(pagamento_info.get('valor', pedido.saldo))
        if valor_pagar <= 0:
            return None, "O valor do pagamento deve ser positivo."
        if valor_pagar > float(pedido.saldo or 0):
            return None, "O valor do pagamento nao pode ser superior ao saldo do pedido."
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
                
        # A pedido is billed as FT. FR remains exclusive to direct, fully paid POS sales.
        is_fully_paid = abs(valor_pagar - float(pedido.saldo or 0)) < 0.01
        tipo_doc = 'FR' if is_fully_paid else 'FT'
        numero_doc = self.generate_numero_documento(tipo_doc)
        
        venda = Venda(
            numero_documento=numero_doc,
            tipo_documento=tipo_doc,
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
            # A fatura reflete exatamente o pedido, incluindo descontos e IVA.
            iva_perc = float(item.taxa_iva or 0)
            taxa_iva_id = item.taxa_iva_id
            item_sub = float(item.subtotal if item.subtotal is not None else item.quantidade * item.preco_unitario)
            item_desc = float(item.desconto or 0)
            item_base = item_sub - item_desc
            item_iva_val = float(item.valor_iva or 0)
            item_total = float(item.total if item.total is not None else item_base + item_iva_val)

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
            
        if venda.pedido_id:
            venda._subtotal = None
            venda._desconto_total = None
            venda._base_tributavel = None
            venda._total_iva = None
            venda._total = None
            venda._cliente_id = None
            venda._valor_pago = None
            venda._saldo = None
        else:
            venda.subtotal = subtotal
            venda.desconto_total = total_desconto
            venda.base_tributavel = base_tributavel
            venda.total_iva = total_iva
            venda.total = base_tributavel + total_iva
            venda.valor_pago = valor_pagar
            venda.saldo = float(venda.total) - valor_pagar

        saldo_restante_pedido = float(pedido.saldo or 0) - float(valor_pagar)
        venda.estado = 'Pago' if (venda.saldo <= 0 if not venda.pedido_id else saldo_restante_pedido <= 0) else 'Parcialmente Pago'
            
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
        self._atualizar_pagamento_pedido(pedido)
            
        # Deduct stock
        stock_service = StockService()
        stock_service.baixar_stock_venda(venda, user_id)

        try:
            db.session.commit()
            return venda, None
        except Exception as e:
            db.session.rollback()
            return None, f"Erro ao processar checkout: {str(e)}"

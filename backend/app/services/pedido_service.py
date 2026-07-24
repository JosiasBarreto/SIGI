import uuid
from app.models.cliente import Cliente
from app.models.pedido import Pedido, EstadoPedido, EstadoPagamento
from app.models.item_pedido import ItemPedido, TipoItem
from app.models.produto import Produto, TipoProduto
from app.repositories.pedido_repos import ClienteRepository, PedidoRepository, ItemPedidoRepository
from app.services.audit_service import AuditService
from app.core.database import db
from app.websocket.socket_manager import socketio
from datetime import datetime

class PedidoService:
    def __init__(self):
        self.cliente_repo = ClienteRepository()
        self.pedido_repo = PedidoRepository()
        self.item_repo = ItemPedidoRepository()

    def create_cliente(self, data, user_id):
        if data.get('nif') and db.session.query(Cliente).filter_by(nif=data['nif'], is_active=True).first():
            return None, "NIF já cadastrado."
            
        cliente = Cliente(**data, created_by=user_id)
        self.cliente_repo.create(cliente)
        AuditService.log_action(user_id, "CREATE", "clientes", cliente.id, new_values=data)
        return cliente, None


    def update_cliente(self, cliente_id, data, user_id):
        cliente = self.cliente_repo.get_by_id(cliente_id)
        if not cliente:
            return None, "Cliente não encontrado."
            
        if data.get('nif') and data['nif'] != cliente.nif:
            existing = self.cliente_repo.model_class.query.filter_by(nif=data['nif'], is_active=True).first()
            if existing and existing.id != cliente_id:
                return None, "NIF já cadastrado por outro cliente."
                
        old_values = {
            "nome": cliente.nome,
            "nif": cliente.nif,
            "telefone": cliente.telefone,
            "whatsapp": cliente.whatsapp,
            "email": cliente.email,
            "morada": cliente.morada,
            "empresa": cliente.empresa,
            "observacoes": cliente.observacoes
        }
        
        if 'nome' in data: cliente.nome = data['nome']
        if 'nif' in data: cliente.nif = data['nif']
        if 'telefone' in data: cliente.telefone = data['telefone']
        if 'whatsapp' in data: cliente.whatsapp = data['whatsapp']
        if 'email' in data: cliente.email = data['email']
        if 'morada' in data: cliente.morada = data['morada']
        if 'empresa' in data: cliente.empresa = data['empresa']
        if 'observacoes' in data: cliente.observacoes = data['observacoes']
        if 'is_active' in data: cliente.is_active = data['is_active']
        if 'ativo' in data: cliente.is_active = data['ativo']
        
        from app.core.database import db
        db.session.commit()
        
        from app.services.audit_service import AuditService
        AuditService.log_action(user_id, "UPDATE", "clientes", cliente.id, old_values=old_values, new_values=data)
        
        return cliente, None

    def create_pedido(self, data, user_id):
        itens_data = data.pop('itens', [])
        
        # Validar itens para proibir ingredientes
        for item in itens_data:
            if item.get('produto_id'):
                produto = db.session.query(Produto).filter_by(id=item['produto_id']).first()
                if not produto:
                    return None, f"Produto ID {item['produto_id']} não encontrado."
                if produto.tipo not in [TipoProduto.ACABADO.value, TipoProduto.REVENDA.value]:
                    return None, f"Item inválido. Apenas produtos acabados ou de revenda são permitidos."
                    
        # Generate Pedido Number
        numero = f"PED-{datetime.utcnow().strftime('%Y%M')[2:]}-{str(uuid.uuid4())[:6].upper()}"
        data['numero'] = numero
        
        # Pagamento
        valor_pago = float(data.get('valor_pago', 0))
        
        pedido = Pedido(**data, created_by=user_id)

        subtotal_pedido = 0.0
        total_desconto = 0.0
        base_tributavel = 0.0
        total_iva = 0.0
        total = 0.0

        for item in itens_data:
            qtd = float(item['quantidade'])
            preco = float(item['preco_unitario'])
            item_sub = qtd * preco

            # Cálculo de IVA
            iva_perc = 0.0
            taxa_iva_id = None
            if item.get('produto_id'):
                produto = db.session.query(Produto).filter_by(id=item['produto_id']).first()
                if produto and produto.taxa_iva:
                    iva_perc = float(produto.taxa_iva.percentagem)
                    taxa_iva_id = produto.taxa_iva_id

            item_desc = float(item.get('desconto', 0))
            item_base = item_sub - item_desc
            item_iva_val = item_base * (iva_perc / 100.0)
            item_total = item_base + item_iva_val

            subtotal_pedido += item_sub
            total_desconto += item_desc
            base_tributavel += item_base
            total_iva += item_iva_val
            total += item_total

            i_pedido = ItemPedido(
                tipo_item=item['tipo_item'],
                produto_id=item.get('produto_id'),
                descricao=item.get('descricao'),
                quantidade=qtd,
                preco_unitario=preco,
                desconto=item_desc,
                taxa_iva_id=taxa_iva_id,
                taxa_iva=iva_perc,
                valor_iva=item_iva_val,
                subtotal=item_sub,
                total=item_total,
                pedido=pedido,
                created_by=user_id
            )
            db.session.add(i_pedido)

        pedido.subtotal = subtotal_pedido
        pedido.desconto_total = total_desconto
        pedido.base_tributavel = base_tributavel
        pedido.total_iva = total_iva
        pedido.valor_total = total
        pedido.saldo = total - valor_pago

        
        if pedido.saldo <= 0 and pedido.valor_total > 0:
            pedido.estado_pagamento = EstadoPagamento.PAGO
        elif valor_pago > 0:
            pedido.estado_pagamento = EstadoPagamento.PARCIAL
        else:
            pedido.estado_pagamento = EstadoPagamento.PENDENTE
            
        db.session.add(pedido)
        db.session.flush() # get ID
        
        # Reservas de ingredientes para pedidos com data futura / agendados
        from datetime import date
        from app.models.reserva import ReservaIngrediente, EstadoReserva
        from app.models.ficha_tecnica import FichaTecnica
        
        if pedido.data_entrega and pedido.data_entrega > date.today():
            for item in itens_data:
                if item.get('produto_id'):
                    # Pega a ficha tecnica do produto
                    ficha = db.session.query(FichaTecnica).filter_by(produto_id=item['produto_id']).first()
                    if ficha:
                        for f_item in ficha.itens:
                            qtd_reservar = float(f_item.quantidade) * float(item['quantidade'])
                            reserva = ReservaIngrediente(
                                ingrediente_id=f_item.ingrediente_id,
                                pedido_id=pedido.id,
                                quantidade=qtd_reservar,
                                estado=EstadoReserva.ATIVA
                            )
                            db.session.add(reserva)
                            
        db.session.commit()
        
        # Generate production orders automatically for kitchen and pastry
        try:
            from app.services.producao_service import ProducaoService
            prod_service = ProducaoService()
            prod_service.gerar_ordens_por_pedido(pedido.id, user_id)
        except Exception as e:
            print("⚠ Could not generate production orders automatically on creation:", e)
            
        AuditService.log_action(user_id, "CREATE", "pedidos", pedido.id, new_values={"numero": numero})
        
        # SocketIO Notification
        socketio.emit('novo_pedido', {'numero': pedido.numero, 'estado': pedido.estado.value if hasattr(pedido.estado, 'value') else pedido.estado})

        
        return pedido, None

    def add_pagamento(self, pedido_id, data, user_id):
        pedido = db.session.query(Pedido).get(pedido_id)
        if not pedido: return None, "Pedido não encontrado"
        
        valor_entregue = float(data.get('valor', 0))
        if valor_entregue <= 0: return None, "Valor do pagamento deve ser positivo"
        
        saldo_pendente = float(pedido.saldo)
        valor_pagar_real = min(valor_entregue, saldo_pendente)
        
        from app.models.caixa import Caixa, MovimentoCaixa, TipoMovimentoCaixa
        from app.models.financeiro import Pagamento, EstadoPagamento
        
        caixa = Caixa.query.with_for_update().filter_by(estado='Aberto').first()
        if not caixa: return None, "Não existe nenhum caixa aberto no momento."
        
        pagamento = Pagamento(
            pedido_id=pedido.id,
            valor=valor_entregue,
            forma_pagamento_id=data.get('forma_pagamento_id'),
            referencia=data.get('referencia'),
            observacoes=data.get('observacoes', ''),
            estado=EstadoPagamento.PAGO,
            data_pagamento=datetime.utcnow()
        )
        db.session.add(pagamento)
        
        pedido.valor_pago = float(pedido.valor_pago) + valor_pagar_real
        pedido.saldo = float(pedido.valor_total) - float(pedido.valor_pago)
        
        if pedido.saldo <= 0:
            pedido.estado_pagamento = EstadoPagamento.PAGO
        else:
            pedido.estado_pagamento = EstadoPagamento.PARCIAL
            
        mov = MovimentoCaixa(
            caixa_id=caixa.id,
            utilizador_id=user_id,
            tipo=TipoMovimentoCaixa.ENTRADA,
            valor=valor_pagar_real,
            descricao=f"Pagamento Pedido #{pedido.numero}",
            forma_pagamento_id=data.get('forma_pagamento_id')
        )
        db.session.add(mov)
        
        caixa.saldo_atual += valor_pagar_real
        
        # Auditoria Pagamento
        from app.services.audit_service import AuditService
        AuditService.log_action(user_id, "ADD_PAGAMENTO", "pedidos", pedido.id, new_values={'valor': valor_pagar_real})
        
        db.session.commit()
        return pagamento, None

    def alterar_estado(self, pedido_id, data, user_id):
        pedido = self.pedido_repo.get_by_id(pedido_id)
        if not pedido:
            return None, "Pedido não encontrado."
            
        novo_estado = data.get('estado')
        
        if novo_estado == EstadoPedido.CANCELADO.value:
            if not data.get('justificativa_cancelamento'):
                return None, "Justificativa obrigatória para cancelamento."
            pedido.justificativa_cancelamento = data['justificativa_cancelamento']
            
        old_estado = pedido.estado
        if novo_estado == EstadoPedido.CONFIRMADO.value and old_estado != EstadoPedido.CONFIRMADO.value:
            # Generate ordens de produção
            from app.services.producao_service import ProducaoService
            prod_service = ProducaoService()
            prod_service.gerar_ordens_por_pedido(pedido.id, user_id)
            
        if novo_estado == EstadoPedido.PRONTO.value and old_estado != EstadoPedido.PRONTO.value:
            socketio.emit('pedido_pronto', {'numero': pedido.numero, 'cliente': pedido.cliente.nome if pedido.cliente else 'Balcão'})
            
        pedido.estado = novo_estado
        db.session.commit()
        
        AuditService.log_action(user_id, "UPDATE_ESTADO", "pedidos", pedido.id, 
                                old_values={"estado": old_estado}, 
                                new_values={"estado": novo_estado})
                                
        socketio.emit('pedido_atualizado', {
            'numero': pedido.numero, 
            'antigo_estado': old_estado, 
            'novo_estado': novo_estado
        })
        
        return pedido, None

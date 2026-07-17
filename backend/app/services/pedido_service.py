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
            "observacoes": cliente.observacoes,
            "percentagem_desconto_padrao": str(cliente.percentagem_desconto_padrao or 0)
        }
        
        if 'nome' in data: cliente.nome = data['nome']
        if 'nif' in data: cliente.nif = data['nif']
        if 'telefone' in data: cliente.telefone = data['telefone']
        if 'whatsapp' in data: cliente.whatsapp = data['whatsapp']
        if 'email' in data: cliente.email = data['email']
        if 'morada' in data: cliente.morada = data['morada']
        if 'empresa' in data: cliente.empresa = data['empresa']
        if 'observacoes' in data: cliente.observacoes = data['observacoes']
        if 'percentagem_desconto_padrao' in data:
            cliente.percentagem_desconto_padrao = data['percentagem_desconto_padrao'] or 0
        
        from app.core.database import db
        db.session.commit()
        
        from app.services.audit_service import AuditService
        AuditService.log_action(user_id, "UPDATE", "clientes", cliente.id, old_values=old_values, new_values=data)
        
        return cliente, None
#ativar e desativar cliente
    def toggle_cliente_status_services(self, cliente_id, user_id):
        cliente = self.cliente_repo.get_by_id(cliente_id)
        if not cliente:
            return None, "Cliente não encontrado."
            
        old_status = cliente.is_active
        cliente.is_active = not old_status
        db.session.commit()
        
        AuditService.log_action(user_id, "TOGGLE_STATUS", "clientes", cliente.id, 
                                old_values={"is_active": old_status}, 
                                new_values={"is_active": cliente.is_active})
                                
        return cliente, None

    def _sync_evento_link(self, pedido):
        if not pedido.evento_id:
            return
        from app.models.evento import Evento
        evento = db.session.query(Evento).with_for_update().get(pedido.evento_id)
        if evento:
            evento.pedido_id = pedido.id
            if not evento.cliente_id and pedido.cliente_id:
                evento.cliente_id = pedido.cliente_id

    def _produto_tipo_value(self, produto):
        return produto.tipo.value if hasattr(produto.tipo, 'value') else produto.tipo

    def create_pedido(self, data, user_id, auto_commit=True):
        itens_data = data.pop('itens', [])
        evento_data = data.pop('evento', None)
        
        # Validar itens para proibir ingredientes
        for item in itens_data:
            if item.get('produto_id'):
                produto = db.session.query(Produto).filter_by(id=item['produto_id']).first()
                if not produto:
                    return None, f"Produto ID {item['produto_id']} não encontrado."
                if self._produto_tipo_value(produto) not in [TipoProduto.ACABADO.value, TipoProduto.REVENDA.value]:
                    return None, f"Item inválido. Apenas produtos acabados ou de revenda são permitidos."
                    
        # Generate Pedido Number
        numero = f"PED-{datetime.utcnow().strftime('%Y%M')[2:]}-{str(uuid.uuid4())[:6].upper()}"
        data['numero'] = numero
        
        # Pagamento
        valor_pago = float(data.get('valor_pago', 0))
        
        pedido = Pedido(**data, created_by=user_id)
        
        total = 0
        
        for item in itens_data:
            qtd = float(item['quantidade'])
            preco = float(item['preco_unitario'])
            subtotal = qtd * preco
            total += subtotal
            
            i_pedido = ItemPedido(
                tipo_item=item['tipo_item'],
                produto_id=item.get('produto_id'),
                descricao=item.get('descricao'),
                quantidade=qtd,
                preco_unitario=preco,
                subtotal=subtotal,
                pedido=pedido,
                created_by=user_id
            )
            db.session.add(i_pedido)
            
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

        if evento_data:
            from app.services.evento_service import EventoService
            evento_data['cliente_id'] = evento_data.get('cliente_id') or pedido.cliente_id
            evento_data['pedido_id'] = pedido.id
            evento, error = EventoService().create_evento(evento_data, user_id, auto_commit=False)
            if error:
                db.session.rollback()
                return None, error
            pedido.evento_id = evento.id
        else:
            self._sync_evento_link(pedido)
        
        # Reservas de ingredientes para pedidos com data futura / agendados
        from datetime import date
        from app.models.reserva import ReservaIngrediente, EstadoReserva
        from app.models.ficha_tecnica import FichaTecnica
        
        if pedido.data_entrega and pedido.data_entrega > date.today():
            for item in itens_data:
                if item.get('produto_id'):
                    # Pega a ficha tecnica do produto
                    ficha = db.session.query(FichaTecnica).filter_by(produto_acabado_id=item['produto_id']).first()
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
                            
        if not auto_commit:
            return pedido, None

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

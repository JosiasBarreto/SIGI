from marshmallow import Schema, fields, validate, pre_load
from app.models.pedido import TipoPedido, OrigemPedido, EstadoPedido, FormaPagamento, EstadoPagamento
from app.models.item_pedido import TipoItem

class ClienteSchema(Schema):
    id = fields.Int(dump_only=True)
    nome = fields.Str(required=True, validate=validate.Length(min=2))
    empresa = fields.Str(required=False)
    nif = fields.Str(required=False)
    telefone = fields.Str(required=False)
    whatsapp = fields.Str(required=False)
    email = fields.Email(required=False)
    morada = fields.Str(required=False)
    observacoes = fields.Str(required=False)
    percentagem_desconto_padrao = fields.Decimal(required=False, allow_none=True)
    is_active = fields.Bool(dump_only=True)

class ItemPedidoSchema(Schema):
    id = fields.Int(dump_only=True)
    pedido_id = fields.Int(dump_only=True)
    tipo_item = fields.Enum(TipoItem, by_value=True, required=True)
    produto_id = fields.Int(required=False, allow_none=True)
    descricao = fields.Str(required=False, allow_none=True)
    quantidade = fields.Decimal(required=True)
    preco_unitario = fields.Decimal(required=True)
    subtotal = fields.Decimal(dump_only=True)

class PedidoSchema(Schema):
    id = fields.Int(dump_only=True)
    numero = fields.Str(dump_only=True)
    cliente_id = fields.Int(required=False, allow_none=True)
    evento_id = fields.Int(required=False, allow_none=True)
    tipo = fields.Enum(TipoPedido, by_value=True, required=True)
    origem = fields.Enum(OrigemPedido, by_value=True, required=True)
    data_pedido = fields.DateTime(dump_only=True)
    data_entrega = fields.Date(required=False, allow_none=True)
    hora_entrega = fields.Time(required=False, allow_none=True)
    estado = fields.Enum(EstadoPedido, by_value=True, required=False)
    observacoes = fields.Str(required=False)
    is_active = fields.Bool(dump_only=True)
    justificativa_cancelamento = fields.Str(required=False)
    
    cliente = fields.Nested(ClienteSchema, dump_only=True)
    
    valor_total = fields.Decimal(dump_only=True)
    valor_pago = fields.Decimal(required=False)
    saldo = fields.Decimal(dump_only=True)
    forma_pagamento = fields.Enum(FormaPagamento, by_value=True, required=False, allow_none=True)
    estado_pagamento = fields.Enum(EstadoPagamento, by_value=True, required=False)
    
    itens = fields.List(fields.Nested(ItemPedidoSchema), required=False)
    evento = fields.Raw(required=False, load_only=True)

    @pre_load
    def normalize_legacy_frontend_values(self, data, **kwargs):
        if not isinstance(data, dict):
            return data
        tipo_map = {'BALCAO': 'Simples', 'ENCOMENDA': 'Composto'}
        origem_map = {'LOCAL': 'Balcao', 'BALCAO': 'Balcao'}
        estado_map = {'PENDENTE': 'Pendente', 'AGENDADO': 'Agendado'}
        item_map = {'PRODUTO': 'Produto', 'SERVICO': 'Servico', 'MATERIAL': 'Material'}

        if data.get('tipo') in tipo_map:
            data['tipo'] = tipo_map[data['tipo']]
        if data.get('origem') in origem_map:
            data['origem'] = origem_map[data['origem']]
        if data.get('estado') in estado_map:
            data['estado'] = estado_map[data['estado']]

        for item in data.get('itens') or []:
            if item.get('tipo_item') in item_map:
                item['tipo_item'] = item_map[item['tipo_item']]
        return data

class AlterarEstadoPedidoSchema(Schema):
    estado = fields.Enum(EstadoPedido, by_value=True, required=True)
    justificativa_cancelamento = fields.Str(required=False)

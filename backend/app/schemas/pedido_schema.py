from marshmallow import Schema, fields, validate, pre_load, ValidationError
from app.models.pedido import TipoPedido, OrigemPedido, EstadoPedido, FormaPagamento, EstadoPagamento
from app.models.item_pedido import TipoItem

class ClienteSchema(Schema):
    id = fields.Int(dump_only=True)
    nome = fields.Str(required=True, validate=validate.Length(min=1))
    empresa = fields.Str(required=False, allow_none=True)
    nif = fields.Str(required=False, allow_none=True)
    telefone = fields.Str(required=False, allow_none=True)
    whatsapp = fields.Str(required=False, allow_none=True)
    email = fields.Email(required=False, allow_none=True)
    morada = fields.Str(required=False, allow_none=True)
    observacoes = fields.Str(required=False, allow_none=True)
    is_active = fields.Bool(dump_only=True)

    @pre_load
    def normalizar_campos_opcionais(self, data, **kwargs):
        data = dict(data or {})
        for name in ('nome', 'empresa', 'nif', 'telefone', 'whatsapp', 'email', 'morada', 'observacoes'):
            value = data.get(name)
            if isinstance(value, str):
                data[name] = value.strip() or None
        return data

class ItemPedidoSchema(Schema):
    id = fields.Int(dump_only=True)
    pedido_id = fields.Int(dump_only=True)
    tipo_item = fields.Str(required=False, allow_none=True, load_default='Produto')
    produto_id = fields.Int(required=False, allow_none=True)
    descricao = fields.Str(required=False, allow_none=True)
    quantidade = fields.Decimal(required=True)
    preco_unitario = fields.Decimal(required=True)
    subtotal = fields.Decimal(dump_only=True)
    desconto = fields.Decimal(required=False, allow_none=True, load_default=0)
    taxa_iva_id = fields.Int(dump_only=True)
    taxa_iva = fields.Decimal(dump_only=True)
    valor_iva = fields.Decimal(dump_only=True)
    total = fields.Decimal(dump_only=True)

class PedidoSchema(Schema):
    id = fields.Int(dump_only=True)
    numero = fields.Str(dump_only=True)
    cliente_id = fields.Int(required=False, allow_none=True)
    tipo = fields.Str(required=False, allow_none=True, load_default='Simples')
    origem = fields.Str(required=False, allow_none=True, load_default='Balcao')
    data_pedido = fields.DateTime(dump_only=True)
    data_entrega = fields.Date(required=False, allow_none=True)
    hora_entrega = fields.Time(required=False, allow_none=True)
    estado = fields.Str(required=False, allow_none=True, load_default='Pendente')
    observacoes = fields.Str(required=False)
    is_active = fields.Bool(dump_only=True)
    justificativa_cancelamento = fields.Str(required=False)
    
    cliente = fields.Nested(ClienteSchema, dump_only=True)
    
    subtotal = fields.Decimal(dump_only=True)
    desconto_total = fields.Decimal(dump_only=True)
    base_tributavel = fields.Decimal(dump_only=True)
    total_iva = fields.Decimal(dump_only=True)
    valor_total = fields.Decimal(dump_only=True)
    valor_pago = fields.Decimal(required=False)
    saldo = fields.Decimal(dump_only=True)
    forma_pagamento = fields.Str(required=False, allow_none=True)
    estado_pagamento = fields.Str(required=False, allow_none=True, load_default='Pendente')
    
    itens = fields.List(fields.Nested(ItemPedidoSchema), required=False)

    @pre_load
    def normalizar_enums(self, data, **kwargs):
        """Aceita grafias legadas (SIMPLES, BALCAO, etc.) e guarda um valor único."""
        data = dict(data or {})
        campos = {
            'tipo': TipoPedido,
            'origem': OrigemPedido,
            'estado': EstadoPedido,
            'forma_pagamento': FormaPagamento,
            'estado_pagamento': EstadoPagamento,
        }
        for campo, enum_cls in campos.items():
            valor = data.get(campo)
            if valor is None:
                continue
            texto = str(valor).strip()
            encontrado = next(
                (m.value for m in enum_cls
                 if texto.casefold() in (m.name.casefold(), str(m.value).casefold())),
                None,
            )
            if encontrado is None:
                raise ValidationError({campo: [f'Valor inválido: {valor}.']})
            data[campo] = encontrado
        return data

class AlterarEstadoPedidoSchema(Schema):
    estado = fields.Raw(required=True)
    justificativa_cancelamento = fields.Str(required=False)

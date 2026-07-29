from marshmallow import Schema, fields, validate
from app.models.ficha_tecnica import TipoFicha
from app.models.ordem_producao import SectorProducao, PrioridadeProducao, EstadoProducao
from app.models.reserva import EstadoReserva

class FichaTecnicaItemSchema(Schema):
    id = fields.Int(dump_only=True)
    ficha_tecnica_id = fields.Int(dump_only=True)
    ingrediente_id = fields.Int(required=True)
    quantidade = fields.Decimal(required=True)
    unidade = fields.Str(required=True)
    observacao = fields.Str(required=False, allow_none=True)

class FichaTecnicaSchema(Schema):
    id = fields.Int(dump_only=True)
    codigo = fields.Str(required=False)
    nome = fields.Str(required=True, validate=validate.Length(min=2))
    descricao = fields.Str(required=False)
    tipo = fields.Enum(TipoFicha, by_value=True, required=True)
    produto_acabado_id = fields.Int(required=True)
    tempo_producao_minutos = fields.Int(required=False, allow_none=True)
    rendimento = fields.Decimal(required=False, allow_none=True)
    ativo = fields.Bool(required=False)
    
    itens = fields.List(fields.Nested(FichaTecnicaItemSchema), required=False)

class ConsumoIngredienteSchema(Schema):
    id = fields.Int(dump_only=True)
    ingrediente_id = fields.Int(required=True)
    ingrediente_nome = fields.Method("get_ingrediente_nome")
    ingrediente_unidade = fields.Method("get_ingrediente_unidade")
    quantidade_prevista = fields.Decimal(required=True)
    quantidade_consumida = fields.Decimal(required=False, allow_none=True)
    data_consumo = fields.DateTime(dump_only=True)

    def get_ingrediente_nome(self, obj):
        return obj.ingrediente.nome if getattr(obj, 'ingrediente', None) else 'Ingrediente'

    def get_ingrediente_unidade(self, obj):
        ing = getattr(obj, 'ingrediente', None)
        if not ing: return ''
        if hasattr(ing, 'unidade_medida') and ing.unidade_medida:
            return ing.unidade_medida.sigla if hasattr(ing.unidade_medida, 'sigla') else str(ing.unidade_medida)
        return getattr(ing, 'unidade', '') or ''

class OrdemProducaoItemSchema(Schema):
    id = fields.Int(dump_only=True)
    produto_id = fields.Int(required=True)
    produto_nome = fields.Method("get_produto_nome")
    produto_codigo = fields.Method("get_produto_codigo")
    quantidade = fields.Decimal(required=True)
    observacoes = fields.Str(required=False, allow_none=True)

    def get_produto_nome(self, obj):
        return obj.produto.nome if getattr(obj, 'produto', None) else 'Produto'

    def get_produto_codigo(self, obj):
        return obj.produto.codigo if getattr(obj, 'produto', None) else ''

class OrdemProducaoSchema(Schema):
    id = fields.Int(dump_only=True)
    numero = fields.Str(dump_only=True)
    pedido_id = fields.Int(required=True)
    pedido_numero = fields.Method("get_pedido_numero")
    cliente_nome = fields.Method("get_cliente_nome")
    data_entrega = fields.Method("get_data_entrega")
    hora_entrega = fields.Method("get_hora_entrega")
    observacoes_pedido = fields.Method("get_observacoes_pedido")
    produto_id = fields.Int(required=False, allow_none=True) # backward compat
    quantidade = fields.Decimal(required=False, allow_none=True) # backward compat
    sector = fields.Enum(SectorProducao, by_value=True, required=True)
    data_producao = fields.Date(required=False, allow_none=True)
    hora_inicio = fields.DateTime(required=False, allow_none=True)
    hora_fim = fields.DateTime(required=False, allow_none=True)
    prioridade = fields.Enum(PrioridadeProducao, by_value=True, required=False)
    estado = fields.Enum(EstadoProducao, by_value=True, required=False)
    observacoes = fields.Str(required=False)
    created_at = fields.DateTime(dump_only=True)
    
    itens = fields.List(fields.Nested(OrdemProducaoItemSchema), required=False)
    consumos = fields.List(fields.Nested(ConsumoIngredienteSchema), dump_only=True)

    def get_pedido_numero(self, obj):
        return obj.pedido.numero if getattr(obj, 'pedido', None) else None

    def get_cliente_nome(self, obj):
        if getattr(obj, 'pedido', None) and getattr(obj.pedido, 'cliente', None):
            return obj.pedido.cliente.nome
        return 'Consumidor Final / Balcão'

    def get_data_entrega(self, obj):
        if getattr(obj, 'pedido', None) and getattr(obj.pedido, 'data_entrega', None):
            return str(obj.pedido.data_entrega)
        return None

    def get_hora_entrega(self, obj):
        if getattr(obj, 'pedido', None) and getattr(obj.pedido, 'hora_entrega', None):
            return str(obj.pedido.hora_entrega)
        return None

    def get_observacoes_pedido(self, obj):
        return obj.pedido.observacoes if getattr(obj, 'pedido', None) else None

class ReservaIngredienteSchema(Schema):
    id = fields.Int(dump_only=True)
    ingrediente_id = fields.Int(required=True)
    pedido_id = fields.Int(required=True)
    quantidade = fields.Decimal(required=True)
    data_reserva = fields.DateTime(dump_only=True)
    estado = fields.Enum(EstadoReserva, by_value=True, dump_only=True)

class AlterarEstadoOrdemSchema(Schema):
    estado = fields.Enum(EstadoProducao, by_value=True, required=True)

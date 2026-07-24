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
    quantidade_prevista = fields.Decimal(required=True)
    quantidade_consumida = fields.Decimal(required=False, allow_none=True)
    data_consumo = fields.DateTime(dump_only=True)

class OrdemProducaoItemSchema(Schema):
    id = fields.Int(dump_only=True)
    produto_id = fields.Int(required=True)
    quantidade = fields.Decimal(required=True)
    observacoes = fields.Str(required=False, allow_none=True)

class OrdemProducaoSchema(Schema):
    id = fields.Int(dump_only=True)
    numero = fields.Str(dump_only=True)
    pedido_id = fields.Int(required=True)
    produto_id = fields.Int(required=False, allow_none=True) # backward compat
    quantidade = fields.Decimal(required=False, allow_none=True) # backward compat
    sector = fields.Enum(SectorProducao, by_value=True, required=True)
    data_producao = fields.Date(required=False, allow_none=True)
    hora_inicio = fields.DateTime(required=False, allow_none=True)
    hora_fim = fields.DateTime(required=False, allow_none=True)
    prioridade = fields.Enum(PrioridadeProducao, by_value=True, required=False)
    estado = fields.Enum(EstadoProducao, by_value=True, required=False)
    observacoes = fields.Str(required=False)
    
    itens = fields.List(fields.Nested(OrdemProducaoItemSchema), required=False)
    consumos = fields.List(fields.Nested(ConsumoIngredienteSchema), dump_only=True)

class ReservaIngredienteSchema(Schema):
    id = fields.Int(dump_only=True)
    ingrediente_id = fields.Int(required=True)
    pedido_id = fields.Int(required=True)
    quantidade = fields.Decimal(required=True)
    data_reserva = fields.DateTime(dump_only=True)
    estado = fields.Enum(EstadoReserva, by_value=True, dump_only=True)

class AlterarEstadoOrdemSchema(Schema):
    estado = fields.Enum(EstadoProducao, by_value=True, required=True)

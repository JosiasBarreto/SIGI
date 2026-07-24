from marshmallow import Schema, fields, validate
from app.models.evento import TipoEvento, EstadoEvento, TipoServicoEvento, EstadoEspaco, EstadoReservaEspaco, FuncaoEquipa

class EspacoSchema(Schema):
    id = fields.Int(dump_only=True)
    nome = fields.Str(required=True)
    capacidade = fields.Int(required=True)
    descricao = fields.Str(required=False, allow_none=True)
    estado = fields.Enum(EstadoEspaco, by_value=True, required=False)

class EventoServicoSchema(Schema):
    tipo = fields.Enum(TipoServicoEvento, by_value=True, required=True)
    descricao = fields.Str(required=False, allow_none=True)
    quantidade = fields.Decimal(required=True)
    valor_unitario = fields.Decimal(required=True)
    subtotal = fields.Decimal(dump_only=True)

class ReservaEspacoSchema(Schema):
    espaco_id = fields.Int(required=True)
    data_inicio = fields.DateTime(required=True)
    data_fim = fields.DateTime(required=True)
    estado = fields.Str(dump_only=True)

class ReservaMaterialSchema(Schema):
    material_id = fields.Int(required=True)
    quantidade = fields.Decimal(required=True)
    data_inicio = fields.DateTime(required=True)
    data_fim = fields.DateTime(required=True)
    estado = fields.Str(dump_only=True)

class EventoEquipaSchema(Schema):
    utilizador_id = fields.Int(required=True)
    funcao = fields.Enum(FuncaoEquipa, by_value=True, required=True)
    estado = fields.Str(dump_only=True)

class EventoSchema(Schema):
    id = fields.Int(dump_only=True)
    numero = fields.Str(dump_only=True)
    cliente_id = fields.Int(required=True)
    pedido_id = fields.Int(required=False, allow_none=True)
    tipo_evento = fields.Enum(TipoEvento, by_value=True, required=True)
    titulo = fields.Str(required=True)
    descricao = fields.Str(required=False, allow_none=True)
    local_evento = fields.Str(required=False, allow_none=True)
    
    data_evento = fields.Date(required=True)
    hora_inicio = fields.Time(required=True)
    hora_fim = fields.Time(required=True)
    numero_convidados = fields.Int(required=True)
    estado = fields.Enum(EstadoEvento, by_value=True, dump_only=True)
    observacoes = fields.Str(required=False, allow_none=True)
    
    valor_total = fields.Decimal(dump_only=True)
    valor_pago = fields.Decimal(required=False)
    saldo = fields.Decimal(dump_only=True)

    servicos = fields.List(fields.Nested(EventoServicoSchema), required=False)
    reservas_espaco = fields.List(fields.Nested(ReservaEspacoSchema), required=False)
    reservas_material = fields.List(fields.Nested(ReservaMaterialSchema), required=False)
    equipas = fields.List(fields.Nested(EventoEquipaSchema), required=False)

class AlterarEstadoEventoSchema(Schema):
    estado = fields.Enum(EstadoEvento, by_value=True, required=True)

from marshmallow import Schema, fields, validate
from app.models.logistica import EstadoMotorista, EstadoViatura, EstadoEntrega, TipoOcorrenciaLogistica

class MotoristaSchema(Schema):
    id = fields.Int(dump_only=True)
    nome = fields.Str(required=True)
    telefone = fields.Str(required=False, allow_none=True)
    carta_conducao = fields.Str(required=False, allow_none=True)
    validade_carta = fields.Date(required=False, allow_none=True)
    estado = fields.Enum(EstadoMotorista, by_value=True, required=False)

class ViaturaSchema(Schema):
    id = fields.Int(dump_only=True)
    matricula = fields.Str(required=True)
    marca = fields.Str(required=False, allow_none=True)
    modelo = fields.Str(required=False, allow_none=True)
    ano = fields.Int(required=False, allow_none=True)
    capacidade = fields.Decimal(required=False, allow_none=True)
    quilometragem = fields.Decimal(required=False, allow_none=True)
    estado = fields.Enum(EstadoViatura, by_value=True, required=False)

class ChecklistEntregaSchema(Schema):
    tipo = fields.Str(validate=validate.OneOf(['SAIDA', 'RETORNO']), required=True) # SAIDA, RETORNO
    item = fields.Str(required=True)
    validado = fields.Bool(required=False)
    observacao = fields.Str(required=False, allow_none=True)

class EntregaSchema(Schema):
    id = fields.Int(dump_only=True)
    numero = fields.Str(dump_only=True)
    pedido_id = fields.Int(required=False, allow_none=True)
    evento_id = fields.Int(required=False, allow_none=True)
    motorista_id = fields.Int(required=True)
    viatura_id = fields.Int(required=True)
    
    data_saida = fields.Date(required=False, allow_none=True)
    hora_saida = fields.Time(required=False, allow_none=True)
    data_entrega = fields.Date(required=False, allow_none=True)
    hora_entrega = fields.Time(required=False, allow_none=True)
    estado = fields.Enum(EstadoEntrega, by_value=True, required=False)
    
    checklists = fields.List(fields.Nested(ChecklistEntregaSchema), required=False)

class AlterarEstadoEntregaSchema(Schema):
    estado = fields.Enum(EstadoEntrega, by_value=True, required=True)

class OcorrenciaLogisticaSchema(Schema):
    id = fields.Int(dump_only=True)
    entrega_id = fields.Int(required=True)
    tipo = fields.Enum(TipoOcorrenciaLogistica, by_value=True, required=True)
    justificacao = fields.Str(required=True)
    data_ocorrencia = fields.DateTime(dump_only=True)

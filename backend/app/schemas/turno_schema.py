from marshmallow import Schema, fields

class TurnoSchema(Schema):
    id = fields.Int(dump_only=True)
    nome = fields.Str(required=True)
    hora_inicio = fields.Time(required=False, allow_none=True)
    hora_fim = fields.Time(required=False, allow_none=True)
    ativo = fields.Bool(dump_only=True)

from enum import Enum
from marshmallow import Schema, fields, validate

class TipoProduto(str, Enum):
    ACABADO = 'Acabado'
    REVENDA = 'Revenda'

class Produto:
    def __init__(self, tipo):
        self.tipo = tipo

# Old Schema
class OldSchema(Schema):
    tipo = fields.Str(validate=validate.OneOf([e.value for e in TipoProduto]))

# New Schema
class NewSchema(Schema):
    tipo = fields.Enum(TipoProduto, by_value=True)

class EnumStrSchema(Schema):
    tipo = fields.Function(lambda obj: obj.tipo.value if hasattr(obj.tipo, 'value') else obj.tipo)

p = Produto(tipo=TipoProduto.ACABADO)
print("Old Schema:", OldSchema().dump(p))
print("New Schema:", NewSchema().dump(p))
print("EnumStr Schema:", EnumStrSchema().dump(p))

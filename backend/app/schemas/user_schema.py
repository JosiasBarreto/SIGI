from marshmallow import Schema, fields, validate
from app.models.user import RoleEnum

class UserSchema(Schema):
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    role = fields.Enum(RoleEnum, by_value=True, required=False)
    is_active = fields.Bool(dump_only=True)
    
class CreateUserSchema(UserSchema):
    password = fields.Str(required=True, validate=validate.Length(min=6))

class UpdateUserSchema(Schema):
    name = fields.Str(required=False, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=False)
    role = fields.Enum(RoleEnum, by_value=True, required=False)
    password = fields.Str(required=False, validate=validate.Length(min=6))

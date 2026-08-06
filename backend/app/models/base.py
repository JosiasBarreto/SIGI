from datetime import datetime
from app.core.database import db

def enum_values(enum_cls):
    if not enum_cls:
        return []
    return [e.value for e in enum_cls]

class BaseModel(db.Model):
    __abstract__ = True

    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    created_by = db.Column(db.Integer, nullable=True) # ID do user
    updated_by = db.Column(db.Integer, nullable=True)
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    deleted_at = db.Column(db.DateTime, nullable=True)

    def soft_delete(self):
        self.is_active = False
        self.deleted_at = datetime.utcnow()
        db.session.commit()


from sqlalchemy.types import TypeDecorator, String

class FlexibleEnum(TypeDecorator):
    impl = String
    cache_ok = True

    def __init__(self, enum_cls, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.enum_cls = enum_cls
        self._name_to_value = {e.name.upper(): e.value for e in enum_cls}
        self._value_to_name = {str(e.value).lower(): e.name for e in enum_cls}

    def process_bind_param(self, value, dialect):
        if value is None: return None
        if isinstance(value, self.enum_cls): return value.value
        # Sempre enviar como value e deixar o BD aceitar (MySQL é case insensitive)
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None: return None
        # O BD pode retornar 'SIMPLES' ou 'Simples', a gente converte sempre pro .value correto
        v_upper = str(value).upper()
        if v_upper in self._name_to_value:
            return self._name_to_value[v_upper]
        return value

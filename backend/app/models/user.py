from enum import Enum
from app.core.database import db
from app.models.base import BaseModel

class RoleEnum(str, Enum):
    ADMINISTRADOR = 'Administrador'
    ATENDIMENTO = 'Atendimento'
    COZINHA = 'Cozinha'
    PASTELARIA = 'Pastelaria'
    ARMAZEM = 'Armazém'
    MOTORISTA = 'Motorista'
    CONTROLADOR_MATERIAIS = 'Controlador de Materiais'
    FINANCEIRO = 'Financeiro'

class User(BaseModel):
    __tablename__ = 'users'

    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(RoleEnum), nullable=False, default=RoleEnum.ATENDIMENTO)
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"

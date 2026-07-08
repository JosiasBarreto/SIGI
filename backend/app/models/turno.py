from app.core.database import db
from app.models.base import BaseModel
from datetime import datetime

class Turno(BaseModel):
    __tablename__ = 'turnos'

    nome = db.Column(db.String(50), unique=True, nullable=False) # e.g., 'Manhã', 'Tarde', 'Noite'
    hora_inicio = db.Column(db.Time, nullable=True) # Start time
    hora_fim = db.Column(db.Time, nullable=True) # End time
    ativo = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f"<Turno {self.nome}>"

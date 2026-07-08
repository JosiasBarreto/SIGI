from app.core.database import db
from app.models.base import BaseModel

class UnidadeMedida(BaseModel):
    __tablename__ = 'unidades_medida'

    nome = db.Column(db.String(50), nullable=False)
    sigla = db.Column(db.String(10), nullable=False, unique=True)
    descricao = db.Column(db.Text, nullable=True)

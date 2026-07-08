from app.core.database import db
from app.models.base import BaseModel

class CategoriaProduto(BaseModel):
    __tablename__ = 'categorias_produto'

    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=True)

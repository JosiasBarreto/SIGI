from app.core.database import db
from app.models.base import BaseModel

class Fornecedor(BaseModel):
    __tablename__ = 'fornecedores'

    codigo = db.Column(db.String(50), unique=True, nullable=True)
    nome = db.Column(db.String(100), nullable=False)
    nif = db.Column(db.String(20), unique=True, nullable=True)
    email = db.Column(db.String(100), nullable=True)
    telefone = db.Column(db.String(20), nullable=True)
    morada = db.Column(db.Text, nullable=True)
    contacto_principal = db.Column(db.String(100), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    
    ingredientes = db.relationship('Ingrediente', backref='fornecedor', lazy=True)

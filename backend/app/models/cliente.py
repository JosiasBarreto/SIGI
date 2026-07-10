from app.core.database import db
from app.models.base import BaseModel

class Cliente(BaseModel):
    __tablename__ = 'clientes'

    nome = db.Column(db.String(100), nullable=False)
    empresa = db.Column(db.String(100), nullable=True)
    nif = db.Column(db.String(20), unique=True, nullable=True)
    telefone = db.Column(db.String(20), nullable=True)
    whatsapp = db.Column(db.String(20), nullable=True)
    email = db.Column(db.String(100), nullable=True)
    morada = db.Column(db.Text, nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    percentagem_desconto_padrao = db.Column(db.Numeric(5, 2), default=0)
    
    pedidos = db.relationship('Pedido', backref='cliente', lazy=True)

from enum import Enum
from app.core.database import db
from app.models.base import BaseModel
from datetime import datetime

class Producao(BaseModel):
    __tablename__ = 'producoes'

    numero = db.Column(db.String(50), unique=True, nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False)
    quantidade_produzida = db.Column(db.Numeric(10, 2), nullable=False)
    
    responsavel_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    turno = db.Column(db.String(50), nullable=True) # Manhã, Tarde, Noite
    data_producao = db.Column(db.DateTime, default=datetime.utcnow)
    
    estado = db.Column(db.String(50), default='Concluída')
    observacoes = db.Column(db.Text, nullable=True)

    produto = db.relationship('Produto')
    responsavel = db.relationship('User')
    itens = db.relationship('ProducaoItem', backref='producao', cascade="all, delete-orphan", lazy='selectin')
    desvios = db.relationship('ProducaoDesvio', backref='producao', cascade="all, delete-orphan", lazy='selectin')

class ProducaoItem(db.Model):
    __tablename__ = 'producao_itens'

    id = db.Column(db.Integer, primary_key=True)
    producao_id = db.Column(db.Integer, db.ForeignKey('producoes.id'), nullable=False)
    produto_consumivel_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False)
    
    quantidade_prevista = db.Column(db.Numeric(10, 3), nullable=False)
    quantidade_real = db.Column(db.Numeric(10, 3), nullable=False)
    
    consumivel = db.relationship('Produto', foreign_keys=[produto_consumivel_id])

class ProducaoDesvio(BaseModel):
    __tablename__ = 'producao_desvios'

    producao_id = db.Column(db.Integer, db.ForeignKey('producoes.id'), nullable=False)
    produto_consumivel_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False)
    
    quantidade_prevista = db.Column(db.Numeric(10, 3), nullable=False)
    quantidade_real = db.Column(db.Numeric(10, 3), nullable=False)
    diferenca = db.Column(db.Numeric(10, 3), nullable=False)
    
    justificativa = db.Column(db.Text, nullable=False)
    utilizador_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    data = db.Column(db.DateTime, default=datetime.utcnow)
    
    consumivel = db.relationship('Produto', foreign_keys=[produto_consumivel_id])

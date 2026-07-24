from enum import Enum
from app.core.database import db
from app.models.base import BaseModel
from datetime import datetime

class SectorProducao(str, Enum):
    COZINHA = 'Cozinha'
    PASTELARIA = 'Pastelaria'

class TurnoProducao(str, Enum):
    MANHA = 'Manhã'
    TARDE = 'Tarde'
    NOITE = 'Noite'

class PrioridadeProducao(str, Enum):
    BAIXA = 'Baixa'
    MEDIA = 'Media'
    ALTA = 'Alta'
    URGENTE = 'Urgente'

class EstadoProducao(str, Enum):
    PENDENTE = 'Pendente'
    EM_PRODUCAO = 'Em Producao'
    PRONTO = 'Pronto'
    ENTREGUE = 'Entregue'
    CANCELADO = 'Cancelado'

class OrdemProducao(BaseModel):
    __tablename__ = 'ordens_producao'
    numero = db.Column(db.String(50), unique=True, nullable=False)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=True) # Keeping for backward compat
    quantidade = db.Column(db.Numeric(10, 2), nullable=True) # Keeping for backward compat
    sector = db.Column(db.Enum(SectorProducao), nullable=False)
    turno = db.Column(db.Enum(TurnoProducao), nullable=True)
    
    data_producao = db.Column(db.Date, nullable=True)
    hora_inicio = db.Column(db.DateTime, nullable=True)
    hora_fim = db.Column(db.DateTime, nullable=True)
    
    prioridade = db.Column(db.Enum(PrioridadeProducao), default=PrioridadeProducao.MEDIA)
    estado = db.Column(db.Enum(EstadoProducao), default=EstadoProducao.PENDENTE)
    observacoes = db.Column(db.Text, nullable=True)

    pedido = db.relationship('Pedido', backref='ordens_producao')
    consumos = db.relationship('ConsumoIngrediente', backref='ordem', cascade="all, delete-orphan", lazy='selectin')
    itens = db.relationship('OrdemProducaoItem', backref='ordem', cascade="all, delete-orphan", lazy='selectin')

class OrdemProducaoItem(db.Model):
    __tablename__ = 'ordem_producao_itens'
    id = db.Column(db.Integer, primary_key=True)
    ordem_producao_id = db.Column(db.Integer, db.ForeignKey('ordens_producao.id'), nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False)
    quantidade = db.Column(db.Numeric(10, 2), nullable=False)
    observacoes = db.Column(db.Text, nullable=True)
    produto = db.relationship('Produto')

class ConsumoIngrediente(db.Model):
    __tablename__ = 'consumos_ingredientes'

    id = db.Column(db.Integer, primary_key=True)
    ordem_producao_id = db.Column(db.Integer, db.ForeignKey('ordens_producao.id'), nullable=False)
    ingrediente_id = db.Column(db.Integer, db.ForeignKey('ingredientes.id'), nullable=False)
    quantidade_prevista = db.Column(db.Numeric(10, 3), nullable=False)
    quantidade_consumida = db.Column(db.Numeric(10, 3), nullable=True)
    data_consumo = db.Column(db.DateTime, nullable=True)

    ingrediente = db.relationship('Ingrediente')

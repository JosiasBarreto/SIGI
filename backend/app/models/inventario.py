from enum import Enum
from app.core.database import db
from app.models.base import BaseModel
from datetime import datetime

class TipoInventario(str, Enum):
    GERAL = 'Geral'
    PARCIAL = 'Parcial'

class EstadoInventario(str, Enum):
    RASCUNHO = 'Rascunho'
    CONCLUIDO = 'Concluido'
    CANCELADO = 'Cancelado'

class Inventario(BaseModel):
    __tablename__ = 'inventarios'
    numero = db.Column(db.String(50), unique=True, nullable=False)
    tipo = db.Column(db.Enum(TipoInventario), nullable=False)
    estado = db.Column(db.Enum(EstadoInventario), default=EstadoInventario.RASCUNHO)
    data_inicio = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_fim = db.Column(db.DateTime, nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    utilizador_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    items = db.relationship('InventarioItem', backref='inventario', lazy=True, cascade="all, delete-orphan")

class TipoItemInventario(str, Enum):
    INGREDIENTE = 'Ingrediente'
    MATERIAL = 'Material'
    PRODUTO = 'Produto'

class InventarioItem(db.Model):
    __tablename__ = 'inventario_items'
    id = db.Column(db.Integer, primary_key=True)
    inventario_id = db.Column(db.Integer, db.ForeignKey('inventarios.id'), nullable=False)
    tipo_item = db.Column(db.Enum(TipoItemInventario), nullable=False)
    referencia_id = db.Column(db.Integer, nullable=False) 
    quantidade_sistema = db.Column(db.Numeric(12, 2), nullable=False)
    quantidade_contada = db.Column(db.Numeric(12, 2), nullable=False)
    diferenca = db.Column(db.Numeric(12, 2), nullable=False)
    justificativa = db.Column(db.String(255), nullable=True)

class InventarioContagem(BaseModel):
    __tablename__ = 'inventarios_contagem'

    data_contagem = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    responsavel_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    estado = db.Column(db.Enum(EstadoInventario), default=EstadoInventario.RASCUNHO)
    observacoes = db.Column(db.Text, nullable=True)

    responsavel = db.relationship('User')
    itens = db.relationship('InventarioContagemItem', backref='inventario_contagem_rel', cascade="all, delete-orphan", lazy=True)

class InventarioContagemItem(db.Model):
    __tablename__ = 'inventario_contagem_itens'

    id = db.Column(db.Integer, primary_key=True)
    inventario_id = db.Column(db.Integer, db.ForeignKey('inventarios_contagem.id'), nullable=False)
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False)
    
    stock_sistema = db.Column(db.Numeric(10, 3), nullable=False)
    stock_real = db.Column(db.Numeric(10, 3), nullable=False)
    diferenca = db.Column(db.Numeric(10, 3), nullable=False)
    
    justificativa = db.Column(db.Text, nullable=True)

    produto = db.relationship('Produto')


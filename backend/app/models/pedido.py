from enum import Enum
from app.core.database import db
from app.models.base import BaseModel
from datetime import datetime

class TipoPedido(str, Enum):
    SIMPLES = 'Simples'
    COMPOSTO = 'Composto'

class OrigemPedido(str, Enum):
    BALCAO = 'Balcao'
    WHATSAPP = 'Whatsapp'
    TELEFONE = 'Telefone'
    EMAIL = 'Email'

class EstadoPedido(str, Enum):
    AGENDADO = 'Agendado'
    CONFIRMADO = 'Confirmado'
    EM_PRODUCAO = 'Em Producao'
    PRONTO = 'Pronto'
    ENTREGUE = 'Entregue'
    CONCLUIDO = 'Concluido'
    CANCELADO = 'Cancelado'

class FormaPagamento(str, Enum):
    DINHEIRO = 'Dinheiro'
    TRANSFERENCIA = 'Transferencia'
    POS = 'POS'
    MIXTO = 'Mixto'

class EstadoPagamento(str, Enum):
    PENDENTE = 'Pendente'
    PARCIAL = 'Parcial'
    PAGO = 'Pago'

class Pedido(BaseModel):
    __tablename__ = 'pedidos'

    numero = db.Column(db.String(50), unique=True, nullable=False)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=True)
    tipo = db.Column(db.Enum(TipoPedido), nullable=False)
    origem = db.Column(db.Enum(OrigemPedido), nullable=False)
    
    data_pedido = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_entrega = db.Column(db.Date, nullable=True)
    hora_entrega = db.Column(db.Time, nullable=True)
    
    estado = db.Column(db.Enum(EstadoPedido), default=EstadoPedido.AGENDADO)
    observacoes = db.Column(db.Text, nullable=True)
    justificativa_cancelamento = db.Column(db.Text, nullable=True)
    
    # Pagamentos
    valor_total = db.Column(db.Numeric(10, 2), default=0)
    valor_pago = db.Column(db.Numeric(10, 2), default=0)
    saldo = db.Column(db.Numeric(10, 2), default=0)
    forma_pagamento = db.Column(db.Enum(FormaPagamento), nullable=True)
    estado_pagamento = db.Column(db.Enum(EstadoPagamento), default=EstadoPagamento.PENDENTE)
    
    itens = db.relationship('ItemPedido', backref='pedido', lazy='selectin', cascade="all, delete-orphan")

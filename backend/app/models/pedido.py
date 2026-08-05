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
    PENDENTE = 'Pendente'
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
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=True)
    tipo = db.Column(db.Enum(TipoPedido, values_callable=lambda x: [e.value for e in x]), nullable=False)
    origem = db.Column(db.Enum(OrigemPedido, values_callable=lambda x: [e.value for e in x]), nullable=False)
    
    data_pedido = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_entrega = db.Column(db.Date, nullable=True)
    hora_entrega = db.Column(db.Time, nullable=True)
    
    estado = db.Column(db.Enum(EstadoPedido, values_callable=lambda x: [e.value for e in x]), default=EstadoPedido.PENDENTE)
    observacoes = db.Column(db.Text, nullable=True)
    justificativa_cancelamento = db.Column(db.Text, nullable=True)
    
    # Pagamentos
    valor_total = db.Column(db.Numeric(10, 2), default=0)
    valor_pago = db.Column(db.Numeric(10, 2), default=0)
    saldo = db.Column(db.Numeric(10, 2), default=0)
    forma_pagamento = db.Column(db.Enum(FormaPagamento, values_callable=lambda x: [e.value for e in x]), nullable=True)
    estado_pagamento = db.Column(db.Enum(EstadoPagamento, values_callable=lambda x: [e.value for e in x]), default=EstadoPagamento.PENDENTE)
    
    itens = db.relationship('ItemPedido', backref='pedido', lazy='selectin', cascade="all, delete-orphan")
    evento = db.relationship('Evento', foreign_keys=[evento_id], post_update=True, lazy='selectin')

    @property
    def subtotal(self):
        if self.itens:
            return sum(float(i.subtotal or 0) for i in self.itens)
        return float(self.valor_total or 0)

    @property
    def desconto_total(self):
        if self.itens:
            return sum(float(i.desconto or 0) for i in self.itens)
        return 0.0

    @property
    def base_tributavel(self):
        if self.itens:
            return sum(float(i.subtotal or 0) for i in self.itens)
        return float(self.valor_total or 0)

    @property
    def total_iva(self):
        if self.itens:
            return sum(float(getattr(i, 'valor_iva', 0) or 0) for i in self.itens)
        return 0.0



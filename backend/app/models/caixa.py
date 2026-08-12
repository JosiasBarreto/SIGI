from enum import Enum
from app.core.database import db
from app.models.base import BaseModel
from datetime import datetime

class EstadoCaixa(str, Enum):
    ABERTO = 'Aberto'
    FECHADO = 'Fechado'

class TipoMovimentoCaixa(str, Enum):
    ABERTURA = 'Abertura'
    VENDA = 'Venda'
    RECEBIMENTO = 'Recebimento'
    REFORCO = 'Reforco'
    SANGRIA = 'Sangria'
    DEVOLUCAO = 'Devolucao'
    AJUSTE = 'Ajuste'

class Caixa(BaseModel):
    __tablename__ = 'caixas'

    numero = db.Column(db.String(50), unique=True, nullable=False)
    data_abertura = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_fecho = db.Column(db.DateTime, nullable=True)
    valor_inicial = db.Column(db.Numeric(12, 2), default=0)
    valor_final = db.Column(db.Numeric(12, 2), default=0)
    utilizador_abertura_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    utilizador_fecho_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    estado = db.Column(db.Enum(EstadoCaixa), default=EstadoCaixa.ABERTO)
    
    # Detailed closing fields
    valor_declarado_dinheiro = db.Column(db.Numeric(12, 2), nullable=True)
    valor_declarado_transferencia = db.Column(db.Numeric(12, 2), nullable=True)
    valor_declarado_pos = db.Column(db.Numeric(12, 2), nullable=True)
    valor_esperado_dinheiro = db.Column(db.Numeric(12, 2), nullable=True)
    valor_esperado_transferencia = db.Column(db.Numeric(12, 2), nullable=True)
    valor_esperado_pos = db.Column(db.Numeric(12, 2), nullable=True)
    diferenca_dinheiro = db.Column(db.Numeric(12, 2), nullable=True)
    diferenca_transferencia = db.Column(db.Numeric(12, 2), nullable=True)
    diferenca_pos = db.Column(db.Numeric(12, 2), nullable=True)
    explicacao_divergencia = db.Column(db.Text, nullable=True)

    movimentos = db.relationship('MovimentoCaixa', backref='caixa', lazy=True)

class MovimentoCaixa(db.Model):
    __tablename__ = 'movimentos_caixa'

    id = db.Column(db.Integer, primary_key=True)
    caixa_id = db.Column(db.Integer, db.ForeignKey('caixas.id'), nullable=False)
    tipo = db.Column(db.Enum(TipoMovimentoCaixa), nullable=False)
    valor = db.Column(db.Numeric(12, 2), nullable=False)
    descricao = db.Column(db.String(255), nullable=True)
    data_movimento = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    utilizador_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    codigo_transferencia = db.Column(db.String(100), nullable=True)
    emissor = db.Column(db.String(100), nullable=True)
    forma_pagamento = db.Column(db.String(100), nullable=True)

from enum import Enum
from app.core.database import db
from app.models.base import BaseModel

class TipoMovimentoStock(str, Enum):
    ENTRADA = 'Entrada'
    SAIDA = 'Saida'
    COMPRA = 'Compra'
    VENDA = 'Venda'
    REQUISICAO = 'Requisição'
    PRODUCAO = 'Produção'
    AJUSTE = 'Ajuste'
    INVENTARIO = 'Inventário'
    PERDA = 'Perda'
    QUEBRA = 'Quebra'
    TRANSFERENCIA = 'Transferência'

class StockMovement(BaseModel):
    __tablename__ = 'movimentos_stock'

    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False)
    tipo_movimento = db.Column(db.Enum(TipoMovimentoStock), nullable=False)
    quantidade = db.Column(db.Numeric(10, 3), nullable=False)
    
    stock_anterior = db.Column(db.Numeric(10, 3), nullable=False)
    stock_atual = db.Column(db.Numeric(10, 3), nullable=False) # renamed from posterior
    
    motivo = db.Column(db.String(255), nullable=True)
    numero_fatura = db.Column(db.String(100), nullable=True)
    fornecedor_id = db.Column(db.Integer, db.ForeignKey('fornecedores.id'), nullable=True)
    
    referencia = db.Column(db.String(100), nullable=True) # Ex: Requisicao #145
    utilizador_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    observacao = db.Column(db.Text, nullable=True)

    produto = db.relationship('Produto')
    utilizador = db.relationship('User')
    fornecedor = db.relationship('Fornecedor')

from enum import Enum
from app.core.database import db
from app.models.base import BaseModel

class TipoItem(str, Enum):
    PRODUTO = 'Produto'
    PRODUTO_ACABADO = 'Produto Acabado'
    PRODUTO_REVENDA = 'Produto Revenda'
    SERVICO = 'Servico'
    ALUGUER = 'Aluguer'
    MATERIAL = 'Material'

class ItemPedido(BaseModel):
    __tablename__ = 'itens_pedido'

    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=False)
    tipo_item = db.Column(db.Enum(TipoItem), nullable=False)
    
    # Can be null if it's purely a service or aluguer without a matching product record
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=True)
    
    # Used if it's a custom service/aluguer
    descricao = db.Column(db.String(255), nullable=True)
    
    quantidade = db.Column(db.Numeric(10, 2), nullable=False)
    preco_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)

    produto = db.relationship('Produto', lazy='joined')

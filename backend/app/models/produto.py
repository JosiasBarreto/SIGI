from enum import Enum
from app.core.database import db
from app.models.base import BaseModel

class TipoProduto(str, Enum):
    ACABADO = 'Acabado'
    REVENDA = 'Revenda'
    CONSUMIVEL = 'Consumivel'

class Produto(BaseModel):
    __tablename__ = 'produtos'

    codigo = db.Column(db.String(50), unique=True, nullable=True)
    nome = db.Column(db.String(100), nullable=False)
    tipo = db.Column(db.Enum(TipoProduto), nullable=False)
    categoria = db.Column(db.String(100), nullable=True)
    categoria_id = db.Column(db.Integer, db.ForeignKey('categorias_produto.id'), nullable=True)
    unidade_medida_id = db.Column(db.Integer, db.ForeignKey('unidades_medida.id'), nullable=True)
    tempo_producao = db.Column(db.Integer, nullable=True) # in minutes
    preco_venda = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    preco_compra = db.Column(db.Numeric(10, 2), nullable=True, default=0)
    descricao = db.Column(db.Text, nullable=True)
    stock_atual = db.Column(db.Numeric(10, 3), default=0)
    stock_minimo = db.Column(db.Numeric(10, 3), default=0)
    taxa_iva_id = db.Column(db.Integer, db.ForeignKey('taxas_iva.id'), nullable=True)
    ativo = db.Column(db.Boolean, default=True)
    data_validade = db.Column(db.Date, nullable=True)
    
    categoria_rel = db.relationship('CategoriaProduto', backref='produtos')
    unidade_medida = db.relationship('UnidadeMedida', backref='produtos')
    taxa_iva = db.relationship('TaxaIVA', backref='produtos')
    stocks_armazem = db.relationship(
        'ProdutoStockArmazem',
        back_populates='produto',
        cascade='all, delete-orphan',
        lazy=True
    )

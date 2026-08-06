from app.core.database import db
from app.models.base import BaseModel

class Ingrediente(BaseModel):
    __tablename__ = 'ingredientes'

    codigo = db.Column(db.String(50), unique=True, nullable=True)
    nome = db.Column(db.String(100), nullable=False)
    categoria = db.Column(db.String(100), nullable=True)
    unidade_medida = db.Column(db.String(20), nullable=False)
    stock_atual = db.Column(db.Numeric(10, 3), default=0)
    stock_minimo = db.Column(db.Numeric(10, 3), default=0)
    stock_maximo = db.Column(db.Numeric(10, 3), default=0)
    validade = db.Column(db.Date, nullable=True)
    preco_compra = db.Column(db.Numeric(10, 2), default=0)
    observacoes = db.Column(db.Text, nullable=True)

    fornecedor_id = db.Column(db.Integer, db.ForeignKey('fornecedores.id'), nullable=True)

    stocks_armazem = db.relationship(
        'IngredienteStockArmazem',
        back_populates='ingrediente',
        cascade='all, delete-orphan',
        lazy=True
    )


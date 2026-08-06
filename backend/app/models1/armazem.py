from app.core.database import db
from app.models.base import BaseModel

class Armazem(BaseModel):
    __tablename__ = 'armazens'

    codigo = db.Column(db.String(50), unique=True, nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    localizacao = db.Column(db.String(255), nullable=True)
    descricao = db.Column(db.Text, nullable=True)
    principal = db.Column(db.Boolean, default=False, nullable=False)

    produtos_stock = db.relationship(
        'ProdutoStockArmazem',
        back_populates='armazem',
        cascade='all, delete-orphan',
        lazy=True
    )

    ingredientes_stock = db.relationship(
        'IngredienteStockArmazem',
        back_populates='armazem',
        cascade='all, delete-orphan',
        lazy=True
    )

    materiais_stock = db.relationship(
        'MaterialStockArmazem',
        back_populates='armazem',
        cascade='all, delete-orphan',
        lazy=True
    )


class ProdutoStockArmazem(BaseModel):
    __tablename__ = 'produto_stock_armazem'

    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False)
    armazem_id = db.Column(db.Integer, db.ForeignKey('armazens.id'), nullable=False)
    stock_atual = db.Column(db.Numeric(10, 3), default=0, nullable=False)
    stock_minimo = db.Column(db.Numeric(10, 3), default=0, nullable=False)

    produto = db.relationship('Produto', back_populates='stocks_armazem')
    armazem = db.relationship('Armazem', back_populates='produtos_stock')

    __table_args__ = (
        db.UniqueConstraint('produto_id', 'armazem_id', name='uq_produto_armazem_stock'),
    )


class IngredienteStockArmazem(BaseModel):
    __tablename__ = 'ingrediente_stock_armazem'

    ingrediente_id = db.Column(db.Integer, db.ForeignKey('ingredientes.id'), nullable=False)
    armazem_id = db.Column(db.Integer, db.ForeignKey('armazens.id'), nullable=False)
    stock_atual = db.Column(db.Numeric(10, 3), default=0, nullable=False)
    stock_minimo = db.Column(db.Numeric(10, 3), default=0, nullable=False)

    ingrediente = db.relationship('Ingrediente', back_populates='stocks_armazem')
    armazem = db.relationship('Armazem', back_populates='ingredientes_stock')

    __table_args__ = (
        db.UniqueConstraint('ingrediente_id', 'armazem_id', name='uq_ingrediente_armazem_stock'),
    )


class MaterialStockArmazem(BaseModel):
    __tablename__ = 'material_stock_armazem'

    material_id = db.Column(db.Integer, db.ForeignKey('materiais.id'), nullable=False)
    armazem_id = db.Column(db.Integer, db.ForeignKey('armazens.id'), nullable=False)
    stock_atual = db.Column(db.Numeric(10, 3), default=0, nullable=False)
    stock_minimo = db.Column(db.Numeric(10, 3), default=0, nullable=False)

    material = db.relationship('Material', back_populates='stocks_armazem')
    armazem = db.relationship('Armazem', back_populates='materiais_stock')

    __table_args__ = (
        db.UniqueConstraint('material_id', 'armazem_id', name='uq_material_armazem_stock'),
    )

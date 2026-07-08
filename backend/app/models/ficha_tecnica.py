from enum import Enum
from app.core.database import db
from app.models.base import BaseModel

class TipoFicha(str, Enum):
    COZINHA = 'Cozinha'
    PASTELARIA = 'Pastelaria'

class FichaTecnica(BaseModel):
    __tablename__ = 'fichas_tecnicas'

    codigo = db.Column(db.String(50), unique=True, nullable=True)
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    tipo = db.Column(db.Enum(TipoFicha), nullable=False)
    produto_acabado_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False)
    tempo_producao_minutos = db.Column(db.Integer, nullable=True)
    rendimento = db.Column(db.Numeric(10, 2), nullable=True)
    ativo = db.Column(db.Boolean, default=True)

    itens = db.relationship('FichaTecnicaItem', backref='ficha_tecnica', cascade="all, delete-orphan", lazy=True)
    produto = db.relationship('Produto', backref='fichas_tecnicas')

class FichaTecnicaItem(db.Model):
    __tablename__ = 'fichas_tecnicas_itens'

    id = db.Column(db.Integer, primary_key=True)
    ficha_tecnica_id = db.Column(db.Integer, db.ForeignKey('fichas_tecnicas.id'), nullable=False)
    ingrediente_id = db.Column(db.Integer, db.ForeignKey('ingredientes.id'), nullable=False)
    quantidade = db.Column(db.Numeric(10, 3), nullable=False)
    unidade = db.Column(db.String(20), nullable=False)
    observacao = db.Column(db.String(255), nullable=True)

    ingrediente = db.relationship('Ingrediente')

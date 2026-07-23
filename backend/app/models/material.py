from enum import Enum
from app.core.database import db
from app.models.base import BaseModel

class TipoMaterial(str, Enum):
    REUTILIZAVEL = 'Reutilizavel'
    CONSUMIVEL = 'Consumivel'

class EstadoMaterial(str, Enum):
    DISPONIVEL = 'Disponivel'
    RESERVADO = 'Reservado'
    EM_USO = 'Em Uso'
    DANIFICADO = 'Danificado'
    MANUTENCAO = 'Manutencao'

class Material(BaseModel):
    __tablename__ = 'materiais'

    codigo = db.Column(db.String(50), unique=True, nullable=True)
    nome = db.Column(db.String(100), nullable=False)
    categoria = db.Column(db.String(100), nullable=True)
    tipo = db.Column(db.Enum(TipoMaterial), nullable=False)
    
    quantidade_total = db.Column(db.Numeric(10, 2), default=0)
    quantidade_disponivel = db.Column(db.Numeric(10, 2), default=0)
    quantidade_reservada = db.Column(db.Numeric(10, 2), default=0)
    
    estado = db.Column(db.Enum(EstadoMaterial), default=EstadoMaterial.DISPONIVEL)
    ativo = db.Column(db.Boolean, default=True)
    valor_unitario = db.Column(db.Numeric(10, 2), default=0)
    unidade_medida_id = db.Column(db.Integer, db.ForeignKey('unidades_medida.id'), nullable=True)

    unidade_medida = db.relationship('UnidadeMedida', backref='materiais')

    stocks_armazem = db.relationship(
        'MaterialStockArmazem',
        back_populates='material',
        cascade='all, delete-orphan',
        lazy=True
    )


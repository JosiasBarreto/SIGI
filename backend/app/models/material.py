from enum import Enum
from sqlalchemy.types import TypeDecorator, String
from app.core.database import db
from app.models.base import BaseModel


class TipoMaterial(str, Enum):
    REUTILIZAVEL = 'Reutilizavel'
    CONSUMIVEL = 'Consumivel'

    @classmethod
    def normalize(cls, val):
        if val is None:
            return cls.REUTILIZAVEL.value
        if isinstance(val, cls):
            return val.value
        s = str(val).strip()
        mapping = {
            'REUTILIZAVEL': cls.REUTILIZAVEL.value,
            'reutilizavel': cls.REUTILIZAVEL.value,
            'Reutilizavel': cls.REUTILIZAVEL.value,
            'CONSUMIVEL': cls.CONSUMIVEL.value,
            'consumivel': cls.CONSUMIVEL.value,
            'Consumivel': cls.CONSUMIVEL.value,
        }
        return mapping.get(s, s)


class TipoMaterialType(TypeDecorator):
    impl = String(50)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return TipoMaterial.normalize(value) if value is not None else TipoMaterial.REUTILIZAVEL.value

    def process_result_value(self, value, dialect):
        return TipoMaterial.normalize(value) if value is not None else TipoMaterial.REUTILIZAVEL.value


class EstadoMaterial(str, Enum):
    DISPONIVEL = 'Disponivel'
    RESERVADO = 'Reservado'
    EM_USO = 'Em Uso'
    DANIFICADO = 'Danificado'
    MANUTENCAO = 'Manutencao'

    @classmethod
    def normalize(cls, val):
        if val is None:
            return cls.DISPONIVEL.value
        if isinstance(val, cls):
            return val.value
        s = str(val).strip()
        mapping = {
            'DISPONIVEL': cls.DISPONIVEL.value,
            'disponivel': cls.DISPONIVEL.value,
            'Disponivel': cls.DISPONIVEL.value,
            'RESERVADO': cls.RESERVADO.value,
            'reservado': cls.RESERVADO.value,
            'Reservado': cls.RESERVADO.value,
            'EM_USO': cls.EM_USO.value,
            'em_uso': cls.EM_USO.value,
            'Em Uso': cls.EM_USO.value,
            'em uso': cls.EM_USO.value,
            'DANIFICADO': cls.DANIFICADO.value,
            'danificado': cls.DANIFICADO.value,
            'Danificado': cls.DANIFICADO.value,
            'MANUTENCAO': cls.MANUTENCAO.value,
            'manutencao': cls.MANUTENCAO.value,
            'Manutencao': cls.MANUTENCAO.value,
        }
        return mapping.get(s, s)


class EstadoMaterialType(TypeDecorator):
    impl = String(50)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return EstadoMaterial.normalize(value) if value is not None else EstadoMaterial.DISPONIVEL.value

    def process_result_value(self, value, dialect):
        return EstadoMaterial.normalize(value) if value is not None else EstadoMaterial.DISPONIVEL.value


class Material(BaseModel):
    __tablename__ = 'materiais'

    codigo = db.Column(db.String(50), unique=True, nullable=True)
    nome = db.Column(db.String(100), nullable=False)
    categoria = db.Column(db.String(100), nullable=True)
    categoria_id = db.Column(
    db.Integer,
    db.ForeignKey("categorias_produto.id"),
    nullable=True,
    index=True
    )

    categoria_rel = db.relationship(
        "CategoriaProduto",
        back_populates="materiais"
    )
    tipo = db.Column(TipoMaterialType, nullable=False, default=TipoMaterial.REUTILIZAVEL.value)
    
    quantidade_total = db.Column(db.Numeric(10, 2), default=0)
    quantidade_disponivel = db.Column(db.Numeric(10, 2), default=0)
    quantidade_reservada = db.Column(db.Numeric(10, 2), default=0)
    
    estado = db.Column(EstadoMaterialType, default=EstadoMaterial.DISPONIVEL.value)
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

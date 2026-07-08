from enum import Enum
from app.core.database import db
from app.models.base import BaseModel
from datetime import datetime

class TipoRequisicao(str, Enum):
    INICIAL = 'Inicial'
    COMPLEMENTAR = 'Complementar'

class SectorRequisicao(str, Enum):
    COZINHA = 'Cozinha'
    PASTELARIA = 'Pastelaria'

class EstadoRequisicao(str, Enum):
    PENDENTE = 'Pendente'
    APROVADA = 'Aprovada'
    ENTREGUE = 'Entregue'
    EM_USO = 'Em Uso'
    DEVOLUCAO_PARCIAL = 'Devolucao Parcial'
    DEVOLVIDA = 'Devolvida'
    ENCERRADA = 'Encerrada'
    CANCELADA = 'Cancelada'

class Requisicao(BaseModel):
    __tablename__ = 'requisicoes'

    numero = db.Column(db.String(50), unique=True, nullable=False)
    tipo = db.Column(db.Enum(TipoRequisicao), nullable=False)
    sector = db.Column(db.Enum(SectorRequisicao), nullable=False)
    turno_id = db.Column(db.Integer, db.ForeignKey('turnos.id'), nullable=True) 
    responsavel_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    data_requisicao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    estado = db.Column(db.Enum(EstadoRequisicao), default=EstadoRequisicao.PENDENTE)
    observacoes = db.Column(db.Text, nullable=True)
    
    itens = db.relationship('RequisicaoItem', backref='requisicao', cascade="all, delete-orphan", lazy='selectin')
    entregas = db.relationship('EntregaRequisicao', backref='requisicao', cascade="all, delete-orphan", lazy='selectin')
    devolucoes = db.relationship('DevolucaoMaterial', backref='requisicao', cascade="all, delete-orphan", lazy='selectin')

    responsavel = db.relationship('User', foreign_keys=[responsavel_id])
    turno = db.relationship('Turno', foreign_keys=[turno_id])

class TipoItemRequisicao(str, Enum):
    INGREDIENTE = 'Ingrediente'
    MATERIAL = 'Material'
    CONSUMIVEL = 'Consumivel'

class RequisicaoItem(db.Model):
    __tablename__ = 'requisicoes_itens'

    id = db.Column(db.Integer, primary_key=True)
    requisicao_id = db.Column(db.Integer, db.ForeignKey('requisicoes.id'), nullable=False)
    tipo_item = db.Column(db.Enum(TipoItemRequisicao), nullable=False)
    item_id = db.Column(db.Integer, nullable=False)
    
    quantidade_solicitada = db.Column(db.Numeric(10, 3), nullable=False)
    quantidade_aprovada = db.Column(db.Numeric(10, 3), default=0)
    quantidade_entregue = db.Column(db.Numeric(10, 3), default=0)
    quantidade_devolvida = db.Column(db.Numeric(10, 3), default=0)
    quantidade_danificada = db.Column(db.Numeric(10, 3), default=0)
    quantidade_perdida = db.Column(db.Numeric(10, 3), default=0)
    
    observacao = db.Column(db.String(255), nullable=True)

class EntregaRequisicao(db.Model):
    __tablename__ = 'entregas_requisicao'

    id = db.Column(db.Integer, primary_key=True)
    requisicao_id = db.Column(db.Integer, db.ForeignKey('requisicoes.id'), nullable=False)
    armazem_responsavel_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    data_entrega = db.Column(db.Date, default=datetime.utcnow, nullable=False)
    hora_entrega = db.Column(db.Time, default=datetime.utcnow, nullable=False)
    observacao = db.Column(db.Text, nullable=True)

    armazem_responsavel = db.relationship('User', foreign_keys=[armazem_responsavel_id])

class DevolucaoMaterial(db.Model):
    __tablename__ = 'devolucoes_materiais'

    id = db.Column(db.Integer, primary_key=True)
    requisicao_id = db.Column(db.Integer, db.ForeignKey('requisicoes.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materiais.id'), nullable=False)
    quantidade_entregue = db.Column(db.Numeric(10, 3), nullable=False)
    quantidade_devolvida = db.Column(db.Numeric(10, 3), default=0)
    quantidade_danificada = db.Column(db.Numeric(10, 3), default=0)
    quantidade_perdida = db.Column(db.Numeric(10, 3), default=0)
    data_devolucao = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    observacao = db.Column(db.Text, nullable=True)

class TipoOcorrencia(str, Enum):
    PERDA = 'Perda'
    DANIFICADO = 'Danificado'
    NAO_DEVOLVIDO = 'Nao Devolvido'

class EstadoOcorrencia(str, Enum):
    ABERTA = 'Aberta'
    ANALISE = 'Analise'
    RESOLVIDA = 'Resolvida'

class OcorrenciaMaterial(BaseModel):
    __tablename__ = 'ocorrencias_materiais'

    numero = db.Column(db.String(50), unique=True, nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materiais.id'), nullable=False)
    responsavel_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tipo = db.Column(db.Enum(TipoOcorrencia), nullable=False)
    quantidade = db.Column(db.Numeric(10, 3), nullable=False)
    valor_estimado = db.Column(db.Numeric(10, 2), default=0)
    justificacao = db.Column(db.Text, nullable=False)
    data_ocorrencia = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    estado = db.Column(db.Enum(EstadoOcorrencia), default=EstadoOcorrencia.ABERTA)

    material = db.relationship('Material', foreign_keys=[material_id])
    responsavel = db.relationship('User', foreign_keys=[responsavel_id])

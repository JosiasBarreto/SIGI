from enum import Enum
from datetime import datetime
from sqlalchemy.types import TypeDecorator, String
from app.core.database import db
from app.models.base import BaseModel


class TipoRequisicao(str, Enum):
    INICIAL = 'Inicial'
    COMPLEMENTAR = 'Complementar'

    @classmethod
    def normalize(cls, val):
        if val is None:
            return cls.INICIAL.value
        if isinstance(val, cls):
            return val.value
        s = str(val).strip()
        mapping = {
            'INICIAL': cls.INICIAL.value,
            'inicial': cls.INICIAL.value,
            'Inicial': cls.INICIAL.value,
            'COMPLEMENTAR': cls.COMPLEMENTAR.value,
            'complementar': cls.COMPLEMENTAR.value,
            'Complementar': cls.COMPLEMENTAR.value,
        }
        return mapping.get(s, s)


class TipoRequisicaoType(TypeDecorator):
    impl = String(50)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return TipoRequisicao.normalize(value) if value is not None else TipoRequisicao.INICIAL.value

    def process_result_value(self, value, dialect):
        return TipoRequisicao.normalize(value) if value is not None else TipoRequisicao.INICIAL.value


class SectorRequisicao(str, Enum):
    COZINHA = 'Cozinha'
    PASTELARIA = 'Pastelaria'
    BAR = 'Bar'
    EVENTOS = 'Eventos'
    LOGISTICA = 'Logistica'
    ALUGUER = 'Aluguer'
    OUTRO = 'Outro'

    @classmethod
    def normalize(cls, val):
        if val is None:
            return cls.COZINHA.value
        if isinstance(val, cls):
            return val.value
        s = str(val).strip()
        for member in cls:
            if s.upper() == member.name or s.lower() == member.value.lower():
                return member.value
        return s


class SectorRequisicaoType(TypeDecorator):
    impl = String(50)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return SectorRequisicao.normalize(value) if value is not None else SectorRequisicao.COZINHA.value

    def process_result_value(self, value, dialect):
        return SectorRequisicao.normalize(value) if value is not None else SectorRequisicao.COZINHA.value


class EstadoRequisicao(str, Enum):
    PENDENTE = 'Pendente'
    APROVADA = 'Aprovada'
    ENTREGUE = 'Entregue'
    EM_USO = 'Em Uso'
    DEVOLUCAO_PARCIAL = 'Devolucao Parcial'
    DEVOLVIDA = 'Devolvida'
    ENCERRADA = 'Encerrada'
    CANCELADA = 'Cancelada'

    @classmethod
    def normalize(cls, val):
        if val is None:
            return cls.PENDENTE.value
        if isinstance(val, cls):
            return val.value
        s = str(val).strip()
        mapping = {
            'PENDENTE': cls.PENDENTE.value,
            'pendente': cls.PENDENTE.value,
            'Pendente': cls.PENDENTE.value,
            'APROVADA': cls.APROVADA.value,
            'aprovada': cls.APROVADA.value,
            'Aprovada': cls.APROVADA.value,
            'ENTREGUE': cls.ENTREGUE.value,
            'entregue': cls.ENTREGUE.value,
            'Entregue': cls.ENTREGUE.value,
            'EM_USO': cls.EM_USO.value,
            'em_uso': cls.EM_USO.value,
            'Em Uso': cls.EM_USO.value,
            'em uso': cls.EM_USO.value,
            'DEVOLUCAO_PARCIAL': cls.DEVOLUCAO_PARCIAL.value,
            'devolucao_parcial': cls.DEVOLUCAO_PARCIAL.value,
            'Devolucao Parcial': cls.DEVOLUCAO_PARCIAL.value,
            'DEVOLVIDA': cls.DEVOLVIDA.value,
            'devolvida': cls.DEVOLVIDA.value,
            'Devolvida': cls.DEVOLVIDA.value,
            'ENCERRADA': cls.ENCERRADA.value,
            'encerrada': cls.ENCERRADA.value,
            'Encerrada': cls.ENCERRADA.value,
            'CANCELADA': cls.CANCELADA.value,
            'cancelada': cls.CANCELADA.value,
            'Cancelada': cls.CANCELADA.value,
        }
        return mapping.get(s, s)


class EstadoRequisicaoType(TypeDecorator):
    impl = String(50)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return EstadoRequisicao.normalize(value) if value is not None else EstadoRequisicao.PENDENTE.value

    def process_result_value(self, value, dialect):
        return EstadoRequisicao.normalize(value) if value is not None else EstadoRequisicao.PENDENTE.value


class TipoItemRequisicao(str, Enum):
    INGREDIENTE = 'Ingrediente'
    MATERIAL = 'Material'
    CONSUMIVEL = 'Consumivel'

    @classmethod
    def normalize(cls, val):
        if val is None:
            return cls.INGREDIENTE.value
        if isinstance(val, cls):
            return val.value
        s = str(val).strip()
        for member in cls:
            if s.upper() == member.name or s.lower() == member.value.lower():
                return member.value
        return s


class TipoItemRequisicaoType(TypeDecorator):
    impl = String(50)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return TipoItemRequisicao.normalize(value) if value is not None else TipoItemRequisicao.INGREDIENTE.value

    def process_result_value(self, value, dialect):
        return TipoItemRequisicao.normalize(value) if value is not None else TipoItemRequisicao.INGREDIENTE.value


class TipoOcorrencia(str, Enum):
    PERDA = 'Perda'
    DANIFICADO = 'Danificado'
    NAO_DEVOLVIDO = 'Nao Devolvido'

    @classmethod
    def normalize(cls, val):
        if val is None:
            return cls.DANIFICADO.value
        if isinstance(val, cls):
            return val.value
        s = str(val).strip()
        mapping = {
            'PERDA': cls.PERDA.value,
            'perda': cls.PERDA.value,
            'Perda': cls.PERDA.value,
            'DANIFICADO': cls.DANIFICADO.value,
            'danificado': cls.DANIFICADO.value,
            'Danificado': cls.DANIFICADO.value,
            'NAO_DEVOLVIDO': cls.NAO_DEVOLVIDO.value,
            'nao_devolvido': cls.NAO_DEVOLVIDO.value,
            'Nao Devolvido': cls.NAO_DEVOLVIDO.value,
            'nao devolvido': cls.NAO_DEVOLVIDO.value,
            'NAO DEVOLVIDO': cls.NAO_DEVOLVIDO.value,
        }
        return mapping.get(s, s)


class TipoOcorrenciaType(TypeDecorator):
    impl = String(50)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return TipoOcorrencia.normalize(value) if value is not None else TipoOcorrencia.DANIFICADO.value

    def process_result_value(self, value, dialect):
        return TipoOcorrencia.normalize(value) if value is not None else TipoOcorrencia.DANIFICADO.value


class EstadoOcorrencia(str, Enum):
    ABERTA = 'Aberta'
    ANALISE = 'Analise'
    RESOLVIDA = 'Resolvida'

    @classmethod
    def normalize(cls, val):
        if val is None:
            return cls.ABERTA.value
        if isinstance(val, cls):
            return val.value
        s = str(val).strip()
        mapping = {
            'ABERTA': cls.ABERTA.value,
            'aberta': cls.ABERTA.value,
            'Aberta': cls.ABERTA.value,
            'ANALISE': cls.ANALISE.value,
            'analise': cls.ANALISE.value,
            'Analise': cls.ANALISE.value,
            'RESOLVIDA': cls.RESOLVIDA.value,
            'resolvida': cls.RESOLVIDA.value,
            'Resolvida': cls.RESOLVIDA.value,
        }
        return mapping.get(s, s)


class EstadoOcorrenciaType(TypeDecorator):
    impl = String(50)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return EstadoOcorrencia.normalize(value) if value is not None else EstadoOcorrencia.ABERTA.value

    def process_result_value(self, value, dialect):
        return EstadoOcorrencia.normalize(value) if value is not None else EstadoOcorrencia.ABERTA.value


class Requisicao(BaseModel):
    __tablename__ = 'requisicoes'

    numero = db.Column(db.String(50), unique=True, nullable=False)
    tipo = db.Column(TipoRequisicaoType, nullable=False, default=TipoRequisicao.INICIAL.value)
    sector = db.Column(SectorRequisicaoType, nullable=False, default=SectorRequisicao.COZINHA.value)
    turno_id = db.Column(db.Integer, db.ForeignKey('turnos.id'), nullable=True)
    responsavel_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=True)
    data_requisicao = db.Column(db.DateTime, default=datetime.utcnow)
    estado = db.Column(EstadoRequisicaoType, default=EstadoRequisicao.PENDENTE.value)
    motivo = db.Column(db.Text, nullable=True)
    observacoes = db.Column(db.Text, nullable=True)

    itens = db.relationship('RequisicaoItem', backref='requisicao', cascade='all, delete-orphan', lazy='selectin')
    entregas = db.relationship('EntregaRequisicao', backref='requisicao', cascade='all, delete-orphan', lazy=True)
    devolucoes = db.relationship('DevolucaoMaterial', backref='requisicao', cascade='all, delete-orphan', lazy=True)
    responsavel = db.relationship('User', foreign_keys=[responsavel_id])
    turno = db.relationship('Turno')


class RequisicaoItem(db.Model):
    __tablename__ = 'requisicoes_itens'

    id = db.Column(db.Integer, primary_key=True)
    requisicao_id = db.Column(db.Integer, db.ForeignKey('requisicoes.id', ondelete='CASCADE'), nullable=False)
    tipo_item = db.Column(TipoItemRequisicaoType, nullable=False)
    item_id = db.Column(db.Integer, nullable=False)
    quantidade_solicitada = db.Column(db.Numeric(10, 3), default=0)
    quantidade_aprovada = db.Column(db.Numeric(10, 3), default=0)
    quantidade_entregue = db.Column(db.Numeric(10, 3), default=0)
    quantidade_devolvida = db.Column(db.Numeric(10, 3), default=0)
    quantidade_danificada = db.Column(db.Numeric(10, 3), default=0)
    quantidade_perdida = db.Column(db.Numeric(10, 3), default=0)
    observacao = db.Column(db.Text, nullable=True)


class EntregaRequisicao(db.Model):
    __tablename__ = 'entregas_requisicao'

    id = db.Column(db.Integer, primary_key=True)
    requisicao_id = db.Column(db.Integer, db.ForeignKey('requisicoes.id'), nullable=False)
    armazem_responsavel_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    data_entrega = db.Column(db.Date, default=datetime.utcnow)
    hora_entrega = db.Column(db.Time, nullable=True)
    observacao = db.Column(db.Text, nullable=True)

    armazem_responsavel = db.relationship('User')


class DevolucaoMaterial(db.Model):
    __tablename__ = 'devolucoes_materiais'

    id = db.Column(db.Integer, primary_key=True)
    requisicao_id = db.Column(db.Integer, db.ForeignKey('requisicoes.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materiais.id'), nullable=False)
    quantidade_entregue = db.Column(db.Numeric(10, 3), default=0)
    quantidade_devolvida = db.Column(db.Numeric(10, 3), default=0)
    quantidade_danificada = db.Column(db.Numeric(10, 3), default=0)
    quantidade_perdida = db.Column(db.Numeric(10, 3), default=0)
    data_devolucao = db.Column(db.DateTime, default=datetime.utcnow)
    observacao = db.Column(db.Text, nullable=True)

    material = db.relationship('Material')


class OcorrenciaMaterial(BaseModel):
    __tablename__ = 'ocorrencias_materiais'

    id = db.Column(db.Integer, primary_key=True)
    numero = db.Column(db.String(50), unique=True, nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materiais.id'), nullable=False)
    responsavel_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    tipo = db.Column(TipoOcorrenciaType, nullable=False, default=TipoOcorrencia.DANIFICADO.value)
    estado = db.Column(EstadoOcorrenciaType, default=EstadoOcorrencia.ABERTA.value)
    quantidade = db.Column(db.Numeric(10, 3), default=0)
    valor_estimado = db.Column(db.Numeric(10, 2), default=0)
    justificacao = db.Column(db.Text, nullable=True)
    data_ocorrencia = db.Column(db.DateTime, default=datetime.utcnow)

    material = db.relationship('Material')
    responsavel = db.relationship('User')

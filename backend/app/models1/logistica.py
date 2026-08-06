from enum import Enum
from app.core.database import db
from app.models.base import BaseModel
from datetime import datetime

class EstadoMotorista(str, Enum):
    ATIVO = 'Ativo'
    INATIVO = 'Inativo'

class EstadoViatura(str, Enum):
    DISPONIVEL = 'Disponivel'
    EM_SERVICO = 'Em Servico'
    MANUTENCAO = 'Manutencao'
    INATIVA = 'Inativa'

class EstadoEntrega(str, Enum):
    AGENDADA = 'Agendada'
    EM_TRANSITO = 'Em Transito'
    ENTREGUE = 'Entregue'
    RECOLHIDA = 'Recolhida'
    CANCELADA = 'Cancelado'

class TipoOcorrenciaLogistica(str, Enum):
    ATRASO = 'Atraso'
    ACIDENTE = 'Acidente'
    PERDA = 'Perda'
    DANO = 'Dano'
    OUTRO = 'Outro'

class Motorista(BaseModel):
    __tablename__ = 'motoristas'
    nome = db.Column(db.String(100), nullable=False)
    telefone = db.Column(db.String(20), nullable=True)
    carta_conducao = db.Column(db.String(50), nullable=True)
    validade_carta = db.Column(db.Date, nullable=True)
    estado = db.Column(db.Enum(EstadoMotorista), default=EstadoMotorista.ATIVO)

class Viatura(BaseModel):
    __tablename__ = 'viaturas'
    matricula = db.Column(db.String(20), unique=True, nullable=False)
    marca = db.Column(db.String(50), nullable=True)
    modelo = db.Column(db.String(50), nullable=True)
    ano = db.Column(db.Integer, nullable=True)
    capacidade = db.Column(db.Numeric(10, 2), nullable=True)
    quilometragem = db.Column(db.Numeric(10, 2), default=0)
    estado = db.Column(db.Enum(EstadoViatura), default=EstadoViatura.DISPONIVEL)

class Entrega(BaseModel):
    __tablename__ = 'entregas'
    numero = db.Column(db.String(50), unique=True, nullable=False)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=True)
    motorista_id = db.Column(db.Integer, db.ForeignKey('motoristas.id'), nullable=False)
    viatura_id = db.Column(db.Integer, db.ForeignKey('viaturas.id'), nullable=False)
    
    data_saida = db.Column(db.Date, nullable=True)
    hora_saida = db.Column(db.Time, nullable=True)
    data_entrega = db.Column(db.Date, nullable=True)
    hora_entrega = db.Column(db.Time, nullable=True)
    
    estado = db.Column(db.Enum(EstadoEntrega), default=EstadoEntrega.AGENDADA)
    
    ocorrencias = db.relationship('OcorrenciaLogistica', backref='entrega', lazy=True)
    checklists = db.relationship('ChecklistEntrega', backref='entrega', lazy=True)

class ReservaViatura(db.Model):
    __tablename__ = 'reservas_viaturas'
    id = db.Column(db.Integer, primary_key=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=False)
    viatura_id = db.Column(db.Integer, db.ForeignKey('viaturas.id'), nullable=False)
    motorista_id = db.Column(db.Integer, db.ForeignKey('motoristas.id'), nullable=False)
    data_saida = db.Column(db.DateTime, nullable=False)
    data_retorno = db.Column(db.DateTime, nullable=False)
    estado = db.Column(db.String(50), default='Agendada')

class OcorrenciaLogistica(db.Model):
    __tablename__ = 'ocorrencias_logisticas'
    id = db.Column(db.Integer, primary_key=True)
    entrega_id = db.Column(db.Integer, db.ForeignKey('entregas.id'), nullable=False)
    tipo = db.Column(db.Enum(TipoOcorrenciaLogistica), nullable=False)
    justificacao = db.Column(db.Text, nullable=False)
    data_ocorrencia = db.Column(db.DateTime, default=datetime.utcnow)

class ChecklistEntrega(db.Model):
    __tablename__ = 'checklists_entregas'
    id = db.Column(db.Integer, primary_key=True)
    entrega_id = db.Column(db.Integer, db.ForeignKey('entregas.id'), nullable=False)
    tipo = db.Column(db.String(50), nullable=False) # SAIDA, RETORNO
    item = db.Column(db.String(255), nullable=False)
    validado = db.Column(db.Boolean, default=False)
    observacao = db.Column(db.Text, nullable=True)

from enum import Enum
from app.core.database import db
from app.models.base import BaseModel

class TipoEvento(str, Enum):
    CASAMENTO = 'Casamento'
    ANIVERSARIO = 'Aniversario'
    BATIZADO = 'Batizado'
    EMPRESARIAL = 'Empresarial'
    CATERING = 'Catering'
    FORMATURA = 'Formatura'
    OUTRO = 'Outro'

class EstadoEvento(str, Enum):
    AGENDADO = 'Agendado'
    CONFIRMADO = 'Confirmado'
    EM_EXECUCAO = 'Em Execucao'
    CONCLUIDO = 'Concluido'
    CANCELADO = 'Cancelado'

class TipoServicoEvento(str, Enum):
    COZINHA = 'Cozinha'
    PASTELARIA = 'Pastelaria'
    BAR = 'Bar'
    LOGISTICA = 'Logistica'
    ALUGUER = 'Aluguer'
    LIMPEZA = 'Limpeza'
    SEGURANCA = 'Seguranca'

class EstadoEspaco(str, Enum):
    ATIVO = 'Ativo'
    INATIVO = 'Inativo'

class EstadoReservaEspaco(str, Enum):
    RESERVADO = 'Reservado'
    UTILIZADO = 'Utilizado'
    FINALIZADO = 'Finalizado'
    CANCELADO = 'Cancelado'

class FuncaoEquipa(str, Enum):
    CHEFE_COZINHA = 'Chefe Cozinha'
    COZINHEIRO = 'Cozinheiro'
    PASTELEIRO = 'Pasteleiro'
    ATENDIMENTO = 'Atendimento'
    BAR = 'Bar'
    MOTORISTA = 'Motorista'
    SUPERVISOR = 'Supervisor'

class Espaco(BaseModel):
    __tablename__ = 'espacos'
    nome = db.Column(db.String(100), nullable=False)
    capacidade = db.Column(db.Integer, nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    estado = db.Column(db.Enum(EstadoEspaco), default=EstadoEspaco.ATIVO)

class Evento(BaseModel):
    __tablename__ = 'eventos'
    numero = db.Column(db.String(50), unique=True, nullable=False)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    tipo_evento = db.Column(db.Enum(TipoEvento), nullable=False)
    titulo = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    local_evento = db.Column(db.String(255), nullable=True)
    
    data_evento = db.Column(db.Date, nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fim = db.Column(db.Time, nullable=False)
    numero_convidados = db.Column(db.Integer, nullable=False)
    estado = db.Column(db.Enum(EstadoEvento), default=EstadoEvento.AGENDADO)
    observacoes = db.Column(db.Text, nullable=True)
    
    valor_total = db.Column(db.Numeric(10, 2), default=0)
    valor_pago = db.Column(db.Numeric(10, 2), default=0)
    saldo = db.Column(db.Numeric(10, 2), default=0)

    servicos = db.relationship('EventoServico', backref='evento', lazy='selectin', cascade="all, delete-orphan")
    reservas_espaco = db.relationship('ReservaEspaco', backref='evento', lazy='selectin', cascade="all, delete-orphan")
    reservas_material = db.relationship('ReservaMaterial', backref='evento', lazy='selectin', cascade="all, delete-orphan")
    equipas = db.relationship('EventoEquipa', backref='evento', lazy='selectin', cascade="all, delete-orphan")

class EventoServico(db.Model):
    __tablename__ = 'eventos_servicos'
    id = db.Column(db.Integer, primary_key=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=False)
    tipo = db.Column(db.Enum(TipoServicoEvento), nullable=False)
    descricao = db.Column(db.String(255), nullable=True)
    quantidade = db.Column(db.Numeric(10, 2), nullable=False)
    valor_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)

class ReservaEspaco(db.Model):
    __tablename__ = 'reservas_espacos'
    id = db.Column(db.Integer, primary_key=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=False)
    espaco_id = db.Column(db.Integer, db.ForeignKey('espacos.id'), nullable=False)
    data_inicio = db.Column(db.DateTime, nullable=False)
    data_fim = db.Column(db.DateTime, nullable=False)
    estado = db.Column(db.Enum(EstadoReservaEspaco), default=EstadoReservaEspaco.RESERVADO)

class ReservaMaterial(db.Model):
    __tablename__ = 'reservas_materiais'
    id = db.Column(db.Integer, primary_key=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materiais.id'), nullable=False)
    quantidade = db.Column(db.Numeric(10, 2), nullable=False)
    data_inicio = db.Column(db.DateTime, nullable=False)
    data_fim = db.Column(db.DateTime, nullable=False)
    estado = db.Column(db.String(50), default='Reservado') # RESERVADO, UTILIZADO, DEVOLVIDO, CANCELADO

class EventoEquipa(db.Model):
    __tablename__ = 'eventos_equipas'
    id = db.Column(db.Integer, primary_key=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=False)
    utilizador_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    funcao = db.Column(db.Enum(FuncaoEquipa), nullable=False)
    estado = db.Column(db.String(50), default='Alocado')

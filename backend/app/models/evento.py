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
    _cliente_id = db.Column('cliente_id', db.Integer, db.ForeignKey('clientes.id'), nullable=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=True)
    
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
    
    _valor_total = db.Column('valor_total', db.Numeric(10, 2), default=0, nullable=True)
    _valor_pago = db.Column('valor_pago', db.Numeric(10, 2), default=0, nullable=True)
    _saldo = db.Column('saldo', db.Numeric(10, 2), default=0, nullable=True)

    servicos = db.relationship('EventoServico', backref='evento', lazy='selectin', cascade="all, delete-orphan")
    reservas_espaco = db.relationship('ReservaEspaco', backref='evento', lazy='selectin', cascade="all, delete-orphan")
    reservas_material = db.relationship('ReservaMaterial', backref='evento', lazy='selectin', cascade="all, delete-orphan")
    equipas = db.relationship('EventoEquipa', backref='evento', lazy='selectin', cascade="all, delete-orphan")
    
    @property
    def pedido(self):
        from app.models.pedido import Pedido
        if not self.pedido_id: return None
        return Pedido.query.get(self.pedido_id)

    @property
    def cliente_id(self):
        return self._cliente_id or (self.pedido.cliente_id if self.pedido else None)
    @cliente_id.setter
    def cliente_id(self, value):
        self._cliente_id = value

    @property
    def valor_total(self):
        return self._valor_total if self._valor_total is not None else (self.pedido.valor_total if self.pedido else 0)
    @valor_total.setter
    def valor_total(self, value): self._valor_total = value

    @property
    def valor_pago(self):
        return self._valor_pago if self._valor_pago is not None else (self.pedido.valor_pago if self.pedido else 0)
    @valor_pago.setter
    def valor_pago(self, value): self._valor_pago = value

    @property
    def saldo(self):
        return self._saldo if self._saldo is not None else (self.pedido.saldo if self.pedido else 0)
    @saldo.setter
    def saldo(self, value): self._saldo = value

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

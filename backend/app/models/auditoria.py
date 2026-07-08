from enum import Enum
from app.core.database import db
from app.models.base import BaseModel
from datetime import datetime

class TipoOperacaoAuditoria(str, Enum):
    CREATE = 'CREATE'
    UPDATE = 'UPDATE'
    DELETE = 'DELETE'
    LOGIN = 'LOGIN'
    LOGOUT = 'LOGOUT'
    EXPORT = 'EXPORT'
    IMPORT = 'IMPORT'
    BACKUP = 'BACKUP'
    RESTORE = 'RESTORE'
    UPDATE_ESTADO = 'UPDATE_ESTADO'
    ABRIR = 'ABRIR'
    FECHAR = 'FECHAR'
    RECEBER = 'RECEBER'
    REGISTO_OCORRENCIA = 'REGISTO_OCORRENCIA'

class Auditoria(db.Model):
    __tablename__ = 'auditoria'

    id = db.Column(db.Integer, primary_key=True)
    utilizador_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    ip = db.Column(db.String(45), nullable=True)
    modulo = db.Column(db.String(100), nullable=True)
    entidade = db.Column(db.String(100), nullable=True)
    registo_id = db.Column(db.Integer, nullable=True)
    operacao = db.Column(db.String(50), nullable=False)
    valor_anterior = db.Column(db.JSON, nullable=True)
    valor_novo = db.Column(db.JSON, nullable=True)
    justificativa = db.Column(db.Text, nullable=True)
    data_hora = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    utilizador = db.relationship('User', backref='auditorias')

class LogAcesso(db.Model):
    __tablename__ = 'log_acessos'

    id = db.Column(db.Integer, primary_key=True)
    utilizador_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    ip = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    data_login = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    data_logout = db.Column(db.DateTime, nullable=True)
    sucesso = db.Column(db.Boolean, default=True)

class LogErro(db.Model):
    __tablename__ = 'log_erros'

    id = db.Column(db.Integer, primary_key=True)
    tipo = db.Column(db.String(100), nullable=False)
    mensagem = db.Column(db.Text, nullable=False)
    stacktrace = db.Column(db.Text, nullable=True)
    rota = db.Column(db.String(255), nullable=True)
    utilizador_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    data_hora = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

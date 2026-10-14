from datetime import datetime
from app.core.database import db
from app.models.base import BaseModel

class Notificacao(BaseModel):
    __tablename__ = 'notificacoes'

    tipo = db.Column(db.String(50), nullable=False) # VALIDADE_EXPIRADA, VALIDADE_PROXIMA, STOCK_BAIXO, PEDIDO_NAO_ENTREGUE, CAIXA_DIVERGENCIA, GERAL
    titulo = db.Column(db.String(200), nullable=False)
    mensagem = db.Column(db.Text, nullable=False)
    prioridade = db.Column(db.String(20), default='media') # alta, media, baixa
    entidade_tipo = db.Column(db.String(50), nullable=True) # produto, pedido, caixa, material
    entidade_id = db.Column(db.Integer, nullable=True)
    dados_extra = db.Column(db.JSON, nullable=True)
    ativo = db.Column(db.Boolean, default=True)

    # Campos do barramento de notificações.  Os campos ``entidade_*`` acima
    # permanecem para compatibilidade com os alertas legados; estes campos são
    # usados pelo serviço de eventos estruturados.
    event_id = db.Column(db.String(64), nullable=True, index=True)
    event_type = db.Column(db.String(64), nullable=True)
    entity_type = db.Column(db.String(64), nullable=True)
    entity_id = db.Column(db.Integer, nullable=True)
    aggregate_id = db.Column(db.String(128), nullable=True, index=True)
    actor_user_id = db.Column(db.Integer, nullable=True)
    recipient_user_id = db.Column(db.Integer, nullable=True)
    recipient_role = db.Column(db.String(50), nullable=True)
    canal = db.Column(db.String(30), nullable=True, default='SISTEMA')
    persistente = db.Column(db.Boolean, default=False)
    desativada_em = db.Column(db.DateTime, nullable=True)
    desativada_por = db.Column(db.Integer, nullable=True)
    expira_em = db.Column(db.DateTime, nullable=True)
    target_type = db.Column(db.String(20), nullable=True, default='GLOBAL')
    target_role = db.Column(db.String(50), nullable=True)
    target_sector = db.Column(db.String(50), nullable=True)
    target_user_id = db.Column(db.Integer, nullable=True)
    metadados = db.Column(db.JSON, nullable=True)

    leituras = db.relationship('NotificacaoLeitura', backref='notificacao', cascade="all, delete-orphan", lazy='selectin')

class NotificacaoLeitura(db.Model):
    __tablename__ = 'notificacoes_leitura'

    id = db.Column(db.Integer, primary_key=True)
    notificacao_id = db.Column(db.Integer, db.ForeignKey('notificacoes.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    data_leitura = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    user = db.relationship('User', lazy='selectin')

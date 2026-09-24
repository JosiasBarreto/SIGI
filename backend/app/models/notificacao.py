from datetime import datetime
from enum import Enum
from app.core.database import db
from app.models.base import BaseModel


class TipoNotificacaoEnum(str, Enum):
    INFO = "info"
    WARNING = "warning"
    SUCCESS = "success"
    ERROR = "error"
    ALERTA = "alerta"


class CanalNotificacaoEnum(str, Enum):
    SISTEMA = "SISTEMA"
    PEDIDO = "PEDIDO"
    PRODUCAO = "PRODUCAO"
    STOCK = "STOCK"
    FINANCEIRO = "FINANCEIRO"
    SMS = "SMS"
    WHATSAPP = "WHATSAPP"
    EMAIL = "EMAIL"


class PrioridadeNotificacaoEnum(str, Enum):
    BAIXA = "baixa"
    MEDIA = "media"
    ALTA = "alta"
    URGENTE = "urgente"


class TargetTypeEnum(str, Enum):
    GLOBAL = "GLOBAL"
    ROLE = "ROLE"
    SECTOR = "SECTOR"
    USER = "USER"


class Notificacao(BaseModel):
    """
    Modelo principal para armazenamento de notificações no sistema.
    Permite notificações globais, por cargo/role, por setor ou por utilizador específico,
    com suporte a persistência, prioridade e ciclo de vida (ativa/desativada).
    """
    __tablename__ = "notificacoes"

    titulo = db.Column(db.String(150), nullable=False)
    mensagem = db.Column(db.Text, nullable=False)
    tipo = db.Column(db.String(30), nullable=False, default="info")
    canal = db.Column(db.String(30), nullable=False, default="SISTEMA")
    prioridade = db.Column(db.String(20), nullable=False, default="media")

    # Persistente: se True, é fixada/não some automaticamente (anúncios, avisos críticos)
    persistente = db.Column(db.Boolean, default=False, nullable=False, index=True)

    # Ativa: se False, a notificação foi arquivada/desativada
    ativa = db.Column(db.Boolean, default=True, nullable=False, index=True)
    desativada_em = db.Column(db.DateTime, nullable=True)
    desativada_por = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    expira_em = db.Column(db.DateTime, nullable=True)

    # Destinatários
    target_type = db.Column(db.String(20), nullable=False, default="GLOBAL", index=True)
    target_role = db.Column(db.String(50), nullable=True, index=True)
    target_sector = db.Column(db.String(50), nullable=True, index=True)
    target_user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)

    # Metadados em formato JSON (ex: pedido_id, numero, link, acao_url)
    metadados = db.Column(db.JSON, nullable=True)

    # Relacionamentos
    leituras = db.relationship(
        "NotificacaoLeitura",
        back_populates="notificacao",
        cascade="all, delete-orphan",
        lazy="joined"
    )
    target_user = db.relationship("User", foreign_keys=[target_user_id], lazy="select")
    desativado_por_user = db.relationship("User", foreign_keys=[desativada_por], lazy="select")

    def to_dict(self, current_user_id: int = None) -> dict:
        """
        Serializa a notificação para dicionário.
        Se current_user_id for passado, avalia se o utilizador atual já leu e quando.
        """
        lida = False
        lido_em = None
        leituras_count = len(self.leituras) if self.leituras else 0

        if current_user_id:
            for leitura in (self.leituras or []):
                if leitura.user_id == current_user_id:
                    lida = True
                    lido_em = leitura.lido_em.isoformat() if leitura.lido_em else None
                    break

        # Garantir data formatada rigorosamente em ISO 8601
        if self.created_at:
            created_at_val = self.created_at.isoformat() if hasattr(self.created_at, 'isoformat') else str(self.created_at).replace(' ', 'T')
        else:
            created_at_val = datetime.utcnow().isoformat()

        if self.updated_at:
            updated_at_val = self.updated_at.isoformat() if hasattr(self.updated_at, 'isoformat') else str(self.updated_at).replace(' ', 'T')
        else:
            updated_at_val = created_at_val

        return {
            "id": self.id,
            "titulo": self.titulo,
            "mensagem": self.mensagem,
            "tipo": self.tipo,
            "canal": self.canal,
            "prioridade": self.prioridade,
            "persistente": bool(self.persistente),
            "ativa": bool(self.ativa),
            "desativada_em": self.desativada_em.isoformat() if (self.desativada_em and hasattr(self.desativada_em, 'isoformat')) else (str(self.desativada_em).replace(' ', 'T') if self.desativada_em else None),
            "desativada_por": self.desativada_por,
            "expira_em": self.expira_em.isoformat() if (self.expira_em and hasattr(self.expira_em, 'isoformat')) else (str(self.expira_em).replace(' ', 'T') if self.expira_em else None),
            "target_type": self.target_type,
            "target_role": self.target_role,
            "target_sector": self.target_sector,
            "target_user_id": self.target_user_id,
            "metadados": self.metadados or {},
            "created_at": created_at_val,
            "updated_at": updated_at_val,
            "created_by": self.created_by,
            "lida": lida,
            "lido_em": lido_em,
            "leituras_total": leituras_count
        }


class NotificacaoLeitura(db.Model):
    """
    Tabela de rastreamento de leitura por utilizador.
    Permite saber com precisão QUEM LEU e QUEM NÃO LEU cada notificação.
    """
    __tablename__ = "notificacao_leituras"

    id = db.Column(db.Integer, primary_key=True)
    notificacao_id = db.Column(
        db.Integer,
        db.ForeignKey("notificacoes.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    lido_em = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)

    # Relacionamentos
    notificacao = db.relationship("Notificacao", back_populates="leituras")
    user = db.relationship("User", lazy="joined")

    __table_args__ = (
        db.UniqueConstraint("notificacao_id", "user_id", name="uq_notificacao_user_leitura"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "notificacao_id": self.notificacao_id,
            "user_id": self.user_id,
            "user_name": self.user.name if self.user else f"Utilizador #{self.user_id}",
            "user_email": self.user.email if self.user else None,
            "user_role": self.user.role.value if self.user and hasattr(self.user.role, "value") else (str(self.user.role) if self.user else None),
            "lido_em": self.lido_em.isoformat() if self.lido_em else None,
            "ip_address": self.ip_address
        }


class HistoricoSMS(BaseModel):
    """
    Modelo de histórico e auditoria de SMS e WhatsApp enviados pelo sistema.
    Permite listar todas as mensagens enviadas, verificar status, quem leu / confirmação de entrega.
    """
    __tablename__ = "historico_sms"

    telefone = db.Column(db.String(50), nullable=False, index=True)
    destinatario_nome = db.Column(db.String(120), nullable=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey("clientes.id", ondelete="SET NULL"), nullable=True, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    canal = db.Column(db.String(20), default="sms", nullable=False) # 'sms' ou 'whatsapp'
    tipo_mensagem = db.Column(db.String(50), default="aviso_geral", nullable=False)
    mensagem = db.Column(db.Text, nullable=False)

    # Status: 'enviado', 'entregue', 'lido', 'falha', 'pendente'
    status = db.Column(db.String(30), default="enviado", nullable=False, index=True)
    erro = db.Column(db.Text, nullable=True)
    lido_em = db.Column(db.DateTime, nullable=True)
    metadados = db.Column(db.JSON, nullable=True)

    # Relacionamentos
    cliente = db.relationship("Cliente", lazy="select")
    user = db.relationship("User", foreign_keys=[user_id], lazy="select")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "telefone": self.telefone,
            "destinatario_nome": self.destinatario_nome or (self.cliente.nome if self.cliente else "Destinatário"),
            "cliente_id": self.cliente_id,
            "user_id": self.user_id,
            "canal": self.canal,
            "tipo_mensagem": self.tipo_mensagem,
            "mensagem": self.mensagem,
            "status": self.status,
            "lido": self.status == "lido" or self.lido_em is not None,
            "lido_em": self.lido_em.isoformat() if self.lido_em else None,
            "erro": self.erro,
            "metadados": self.metadados or {},
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "created_by": self.created_by
        }

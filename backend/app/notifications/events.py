import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from dataclasses import dataclass, field


class EventPriority(str, Enum):
    BAIXA = "baixa"
    NORMAL = "media"
    ALTA = "alta"
    URGENTE = "urgente"


class EventType(str, Enum):
    # Pedidos
    ORDER_CREATED = "ORDER_CREATED"
    ORDER_UPDATED = "ORDER_UPDATED"
    ORDER_SENT_TO_PRODUCTION = "ORDER_SENT_TO_PRODUCTION"
    ORDER_READY = "ORDER_READY"
    ORDER_CANCELLED = "ORDER_CANCELLED"

    # Produção
    PRODUCTION_ORDER_CREATED = "PRODUCTION_ORDER_CREATED"
    PRODUCTION_ORDER_UPDATED = "PRODUCTION_ORDER_UPDATED"
    PRODUCTION_ORDER_COMPLETED = "PRODUCTION_ORDER_COMPLETED"

    # Stock & Armazém
    STOCK_LOW = "STOCK_LOW"
    STOCK_CRITICAL = "STOCK_CRITICAL"
    STOCK_UPDATED = "STOCK_UPDATED"

    # Requisições
    REQUISITION_CREATED = "REQUISITION_CREATED"
    REQUISITION_APPROVED = "REQUISITION_APPROVED"
    REQUISITION_REJECTED = "REQUISITION_REJECTED"
    REQUISITION_MATERIAL_ALERT = "REQUISITION_MATERIAL_ALERT"

    # Logística
    DELIVERY_STARTED = "DELIVERY_STARTED"
    DELIVERY_COMPLETED = "DELIVERY_COMPLETED"
    DELIVERY_ISSUE = "DELIVERY_ISSUE"

    # Caixa / Financeiro
    CASH_OPENED = "CASH_OPENED"
    CASH_CLOSED = "CASH_CLOSED"

    # Eventos / Catering
    EVENT_CREATED = "EVENT_CREATED"
    EVENT_UPDATED = "EVENT_UPDATED"
    EVENT_UPCOMING = "EVENT_UPCOMING"
    PLANNING_COMPLETED = "PLANNING_COMPLETED"


class EntityType(str, Enum):
    PEDIDO = "PEDIDO"
    ORDEM_PRODUCAO = "ORDEM_PRODUCAO"
    STOCK = "STOCK"
    REQUISICAO = "REQUISICAO"
    LOGISTICA = "LOGISTICA"
    CAIXA = "CAIXA"
    EVENTO = "EVENTO"
    SISTEMA = "SISTEMA"


def generate_event_id() -> str:
    """Gera um identificador único para o evento com prefixo padronizado evt_"""
    return f"evt_{uuid.uuid4().hex}"


@dataclass
class NotificationConfig:
    enabled: bool = True
    title: str = ""
    message: str = ""
    tipo: str = "info"  # info, warning, success, error, alerta
    sound: bool = False
    persistent: bool = False
    channels: list = field(default_factory=lambda: ["WEBSOCKET"])


@dataclass
class DomainEvent:
    event_type: EventType
    entity_type: EntityType
    entity_id: Optional[int] = None
    aggregate_id: Optional[str] = None
    actor_user_id: Optional[int] = None
    event_id: str = field(default_factory=generate_event_id)
    timestamp: str = field(default_factory=lambda: datetime.utcnow().isoformat())
    priority: EventPriority = EventPriority.NORMAL
    notification: NotificationConfig = field(default_factory=NotificationConfig)
    data: Dict[str, Any] = field(default_factory=dict)
    sync_event_name: Optional[str] = None

    def __post_init__(self):
        if not self.aggregate_id and self.entity_type:
            ent = self.entity_type.value if hasattr(self.entity_type, 'value') else str(self.entity_type)
            self.aggregate_id = f"{ent}:{self.entity_id or 'NONE'}"

    def to_dict(self) -> Dict[str, Any]:
        ev_type = self.event_type.value if hasattr(self.event_type, 'value') else str(self.event_type)
        ent_type = self.entity_type.value if hasattr(self.entity_type, 'value') else str(self.entity_type)
        prio = self.priority.value if hasattr(self.priority, 'value') else str(self.priority)

        return {
            "event_id": self.event_id,
            "event_type": ev_type,
            "entity_type": ent_type,
            "entity_id": self.entity_id,
            "aggregate_id": self.aggregate_id,
            "actor_user_id": self.actor_user_id,
            "timestamp": self.timestamp,
            "priority": prio,
            "sync_event_name": self.sync_event_name,
            "notification": {
                "enabled": self.notification.enabled,
                "title": self.notification.title,
                "message": self.notification.message,
                "tipo": self.notification.tipo,
                "sound": self.notification.sound,
                "persistent": self.notification.persistent,
                "channels": self.notification.channels,
            },
            "data": self.data or {}
        }

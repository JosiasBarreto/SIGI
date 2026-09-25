from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class NotificationPayloadSchema(BaseModel):
    enabled: bool = True
    title: str = ""
    message: str = ""
    tipo: str = "info"
    sound: bool = False
    persistent: bool = False
    channels: List[str] = ["WEBSOCKET"]


class DomainEventSchema(BaseModel):
    event_id: str
    event_type: str
    entity_type: str
    entity_id: Optional[int] = None
    aggregate_id: str
    actor_user_id: Optional[int] = None
    timestamp: str
    priority: str = "media"
    notification: NotificationPayloadSchema
    data: Dict[str, Any] = Field(default_factory=dict)
    sync_event_name: Optional[str] = None


class NotificationOutSchema(BaseModel):
    id: Optional[int] = None
    event_id: str
    event_type: str
    titulo: str
    mensagem: str
    tipo: str
    canal: str
    prioridade: str
    persistente: bool
    created_at: str
    target_type: str
    target_user_id: Optional[int] = None
    target_role: Optional[str] = None
    data: Dict[str, Any] = Field(default_factory=dict)

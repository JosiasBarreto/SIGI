from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from app.notifications.events import EventType, DomainEvent


ROLE_ALIASES = {
    "admin": "administrador",
    "gerente": "administrador",
    "balcao": "atendimento",
}


@dataclass
class RecipientTarget:
    target_type: str  # "GLOBAL", "ROLE", "SECTOR", "USER"
    target_id: Optional[str] = None  # user_id string, role name, or sector name
    exclude_actor: bool = True


class NotificationPolicy:
    """
    Política central de encaminhamento de destinatários para cada tipo de evento.
    Garante o respeito a RBAC e impede que o autor da ação (Actor) receba
    notificações redundantes (já que recebe feedback direto da API/UI).
    """

    DEFAULT_POLICIES: Dict[str, List[RecipientTarget]] = {
        EventType.ORDER_CREATED.value: [
            RecipientTarget(target_type="ROLE", target_id="atendimento", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="balcao", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="cozinha", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="pastelaria", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="bar", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="admin", exclude_actor=True),
        ],
        EventType.ORDER_READY.value: [
            RecipientTarget(target_type="ROLE", target_id="atendimento", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="balcao", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="admin", exclude_actor=False),
        ],
        EventType.ORDER_UPDATED.value: [
            RecipientTarget(target_type="ROLE", target_id="atendimento", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="balcao", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=True),
        ],
        EventType.ORDER_CANCELLED.value: [
            RecipientTarget(target_type="ROLE", target_id="atendimento", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="balcao", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="cozinha", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="pastelaria", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=False),
        ],
        EventType.PRODUCTION_ORDER_CREATED.value: [
            RecipientTarget(target_type="ROLE", target_id="cozinha", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="pastelaria", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="bar", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="atendimento", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=False),
        ],
        EventType.PRODUCTION_ORDER_UPDATED.value: [
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=False),
        ],
        EventType.PRODUCTION_ORDER_COMPLETED.value: [
            RecipientTarget(target_type="ROLE", target_id="atendimento", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="balcao", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=False),
        ],
        EventType.STOCK_CRITICAL.value: [
            RecipientTarget(target_type="ROLE", target_id="armazem", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="armazém", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=False),
        ],
        EventType.STOCK_LOW.value: [
            RecipientTarget(target_type="ROLE", target_id="armazem", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=False),
        ],
        EventType.REQUISITION_CREATED.value: [
            RecipientTarget(target_type="ROLE", target_id="armazem", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="controlador_de_materiais", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=True),
        ],
        EventType.REQUISITION_APPROVED.value: [
            RecipientTarget(target_type="ROLE", target_id="armazem", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="controlador_de_materiais", exclude_actor=False),
        ],
        EventType.REQUISITION_REJECTED.value: [
            RecipientTarget(target_type="ROLE", target_id="armazem", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="controlador_de_materiais", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=False),
        ],
        EventType.REQUISITION_UPDATED.value: [
            RecipientTarget(target_type="ROLE", target_id="armazem", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="controlador_de_materiais", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=False),
        ],
        EventType.REQUISITION_MATERIAL_ALERT.value: [
            RecipientTarget(target_type="ROLE", target_id="armazem", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="controlador_de_materiais", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=False),
        ],
        EventType.DELIVERY_STARTED.value: [
            RecipientTarget(target_type="ROLE", target_id="balcao", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=True),
        ],
        EventType.DELIVERY_COMPLETED.value: [
            RecipientTarget(target_type="ROLE", target_id="balcao", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=False),
        ],
        EventType.CASH_CLOSED.value: [
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=False),
        ],
        EventType.EVENT_UPCOMING.value: [
            RecipientTarget(target_type="ROLE", target_id="gerente", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="balcao", exclude_actor=False),
            RecipientTarget(target_type="ROLE", target_id="cozinha", exclude_actor=False),
        ],
        EventType.EVENT_CREATED.value: [
            RecipientTarget(target_type="ROLE", target_id="atendimento", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=True),
        ],
        EventType.EVENT_UPDATED.value: [
            RecipientTarget(target_type="ROLE", target_id="atendimento", exclude_actor=True),
            RecipientTarget(target_type="ROLE", target_id="administrador", exclude_actor=True),
        ],
    }

    @classmethod
    def get_targets_for_event(cls, event: DomainEvent) -> List[RecipientTarget]:
        """
        Retorna a lista de alvos configurados para o evento.
        Se houver alvos dinâmicos no payload data (ex: target_user_id ou target_sector),
        adiciona-os com prioridade.
        """
        ev_type = event.event_type.value if hasattr(event.event_type, 'value') else str(event.event_type)
        targets = list(cls.DEFAULT_POLICIES.get(ev_type, []))

        # Canonicalize legacy policy names to roles that exist in RoleEnum.
        normalized_targets: List[RecipientTarget] = []
        target_indexes: Dict[tuple, int] = {}
        for target in targets:
            if target.target_type != "ROLE" or not target.target_id:
                normalized_targets.append(target)
                continue
            role_id = target.target_id.lower().strip().replace(" ", "_")
            role_id = ROLE_ALIASES.get(role_id, role_id)
            if role_id in {"bar"}:
                continue
            key = (target.target_type, role_id)
            if key in target_indexes:
                index = target_indexes[key]
                normalized_targets[index].exclude_actor &= target.exclude_actor
                continue
            target_indexes[key] = len(normalized_targets)
            normalized_targets.append(RecipientTarget(
                target_type="ROLE",
                target_id=role_id,
                exclude_actor=target.exclude_actor,
            ))
        targets = normalized_targets

        # Adicionar alvo de utilizador específico se fornecido
        if "target_user_id" in event.data and event.data["target_user_id"]:
            targets.append(RecipientTarget(
                target_type="USER",
                target_id=str(event.data["target_user_id"]),
                exclude_actor=False
            ))

        # Adicionar alvo de setores específicos se fornecidos
        if "sectores" in event.data and isinstance(event.data["sectores"], list):
            for sec in event.data["sectores"]:
                sec_str = sec.value if hasattr(sec, 'value') else str(sec)
                targets.append(RecipientTarget(
                    target_type="SECTOR",
                    target_id=sec_str.lower().strip(),
                    exclude_actor=True
                ))

        return targets

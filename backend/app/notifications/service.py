import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

from app.notifications.events import (
    DomainEvent,
    EventType,
    EntityType,
    EventPriority,
    NotificationConfig,
    generate_event_id
)
from app.notifications.policies import NotificationPolicy, RecipientTarget
from app.notifications.deduplication import deduplicator
from app.notifications.repository import NotificationRepository

logger = logging.getLogger(__name__)


class NotificationService:
    """
    Serviço centralizado de Eventos e Notificações do SIGI ERP.
    Garante a estrita separação entre:
    1. Eventos técnicos de sincronização (KDS, tabelas, dashboards);
    2. Notificações visuais destinas a utilizadores (toasts, central de notificações);
    3. Idempotência e desduplicação rigorosa;
    4. Políticas de destinatários (RBAC) e exclusão do Actor (quem fez a ação).
    """

    @classmethod
    def publish(cls, event: DomainEvent) -> Dict[str, Any]:
        """
        Publica um DomainEvent, orquestrando sincronização, deduplicação,
        persistência e notificação visual seletiva.
        """
        from app.websocket.socket_manager import (
            emit_sync_event,
            emit_user_notification
        )

        ev_type_str = event.event_type.value if hasattr(event.event_type, 'value') else str(event.event_type)
        ent_type_str = event.entity_type.value if hasattr(event.entity_type, 'value') else str(event.entity_type)
        priority_str = event.priority.value if hasattr(event.priority, 'value') else str(event.priority)

        # ---------------------------------------------------------
        # 1. EMISSÃO DE EVENTO TÉCNICO DE SINCRONIZAÇÃO (Se configurado)
        # ---------------------------------------------------------
        # Estes eventos destinam-se a atualizar tabelas, React Query, KDS, etc.
        # NÃO DEVEM gerar toasts na UI.
        if event.sync_event_name:
            sync_payload = {
                "event_id": event.event_id,
                "event_type": ev_type_str,
                "entity_type": ent_type_str,
                "entity_id": event.entity_id,
                "aggregate_id": event.aggregate_id,
                "timestamp": event.timestamp,
                "data": event.data or {}
            }
            # Se payload tiver dados do modelo diretamente, mesclar para manter compatibilidade
            if event.data:
                sync_payload.update(event.data)

            emit_sync_event(event.sync_event_name, sync_payload)
            logger.debug(f"[SYNC EVENT EMITTED] {event.sync_event_name} - {event.aggregate_id}")

        # Se notificações visuais estiverem desativadas para este evento, termina aqui
        if not event.notification or not event.notification.enabled:
            return {"status": "synced_only", "event_id": event.event_id}

        # ---------------------------------------------------------
        # 2. VERIFICAÇÃO DE IDEMPOTÊNCIA / DESDUPLICAÇÃO
        # ---------------------------------------------------------
        discriminator = None
        if "novo_estado" in event.data:
            discriminator = str(event.data["novo_estado"])
        elif "sector" in event.data:
            discriminator = str(event.data["sector"])

        idempotency_key = deduplicator.generate_idempotency_key(
            ev_type_str,
            event.aggregate_id or f"{ent_type_str}:{event.entity_id}",
            discriminator
        )

        if deduplicator.is_duplicate(idempotency_key, event.event_id):
            logger.info(f"[DEDUPLICATED] Evento redundante ignorado: {idempotency_key}")
            return {"status": "deduplicated", "key": idempotency_key}

        # ---------------------------------------------------------
        # 3. DETERMINAÇÃO DE DESTINATÁRIOS (POLÍTICA RBAC)
        # ---------------------------------------------------------
        targets = NotificationPolicy.get_targets_for_event(event)
        published_targets = []

        notif_cfg = event.notification
        canal = ent_type_str if ent_type_str in ["PEDIDO", "PRODUCAO", "STOCK", "FINANCEIRO"] else "SISTEMA"

        # ---------------------------------------------------------
        # 4. PERSISTÊNCIA E EMISSÃO SELETIVA POR DESTINATÁRIO
        # ---------------------------------------------------------
        # Para evitar spam, cria um registo persistido consolidado e emite apenas
        # para as rooms apropriadas, excluindo a room do próprio utilizador que executou a ação.
        actor_id_str = str(event.actor_user_id) if event.actor_user_id else None

        # Determinar tipo de alvo para persistência:
        # Eventos operacionais do sistema devem ser GLOBAL para que fiquem no histórico do ERP
        # acessível a todos os operadores autorizados. Apenas notificações privadas de utilizador são USER.
        is_single_user = len(targets) == 1 and targets[0].target_type == "USER"
        primary_target_type = "USER" if is_single_user else "GLOBAL"
        primary_target_user_id = int(targets[0].target_id) if is_single_user and targets[0].target_id else None
        primary_target_role = targets[0].target_id if (len(targets) == 1 and targets[0].target_type == "ROLE") else None

        # Persistir primeiro o registo canónico no banco de dados
        created_notif = NotificationRepository.create_notification(
            event_id=event.event_id,
            event_type=ev_type_str,
            entity_type=ent_type_str,
            entity_id=event.entity_id,
            aggregate_id=event.aggregate_id or f"{ent_type_str}:{event.entity_id}",
            titulo=notif_cfg.title,
            mensagem=notif_cfg.message,
            tipo=notif_cfg.tipo,
            canal=canal,
            prioridade=priority_str,
            persistente=notif_cfg.persistent,
            target_type=primary_target_type,
            target_role=primary_target_role,
            target_user_id=primary_target_user_id,
            actor_user_id=event.actor_user_id,
            metadados={
                **event.data,
                "event_id": event.event_id,
                "event_type": ev_type_str,
                "actor_user_id": event.actor_user_id
            }
        )

        notif_db_id = created_notif.id if created_notif else None

        visual_payload = {
            "id": notif_db_id,
            "event_id": event.event_id,
            "event_type": ev_type_str,
            "entity_type": ent_type_str,
            "entity_id": event.entity_id,
            "aggregate_id": event.aggregate_id,
            "actor_user_id": event.actor_user_id,
            "titulo": notif_cfg.title,
            "mensagem": notif_cfg.message,
            "tipo": notif_cfg.tipo,
            "canal": canal,
            "prioridade": priority_str,
            "persistente": notif_cfg.persistent,
            "created_at": event.timestamp,
            "data": event.data or {}
        }

        # Emitir seletivamente para cada target
        rooms_emitted = set()

        for target in targets:
            # Excluir o Actor se a política definir exclude_actor
            if target.exclude_actor and actor_id_str and target.target_type == "USER" and str(target.target_id) == actor_id_str:
                logger.debug(f"[ACTOR EXCLUDED] Não enviando notificação para o próprio actor: {actor_id_str}")
                continue

            room_name = None
            if target.target_type == "USER" and target.target_id:
                room_name = f"user_{target.target_id}"
            elif target.target_type == "ROLE" and target.target_id:
                role_slug = target.target_id.lower().replace(" ", "_")
                room_name = f"role_{role_slug}"
            elif target.target_type == "SECTOR" and target.target_id:
                sec_slug = target.target_id.lower().replace(" ", "_")
                room_name = f"sector_{sec_slug}"
            elif target.target_type == "GLOBAL":
                room_name = "global_notifications"

            if room_name and room_name not in rooms_emitted:
                emit_user_notification(visual_payload, room=room_name, exclude_user_id=actor_id_str if target.exclude_actor else None)
                rooms_emitted.add(room_name)
                published_targets.append(room_name)

        logger.info(f"[NOTIFICATION PUBLISHED] Event: {ev_type_str} ({event.event_id}) -> Rooms: {list(rooms_emitted)}")
        return {
            "status": "published",
            "event_id": event.event_id,
            "notif_id": notif_db_id,
            "rooms": list(rooms_emitted)
        }

    # =========================================================================
    # CONVENIENCE DOMAIN METHODS (Chamados pelos services de negócio)
    # =========================================================================

    @classmethod
    def publish_order_created(
        cls,
        pedido_id: int,
        pedido_numero: str,
        total: float,
        cliente_nome: Optional[str] = None,
        produtos_resumo: Optional[str] = None,
        actor_user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Publica a criação de um pedido:
        - Emite evento de sincronização 'novo_pedido' (para recarregar tabelas);
        - Emite notificação visual 'Novo Pedido' apenas para outros utilizadores (excluindo o Actor).
        """
        cli_str = cliente_nome or "Consumidor Final"
        prod_str = produtos_resumo or "Sem artigos detalhados"

        titulo = f"Novo Pedido #{pedido_numero}"
        mensagem = (
            f"Pedido #{pedido_numero} registado com sucesso.\n"
            f"• Cliente: {cli_str}\n"
            f"• Produtos: {prod_str}\n"
            f"• Total: {float(total or 0):.2f} €"
        )

        data = {
            "pedido_id": pedido_id,
            "numero": pedido_numero,
            "cliente": cli_str,
            "produtos": prod_str,
            "total": float(total or 0),
            "origem": "novo_pedido"
        }

        event = DomainEvent(
            event_type=EventType.ORDER_CREATED,
            entity_type=EntityType.PEDIDO,
            entity_id=pedido_id,
            aggregate_id=f"PEDIDO:{pedido_id}",
            actor_user_id=actor_user_id,
            priority=EventPriority.NORMAL,
            sync_event_name="novo_pedido",
            notification=NotificationConfig(
                enabled=True,
                title=titulo,
                message=mensagem,
                tipo="info",
                persistent=False
            ),
            data=data
        )

        return cls.publish(event)

    @classmethod
    def publish_order_status_updated(
        cls,
        pedido_id: int,
        pedido_numero: str,
        antigo_estado: str,
        novo_estado: str,
        total: float = 0.0,
        cliente_nome: Optional[str] = None,
        produtos_resumo: Optional[str] = None,
        actor_user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Publica a mudança de estado de um pedido.
        """
        cli_str = cliente_nome or "Consumidor Final"
        prod_str = produtos_resumo or "Sem artigos detalhados"

        tipo = "info"
        prioridade = EventPriority.NORMAL
        novo_upper = str(novo_estado).upper()

        if "PRONTO" in novo_upper:
            tipo = "success"
            prioridade = EventPriority.ALTA
            titulo = f"Pedido #{pedido_numero}: Pronto para Levantamento"
        elif "ENTREGUE" in novo_upper or "CONCLUIDO" in novo_upper:
            tipo = "success"
            prioridade = EventPriority.NORMAL
            titulo = f"Pedido #{pedido_numero}: Entregue"
        elif "CANCELADO" in novo_upper:
            tipo = "error"
            prioridade = EventPriority.URGENTE
            titulo = f"Pedido #{pedido_numero}: Cancelado"
        elif "PRODUCAO" in novo_upper:
            tipo = "info"
            prioridade = EventPriority.ALTA
            titulo = f"Pedido #{pedido_numero}: Em Confeção"
        else:
            titulo = f"Pedido #{pedido_numero}: {novo_estado}"

        mensagem = (
            f"O estado do Pedido #{pedido_numero} foi alterado para '{novo_estado}'.\n"
            f"• Cliente: {cli_str}\n"
            f"• Produtos: {prod_str}\n"
            f"• Transição: {antigo_estado} ➔ {novo_estado}"
        )

        data = {
            "pedido_id": pedido_id,
            "numero": pedido_numero,
            "cliente": cli_str,
            "produtos": prod_str,
            "antigo_estado": antigo_estado,
            "novo_estado": novo_estado,
            "total": float(total or 0),
            "origem": "pedido_atualizado"
        }

        event = DomainEvent(
            event_type=EventType.ORDER_READY if "PRONTO" in novo_upper else (
                EventType.ORDER_CANCELLED if "CANCELADO" in novo_upper else EventType.ORDER_UPDATED
            ),
            entity_type=EntityType.PEDIDO,
            entity_id=pedido_id,
            aggregate_id=f"PEDIDO:{pedido_id}",
            actor_user_id=actor_user_id,
            priority=prioridade,
            sync_event_name="pedido_atualizado",
            notification=NotificationConfig(
                enabled=True,
                title=titulo,
                message=mensagem,
                tipo=tipo,
                persistent=False
            ),
            data=data
        )

        return cls.publish(event)

    @classmethod
    def publish_production_orders(
        cls,
        pedido_id: int,
        pedido_numero: str,
        sectores: List[Any],
        cliente_nome: Optional[str] = None,
        produtos_resumo: Optional[str] = None,
        actor_user_id: Optional[int] = None,
        emit_visual_notification: bool = True
    ) -> Dict[str, Any]:
        """
        Publica a emissão de ordens de produção:
        - Sincronização 'nova_ordem_producao' para KDS;
        - Notificação visual opcional (suprimida se estiver no mesmo fluxo de criação de pedido para não duplicar).
        """
        sectores_limpos = []
        for s in (sectores or []):
            s_val = s.value if hasattr(s, 'value') else str(s)
            if s_val and s_val not in sectores_limpos:
                sectores_limpos.append(s_val)

        sectores_str = ", ".join(sectores_limpos) if sectores_limpos else "Cozinha"
        cli_str = cliente_nome or "Consumidor Final"
        prod_str = produtos_resumo or "Sem artigos detalhados"

        titulo = f"Nova Produção: Pedido #{pedido_numero}"
        mensagem = (
            f"Ordens de produção geradas para os sectores: {sectores_str}.\n"
            f"• Pedido: #{pedido_numero}\n"
            f"• Cliente: {cli_str}\n"
            f"• Artigos a Confecionar: {prod_str}"
        )

        data = {
            "pedido_id": pedido_id,
            "numero": pedido_numero,
            "cliente": cli_str,
            "produtos": prod_str,
            "sectores": sectores_limpos,
            "titulo": titulo,
            "mensagem": mensagem,
            "origem": "nova_ordem_producao"
        }

        event = DomainEvent(
            event_type=EventType.PRODUCTION_ORDER_CREATED,
            entity_type=EntityType.ORDEM_PRODUCAO,
            entity_id=pedido_id,
            aggregate_id=f"PEDIDO:{pedido_id}",
            actor_user_id=actor_user_id,
            priority=EventPriority.ALTA,
            sync_event_name="nova_ordem_producao",
            notification=NotificationConfig(
                enabled=emit_visual_notification,
                title=titulo,
                message=mensagem,
                tipo="info",
                persistent=False
            ),
            data=data
        )

        return cls.publish(event)

    @classmethod
    def publish_production_status_updated(
        cls,
        ordem_id: int,
        ordem_numero: str,
        pedido_numero: str,
        sector: str,
        antigo_estado: str,
        novo_estado: str,
        cliente_nome: Optional[str] = None,
        produtos_resumo: Optional[str] = None,
        actor_user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Publica a atualização de estado de uma ordem de produção setorial (KDS).
        """
        cli_str = cliente_nome or "Consumidor Final"
        prod_str = produtos_resumo or "Sem artigos detalhados"

        tipo = "info"
        prioridade = EventPriority.NORMAL
        novo_upper = str(novo_estado).upper()

        if "PRONTO" in novo_upper or "CONCLUIDO" in novo_upper:
            tipo = "success"
            prioridade = EventPriority.ALTA
            titulo = f"Produção ({sector}) #{ordem_numero}: Concluída"
            sync_event = "producao_concluida"
        elif "PRODUCAO" in novo_upper:
            tipo = "info"
            prioridade = EventPriority.NORMAL
            titulo = f"Produção ({sector}) #{ordem_numero}: Em Preparação"
            sync_event = "producao_iniciada"
        else:
            titulo = f"Produção ({sector}) #{ordem_numero}: {novo_estado}"
            sync_event = "ordem_producao_atualizada"

        mensagem = (
            f"A ordem de produção #{ordem_numero} ({sector}) passou para '{novo_estado}'.\n"
            f"• Pedido: #{pedido_numero}\n"
            f"• Cliente: {cli_str}\n"
            f"• Artigos: {prod_str}\n"
            f"• Transição: {antigo_estado} ➔ {novo_estado}"
        )

        data = {
            "ordem_id": ordem_id,
            "ordem_numero": ordem_numero,
            "pedido_numero": pedido_numero,
            "sector": sector,
            "cliente": cli_str,
            "produtos": prod_str,
            "antigo_estado": antigo_estado,
            "novo_estado": novo_estado,
            "origem": "ordem_producao_atualizada"
        }

        event = DomainEvent(
            event_type=EventType.PRODUCTION_ORDER_COMPLETED if "PRONTO" in novo_upper else EventType.PRODUCTION_ORDER_UPDATED,
            entity_type=EntityType.ORDEM_PRODUCAO,
            entity_id=ordem_id,
            aggregate_id=f"ORDEM:{ordem_id}",
            actor_user_id=actor_user_id,
            priority=prioridade,
            sync_event_name=sync_event,
            notification=NotificationConfig(
                enabled=True,
                title=titulo,
                message=mensagem,
                tipo=tipo,
                persistent=False
            ),
            data=data
        )

        return cls.publish(event)

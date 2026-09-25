#backend/app/websocket/socket_manager.py
import logging
from typing import Dict, Set, Optional, List, Any
from flask import request, current_app
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
import jwt
import os
from datetime import datetime

logger = logging.getLogger(__name__)

# Single instance of SocketIO
# Allowing CORS broadly for local dev, IP access (e.g. 192.168.100.141), and configured ports
socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode="threading",
    logger=False,
    engineio_logger=False
)

# Connection Manager state
# Maps user_id (str) -> set of socket session IDs (sids)
_active_user_connections: Dict[str, Set[str]] = {}
# Maps sid -> user_id
_sid_to_user: Dict[str, str] = {}
# Maps sid -> user_role
_sid_to_role: Dict[str, str] = {}


class WebSocketUpgradeMiddleware:
    """
    Middleware WSGI que intercepta pedidos de upgrade WebSocket no servidor Werkzeug
    garantindo que status_set não seja nulo, prevenindo 'AssertionError: write() before start_response'.
    """
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        status_called = [False]

        def custom_start_response(status, response_headers, exc_info=None):
            status_called[0] = True
            return start_response(status, response_headers, exc_info)

        app_iter = self.wsgi_app(environ, custom_start_response)

        # Se o pedido foi um upgrade WebSocket e o backend fez hijack do socket sem start_response
        if not status_called[0] and environ.get("HTTP_UPGRADE", "").lower() == "websocket":
            try:
                start_response("101 Switching Protocols", [("Upgrade", "websocket"), ("Connection", "Upgrade")])
            except Exception:
                pass

        return app_iter


def _get_jwt_secret() -> str:
    return os.getenv("JWT_SECRET_KEY", "sigi_erp_secret_key_change_in_production")


def is_redis_available(redis_url: str) -> bool:
    """
    Checks if Redis server is reachable within a strict short timeout.
    Prevents thread hangs and infinite 'Cannot publish to redis' retry loops
    when Redis is configured in .env but the daemon is not running locally.
    """
    if not redis_url or not redis_url.startswith(("redis://", "rediss://")):
        return False
    try:
        import redis
        client = redis.from_url(redis_url, socket_timeout=0.6, socket_connect_timeout=0.6)
        client.ping()
        return True
    except Exception as e:
        logger.warning(f"[WEBSOCKET] Redis configured at {redis_url} is unreachable ({e}). Fallback to in-memory threading.")
        return False


def authenticate_socket_token(auth_data: Optional[dict] = None) -> Optional[dict]:
    """
    Validates JWT token passed via Socket.IO connection auth payload, query string, or headers.
    Returns decoded token payload if valid, None otherwise.
    """
    token = None

    # 1. Check auth dictionary from socket handshake
    if auth_data and isinstance(auth_data, dict):
        token = auth_data.get("token") or auth_data.get("Authorization")

    # 2. Check query string
    if not token and hasattr(request, "args"):
        token = request.args.get("token")

    # 3. Check HTTP headers
    if not token and hasattr(request, "headers"):
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return None

    if token.startswith("Bearer "):
        token = token.split(" ")[1]

    try:
        payload = jwt.decode(token, _get_jwt_secret(), algorithms=["HS256"])
        return payload
    except Exception as e:
        logger.debug(f"WebSocket authentication check: {str(e)}")
        return None


@socketio.on("connect")
def handle_connect(auth=None):
    """
    Handles new WebSocket connection with JWT authentication and room assignment
    (user room, role room, and global notifications).
    """
    sid = request.sid
    payload = authenticate_socket_token(auth)
    
    user_id = None
    role = None

    if payload:
        user_id = str(payload.get("sub") or payload.get("user_id") or payload.get("id"))
        role = str(payload.get("role") or "").strip()

    if user_id:
        if user_id not in _active_user_connections:
            _active_user_connections[user_id] = set()
        _active_user_connections[user_id].add(sid)
        _sid_to_user[sid] = user_id

        # Personal user room
        join_room(f"user_{user_id}")

        # Role room (e.g. role_cozinha, role_pastelaria, role_administrador)
        if role:
            _sid_to_role[sid] = role
            role_slug = role.lower().replace(" ", "_")
            join_room(f"role_{role_slug}")
            
            # Normalizar acentos para garantir entrega de notificações (ex: armazém -> armazem)
            normalized_slug = role.lower().replace(" ", "_").replace("á", "a").replace("ã", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u").replace("ç", "c")
            if normalized_slug != role_slug:
                join_room(f"role_{normalized_slug}")

            # Entrar também na room de setor correspondente para ecrãs de produção
            if normalized_slug in ["cozinha", "pastelaria", "bar", "armazem"]:
                join_room(f"sector_{normalized_slug}")

            logger.info(f"WebSocket authenticated - User: {user_id}, Role: {role}, SID: {sid}")
        else:
            logger.info(f"WebSocket authenticated - User: {user_id}, SID: {sid}")
    else:
        logger.debug(f"WebSocket anonymous client connected - SID: {sid}")

    # Always join global notifications room
    join_room("global_notifications")


@socketio.on("disconnect")
def handle_disconnect():
    """
    Handles WebSocket disconnection with full resource cleanup.
    """
    sid = request.sid
    user_id = _sid_to_user.pop(sid, None)
    role = _sid_to_role.pop(sid, None)

    if user_id and user_id in _active_user_connections:
        _active_user_connections[user_id].discard(sid)
        if not _active_user_connections[user_id]:
            del _active_user_connections[user_id]
        leave_room(f"user_{user_id}")

    if role:
        role_slug = role.lower().replace(" ", "_")
        leave_room(f"role_{role_slug}")

    leave_room("global_notifications")
    logger.debug(f"WebSocket disconnected - SID: {sid}, User: {user_id or 'anonymous'}")


@socketio.on("ping_server")
def handle_ping():
    """Heartbeat / Liveness check"""
    emit("pong_client", {"status": "ok"})


def send_notification(
    utilizador_id: Optional[Any] = None,
    mensagem: str = "",
    titulo: str = "Notificação",
    tipo: str = "info",
    dados_extra: Optional[dict] = None,
    canal: str = "SISTEMA",
    prioridade: str = "media",
    persistente: bool = False,
    role: Optional[str] = None,
    sector: Optional[str] = None
) -> bool:
    """
    Envia uma notificação em tempo real via WebSocket para o destinatário apropriado:
    - Se utilizador_id for fornecido: envia para room 'user_{id}'
    - Se role for fornecida: envia para room 'role_{role_slug}'
    - Se sector for fornecido: envia para room 'sector_{sector_slug}'
    - Caso contrário: faz broadcast na room 'global_notifications'
    """
    payload = {
        "titulo": titulo,
        "mensagem": mensagem,
        "tipo": tipo,
        "canal": canal,
        "prioridade": prioridade,
        "persistente": persistente,
        "data": dados_extra or {}
    }

    try:
        if utilizador_id:
            room = f"user_{str(utilizador_id)}"
            socketio.emit("notificacao", payload, room=room)
        elif role:
            room = f"role_{role.lower().replace(' ', '_')}"
            socketio.emit("notificacao", payload, room=room)
        elif sector:
            room = f"sector_{sector.lower().replace(' ', '_')}"
            socketio.emit("notificacao", payload, room=room)
        else:
            socketio.emit("notificacao", payload, room="global_notifications")
        return True
    except Exception as e:
        logger.error(f"Erro ao emitir notificação WebSocket: {str(e)}")
        return False


def emit_sync_event(event_name: str, payload: dict, room: Optional[str] = None) -> bool:
    """
    Emite evento técnico de sincronização de dados (tabelas, KDS, React Query, cache).
    NÃO se destina a gerar toasts visuais na interface.
    """
    try:
        if room:
            socketio.emit(event_name, payload, room=room)
        else:
            socketio.emit(event_name, payload)
        return True
    except Exception as e:
        logger.error(f"Erro ao emitir evento de sincronização '{event_name}': {e}")
        return False


def emit_user_notification(payload: dict, room: Optional[str] = None, exclude_user_id: Optional[str] = None) -> bool:
    """
    Emite evento de notificação visual ('notificacao') direcionado à room apropriada.
    """
    try:
        target_room = room or "global_notifications"
        socketio.emit("notificacao", payload, room=target_room)
        return True
    except Exception as e:
        logger.error(f"Erro ao emitir notificação visual WebSocket: {e}")
        return False


def format_products_summary(itens: Any) -> str:
    """Extrai uma string limpa e condensada com a lista de produtos e respetivas quantidades"""
    if not itens:
        return "Sem artigos detalhados"

    produtos_str = []
    try:
        for it in (itens or []):
            if isinstance(it, dict):
                nome = it.get('descricao') or it.get('nome')
                if not nome and it.get('produto'):
                    prod = it.get('produto')
                    nome = prod.get('nome') if isinstance(prod, dict) else getattr(prod, 'nome', None)
                qtd = it.get('quantidade', 1)
            else:
                prod = getattr(it, 'produto', None)
                nome = getattr(prod, 'nome', None) if prod else getattr(it, 'descricao', None)
                qtd = getattr(it, 'quantidade', 1)

            try:
                qtd_formatada = f"{float(qtd):g}"
            except Exception:
                qtd_formatada = "1"

            produtos_str.append(f"{nome or 'Artigo'} ({qtd_formatada}x)")
    except Exception:
        return "Artigos do Pedido"

    return ", ".join(produtos_str) if produtos_str else "Sem artigos detalhados"


def notify_order_created(
    pedido_id: int, 
    pedido_numero: str, 
    total: float = 0.0, 
    cliente_nome: Optional[str] = None,
    produtos_resumo: Optional[str] = None,
    actor_user_id: Optional[int] = None
) -> bool:
    """
    Notifica a criação de um novo pedido comercial delegando ao NotificationService.
    Garante emissão do evento de sincronização 'novo_pedido' e notificação visual desduplicada.
    """
    try:
        from app.notifications.service import NotificationService
        res = NotificationService.publish_order_created(
            pedido_id=pedido_id,
            pedido_numero=pedido_numero,
            total=total,
            cliente_nome=cliente_nome,
            produtos_resumo=produtos_resumo,
            actor_user_id=actor_user_id
        )
        return res.get("status") in ["published", "synced_only", "deduplicated"]
    except Exception as e:
        logger.error(f"Erro ao notificar novo pedido: {str(e)}")
        # Fallback de emergência para manter sincronização
        try:
            socketio.emit("novo_pedido", {
                "pedido_id": pedido_id,
                "numero": pedido_numero,
                "total": float(total or 0)
            })
        except Exception:
            pass
        return False


def notify_order_status_updated(
    pedido_id: int,
    pedido_numero: str,
    antigo_estado: str,
    novo_estado: str,
    cliente_nome: Optional[str] = None,
    produtos_resumo: Optional[str] = None,
    total: float = 0.0,
    actor_user_id: Optional[int] = None
) -> bool:
    """
    Notifica a alteração de estado do pedido delegando ao NotificationService.
    """
    try:
        from app.notifications.service import NotificationService
        res = NotificationService.publish_order_status_updated(
            pedido_id=pedido_id,
            pedido_numero=pedido_numero,
            antigo_estado=antigo_estado,
            novo_estado=novo_estado,
            total=total,
            cliente_nome=cliente_nome,
            produtos_resumo=produtos_resumo,
            actor_user_id=actor_user_id
        )
        return res.get("status") in ["published", "synced_only", "deduplicated"]
    except Exception as e:
        logger.error(f"Erro ao notificar alteração de estado do pedido: {str(e)}")
        try:
            socketio.emit("pedido_atualizado", {
                "pedido_id": pedido_id,
                "numero": pedido_numero,
                "antigo_estado": antigo_estado,
                "novo_estado": novo_estado
            })
        except Exception:
            pass
        return False


def notify_production_orders(
    pedido_id: int, 
    pedido_numero: str, 
    sectores: List[Any],
    cliente_nome: Optional[str] = None,
    produtos_resumo: Optional[str] = None,
    actor_user_id: Optional[int] = None,
    emit_visual_notification: bool = True
) -> bool:
    """
    Notifica a geração de ordens de produção delegando ao NotificationService.
    """
    try:
        from app.notifications.service import NotificationService
        res = NotificationService.publish_production_orders(
            pedido_id=pedido_id,
            pedido_numero=pedido_numero,
            sectores=sectores,
            cliente_nome=cliente_nome,
            produtos_resumo=produtos_resumo,
            actor_user_id=actor_user_id,
            emit_visual_notification=emit_visual_notification
        )
        return res.get("status") in ["published", "synced_only", "deduplicated"]
    except Exception as e:
        logger.error(f"Erro ao notificar ordens de produção via WebSocket: {str(e)}")
        return False


def notify_production_status_updated(
    ordem_id: int,
    ordem_numero: str,
    pedido_numero: str,
    sector: str,
    antigo_estado: str,
    novo_estado: str,
    cliente_nome: Optional[str] = None,
    produtos_resumo: Optional[str] = None,
    actor_user_id: Optional[int] = None
) -> bool:
    """
    Notifica a evolução de uma ordem de fabrico delegando ao NotificationService.
    """
    try:
        from app.notifications.service import NotificationService
        res = NotificationService.publish_production_status_updated(
            ordem_id=ordem_id,
            ordem_numero=ordem_numero,
            pedido_numero=pedido_numero,
            sector=sector,
            antigo_estado=antigo_estado,
            novo_estado=novo_estado,
            cliente_nome=cliente_nome,
            produtos_resumo=produtos_resumo,
            actor_user_id=actor_user_id
        )
        return res.get("status") in ["published", "synced_only", "deduplicated"]
    except Exception as e:
        logger.error(f"Erro ao emitir notificação de ordem de produção: {str(e)}")
        return False


def emit_notification_read(notificacao_id: int, user_id: int, lido_em: str) -> None:
    """Emite evento de atualização em tempo real indicando que a notificação foi lida"""
    try:
        socketio.emit("notificacao_lida", {
            "notificacao_id": notificacao_id,
            "user_id": user_id,
            "lido_em": lido_em
        })
    except Exception as e:
        logger.debug(f"Erro ao emitir notificacao_lida: {e}")


def emit_notification_deactivated(notificacao_id: int) -> None:
    """Emite evento indicando que a notificação foi desativada / arquivada"""
    try:
        socketio.emit("notificacao_desativada", {
            "notificacao_id": notificacao_id
        })
    except Exception as e:
        logger.debug(f"Erro ao emitir notificacao_desativada: {e}")


def emit_sms_dispatched(sms_data: dict) -> None:
    """Emite evento quando um SMS/WhatsApp é enviado ou seu status é alterado"""
    try:
        socketio.emit("sms_atualizada", sms_data)
    except Exception as e:
        logger.debug(f"Erro ao emitir sms_atualizada: {e}")


def get_active_connections_count() -> int:
    """Retorna total de conexões autenticadas ativas."""
    return sum(len(sids) for sids in _active_user_connections.values())


def get_connected_users_count() -> int:
    """Retorna o número de utilizadores distintos conectados."""
    return len(_active_user_connections)

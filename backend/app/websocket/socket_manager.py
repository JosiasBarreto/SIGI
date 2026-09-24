#backend/app/websocket/socket_manager.py
import logging
from typing import Dict, Set, Optional, List, Any
from flask import request, current_app
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
import jwt
import os

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


def notify_production_orders(pedido_id: int, pedido_numero: str, sectores: List[str]) -> bool:
    """
    Notifica a geração de novas ordens de produção para os setores e operadores.
    Emite os eventos WebSocket 'nova_ordem_producao', 'alerta_producao' e 'notificacao'
    e persiste a notificação na base de dados para Cozinha e Pastelaria.
    """
    sectores_str = ", ".join(sectores) if sectores else "Geral"
    titulo = f"Nova Produção: Pedido #{pedido_numero}"
    mensagem = f"Ordens de produção geradas para o Pedido #{pedido_numero} nos sectores: {sectores_str}."

    payload = {
        "pedido_id": pedido_id,
        "numero": pedido_numero,
        "sectores": sectores,
        "titulo": titulo,
        "mensagem": mensagem
    }

    try:
        # 1. Eventos específicos de produção (consumidos por componentes de produção)
        socketio.emit("nova_ordem_producao", payload)
        socketio.emit("alerta_producao", {
            "msg": mensagem,
            "pedido_id": pedido_id,
            "numero": pedido_numero,
            "sectores": sectores
        })

        # 2. Notificação geral para salas de setores específicos
        for s in (sectores or []):
            s_slug = s.lower().replace(" ", "_")
            socketio.emit("notificacao", {
                "titulo": titulo,
                "mensagem": mensagem,
                "tipo": "alerta",
                "canal": "PRODUCAO",
                "prioridade": "alta",
                "persistente": True,
                "data": payload
            }, room=f"role_{s_slug}")

        # 3. Notificação global para todos os utilizadores ativos
        socketio.emit("notificacao", {
            "titulo": titulo,
            "mensagem": mensagem,
            "tipo": "alerta",
            "canal": "PRODUCAO",
            "prioridade": "alta",
            "persistente": True,
            "data": payload
        }, room="global_notifications")

        # 4. Gravar notificação persistente no banco de dados para gestão e rastreio
        try:
            from app.core.database import db
            from app.models.notificacao import Notificacao
            notif = Notificacao(
                titulo=titulo,
                mensagem=mensagem,
                tipo="alerta",
                canal="PRODUCAO",
                prioridade="alta",
                persistente=True,
                ativa=True,
                target_type="ROLE" if (sectores and len(sectores) == 1) else "GLOBAL",
                target_role=sectores[0] if (sectores and len(sectores) == 1) else None,
                target_sector=sectores_str,
                metadados=payload
            )
            db.session.add(notif)
            db.session.commit()
        except Exception as db_err:
            logger.debug(f"Não foi possível persistir notificação de produção no DB: {db_err}")

        logger.info(f"Produção notificada via WebSocket: Pedido #{pedido_numero} ({sectores_str})")
        return True
    except Exception as e:
        logger.error(f"Erro ao notificar ordens de produção via WebSocket: {str(e)}")
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

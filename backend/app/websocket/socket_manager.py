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


def notify_order_created(pedido_id: int, pedido_numero: str, total: float = 0.0, cliente_nome: Optional[str] = None) -> bool:
    """
    Notifica a criação de um novo pedido comercial com desduplicação (máximo 1 alerta por pedido).
    Emite o evento 'novo_pedido' para sincronização de listas e 'notificacao' para alerta visual.
    """
    titulo = "Novo Pedido Recebido"
    mensagem = f"Pedido #{pedido_numero} registado com sucesso."
    if cliente_nome:
        mensagem += f" Cliente: {cliente_nome}."

    payload = {
        "pedido_id": pedido_id,
        "numero": pedido_numero,
        "total": total,
        "cliente": cliente_nome
    }

    try:
        # 1. Evento de dados em tempo real para recarregar tabelas de vendas/pedidos
        socketio.emit("novo_pedido", payload)

        # 2. Persistência desduplicada na Base de Dados (evita múltiplos registos)
        try:
            from app.core.database import db
            from app.models.notificacao import Notificacao
            
            ja_existe = Notificacao.query.filter(
                Notificacao.canal == "PEDIDO",
                Notificacao.metadados["pedido_id"].as_integer() == pedido_id
            ).first()

            if not ja_existe:
                notif = Notificacao(
                    titulo=titulo,
                    mensagem=mensagem,
                    tipo="info",
                    canal="PEDIDO",
                    prioridade="media",
                    persistente=False,
                    ativa=True,
                    target_type="GLOBAL",
                    metadados=payload,
                    created_at=datetime.utcnow()
                )
                db.session.add(notif)
                db.session.commit()

                # 3. Notificação visual única para a central
                socketio.emit("notificacao", {
                    "id": notif.id,
                    "titulo": titulo,
                    "mensagem": mensagem,
                    "tipo": "info",
                    "canal": "PEDIDO",
                    "prioridade": "media",
                    "persistente": False,
                    "created_at": datetime.utcnow().isoformat(),
                    "data": payload
                }, room="global_notifications")
        except Exception as db_err:
            logger.debug(f"Erro ao persistir notificação de pedido: {db_err}")

        logger.info(f"Pedido notificado via WebSocket: #{pedido_numero}")
        return True
    except Exception as e:
        logger.error(f"Erro ao notificar novo pedido: {str(e)}")
        return False


def notify_production_orders(pedido_id: int, pedido_numero: str, sectores: List[Any]) -> bool:
    """
    Notifica a geração de ordens de produção de forma CONSOLIDADA e DESDUPLICADA.
    Gera exatamente UMA notificação operacional para os setores fabris (Cozinha/Pastelaria/Bar),
    eliminando alertas duplicados ou disparos redundantes em cascata.
    """
    # Normalizar e desduplicar nomes dos setores
    sectores_limpos = []
    for s in (sectores or []):
        s_val = s.value if hasattr(s, 'value') else str(s)
        if s_val and s_val not in sectores_limpos:
            sectores_limpos.append(s_val)

    sectores_str = ", ".join(sectores_limpos) if sectores_limpos else "Cozinha"
    titulo = f"Nova Produção: Pedido #{pedido_numero}"
    mensagem = f"Ordens de produção geradas para o Pedido #{pedido_numero} nos sectores: {sectores_str}."

    payload = {
        "pedido_id": pedido_id,
        "numero": pedido_numero,
        "sectores": sectores_limpos,
        "titulo": titulo,
        "mensagem": mensagem
    }

    try:
        # 1. Evento técnico de sincronização para os ecrãs KDS/Cozinha atualizarem a fila
        socketio.emit("nova_ordem_producao", payload)

        # 2. Persistência desduplicada na BD (Impede duplicação na tabela 'notificacoes')
        notif_id = None
        try:
            from app.core.database import db
            from app.models.notificacao import Notificacao

            # Verifica se já existe notificação de produção gravada para este pedido
            notif_existente = Notificacao.query.filter(
                Notificacao.canal == "PRODUCAO",
                Notificacao.metadados["pedido_id"].as_integer() == pedido_id
            ).first()

            if not notif_existente:
                notif = Notificacao(
                    titulo=titulo,
                    mensagem=mensagem,
                    tipo="info",
                    canal="PRODUCAO",
                    prioridade="alta",
                    persistente=False,
                    ativa=True,
                    target_type="GLOBAL",
                    target_sector=sectores_str,
                    metadados=payload,
                    created_at=datetime.utcnow()
                )
                db.session.add(notif)
                db.session.commit()
                notif_id = notif.id
            else:
                notif_id = notif_existente.id
                logger.debug(f"Notificação de produção para Pedido #{pedido_numero} já existia (evitada duplicação).")
        except Exception as db_err:
            logger.debug(f"Erro ao verificar/gravar notificação de produção no DB: {db_err}")

        # 3. Emite UMA ÚNICA notificação global consolidada (sem disparar alertas em loop por role)
        socketio.emit("notificacao", {
            "id": notif_id,
            "titulo": titulo,
            "mensagem": mensagem,
            "tipo": "info",
            "canal": "PRODUCAO",
            "prioridade": "alta",
            "persistente": False,
            "created_at": datetime.utcnow().isoformat(),
            "data": payload
        }, room="global_notifications")

        logger.info(f"Produção notificada de forma consolidada: Pedido #{pedido_numero} ({sectores_str})")
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

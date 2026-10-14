import logging
from typing import Dict, Set, Optional, List, Any
from flask import request, current_app
from flask_socketio import SocketIO, emit, join_room, leave_room, disconnect
from datetime import datetime
from flask_jwt_extended import decode_token
from app.models.user import User

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
        return decode_token(token)
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
    if not payload:
        logger.warning("Rejected unauthenticated WebSocket connection - SID: %s", sid)
        return False

    try:
        user_id = int(payload.get("sub") or payload.get("user_id") or payload.get("id"))
    except (TypeError, ValueError):
        logger.warning("Rejected WebSocket connection with invalid user identity - SID: %s", sid)
        return False

    user = User.query.filter_by(id=user_id, is_active=True).first()
    if not user:
        logger.warning("Rejected WebSocket connection for inactive or unknown user - SID: %s", sid)
        return False

    role_value = user.role.value if hasattr(user.role, "value") else str(user.role or "")
    role = role_value.strip()
    if not role:
        logger.warning("Rejected WebSocket connection without a user role - SID: %s", sid)
        return False

    user_id_str = str(user.id)
    _active_user_connections.setdefault(user_id_str, set()).add(sid)
    _sid_to_user[sid] = user_id_str
    _sid_to_role[sid] = role

    join_room(f"user_{user_id_str}")

    role_slug = role.lower().replace(" ", "_")
    join_room(f"role_{role_slug}")

    normalized_slug = role.lower().replace(" ", "_").replace("á", "a").replace("ã", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u").replace("ç", "c")
    if normalized_slug != role_slug:
        join_room(f"role_{normalized_slug}")

    if normalized_slug in ["cozinha", "pastelaria", "bar", "armazem"]:
        join_room(f"sector_{normalized_slug}")

    # Authenticated operators may receive system-wide notifications. Individual
    # and role-scoped notifications still use their dedicated rooms.
    join_room("global_notifications")
    logger.info("WebSocket authenticated - User: %s, Role: %s, SID: %s", user_id_str, role, sid)


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


def broadcast_production_update(op_numero, estado):
    """
    Utility to broadcast a production update internally
    """
    socketio.emit('production_update', {'numero': op_numero, 'estado': estado}, room="producao")


def emit_sync_event(
    event_name: str,
    payload: dict,
    room: Optional[str] = None,
    exclude_user_id: Optional[str] = None
) -> bool:
    """
    Emite evento técnico de sincronização de dados (tabelas, KDS, React Query, cache).
    NÃO se destina a gerar toasts visuais na interface.
    """
    try:
        if room:
            skipped_sids = list(_active_user_connections.get(str(exclude_user_id), set())) if exclude_user_id else []
            socketio.emit(event_name, payload, room=room, skip_sid=skipped_sids or None)
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
        skipped_sids = list(_active_user_connections.get(str(exclude_user_id), set())) if exclude_user_id else []
        socketio.emit(
            "notificacao",
            payload,
            room=target_room,
            skip_sid=skipped_sids or None
        )
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
    Notifica a criação de um novo pedido comercial, criando notificações no banco
    específicas para Cozinha, Pastelaria e Bar, e emitindo eventos WebSocket em tempo real.
    """
    itens_cozinha = []
    itens_pastelaria = []
    itens_bar = []

    try:
        from app.core.database import db
        from app.models.pedido import Pedido
        from app.models.produto import Produto
        from app.models.notificacao import Notificacao

        pedido = Pedido.query.get(pedido_id)
        if pedido and pedido.itens:
            for it in pedido.itens:
                prod = it.produto or (Produto.query.get(it.produto_id) if it.produto_id else None)
                nome_it = it.descricao or (prod.nome if prod else 'Artigo')
                qtd_it = float(it.quantidade or 1)
                item_txt = f"{nome_it} ({qtd_it:g}x)"

                setor = None
                if prod and prod.servico:
                    s_str = prod.servico.value if hasattr(prod.servico, 'value') else str(prod.servico)
                    if s_str == 'COZINHA': setor = 'Cozinha'
                    elif s_str == 'PASTELARIA': setor = 'Pastelaria'
                    elif s_str == 'BAR': setor = 'Bar'

                if not setor and prod:
                    cat_nome = f"{prod.categoria or ''} {prod.nome or ''}".lower()
                    if any(kw in cat_nome for kw in ['bebida', 'sumo', 'cerveja', 'água', 'agua', 'refrigerante', 'café', 'cafe', 'chá', 'cha', 'cocktail', 'licor', 'vinho']):
                        setor = 'Bar'
                    elif any(kw in cat_nome for kw in ['bolo', 'doce', 'pastel', 'pão', 'pao', 'tarte', 'croissant', 'queque', 'pastelaria', 'sobremesa', 'mousse', 'torta']):
                        setor = 'Pastelaria'
                    else:
                        setor = 'Cozinha'
                elif not setor:
                    setor = 'Cozinha'

                if setor == 'Cozinha':
                    itens_cozinha.append(item_txt)
                elif setor == 'Pastelaria':
                    itens_pastelaria.append(item_txt)
                elif setor == 'Bar':
                    itens_bar.append(item_txt)

        # Os sectores são necessários tanto para persistência como para os
        # eventos de tempo real. Inicializá-los antes evita que uma exceção
        # local impeça o registo da notificação.
        setores = []
        if itens_cozinha: setores.append("Cozinha")
        if itens_pastelaria: setores.append("Pastelaria")
        if itens_bar: setores.append("Bar")

        # 1. Persistir notificação única e consolidada no sistema para evitar redundância
        setores_str = ", ".join(setores) if setores else "Geral"
        notif_g = Notificacao(
            tipo='NOVO_PEDIDO',
            titulo=f"Novo Pedido: #{pedido_numero}",
            mensagem=f"Pedido #{pedido_numero} registado para {cliente_nome or 'Consumidor Final'} ({float(total or 0):.2f}€). Setores: {setores_str}. {produtos_resumo or ''}",
            prioridade='alta',
            entidade_tipo='pedido',
            entidade_id=pedido_id,
            dados_extra={"pedido_id": pedido_id, "numero": pedido_numero, "total": float(total or 0), "setores": setores}
        )
        db.session.add(notif_g)
        db.session.commit()
    except Exception as dberr:
        logger.error(f"Erro ao persistir notificações de novo pedido: {dberr}")
        try:
            from app.core.database import db
            db.session.rollback()
        except Exception:
            pass

    # 2. Emissão de eventos WebSocket em tempo real
    try:
        payload_base = {
            "pedido_id": pedido_id,
            "numero": pedido_numero,
            "total": float(total or 0),
            "cliente": cliente_nome or "Consumidor Final",
            "produtos": produtos_resumo or "Itens do Pedido",
            "setores": setores
        }

        # Eventos globais de sincronização
        socketio.emit("novo_pedido", payload_base)
        socketio.emit("nova_ordem_producao", payload_base)

        # Eventos dedicados por setor com mensagens claras
        if itens_cozinha:
            cozinha_msg = f"Novo pedido #{pedido_numero} na Cozinha! ({', '.join(itens_cozinha)})"
            socketio.emit("alerta_cozinha", {
                "pedido_id": pedido_id,
                "numero": pedido_numero,
                "setor": "Cozinha",
                "msg": cozinha_msg,
                "itens": itens_cozinha
            })
            socketio.emit("alerta_cozinha", {
                "pedido_id": pedido_id,
                "numero": pedido_numero,
                "msg": cozinha_msg
            }, room="role_cozinha")
            socketio.emit("alerta_cozinha", {
                "pedido_id": pedido_id,
                "numero": pedido_numero,
                "msg": cozinha_msg
            }, room="sector_cozinha")

        if itens_pastelaria:
            pastelaria_msg = f"Novo pedido #{pedido_numero} na Pastelaria! ({', '.join(itens_pastelaria)})"
            socketio.emit("alerta_pastelaria", {
                "pedido_id": pedido_id,
                "numero": pedido_numero,
                "setor": "Pastelaria",
                "msg": pastelaria_msg,
                "itens": itens_pastelaria
            })
            socketio.emit("alerta_pastelaria", {
                "pedido_id": pedido_id,
                "numero": pedido_numero,
                "msg": pastelaria_msg
            }, room="role_pastelaria")
            socketio.emit("alerta_pastelaria", {
                "pedido_id": pedido_id,
                "numero": pedido_numero,
                "msg": pastelaria_msg
            }, room="sector_pastelaria")

        if itens_bar:
            bar_msg = f"Novo pedido #{pedido_numero} no Bar! ({', '.join(itens_bar)})"
            socketio.emit("alerta_bar", {
                "pedido_id": pedido_id,
                "numero": pedido_numero,
                "setor": "Bar",
                "msg": bar_msg,
                "itens": itens_bar
            })
            socketio.emit("alerta_bar", {
                "pedido_id": pedido_id,
                "numero": pedido_numero,
                "msg": bar_msg
            }, room="role_bar")
            socketio.emit("alerta_bar", {
                "pedido_id": pedido_id,
                "numero": pedido_numero,
                "msg": bar_msg
            }, room="sector_bar")

        # Notificação geral
        socketio.emit("notificacao", {
            "titulo": f"Novo Pedido #{pedido_numero}",
            "mensagem": f"Novo pedido recebido: {produtos_resumo or ''}",
            "tipo": "NOVO_PEDIDO",
            "setores": setores
        })

        return True
    except Exception as ws_err:
        logger.error(f"Erro ao emitir WebSockets para Cozinha/Pastelaria/Bar: {ws_err}")
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
    Publica a alteração de estado do pedido pelas políticas de destinatários.
    """
    try:
        from app.notifications.service import NotificationService

        result = NotificationService.publish_order_status_updated(
            pedido_id=pedido_id,
            pedido_numero=pedido_numero,
            antigo_estado=antigo_estado,
            novo_estado=novo_estado,
            cliente_nome=cliente_nome,
            produtos_resumo=produtos_resumo,
            total=total,
            actor_user_id=actor_user_id,
        )
        return result.get("status") in {"published", "synced_only", "deduplicated"}
    except Exception:
        logger.exception("Erro ao publicar atualização do pedido %s", pedido_id)
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


def notify_requisicao_users(requisicao_id, numero, estado, mensagem, actor_user_id=None):
    """
    Notifica apenas os utilizadores com permissão no módulo de requisições:
    Administrador, Armazém, Controlador de Materiais e o responsável da requisição.
    Atualiza a mesma notificação (identificada por requisicao_id) em vez de duplicar.
    """
    try:
        from app.models.requisicao import Requisicao
        from app.notifications.service import NotificationService

        req = Requisicao.query.get(requisicao_id)
        NotificationService.publish_requisition_status(
            requisition_id=requisicao_id,
            requisition_number=numero,
            status=estado,
            message=mensagem,
            responsible_user_id=req.responsavel_id if req else None,
            actor_user_id=actor_user_id,
        )
    except Exception:
        logger.exception("Erro ao publicar notificação de requisição %s", requisicao_id)


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

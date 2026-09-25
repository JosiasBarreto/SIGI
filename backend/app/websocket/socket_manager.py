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
    produtos_resumo: Optional[str] = None
) -> bool:
    """
    Notifica a criação de um novo pedido comercial com o padrão completo de identificação:
    - Referência: #PED-XXXX
    - Cliente: Nome do Cliente
    - Produtos: Artigo A (1x), Artigo B (2x)
    - Total: Valor monetário
    """
    cliente_str = cliente_nome or "Consumidor Final"
    produtos_str = produtos_resumo or "Sem artigos detalhados"

    titulo = f"Novo Pedido #{pedido_numero}"
    mensagem = (
        f"Pedido #{pedido_numero} registado com sucesso.\n"
        f"• Cliente: {cliente_str}\n"
        f"• Produtos: {produtos_str}\n"
        f"• Total: {float(total or 0):.2f} €"
    )

    payload = {
        "pedido_id": pedido_id,
        "numero": pedido_numero,
        "cliente": cliente_str,
        "produtos": produtos_str,
        "total": float(total or 0),
        "origem": "novo_pedido"
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

        logger.info(f"Pedido notificado via WebSocket: #{pedido_numero} ({cliente_str})")
        return True
    except Exception as e:
        logger.error(f"Erro ao notificar novo pedido: {str(e)}")
        return False


def notify_order_status_updated(
    pedido_id: int,
    pedido_numero: str,
    antigo_estado: str,
    novo_estado: str,
    cliente_nome: Optional[str] = None,
    produtos_resumo: Optional[str] = None,
    total: float = 0.0
) -> bool:
    """
    Notifica a alteração de estado do pedido com identificação estruturada:
    - Referência: #PED-XXXX
    - Cliente: Nome do Cliente
    - Produtos: Artigos do pedido
    - Transição: Estado Anterior -> Novo Estado
    """
    cliente_str = cliente_nome or "Consumidor Final"
    produtos_str = produtos_resumo or "Sem artigos detalhados"

    tipo = "info"
    prioridade = "media"
    novo_upper = str(novo_estado).upper()

    if "PRONTO" in novo_upper:
        tipo = "success"
        prioridade = "alta"
        titulo = f"Pedido #{pedido_numero}: Pronto para Levantamento"
    elif "ENTREGUE" in novo_upper or "CONCLUIDO" in novo_upper:
        tipo = "success"
        prioridade = "media"
        titulo = f"Pedido #{pedido_numero}: Entregue"
    elif "CANCELADO" in novo_upper:
        tipo = "error"
        prioridade = "urgente"
        titulo = f"Pedido #{pedido_numero}: Cancelado"
    elif "PRODUCAO" in novo_upper:
        tipo = "info"
        prioridade = "alta"
        titulo = f"Pedido #{pedido_numero}: Em Confeção"
    else:
        titulo = f"Pedido #{pedido_numero}: {novo_estado}"

    mensagem = (
        f"O estado do Pedido #{pedido_numero} foi alterado para '{novo_estado}'.\n"
        f"• Cliente: {cliente_str}\n"
        f"• Produtos: {produtos_str}\n"
        f"• Transição: {antigo_estado} ➔ {novo_estado}"
    )

    payload = {
        "pedido_id": pedido_id,
        "numero": pedido_numero,
        "cliente": cliente_str,
        "produtos": produtos_str,
        "antigo_estado": antigo_estado,
        "novo_estado": novo_estado,
        "total": float(total or 0),
        "origem": "pedido_atualizado"
    }

    try:
        # 1. Evento de dados em tempo real
        socketio.emit("pedido_atualizado", payload)

        # Se ficou pronto, emite também o evento específico para o balcão
        if "PRONTO" in novo_upper:
            socketio.emit("pedido_pronto", {
                "pedido_id": pedido_id,
                "numero": pedido_numero,
                "cliente": cliente_str,
                "produtos": produtos_str
            })

        # 2. Persistência na Base de Dados
        notif_id = None
        try:
            from app.core.database import db
            from app.models.notificacao import Notificacao

            notif = Notificacao(
                titulo=titulo,
                mensagem=mensagem,
                tipo=tipo,
                canal="PEDIDO",
                prioridade=prioridade,
                persistente=False,
                ativa=True,
                target_type="GLOBAL",
                metadados=payload,
                created_at=datetime.utcnow()
            )
            db.session.add(notif)
            db.session.commit()
            notif_id = notif.id
        except Exception as db_err:
            logger.debug(f"Erro ao persistir notificação de status de pedido: {db_err}")

        # 3. Notificação visual global estruturada
        socketio.emit("notificacao", {
            "id": notif_id,
            "titulo": titulo,
            "mensagem": mensagem,
            "tipo": tipo,
            "canal": "PEDIDO",
            "prioridade": prioridade,
            "persistente": False,
            "created_at": datetime.utcnow().isoformat(),
            "data": payload
        }, room="global_notifications")

        logger.info(f"Alteração de estado de pedido notificada: #{pedido_numero} ({antigo_estado} -> {novo_estado})")
        return True
    except Exception as e:
        logger.error(f"Erro ao notificar alteração de estado do pedido: {str(e)}")
        return False


def notify_production_orders(
    pedido_id: int, 
    pedido_numero: str, 
    sectores: List[Any],
    cliente_nome: Optional[str] = None,
    produtos_resumo: Optional[str] = None
) -> bool:
    """
    Notifica a geração de ordens de produção de forma CONSOLIDADA e DESDUPLICADA com padrão de identificação:
    - Referência: #PED-XXXX
    - Setores: Cozinha, Pastelaria, Bar
    - Cliente: Nome do Cliente
    - Produtos: Artigos a confecionar
    """
    sectores_limpos = []
    for s in (sectores or []):
        s_val = s.value if hasattr(s, 'value') else str(s)
        if s_val and s_val not in sectores_limpos:
            sectores_limpos.append(s_val)

    sectores_str = ", ".join(sectores_limpos) if sectores_limpos else "Cozinha"
    cliente_str = cliente_nome or "Consumidor Final"
    produtos_str = produtos_resumo or "Sem artigos detalhados"

    titulo = f"Nova Produção: Pedido #{pedido_numero}"
    mensagem = (
        f"Ordens de produção geradas para os sectores: {sectores_str}.\n"
        f"• Pedido: #{pedido_numero}\n"
        f"• Cliente: {cliente_str}\n"
        f"• Artigos a Confecionar: {produtos_str}"
    )

    payload = {
        "pedido_id": pedido_id,
        "numero": pedido_numero,
        "cliente": cliente_str,
        "produtos": produtos_str,
        "sectores": sectores_limpos,
        "titulo": titulo,
        "mensagem": mensagem,
        "origem": "nova_ordem_producao"
    }

    try:
        # 1. Evento técnico de sincronização para os ecrãs KDS/Cozinha atualizarem a fila
        socketio.emit("nova_ordem_producao", payload)

        # 2. Persistência desduplicada na BD (Impede duplicação na tabela 'notificacoes')
        notif_id = None
        try:
            from app.core.database import db
            from app.models.notificacao import Notificacao

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

        # 3. Emite UMA ÚNICA notificação global consolidada
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


def notify_production_status_updated(
    ordem_id: int,
    ordem_numero: str,
    pedido_numero: str,
    sector: str,
    antigo_estado: str,
    novo_estado: str,
    cliente_nome: Optional[str] = None,
    produtos_resumo: Optional[str] = None
) -> bool:
    """
    Notifica a evolução de uma ordem de fabrico de setor específico (KDS):
    - Referência: #OP-COZ-... (Pedido #PED-...)
    - Setor: Cozinha / Pastelaria / Bar
    - Cliente: Nome do Cliente
    - Produtos: Artigos da ordem
    - Transição: Estado Anterior -> Novo Estado
    """
    cliente_str = cliente_nome or "Consumidor Final"
    produtos_str = produtos_resumo or "Sem artigos detalhados"

    tipo = "info"
    prioridade = "media"
    novo_upper = str(novo_estado).upper()

    if "PRONTO" in novo_upper:
        tipo = "success"
        prioridade = "alta"
        titulo = f"Produção ({sector}) #{ordem_numero}: Concluída"
    elif "EM_PRODUCAO" in novo_upper or "EM PRODUCAO" in novo_upper:
        tipo = "info"
        prioridade = "media"
        titulo = f"Produção ({sector}) #{ordem_numero}: Em Preparação"
    elif "CANCELADO" in novo_upper:
        tipo = "error"
        prioridade = "urgente"
        titulo = f"Produção ({sector}) #{ordem_numero}: CANCELADA"
    else:
        titulo = f"Produção ({sector}) #{ordem_numero}: {novo_estado}"

    mensagem = (
        f"A ordem de produção #{ordem_numero} ({sector}) passou para '{novo_estado}'.\n"
        f"• Pedido: #{pedido_numero}\n"
        f"• Cliente: {cliente_str}\n"
        f"• Artigos: {produtos_str}\n"
        f"• Transição: {antigo_estado} ➔ {novo_estado}"
    )

    payload = {
        "ordem_id": ordem_id,
        "ordem_numero": ordem_numero,
        "pedido_numero": pedido_numero,
        "sector": sector,
        "cliente": cliente_str,
        "produtos": produtos_str,
        "antigo_estado": antigo_estado,
        "novo_estado": novo_estado,
        "origem": "ordem_producao_atualizada"
    }

    try:
        # Eventos para ecrãs de fábrica
        if "PRONTO" in novo_upper:
            socketio.emit("producao_concluida", {"ordem_numero": ordem_numero, "pedido_numero": pedido_numero})
        elif "PRODUCAO" in novo_upper:
            socketio.emit("producao_iniciada", {"ordem_numero": ordem_numero, "pedido_numero": pedido_numero})

        # Persistência
        notif_id = None
        try:
            from app.core.database import db
            from app.models.notificacao import Notificacao

            notif = Notificacao(
                titulo=titulo,
                mensagem=mensagem,
                tipo=tipo,
                canal="PRODUCAO",
                prioridade=prioridade,
                persistente=False,
                ativa=True,
                target_type="GLOBAL",
                target_sector=sector,
                metadados=payload,
                created_at=datetime.utcnow()
            )
            db.session.add(notif)
            db.session.commit()
            notif_id = notif.id
        except Exception as db_err:
            logger.debug(f"Erro ao persistir notificação de ordem de produção: {db_err}")

        # Emissão central
        socketio.emit("notificacao", {
            "id": notif_id,
            "titulo": titulo,
            "mensagem": mensagem,
            "tipo": tipo,
            "canal": "PRODUCAO",
            "prioridade": prioridade,
            "persistente": False,
            "created_at": datetime.utcnow().isoformat(),
            "data": payload
        }, room="global_notifications")

        logger.info(f"Ordem de Produção #{ordem_numero} ({sector}) notificada: {novo_estado}")
        return True
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

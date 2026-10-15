from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.system_notification_service import SystemNotificationService
from app.core.database import db
from app.middleware.auth_middleware import requires_roles
from app.models.notificacao import Notificacao, NotificacaoLeitura
from app.models.user import User
from app.models.user import RoleEnum
import unicodedata

notificacao_bp = Blueprint('notificacoes', __name__)

@notificacao_bp.route('', methods=['GET'])
@jwt_required()
def list_notificacoes():
    user_id = get_jwt_identity()
    tipo = request.args.get('tipo', None)
    apenas_nao_lidas = request.args.get('nao_lidas', 'false').lower() == 'true'

    notificacoes = SystemNotificationService.get_notificacoes(
        user_id=user_id,
        tipo=tipo,
        apenas_nao_lidas=apenas_nao_lidas
    )

    resumo = SystemNotificationService.get_resumo(user_id=user_id)

    return jsonify({
        "success": True,
        "resumo": resumo,
        "notificacoes": notificacoes
    }), 200

@notificacao_bp.route('', methods=['POST'])
@jwt_required()
@requires_roles('Administrador')
def criar_notificacao():
    data = request.get_json(silent=True) or {}
    titulo = str(data.get('titulo') or '').strip()
    mensagem = str(data.get('mensagem') or '').strip()
    if not titulo or not mensagem or len(titulo) > 200:
        return jsonify({"success": False, "msg": "Título e mensagem são obrigatórios; o título deve ter até 200 caracteres."}), 400

    canais_validos = {'PEDIDO', 'PRODUCAO', 'STOCK', 'FINANCEIRO', 'SISTEMA', 'REQUISICAO', 'EVENTOS'}
    prioridades_validas = {'baixa', 'media', 'alta', 'urgente'}
    canal = str(data.get('canal') or 'SISTEMA').upper()
    prioridade = str(data.get('prioridade') or 'media').lower()
    if canal not in canais_validos or prioridade not in prioridades_validas:
        return jsonify({"success": False, "msg": "Canal ou prioridade inválidos."}), 400

    def normalize(value):
        normalized = unicodedata.normalize('NFKD', str(value or ''))
        return ''.join(char for char in normalized if not unicodedata.combining(char)).strip().lower().replace(' ', '_')

    target_type = str(data.get('target_type') or 'GLOBAL').upper()
    target_id = None
    if target_type == 'ROLE':
        roles_by_slug = {normalize(role.value): role.value for role in RoleEnum}
        role_slug = normalize(data.get('target_role'))
        if role_slug not in roles_by_slug:
            return jsonify({"success": False, "msg": "Perfil destinatário inválido."}), 400
        target_id = role_slug
        target_role = roles_by_slug[role_slug]
        recipient_type = 'ROLE'
    elif target_type in {'SETOR', 'SECTOR'}:
        sector_slug = normalize(data.get('target_sector'))
        valid_sectors = {'cozinha', 'pastelaria', 'armazem'}
        if sector_slug not in valid_sectors:
            return jsonify({"success": False, "msg": "Setor destinatário inválido."}), 400
        target_id = sector_slug
        target_role = None
        target_type = 'SECTOR'
        recipient_type = 'SECTOR'
    elif target_type == 'GLOBAL':
        target_role = None
        recipient_type = 'GLOBAL'
    else:
        return jsonify({"success": False, "msg": "Tipo de destinatário inválido."}), 400

    actor_id = int(get_jwt_identity())
    notification = Notificacao(
        tipo='COMUNICADO',
        titulo=titulo,
        mensagem=mensagem,
        prioridade=prioridade,
        entidade_tipo='sistema',
        canal=canal,
        persistente=bool(data.get('persistente', False)),
        ativo=True,
        target_type=target_type,
        target_role=target_role,
        target_sector=target_id if recipient_type == 'SECTOR' else None,
        actor_user_id=actor_id,
        metadados={
            "notification_kind": str(data.get('tipo') or 'info'),
            "notification_recipients": [{
                "target_type": recipient_type,
                "target_id": target_id,
                "exclude_actor": False,
            }],
        },
    )
    db.session.add(notification)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise

    from app.websocket.socket_manager import emit_user_notification
    room = (
        "global_notifications" if recipient_type == 'GLOBAL'
        else f"{recipient_type.lower()}_{target_id}"
    )
    emit_user_notification({
        "id": notification.id,
        "event_id": f"manual_notification_{notification.id}",
        "event_type": "MANUAL_NOTIFICATION",
        "entity_type": "SISTEMA",
        "entity_id": notification.id,
        "titulo": titulo,
        "mensagem": mensagem,
        "tipo": str(data.get('tipo') or 'info'),
        "canal": canal,
        "prioridade": prioridade,
        "persistente": notification.persistente,
        "created_at": notification.created_at.isoformat() if notification.created_at else None,
        "data": notification.metadados,
    }, room=room)

    return jsonify({
        "success": True,
        "id": notification.id,
        "data": {
            "id": notification.id,
            "titulo": titulo,
            "mensagem": mensagem,
            "tipo": str(data.get('tipo') or 'info'),
            "canal": canal,
            "prioridade": prioridade,
            "persistente": notification.persistente,
            "target_type": target_type,
            "target_role": target_role,
            "target_sector": notification.target_sector,
            "created_at": notification.created_at.isoformat() if notification.created_at else None,
        },
    }), 201

@notificacao_bp.route('/resumo', methods=['GET'])
@jwt_required()
def get_resumo_notificacoes():
    user_id = get_jwt_identity()
    resumo = SystemNotificationService.get_resumo(user_id=user_id)
    return jsonify({
        "success": True,
        "resumo": resumo
    }), 200

@notificacao_bp.route('/<int:id>/leituras', methods=['GET'])
@jwt_required()
def auditoria_leituras(id):
    user_id = get_jwt_identity()
    user = SystemNotificationService._get_active_user(user_id)
    if not user:
        return jsonify({"success": False, "msg": "Utilizador não identificado."}), 401

    notification = Notificacao.query.get(id)
    if not notification:
        return jsonify({"success": False, "msg": "Notificação não encontrada."}), 404
    if not SystemNotificationService._user_can_access(notification, user):
        return jsonify({"success": False, "msg": "Sem permissão para consultar esta notificação."}), 403

    audience = [
        recipient for recipient in User.query.filter_by(is_active=True).all()
        if SystemNotificationService._user_can_access(notification, recipient)
    ]
    reads = {
        read.user_id: read
        for read in NotificacaoLeitura.query.filter_by(notificacao_id=id).all()
    }

    lidos = []
    nao_lidos = []
    for recipient in audience:
        recipient_role = recipient.role.value if hasattr(recipient.role, 'value') else str(recipient.role)
        read = reads.get(recipient.id)
        entry = {
            "user_id": recipient.id,
            "nome": recipient.name,
            "role": recipient_role,
        }
        if read:
            entry["lido_em"] = read.data_leitura.isoformat() if read.data_leitura else None
            lidos.append(entry)
        else:
            nao_lidos.append(entry)

    return jsonify({"success": True, "lidos": lidos, "nao_lidos": nao_lidos}), 200

@notificacao_bp.route('/<int:id>/marcar-lida', methods=['POST', 'PATCH'])
@jwt_required()
def marcar_lida(id):
    user_id = get_jwt_identity()
    sucesso, err = SystemNotificationService.marcar_como_lida(id, user_id)
    if not sucesso:
        return jsonify({"success": False, "msg": err}), 400
    
    return jsonify({
        "success": True,
        "msg": "Notificação marcada como lida com sucesso."
    }), 200

@notificacao_bp.route('/marcar-todas-lidas', methods=['POST', 'PATCH'])
@jwt_required()
def marcar_todas_lidas():
    user_id = get_jwt_identity()
    sucesso, err = SystemNotificationService.marcar_todas_lidas(user_id)
    if not sucesso:
        return jsonify({"success": False, "msg": err}), 400
    
    return jsonify({
        "success": True,
        "msg": "Todas as notificações foram marcadas como lidas."
    }), 200

@notificacao_bp.route('/estatisticas', methods=['GET'])
@jwt_required()
def get_estatisticas_notificacoes():
    user_id = get_jwt_identity()
    resumo = SystemNotificationService.get_resumo(user_id=user_id)
    notificacoes = SystemNotificationService.get_notificacoes(user_id=user_id)
    
    detalhes_leituras = [{
        "id": n["id"],
        "tipo": n["tipo"],
        "titulo": n["titulo"],
        "total_visto": n["total_visto"],
        "total_nao_visto": n["total_nao_visto"],
        "quem_viu": n["quem_viu"],
        "quem_nao_viu": n["quem_nao_viu"]
    } for n in notificacoes]

    return jsonify({
        "success": True,
        "resumo": resumo,
        "detalhes_leituras": detalhes_leituras
    }), 200

@notificacao_bp.route('/sincronizar', methods=['POST'])
@jwt_required()
def sincronizar_alertas():
    SystemNotificationService.sync_system_alerts()
    user_id = get_jwt_identity()
    resumo = SystemNotificationService.get_resumo(user_id=user_id)
    return jsonify({
        "success": True,
        "msg": "Alertas sincronizados com sucesso.",
        "resumo": resumo
    }), 200

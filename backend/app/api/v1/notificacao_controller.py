from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.system_notification_service import SystemNotificationService

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

@notificacao_bp.route('/resumo', methods=['GET'])
@jwt_required()
def get_resumo_notificacoes():
    user_id = get_jwt_identity()
    resumo = SystemNotificationService.get_resumo(user_id=user_id)
    return jsonify({
        "success": True,
        "resumo": resumo
    }), 200

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


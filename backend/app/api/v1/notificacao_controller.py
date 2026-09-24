import logging
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, current_user, get_jwt_identity

from app.services.gestao_notificacao_service import GestaoNotificacaoService
from app.models.user import User

logger = logging.getLogger(__name__)

notificacao_bp = Blueprint("notificacoes", __name__)


def _get_current_authenticated_user() -> User:
    """Recupera a instância do utilizador autenticado via JWT"""
    if current_user:
        return current_user
    ident = get_jwt_identity()
    if ident:
        return User.query.get(ident)
    return None


# -----------------------------------------------------------------------------
# NOTIFICAÇÕES: LISTAGEM, DETALHES, CRIAÇÃO E CICLO DE VIDA
# -----------------------------------------------------------------------------

@notificacao_bp.route("", methods=["GET"])
@jwt_required()
def listar_notificacoes():
    """
    Lista notificações com suporte a filtros e isolamento por utilizador/cargo.
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    parameters:
      - in: query
        name: page
        type: integer
        default: 1
      - in: query
        name: per_page
        type: integer
        default: 20
      - in: query
        name: lida
        type: boolean
        description: Filtrar por lida (true) ou não lida (false)
      - in: query
        name: persistente
        type: boolean
        description: Filtrar notificações fixadas/persistentes
      - in: query
        name: canal
        type: string
        description: Canal (SISTEMA, PEDIDO, PRODUCAO, STOCK, FINANCEIRO, SMS, etc.)
      - in: query
        name: tipo
        type: string
        description: Tipo (info, warning, success, error, alerta)
      - in: query
        name: prioridade
        type: string
        description: Prioridade (baixa, media, alta, urgente)
      - in: query
        name: busca
        type: string
        description: Termo para busca em título ou mensagem
      - in: query
        name: incluir_desativadas
        type: boolean
        default: false
      - in: query
        name: todas
        type: boolean
        default: false
        description: Se admin, listar de todo o sistema sem isolamento
    responses:
      200:
        description: Lista paginada de notificações
    """
    user = _get_current_authenticated_user()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    def parse_bool(val):
        if val is None: return None
        return str(val).lower() in ("true", "1", "yes", "t")

    filtros = {
        "lida": parse_bool(request.args.get("lida")),
        "persistente": parse_bool(request.args.get("persistente")),
        "canal": request.args.get("canal"),
        "tipo": request.args.get("tipo"),
        "prioridade": request.args.get("prioridade"),
        "busca": request.args.get("busca"),
        "incluir_desativadas": parse_bool(request.args.get("incluir_desativadas")) or False,
        "apenas_desativadas": parse_bool(request.args.get("apenas_desativadas")) or False,
        "todas": parse_bool(request.args.get("todas")) or False
    }

    items, total, meta = GestaoNotificacaoService.listar_notificacoes(
        current_user=user,
        filtros=filtros,
        page=page,
        per_page=per_page
    )

    return jsonify({
        "success": True,
        "data": items,
        "meta": meta
    }), 200


@notificacao_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def obter_detalhes_notificacao(id: int):
    """
    Obtém os detalhes de uma notificação com relatório de QUEM LEU e QUEM NÃO LEU.
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    responses:
      200:
        description: Detalhes com quem leu e quem não leu
      404:
        description: Notificação não encontrada
    """
    user = _get_current_authenticated_user()
    detalhes = GestaoNotificacaoService.obter_detalhes_notificacao(
        notificacao_id=id,
        current_user_id=user.id if user else None
    )

    if not detalhes:
        return jsonify({"success": False, "msg": "Notificação não encontrada"}), 404

    return jsonify({
        "success": True,
        "data": detalhes
    }), 200


@notificacao_bp.route("", methods=["POST"])
@jwt_required()
def criar_notificacao():
    """
    Cria e despacha uma nova notificação com envio WebSocket imediato.
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - titulo
            - mensagem
          properties:
            titulo:
              type: string
            mensagem:
              type: string
            tipo:
              type: string
              enum: [info, warning, success, error, alerta]
              default: info
            canal:
              type: string
              default: SISTEMA
            prioridade:
              type: string
              enum: [baixa, media, alta, urgente]
              default: media
            persistente:
              type: boolean
              default: false
            target_type:
              type: string
              enum: [GLOBAL, ROLE, SECTOR, USER]
              default: GLOBAL
            target_role:
              type: string
            target_sector:
              type: string
            target_user_id:
              type: integer
            metadados:
              type: object
    responses:
      201:
        description: Notificação criada e enviada com sucesso
      400:
        description: Dados obrigatórios ausentes
    """
    user = _get_current_authenticated_user()
    data = request.get_json() or {}

    titulo = data.get("titulo", "").strip()
    mensagem = data.get("mensagem", "").strip()

    if not titulo or not mensagem:
        return jsonify({"success": False, "msg": "Título e mensagem são obrigatórios."}), 400

    notificacao = GestaoNotificacaoService.criar_notificacao(
        titulo=titulo,
        mensagem=mensagem,
        tipo=data.get("tipo", "info"),
        canal=data.get("canal", "SISTEMA"),
        prioridade=data.get("prioridade", "media"),
        persistente=bool(data.get("persistente", False)),
        target_type=data.get("target_type", "GLOBAL"),
        target_role=data.get("target_role"),
        target_sector=data.get("target_sector"),
        target_user_id=data.get("target_user_id"),
        metadados=data.get("metadados"),
        created_by=user.id if user else None
    )

    return jsonify({
        "success": True,
        "msg": "Notificação criada e enviada via WebSocket com sucesso.",
        "data": notificacao.to_dict(current_user_id=user.id if user else None)
    }), 201


@notificacao_bp.route("/<int:id>/ler", methods=["PATCH", "POST"])
@jwt_required()
def marcar_como_lida(id: int):
    """
    Marca uma notificação como lida pelo utilizador autenticado.
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    responses:
      200:
        description: Notificação marcada como lida
      404:
        description: Notificação não encontrada
    """
    user = _get_current_authenticated_user()
    if not user:
        return jsonify({"success": False, "msg": "Utilizador não identificado"}), 401

    ip_address = request.headers.get("X-Forwarded-For", request.remote_addr)
    user_agent = request.headers.get("User-Agent")

    ok, erro = GestaoNotificacaoService.marcar_como_lida(
        notificacao_id=id,
        user_id=user.id,
        ip_address=ip_address,
        user_agent=user_agent
    )

    if not ok:
        return jsonify({"success": False, "msg": erro}), 404

    return jsonify({
        "success": True,
        "msg": "Notificação marcada como lida com sucesso."
    }), 200


@notificacao_bp.route("/marcar-todas-lidas", methods=["POST"])
@jwt_required()
def marcar_todas_como_lidas():
    """
    Marca todas as notificações pendentes do utilizador como lidas.
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    responses:
      200:
        description: Notificações marcadas como lidas
    """
    user = _get_current_authenticated_user()
    if not user:
        return jsonify({"success": False, "msg": "Utilizador não identificado"}), 401

    total_marcadas = GestaoNotificacaoService.marcar_todas_como_lidas(current_user=user)

    return jsonify({
        "success": True,
        "msg": f"{total_marcadas} notificações foram marcadas como lidas.",
        "total_marcadas": total_marcadas
    }), 200


@notificacao_bp.route("/<int:id>/desativar", methods=["PATCH", "POST"])
@jwt_required()
def desativar_notificacao(id: int):
    """
    Desativa / arquiva uma notificação específica.
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    responses:
      200:
        description: Notificação desativada
      404:
        description: Notificação não encontrada
    """
    user = _get_current_authenticated_user()
    ok, erro = GestaoNotificacaoService.desativar_notificacao(
        notificacao_id=id,
        user_id=user.id if user else None
    )

    if not ok:
        return jsonify({"success": False, "msg": erro}), 404

    return jsonify({
        "success": True,
        "msg": "Notificação desativada com sucesso."
    }), 200


@notificacao_bp.route("/desativar-lidas", methods=["POST"])
@jwt_required()
def desativar_notificacoes_lidas():
    """
    Desativa em lote todas as notificações que já foram lidas.
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        schema:
          type: object
          properties:
            todas:
              type: boolean
              description: Se True e for Admin, desativa todas do sistema lidas. Se False, apenas as lidas do utilizador.
    responses:
      200:
        description: Notificações lidas desativadas com sucesso
    """
    user = _get_current_authenticated_user()
    if not user:
        return jsonify({"success": False, "msg": "Utilizador não identificado"}), 401

    data = request.get_json() or {}
    is_admin = (
        user.role.value if hasattr(user.role, 'value') else str(user.role)
    ).lower() in ("administrador", "admin")
    
    todas = bool(data.get("todas", False)) and is_admin
    total_desativadas = GestaoNotificacaoService.desativar_notificacoes_lidas(current_user=user, todas=todas)

    return jsonify({
        "success": True,
        "msg": f"{total_desativadas} notificações lidas foram desativadas.",
        "total_desativadas": total_desativadas
    }), 200


@notificacao_bp.route("/<int:id>/persistente", methods=["PATCH"])
@jwt_required()
def alternar_persistente(id: int):
    """
    Alterna ou define o status de notificação persistente (fixada).
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - persistente
          properties:
            persistente:
              type: boolean
    responses:
      200:
        description: Status de persistência atualizado
      404:
        description: Notificação não encontrada
    """
    data = request.get_json() or {}
    if "persistente" not in data:
        return jsonify({"success": False, "msg": "Campo 'persistente' é obrigatório."}), 400

    persistente = bool(data["persistente"])
    ok, erro = GestaoNotificacaoService.alternar_persistente(notificacao_id=id, persistente=persistente)

    if not ok:
        return jsonify({"success": False, "msg": erro}), 404

    return jsonify({
        "success": True,
        "msg": f"Notificação marcada como {'persistente (fixada)' if persistente else 'normal'}.",
        "persistente": persistente
    }), 200


@notificacao_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def excluir_notificacao(id: int):
    """
    Exclui permanentemente uma notificação.
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    responses:
      200:
        description: Notificação excluída com sucesso
      404:
        description: Notificação não encontrada
    """
    ok, erro = GestaoNotificacaoService.excluir_notificacao(notificacao_id=id)
    if not ok:
        return jsonify({"success": False, "msg": erro}), 404

    return jsonify({
        "success": True,
        "msg": "Notificação excluída com sucesso."
    }), 200


# -----------------------------------------------------------------------------
# GESTÃO PROFISSIONAL DE SMS / WHATSAPP: HISTÓRICO, QUEM LEU, ENVIO
# -----------------------------------------------------------------------------

@notificacao_bp.route("/sms", methods=["GET"])
@jwt_required()
def listar_sms():
    """
    Lista todo o histórico de SMS e mensagens WhatsApp enviadas,
    com status de entrega e rastreamento de leitura.
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    parameters:
      - in: query
        name: page
        type: integer
        default: 1
      - in: query
        name: per_page
        type: integer
        default: 20
      - in: query
        name: canal
        type: string
        enum: [sms, whatsapp]
      - in: query
        name: status
        type: string
        enum: [enviado, entregue, lido, falha]
      - in: query
        name: apenas_lidas
        type: boolean
      - in: query
        name: busca
        type: string
      - in: query
        name: telefone
        type: string
    responses:
      200:
        description: Histórico de SMS
    """
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)

    def parse_bool(val):
        if val is None: return None
        return str(val).lower() in ("true", "1", "yes", "t")

    filtros = {
        "canal": request.args.get("canal"),
        "status": request.args.get("status"),
        "tipo_mensagem": request.args.get("tipo_mensagem"),
        "telefone": request.args.get("telefone"),
        "busca": request.args.get("busca"),
        "apenas_lidas": parse_bool(request.args.get("apenas_lidas"))
    }

    items, total, meta = GestaoNotificacaoService.listar_historico_sms(
        filtros=filtros,
        page=page,
        per_page=per_page
    )

    return jsonify({
        "success": True,
        "data": items,
        "meta": meta
    }), 200


@notificacao_bp.route("/sms/enviar", methods=["POST"])
@jwt_required()
def enviar_sms_manual():
    """
    Envia uma mensagem manual via SMS ou WhatsApp para cliente ou colaborador
    e registra no histórico permanente.
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - telefone
            - mensagem
          properties:
            telefone:
              type: string
            mensagem:
              type: string
            destinatario_nome:
              type: string
            canal:
              type: string
              enum: [sms, whatsapp]
              default: sms
            tipo_mensagem:
              type: string
              default: manual
            cliente_id:
              type: integer
    responses:
      200:
        description: SMS enviado e registrado
      400:
        description: Dados obrigatórios ausentes
    """
    user = _get_current_authenticated_user()
    data = request.get_json() or {}

    telefone = data.get("telefone", "").strip()
    mensagem = data.get("mensagem", "").strip()

    if not telefone or not mensagem:
        return jsonify({"success": False, "msg": "Telefone e mensagem são obrigatórios."}), 400

    sucesso, resultado = GestaoNotificacaoService.enviar_sms_manual(
        telefone=telefone,
        mensagem=mensagem,
        destinatario_nome=data.get("destinatario_nome"),
        canal=data.get("canal", "sms"),
        tipo_mensagem=data.get("tipo_mensagem", "manual"),
        cliente_id=data.get("cliente_id"),
        created_by=user.id if user else None
    )

    return jsonify({
        "success": sucesso,
        "msg": "Mensagem despachada com sucesso." if sucesso else "Mensagem salva, com aviso do gateway.",
        "data": resultado
    }), 200


@notificacao_bp.route("/sms/<int:id>/status", methods=["PATCH"])
@jwt_required()
def atualizar_status_sms(id: int):
    """
    Atualiza status ou confirma leitura de uma mensagem SMS/WhatsApp.
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - status
          properties:
            status:
              type: string
              enum: [enviado, entregue, lido, falha]
            marcar_lido:
              type: boolean
    responses:
      200:
        description: Status atualizado com sucesso
      404:
        description: Registro de SMS não encontrado
    """
    data = request.get_json() or {}
    status = data.get("status")

    if not status:
        return jsonify({"success": False, "msg": "Campo 'status' é obrigatório."}), 400

    ok, erro = GestaoNotificacaoService.atualizar_status_sms(
        sms_id=id,
        status=status,
        marcar_lido=bool(data.get("marcar_lido", False))
    )

    if not ok:
        return jsonify({"success": False, "msg": erro}), 404

    return jsonify({
        "success": True,
        "msg": f"Status da SMS #{id} atualizado para '{status}'."
    }), 200


# -----------------------------------------------------------------------------
# ESTATÍSTICAS E DASHBOARD
# -----------------------------------------------------------------------------

@notificacao_bp.route("/estatisticas", methods=["GET"])
@jwt_required()
def obter_estatisticas():
    """
    Retorna métricas em tempo real sobre notificações e histórico de SMS.
    ---
    tags:
      - Notificações
    security:
      - Bearer: []
    responses:
      200:
        description: Estatísticas detalhadas
    """
    user = _get_current_authenticated_user()
    stats = GestaoNotificacaoService.obter_estatisticas(current_user=user)

    return jsonify({
        "success": True,
        "data": stats
    }), 200

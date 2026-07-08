from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.core.database import db
from app.middleware.auth_middleware import requires_roles

auditoria_bp = Blueprint('auditoria_bp', __name__)

@auditoria_bp.route('', methods=['GET'])
@jwt_required()
@requires_roles('Administrador')
def get_auditoria():
    from app.models.auditoria import Auditoria, LogAcesso, LogErro
    from app.models.user import User

    tipo_log = request.args.get('tipo', 'auditoria') # 'auditoria', 'acesso', 'erro'
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)

    if tipo_log == 'acesso':
        query = LogAcesso.query.order_by(LogAcesso.data_login.desc())
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        items = []
        for l in paginated.items:
            user_name = User.query.get(l.utilizador_id).name if l.utilizador_id else 'Desconhecido'
            items.append({
                "id": l.id,
                "utilizador": user_name,
                "ip": l.ip,
                "user_agent": l.user_agent,
                "data_login": l.data_login.isoformat() if l.data_login else None,
                "data_logout": l.data_logout.isoformat() if l.data_logout else None,
                "sucesso": l.sucesso
            })
    elif tipo_log == 'erro':
        query = LogErro.query.order_by(LogErro.data_hora.desc())
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        items = []
        for l in paginated.items:
            user_name = User.query.get(l.utilizador_id).name if l.utilizador_id else 'Desconhecido'
            items.append({
                "id": l.id,
                "tipo": l.tipo,
                "mensagem": l.mensagem,
                "rota": l.rota,
                "utilizador": user_name,
                "data_hora": l.data_hora.isoformat() if l.data_hora else None
            })
    else:
        # Padrão: Auditoria Geral
        query = Auditoria.query.order_by(Auditoria.data_hora.desc())
        
        entidade = request.args.get('entidade')
        if entidade:
            query = query.filter_by(entidade=entidade)
            
        operacao = request.args.get('operacao')
        if operacao:
            query = query.filter_by(operacao=operacao)

        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        items = []
        for a in paginated.items:
            user_name = User.query.get(a.utilizador_id).name if a.utilizador_id else 'Sistema'
            items.append({
                "id": a.id,
                "utilizador": user_name,
                "ip": a.ip,
                "modulo": a.modulo,
                "entidade": a.entidade,
                "registo_id": a.registo_id,
                "operacao": a.operacao,
                "valor_anterior": a.valor_anterior,
                "valor_novo": a.valor_novo,
                "justificativa": a.justificativa,
                "data_hora": a.data_hora.isoformat() if a.data_hora else None
            })

    return jsonify({
        "items": items,
        "total": paginated.total,
        "pages": paginated.pages,
        "current_page": paginated.page
    }), 200


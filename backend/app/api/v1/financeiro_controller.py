from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.financeiro_service import FinanceiroService, CaixaEncerradoException
from app.schemas.financeiro_schema import (
    CaixaSchema, MovimentoCaixaSchema, ContaReceberSchema, ContaPagarSchema,
    ReceitaSchema, DespesaSchema, PagamentoContaSchema
)
from app.middleware.auth_middleware import requires_roles
from marshmallow import ValidationError
from datetime import datetime

financeiro_bp = Blueprint('financeiro', __name__)
financeiro_service = FinanceiroService()

def caixa_response(caixa, aberta=None, status=200):
    """Stable session contract; legacy keys remain during the frontend migration."""
    sessao = CaixaSchema().dump(caixa) if caixa else None
    is_open = caixa is not None if aberta is None else aberta
    return jsonify({
        "success": True,
        "aberta": is_open,
        "sessao": sessao,
        "aberto": is_open,
        "caixa": sessao,
    }), status

def caixa_sessao_response(sessao):
    """Small, stable response used by the frequently-polled POS endpoint."""
    return jsonify({"success": True, "aberta": bool(sessao), "sessao": sessao}), 200

def caixa_error(message, status=400, **extra):
    return jsonify({"success": False, "message": message, "msg": message, **extra}), status

def build_pagination(repo, schema, request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    filters = {}
    for key, value in request.args.items():
        if key not in ['page', 'per_page'] and hasattr(repo.model_class, key):
            filters[key] = value

    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters)
    
    return jsonify({
        "items": schema(many=True).dump(pagination.items),
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page
    }), 200

# -- CAIXA --
@financeiro_bp.route('/caixas', methods=['GET'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro', 'Atendimento')
def get_caixas():
    return build_pagination(financeiro_service.caixa_repo, CaixaSchema, request)

@financeiro_bp.route('/caixas/abrir', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro', 'Atendimento')
def abrir_caixa():
    try:
        data = request.get_json()
        valor_inicial = data.get('valor_inicial', 0)
    except Exception:
        return caixa_error("Dados inválidos")
        
    user_id = get_jwt_identity()
    result, error = financeiro_service.abrir_caixa(valor_inicial, user_id)
    if error:
        existente = financeiro_service.obter_caixa_aberto(user_id)
        return caixa_error(error, 409 if existente else 400, sessao_id=existente.id if existente else None)
    return caixa_response(result, aberta=True, status=201)

@financeiro_bp.route('/caixas/minha-sessao', methods=['GET'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro', 'Atendimento')
def get_minha_sessao_caixa():
    """Return only the authenticated operator's open cash session.

    The client must never infer its active session from another operator's
    session.  A stable, explicit contract also avoids probing non-existent
    routes before every POS operation.
    """
    sessao = financeiro_service.obter_resumo_caixa_aberto(get_jwt_identity())
    return caixa_sessao_response(sessao)

@financeiro_bp.route('/caixas/<int:id>/fechar', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro', 'Atendimento')
def fechar_caixa(id):
    user_id = get_jwt_identity()
    # A simple close may intentionally have no JSON body.  Do not let Flask
    # turn that normal request into a 415 Unsupported Media Type.
    data = request.get_json(silent=True) or {}
    if 'valor_declarado_dinheiro' in data:
        result, error = financeiro_service.fechar_caixa_detalhado(id, data, user_id)
    else:
        result, error = financeiro_service.fechar_caixa(id, user_id)
    if error: return caixa_error(error)
    return caixa_response(result, aberta=False)

@financeiro_bp.route('/caixas/<int:id>/movimentos', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro', 'Atendimento')
def registrar_movimento(id):
    try:
        data = MovimentoCaixaSchema().load(request.get_json())
    except ValidationError as err:
        return caixa_error("Erro de validação", errors=err.messages)
        
    user_id = get_jwt_identity()
    try:
        result, error = financeiro_service.registrar_movimento(id, data, user_id)
        if error: return caixa_error(error)
        return jsonify(MovimentoCaixaSchema().dump(result)), 201
    except CaixaEncerradoException as e:
        return caixa_error(str(e))


@financeiro_bp.route('/caixas/<int:id>/valores-esperados', methods=['GET'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro', 'Atendimento')
def get_valores_esperados(id):
    user_id = get_jwt_identity()
    result, error = financeiro_service.get_valores_esperados(id, user_id)
    if error: return caixa_error(error)
    return jsonify(result), 200

# -- CONTAS RECEBER --
@financeiro_bp.route('/contas-receber', methods=['GET'])
@jwt_required()
def get_contas_receber():
    return build_pagination(financeiro_service.conta_receber_repo, ContaReceberSchema, request)

@financeiro_bp.route('/contas-receber', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro')
def criar_conta_receber():
    try:
        data = ContaReceberSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = financeiro_service.criar_conta_receber(data, user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(ContaReceberSchema().dump(result)), 201

@financeiro_bp.route('/contas-receber/<int:id>/receber', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro')
def receber_conta(id):
    try:
        data = PagamentoContaSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = financeiro_service.receber_conta(id, data['valor'], user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(ContaReceberSchema().dump(result)), 200

# -- CONTAS PAGAR --
@financeiro_bp.route('/contas-pagar', methods=['GET'])
@jwt_required()
def get_contas_pagar():
    return build_pagination(financeiro_service.conta_pagar_repo, ContaPagarSchema, request)

@financeiro_bp.route('/contas-pagar', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro')
def criar_conta_pagar():
    try:
        data = ContaPagarSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = financeiro_service.criar_conta_pagar(data, user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(ContaPagarSchema().dump(result)), 201

@financeiro_bp.route('/contas-pagar/<int:id>/pagar', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro')
def pagar_conta(id):
    user_id = get_jwt_identity()
    result, error = financeiro_service.pagar_conta(id, user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(ContaPagarSchema().dump(result)), 200

# -- FLUXO CAIXA --
@financeiro_bp.route('/fluxo-caixa', methods=['GET'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro')
def fluxo_caixa():
    inicio_str = request.args.get('inicio', datetime.now().strftime('%Y-%m-01'))
    fim_str = request.args.get('fim', datetime.now().strftime('%Y-%m-%d'))
    
    try:
        inicio = datetime.strptime(inicio_str, '%Y-%m-%d')
        fim = datetime.strptime(fim_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({"msg": "Datas invalidas"}), 400
        
    fluxo = financeiro_service.obter_fluxo_caixa(inicio, fim)
    return jsonify(fluxo), 200

@financeiro_bp.route('/fecho-diario', methods=['GET'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro')
def fechar_dia_get():
    try:
        from app.models.comercial import FechoDiario
        fechos = FechoDiario.query.order_by(FechoDiario.data.desc()).all()
        return jsonify([{
            'id': f.id,
            'data': f.data.isoformat(),
            'total_vendas': str(f.total_vendas),
            'total_recebido': str(f.total_recebido),
            'total_despesas': str(f.total_despesas),
            'total_caixas': str(f.total_caixas),
            'observacoes': f.observacoes
        } for f in fechos]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@financeiro_bp.route('/fecho-diario', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro')
def fechar_dia():
    try:
        from app.services.comercial_service import ComercialService
        data = request.get_json() or {}
        user_id = get_jwt_identity()
        comercial_s = ComercialService()
        
        # In a real app we would compute the totals. Leaving it simple here.
        # This is a stub for fecho diário implementation
        fecho = comercial_s.fecho_diario(data.get('data', datetime.now().strftime('%Y-%m-%d')), user_id)
        if not fecho:
             return jsonify({'error': 'Erro ao fechar dia'}), 400
        
        return jsonify({
             'id': fecho.id, 
             'data': fecho.data.isoformat(), 
             'total_vendas': str(fecho.total_vendas)
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@financeiro_bp.route('/formas-pagamento', methods=['GET', 'POST'])
@jwt_required()
def handle_formas_pagamento():
    from app.models.financeiro import FormaPagamento
    from app.core.database import db
    try:
        if request.method == 'POST':
            data = request.json
            nova_forma = FormaPagamento(nome=data.get('nome'), ativo=True)
            db.session.add(nova_forma)
            db.session.commit()
            return jsonify({"id": nova_forma.id, "nome": nova_forma.nome}), 201
            
        formas = FormaPagamento.query.filter_by(ativo=True).all()
        return jsonify([{"id": f.id, "nome": f.nome} for f in formas]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

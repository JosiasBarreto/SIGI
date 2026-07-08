from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.producao_service import ProducaoService
from app.schemas.producao_schema import FichaTecnicaSchema, OrdemProducaoSchema, AlterarEstadoOrdemSchema
from app.middleware.auth_middleware import requires_roles
from marshmallow import ValidationError

producao_bp = Blueprint('producao', __name__)
producao_service = ProducaoService()

def build_pagination(repo, schema, request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    filters = {}
    for key, value in request.args.items():
        if key not in ['page', 'per_page', 'search'] and hasattr(repo.model_class, key):
            filters[key] = value

    search_fields = ['nome', 'codigo', 'numero'] if hasattr(repo.model_class, 'nome') or hasattr(repo.model_class, 'numero') else []
        
    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)
    
    return jsonify({
        "items": schema(many=True).dump(pagination.items),
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page
    }), 200

# --- Ficha Técnica ---
@producao_bp.route('/fichas', methods=['GET'])
@jwt_required()
def get_fichas():
    return build_pagination(producao_service.ficha_repo, FichaTecnicaSchema, request)

@producao_bp.route('/fichas', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Pastelaria', 'Cozinha')
def create_ficha():
    try:
        data = FichaTecnicaSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = producao_service.create_ficha(data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(FichaTecnicaSchema().dump(result)), 201

# --- Ordem Produção ---
@producao_bp.route('/ordens', methods=['GET'])
@jwt_required()
def get_ordens():
    return build_pagination(producao_service.ordem_repo, OrdemProducaoSchema, request)

@producao_bp.route('/ordens/<int:id>/estado', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Pastelaria', 'Cozinha')
def update_estado_ordem(id):
    try:
        data = AlterarEstadoOrdemSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = producao_service.alterar_estado_ordem(id, data['estado'], user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(OrdemProducaoSchema().dump(result)), 200

@producao_bp.route('/ordens/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Pastelaria', 'Cozinha')
def update_ordem(id):
    data = request.get_json()
    user_id = get_jwt_identity()
    result, error = producao_service.update_ordem(id, data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(OrdemProducaoSchema().dump(result)), 200

# --- Planeamento ---
@producao_bp.route('/planeamento/previsao-consumo', methods=['GET'])
@jwt_required()
def previsao_consumo():
    dias = request.args.get('dias', 7, type=int)
    dados = producao_service.prever_consumo(dias=dias)
    return jsonify(dados), 200

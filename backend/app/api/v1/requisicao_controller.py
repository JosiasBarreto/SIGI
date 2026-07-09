from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.requisicao_service import RequisicaoService, GeradorRequisicaoAutomatica
from app.schemas.requisicao_schema import (
    RequisicaoSchema, AprovarRequisicaoSchema, EntregaRequisicaoSchema, 
    DevolucaoMaterialSchema, OcorrenciaMaterialSchema
)
from app.models.requisicao import SectorRequisicao
from app.middleware.auth_middleware import requires_roles
from marshmallow import ValidationError

requisicao_bp = Blueprint('requisicoes', __name__)
req_service = RequisicaoService()

def build_pagination(repo, schema, request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    filters = {}
    for key, value in request.args.items():
        if key not in ['page', 'per_page', 'search'] and hasattr(repo.model_class, key):
            filters[key] = value

    search_fields = ['numero'] if hasattr(repo.model_class, 'numero') else []
        
    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)
    
    return jsonify({
        "items": schema(many=True).dump(pagination.items),
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page
    }), 200

@requisicao_bp.route('', methods=['GET'])
@jwt_required()
def get_requisicoes():
    return build_pagination(req_service.req_repo, RequisicaoSchema, request)

@requisicao_bp.route('', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Cozinha', 'Pastelaria')
def create_requisicao():
    try:
        data = RequisicaoSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = req_service.create_requisicao(data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(RequisicaoSchema().dump(result)), 201

@requisicao_bp.route('/<int:id>/aprovar', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def aprovar_requisicao(id):
    try:
        data = AprovarRequisicaoSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = req_service.aprovar_requisicao(id, data['itens'], user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(RequisicaoSchema().dump(result)), 200

@requisicao_bp.route('/<int:id>/entregar', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def entregar_requisicao(id):
    try:
        data = EntregaRequisicaoSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = req_service.entregar_requisicao(id, data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(RequisicaoSchema().dump(result)), 200

@requisicao_bp.route('/<int:id>/devolver', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Controlador de Materiais', 'Armazém')
def devolver_material(id):
    try:
        # data is a list of devolucoes
        data = DevolucaoMaterialSchema(many=True).load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = req_service.devolver_material(id, data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(RequisicaoSchema().dump(result)), 200

@requisicao_bp.route('/<int:id>/encerrar', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Controlador de Materiais')
def encerrar_requisicao(id):
    user_id = get_jwt_identity()
    result, error = req_service.encerrar_requisicao(id, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(RequisicaoSchema().dump(result)), 200

@requisicao_bp.route('/sugestao', methods=['GET'])
@jwt_required()
@requires_roles('Administrador', 'Cozinha', 'Pastelaria')
def obter_sugestao():
    sector_str = request.args.get('sector')
    if not sector_str or sector_str not in [e.value for e in SectorRequisicao]:
        return jsonify({"msg": "Sector inválido"}), 400
        
    sector = SectorRequisicao(sector_str)
    sugestao = GeradorRequisicaoAutomatica.gerar_sugestao(sector)
    return jsonify(sugestao), 200

@requisicao_bp.route('/ocorrencias', methods=['GET'])
@jwt_required()
def get_ocorrencias():
    return build_pagination(req_service.ocorrencia_repo, OcorrenciaMaterialSchema, request)
#listar o historico de todas as requisicoes de um determinado material, com filtros por data, tipo de movimento e utilizador

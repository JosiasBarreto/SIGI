from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.logistica_service import LogisticaService
from app.schemas.logistica_schema import MotoristaSchema, ViaturaSchema, EntregaSchema, AlterarEstadoEntregaSchema, OcorrenciaLogisticaSchema
from app.middleware.auth_middleware import requires_roles
from marshmallow import ValidationError

logistica_bp = Blueprint('logistica', __name__)
logistica_service = LogisticaService()

def build_pagination(repo, schema, request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    filters = {}
    for key, value in request.args.items():
        if key not in ['page', 'per_page', 'search'] and hasattr(repo.model_class, key):
            filters[key] = value

    search_fields = ['nome', 'matricula', 'numero']
    search_fields = [f for f in search_fields if hasattr(repo.model_class, f)]
        
    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)
    
    return jsonify({
        "items": schema(many=True).dump(pagination.items),
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page
    }), 200

# MOTORISTAS
@logistica_bp.route('/motoristas', methods=['GET'])
@jwt_required()
def get_motoristas():
    return build_pagination(logistica_service.motorista_repo, MotoristaSchema, request)

@logistica_bp.route('/motoristas', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém', 'Motorista')
def create_motorista():
    try:
        data = MotoristaSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = logistica_service.create_motorista(data, user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(MotoristaSchema().dump(result)), 201

# VIATURAS
@logistica_bp.route('/viaturas', methods=['GET'])
@jwt_required()
def get_viaturas():
    return build_pagination(logistica_service.viatura_repo, ViaturaSchema, request)

@logistica_bp.route('/viaturas', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def create_viatura():
    try:
        data = ViaturaSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = logistica_service.create_viatura(data, user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(ViaturaSchema().dump(result)), 201

# ENTREGAS
@logistica_bp.route('/entregas', methods=['GET'])
@jwt_required()
def get_entregas():
    return build_pagination(logistica_service.entrega_repo, EntregaSchema, request)

@logistica_bp.route('/entregas', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento', 'Armazém')
def create_entrega():
    try:
        data = EntregaSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = logistica_service.create_entrega(data, user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(EntregaSchema().dump(result)), 201

@logistica_bp.route('/entregas/<int:id>/estado', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Motorista', 'Armazém')
def update_estado_entrega(id):
    try:
        data = AlterarEstadoEntregaSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = logistica_service.alterar_estado_entrega(id, data['estado'], user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(EntregaSchema().dump(result)), 200

@logistica_bp.route('/entregas/<int:id>/ocorrencia', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Motorista', 'Armazém')
def log_ocorrencia(id):
    try:
        data = OcorrenciaLogisticaSchema().load(request.get_json() | {'entrega_id': id})
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = logistica_service.registrar_ocorrencia(id, data, user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(OcorrenciaLogisticaSchema().dump(result)), 201

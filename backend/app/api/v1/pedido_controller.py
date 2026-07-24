from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.pedido_service import PedidoService
from app.schemas.pedido_schema import ClienteSchema, PedidoSchema, AlterarEstadoPedidoSchema
from app.middleware.auth_middleware import requires_roles
from marshmallow import ValidationError
import io

pedido_bp = Blueprint('pedidos', __name__)
pedido_service = PedidoService()

def build_pagination(repo, schema, request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    filters = {}
    for key, value in request.args.items():
        if key not in ['page', 'per_page', 'search'] and hasattr(repo.model_class, key):
            filters[key] = value

    search_fields = ['nome', 'numero', 'nif', 'telefone']
        
    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)
    
    return jsonify({
        "items": schema(many=True).dump(pagination.items),
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page
    }), 200

# --- CLIENTES ---
@pedido_bp.route('/clientes', methods=['GET'])
@jwt_required()
def get_clientes():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    filters = {}
    for key, value in request.args.items():
        if key not in ['page', 'per_page', 'search'] and hasattr(pedido_service.cliente_repo.model_class, key):
            filters[key] = value
    search_fields = ['nome', 'nif', 'telefone']
    pagination = pedido_service.cliente_repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields, include_inactive=True)
    return jsonify({
        'items': ClienteSchema(many=True).dump(pagination.items),
        'total': pagination.total,
        'pages': pagination.pages,
        'page': page
    }), 200
@pedido_bp.route('/clientes', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento')
def create_cliente():
    try:
        data = ClienteSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = pedido_service.create_cliente(data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(ClienteSchema().dump(result)), 201

# --- PEDIDOS ---
@pedido_bp.route('', methods=['GET'])
@jwt_required()
def get_pedidos():
    return build_pagination(pedido_service.pedido_repo, PedidoSchema, request)

@pedido_bp.route('', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento')
def create_pedido():
    try:
        data = PedidoSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = pedido_service.create_pedido(data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(PedidoSchema().dump(result)), 201

@pedido_bp.route('/<int:id>/estado', methods=['PUT'])
@jwt_required()
def update_estado(id):
    try:
        data = AlterarEstadoPedidoSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = pedido_service.alterar_estado(id, data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(PedidoSchema().dump(result)), 200

@pedido_bp.route('/<int:id>/pagamentos', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro', 'Atendimento')
def add_pagamento(id):
    data = request.json
    user_id = get_jwt_identity()
    pagamento, error = pedido_service.add_pagamento(id, data, user_id)
    if error:
        return jsonify({'error': error}), 400
    
    return jsonify({'message': 'Pagamento registado com sucesso', 'id': pagamento.id}), 201

# --- PDF ---
@pedido_bp.route('/<int:id>/pdf', methods=['GET'])
@jwt_required()
def gerar_pdf(id):
    pedido = pedido_service.pedido_repo.get_by_id(id)
    if not pedido: return jsonify({"msg": "Not found"}), 404
    
    from app.services.pdf_generator import generate_pedido_pdf
    buffer = generate_pedido_pdf(pedido)
    
    return send_file(buffer, as_attachment=True, download_name=f"pedido_{pedido.numero}.pdf", mimetype='application/pdf')

@pedido_bp.route('/<int:id>/recibo', methods=['GET'])
@jwt_required()
def gerar_recibo(id):
    pedido = pedido_service.pedido_repo.get_by_id(id)
    if not pedido: return jsonify({"msg": "Not found"}), 404
    
    from app.services.pdf_generator import generate_pedido_receipt
    buffer = generate_pedido_receipt(pedido)
    
    return send_file(buffer, as_attachment=False, download_name=f"recibo_{pedido.numero}.pdf", mimetype='application/pdf')

@pedido_bp.route('/clientes/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento')
def update_cliente(id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"msg": "Nenhum dado fornecido"}), 400
            
    except Exception as err:
        return jsonify({"msg": "Erro no payload", "errors": str(err)}), 400
        
    user_id = get_jwt_identity()
    result, error = pedido_service.update_cliente(id, data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(ClienteSchema().dump(result)), 200

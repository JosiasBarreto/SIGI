from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.receita_service import receita_service

receita_bp = Blueprint('receita', __name__)

@receita_bp.route('', methods=['GET'])
@jwt_required()
def get_receitas():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    data, error = receita_service.list_receitas(page, per_page, search)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(data), 200

@receita_bp.route('', methods=['POST'])
@jwt_required()
def create_receita():
    user_id = get_jwt_identity()
    receita, error = receita_service.create_receita(request.json, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify({"msg": "Receita criada com sucesso", "id": receita.id}), 201

@receita_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_receita(id):
    data, error = receita_service.get_receita(id)
    if error:
        return jsonify({"msg": error}), 404
    return jsonify(data), 200

@receita_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def edit_receita(id):
    user_id = get_jwt_identity()
    receita, error = receita_service.edit_receita(id, request.json, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify({"msg": "Receita atualizada", "id": receita.id}), 200

@receita_bp.route('/<int:id>/itens', methods=['POST'])
@jwt_required()
def add_ingrediente(id):
    user_id = get_jwt_identity()
    item, error = receita_service.add_ingrediente(id, request.json, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify({"msg": "Ingrediente adicionado", "id": item.id}), 201

@receita_bp.route('/<int:id>/itens/<int:item_id>', methods=['DELETE'])
@jwt_required()
def remove_ingrediente(id, item_id):
    user_id = get_jwt_identity()
    success, error = receita_service.remove_ingrediente(id, item_id, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify({"msg": "Ingrediente removido"}), 200

@receita_bp.route('/<int:id>/duplicar', methods=['POST'])
@jwt_required()
def duplicar_receita(id):
    user_id = get_jwt_identity()
    new_produto_id = request.json.get('novo_produto_id')
    receita, error = receita_service.duplicate_receita(id, new_produto_id, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify({"msg": "Receita duplicada com sucesso", "id": receita.id}), 201


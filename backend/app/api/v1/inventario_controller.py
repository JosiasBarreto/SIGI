from flask import Blueprint, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.inventario_service import InventarioService
from app.core.errors import ApiResponse
from flasgger import swag_from

inventario_bp = Blueprint('inventario', __name__)
service = InventarioService()

@inventario_bp.route('', methods=['POST'])
@jwt_required()
def create():
    data = request.json
    user_id = get_jwt_identity()
    obj, error = service.create_inventario(data, user_id)
    if error: return ApiResponse.success(message=error, status=400)
    return ApiResponse.success(data={"id": obj.id, "numero": obj.numero}, message="Inventário iniciado", status=201)

@inventario_bp.route('/<int:id>/concluir', methods=['POST'])
@jwt_required()
def concluir(id):
    user_id = get_jwt_identity()
    obj, error = service.concluir_inventario(id, user_id)
    if error: return ApiResponse.success(message=error, status=400)
    return ApiResponse.success(message="Inventário concluído e stocks ajustados")

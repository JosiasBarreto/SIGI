from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.turno_service import turno_service

turno_bp = Blueprint('turno', __name__)

@turno_bp.route('', methods=['GET'])
@jwt_required()
def list_turnos():
    """
    List all shifts (turnos)
    """
    active_only = request.args.get('active_only', 'false').lower() == 'true'
    data, error = turno_service.list_turnos(active_only=active_only)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(data), 200

@turno_bp.route('', methods=['POST'])
@jwt_required()
def create_turno():
    """
    Create a new shift
    """
    user_id = get_jwt_identity()
    data = request.json or {}
    
    result, error = turno_service.create_turno(data, user_id=user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(result), 201

@turno_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_turno(id):
    """
    Update an existing shift
    """
    user_id = get_jwt_identity()
    data = request.json or {}
    
    result, error = turno_service.update_turno(id, data, user_id=user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(result), 200

@turno_bp.route('/<int:id>/toggle', methods=['PATCH'])
@jwt_required()
def toggle_turno(id):
    """
    Toggle shift active status
    """
    user_id = get_jwt_identity()
    result, error = turno_service.toggle_turno_status(id, user_id=user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(result), 200

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.user_service import UserService
from app.middleware.auth_middleware import requires_roles
from app.schemas.user_schema import CreateUserSchema, UpdateUserSchema
from marshmallow import ValidationError

user_bp = Blueprint('users', __name__)
user_service = UserService()

@user_bp.route('', methods=['POST'])
@jwt_required()
@requires_roles('Administrador')
def create_user():
    """
    Create a new user (Admin only)
    ---
    tags:
      - Users
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            name:
              type: string
            email:
              type: string
            password:
              type: string
            role:
              type: string
    responses:
      201:
        description: User created
      400:
        description: Bad request
    """
    try:
        data = CreateUserSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    current_user_id = get_jwt_identity()
    user, error = user_service.create_user(data, current_user_id)
    if error:
        return jsonify({"msg": error}), 400
        
    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }), 201

@user_bp.route('', methods=['GET'])
@jwt_required()
def get_users():
    """
    Get all users
    ---
    tags:
      - Users
    security:
      - Bearer: []
    responses:
      200:
        description: A list of users
    """
    users = user_service.get_all_users()
    return jsonify([{
        "id": u.id,
        "name": u.name,
        "email": u.email,
        "role": u.role,
        "is_active": u.is_active
    } for u in users]), 200

@user_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador')
def update_user(user_id):
    """
    Update user information
    ---
    tags:
      - Users
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
      - in: body
        name: body
        required: true
        schema:
          type: object
    responses:
      200:
        description: User updated
      400:
        description: Bad request
    """
    try:
        data = UpdateUserSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    current_user_id = get_jwt_identity()
    user, error = user_service.update_user(user_id, data, current_user_id)
    if error:
        return jsonify({"msg": error}), 400
        
    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active
    }), 200

@user_bp.route('/<int:user_id>/toggle-status', methods=['PATCH'])
@jwt_required()
@requires_roles('Administrador')
def toggle_user_status(user_id):
    """
    Toggle user active status (block/unblock)
    ---
    tags:
      - Users
    security:
      - Bearer: []
    parameters:
      - in: path
        name: user_id
        type: integer
        required: true
    responses:
      200:
        description: Status toggled
      400:
        description: Bad request
    """
    current_user_id = get_jwt_identity()
    user, error = user_service.toggle_status(user_id, int(current_user_id))
    if error:
        return jsonify({"msg": error}), 400
        
    return jsonify({
        "id": user.id,
        "is_active": user.is_active,
        "msg": "Utilizador ativado" if user.is_active else "Utilizador desativado"
    }), 200


from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService
from flasgger import swag_from
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    User Login
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
            password:
              type: string
    responses:
      200:
        description: Successful login
      401:
        description: Invalid credentials
    """
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"msg": "Email and password are required"}), 400

    result, error = auth_service.authenticate(data['email'], data['password'])
    
    if error:
        return jsonify({"msg": error}), 401
        
    return jsonify(result), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """
    User Logout
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: Successfully logged out
    """
    jti = get_jwt()["jti"]
    user_id = get_jwt_identity()
    success, error = auth_service.logout(jti, user_id)
    if error:
        return jsonify({"msg": error}), 500
    return jsonify({"msg": "Logout bem-sucedido"}), 200

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh Access Token
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    responses:
      200:
        description: New access token generated
    """
    user_id = get_jwt_identity()
    user = auth_service.user_repo.get_by_id(user_id)
    if not user:
        return jsonify({"msg": "Usuário não encontrado"}), 404
        
    result, error = auth_service.refresh(user_id, user.role)
    return jsonify(result), 200

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    Change Password
    ---
    tags:
      - Authentication
    security:
      - Bearer: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            old_password:
              type: string
            new_password:
              type: string
    responses:
      200:
        description: Password successfully changed
      400:
        description: Invalid request
    """
    data = request.get_json()
    if not data or not data.get('old_password') or not data.get('new_password'):
        return jsonify({"msg": "Dados inválidos"}), 400
        
    user_id = get_jwt_identity()
    success, error = auth_service.change_password(user_id, data['old_password'], data['new_password'])
    
    if error:
        return jsonify({"msg": error}), 400
    return jsonify({"msg": "Senha alterada com sucesso"}), 200

@auth_bp.route('/recover-password', methods=['POST'])
def recover_password():
    """
    Recover Password
    ---
    tags:
      - Authentication
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            email:
              type: string
    responses:
      200:
        description: Password recovery instructions sent
      400:
        description: Invalid request
    """
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({"msg": "Email é obrigatório"}), 400
        
    success, error, temp_pwd = auth_service.recover_password(data['email'])
    
    # Em um ambiente de produção real, não devolveríamos a senha em texto plano.
    # Enviaríamos um email. Aqui, devolvemos como demonstração para permitir o teste.
    if temp_pwd:
        return jsonify({"msg": f"Instruções e a nova senha de acesso temporária foram enviadas para o email associado. Nova senha: {temp_pwd}"}), 200
        
    return jsonify({"msg": "Se o email estiver registado, receberá as instruções de recuperação."}), 200


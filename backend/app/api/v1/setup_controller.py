from flask import Blueprint, request, jsonify
from app.core.database import db
from app.models.user import User, RoleEnum
from app.models.empresa import Empresa
from werkzeug.security import generate_password_hash

setup_bp = Blueprint('setup', __name__)

@setup_bp.route('/check', methods=['GET'])
def check_setup():
    """
    Check if the first-time setup has been completed.
    Setup is considered complete if there is at least one admin user and the Empresa record exists.
    """
    admin_exists = User.query.filter_by(role=RoleEnum.ADMINISTRADOR).first() is not None
    empresa_exists = Empresa.query.first() is not None
    
    return jsonify({
        "setup_required": not (admin_exists and empresa_exists),
        "admin_exists": admin_exists,
        "empresa_exists": empresa_exists
    }), 200

@setup_bp.route('/', methods=['POST'])
def perform_setup():
    """
    Perform the first-time setup.
    Expects JSON body with 'admin' and 'empresa' objects.
    """
    admin_exists = User.query.filter_by(role=RoleEnum.ADMINISTRADOR).first() is not None
    empresa_exists = Empresa.query.first() is not None
    
    if admin_exists and empresa_exists:
        return jsonify({"message": "Setup has already been completed."}), 400
        
    data = request.get_json()
    
    if not data or 'admin' not in data or 'empresa' not in data:
        return jsonify({"error": "Dados inválidos. Necessário 'admin' e 'empresa'."}), 400
        
    try:
        if not admin_exists:
            admin_data = data['admin']
            if not all(k in admin_data for k in ('name', 'email', 'password')):
                return jsonify({"error": "Dados do admin incompletos."}), 400
                
            new_admin = User(
                name=admin_data['name'],
                email=admin_data['email'],
                password_hash=generate_password_hash(admin_data['password']),
                role=RoleEnum.ADMINISTRADOR
            )
            db.session.add(new_admin)
            
        if not empresa_exists:
            empresa_data = data['empresa']
            if 'nome' not in empresa_data:
                return jsonify({"error": "Nome da empresa é obrigatório."}), 400
                
            new_empresa = Empresa(
                nome=empresa_data['nome'],
                nif=empresa_data.get('nif'),
                licenca_empresa=empresa_data.get('licenca_empresa'),
                licenca_aplicacao=empresa_data.get('licenca_aplicacao'),
                endereco_web=empresa_data.get('endereco_web'),
                utiliza_iva=empresa_data.get('utiliza_iva', False),
                correio_eletronico=empresa_data.get('correio_eletronico'),
                telefone=empresa_data.get('telefone'),
                telemoveis=empresa_data.get('telemoveis'),
                localizacao=empresa_data.get('localizacao'),
                logo=empresa_data.get('logo'),
                moeda=empresa_data.get('moeda', 'STN'),
                tipo_formato_impressao=empresa_data.get('tipo_formato_impressao'),
                numero_whatsapp=empresa_data.get('numero_whatsapp')
            )
            db.session.add(new_empresa)
            
        db.session.commit()
        return jsonify({"message": "Configuração inicial concluída com sucesso."}), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

from flask_jwt_extended import jwt_required, get_jwt

@setup_bp.route('/empresa', methods=['GET'])
@jwt_required()
def get_empresa():
    """
    Get current company settings.
    """
    empresa = Empresa.query.first()
    if not empresa:
        return jsonify({"error": "Empresa não configurada."}), 404
        
    return jsonify({
        "id": empresa.id,
        "nome": empresa.nome,
        "nif": empresa.nif,
        "licenca_empresa": empresa.licenca_empresa,
        "licenca_aplicacao": empresa.licenca_aplicacao,
        "endereco_web": empresa.endereco_web,
        "utiliza_iva": empresa.utiliza_iva,
        "correio_eletronico": empresa.correio_eletronico,
        "telefone": empresa.telefone,
        "telemoveis": empresa.telemoveis,
        "localizacao": empresa.localizacao,
        "logo": empresa.logo,
        "moeda": empresa.moeda,
        "tipo_formato_impressao": empresa.tipo_formato_impressao,
        "numero_whatsapp": empresa.numero_whatsapp
    }), 200

@setup_bp.route('/empresa', methods=['PUT'])
@jwt_required()
def update_empresa():
    """
    Update company settings.
    Requires ADMIN role.
    """
    claims = get_jwt()
    if claims.get('role') != RoleEnum.ADMINISTRADOR.value:
        return jsonify({"error": "Acesso negado. Apenas administradores podem alterar as configurações da empresa."}), 403

    empresa = Empresa.query.first()
    if not empresa:
        return jsonify({"error": "Empresa não configurada."}), 404
        
    data = request.get_json()
    if not data:
        return jsonify({"error": "Nenhum dado fornecido."}), 400
        
    if 'nome' in data:
        empresa.nome = data['nome']
    if 'nif' in data:
        empresa.nif = data['nif']
    if 'licenca_empresa' in data:
        empresa.licenca_empresa = data['licenca_empresa']
    if 'licenca_aplicacao' in data:
        empresa.licenca_aplicacao = data['licenca_aplicacao']
    if 'endereco_web' in data:
        empresa.endereco_web = data['endereco_web']
    if 'utiliza_iva' in data:
        empresa.utiliza_iva = data['utiliza_iva']
    if 'correio_eletronico' in data:
        empresa.correio_eletronico = data['correio_eletronico']
    if 'telefone' in data:
        empresa.telefone = data['telefone']
    if 'telemoveis' in data:
        empresa.telemoveis = data['telemoveis']
    if 'localizacao' in data:
        empresa.localizacao = data['localizacao']
    if 'logo' in data:
        empresa.logo = data['logo']
    if 'moeda' in data:
        empresa.moeda = data['moeda']
    if 'tipo_formato_impressao' in data:
        empresa.tipo_formato_impressao = data['tipo_formato_impressao']
    if 'numero_whatsapp' in data:
        empresa.numero_whatsapp = data['numero_whatsapp']
        
    try:
        db.session.commit()
        return jsonify({"message": "Configurações da empresa atualizadas com sucesso."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

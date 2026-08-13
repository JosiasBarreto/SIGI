from flask import Blueprint, jsonify, send_file, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.middleware.auth_middleware import requires_roles
from app.services.backup_service import backup_service
from app.services.audit_service import AuditService
import os

backup_bp = Blueprint('backup', __name__)

@backup_bp.route('', methods=['GET'])
@jwt_required()
@requires_roles('Administrador')
def list_backups():
    return jsonify({'items': backup_service.list()}), 200

@backup_bp.route('', methods=['POST'])
@jwt_required()
@requires_roles('Administrador')
def create_backup():
    try:
        result = backup_service.create()
        AuditService.log_action(get_jwt_identity(), 'BACKUP', 'sistema', new_values={'filename': result['filename']}, modulo='CONFIGURACOES')
        return jsonify(result), 201
    except Exception as error:
        return jsonify({'msg': f'Não foi possível criar o backup: {error}'}), 500

@backup_bp.route('/<path:filename>/download', methods=['GET'])
@jwt_required()
@requires_roles('Administrador')
def download_backup(filename):
    for item in backup_service.list():
        if item['filename'] == filename:
            return send_file(os.path.join(backup_service._dir(), filename), as_attachment=True, download_name=filename)
    return jsonify({'msg': 'Backup não encontrado'}), 404

@backup_bp.route('/restore', methods=['POST'])
@jwt_required()
@requires_roles('Administrador')
def restore_backup():
    try:
        backup_service.restore(request.files.get('file'))
        AuditService.log_action(get_jwt_identity(), 'RESTORE', 'sistema', modulo='CONFIGURACOES')
        return jsonify({'msg': 'Restauro concluído. Reinicie o serviço para renovar as sessões ativas.'}), 200
    except ValueError as error:
        return jsonify({'msg': str(error)}), 400
    except Exception as error:
        return jsonify({'msg': f'Falha no restauro: {error}'}), 500

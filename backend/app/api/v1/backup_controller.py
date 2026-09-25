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
    """Lista todos os ficheiros de backup disponíveis no servidor."""
    items = backup_service.list()
    return jsonify({'items': items, 'total': len(items)}), 200

@backup_bp.route('', methods=['POST'])
@jwt_required()
@requires_roles('Administrador')
def create_backup():
    """Cria um novo backup completo (.sql)."""
    try:
        result = backup_service.create()
        AuditService.log_action(
            get_jwt_identity(),
            'BACKUP',
            'sistema',
            new_values={'filename': result['filename'], 'size': result.get('formatted_size')},
            modulo='CONFIGURACOES'
        )
        return jsonify({
            'msg': 'Backup da base de dados criado com sucesso!',
            'backup': result
        }), 201
    except Exception as error:
        return jsonify({'msg': f'Não foi possível criar o backup: {str(error)}'}), 500

@backup_bp.route('/<path:filename>/download', methods=['GET'])
@jwt_required()
@requires_roles('Administrador')
def download_backup(filename):
    """Descarrega o ficheiro .sql do backup."""
    clean_filename = os.path.basename(filename)
    target_path = os.path.join(backup_service._dir(), clean_filename)
    if os.path.exists(target_path) and clean_filename.endswith('.sql'):
        return send_file(
            target_path,
            as_attachment=True,
            download_name=clean_filename,
            mimetype='application/sql'
        )
    return jsonify({'msg': 'Ficheiro de backup não encontrado'}), 404

@backup_bp.route('/restore', methods=['POST'])
@jwt_required()
@requires_roles('Administrador')
def restore_backup():
    """Restaura a base de dados a partir de um ficheiro .sql enviado por upload."""
    try:
        uploaded = request.files.get('file')
        if not uploaded:
            return jsonify({'msg': 'Nenhum ficheiro .sql fornecido para restauro.'}), 400
            
        result = backup_service.restore(uploaded_file=uploaded)
        AuditService.log_action(
            get_jwt_identity(),
            'RESTORE',
            'sistema',
            new_values={'source': uploaded.filename, 'method': result.get('method')},
            modulo='CONFIGURACOES'
        )
        return jsonify({
            'msg': 'Base de dados restaurada com sucesso a partir do ficheiro enviado!',
            'result': result
        }), 200
    except ValueError as error:
        return jsonify({'msg': str(error)}), 400
    except Exception as error:
        return jsonify({'msg': f'Falha no restauro: {str(error)}'}), 500

@backup_bp.route('/<path:filename>/restore', methods=['POST'])
@jwt_required()
@requires_roles('Administrador')
def restore_from_existing(filename):
    """Restaura a base de dados a partir de um backup já existente no servidor."""
    try:
        clean_filename = os.path.basename(filename)
        result = backup_service.restore(filename=clean_filename)
        AuditService.log_action(
            get_jwt_identity(),
            'RESTORE',
            'sistema',
            new_values={'source': clean_filename, 'method': result.get('method')},
            modulo='CONFIGURACOES'
        )
        return jsonify({
            'msg': f'Base de dados restaurada com sucesso a partir de {clean_filename}!',
            'result': result
        }), 200
    except ValueError as error:
        return jsonify({'msg': str(error)}), 400
    except Exception as error:
        return jsonify({'msg': f'Falha no restauro: {str(error)}'}), 500

@backup_bp.route('/<path:filename>', methods=['DELETE'])
@jwt_required()
@requires_roles('Administrador')
def delete_backup(filename):
    """Elimina um ficheiro de backup do servidor."""
    try:
        clean_filename = os.path.basename(filename)
        deleted = backup_service.delete(clean_filename)
        if deleted:
            AuditService.log_action(
                get_jwt_identity(),
                'DELETE_BACKUP',
                'sistema',
                new_values={'filename': clean_filename},
                modulo='CONFIGURACOES'
            )
            return jsonify({'msg': f'Backup {clean_filename} eliminado com sucesso.'}), 200
        return jsonify({'msg': 'Ficheiro de backup não encontrado.'}), 404
    except Exception as error:
        return jsonify({'msg': f'Erro ao eliminar backup: {str(error)}'}), 500

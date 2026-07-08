from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.evento_service import EventoService
from app.schemas.evento_schema import EspacoSchema, EventoSchema, AlterarEstadoEventoSchema
from app.middleware.auth_middleware import requires_roles
from marshmallow import ValidationError
import io

evento_bp = Blueprint('eventos', __name__)
evento_service = EventoService()

def build_pagination(repo, schema, request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    filters = {}
    for key, value in request.args.items():
        if key not in ['page', 'per_page', 'search'] and hasattr(repo.model_class, key):
            filters[key] = value

    search_fields = ['titulo', 'numero', 'nome'] if hasattr(repo.model_class, 'nome') or hasattr(repo.model_class, 'titulo') else []
        
    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)
    
    return jsonify({
        "items": schema(many=True).dump(pagination.items),
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page
    }), 200

# ESPAÇOS
@evento_bp.route('/espacos', methods=['GET'])
@jwt_required()
def get_espacos():
    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)

@evento_bp.route('/espacos', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento')
def create_espaco():
    try:
        data = EspacoSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = evento_service.create_espaco(data, user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(EspacoSchema().dump(result)), 201

# EVENTOS
@evento_bp.route('', methods=['GET'])
@jwt_required()
def get_eventos():
    return build_pagination(evento_service.evento_repo, EventoSchema, request)

@evento_bp.route('/<int:id>/faturar', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def faturar_evento(id):
    from app.services.comercial_service import ComercialService
    com_service = ComercialService()
    
    data = request.get_json() or {}
    user_id = get_jwt_identity()
    
    venda, err = com_service.converter_evento_em_venda(id, data, user_id)
    if err:
        return jsonify({"msg": err}), 400
        
    return jsonify({"msg": "Evento faturado com sucesso", "venda_id": venda.id}), 200

@evento_bp.route('/check-proximos', methods=['GET'])
@jwt_required()
def check_proximos():
    # Emits an alert for events happening in the next 24 hours
    from datetime import datetime, timedelta
    from app.models.evento import Evento, EstadoEvento
    from app.core.database import db
    from app.websocket.socket_manager import socketio
    
    amanha = datetime.utcnow().date() + timedelta(days=1)
    hoje = datetime.utcnow().date()
    eventos = db.session.query(Evento).filter(
        Evento.data_evento >= hoje,
        Evento.data_evento <= amanha,
        Evento.estado.in_([EstadoEvento.RASCUNHO.value, EstadoEvento.CONFIRMADO.value])
    ).all()
    
    for ev in eventos:
        socketio.emit('alerta_evento_proximo', {'numero': ev.numero, 'titulo': ev.titulo, 'data': str(ev.data_evento)})
        
    return jsonify({"msg": f"Checked {len(eventos)} upcoming events."}), 200

@evento_bp.route('', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento')
def create_evento():
    try:
        data = EventoSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = evento_service.create_evento(data, user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(EventoSchema().dump(result)), 201

@evento_bp.route('/<int:id>/estado', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento')
def alterar_estado(id):
    try:
        data = AlterarEstadoEventoSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = evento_service.alterar_estado(id, data['estado'], user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(EventoSchema().dump(result)), 200

# DOCUMENTOS
@evento_bp.route('/<int:id>/documento/<path:doc_type>', methods=['GET'])
@jwt_required()
def gerar_documento(id, doc_type):
    # Dummy document generator
    from flask import send_file
    buffer = io.BytesIO()
    buffer.write(f"DOCUMENTO {doc_type.upper()} PARA EVENTO {id}".encode('utf-8'))
    buffer.seek(0)
    ext = 'pdf' if doc_type != 'word' else 'docx'
    mimetype = 'application/pdf' if doc_type != 'word' else 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    return send_file(buffer, as_attachment=True, download_name=f"{doc_type}_{id}.{ext}", mimetype=mimetype)

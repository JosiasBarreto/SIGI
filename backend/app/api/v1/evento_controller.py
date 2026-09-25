from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.evento_service import EventoService
from app.schemas.evento_schema import (
    EspacoSchema, EventoSchema, AlterarEstadoEventoSchema,
    ServicoCadastroSchema, TipoEventoCadastroSchema, EquipaCadastroSchema,
    PoliticaComercialEventoSchema, PoliticaComercialRegraSchema
)
from app.models.evento import (
    ServicoCadastro, TipoEventoCadastro, EquipaCadastro,
    PoliticaComercialEvento, PoliticaComercialRegra, Evento
)
from app.core.database import db
from app.middleware.auth_middleware import requires_roles
from marshmallow import ValidationError, EXCLUDE
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

# SUGERIR PREÇO PELA POLÍTICA COMERCIAL
@evento_bp.route('/sugerir-preco', methods=['POST'])
@jwt_required()
def sugerir_preco():
    data = request.get_json() or {}
    res = evento_service.sugerir_preco_item(
        tipo_evento=data.get('tipo_evento'),
        numero_convidados=data.get('numero_convidados', 1),
        tipo_item=data.get('tipo_item'),
        referencia_id=data.get('referencia_id'),
        nome_item=data.get('nome_item')
    )
    return jsonify(res), 200

# POLÍTICAS COMERCIAIS E TABELA DE PREÇOS
@evento_bp.route('/politicas-comerciais', methods=['GET'])
@jwt_required()
def get_politicas_comerciais():
    search = request.args.get('search', '').strip()
    query = PoliticaComercialEvento.query
    if search:
        query = query.filter(
            (PoliticaComercialEvento.nome.ilike(f"%{search}%")) |
            (PoliticaComercialEvento.codigo.ilike(f"%{search}%")) |
            (PoliticaComercialEvento.tipo_evento.ilike(f"%{search}%"))
        )
    politicas = query.all()
    return jsonify(PoliticaComercialEventoSchema(many=True).dump(politicas)), 200

@evento_bp.route('/politicas-comerciais/<int:id>', methods=['GET'])
@jwt_required()
def get_politica_comercial_by_id(id):
    p = PoliticaComercialEvento.query.get(id)
    if not p: return jsonify({"msg": "Política comercial não encontrada"}), 404
    return jsonify(PoliticaComercialEventoSchema().dump(p)), 200

@evento_bp.route('/politicas-comerciais', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def create_politica_comercial():
    data = request.get_json() or {}
    regras_data = data.pop('regras', [])
    p = PoliticaComercialEvento(**data)
    db.session.add(p)
    db.session.flush()

    for r in regras_data:
        regra = PoliticaComercialRegra(politica_id=p.id, **r)
        db.session.add(regra)

    db.session.commit()
    return jsonify(PoliticaComercialEventoSchema().dump(p)), 201

@evento_bp.route('/politicas-comerciais/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def update_politica_comercial(id):
    p = PoliticaComercialEvento.query.get(id)
    if not p: return jsonify({"msg": "Política comercial não encontrada"}), 404
    
    data = request.get_json() or {}
    regras_data = data.pop('regras', None)
    
    for k, v in data.items():
        if hasattr(p, k) and k not in ['id', 'regras']:
            setattr(p, k, v)
            
    if regras_data is not None:
        p.regras.clear()
        for r in regras_data:
            regra = PoliticaComercialRegra(politica_id=p.id, **r)
            db.session.add(regra)

    db.session.commit()
    return jsonify(PoliticaComercialEventoSchema().dump(p)), 200

@evento_bp.route('/politicas-comerciais/<int:id>/desativar', methods=['PATCH', 'PUT', 'DELETE'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def desativar_politica_comercial(id):
    p = PoliticaComercialEvento.query.get(id)
    if not p: return jsonify({"msg": "Política comercial não encontrada"}), 404
    p.estado = 'Inativa'
    db.session.commit()
    return jsonify({"msg": f"Política Comercial '{p.nome}' desativada com sucesso."}), 200

@evento_bp.route('/politicas-comerciais/<int:id>/regras', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def add_regra_politica_comercial(id):
    p = PoliticaComercialEvento.query.get(id)
    if not p: return jsonify({"msg": "Política comercial não encontrada"}), 404
    
    r_data = request.get_json() or {}
    regra = PoliticaComercialRegra(politica_id=p.id, **r_data)
    db.session.add(regra)
    db.session.commit()
    return jsonify(PoliticaComercialRegraSchema().dump(regra)), 201

@evento_bp.route('/politicas-comerciais/<int:id>/regras/<int:regra_id>', methods=['DELETE'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def delete_regra_politica_comercial(id, regra_id):
    regra = PoliticaComercialRegra.query.filter_by(id=regra_id, politica_id=id).first()
    if not regra: return jsonify({"msg": "Regra não encontrada"}), 404
    db.session.delete(regra)
    db.session.commit()
    return jsonify({"msg": "Regra removida com sucesso"}), 200

# CADASTROS BASE DE SERVIÇOS
@evento_bp.route('/cadastros/servicos', methods=['GET'])
@jwt_required()
def get_servicos_cadastro():
    search = request.args.get('search', '').strip()
    include_inativos = request.args.get('include_inativos', 'false').lower() == 'true'
    
    query = ServicoCadastro.query
    if not include_inativos:
        query = query.filter_by(ativo=True)
    if search:
        query = query.filter(
            (ServicoCadastro.nome.ilike(f"%{search}%")) |
            (ServicoCadastro.codigo.ilike(f"%{search}%")) |
            (ServicoCadastro.categoria.ilike(f"%{search}%"))
        )
    servicos = query.order_by(ServicoCadastro.nome.asc()).all()
    return jsonify(ServicoCadastroSchema(many=True).dump(servicos)), 200

@evento_bp.route('/cadastros/servicos', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def create_servico_cadastro():
    data = request.get_json() or {}
    s = ServicoCadastro(**data)
    db.session.add(s)
    db.session.commit()
    return jsonify(ServicoCadastroSchema().dump(s)), 201

@evento_bp.route('/cadastros/servicos/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def update_servico_cadastro(id):
    s = ServicoCadastro.query.get(id)
    if not s: return jsonify({"msg": "Serviço não encontrado"}), 404
    data = request.get_json() or {}
    for k, v in data.items():
        if hasattr(s, k) and k != 'id':
            setattr(s, k, v)
    db.session.commit()
    return jsonify(ServicoCadastroSchema().dump(s)), 200

@evento_bp.route('/cadastros/servicos/<int:id>/desativar', methods=['PATCH', 'PUT', 'DELETE'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def desativar_servico_cadastro(id):
    s = ServicoCadastro.query.get(id)
    if not s: return jsonify({"msg": "Serviço não encontrado"}), 404
    s.ativo = False
    db.session.commit()
    return jsonify({"msg": f"Serviço '{s.nome}' desativado com sucesso."}), 200

# CADASTROS BASE DE TIPOS DE EVENTO
@evento_bp.route('/cadastros/tipos-evento', methods=['GET'])
@jwt_required()
def get_tipos_evento_cadastro():
    search = request.args.get('search', '').strip()
    include_inativos = request.args.get('include_inativos', 'false').lower() == 'true'
    
    query = TipoEventoCadastro.query
    if not include_inativos:
        query = query.filter_by(ativo=True)
    if search:
        query = query.filter(TipoEventoCadastro.nome.ilike(f"%{search}%"))
    tipos = query.order_by(TipoEventoCadastro.nome.asc()).all()
    return jsonify(TipoEventoCadastroSchema(many=True).dump(tipos)), 200

@evento_bp.route('/cadastros/tipos-evento', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def create_tipo_evento_cadastro():
    data = request.get_json() or {}
    t = TipoEventoCadastro(**data)
    db.session.add(t)
    db.session.commit()
    return jsonify(TipoEventoCadastroSchema().dump(t)), 201

@evento_bp.route('/cadastros/tipos-evento/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def update_tipo_evento_cadastro(id):
    t = TipoEventoCadastro.query.get(id)
    if not t: return jsonify({"msg": "Tipo de evento não encontrado"}), 404
    data = request.get_json() or {}
    for k, v in data.items():
        if hasattr(t, k) and k != 'id':
            setattr(t, k, v)
    db.session.commit()
    return jsonify(TipoEventoCadastroSchema().dump(t)), 200

@evento_bp.route('/cadastros/tipos-evento/<int:id>/desativar', methods=['PATCH', 'PUT', 'DELETE'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def desativar_tipo_evento_cadastro(id):
    t = TipoEventoCadastro.query.get(id)
    if not t: return jsonify({"msg": "Tipo de evento não encontrado"}), 404
    t.ativo = False
    db.session.commit()
    return jsonify({"msg": f"Tipo de evento '{t.nome}' desativado com sucesso."}), 200

# CADASTROS BASE DE EQUIPAS
@evento_bp.route('/cadastros/equipas', methods=['GET'])
@jwt_required()
def get_equipas_cadastro():
    search = request.args.get('search', '').strip()
    include_inativos = request.args.get('include_inativos', 'false').lower() == 'true'
    
    query = EquipaCadastro.query
    if not include_inativos:
        query = query.filter_by(ativo=True)
    if search:
        query = query.filter(
            (EquipaCadastro.nome.ilike(f"%{search}%")) |
            (EquipaCadastro.departamento.ilike(f"%{search}%"))
        )
    equipas = query.order_by(EquipaCadastro.nome.asc()).all()
    return jsonify(EquipaCadastroSchema(many=True).dump(equipas)), 200

@evento_bp.route('/cadastros/equipas', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def create_equipa_cadastro():
    data = request.get_json() or {}
    eq = EquipaCadastro(**data)
    db.session.add(eq)
    db.session.commit()
    return jsonify(EquipaCadastroSchema().dump(eq)), 201

@evento_bp.route('/cadastros/equipas/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def update_equipa_cadastro(id):
    eq = EquipaCadastro.query.get(id)
    if not eq: return jsonify({"msg": "Equipa não encontrada"}), 404
    data = request.get_json() or {}
    for k, v in data.items():
        if hasattr(eq, k) and k != 'id':
            setattr(eq, k, v)
    db.session.commit()
    return jsonify(EquipaCadastroSchema().dump(eq)), 200

@evento_bp.route('/cadastros/equipas/<int:id>/desativar', methods=['PATCH', 'PUT', 'DELETE'])
@jwt_required()
@requires_roles('Administrador', 'Comercial')
def desativar_equipa_cadastro(id):
    eq = EquipaCadastro.query.get(id)
    if not eq: return jsonify({"msg": "Equipa não encontrada"}), 404
    eq.ativo = False
    db.session.commit()
    return jsonify({"msg": f"Equipa '{eq.nome}' desativada com sucesso."}), 200

# ESPAÇOS
@evento_bp.route('/espacos', methods=['GET'])
@evento_bp.route('/cadastros/espacos', methods=['GET'])
@jwt_required()
def get_espacos():
    return build_pagination(evento_service.espaco_repo, EspacoSchema, request)

@evento_bp.route('/espacos', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento', 'Comercial')
def create_espaco():
    try:
        data = EspacoSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = evento_service.create_espaco(data, user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(EspacoSchema().dump(result)), 201

@evento_bp.route('/espacos/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento', 'Comercial')
def update_espaco(id):
    esp = Espaco.query.get(id)
    if not esp: return jsonify({"msg": "Espaço não encontrado"}), 404
    data = request.get_json() or {}
    for k, v in data.items():
        if hasattr(esp, k) and k != 'id':
            setattr(esp, k, v)
    db.session.commit()
    return jsonify(EspacoSchema().dump(esp)), 200

@evento_bp.route('/espacos/<int:id>/desativar', methods=['PATCH', 'PUT', 'DELETE'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento', 'Comercial')
def desativar_espaco(id):
    esp = Espaco.query.get(id)
    if not esp: return jsonify({"msg": "Espaço não encontrado"}), 404
    esp.estado = 'Inativo'
    db.session.commit()
    return jsonify({"msg": f"Espaço '{esp.nome}' desativado com sucesso."}), 200

# EVENTOS
@evento_bp.route('', methods=['GET'])
@jwt_required()
def get_eventos():
    return build_pagination(evento_service.evento_repo, EventoSchema, request)

@evento_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_evento_by_id(id):
    evento = evento_service.evento_repo.get_by_id(id)
    if not evento:
        return jsonify({"msg": "Evento não encontrado"}), 404
    return jsonify(EventoSchema().dump(evento)), 200

@evento_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento', 'Comercial')
def update_evento(id):
    raw_data = request.get_json() or {}
    try:
        data = EventoSchema().load(raw_data, partial=True, unknown=EXCLUDE)
    except ValidationError as err:
        # If schema validation fails on nested object details, extract valid raw fields
        data = raw_data
        
    user_id = get_jwt_identity()
    result, error = evento_service.update_evento(id, data, user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(EventoSchema().dump(result)), 200

@evento_bp.route('/<int:id>/faturar', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Comercial', 'Atendimento')
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
    from datetime import datetime, timedelta
    from app.models.evento import Evento
    from app.websocket.socket_manager import emit_sync_event
    
    amanha = datetime.utcnow().date() + timedelta(days=1)
    hoje = datetime.utcnow().date()
    eventos = db.session.query(Evento).filter(
        Evento.data_evento >= hoje,
        Evento.data_evento <= amanha
    ).all()
    
    for ev in eventos:
        emit_sync_event('alerta_evento_proximo', {'numero': ev.numero, 'titulo': ev.titulo, 'data': str(ev.data_evento)})
        
    return jsonify({"msg": f"Checked {len(eventos)} upcoming events."}), 200

@evento_bp.route('', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento', 'Comercial')
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
@requires_roles('Administrador', 'Atendimento', 'Comercial')
def alterar_estado(id):
    try:
        data = AlterarEstadoEventoSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = evento_service.alterar_estado(id, data['estado'], user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify(EventoSchema().dump(result)), 200

@evento_bp.route('/<int:id>/gerar-planeamento', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Atendimento', 'Comercial')
def gerar_planeamento(id):
    user_id = get_jwt_identity()
    resumo, error = evento_service.gerar_planeamento(id, user_id)
    if error: return jsonify({"msg": error}), 400
    return jsonify({
        "msg": "Planeamento opercional gerado com sucesso!",
        "resumo_operacional": resumo
    }), 200

# DOCUMENTOS
@evento_bp.route('/<int:id>/documento/<path:doc_type>', methods=['GET'])
@jwt_required()
def gerar_documento(id, doc_type):
    from flask import send_file
    from app.models.evento import Evento
    from app.services.pdf_generator import generate_evento_pdf, generate_evento_receipt
    
    evento = Evento.query.get(id)
    if not evento:
        return jsonify({"msg": "Evento não encontrado"}), 404
        
    doc_type_lower = doc_type.lower()
    if 'termico' in doc_type_lower or 'receipt' in doc_type_lower:
        pdf_buffer = generate_evento_receipt(evento, doc_type_lower)
    else:
        pdf_buffer = generate_evento_pdf(evento, doc_type_lower)
        
    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=f"evento_{evento.numero}_{doc_type}.pdf",
        mimetype='application/pdf'
    )

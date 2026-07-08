from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from app.core.database import db
from app.models.evento import Evento
from app.models.pedido import Pedido
from app.models.ordem_producao import OrdemProducao
from app.models.logistica import Entrega
from app.models.requisicao import Requisicao
from sqlalchemy import extract
from datetime import datetime

calendario_bp = Blueprint('calendario', __name__)

@calendario_bp.route('/dia', methods=['GET'])
@jwt_required()
def get_calendario_dia():
    date_str = request.args.get('data', datetime.utcnow().strftime('%Y-%m-%d'))
    try:
        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"msg": "Formato de data inválido. Use YYYY-MM-DD"}), 400
        
    eventos = db.session.query(Evento).filter(Evento.data_evento == date_obj, Evento.is_active == True).all()
    pedidos = db.session.query(Pedido).filter(Pedido.data_entrega == date_obj, Pedido.is_active == True).all()
    producoes = db.session.query(OrdemProducao).filter(OrdemProducao.data_producao == date_obj, OrdemProducao.is_active == True).all()
    entregas = db.session.query(Entrega).filter(Entrega.data_saida == date_obj, Entrega.is_active == True).all()
    
    return jsonify({
        "data": date_str,
        "eventos": [{"id": e.id, "numero": e.numero, "titulo": e.titulo, "estado": e.estado} for e in eventos],
        "pedidos": [{"id": p.id, "numero": p.numero, "estado": p.estado} for p in pedidos],
        "producoes": [{"id": o.id, "numero": o.numero, "sector": o.sector, "estado": o.estado} for o in producoes],
        "entregas": [{"id": ent.id, "numero": ent.numero, "estado": ent.estado} for ent in entregas]
    }), 200

@calendario_bp.route('/mes', methods=['GET'])
@jwt_required()
def get_calendario_mes():
    ano = request.args.get('ano', datetime.utcnow().year, type=int)
    mes = request.args.get('mes', datetime.utcnow().month, type=int)
    
    eventos = db.session.query(Evento).filter(extract('year', Evento.data_evento) == ano, extract('month', Evento.data_evento) == mes, Evento.is_active == True).all()
    pedidos = db.session.query(Pedido).filter(extract('year', Pedido.data_entrega) == ano, extract('month', Pedido.data_entrega) == mes, Pedido.is_active == True).all()
    
    # Compress data for calendar view
    dias = {}
    for e in eventos:
        d = e.data_evento.strftime('%Y-%m-%d')
        if d not in dias: dias[d] = {"eventos": 0, "pedidos": 0}
        dias[d]["eventos"] += 1
        
    for p in pedidos:
        if not p.data_entrega: continue
        d = p.data_entrega.strftime('%Y-%m-%d')
        if d not in dias: dias[d] = {"eventos": 0, "pedidos": 0}
        dias[d]["pedidos"] += 1
        
    return jsonify({
        "ano": ano,
        "mes": mes,
        "dias": dias
    }), 200

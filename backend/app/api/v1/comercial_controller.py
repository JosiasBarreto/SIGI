from flask import Blueprint, request, jsonify, send_file
from app.services.comercial_service import ComercialService
from flask_jwt_extended import jwt_required
from app.middleware.auth_middleware import requires_roles
from app.services.pdf_generator import generate_venda_pdf

comercial_bp = Blueprint('comercial', __name__)
fiscal_bp = Blueprint('fiscal', __name__)

comercial_service = ComercialService()

@fiscal_bp.route('/iva', methods=['GET'])
@jwt_required()
def get_ivas():
    ivas = comercial_service.get_todas_taxas_iva()
    return jsonify([{'id': i.id, 'descricao': i.descricao, 'percentagem': str(i.percentagem), 'ativo': i.ativo} for i in ivas]), 200

@fiscal_bp.route('/iva', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro')
def create_iva():
    data = request.json
    iva = comercial_service.create_taxa_iva(data)
    return jsonify({'id': iva.id, 'descricao': iva.descricao, 'percentagem': str(iva.percentagem), 'ativo': iva.ativo}), 201

@fiscal_bp.route('/iva/<int:iva_id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro')
def update_iva(iva_id):
    data = request.json
    try:
        iva = comercial_service.update_taxa_iva(iva_id, data)
        return jsonify({'id': iva.id, 'descricao': iva.descricao, 'percentagem': str(iva.percentagem), 'ativo': iva.ativo}), 200
    except ValueError as e:
        return jsonify({"msg": str(e)}), 404

@fiscal_bp.route('/iva/<int:iva_id>/toggle-status', methods=['PATCH'])
@jwt_required()
@requires_roles('Administrador', 'Financeiro')
def toggle_iva_status(iva_id):
    try:
        iva = comercial_service.toggle_taxa_iva_status(iva_id)
        return jsonify({
            'id': iva.id, 
            'ativo': iva.ativo, 
            'msg': 'Taxa de IVA ativada' if iva.ativo else 'Taxa de IVA desativada'
        }), 200
    except ValueError as e:
        return jsonify({"msg": str(e)}), 404

@comercial_bp.route('', methods=['POST'])
@jwt_required()
def create_venda():
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    data = request.json
    try:
        venda = comercial_service.create_venda(data, user_id)
        return jsonify({'id': venda.id, 'numero_documento': venda.numero_documento, 'total': str(venda.total)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@comercial_bp.route('', methods=['GET'])
@jwt_required()
def get_vendas():
    vendas = comercial_service.get_vendas()
    result = [{
        'id': v.id,
        'numero_documento': v.numero_documento,
        'tipo': v.tipo_documento.value,
        'total': str(v.total),
        'estado': v.estado.value,
        'created_at': v.created_at.isoformat() if v.created_at else None
    } for v in vendas]
    return jsonify(result), 200

@comercial_bp.route('/<int:venda_id>', methods=['GET'])
@jwt_required()
def get_venda(venda_id):
    venda = comercial_service.get_venda(venda_id)
    if not venda:
        return jsonify({'error': 'Venda not found'}), 404
        
    result = {
        'id': venda.id,
        'numero_documento': venda.numero_documento,
        'tipo_documento': venda.tipo_documento.value,
        'subtotal': str(venda.subtotal),
        'desconto_total': str(venda.desconto_total),
        'base_tributavel': str(venda.base_tributavel),
        'total_iva': str(venda.total_iva),
        'total': str(venda.total),
        'valor_pago': str(venda.valor_pago),
        'saldo': str(venda.saldo),
        'estado': venda.estado.value,
        'itens': [{
            'descricao': i.descricao,
            'quantidade': str(i.quantidade),
            'preco_unitario': str(i.preco_unitario),
            'subtotal': str(i.subtotal),
            'desconto': str(i.desconto),
            'taxa_iva': str(i.taxa_iva),
            'valor_iva': str(i.valor_iva),
            'total': str(i.total)
        } for i in venda.itens]
    }
    return jsonify(result), 200

@comercial_bp.route('/<int:venda_id>/pdf', methods=['GET'])
@jwt_required()
def get_venda_pdf(venda_id):
    venda = comercial_service.get_venda(venda_id)
    if not venda:
        return jsonify({'error': 'Venda not found'}), 404
        
    pdf_buffer = generate_venda_pdf(venda)
    return send_file(
        pdf_buffer,
        as_attachment=True,
        download_name=f"{venda.numero_documento.replace('/', '_')}.pdf",
        mimetype='application/pdf'
    )

@comercial_bp.route('/vendas/<int:venda_id>/send', methods=['POST'])
@jwt_required()
def send_venda_notification(venda_id):
    from app.services.notification_service import NotificationService
    
    data = request.json or {}
    method = data.get('method', 'email') # email ou whatsapp
    contact = data.get('contact')
    
    if not contact:
        return jsonify({'error': 'Contacto é obrigatório'}), 400
        
    venda = comercial_service.get_venda(venda_id)
    if not venda:
        return jsonify({'error': 'Venda not found'}), 404
        
    NotificationService.send_invoice_async(venda.id, contact, method)
    
    return jsonify({"msg": f"Fatura colocada na fila para envio via {method}"}), 200

@comercial_bp.route('/<int:venda_id>/pagamentos', methods=['POST'])
@jwt_required()
def register_pagamento(venda_id):
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    data = request.json
    try:
        pagamento = comercial_service.add_pagamento(venda_id, data, user_id)
        return jsonify({'id': pagamento.id, 'saldo': str(pagamento.venda_rel.saldo)}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@comercial_bp.route('/<int:venda_id>/pagamentos', methods=['GET'])
@jwt_required()
def get_pagamentos(venda_id):
    venda = comercial_service.get_venda(venda_id)
    if not venda:
        return jsonify({'error': 'Venda not found'}), 404
    return jsonify([{
        'id': p.id,
        'valor': str(p.valor),
        'estado': p.estado.value,
        'data_pagamento': p.data_pagamento.isoformat() if p.data_pagamento else None
    } for p in venda.pagamentos]), 200

@comercial_bp.route('/<int:venda_id>/cancelar', methods=['POST'])
@jwt_required()
def cancel_venda(venda_id):
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    ip_addr = request.remote_addr
    try:
        venda = comercial_service.cancel_venda(venda_id, user_id, ip_addr)
        return jsonify({'id': venda.id, 'estado': venda.estado.value}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@comercial_bp.route('/checkout-pedido/<int:pedido_id>', methods=['POST'])
@jwt_required()
def checkout_pedido(pedido_id):
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    data = request.json or {}
    venda, error = comercial_service.converter_pedido_em_venda(pedido_id, data, user_id)
    if error:
        return jsonify({'error': error}), 400
    return jsonify({
        'id': venda.id,
        'numero_documento': venda.numero_documento,
        'total': str(venda.total),
        'valor_pago': str(venda.valor_pago),
        'saldo': str(venda.saldo),
        'estado': venda.estado.value if hasattr(venda.estado, 'value') else venda.estado
    }), 200

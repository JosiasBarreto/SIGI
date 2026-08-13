from flask import Blueprint, request, jsonify, send_file
from datetime import datetime, timedelta
from sqlalchemy import or_

comercial_bp = Blueprint('comercial', __name__)
fiscal_bp = Blueprint('fiscal', __name__)

from app.services.comercial_service import ComercialService, StockInsuficienteError
from flask_jwt_extended import jwt_required
from app.middleware.auth_middleware import requires_roles
from app.services.pdf_generator import generate_venda_pdf, generate_venda_receipt, get_venda_receipt_data
from app.models.cliente import Cliente
from app.models.comercial import Venda, EstadoVenda, TipoDocumento

comercial_service = ComercialService()

def _serialize_venda_dict(venda):
    cliente_nome = "Consumidor Final"
    cliente_nif = "Consumidor Final"
    cliente_email = ""
    cliente_telefone = ""
    cliente_empresa = ""
    cliente_morada = ""
    
    c = None
    if venda.pedido and venda.pedido.cliente:
        c = venda.pedido.cliente
    elif getattr(venda, 'cliente_id', None):
        c = Cliente.query.get(venda.cliente_id)
    elif venda.pedido and getattr(venda.pedido, 'cliente_id', None):
        c = Cliente.query.get(venda.pedido.cliente_id)

    if c:
        cliente_nome = c.nome or "Consumidor Final"
        cliente_nif = c.nif or ""
        cliente_email = c.email or ""
        cliente_telefone = c.telefone or c.whatsapp or ""
        cliente_empresa = c.empresa or ""
        cliente_morada = c.morada or ""

    if not cliente_nif and cliente_nome == "Consumidor Final":
        cliente_nif = "Consumidor Final"

    forma_pagamento = "Dinheiro"
    if venda.pedido and venda.pedido.forma_pagamento:
        forma_pagamento = venda.pedido.forma_pagamento.value if hasattr(venda.pedido.forma_pagamento, 'value') else str(venda.pedido.forma_pagamento)
    elif venda.pagamentos:
        from app.models.financeiro import FormaPagamento as FinFormaPagamento
        formas = []
        for p in venda.pagamentos:
            if getattr(p, 'forma_pagamento_id', None):
                fp = FinFormaPagamento.query.get(p.forma_pagamento_id)
                if fp:
                    formas.append(fp.nome)
        if formas:
            forma_pagamento = ", ".join(set(formas))

    subtotal = float(venda.subtotal or 0)
    desconto_total = float(venda.desconto_total or 0)
    base_tributavel = float(venda.base_tributavel or 0)
    total_iva = float(venda.total_iva or 0)
    total = float(venda.total or 0)
    valor_pago = float(venda.valor_pago or 0)
    saldo = float(venda.saldo or 0)
    troco = max(0.0, valor_pago - total)

    return {
        'id': venda.id,
        'numero_documento': venda.numero_documento,
        'tipo_documento': venda.tipo_documento.value if hasattr(venda.tipo_documento, 'value') else str(venda.tipo_documento),
        'tipo': venda.tipo_documento.value if hasattr(venda.tipo_documento, 'value') else str(venda.tipo_documento),
        'estado': venda.estado.value if hasattr(venda.estado, 'value') else str(venda.estado),
        
        'subtotal': subtotal,
        'desconto_total': desconto_total,
        'base_tributavel': base_tributavel,
        'total_iva': total_iva,
        'total': total,
        'valor_pago': valor_pago,
        'saldo': saldo,
        'troco': troco,
        
        'cliente_id': c.id if c else venda.cliente_id,
        'cliente_nome': cliente_nome,
        'cliente_nif': cliente_nif,
        'cliente': {
            'id': c.id if c else venda.cliente_id,
            'nome': cliente_nome,
            'nif': cliente_nif,
            'email': cliente_email,
            'telefone': cliente_telefone,
            'empresa': cliente_empresa,
            'morada': cliente_morada
        },
        
        'pedido_id': venda.pedido_id,
        'forma_pagamento': forma_pagamento,
        'created_at': venda.created_at.isoformat() if venda.created_at else None,
        'observacoes': venda.observacoes,
        
        'itens': [{
            'id': getattr(i, 'id', None),
            'item_tipo': getattr(i, 'item_tipo', 'Produto'),
            'item_id': getattr(i, 'item_id', None),
            'descricao': i.descricao,
            'quantidade': float(i.quantidade or 0),
            'preco_unitario': float(i.preco_unitario or 0),
            'desconto': float(getattr(i, 'desconto', 0) or 0),
            'taxa_iva': float(getattr(i, 'taxa_iva', 0) or 0),
            'valor_iva': float(getattr(i, 'valor_iva', 0) or 0),
            'subtotal': float(i.subtotal or 0),
            'total': float(i.total or 0)
        } for i in (venda.itens or [])]
    }

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
        # Disparar envio de fatura se cliente possuir contacto
        try:
            from app.services.notification_service import NotificationService
            v_dict = _serialize_venda_dict(venda)
            c_email = v_dict.get('cliente', {}).get('email')
            c_phone = v_dict.get('cliente', {}).get('telefone')
            if c_email:
                NotificationService.send_invoice_async(venda.id, c_email, method='email')
            elif c_phone:
                NotificationService.send_invoice_async(venda.id, c_phone, method='whatsapp')
        except Exception as e:
            print('⚠ Erro ao disparar fatura automática:', e)

        return jsonify(_serialize_venda_dict(venda)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@comercial_bp.route('', methods=['GET'])
@jwt_required()
def get_vendas():
    page = max(1, request.args.get('page', 1, type=int))
    per_page = min(200, max(1, request.args.get('per_page', 10, type=int)))
    query = Venda.query
    search = request.args.get('search', '').strip()
    if search:
        query = query.filter(or_(Venda.numero_documento.ilike(f'%{search}%'), Venda.observacoes.ilike(f'%{search}%')))
    if request.args.get('estado'):
        estado = request.args['estado']
        # The historic UI used the abbreviated display label.  Translate it at
        # the boundary and keep the database enum as the source of truth.
        if estado == 'Parcial':
            estado = EstadoVenda.PARCIALMENTE_PAGO.value
        query = query.filter(Venda.estado == EstadoVenda(estado))
    if request.args.get('tipo_documento'):
        query = query.filter(Venda.tipo_documento == TipoDocumento(request.args['tipo_documento']))
    if request.args.get('cliente_id'):
        query = query.filter(Venda._cliente_id == request.args.get('cliente_id', type=int))
    if request.args.get('data_inicio'):
        query = query.filter(Venda.created_at >= datetime.strptime(request.args['data_inicio'], '%Y-%m-%d'))
    if request.args.get('data_fim'):
        query = query.filter(Venda.created_at < datetime.strptime(request.args['data_fim'], '%Y-%m-%d') + timedelta(days=1))
    pagination = query.order_by(Venda.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        'items': [_serialize_venda_dict(v) for v in pagination.items],
        'total': pagination.total, 'pages': pagination.pages,
        'page': page, 'per_page': per_page
    }), 200

@comercial_bp.route('/<int:venda_id>', methods=['GET'])
@jwt_required()
def get_venda(venda_id):
    venda = comercial_service.get_venda(venda_id)
    if not venda:
        return jsonify({'error': 'Venda not found'}), 404
    return jsonify(_serialize_venda_dict(venda)), 200

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

@comercial_bp.route('/<int:venda_id>/recibo', methods=['GET'])
@jwt_required()
def get_venda_recibo(venda_id):
    venda = comercial_service.get_venda(venda_id)
    if not venda:
        return jsonify({'error': 'Venda not found'}), 404
        
    pdf_buffer = generate_venda_receipt(venda)
    return send_file(
        pdf_buffer,
        as_attachment=False,
        download_name=f"recibo_{venda.numero_documento.replace('/', '_')}.pdf",
        mimetype='application/pdf'
    )

@comercial_bp.route('/<int:venda_id>/recibo-data', methods=['GET'])
@jwt_required()
def get_venda_recibo_data(venda_id):
    venda = comercial_service.get_venda(venda_id)
    if not venda:
        return jsonify({'error': 'Venda not found'}), 404
        
    data = get_venda_receipt_data(venda)
    return jsonify(data), 200

@comercial_bp.route('/<int:venda_id>/send', methods=['POST'])
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
        return jsonify(_serialize_venda_dict(pagamento.venda_rel)), 200
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
        'valor': float(p.valor or 0),
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
        return jsonify(_serialize_venda_dict(venda)), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@comercial_bp.route('/checkout-pedido/<int:pedido_id>', methods=['POST'])
@jwt_required()
def checkout_pedido(pedido_id):
    from flask_jwt_extended import get_jwt_identity
    user_id = get_jwt_identity()
    data = request.json or {}
    pagamento_payload = data.get('pagamento', data) if isinstance(data, dict) else {}
    pagamentos = pagamento_payload.get('pagamentos', []) if isinstance(pagamento_payload, dict) else []
    # O POS envia um pagamento por meio.  O primeiro cria/liquida a venda e os
    # restantes são registados como parcelas da mesma fatura.
    if pagamentos:
        if not isinstance(pagamentos, list) or not pagamentos:
            return jsonify({'error': 'Lista de pagamentos inválida.'}), 400
        data = {'pagamento': {**pagamento_payload, **pagamentos[0]}}
    from app.models.pedido import Pedido
    from app.models.comercial import Venda
    pedido = Pedido.query.get(pedido_id)
    venda_existente = Venda.query.filter_by(pedido_id=pedido_id).order_by(Venda.id.asc()).first()
    if pedido and venda_existente:
        venda, error = comercial_service.liquidar_pedido_faturado(pedido, venda_existente, data, user_id)
    else:
        venda, error = comercial_service.converter_pedido_em_venda(pedido_id, data, user_id)
    if error:
        return jsonify({'error': error}), 400

    try:
        for pagamento in pagamentos[1:]:
            comercial_service.add_pagamento(venda.id, pagamento, user_id)
        if pagamentos and venda.pedido:
            from app.models.pedido import EstadoPagamento
            pedido = venda.pedido
            pedido.valor_pago = venda.valor_pago
            comercial_service._atualizar_pagamento_pedido(pedido)
            from app.core.database import db
            db.session.commit()
    except Exception as e:
        return jsonify({'error': str(e)}), 400

    # Disparar envio de fatura automática do checkout do pedido
    try:
        from app.services.notification_service import NotificationService
        v_dict = _serialize_venda_dict(venda)
        c_email = v_dict.get('cliente', {}).get('email')
        c_phone = v_dict.get('cliente', {}).get('telefone')
        if c_email:
            NotificationService.send_invoice_async(venda.id, c_email, method='email')
        elif c_phone:
            NotificationService.send_invoice_async(venda.id, c_phone, method='whatsapp')
    except Exception as e:
        print('⚠ Erro ao disparar fatura automática no checkout:', e)

    return jsonify(_serialize_venda_dict(venda)), 200


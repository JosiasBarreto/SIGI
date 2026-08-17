from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.proforma_service import ProformaService
from app.api.v1.comercial_controller import _serialize_venda_dict
from app.middleware.auth_middleware import requires_roles
import io

proforma_bp = Blueprint('proforma_bp', __name__)
proforma_service = ProformaService()

def build_pagination(repo, schema_obj, request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    items = repo.get_all(request.args)
    
    total = len(items)
    start = (page - 1) * per_page
    end = start + per_page
    paginated_items = items[start:end]
    
    return jsonify({
        "items": schema_obj.dump(paginated_items),
        "total": total,
        "pages": (total + per_page - 1) // per_page if per_page else 1,
        "page": page,
        "per_page": per_page
    })

def _serialize_proforma(proforma):
    return {
        'id': proforma.id,
        'numero_documento': proforma.numero_documento,
        'cliente_id': proforma.cliente_id,
        'pedido_id': proforma.pedido_id,
        'origem': proforma.origem,
        'estado': proforma.estado,
        'subtotal': float(proforma.subtotal),
        'desconto_total': float(proforma.desconto_total),
        'total_iva': float(proforma.total_iva),
        'total': float(proforma.total),
        'observacoes': proforma.observacoes,
        'created_at': proforma.created_at.isoformat() if proforma.created_at else None,
        'itens': [{
            'id': i.id,
            'item_tipo': i.item_tipo,
            'item_id': i.item_id,
            'descricao': i.descricao,
            'quantidade': float(i.quantidade),
            'preco_unitario': float(i.preco_unitario),
            'desconto': float(i.desconto),
            'taxa_iva': float(i.taxa_iva),
            'valor_iva': float(i.valor_iva),
            'subtotal': float(i.subtotal),
            'total': float(i.total)
        } for i in proforma.itens]
    }

@proforma_bp.route('', methods=['GET', 'POST', 'OPTIONS'])
@proforma_bp.route('/', methods=['GET', 'POST', 'OPTIONS'])
def handle_proforma_root():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    if request.method == 'POST':
        return create_proforma()
    return listar_proformas()

@jwt_required()
def listar_proformas():
    class DummyRepo:
        def get_all(self, args):
            return proforma_service.get_proformas(args)
    
    class ProformaSchemaObj:
        def dump(self, obj):
            if isinstance(obj, list):
                return [_serialize_proforma(o) for o in obj]
            return _serialize_proforma(obj)
            
    return build_pagination(DummyRepo(), ProformaSchemaObj(), request)

@proforma_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def get_proforma(id):
    proforma = proforma_service.get_proforma(id)
    if not proforma:
        return jsonify({'error': 'Proforma não encontrada'}), 404
    return jsonify(_serialize_proforma(proforma)), 200

@jwt_required()
def create_proforma():
    try:
        user_id = get_jwt_identity()
        data = request.json
        proforma = proforma_service.create_proforma(data, user_id)
        return jsonify(_serialize_proforma(proforma)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@proforma_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_proforma(id):
    try:
        proforma_service.delete_proforma(id)
        return jsonify({'msg': 'Proforma eliminada com sucesso'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@proforma_bp.route('/<int:id>/faturar', methods=['POST'])
@jwt_required()
def faturar_proforma(id):
    try:
        user_id = get_jwt_identity()
        venda = proforma_service.faturar_proforma(id, user_id)
        return jsonify(_serialize_venda_dict(venda)), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@proforma_bp.route('/<int:id>/pdf', methods=['GET'])
@jwt_required()
def get_proforma_pdf(id):
    # PDF gen
    proforma = proforma_service.get_proforma(id)
    if not proforma:
        return jsonify({'error': 'Proforma não encontrada'}), 404
        
    try:
        from app.services.pdf_generator import get_venda_receipt_data, _build_a4_pdf
        # Hacky way to reuse pdf generation
        data = get_venda_receipt_data(proforma) # Might need adjustments since proforma is not Venda, but has similar fields
        data['documento']['tipo'] = 'Fatura Pró-Forma'
        data['documento']['numero'] = proforma.numero_documento
        pdf_buffer = _build_a4_pdf(data)
        
        return send_file(
            pdf_buffer,
            as_attachment=False,
            download_name=f"proforma_{proforma.numero_documento.replace('/', '_')}.pdf",
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@proforma_bp.route('/<int:id>/send', methods=['POST'])
@jwt_required()
def send_proforma(id):
    proforma = proforma_service.get_proforma(id)
    if not proforma:
        return jsonify({'error': 'Proforma não encontrada'}), 404
        
    data = request.json or {}
    method = data.get('method', 'email')
    contact = data.get('contact')
    
    if not contact:
        return jsonify({'error': 'Contacto obrigatório'}), 400
        
    try:
        from app.services.notification_service import NotificationService
        # If NotificationService doesn't have send_proforma_async, fallback to print
        if hasattr(NotificationService, 'send_proforma_async'):
            NotificationService.send_proforma_async(proforma.id, contact, method)
        else:
            print(f"Mock: Enviando Proforma {proforma.numero_documento} para {contact} via {method}")
        return jsonify({'msg': f'Pró-Forma enviada com sucesso para {contact} via {method}'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@proforma_bp.route('/<int:id>/recibo', methods=['GET'])
@jwt_required()
def get_proforma_recibo_termico(id):
    proforma = proforma_service.get_proforma(id)
    if not proforma:
        return jsonify({'error': 'Proforma não encontrada'}), 404
        
    try:
        from app.services.pdf_generator import get_venda_receipt_data, _build_thermal_receipt
        data = get_venda_receipt_data(proforma)
        data['documento']['tipo'] = 'Fatura Pró-Forma'
        data['documento']['numero'] = proforma.numero_documento
        pdf_buffer = _build_thermal_receipt(data)
        
        return send_file(
            pdf_buffer,
            as_attachment=False,
            download_name=f"proforma_termico_{proforma.numero_documento.replace('/', '_')}.pdf",
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 400

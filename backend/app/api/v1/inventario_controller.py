from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.inventario_service import InventarioService
from app.services.inventario_report_service import InventarioReportService
from app.services.inventario_excel_service import InventarioExcelService
from app.services.inventario_pdf_service import InventarioPdfService
from app.models.user import User
from app.middleware.auth_middleware import requires_roles
from app.core.database import db
from app.models.quarentena import QuarentenaItem, EstadoQuarentena
from app.services.armazem_service import ArmazemService
from datetime import datetime, date

inventario_bp = Blueprint('inventario_armazem', __name__)
inventario_service = InventarioService()

def _obter_nome_usuario(user_id):
    u = User.query.get(user_id)
    return u.name if u else "Administrador"

# ==============================================================================
# 1. CICLO DE VIDA DO INVENTÁRIO (CRIAR, INICIAR, CONTAR, CONFERIR, APLICAR)
# ==============================================================================

@inventario_bp.route('', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def criar():
    """
    Criar um novo Inventário (RASCUNHO)
    ---
    tags:
      - Inventário de Stock
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - armazem_id
          properties:
            armazem_id:
              type: integer
              example: 1
            tipo:
              type: string
              enum: [COMPLETO, PARCIAL]
              default: COMPLETO
            data_inventario:
              type: string
              format: date
              example: "2026-09-19"
            observacao:
              type: string
              example: "Inventário mensal de encerramento"
    responses:
      201:
        description: Inventário criado com sucesso em estado RASCUNHO.
      400:
        description: Erro de validação dos parâmetros.
    """
    data = request.get_json() or {}
    user_id = get_jwt_identity()
    obj, error = inventario_service.criar_inventario(data, user_id)
    if error:
        return jsonify({"success": False, "msg": error}), 400
    return jsonify({"success": True, "data": obj.to_dict(include_resumo=True), "msg": "Inventário criado com sucesso."}), 201


@inventario_bp.route('', methods=['GET'])
@jwt_required()
def listar():
    """
    Listar inventários com filtros e paginação
    ---
    tags:
      - Inventário de Stock
    parameters:
      - in: query
        name: armazem_id
        type: integer
      - in: query
        name: estado
        type: string
        enum: [RASCUNHO, EM_CONTAGEM, EM_CONFERENCIA, APROVADO, APLICADO, CANCELADO]
      - in: query
        name: tipo
        type: string
        enum: [COMPLETO, PARCIAL]
      - in: query
        name: search
        type: string
      - in: query
        name: page
        type: integer
        default: 1
      - in: query
        name: per_page
        type: integer
        default: 20
    responses:
      200:
        description: Lista paginada de inventários.
    """
    filtros = {
        "armazem_id": request.args.get('armazem_id', type=int),
        "estado": request.args.get('estado'),
        "tipo": request.args.get('tipo'),
        "data_inicio": request.args.get('data_inicio'),
        "data_fim": request.args.get('data_fim'),
        "search": request.args.get('search'),
        "page": request.args.get('page', 1, type=int),
        "per_page": request.args.get('per_page', 20, type=int)
    }
    resultado = inventario_service.listar_inventarios(filtros)
    return jsonify({"success": True, "data": resultado})


@inventario_bp.route('/<int:id>', methods=['GET'])
@jwt_required()
def detalhar(id):
    """
    Obter cabeçalho e resumo de um inventário específico
    ---
    tags:
      - Inventário de Stock
    responses:
      200:
        description: Detalhes do inventário.
      404:
        description: Inventário não encontrado.
    """
    from app.models.inventario import Inventario
    inv = Inventario.query.get(id)
    if not inv:
        return jsonify({"success": False, "msg": "Inventário não encontrado."}), 404
    return jsonify({"success": True, "data": inv.to_dict(include_resumo=True)})


@inventario_bp.route('/<int:id>/iniciar', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def iniciar(id):
    """
    Iniciar contagem do inventário (Congela Snapshot do Stock)
    ---
    tags:
      - Inventário de Stock
    responses:
      200:
        description: Inventário iniciado, transita para EM_CONTAGEM com snapshot do sistema.
      400:
        description: Estado inválido ou erro de inicialização.
    """
    user_id = get_jwt_identity()
    obj, error = inventario_service.iniciar_inventario(id, user_id)
    if error:
        return jsonify({"success": False, "msg": error}), 400
    return jsonify({"success": True, "data": obj.to_dict(include_resumo=True), "msg": "Inventário iniciado. Snapshot do stock congelado com sucesso."})


@inventario_bp.route('/<int:id>/itens', methods=['GET'])
@jwt_required()
def listar_itens(id):
    """
    Listar itens de um inventário com paginação e filtros
    ---
    tags:
      - Inventário de Stock
    parameters:
      - in: path
        name: id
        required: true
        type: integer
      - in: query
        name: situacao
        type: string
        enum: [SEM_DIVERGENCIA, FALTA, SOBRA, NAO_CONTADO]
      - in: query
        name: tipo
        type: string
        enum: [PRODUTO, MATERIAL]
      - in: query
        name: search
        type: string
      - in: query
        name: page
        type: integer
        default: 1
      - in: query
        name: per_page
        type: integer
        default: 50
    """
    filtros = {
        "situacao": request.args.get('situacao'),
        "tipo": request.args.get('tipo'),
        "motivo": request.args.get('motivo'),
        "search": request.args.get('search'),
        "page": request.args.get('page', 1, type=int),
        "per_page": request.args.get('per_page', 50, type=int)
    }
    resultado, error = inventario_service.listar_itens(id, filtros)
    if error:
        return jsonify({"success": False, "msg": error}), 404
    return jsonify({"success": True, "data": resultado})


@inventario_bp.route('/<int:id>/itens/<int:item_id>', methods=['PATCH'])
@jwt_required()
@requires_roles('Administrador', 'Armazém', 'Controlador de Materiais')
def registar_contagem_item(id, item_id):
    """
    Registar ou atualizar a quantidade contada de um item
    ---
    tags:
      - Inventário de Stock
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - quantidade_contada
          properties:
            quantidade_contada:
              type: number
              example: 47.5
            motivo_ajuste:
              type: string
              enum: [QUEBRA, PERDA, DANIFICADO, CONSUMO_NAO_REGISTADO, ERRO_CONTAGEM, ERRO_REGISTO, VALIDACAO_INVENTARIO, OUTRO]
            observacao:
              type: string
    """
    data = request.get_json() or {}
    user_id = get_jwt_identity()
    obj, error = inventario_service.registar_contagem_item(id, item_id, data, user_id)
    if error:
        return jsonify({"success": False, "msg": error}), 400
    return jsonify({"success": True, "data": obj.to_dict(), "msg": "Contagem registada com sucesso."})


@inventario_bp.route('/<int:id>/contagens', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém', 'Controlador de Materiais')
def registar_contagens_lote(id):
    """
    Registar contagens de múltiplos itens em lote
    ---
    tags:
      - Inventário de Stock
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - contagens
          properties:
            contagens:
              type: array
              items:
                type: object
                required:
                  - item_id
                  - quantidade_contada
                properties:
                  item_id:
                    type: integer
                  quantidade_contada:
                    type: number
                  motivo_ajuste:
                    type: string
                  observacao:
                    type: string
    """
    data = request.get_json() or {}
    contagens = data.get('contagens', [])
    user_id = get_jwt_identity()
    resultado, error = inventario_service.registar_contagens_lote(id, contagens, user_id)
    if error:
        return jsonify({"success": False, "msg": error}), 400
    return jsonify({"success": True, "data": resultado, "msg": f"{resultado['total_contados']} contagens registadas com sucesso."})


@inventario_bp.route('/<int:id>/finalizar-contagem', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def finalizar_contagem(id):
    """
    Finalizar contagem física e transitar para EM_CONFERENCIA
    ---
    tags:
      - Inventário de Stock
    """
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    forcar = bool(data.get('forcar', False))
    obj, error = inventario_service.finalizar_contagem(id, user_id, forcar=forcar)
    if error:
        return jsonify({"success": False, "msg": error}), 400
    return jsonify({"success": True, "data": obj.to_dict(include_resumo=True), "msg": "Contagem física finalizada. Inventário em conferência."})


@inventario_bp.route('/<int:id>/conferencia', methods=['GET'])
@jwt_required()
def obter_conferencia(id):
    """
    Obter dados completos de conferência com indicadores e totais
    ---
    tags:
      - Inventário de Stock
    """
    rel = InventarioReportService.obter_relatorio_completo(id)
    if not rel:
        return jsonify({"success": False, "msg": "Inventário não encontrado."}), 404
    return jsonify({"success": True, "data": rel})


@inventario_bp.route('/<int:id>/aprovar', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def aprovar(id):
    """
    Aprovar inventário conferido para autorizar aplicação de ajustes
    ---
    tags:
      - Inventário de Stock
    """
    user_id = get_jwt_identity()
    obj, error = inventario_service.aprovar_inventario(id, user_id)
    if error:
        return jsonify({"success": False, "msg": error}), 400
    return jsonify({"success": True, "data": obj.to_dict(include_resumo=True), "msg": "Inventário aprovado com sucesso."})


@inventario_bp.route('/<int:id>/aplicar', methods=['POST'])
@jwt_required()
@requires_roles('Administrador')
def aplicar(id):
    """
    APLICAR AJUSTES DE STOCK: Operação crítica transacional que lança movimentos e ajusta stocks
    ---
    tags:
      - Inventário de Stock
    responses:
      200:
        description: Ajustes aplicados com transação atómica e movimentos oficiais gerados.
      400:
        description: Erro ou concorrência na aplicação.
    """
    user_id = get_jwt_identity()
    resultado, error = inventario_service.aplicar_ajustes(id, user_id)
    if error:
        return jsonify({"success": False, "msg": error}), 400
    return jsonify({"success": True, "data": resultado, "msg": "Ajustes de inventário aplicados com sucesso no stock."})


@inventario_bp.route('/<int:id>/cancelar', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def cancelar(id):
    """
    Cancelar inventário antes de sua aplicação
    ---
    tags:
      - Inventário de Stock
    parameters:
      - in: body
        name: body
        properties:
          motivo:
            type: string
            example: "Contagem interrompida"
    """
    data = request.get_json() or {}
    motivo = data.get('motivo')
    user_id = get_jwt_identity()
    obj, error = inventario_service.cancelar_inventario(id, motivo, user_id)
    if error:
        return jsonify({"success": False, "msg": error}), 400
    return jsonify({"success": True, "data": obj.to_dict(include_resumo=True), "msg": "Inventário cancelado com sucesso."})


@inventario_bp.route('/quarentena', methods=['GET'])
@jwt_required()
def listar_quarentena():
    return jsonify({"success": True, "data": {"items": [item.to_dict() for item in QuarentenaItem.query.order_by(QuarentenaItem.created_at.desc()).all()]}})


@inventario_bp.route('/quarentena', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém', 'Controlador de Materiais')
def criar_quarentena():
    data = request.get_json() or {}
    produto_id, material_id = data.get('produto_id'), data.get('material_id')
    if bool(produto_id) == bool(material_id):
        return jsonify({"success": False, "msg": "Informe exclusivamente produto_id ou material_id."}), 400
    try:
        quantidade = float(data.get('quantidade', 0))
    except (TypeError, ValueError):
        quantidade = 0
    if quantidade <= 0:
        return jsonify({"success": False, "msg": "Quantidade deve ser maior que zero."}), 400
    validade = data.get('validade')
    if validade:
        try:
            validade = date.fromisoformat(validade[:10])
        except (TypeError, ValueError):
            return jsonify({"success": False, "msg": "Data de validade inválida."}), 400
    user_id = get_jwt_identity()
    entity_type = 'Produto' if produto_id else 'Material'
    movement, error = ArmazemService().registar_movimento({
        'tipo': 'Saida', 'origem': 'Ajuste', 'entidade_tipo': entity_type,
        'referencia_id': produto_id or material_id, 'armazem_id': data.get('armazem_id'),
        'quantidade': quantidade, 'justificacao': f"Quarentena: {data.get('motivo', 'Sem motivo')}",
    }, user_id)
    if error:
        return jsonify({"success": False, "msg": error}), 400
    item = QuarentenaItem(produto_id=produto_id, material_id=material_id, armazem_id=movement.armazem_id,
        quantidade=quantidade, motivo=data.get('motivo', 'Outro'), lote=data.get('lote'),
        validade=validade, observacao=data.get('observacao'), responsavel_id=user_id)
    db.session.add(item)
    db.session.commit()
    return jsonify({"success": True, "data": item.to_dict()}), 201


@inventario_bp.route('/quarentena/<int:item_id>/descartar', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém', 'Controlador de Materiais')
def descartar_quarentena(item_id):
    item = QuarentenaItem.query.get(item_id)
    if not item or item.estado != EstadoQuarentena.QUARENTENA:
        return jsonify({"success": False, "msg": "Item de quarentena não disponível para descarte."}), 400
    item.estado, item.resolvido_em = EstadoQuarentena.DESCARTADO, datetime.utcnow()
    item.justificativa_resolucao = (request.get_json() or {}).get('justificativa')
    db.session.commit()
    return jsonify({"success": True, "data": item.to_dict()})


@inventario_bp.route('/quarentena/<int:item_id>/reintegrar', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém', 'Controlador de Materiais')
def reintegrar_quarentena(item_id):
    item = QuarentenaItem.query.get(item_id)
    if not item or item.estado != EstadoQuarentena.QUARENTENA:
        return jsonify({"success": False, "msg": "Item de quarentena não disponível para reintegração."}), 400
    user_id = get_jwt_identity()
    movement, error = ArmazemService().registar_movimento({
        'tipo': 'Entrada', 'origem': 'Ajuste', 'entidade_tipo': 'Produto' if item.produto_id else 'Material',
        'referencia_id': item.produto_id or item.material_id, 'armazem_id': item.armazem_id,
        'quantidade': float(item.quantidade), 'justificacao': 'Reintegração de quarentena',
    }, user_id)
    if error:
        return jsonify({"success": False, "msg": error}), 400
    item.estado, item.resolvido_em = EstadoQuarentena.REINTEGRADO, datetime.utcnow()
    item.justificativa_resolucao = (request.get_json() or {}).get('observacao')
    db.session.commit()
    return jsonify({"success": True, "data": item.to_dict()})


# ==============================================================================
# 2. ENDPOINTS OFICIAIS DE RELATÓRIOS E CONSULTAS DE AUDITORIA
# ==============================================================================

@inventario_bp.route('/<int:id>/relatorio', methods=['GET'])
@jwt_required()
def relatorio_geral(id):
    rel = InventarioReportService.obter_relatorio_completo(id)
    if not rel:
        return jsonify({"success": False, "msg": "Inventário não encontrado."}), 404
    return jsonify({"success": True, "data": rel})


@inventario_bp.route('/<int:id>/relatorio/divergencias', methods=['GET'])
@jwt_required()
def relatorio_divergencias(id):
    rel = InventarioReportService.obter_relatorio_divergencias(id)
    if not rel:
        return jsonify({"success": False, "msg": "Inventário não encontrado."}), 404
    return jsonify({"success": True, "data": rel})


@inventario_bp.route('/<int:id>/relatorio/faltas', methods=['GET'])
@jwt_required()
def relatorio_faltas(id):
    rel = InventarioReportService.obter_relatorio_faltas(id)
    if not rel:
        return jsonify({"success": False, "msg": "Inventário não encontrado."}), 404
    return jsonify({"success": True, "data": rel})


@inventario_bp.route('/<int:id>/relatorio/sobras', methods=['GET'])
@jwt_required()
def relatorio_sobras(id):
    rel = InventarioReportService.obter_relatorio_sobras(id)
    if not rel:
        return jsonify({"success": False, "msg": "Inventário não encontrado."}), 404
    return jsonify({"success": True, "data": rel})


@inventario_bp.route('/<int:id>/relatorio/sem-divergencias', methods=['GET'])
@jwt_required()
def relatorio_sem_divergencias(id):
    rel = InventarioReportService.obter_relatorio_sem_divergencias(id)
    if not rel:
        return jsonify({"success": False, "msg": "Inventário não encontrado."}), 404
    return jsonify({"success": True, "data": rel})


@inventario_bp.route('/<int:id>/relatorio/nao-contados', methods=['GET'])
@jwt_required()
def relatorio_nao_contados(id):
    rel = InventarioReportService.obter_relatorio_nao_contados(id)
    if not rel:
        return jsonify({"success": False, "msg": "Inventário não encontrado."}), 404
    return jsonify({"success": True, "data": rel})


@inventario_bp.route('/<int:id>/relatorio/ajustes', methods=['GET'])
@jwt_required()
def relatorio_ajustes(id):
    rel = InventarioReportService.obter_relatorio_ajustes(id)
    if not rel:
        return jsonify({"success": False, "msg": "Inventário não encontrado."}), 404
    return jsonify({"success": True, "data": rel})


@inventario_bp.route('/<int:id>/relatorio/auditoria', methods=['GET'])
@inventario_bp.route('/<int:id>/historico', methods=['GET'])
@jwt_required()
def relatorio_auditoria(id):
    rel = InventarioReportService.obter_relatorio_auditoria(id)
    if not rel:
        return jsonify({"success": False, "msg": "Inventário não encontrado."}), 404
    return jsonify({"success": True, "data": rel})


@inventario_bp.route('/relatorios', methods=['GET'])
def relatorio_consolidado():
    filtros = {
        "armazem_id": request.args.get('armazem_id', type=int),
        "estado": request.args.get('estado'),
        "tipo": request.args.get('tipo'),
        "data_inicio": request.args.get('data_inicio'),
        "data_fim": request.args.get('data_fim')
    }
    resultado = InventarioReportService.relatorio_consolidado(filtros)
    return jsonify({"success": True, "data": resultado})


@inventario_bp.route('/relatorios/armazem/<int:armazem_id>', methods=['GET'])
def relatorio_por_armazem(armazem_id):
    filtros = {
        "armazem_id": armazem_id,
        "data_inicio": request.args.get('data_inicio'),
        "data_fim": request.args.get('data_fim')
    }
    resultado = InventarioReportService.relatorio_consolidado(filtros)
    return jsonify({"success": True, "data": resultado})


# ==============================================================================
# 3. EXPORTAÇÕES OFICIAIS (EXCEL E PDF)
# ==============================================================================

@inventario_bp.route('/<int:id>/exportar/excel', methods=['GET'])
@jwt_required()
def exportar_excel(id):
    """
    Gera ficheiro Excel profissional (.xlsx) com 7 abas formatadas
    """
    user_id = get_jwt_identity()
    user_nome = _obter_nome_usuario(user_id)
    
    from app.models.inventario import Inventario
    inv = Inventario.query.get(id)
    if not inv:
        return jsonify({"success": False, "msg": "Inventário não encontrado."}), 404

    try:
        excel_stream = InventarioExcelService.gerar_excel_inventario(id, user_nome)
        filename = f"inventario_{inv.numero}.xlsx"
        return send_file(
            excel_stream,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({"success": False, "msg": f"Erro ao gerar Excel: {str(e)}"}), 500


@inventario_bp.route('/<int:id>/exportar/pdf', methods=['GET'])
@jwt_required()
def exportar_pdf(id):
    """
    Gera documento PDF oficial formatado via ReportLab com layout corporativo e assinaturas
    """
    from app.models.inventario import Inventario
    inv = Inventario.query.get(id)
    if not inv:
        return jsonify({"success": False, "msg": "Inventário não encontrado."}), 404

    try:
        pdf_stream = InventarioPdfService.gerar_pdf_inventario(id)
        filename = f"relatorio_inventario_{inv.numero}.pdf"
        return send_file(
            pdf_stream,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        return jsonify({"success": False, "msg": f"Erro ao gerar PDF: {str(e)}"}), 500

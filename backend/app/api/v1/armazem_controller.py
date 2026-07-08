from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.armazem_service import ArmazemService
from app.schemas.armazem_schema import (
    FornecedorSchema, IngredienteSchema, ProdutoSchema,
    MaterialSchema, MovimentoStockSchema,
    CategoriaProdutoSchema, UnidadeMedidaSchema,
    ArmazemSchema, ProdutoStockArmazemSchema,
    IngredienteStockArmazemSchema, MaterialStockArmazemSchema
)
from app.middleware.auth_middleware import requires_roles
from marshmallow import ValidationError

armazem_bp = Blueprint('armazem', __name__)
armazem_service = ArmazemService()

def build_pagination(repo, schema, request):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    # filters logic... simplified
    filters = {}
    for key, value in request.args.items():
        if key not in ['page', 'per_page', 'search'] and hasattr(repo.model_class, key):
            filters[key] = value

    search_fields = ['nome', 'codigo'] if hasattr(repo.model_class, 'nome') else []
        
    pagination = repo.get_paginated(page=page, per_page=per_page, filters=filters, search=search, search_fields=search_fields)
    
    return jsonify({
        "items": schema(many=True).dump(pagination.items),
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page
    }), 200

@armazem_bp.route('/migrate', methods=['GET'])
def run_migrations():
    from app.core.database import db
    from sqlalchemy import text
    
    # Import all models to ensure metadata registration and table auto-creation
    try:
        from app.models.user import User
        from app.models.produto import Produto
        from app.models.cliente import Cliente
        from app.models.fornecedor import Fornecedor
        from app.models.ingrediente import Ingrediente
        from app.models.categoria_produto import CategoriaProduto
        from app.models.unidade_medida import UnidadeMedida
        from app.models.comercial import TaxaIVA, SerieDocumento, Venda, VendaItem, FechoDiario
        from app.models.pedido import Pedido
        from app.models.item_pedido import ItemPedido
        from app.models.evento import Espaco, Evento, EventoServico, ReservaEspaco, ReservaMaterial, EventoEquipa
        from app.models.ficha_tecnica import FichaTecnica, FichaTecnicaItem
        from app.models.financeiro import FormaPagamento, Pagamento, ContaReceber, ContaPagar, Receita, CentroCusto, Despesa
        from app.models.logistica import Motorista, Viatura, Entrega, ReservaViatura, OcorrenciaLogistica, ChecklistEntrega
        from app.models.material import Material
        from app.models.ordem_producao import OrdemProducao, ConsumoIngrediente
        from app.models.requisicao import Requisicao, RequisicaoItem, EntregaRequisicao, DevolucaoMaterial, OcorrenciaMaterial
        from app.models.reserva import ReservaIngrediente
        from app.models.token_blocklist import TokenBlocklist
        from app.models.caixa import Caixa, MovimentoCaixa
        from app.models.auditoria import Auditoria, LogAcesso, LogErro
        from app.models.movimento_stock import MovimentoStock
        from app.models.stock_movement import StockMovement
        from app.models.receita import ReceitaProducao, ReceitaItem
        from app.models.producao_nova import Producao, ProducaoItem, ProducaoDesvio
        from app.models.inventario import InventarioContagem, InventarioContagemItem

        # Recreate any missing tables (like movimentos_stock or movimentacoes_armazem)
        db.create_all()
    except Exception as e:
        print("Error importing models or running db.create_all():", e)

    # Safely alter the ENUM column for 'tipo' on 'produtos' table to ensure 'Consumivel' is supported
    try:
        db.session.execute(text("ALTER TABLE produtos MODIFY COLUMN tipo ENUM('Acabado', 'Revenda', 'Consumivel') NOT NULL;"))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        print("Could not update enum column 'tipo' on table 'produtos' inside migrate endpoint:", e)

    # Ensure columns taxa_iva_id and unidade_medida_id exist in 'produtos' table
    try:
        db.session.execute(text("ALTER TABLE produtos ADD COLUMN taxa_iva_id INT NULL;"))
        db.session.commit()
    except Exception as e:
        db.session.rollback()
    
    try:
        db.session.execute(text("ALTER TABLE produtos ADD COLUMN unidade_medida_id INT NULL;"))
        db.session.commit()
    except Exception as e:
        db.session.rollback()

    try:
        db.session.execute(text("ALTER TABLE produtos ADD COLUMN data_validade DATE NULL;"))
        db.session.commit()
    except Exception as e:
        db.session.rollback()

    try:
        db.session.execute(text("ALTER TABLE materiais ADD COLUMN unidade_medida_id INT NULL;"))
        db.session.commit()
    except Exception as e:
        db.session.rollback()

    # Ensure foreign key constraints exist on 'produtos' table
    try:
        db.session.execute(text("ALTER TABLE produtos ADD CONSTRAINT fk_produto_iva FOREIGN KEY (taxa_iva_id) REFERENCES taxas_iva(id);"))
        db.session.commit()
    except Exception as e:
        db.session.rollback()

    try:
        db.session.execute(text("ALTER TABLE produtos ADD CONSTRAINT fk_produto_unidade FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida(id);"))
        db.session.commit()
    except Exception as e:
        db.session.rollback()

    try:
        db.session.execute(text("ALTER TABLE materiais ADD CONSTRAINT fk_material_unidade FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida(id);"))
        db.session.commit()
    except Exception as e:
        db.session.rollback()

    try:
        db.session.execute(text("ALTER TABLE unidades_medida CHANGE abreviatura sigla VARCHAR(10) NOT NULL;"))
    except Exception as e:
        pass
    try:
        db.session.execute(text("ALTER TABLE categorias_produto DROP COLUMN ativo;"))
    except Exception as e:
        pass
    try:
        db.session.execute(text("CREATE INDEX idx_produtos_codigo ON produtos (codigo);"))
    except: pass
    try:
        db.session.execute(text("CREATE INDEX idx_produtos_nome ON produtos (nome);"))
    except: pass
    try:
        db.session.execute(text("CREATE INDEX idx_produtos_categoria ON produtos (categoria_id);"))
    except: pass
    try:
        db.session.execute(text("CREATE INDEX idx_produtos_tipo ON produtos (tipo);"))
    except: pass
    try:
        db.session.execute(text("CREATE INDEX idx_produtos_ativo ON produtos (ativo);"))
    except: pass
    try:
        db.session.execute(text("ALTER TABLE movimentos_stock CHANGE stock_posterior stock_atual DECIMAL(10,3) NOT NULL;"))
    except: pass
    try:
        db.session.execute(text("ALTER TABLE movimentos_stock ADD COLUMN motivo VARCHAR(255);"))
    except: pass
    try:
        db.session.execute(text("ALTER TABLE movimentos_stock ADD COLUMN numero_fatura VARCHAR(100);"))
    except: pass
    try:
        db.session.execute(text("ALTER TABLE movimentos_stock ADD COLUMN fornecedor_id INT;"))
    except: pass
    db.session.commit()
    return jsonify({"msg": "Migrations executed successfully."}), 200

# --- CATEGORIAS ---
@armazem_bp.route('/categorias', methods=['GET'])
@jwt_required()
def get_categorias():
    return build_pagination(armazem_service.categoria_produto_repo, CategoriaProdutoSchema, request)

@armazem_bp.route('/categorias/<int:id>', methods=['GET'])
@jwt_required()
def get_categoria(id):
    categoria = armazem_service.categoria_produto_repo.get_by_id(id)
    if not categoria:
        return jsonify({"msg": "Categoria não encontrada"}), 404
    return jsonify(CategoriaProdutoSchema().dump(categoria)), 200

@armazem_bp.route('/categorias', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def create_categoria():
    try:
        data = CategoriaProdutoSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    from app.models.categoria_produto import CategoriaProduto
    categoria = CategoriaProduto(**data)
    categoria.created_by = user_id
    armazem_service.categoria_produto_repo.create(categoria)
    
    from app.services.audit_service import AuditService
    AuditService.log_action(user_id, "CREATE", "categorias_produto", categoria.id, new_values=data)
    
    return jsonify(CategoriaProdutoSchema().dump(categoria)), 201

@armazem_bp.route('/categorias/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def update_categoria(id):
    try:
        data = CategoriaProdutoSchema(partial=True).load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    categoria = armazem_service.categoria_produto_repo.get_by_id(id)
    if not categoria:
        return jsonify({"msg": "Categoria não encontrada"}), 404
        
    for key, value in data.items():
        setattr(categoria, key, value)
    
    categoria.updated_by = user_id
    armazem_service.categoria_produto_repo.update(categoria)
    
    from app.services.audit_service import AuditService
    AuditService.log_action(user_id, "UPDATE", "categorias_produto", categoria.id, new_values=data)
    
    return jsonify(CategoriaProdutoSchema().dump(categoria)), 200

@armazem_bp.route('/categorias/<int:id>', methods=['DELETE'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def delete_categoria(id):
    user_id = get_jwt_identity()
    categoria = armazem_service.categoria_produto_repo.get_by_id(id)
    if not categoria:
        return jsonify({"msg": "Categoria não encontrada"}), 404
        
    categoria.soft_delete()
    categoria.updated_by = user_id
    armazem_service.categoria_produto_repo.update(categoria)
    
    from app.services.audit_service import AuditService
    AuditService.log_action(user_id, "DELETE", "categorias_produto", categoria.id)
    
    return jsonify({"msg": "Categoria removida com sucesso"}), 200

# --- UNIDADES MEDIDA ---
@armazem_bp.route('/unidades-medida', methods=['GET'])
@jwt_required()
def get_unidades_medida():
    return build_pagination(armazem_service.unidade_medida_repo, UnidadeMedidaSchema, request)

@armazem_bp.route('/unidades-medida/<int:id>', methods=['GET'])
@jwt_required()
def get_unidade_medida(id):
    unidade = armazem_service.unidade_medida_repo.get_by_id(id)
    if not unidade:
        return jsonify({"msg": "Unidade não encontrada"}), 404
    return jsonify(UnidadeMedidaSchema().dump(unidade)), 200

@armazem_bp.route('/unidades-medida', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def create_unidade_medida():
    try:
        data = UnidadeMedidaSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    from app.models.unidade_medida import UnidadeMedida
    unidade = UnidadeMedida(**data)
    unidade.created_by = user_id
    armazem_service.unidade_medida_repo.create(unidade)
    
    from app.services.audit_service import AuditService
    AuditService.log_action(user_id, "CREATE", "unidades_medida", unidade.id, new_values=data)
    
    return jsonify(UnidadeMedidaSchema().dump(unidade)), 201

@armazem_bp.route('/unidades-medida/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def update_unidade_medida(id):
    try:
        data = UnidadeMedidaSchema(partial=True).load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    unidade = armazem_service.unidade_medida_repo.get_by_id(id)
    if not unidade:
        return jsonify({"msg": "Unidade não encontrada"}), 404
        
    for key, value in data.items():
        setattr(unidade, key, value)
    
    unidade.updated_by = user_id
    armazem_service.unidade_medida_repo.update(unidade)
    
    from app.services.audit_service import AuditService
    AuditService.log_action(user_id, "UPDATE", "unidades_medida", unidade.id, new_values=data)
    
    return jsonify(UnidadeMedidaSchema().dump(unidade)), 200

@armazem_bp.route('/unidades-medida/<int:id>', methods=['DELETE'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def delete_unidade_medida(id):
    user_id = get_jwt_identity()
    unidade = armazem_service.unidade_medida_repo.get_by_id(id)
    if not unidade:
        return jsonify({"msg": "Unidade não encontrada"}), 404
        
    unidade.soft_delete()
    unidade.updated_by = user_id
    armazem_service.unidade_medida_repo.update(unidade)
    
    from app.services.audit_service import AuditService
    AuditService.log_action(user_id, "DELETE", "unidades_medida", unidade.id)
    
    return jsonify({"msg": "Unidade removida com sucesso"}), 200

# --- FORNECEDORES ---
@armazem_bp.route('/fornecedores', methods=['GET'])
@jwt_required()
def get_fornecedores():
    return build_pagination(armazem_service.fornecedor_repo, FornecedorSchema, request)

@armazem_bp.route('/fornecedores', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def create_fornecedor():
    try:
        data = FornecedorSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = armazem_service.create_fornecedor(data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(FornecedorSchema().dump(result)), 201

# --- INGREDIENTES ---
@armazem_bp.route('/ingredientes', methods=['GET'])
@jwt_required()
def get_ingredientes():
    return build_pagination(armazem_service.ingrediente_repo, IngredienteSchema, request)

@armazem_bp.route('/ingredientes', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def create_ingrediente():
    try:
        data = IngredienteSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = armazem_service.create_ingrediente(data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(IngredienteSchema().dump(result)), 201

# --- PRODUTOS ---
@armazem_bp.route('/produtos', methods=['GET'])
@jwt_required()
def get_produtos():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    search = request.args.get('search', '')
    
    from app.models.produto import Produto
    query = Produto.query.filter_by(is_active=True)
    
    tipo = request.args.get('tipo', '')
    if tipo:
        query = query.filter_by(tipo=tipo)
        
    categoria_id = request.args.get('categoria_id', '')
    if categoria_id:
        query = query.filter_by(categoria_id=categoria_id)
        
    ativo = request.args.get('ativo', '')
    if ativo:
        is_ativo = ativo.lower() == 'true' or ativo == '1'
        query = query.filter_by(ativo=is_ativo)
        
    if search:
        from sqlalchemy import or_
        query = query.filter(or_(
            Produto.nome.ilike(f"%{search}%"),
            Produto.codigo.ilike(f"%{search}%")
        ))
        
    order_by = request.args.get('order_by', 'created_at')
    order_dir = request.args.get('order_dir', 'desc')
    
    if hasattr(Produto, order_by):
        col = getattr(Produto, order_by)
        if order_dir == 'desc':
            query = query.order_by(col.desc())
        else:
            query = query.order_by(col.asc())
            
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        "items": ProdutoSchema(many=True).dump(pagination.items),
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page
    }), 200

@armazem_bp.route('/produtos', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém', 'Pastelaria', 'Cozinha')
def create_produto():
    try:
        data = ProdutoSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = armazem_service.create_produto(data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(ProdutoSchema().dump(result)), 201

@armazem_bp.route('/produtos/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def update_produto(id):
    try:
        data = ProdutoSchema(partial=True).load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    
    produto, error = armazem_service.update_produto(id, data, user_id)
    if error:
        status_code = 404 if error == "Produto não encontrado" else 400
        return jsonify({"msg": error}), status_code
        
    return jsonify(ProdutoSchema().dump(produto)), 200

@armazem_bp.route('/produtos/<int:id>/ativar', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def activate_produto(id):
    user_id = get_jwt_identity()
    produto, error = armazem_service.activate_produto(id, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify({"msg": "Produto ativado com sucesso."}), 200

@armazem_bp.route('/produtos/<int:id>/desativar', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def deactivate_produto(id):
    user_id = get_jwt_identity()
    produto, error = armazem_service.deactivate_produto(id, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify({"msg": "Produto desativado com sucesso."}), 200

@armazem_bp.route('/produtos/<int:id>/entrada-stock', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def entrada_stock(id):
    user_id = get_jwt_identity()
    data = request.get_json()
    produto, error = armazem_service.entrada_stock(id, data, user_id)
    if error:
        status_code = 404 if error == "Produto não encontrado" else 400
        return jsonify({"msg": error}), status_code
    return jsonify({"msg": "Entrada de stock registada com sucesso."}), 200

@armazem_bp.route('/produtos/<int:id>/saida-stock', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def saida_stock(id):
    user_id = get_jwt_identity()
    data = request.get_json()
    produto, error = armazem_service.saida_stock(id, data, user_id)
    if error:
        status_code = 404 if error == "Produto não encontrado" else 400
        return jsonify({"msg": error}), status_code
    return jsonify({"msg": "Saída de stock registada com sucesso."}), 200

@armazem_bp.route('/produtos/<int:id>/movimentos', methods=['GET'])
@jwt_required()
def get_produto_movimentos(id):
    from app.models.stock_movement import StockMovement
    from app.core.database import db
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    tipo = request.args.get('tipo', type=str)
    utilizador_id = request.args.get('utilizador_id', type=int)
    
    query = StockMovement.query.filter_by(produto_id=id)
    if tipo:
        query = query.filter_by(tipo_movimento=tipo)
    if utilizador_id:
        query = query.filter_by(utilizador_id=utilizador_id)
        
    query = query.order_by(StockMovement.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    from app.schemas.armazem_schema import Schema, fields
    class MovStockSchema(Schema):
        id = fields.Int()
        produto_id = fields.Int()
        produto_nome = fields.Function(lambda obj: obj.produto.nome if obj.produto else None)
        tipo_movimento = fields.Str()
        quantidade = fields.Decimal()
        stock_anterior = fields.Decimal()
        stock_atual = fields.Decimal()
        motivo = fields.Str()
        numero_fatura = fields.Str()
        fornecedor_id = fields.Int()
        referencia = fields.Str()
        utilizador_id = fields.Int()
        utilizador_nome = fields.Function(lambda obj: obj.utilizador.name if obj.utilizador else None)
        observacao = fields.Str()
        created_at = fields.DateTime()
        
    schema = MovStockSchema(many=True)
    return jsonify({
        "items": schema.dump(pagination.items),
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page
    }), 200

@armazem_bp.route('/produtos/<int:id>', methods=['DELETE'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def delete_produto(id):
    user_id = get_jwt_identity()
    produto = armazem_service.produto_repo.get_by_id(id)
    if not produto:
        return jsonify({"msg": "Produto não encontrado"}), 404
        
    produto.soft_delete()
    produto.updated_by = user_id
    armazem_service.produto_repo.update(produto)
    
    from app.services.audit_service import AuditService
    AuditService.log_action(user_id, "DELETE", "produtos", produto.id)
    
    return jsonify({"msg": "Produto removido com sucesso"}), 200

#pegar o produto pelo id
@armazem_bp.route('/produtos/<int:id>', methods=['GET'])
@jwt_required()
def get_produto(id):
    produto = armazem_service.produto_repo.get_by_id(id)
    if not produto:
        return jsonify({"msg": "Produto não encontrado"}), 404
    return jsonify(ProdutoSchema().dump(produto)), 200

# --- MATERIAIS ---
@armazem_bp.route('/materiais', methods=['GET'])
@jwt_required()
def get_materiais():
    return build_pagination(armazem_service.material_repo, MaterialSchema, request)

@armazem_bp.route('/materiais', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém', 'Controlador de Materiais')
def create_material():
    try:
        data = MaterialSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = armazem_service.create_material(data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(MaterialSchema().dump(result)), 201

@armazem_bp.route('/materiais/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Armazém', 'Controlador de Materiais')
def update_material(id):
    try:
        data = MaterialSchema(partial=True).load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = armazem_service.update_material(id, data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(MaterialSchema().dump(result)), 200

@armazem_bp.route('/materiais/<int:id>', methods=['DELETE'])
@jwt_required()
@requires_roles('Administrador', 'Armazém', 'Controlador de Materiais')
def delete_material(id):
    user_id = get_jwt_identity()
    result, error = armazem_service.delete_material(id, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(result), 200

# --- MOVIMENTAÇÕES ---
@armazem_bp.route('/movimentacoes', methods=['GET'])
@jwt_required()
def get_movimentacoes():
    return build_pagination(armazem_service.movimento_repo, MovimentoStockSchema, request)

@armazem_bp.route('/movimentacoes', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def register_movimentacao():
    try:
        data = MovimentoStockSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = armazem_service.registar_movimento(data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(MovimentoStockSchema().dump(result)), 201

# --- ARMAZENS MANAGEMENT ---
@armazem_bp.route('/armazens', methods=['GET'])
@jwt_required()
def get_armazens():
    return build_pagination(armazem_service.armazem_repo, ArmazemSchema, request)

@armazem_bp.route('/armazens', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def create_armazem():
    try:
        data = ArmazemSchema().load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = armazem_service.create_armazem(data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(ArmazemSchema().dump(result)), 201

@armazem_bp.route('/armazens/<int:id>', methods=['PUT'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def update_armazem(id):
    try:
        data = ArmazemSchema(partial=True).load(request.get_json())
    except ValidationError as err:
        return jsonify({"msg": "Validation error", "errors": err.messages}), 400
        
    user_id = get_jwt_identity()
    result, error = armazem_service.update_armazem(id, data, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(ArmazemSchema().dump(result)), 200

@armazem_bp.route('/armazens/<int:id>/stock', methods=['GET'])
@jwt_required()
def get_armazem_stock(id):
    result, error = armazem_service.get_armazem_stock(id)
    if error:
        return jsonify({"msg": error}), 400
        
    return jsonify({
        "produtos": ProdutoStockArmazemSchema(many=True).dump(result["produtos"]),
        "ingredientes": IngredienteStockArmazemSchema(many=True).dump(result["ingredientes"]),
        "materiais": MaterialStockArmazemSchema(many=True).dump(result["materiais"])
    }), 200

@armazem_bp.route('/transferir', methods=['POST'])
@jwt_required()
@requires_roles('Administrador', 'Armazém')
def transferir_stock():
    user_id = get_jwt_identity()
    result, error = armazem_service.transferir_stock(request.get_json() or {}, user_id)
    if error:
        return jsonify({"msg": error}), 400
    return jsonify(result), 200


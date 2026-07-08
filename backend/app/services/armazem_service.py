from app.models.fornecedor import Fornecedor
from app.models.ingrediente import Ingrediente
from app.models.produto import Produto, TipoProduto
from app.models.material import Material, TipoMaterial, EstadoMaterial
from app.models.movimento_stock import MovimentoStock, TipoMovimento, OrigemMovimento, EntidadeMovimento
from app.models.armazem import Armazem, ProdutoStockArmazem, IngredienteStockArmazem, MaterialStockArmazem
from app.repositories.armazem_repos import (
    FornecedorRepository, IngredienteRepository, ProdutoRepository,
    MaterialRepository, MovimentoStockRepository,
    CategoriaProdutoRepository, UnidadeMedidaRepository,
    ArmazemRepository, ProdutoStockArmazemRepository,
    IngredienteStockArmazemRepository, MaterialStockArmazemRepository
)
from app.services.audit_service import AuditService
from app.core.database import db

class ArmazemService:
    def __init__(self):
        self.fornecedor_repo = FornecedorRepository()
        self.ingrediente_repo = IngredienteRepository()
        self.produto_repo = ProdutoRepository()
        self.material_repo = MaterialRepository()
        self.movimento_repo = MovimentoStockRepository()
        self.categoria_produto_repo = CategoriaProdutoRepository()
        self.unidade_medida_repo = UnidadeMedidaRepository()
        self.armazem_repo = ArmazemRepository()
        self.prod_stock_repo = ProdutoStockArmazemRepository()
        self.ing_stock_repo = IngredienteStockArmazemRepository()
        self.mat_stock_repo = MaterialStockArmazemRepository()

    # --- Fornecedor ---
    def create_fornecedor(self, data, user_id):
        # Validate unique NIF
        if data.get('nif') and db.session.query(Fornecedor).filter_by(nif=data['nif'], is_active=True).first():
            return None, "NIF já cadastrado."
            
        fornecedor = Fornecedor(**data, created_by=user_id)
        self.fornecedor_repo.create(fornecedor)
        AuditService.log_action(user_id, "CREATE", "fornecedores", fornecedor.id, new_values=data)
        return fornecedor, None

    def _get_target_armazem(self, armazem_id=None):
        if armazem_id:
            armazem = self.armazem_repo.get_by_id(armazem_id)
            if armazem:
                return armazem
        # Fallback to principal
        armazem = db.session.query(Armazem).filter_by(principal=True, is_active=True).first()
        if not armazem:
            # Fallback to any active warehouse
            armazem = db.session.query(Armazem).filter_by(is_active=True).first()
        if not armazem:
            # Auto-create principal warehouse if none exists
            armazem = Armazem(codigo="ARM-PRIN", nome="Armazém Principal", principal=True, localizacao="Sede")
            db.session.add(armazem)
            db.session.flush()
        return armazem

    # --- Ingrediente ---
    def create_ingrediente(self, data, user_id):
        armazem_id = data.pop('armazem_id', None)
        ingrediente = Ingrediente(**data, created_by=user_id)
        self.ingrediente_repo.create(ingrediente)
        
        armazem = self._get_target_armazem(armazem_id)
        stock_relation = IngredienteStockArmazem(
            ingrediente_id=ingrediente.id,
            armazem_id=armazem.id,
            stock_atual=float(ingrediente.stock_atual or 0),
            stock_minimo=float(ingrediente.stock_minimo or 0)
        )
        db.session.add(stock_relation)
        db.session.commit()
        
        AuditService.log_action(user_id, "CREATE", "ingredientes", ingrediente.id, new_values=data)
        return ingrediente, None

    def generate_codigo_produto(self, tipo: str) -> str:
        prefix = 'REV'
        if tipo == 'Consumivel':
            prefix = 'ING'
        elif tipo == 'Acabado':
            prefix = 'PAC'

        from sqlalchemy import text
        sql = text("SELECT MAX(CAST(SUBSTRING(codigo, 4) AS UNSIGNED)) FROM produtos WHERE codigo LIKE :prefix")
        result = db.session.execute(sql, {"prefix": f"{prefix}%"}).scalar()
        
        next_num = 1 if result is None else int(result) + 1
        return f"{prefix}{next_num:06d}"

    # --- Produto ---
    def create_produto(self, data, user_id):
        armazem_id = data.pop('armazem_id', None)
        
        tipo = data.get('tipo')
        if tipo == 'Consumivel':
            if not data.get('nome') or not data.get('categoria_id') or not data.get('unidade_medida_id') or data.get('preco_compra') is None or data.get('stock_minimo') is None:
                return None, "Campos obrigatórios para Consumível: nome, categoria_id, unidade_medida_id, preco_compra, stock_minimo."
            if 'tempo_producao' in data and data['tempo_producao'] is not None:
                return None, "Consumível não pode ter tempo de produção."
            data['preco_venda'] = 0
            
        elif tipo == 'Acabado':
            if not data.get('nome') or not data.get('categoria_id') or not data.get('unidade_medida_id') or data.get('preco_venda') is None or data.get('tempo_producao') is None:
                return None, "Campos obrigatórios para Produto Acabado: nome, categoria_id, unidade_medida_id, preco_venda, tempo_producao."
            # preco_compra cannot be set manually (will be calc'd by recipe later)
            data['preco_compra'] = 0

        elif tipo == 'Revenda':
            if not data.get('nome') or not data.get('categoria_id') or not data.get('unidade_medida_id') or data.get('preco_compra') is None or data.get('preco_venda') is None:
                return None, "Campos obrigatórios para Revenda: nome, categoria_id, unidade_medida_id, preco_compra, preco_venda."
                
        data['codigo'] = self.generate_codigo_produto(tipo)
        data['stock_atual'] = 0 # Forced
        
        produto = Produto(**data, created_by=user_id)
        self.produto_repo.create(produto)
        
        armazem = self._get_target_armazem(armazem_id)
        stock_relation = ProdutoStockArmazem(
            produto_id=produto.id,
            armazem_id=armazem.id,
            stock_atual=0,
            stock_minimo=float(produto.stock_minimo or 0)
        )
        db.session.add(stock_relation)
        db.session.commit()
        
        AuditService.log_action(user_id, "CREATE", "produtos", produto.id, new_values=data)
        return produto, None

    def update_produto(self, id, data, user_id):
        produto = self.produto_repo.get_by_id(id)
        if not produto:
            return None, "Produto não encontrado"

        # Immutable fields
        if 'tipo' in data and data['tipo'] != produto.tipo:
            return None, "O tipo de produto não pode ser alterado após a criação."
        if 'codigo' in data:
            data.pop('codigo')
        if 'stock_atual' in data:
            data.pop('stock_atual') # Stock changed via mov stock only
            
        # Validation by type
        tipo = produto.tipo
        if tipo == 'Consumivel':
            if 'tempo_producao' in data and data['tempo_producao'] is not None:
                return None, "Consumível não pode ter tempo de produção."
            data['preco_venda'] = 0
            
        elif tipo == 'Acabado':
            if 'preco_compra' in data:
                data.pop('preco_compra') # Cannot be updated manually

        if 'preco_compra' in data and produto.tipo == 'Consumivel' and float(data['preco_compra']) != float(produto.preco_compra):
            price_changed = True
        else:
            price_changed = False

        # Apply updates
        for key, value in data.items():
            setattr(produto, key, value)
            
        produto.updated_by = user_id
        self.produto_repo.update(produto)
        
        if price_changed:
            from app.models.receita import ReceitaItem
            itens = ReceitaItem.query.filter_by(produto_consumivel_id=produto.id).all()
            for item in itens:
                item.receita.recalcular_custos()
            db.session.commit()
            
        AuditService.log_action(user_id, "UPDATE", "produtos", produto.id, new_values=data)
        return produto, None

    def activate_produto(self, id, user_id):
        produto = self.produto_repo.get_by_id(id)
        if not produto:
            return None, "Produto não encontrado"
        produto.ativo = True
        produto.updated_by = user_id
        self.produto_repo.update(produto)
        AuditService.log_action(user_id, "ACTIVATE", "produtos", produto.id)
        return produto, None

    def deactivate_produto(self, id, user_id):
        produto = self.produto_repo.get_by_id(id)
        if not produto:
            return None, "Produto não encontrado"

        # Integrity Rules
        from app.models.receita import ReceitaItem
        receita_item = ReceitaItem.query.filter_by(produto_consumivel_id=id).first()
        if receita_item and receita_item.receita.ativo:
            return None, "O produto não pode ser desativado porque faz parte de uma receita ativa."
            
        produto.ativo = False
        produto.updated_by = user_id
        self.produto_repo.update(produto)
        AuditService.log_action(user_id, "DEACTIVATE", "produtos", produto.id)
        return produto, None

    def entrada_stock(self, id, data, user_id):
        produto = self.produto_repo.get_by_id(id)
        if not produto:
            return None, "Produto não encontrado"
            
        quantidade = data.get('quantidade')
        if quantidade is None or float(quantidade) <= 0:
            return None, "Quantidade inválida para entrada de stock."
            
        # Update warehouse stock relation
        armazem_id = data.get('armazem_id')
        if not armazem_id:
            stock_relation = db.session.query(ProdutoStockArmazem).filter_by(produto_id=produto.id).first()
            if stock_relation:
                armazem_id = stock_relation.armazem_id
                
        armazem = self._get_target_armazem(armazem_id)
        stock_relation = db.session.query(ProdutoStockArmazem).filter_by(produto_id=produto.id, armazem_id=armazem.id).first()
        if stock_relation:
            stock_relation.stock_atual = float(stock_relation.stock_atual) + float(quantidade)
        else:
            stock_relation = ProdutoStockArmazem(
                produto_id=produto.id,
                armazem_id=armazem.id,
                stock_atual=float(quantidade),
                stock_minimo=float(produto.stock_minimo or 0)
            )
            db.session.add(stock_relation)

        stock_anterior = produto.stock_atual
        produto.stock_atual = float(produto.stock_atual) + float(quantidade)
        
        # update preco_compra if sent (for Revenda/Consumivel)
        price_changed = False
        if data.get('preco_compra') is not None and produto.tipo in ['Revenda', 'Consumivel']:
            if float(data['preco_compra']) != float(produto.preco_compra):
                price_changed = True
            produto.preco_compra = data['preco_compra']
            
        self.produto_repo.update(produto)
        
        if price_changed and produto.tipo == 'Consumivel':
            from app.models.receita import ReceitaItem
            itens = ReceitaItem.query.filter_by(produto_consumivel_id=produto.id).all()
            for item in itens:
                item.receita.recalcular_custos()
        
        from app.models.stock_movement import StockMovement, TipoMovimentoStock
        movimento = StockMovement(
            produto_id=produto.id,
            tipo_movimento=TipoMovimentoStock.ENTRADA,
            quantidade=quantidade,
            stock_anterior=stock_anterior,
            stock_atual=produto.stock_atual,
            numero_fatura=data.get('numero_fatura'),
            fornecedor_id=data.get('fornecedor_id'),
            observacao=data.get('observacao'),
            utilizador_id=user_id,
            created_by=user_id
        )
        db.session.add(movimento)
        db.session.commit()
        
        AuditService.log_action(user_id, "ENTRADA_STOCK", "produtos", produto.id, new_values={'quantidade': quantidade, 'novo_stock': float(produto.stock_atual)})
        return produto, None

    def saida_stock(self, id, data, user_id):
        produto = self.produto_repo.get_by_id(id)
        if not produto:
            return None, "Produto não encontrado"
            
        quantidade = data.get('quantidade')
        if quantidade is None or float(quantidade) <= 0:
            return None, "Quantidade inválida para saída de stock."
            
        if not data.get('motivo'):
            return None, "Motivo obrigatório para saída de stock."
            
        # Determine target warehouse
        armazem_id = data.get('armazem_id')
        if not armazem_id:
            stock_relation = db.session.query(ProdutoStockArmazem).filter_by(produto_id=produto.id).filter(ProdutoStockArmazem.stock_atual >= float(quantidade)).first()
            if not stock_relation:
                stock_relation = db.session.query(ProdutoStockArmazem).filter_by(produto_id=produto.id).first()
            if stock_relation:
                armazem_id = stock_relation.armazem_id
                
        armazem = self._get_target_armazem(armazem_id)
        stock_relation = db.session.query(ProdutoStockArmazem).filter_by(produto_id=produto.id, armazem_id=armazem.id).first()
        
        if not stock_relation or float(stock_relation.stock_atual) < float(quantidade):
            return None, f"Stock insuficiente no armazém {armazem.nome or armazem.codigo} para a operação."
            
        stock_anterior = produto.stock_atual
        produto.stock_atual = float(produto.stock_atual) - float(quantidade)
        
        # Deduct from warehouse stock relation
        stock_relation.stock_atual = float(stock_relation.stock_atual) - float(quantidade)
        
        self.produto_repo.update(produto)
        
        from app.models.stock_movement import StockMovement, TipoMovimentoStock
        movimento = StockMovement(
            produto_id=produto.id,
            tipo_movimento=TipoMovimentoStock.SAIDA,
            quantidade=quantidade,
            stock_anterior=stock_anterior,
            stock_atual=produto.stock_atual,
            motivo=data.get('motivo'),
            observacao=data.get('observacao'),
            utilizador_id=user_id,
            created_by=user_id
        )
        db.session.add(movimento)
        db.session.commit()
        
        AuditService.log_action(user_id, "SAIDA_STOCK", "produtos", produto.id, new_values={'quantidade': quantidade, 'motivo': data.get('motivo'), 'novo_stock': float(produto.stock_atual)})
        return produto, None

    # --- Material ---
    def create_material(self, data, user_id):
        armazem_id = data.pop('armazem_id', None)
        
        # Auto-generate unique code if not specified
        if not data.get('codigo'):
            from sqlalchemy import func
            max_id = db.session.query(func.max(Material.id)).scalar() or 0
            data['codigo'] = f"MAT-{(max_id + 1):04d}"
            
        # Initial quantity logic
        qty = data.get('quantidade_total', 0)
        data['quantidade_disponivel'] = qty
        
        material = Material(**data, created_by=user_id)
        self.material_repo.create(material)
        
        armazem = self._get_target_armazem(armazem_id)
        stock_relation = MaterialStockArmazem(
            material_id=material.id,
            armazem_id=armazem.id,
            stock_atual=float(qty or 0),
            stock_minimo=0
        )
        db.session.add(stock_relation)
        db.session.commit()
        
        AuditService.log_action(user_id, "CREATE", "materiais", material.id, new_values=data)
        return material, None

    def update_material(self, material_id, data, user_id):
        material = self.material_repo.get_by_id(material_id)
        if not material:
            return None, "Material não encontrado."

        armazem_id = data.pop('armazem_id', None)

        # Synchronize quantity fields if total quantity changes
        if 'quantidade_total' in data:
            qty_total = float(data['quantidade_total'])
            diff = qty_total - float(material.quantidade_total)
            material.quantidade_total = qty_total
            material.quantidade_disponivel = float(material.quantidade_disponivel) + diff

        for key, val in data.items():
            if hasattr(material, key):
                setattr(material, key, val)

        self.material_repo.update(material)

        if armazem_id:
            stock_relation = db.session.query(MaterialStockArmazem).filter_by(material_id=material.id).first()
            if stock_relation:
                stock_relation.armazem_id = armazem_id
                stock_relation.stock_atual = float(material.quantidade_disponivel)
            else:
                stock_relation = MaterialStockArmazem(
                    material_id=material.id,
                    armazem_id=armazem_id,
                    stock_atual=float(material.quantidade_disponivel),
                    stock_minimo=0
                )
                db.session.add(stock_relation)
            db.session.commit()

        AuditService.log_action(user_id, "UPDATE", "materiais", material.id, new_values=data)
        return material, None

    def delete_material(self, material_id, user_id):
        material = self.material_repo.get_by_id(material_id)
        if not material:
            return None, "Material não encontrado."
            
        material.soft_delete()
        self.material_repo.update(material)
        AuditService.log_action(user_id, "DELETE", "materiais", material.id)
        return {"msg": "Material removido com sucesso"}, None

    # --- Movimentações de Stock ---
    def registar_movimento(self, data, user_id):
        # data needs: tipo, origem, entidade_tipo, referencia_id, quantidade, justificacao, armazem_id
        
        entidade_tipo = data['entidade_tipo']
        ref_id = data['referencia_id']
        tipo_mov = data['tipo']
        qtd = data['quantidade']
        armazem_id = data.pop('armazem_id', None)
        
        # Get entity and corresponding warehouse relation config
        entity = None
        if entidade_tipo == EntidadeMovimento.INGREDIENTE.value:
            entity = self.ingrediente_repo.get_by_id(ref_id)
            stock_field = 'stock_atual'
            stock_model = IngredienteStockArmazem
            rel_field = 'ingrediente_id'
        elif entidade_tipo == EntidadeMovimento.PRODUTO.value:
            entity = self.produto_repo.get_by_id(ref_id)
            stock_field = 'stock_atual'
            stock_model = ProdutoStockArmazem
            rel_field = 'produto_id'
        elif entidade_tipo == EntidadeMovimento.MATERIAL.value:
            entity = self.material_repo.get_by_id(ref_id)
            stock_field = 'quantidade_disponivel'
            stock_model = MaterialStockArmazem
            rel_field = 'material_id'
        
        if not entity:
            return None, f"{entidade_tipo} não encontrado."
            
        current_stock = getattr(entity, stock_field, 0)
        
        if tipo_mov in [TipoMovimento.ENTRADA.value, TipoMovimento.DEVOLUCAO.value]:
            new_stock = float(current_stock) + float(qtd)
            if entidade_tipo == EntidadeMovimento.MATERIAL.value and tipo_mov == TipoMovimento.ENTRADA.value:
                entity.quantidade_total = float(entity.quantidade_total) + float(qtd)
        elif tipo_mov in [TipoMovimento.SAIDA.value, TipoMovimento.PERDA.value, TipoMovimento.DANIFICADO.value]:
            new_stock = float(current_stock) - float(qtd)
            if new_stock < 0:
                return None, "Stock insuficiente para esta operação."
                
            if entidade_tipo == EntidadeMovimento.MATERIAL.value and tipo_mov in [TipoMovimento.PERDA.value, TipoMovimento.DANIFICADO.value]:
                entity.quantidade_total = float(entity.quantidade_total) - float(qtd)
        elif tipo_mov == TipoMovimento.AJUSTE.value:
            # Here qtd is the difference, can be positive or negative
            new_stock = float(current_stock) + float(qtd)
            if new_stock < 0:
                return None, "Stock insuficiente para o ajuste negativo."
            if entidade_tipo == EntidadeMovimento.MATERIAL.value:
                entity.quantidade_total = float(entity.quantidade_total) + float(qtd)
        else:
            return None, "Tipo de movimento inválido."

        # Find target warehouse
        if not armazem_id:
            # Try to find any existing warehouse relation for the entity
            filter_kwargs = {rel_field: ref_id}
            stock_relation = db.session.query(stock_model).filter_by(**filter_kwargs).first()
            if stock_relation:
                armazem_id = stock_relation.armazem_id
        
        armazem = self._get_target_armazem(armazem_id)
        filter_kwargs = {rel_field: ref_id, 'armazem_id': armazem.id}
        stock_relation = db.session.query(stock_model).filter_by(**filter_kwargs).first()
        
        # Calculate new warehouse stock
        if stock_relation:
            wh_current_stock = float(stock_relation.stock_atual)
        else:
            wh_current_stock = 0.0
            
        if tipo_mov in [TipoMovimento.ENTRADA.value, TipoMovimento.DEVOLUCAO.value]:
            wh_new_stock = wh_current_stock + float(qtd)
        elif tipo_mov in [TipoMovimento.SAIDA.value, TipoMovimento.PERDA.value, TipoMovimento.DANIFICADO.value]:
            wh_new_stock = wh_current_stock - float(qtd)
            if wh_new_stock < 0:
                return None, f"Stock insuficiente no armazém {armazem.nome or armazem.codigo} para esta operação."
        elif tipo_mov == TipoMovimento.AJUSTE.value:
            wh_new_stock = wh_current_stock + float(qtd)
            if wh_new_stock < 0:
                return None, f"Stock insuficiente no armazém {armazem.nome or armazem.codigo} para o ajuste negativo."

        # Update warehouse relation
        if stock_relation:
            stock_relation.stock_atual = wh_new_stock
        else:
            stock_minimo = float(getattr(entity, 'stock_minimo', 0) or 0) if entidade_tipo != EntidadeMovimento.MATERIAL.value else 0
            stock_relation = stock_model(
                armazem_id=armazem.id,
                stock_atual=wh_new_stock,
                stock_minimo=stock_minimo
            )
            setattr(stock_relation, rel_field, ref_id)
            db.session.add(stock_relation)

        # Update stock of entity
        setattr(entity, stock_field, new_stock)
        
        # Create Movimento
        mov = MovimentoStock(**data, created_by=user_id)
        db.session.add(mov)
        db.session.commit()
        
        AuditService.log_action(user_id, "STOCK_MOVEMENT", "movimentacoes_armazem", mov.id, new_values=data)
        
        return mov, None

    # --- Armazem Management ---
    def create_armazem(self, data, user_id):
        codigo = data.get('codigo')
        if db.session.query(Armazem).filter_by(codigo=codigo, is_active=True).first():
            return None, "Código de armazém já existe."

        if data.get('principal'):
            db.session.query(Armazem).update({Armazem.principal: False})

        armazem = Armazem(**data)
        self.armazem_repo.create(armazem)
        AuditService.log_action(user_id, "CREATE", "armazens", armazem.id, new_values=data)
        return armazem, None

    def update_armazem(self, armazem_id, data, user_id):
        armazem = self.armazem_repo.get_by_id(armazem_id)
        if not armazem:
            return None, "Armazém não encontrado."

        if 'principal' in data and data['principal']:
            db.session.query(Armazem).filter(Armazem.id != armazem_id).update({Armazem.principal: False})

        for key, val in data.items():
            if hasattr(armazem, key):
                setattr(armazem, key, val)

        self.armazem_repo.update(armazem)
        AuditService.log_action(user_id, "UPDATE", "armazens", armazem.id, new_values=data)
        return armazem, None

    def get_armazem_stock(self, armazem_id):
        armazem = self.armazem_repo.get_by_id(armazem_id)
        if not armazem:
            return None, "Armazém não encontrado."
        
        return {
            "produtos": armazem.produtos_stock,
            "ingredientes": armazem.ingredientes_stock,
            "materiais": armazem.materiais_stock
        }, None

    def transferir_stock(self, data, user_id):
        origem_id = data.get('origem_armazem_id')
        destino_id = data.get('destino_armazem_id')
        tipo_item = data.get('tipo_item') # 'Produto', 'Ingrediente', 'Material'
        item_id = data.get('item_id')
        quantidade = float(data.get('quantidade', 0))

        if origem_id == destino_id:
            return None, "Armazém de origem e destino devem ser diferentes."
        if quantidade <= 0:
            return None, "A quantidade de transferência deve ser maior que zero."

        origem = self.armazem_repo.get_by_id(origem_id)
        destino = self.armazem_repo.get_by_id(destino_id)
        if not origem or not destino:
            return None, "Armazém de origem ou destino não encontrado."

        if tipo_item == 'Produto':
            stock_origem = db.session.query(ProdutoStockArmazem).filter_by(armazem_id=origem_id, produto_id=item_id).first()
            if not stock_origem or float(stock_origem.stock_atual) < quantidade:
                return None, "Stock insuficiente no armazém de origem."

            stock_origem.stock_atual = float(stock_origem.stock_atual) - quantidade
            
            stock_destino = db.session.query(ProdutoStockArmazem).filter_by(armazem_id=destino_id, produto_id=item_id).first()
            if not stock_destino:
                stock_destino = ProdutoStockArmazem(armazem_id=destino_id, produto_id=item_id, stock_atual=0, stock_minimo=0)
                db.session.add(stock_destino)
            stock_destino.stock_atual = float(stock_destino.stock_atual) + quantidade

        elif tipo_item == 'Ingrediente':
            stock_origem = db.session.query(IngredienteStockArmazem).filter_by(armazem_id=origem_id, ingrediente_id=item_id).first()
            if not stock_origem or float(stock_origem.stock_atual) < quantidade:
                return None, "Stock insuficiente no armazém de origem."

            stock_origem.stock_atual = float(stock_origem.stock_atual) - quantidade
            
            stock_destino = db.session.query(IngredienteStockArmazem).filter_by(armazem_id=destino_id, ingrediente_id=item_id).first()
            if not stock_destino:
                stock_destino = IngredienteStockArmazem(armazem_id=destino_id, ingrediente_id=item_id, stock_atual=0, stock_minimo=0)
                db.session.add(stock_destino)
            stock_destino.stock_atual = float(stock_destino.stock_atual) + quantidade

        elif tipo_item == 'Material':
            stock_origem = db.session.query(MaterialStockArmazem).filter_by(armazem_id=origem_id, material_id=item_id).first()
            if not stock_origem or float(stock_origem.stock_atual) < quantidade:
                return None, "Stock insuficiente no armazém de origem."

            stock_origem.stock_atual = float(stock_origem.stock_atual) - quantidade
            
            stock_destino = db.session.query(MaterialStockArmazem).filter_by(armazem_id=destino_id, material_id=item_id).first()
            if not stock_destino:
                stock_destino = MaterialStockArmazem(armazem_id=destino_id, material_id=item_id, stock_atual=0, stock_minimo=0)
                db.session.add(stock_destino)
            stock_destino.stock_atual = float(stock_destino.stock_atual) + quantidade
        else:
            return None, "Tipo de item inválido para transferência."

        db.session.commit()
        AuditService.log_action(user_id, "TRANSFER_STOCK", "armazens", origem_id, new_values=data)
        return {"msg": "Transferência realizada com sucesso!"}, None


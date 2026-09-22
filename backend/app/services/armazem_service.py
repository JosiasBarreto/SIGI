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

    def validar_importacao_catalogo(self, linhas):
        """Valida o lote antes de qualquer escrita; utilizado pela pré-visualização e testes."""
        from app.services.importacao import ImportacaoCatalogoService
        service = ImportacaoCatalogoService()
        resultado = service.validar_catalogo(linhas)
        return resultado.get('linhas', [])

    def importar_catalogo(self, linhas, user_id):
        """Executa a importação transacional atómica com resolução de referências e auditoria."""
        from app.services.importacao import ImportacaoCatalogoService
        service = ImportacaoCatalogoService()
        sucesso, erro = service.confirmar_importacao(linhas, user_id)
        if erro:
            return None, erro
        return sucesso.get('itens', []), None

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
        servico = data.get('servico')
        servico_str = servico.value if hasattr(servico, 'value') else (str(servico) if servico is not None else None)

        if tipo == 'Consumivel':
            if not data.get('nome') or not data.get('categoria_id') or not data.get('unidade_medida_id') or data.get('preco_compra') is None or data.get('stock_minimo') is None:
                return None, "Campos obrigatórios para Consumível: nome, categoria_id, unidade_medida_id, preco_compra, stock_minimo."
            if 'tempo_producao' in data and data['tempo_producao'] is not None:
                return None, "Consumível não pode ter tempo de produção."
            if servico_str and servico_str != 'ABASTECIMENTO':
                return None, "Serviço inválido para Consumível. Apenas ABASTECIMENTO é permitido."
            data['servico'] = 'ABASTECIMENTO'
            data['preco_venda'] = 0
            
        elif tipo == 'Acabado':
            if not data.get('nome') or not data.get('categoria_id') or not data.get('unidade_medida_id') or data.get('preco_venda') is None or data.get('tempo_producao') is None:
                return None, "Campos obrigatórios para Produto Acabado: nome, categoria_id, unidade_medida_id, preco_venda, tempo_producao."
            if not servico_str:
                return None, "Campo serviço é obrigatório para Produto Acabado."
            if servico_str not in ['COZINHA', 'PASTELARIA']:
                return None, "Serviço inválido para Produto Acabado. Apenas COZINHA ou PASTELARIA são permitidos."
            data['servico'] = servico_str
            # preco_compra cannot be set manually (will be calc'd by recipe later)
            data['preco_compra'] = 0

        elif tipo == 'Revenda':
            if not data.get('nome') or not data.get('categoria_id') or not data.get('unidade_medida_id') or data.get('preco_compra') is None or data.get('preco_venda') is None:
                return None, "Campos obrigatórios para Revenda: nome, categoria_id, unidade_medida_id, preco_compra, preco_venda."
            if servico_str and servico_str != 'BAR':
                return None, "Serviço inválido para Revenda. Apenas BAR é permitido."
            data['servico'] = 'BAR'
                
        data['codigo'] = self.generate_codigo_produto(tipo)
        data['stock_atual'] = 0 # Forced

        allowed_cols = {c.name for c in Produto.__table__.columns}
        produto_data = {k: v for k, v in data.items() if k in allowed_cols}
        
        produto = Produto(**produto_data, created_by=user_id)
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
        servico = data.get('servico')
        servico_str = servico.value if hasattr(servico, 'value') else (str(servico) if servico is not None else None)

        if tipo == 'Consumivel':
            if 'tempo_producao' in data and data['tempo_producao'] is not None:
                return None, "Consumível não pode ter tempo de produção."
            if 'servico' in data and servico_str != 'ABASTECIMENTO':
                return None, "Serviço inválido para Consumível. Apenas ABASTECIMENTO é permitido."
            data['preco_venda'] = 0
            
        elif tipo == 'Acabado':
            if 'preco_compra' in data:
                data.pop('preco_compra') # Cannot be updated manually
            if 'servico' in data:
                if not servico_str:
                    return None, "Campo serviço é obrigatório para Produto Acabado."
                if servico_str not in ['COZINHA', 'PASTELARIA']:
                    return None, "Serviço inválido para Produto Acabado. Apenas COZINHA ou PASTELARIA são permitidos."

        elif tipo == 'Revenda':
            if 'servico' in data and servico_str != 'BAR':
                return None, "Serviço inválido para Revenda. Apenas BAR é permitido."

        if 'preco_compra' in data and produto.tipo == 'Consumivel' and float(data['preco_compra']) != float(produto.preco_compra):
            price_changed = True
        else:
            price_changed = False

        # Apply updates
        allowed_cols = {c.name for c in Produto.__table__.columns}
        for key, value in data.items():
            if key in allowed_cols:
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

    def entrada_stock_lote(self, data, user_id):
        """
        Regista entrada de stock em lote para múltiplos produtos (ex: compra de mercadorias / receção de fatura).
        """
        itens = data.get('itens') or []
        if not itens or not isinstance(itens, list):
            return None, "A lista de itens para entrada em lote não pode estar vazia."

        fornecedor_id = data.get('fornecedor_id')
        numero_fatura = data.get('numero_fatura')
        global_observacao = data.get('observacao')
        armazem_id = data.get('armazem_id')

        processed_results = []
        errors = []

        try:
            from app.models.stock_movement import StockMovement, TipoMovimentoStock
            from app.models.receita import ReceitaItem

            armazem = self._get_target_armazem(armazem_id)

            for idx, item in enumerate(itens):
                prod_id = item.get('produto_id') or item.get('id')
                quantidade = item.get('quantidade')

                if not prod_id:
                    errors.append(f"Item #{idx + 1}: ID do produto não especificado.")
                    continue

                if quantidade is None or float(quantidade) <= 0:
                    errors.append(f"Item #{idx + 1} (ID {prod_id}): Quantidade inválida ({quantidade}).")
                    continue

                produto = self.produto_repo.get_by_id(prod_id)
                if not produto:
                    errors.append(f"Item #{idx + 1}: Produto com ID {prod_id} não encontrado.")
                    continue

                # Atualização no armazém específico
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

                # Atualizar produto principal
                stock_anterior = produto.stock_atual
                produto.stock_atual = float(produto.stock_atual) + float(quantidade)

                # Atualizar preço de compra se fornecido
                preco_compra = item.get('preco_compra')
                price_changed = False
                if preco_compra is not None and produto.tipo in ['Revenda', 'Consumivel']:
                    if float(preco_compra) != float(produto.preco_compra or 0):
                        price_changed = True
                    produto.preco_compra = preco_compra

                self.produto_repo.update(produto)

                if price_changed and produto.tipo == 'Consumivel':
                    receita_itens = ReceitaItem.query.filter_by(produto_consumivel_id=produto.id).all()
                    for r_item in receita_itens:
                        r_item.receita.recalcular_custos()

                obs_item = item.get('observacao') or global_observacao

                # Registar movimento de stock
                movimento = StockMovement(
                    produto_id=produto.id,
                    tipo_movimento=TipoMovimentoStock.ENTRADA,
                    quantidade=quantidade,
                    stock_anterior=stock_anterior,
                    stock_atual=produto.stock_atual,
                    numero_fatura=numero_fatura,
                    fornecedor_id=fornecedor_id,
                    observacao=obs_item,
                    utilizador_id=user_id,
                    created_by=user_id
                )
                db.session.add(movimento)

                AuditService.log_action(
                    user_id,
                    "ENTRADA_STOCK_LOTE",
                    "produtos",
                    produto.id,
                    new_values={'quantidade': quantidade, 'novo_stock': float(produto.stock_atual), 'numero_fatura': numero_fatura}
                )

                processed_results.append({
                    "produto_id": produto.id,
                    "nome": produto.nome,
                    "quantidade_adicionada": float(quantidade),
                    "novo_stock": float(produto.stock_atual),
                    "preco_compra": float(preco_compra) if preco_compra is not None else float(produto.preco_compra or 0)
                })

            if errors:
                db.session.rollback()
                return None, f"Erros ao processar lote: {'; '.join(errors)}"

            db.session.commit()
            return {
                "total_itens": len(processed_results),
                "numero_fatura": numero_fatura,
                "armazem_id": armazem.id,
                "itens_processados": processed_results
            }, None

        except Exception as e:
            db.session.rollback()
            return None, f"Erro ao registar entrada de stock em lote: {str(e)}"

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

        allowed_cols = {c.name for c in Material.__table__.columns}
        material_data = {k: v for k, v in data.items() if k in allowed_cols}
        
        material = Material(**material_data, created_by=user_id)
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
        if 'estado' in data:
            estado = str(data['estado']).strip().replace('ç', 'c').replace('Ç', 'C')
            estado_normalizado = next(
                (item.value for item in EstadoMaterial
                 if estado.casefold() in (item.name.casefold(), item.value.casefold())),
                None,
            )
            if not estado_normalizado:
                return None, "Estado de material inválido."
            data['estado'] = estado_normalizado

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

    def activate_material(self, id, user_id):
        material = self.material_repo.get_by_id(id)
        if not material:
            return None, "Material não encontrado"
        material.ativo = True
        material.updated_by = user_id
        self.material_repo.update(material)
        AuditService.log_action(user_id, "ACTIVATE", "materiais", material.id)
        return material, None

    def deactivate_material(self, id, user_id):
        material = self.material_repo.get_by_id(id)
        if not material:
            return None, "Material não encontrado"
            
        # Integrity Rules
        if material.quantidade_disponivel > 0 or material.quantidade_reservada > 0:
            return None, "O material não pode ser desativado porque ainda tem stock disponível ou reservado."
            
        material.ativo = False
        material.updated_by = user_id
        self.material_repo.update(material)
        AuditService.log_action(user_id, "DEACTIVATE", "materiais", material.id)
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
        
        # Capture before and after stock levels
        data['armazem_id'] = armazem.id
        data['quantidade_antes'] = wh_current_stock
        data['quantidade_depois'] = wh_new_stock
        
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

    def activate_armazem(self, id, user_id):
        armazem = self.armazem_repo.get_by_id(id)
        if not armazem:
            return None, "Armazém não encontrado."
        armazem.is_active = True
        armazem.updated_by = user_id
        self.armazem_repo.update(armazem)
        AuditService.log_action(user_id, "ACTIVATE", "armazens", armazem.id)
        return armazem, None

    def deactivate_armazem(self, id, user_id):
        armazem = self.armazem_repo.get_by_id(id)
        if not armazem:
            return None, "Armazém não encontrado."
        if armazem.principal:
            return None, "Não é possível desativar o armazém principal."
            
        has_prod_stock = any(float(item.stock_atual) > 0 for item in armazem.produtos_stock) if armazem.produtos_stock else False
        has_ing_stock = any(float(item.stock_atual) > 0 for item in armazem.ingredientes_stock) if armazem.ingredientes_stock else False
        has_mat_stock = any(float(item.stock_atual) > 0 for item in armazem.materiais_stock) if armazem.materiais_stock else False
        
        if has_prod_stock or has_ing_stock or has_mat_stock:
            return None, "Não é possível desativar o armazém porque ainda contém stock disponível."
            
        armazem.is_active = False
        armazem.updated_by = user_id
        self.armazem_repo.update(armazem)
        AuditService.log_action(user_id, "DEACTIVATE", "armazens", armazem.id)
        return armazem, None

    def delete_armazem(self, id, user_id):
        armazem = self.armazem_repo.get_by_id(id)
        if not armazem:
            return None, "Armazém não encontrado."
        if armazem.principal:
            return None, "Não é possível remover o armazém principal."
            
        has_prod_stock = any(float(item.stock_atual) > 0 for item in armazem.produtos_stock) if armazem.produtos_stock else False
        has_ing_stock = any(float(item.stock_atual) > 0 for item in armazem.ingredientes_stock) if armazem.ingredientes_stock else False
        has_mat_stock = any(float(item.stock_atual) > 0 for item in armazem.materiais_stock) if armazem.materiais_stock else False
        
        if has_prod_stock or has_ing_stock or has_mat_stock:
            return None, "Não é possível remover o armazém porque ainda contém stock disponível."
            
        armazem.soft_delete()
        self.armazem_repo.update(armazem)
        AuditService.log_action(user_id, "DELETE", "armazens", armazem.id)
        return {"msg": "Armazém removido com sucesso"}, None

    def get_armazem_stock(self, armazem_id, filters=None):
        armazem = self.armazem_repo.get_by_id(armazem_id)
        if not armazem:
            return None, "Armazém não encontrado."
        
        produtos = armazem.produtos_stock or []
        ingredientes = armazem.ingredientes_stock or []
        materiais = armazem.materiais_stock or []

        if filters:
            tipo = filters.get('tipo')
            categoria = filters.get('categoria')
            busca = filters.get('busca')

            if tipo:
                tipo_lower = tipo.lower()
                if tipo_lower == 'ingrediente':
                    produtos = []
                    materiais = []
                elif tipo_lower in ['reutilizavel', 'consumivel']:
                    ingredientes = []
                    produtos = [p for p in produtos if p.produto and p.produto.tipo.value.lower() == tipo_lower]
                    materiais = [m for m in materiais if m.material and m.material.tipo.value.lower() == tipo_lower]
                elif tipo_lower in ['acabado', 'revenda']:
                    ingredientes = []
                    materiais = []
                    produtos = [p for p in produtos if p.produto and p.produto.tipo.value.lower() == tipo_lower]
                else:
                    produtos = [p for p in produtos if p.produto and p.produto.tipo.value.lower() == tipo_lower]
                    ingredientes = []
                    materiais = [m for m in materiais if m.material and m.material.tipo.value.lower() == tipo_lower]

            if categoria:
                cat_lower = categoria.lower()
                produtos = [p for p in produtos if p.produto and ((p.produto.categoria and cat_lower in p.produto.categoria.lower()) or (p.produto.categoria_rel and cat_lower in p.produto.categoria_rel.nome.lower()))]
                ingredientes = [i for i in ingredientes if i.ingrediente and i.ingrediente.categoria and cat_lower in i.ingrediente.categoria.lower()]
                materiais = [m for m in materiais if m.material and m.material.categoria and cat_lower in m.material.categoria.lower()]

            if busca:
                b_lower = busca.lower()
                produtos = [p for p in produtos if p.produto and (b_lower in p.produto.nome.lower() or (p.produto.codigo and b_lower in p.produto.codigo.lower()))]
                ingredientes = [i for i in ingredientes if i.ingrediente and (b_lower in i.ingrediente.nome.lower() or (i.ingrediente.codigo and b_lower in i.ingrediente.codigo.lower()))]
                materiais = [m for m in materiais if m.material and (b_lower in m.material.nome.lower() or (m.material.codigo and b_lower in m.material.codigo.lower()))]

        return {
            "produtos": produtos,
            "ingredientes": ingredientes,
            "materiais": materiais
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

    def get_dados_auxiliares(self):
        """Retorna listas auxiliares consolidadas para formulários e catálogo (unidades, categorias, IVA, serviços, armazéns)."""
        from app.models.categoria_produto import CategoriaProduto
        from app.models.unidade_medida import UnidadeMedida
        from app.models.comercial import TaxaIVA
        from app.models.armazem import Armazem
        from app.models.produto import ServicoEnum, TipoProduto
        from app.models.material import TipoMaterial

        categorias = (
            CategoriaProduto.query.filter(CategoriaProduto.is_active.isnot(False))
            .order_by(CategoriaProduto.nome.asc())
            .all()
        )
        unidades = (
            UnidadeMedida.query.filter(UnidadeMedida.is_active.isnot(False))
            .order_by(UnidadeMedida.nome.asc())
            .all()
        )
        taxas = (
            TaxaIVA.query.filter(TaxaIVA.is_active.isnot(False))
            .order_by(TaxaIVA.percentagem.asc())
            .all()
        )
        armazens = (
            Armazem.query.filter(Armazem.is_active.isnot(False))
            .order_by(Armazem.principal.desc(), Armazem.nome.asc())
            .all()
        )

        servicos = [e.value for e in ServicoEnum]
        servicos_detalhe = [
            {"codigo": "ABASTECIMENTO", "nome": "Abastecimento", "tipo_padrao": "Consumivel"},
            {"codigo": "COZINHA", "nome": "Cozinha", "tipo_padrao": "Acabado"},
            {"codigo": "PASTELARIA", "nome": "Pastelaria", "tipo_padrao": "Acabado"},
            {"codigo": "BAR", "nome": "Bar", "tipo_padrao": "Revenda"},
        ]

        tipos_produto = [e.value for e in TipoProduto] + ["Material"]
        tipos_material = [e.value for e in TipoMaterial]

        unidades_data = [
            {"id": u.id, "sigla": u.sigla, "nome": u.nome, "descricao": u.descricao or ""}
            for u in unidades
        ]
        categorias_data = [
            {"id": c.id, "nome": c.nome, "descricao": c.descricao or ""}
            for c in categorias
        ]
        taxas_data = [
            {
                "id": t.id,
                "descricao": t.descricao,
                "percentagem": float(t.percentagem) if t.percentagem is not None else 0.0,
                "ativo": bool(getattr(t, "ativo", True))
            }
            for t in taxas
        ]
        armazens_data = [
            {
                "id": a.id,
                "codigo": a.codigo,
                "nome": a.nome,
                "localizacao": getattr(a, "localizacao", "") or "",
                "descricao": getattr(a, "descricao", "") or "",
                "principal": bool(getattr(a, "principal", False))
            }
            for a in armazens
        ]

        resultado = {
            "success": True,
            "unidades_medida": unidades_data,
            "categorias": categorias_data,
            "taxas_iva": taxas_data,
            "servicos": servicos,
            "servicos_detalhe": servicos_detalhe,
            "tipos_produto": tipos_produto,
            "tipos_material": tipos_material,
            "armazens": armazens_data,
        }
        # Envelope para compatibilidade com clientes que acedem a res.data.*
        resultado["data"] = {
            "unidades_medida": unidades_data,
            "categorias": categorias_data,
            "taxas_iva": taxas_data,
            "servicos": servicos,
            "servicos_detalhe": servicos_detalhe,
            "tipos_produto": tipos_produto,
            "tipos_material": tipos_material,
            "armazens": armazens_data,
        }
        return resultado

armazem_service = ArmazemService()

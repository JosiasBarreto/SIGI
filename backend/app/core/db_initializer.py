"""
Módulo de Inicialização da Base de Dados - SIGI ERP
Responsável EXCLUSIVAMENTE por criar e validar a existência de todas as tabelas
no arranque do sistema (db.create_all()), SEM criar utilizadores ou dados de empresa,
preservando 100% o fluxo do Assistente de Configuração Inicial (Setup Wizard) no Frontend.
"""
import logging
from sqlalchemy import inspect, text

logger = logging.getLogger(__name__)

def import_all_models():
    """
    Importa exaustivamente todos os modelos do SQLAlchemy para garantir
    que db.metadata conheça 100% das tabelas da aplicação.
    """
    try:
        from app.models.user import User, RoleEnum
        from app.models.cliente import Cliente
        from app.models.fornecedor import Fornecedor
        from app.models.empresa import Empresa
        from app.models.categoria_produto import CategoriaProduto
        from app.models.grupos_categoria import GrupoCategoria
        from app.models.unidade_medida import UnidadeMedida
        from app.models.ingrediente import Ingrediente
        from app.models.produto import Produto, TipoProduto
        from app.models.material import Material, TipoMaterial, EstadoMaterial
        from app.models.ficha_tecnica import FichaTecnica, FichaTecnicaItem
        from app.models.ordem_producao import OrdemProducao, ConsumoIngrediente
        from app.models.producao_nova import Producao, ProducaoItem, ProducaoDesvio
        from app.models.receita import ReceitaProducao, ReceitaItem
        from app.models.turno import Turno
        from app.models.armazem import Armazem, ProdutoStockArmazem, IngredienteStockArmazem, MaterialStockArmazem
        from app.models.movimento_stock import MovimentoStock
        from app.models.stock_movement import StockMovement
        from app.models.quarentena import QuarentenaItem, EstadoQuarentena
        from app.models.inventario import (
            Inventario, InventarioItem, TipoInventario,
            EstadoInventario, SituacaoDivergencia, MotivoAjusteInventario
        )
        from app.models.requisicao import Requisicao, RequisicaoItem, EntregaRequisicao, DevolucaoMaterial, OcorrenciaMaterial
        from app.models.reserva import ReservaIngrediente
        from app.models.evento import (
            Espaco, Evento, EventoItem, EventoServico,
            ReservaEspaco, ReservaMaterial, EventoEquipa,
            ServicoCadastro, TipoEventoCadastro, EquipaCadastro,
            PoliticaComercialEvento, PoliticaComercialRegra
        )
        from app.models.logistica import Motorista, Viatura, Entrega, ReservaViatura, OcorrenciaLogistica, ChecklistEntrega
        from app.models.caixa import Caixa, MovimentoCaixa
        from app.models.comercial import (
            TaxaIVA, SerieDocumento, Venda, VendaItem,
            Proforma, ProformaItem, FechoDiario, TipoDocumento
        )
        from app.models.pedido import Pedido, TipoPedido, OrigemPedido, EstadoPedido
        from app.models.item_pedido import ItemPedido, TipoItem
        from app.models.financeiro import (
            FormaPagamento, Pagamento, ContaReceber, ContaPagar,
            Receita, Despesa, CentroCusto
        )
        from app.models.auditoria import Auditoria, LogAcesso, LogErro
        from app.models.token_blocklist import TokenBlocklist
        from app.models.notificacao import Notificacao, NotificacaoLeitura, HistoricoSMS
        return True
    except Exception:
        logger.exception("[SIGI DB] Erro ao importar modelos; a criação das tabelas foi cancelada.")
        return False


def run_safe_migrations(db):
    """Executa migrações de compatibilidade prevenindo que falhas em queries quebrem o app."""
    queries = [
        "ALTER TABLE itens_pedido MODIFY COLUMN tipo_item ENUM('Produto', 'Produto Acabado', 'Produto Revenda', 'Servico', 'Aluguer') NOT NULL;",
        "ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS desconto NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS taxa_iva_id INTEGER NULL;",
        "ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS taxa_iva NUMERIC(5,2) DEFAULT 0;",
        "ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS valor_iva NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS desconto_total NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS base_tributavel NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS total_iva NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE vendas ADD COLUMN IF NOT EXISTS pedido_id INTEGER NULL;",
        "ALTER TABLE vendas ADD COLUMN IF NOT EXISTS evento_id INTEGER NULL;",
        "ALTER TABLE eventos ADD COLUMN IF NOT EXISTS pedido_id INTEGER NULL;",
        "ALTER TABLE eventos ADD COLUMN IF NOT EXISTS venda_id INTEGER NULL;",
        "ALTER TABLE movimentos_caixa ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(100) NULL;",
        "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS servico ENUM('ABASTECIMENTO', 'COZINHA', 'PASTELARIA', 'BAR') NULL;",
        "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS taxa_iva_id INT NULL;",
        "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS unidade_medida_id INT NULL;",
        "ALTER TABLE movimentacoes_armazem MODIFY COLUMN origem VARCHAR(50);",
        "ALTER TABLE movimentacoes_armazem MODIFY COLUMN tipo VARCHAR(50);",
        "ALTER TABLE movimentacoes_armazem MODIFY COLUMN entidade_tipo VARCHAR(50);",
        # Migração e compatibilidade para tabela inventarios (Módulo Inventário de Stock SIGI)
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS numero VARCHAR(50) NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS armazem_id INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS tipo ENUM('COMPLETO', 'PARCIAL') DEFAULT 'COMPLETO';",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS estado ENUM('RASCUNHO', 'EM_CONTAGEM', 'EM_CONFERENCIA', 'APROVADO', 'APLICADO', 'CANCELADO') DEFAULT 'RASCUNHO';",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS data_inventario DATE NULL;",
        # Versões antigas reutilizavam a tabela inventarios com data_inicio obrigatória.
        # O módulo oficial usa data_inventario; tornar a coluna legada opcional evita falha no INSERT.
        "ALTER TABLE inventarios MODIFY COLUMN data_inicio DATETIME NULL;",
        "ALTER TABLE inventarios MODIFY COLUMN utilizador_id INT NULL;",
        "ALTER TABLE inventarios MODIFY COLUMN tipo ENUM('COMPLETO', 'PARCIAL') NOT NULL DEFAULT 'COMPLETO';",
        "ALTER TABLE inventarios MODIFY COLUMN estado ENUM('RASCUNHO', 'EM_CONTAGEM', 'EM_CONFERENCIA', 'APROVADO', 'APLICADO', 'CANCELADO') NOT NULL DEFAULT 'RASCUNHO';",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS responsavel_id INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS observacao TEXT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS iniciado_em DATETIME NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS finalizado_em DATETIME NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS aprovado_em DATETIME NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS aprovado_por INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS aplicado_em DATETIME NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS aplicado_por INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS cancelado_em DATETIME NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS cancelado_por INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS motivo_cancelamento VARCHAR(255) NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS created_by INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS updated_by INT NULL;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE inventarios ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;",
        # Migração e compatibilidade para tabela inventario_items
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS inventario_id INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS produto_id INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS material_id INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS unidade_medida_id INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS quantidade_sistema DECIMAL(12,3) DEFAULT 0.000;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS quantidade_contada DECIMAL(12,3) NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS diferenca DECIMAL(12,3) NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS situacao ENUM('SEM_DIVERGENCIA', 'FALTA', 'SOBRA', 'NAO_CONTADO') DEFAULT 'NAO_CONTADO';",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS motivo_ajuste ENUM('QUEBRA', 'PERDA', 'DANIFICADO', 'CONSUMO_NAO_REGISTADO', 'ERRO_CONTAGEM', 'ERRO_REGISTO', 'VALIDACAO_INVENTARIO', 'OUTRO') NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS observacao TEXT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS contado_por INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS contado_em DATETIME NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS created_at DATETIME DEFAULT CURRENT_TIMESTAMP;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS created_by INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS updated_by INT NULL;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;",
        "ALTER TABLE inventario_items ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;",
        # Colunas da implementação antiga não são usadas pelo módulo oficial.
        "ALTER TABLE inventario_items MODIFY COLUMN tipo_item ENUM('INGREDIENTE', 'MATERIAL', 'PRODUTO') NULL;",
        "ALTER TABLE inventario_items MODIFY COLUMN referencia_id INT NULL;",
        "ALTER TABLE inventario_items MODIFY COLUMN quantidade_contada DECIMAL(12,3) NULL;",
        "ALTER TABLE inventario_items MODIFY COLUMN diferenca DECIMAL(12,3) NULL;",
        # Migração e compatibilidade para tabela notificacoes (Arquitetura de Notificações SIGI)
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS event_id VARCHAR(64) NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS event_type VARCHAR(64) NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS entity_type VARCHAR(64) NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS entity_id INT NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS aggregate_id VARCHAR(128) NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS actor_user_id INT NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS recipient_user_id INT NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS recipient_role VARCHAR(50) NULL;",
        # Compatibilidade para tabelas materiais, ocorrencias_materiais e requisicoes (previne Data truncated 1265 e Enum mismatch)
        "ALTER TABLE materiais MODIFY COLUMN estado VARCHAR(50) DEFAULT 'Disponivel';",
        "ALTER TABLE materiais MODIFY COLUMN tipo VARCHAR(50) NOT NULL DEFAULT 'Reutilizavel';",
        "ALTER TABLE ocorrencias_materiais MODIFY COLUMN tipo VARCHAR(50) NOT NULL;",
        "ALTER TABLE ocorrencias_materiais MODIFY COLUMN estado VARCHAR(50) DEFAULT 'Aberta';",
        "ALTER TABLE requisicoes MODIFY COLUMN estado VARCHAR(50) DEFAULT 'Pendente';",
        "ALTER TABLE requisicoes MODIFY COLUMN tipo VARCHAR(50) NOT NULL DEFAULT 'Inicial';",
        "ALTER TABLE requisicoes MODIFY COLUMN sector VARCHAR(50) NOT NULL DEFAULT 'Cozinha';",
        "ALTER TABLE requisicoes_itens MODIFY COLUMN tipo_item VARCHAR(50) NOT NULL;",
        "ALTER TABLE requisicoes_itens ADD COLUMN IF NOT EXISTS quantidade_aprovada DECIMAL(10,3) DEFAULT 0.000;",
        "ALTER TABLE requisicoes_itens ADD COLUMN IF NOT EXISTS quantidade_entregue DECIMAL(10,3) DEFAULT 0.000;",
        "ALTER TABLE requisicoes_itens ADD COLUMN IF NOT EXISTS quantidade_devolvida DECIMAL(10,3) DEFAULT 0.000;",
        "ALTER TABLE requisicoes_itens ADD COLUMN IF NOT EXISTS quantidade_danificada DECIMAL(10,3) DEFAULT 0.000;",
        "ALTER TABLE requisicoes_itens ADD COLUMN IF NOT EXISTS quantidade_perdida DECIMAL(10,3) DEFAULT 0.000;",
        "ALTER TABLE requisicoes_itens ADD COLUMN IF NOT EXISTS observacao TEXT NULL;",
        # ...existing code...
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS ativa BOOLEAN DEFAULT TRUE;",
        "UPDATE notificacoes SET ativa = 1 WHERE ativa IS NULL;",  #
        
    ]
    for q in queries:
        try:
            db.session.execute(text(q))
            db.session.commit()
        except Exception:
            db.session.rollback()
            if "IF NOT EXISTS" in q:
                try:
                    q_clean = q.replace(" IF NOT EXISTS", "")
                    db.session.execute(text(q_clean))
                    db.session.commit()
                except Exception:
                    db.session.rollback()
                    logger.warning("Migração ignorada após falha (coluna/tabela já existente ou incompatível): %s", q)
            else:
                logger.warning("Migração ignorada por incompatibilidade com o schema atual: %s", q, exc_info=True)

    ensure_category_classification_schema(db)


def ensure_category_classification_schema(db):
    """Add the category context safely, without guessing legacy category ownership.

    Existing rows remain untouched.  Only the unambiguous legacy groups
    ``Produtos`` and ``Materiais`` receive a context; all other legacy
    categories intentionally remain unassigned for manual review.
    """
    inspector = inspect(db.engine)
    if not inspector.has_table('grupos_categoria') or not inspector.has_table('categorias_produto'):
        return
    def ensure_columns(table, definitions):
        """Add only absent legacy columns; one statement per column."""
        present = {c['name'] for c in inspect(db.engine).get_columns(table)}
        for column, definition in definitions.items():
            if column not in present:
                db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {definition}"))
                db.session.commit()
                present.add(column)
        return present

    # BaseModel was added after some production installations already had these
    # tables.  All mapped columns must exist before ORM queries are allowed.
    group_columns = ensure_columns('grupos_categoria', {
        'contexto': 'VARCHAR(30) NULL',
        'created_by': 'INTEGER NULL',
        'updated_by': 'INTEGER NULL',
        'is_active': 'BOOLEAN NOT NULL DEFAULT TRUE',
        'deleted_at': 'DATETIME NULL',
    })
    ensure_columns('categorias_produto', {
        'grupo_id': 'INTEGER NULL',
        # ``ativo`` is a legacy mapped field retained for compatibility.
        'ativo': 'BOOLEAN NOT NULL DEFAULT TRUE',
        'created_by': 'INTEGER NULL',
        'updated_by': 'INTEGER NULL',
        'is_active': 'BOOLEAN NOT NULL DEFAULT TRUE',
        'deleted_at': 'DATETIME NULL',
    })
    db.session.execute(text("UPDATE grupos_categoria SET contexto = 'Material' WHERE nome = 'Materiais' AND contexto IS NULL"))
    # The former single Produtos group is ambiguous and must not be assigned to
    # a product type automatically.  It is retained as a historical group.
    db.session.commit()
    # Additive reference groups: INSERT ... SELECT is idempotent and never
    # modifies a user-created group/category.
    references = [
        ('Produtos Consumíveis', 'Consumivel'), ('Produtos Acabados', 'Acabado'),
        ('Produtos de Revenda', 'Revenda'), ('Materiais', 'Material'),
    ]
    for nome, contexto in references:
        existing = db.session.execute(text(
            "SELECT id FROM grupos_categoria WHERE nome = :nome AND contexto = :contexto LIMIT 1"
        ), {'nome': nome, 'contexto': contexto}).scalar()
        if not existing:
            legacy_ativo_column = ', ativo' if 'ativo' in group_columns else ''
            legacy_ativo_value = ', TRUE' if 'ativo' in group_columns else ''
            db.session.execute(text(
                f"INSERT INTO grupos_categoria (nome, contexto, descricao, is_active{legacy_ativo_column}, created_at, updated_at) "
                f"VALUES (:nome, :contexto, :descricao, TRUE{legacy_ativo_value}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
            ), {'nome': nome, 'contexto': contexto, 'descricao': f'Categorias de {nome.lower()}.'})
            db.session.commit()


def ensure_client_nif_index(db):
    """Allow repeated placeholder NIFs while retaining an index for real NIF lookup."""
    if db.engine.dialect.name not in ('mysql', 'mariadb'):
        return True
    try:
        indexes = inspect(db.engine).get_indexes('clientes')
        for index in indexes:
            if index.get('unique') and index.get('column_names') == ['nif']:
                name = db.engine.dialect.identifier_preparer.quote(index['name'])
                db.session.execute(text(f'ALTER TABLE clientes DROP INDEX {name}'))
                db.session.commit()
        indexes = inspect(db.engine).get_indexes('clientes')
        if not any(index.get('column_names') == ['nif'] for index in indexes):
            db.session.execute(text('CREATE INDEX ix_clientes_nif ON clientes (nif)'))
            db.session.commit()
        return True
    except Exception:
        db.session.rollback()
        logger.exception('[SIGI DB] Não foi possível ajustar o índice de NIF dos clientes.')
        return False


def ensure_database_ready(app, force=False):
    """
    Garante que todas as tabelas existam na base de dados:
    - Executa db.create_all() caso a tabela 'users' ou 'log_erros' não exista.
    - NÃO insere nenhum utilizador ou dados de empresa.
    - Preserva o assistente de configuração (Setup Wizard) do frontend.
    """
    from app.core.database import db

    with app.app_context():
        # 1. Carregar todos os modelos para registro de metadados no SQLAlchemy
        if not import_all_models():
            logger.error("[SIGI DB] Não foi possível carregar todos os modelos. A base de dados não foi alterada.")
            return False

        try:
            inspector = inspect(db.engine)
            existing_tables = inspector.get_table_names()
        except Exception as conn_err:
            print("\n" + "=" * 65)
            print("⚠️  [SIGI ERP] AVISO: Não foi possível conectar ao MySQL!")
            print(f"    Detalhes: {conn_err}")
            print("    Verifique se o serviço MySQL está ativo e as configurações do .env.")
            print("=" * 65 + "\n")
            return False

        first_time = force or ("users" not in existing_tables) or ("log_erros" not in existing_tables)
        if first_time:
            print("\n" + "=" * 65)
            print("🚀 [SIGI ERP] Primeira inicialização: criando todas as tabelas...")
            print("=" * 65)
        try:
            # create_all is intentionally run on every start: it creates any
            # newly registered model tables without dropping existing data.
            db.create_all()
            expected_tables = set(db.metadata.tables)
            actual_tables = set(inspect(db.engine).get_table_names())
            if missing_tables := sorted(expected_tables - actual_tables):
                logger.error("[SIGI DB] Tabelas não criadas: %s", ", ".join(missing_tables))
                return False
            logger.info("[SIGI DB] Estrutura verificada: %d tabelas registadas.", len(expected_tables))
            if first_time:
                print("   ✅ Estrutura de tabelas criada com sucesso no MySQL.")
        except Exception as e:
            logger.exception("[SIGI DB] Erro ao criar/verificar todas as tabelas: %s", e)
            return False

        if not ensure_client_nif_index(db):
            return False

        # Executar ajustes seguros de colunas
        try:
            run_safe_migrations(db)
        except Exception as e:
            logger.warning(f"Migrações de compatibilidade: {e}")

        try:
            from app.services.cliente_service import get_or_create_consumidor_final
            get_or_create_consumidor_final()
            db.session.commit()
        except Exception:
            db.session.rollback()
            logger.exception('[SIGI DB] Não foi possível garantir o cliente Consumidor Final.')
            return False

        # Verifica se já existe admin e empresa configurados
        try:
            from app.models.user import User, RoleEnum
            from app.models.empresa import Empresa
            admin_exists = User.query.filter_by(role=RoleEnum.ADMINISTRADOR).first() is not None
            empresa_exists = Empresa.query.first() is not None

            if not admin_exists or not empresa_exists:
                print("ℹ️  [SIGI ERP] Sistema pronto e a aguardar primeiro registo pelo Setup Wizard.")
            else:
                print("✨ [SIGI ERP] Base de dados operacional e sistema configurado.")
        except Exception:
            pass

        return True

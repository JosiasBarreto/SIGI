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
        return True
    except Exception as e:
        logger.error(f"[SIGI DB] Erro ao importar modelos: {e}")
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
        "ALTER TABLE vendas ADD COLUMN IF NOT EXISTS pedido_id INTEGER NULL;",
        "ALTER TABLE eventos ADD COLUMN IF NOT EXISTS pedido_id INTEGER NULL;",
        "ALTER TABLE movimentos_caixa ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(100) NULL;",
        "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS servico ENUM('ABASTECIMENTO', 'COZINHA', 'PASTELARIA', 'BAR') NULL;",
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
        import_all_models()

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
                db.create_all()
                print("   ✅ Estrutura de tabelas criada com sucesso no MySQL.")
            except Exception as e:
                print(f"   ❌ Erro ao criar tabelas com db.create_all(): {e}")
                return False
        else:
            try:
                db.create_all()
            except Exception as e:
                logger.warning(f"db.create_all warning: {e}")

        # Executar ajustes seguros de colunas
        try:
            run_safe_migrations(db)
        except Exception as e:
            logger.warning(f"Migrações de compatibilidade: {e}")

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

from app import create_app
from app.core.database import db
from flask_migrate import Migrate
from app.websocket.socket_manager import socketio
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
import time


def is_concurrent_ddl_error(exc):
    return "being modified by concurrent DDL statement" in str(exc) or "(1684" in str(exc)


def run_with_ddl_retry(action, label, attempts=12, delay=2):
    for attempt in range(1, attempts + 1):
        try:
            return action()
        except OperationalError as exc:
            db.session.rollback()
            if not is_concurrent_ddl_error(exc) or attempt == attempts:
                raise
            print(f"[WARN] {label} aguardando DDL concorrente no MySQL ({attempt}/{attempts})...")
            time.sleep(delay)

app = create_app()
migrate = Migrate(app, db)

with app.app_context():
    # Import all models to ensure metadata registration and table auto-creation
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
    from app.models.evento import Espaco, Evento, EventoServico, ReservaEspaco, ReservaMaterial, EventoEquipa, HistoricoReservaMaterial
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
    from app.models.turno import Turno
    from app.models.armazem import Armazem, ProdutoStockArmazem, IngredienteStockArmazem, MaterialStockArmazem
    from app.models.empresa import Empresa

    # Recreate any missing tables (like movimentos_stock or movimentacoes_armazem)
    run_with_ddl_retry(db.create_all, "db.create_all")

    # Seed default shifts
    try:
        from datetime import time
        if db.session.query(Turno).count() == 0:
            shift_manha = Turno(nome="Manhã", hora_inicio=time(6, 0), hora_fim=time(14, 0))
            shift_tarde = Turno(nome="Tarde", hora_inicio=time(14, 0), hora_fim=time(22, 0))
            shift_noite = Turno(nome="Noite", hora_inicio=time(22, 0), hora_fim=time(6, 0))
            db.session.add_all([shift_manha, shift_tarde, shift_noite])
            db.session.commit()
            print("[OK] Seeded default shifts (Manha, Tarde, Noite).")
    except Exception as e:
        db.session.rollback()
        print("[WARN] Could not seed default shifts:", e)

    # Seed default payment methods
    try:
        if db.session.query(FormaPagamento).count() == 0:
            for m in ['Dinheiro', 'Transferência', 'POS', 'Mixto']:
                db.session.add(FormaPagamento(nome=m, ativo=True))
            db.session.commit()
            print("[OK] Seeded default payment methods.")
    except Exception as e:
        db.session.rollback()
        print("[WARN] Could not seed default payment methods:", e)

    # Safely alter the ENUM column for 'tipo' on 'produtos' table to ensure 'Consumivel' is supported
    try:
        db.session.execute(text("ALTER TABLE produtos MODIFY COLUMN tipo ENUM('ACABADO', 'REVENDA', 'CONSUMIVEL') NOT NULL;"))
        db.session.commit()
        print("[OK] Updated enum column 'tipo' on table 'produtos' successfully.")
    except Exception as e:
        db.session.rollback()
        print("[WARN] Could not update enum column 'tipo' on table 'produtos' (might not be MySQL or column already updated):", e)

    # Ensure columns taxa_iva_id and unidade_medida_id exist in 'produtos' table
    try:
        db.session.execute(text("ALTER TABLE produtos ADD COLUMN taxa_iva_id INT NULL;"))
        db.session.commit()
        print("[OK] Column 'taxa_iva_id' verified/added on table 'produtos'.")
    except Exception as e:
        db.session.rollback()
    
    try:
        db.session.execute(text("ALTER TABLE produtos ADD COLUMN unidade_medida_id INT NULL;"))
        db.session.commit()
        print("[OK] Column 'unidade_medida_id' verified/added on table 'produtos'.")
    except Exception as e:
        db.session.rollback()

    try:
        db.session.execute(text("ALTER TABLE produtos ADD COLUMN data_validade DATE NULL;"))
        db.session.commit()
        print("[OK] Column 'data_validade' verified/added on table 'produtos'.")
    except Exception as e:
        db.session.rollback()

    try:
        db.session.execute(text("ALTER TABLE materiais ADD COLUMN unidade_medida_id INT NULL;"))
        db.session.commit()
        print("[OK] Column 'unidade_medida_id' verified/added on table 'materiais'.")
    except Exception as e:
        db.session.rollback()

    # Ensure foreign key constraints exist on 'produtos' table
    try:
        db.session.execute(text("ALTER TABLE produtos ADD CONSTRAINT fk_produto_iva FOREIGN KEY (taxa_iva_id) REFERENCES taxas_iva(id);"))
        db.session.commit()
        print("[OK] Foreign key 'fk_produto_iva' verified/added on table 'produtos'.")
    except Exception as e:
        db.session.rollback()

    try:
        db.session.execute(text("ALTER TABLE produtos ADD CONSTRAINT fk_produto_unidade FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida(id);"))
        db.session.commit()
        print("[OK] Foreign key 'fk_produto_unidade' verified/added on table 'produtos'.")
    except Exception as e:
        db.session.rollback()

    try:
        db.session.execute(text("ALTER TABLE materiais ADD CONSTRAINT fk_material_unidade FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida(id);"))
        db.session.commit()
        print("[OK] Foreign key 'fk_material_unidade' verified/added on table 'materiais'.")
    except Exception as e:
        db.session.rollback()

    # Safely alter pagamentos and movimentos_caixa and caixas for new columns
    for table, col, col_type in [
        ('clientes', 'percentagem_desconto_padrao', 'DECIMAL(5,2) DEFAULT 0'),
        ('pedidos', 'evento_id', 'INT NULL'),
        ('eventos', 'pedido_id', 'INT NULL'),
        ('eventos', 'responsavel_id', 'INT NULL'),
        ('eventos', 'cronograma', 'JSON NULL'),
        ('eventos', 'checklist', 'JSON NULL'),
        ('eventos', 'equipamentos', 'JSON NULL'),
        ('vendas', 'evento_id', 'INT NULL'),
        ('reservas_espacos', 'valor', 'DECIMAL(12,2) DEFAULT 0'),
        ('reservas_materiais', 'valor_unitario', 'DECIMAL(12,2) DEFAULT 0'),
        ('reservas_materiais', 'subtotal', 'DECIMAL(12,2) DEFAULT 0'),
        ('pagamentos', 'codigo_transferencia', 'VARCHAR(100)'),
        ('pagamentos', 'emissor', 'VARCHAR(100)'),
        ('movimentos_caixa', 'codigo_transferencia', 'VARCHAR(100)'),
        ('movimentos_caixa', 'emissor', 'VARCHAR(100)'),
        ('movimentos_caixa', 'forma_pagamento', 'VARCHAR(100)'),
        ('caixas', 'valor_declarado_dinheiro', 'DECIMAL(12,2)'),
        ('caixas', 'valor_declarado_transferencia', 'DECIMAL(12,2)'),
        ('caixas', 'valor_declarado_pos', 'DECIMAL(12,2)'),
        ('caixas', 'valor_esperado_dinheiro', 'DECIMAL(12,2)'),
        ('caixas', 'valor_esperado_transferencia', 'DECIMAL(12,2)'),
        ('caixas', 'valor_esperado_pos', 'DECIMAL(12,2)'),
        ('caixas', 'diferenca_dinheiro', 'DECIMAL(12,2)'),
        ('caixas', 'diferenca_transferencia', 'DECIMAL(12,2)'),
        ('caixas', 'diferenca_pos', 'DECIMAL(12,2)'),
        ('caixas', 'explicacao_divergencia', 'TEXT'),
    ]:
        try:
            db.session.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_type} NULL;"))
            db.session.commit()
            print(f"[OK] Column '{col}' added to table '{table}'.")
        except Exception as e:
            db.session.rollback()

    # Safely alter movimentacoes_armazem enum columns to VARCHAR to prevent Data truncated errors
    try:
        db.session.execute(text("ALTER TABLE movimentacoes_armazem MODIFY COLUMN origem VARCHAR(50);"))
        db.session.execute(text("ALTER TABLE movimentacoes_armazem MODIFY COLUMN tipo VARCHAR(50);"))
        db.session.execute(text("ALTER TABLE movimentacoes_armazem MODIFY COLUMN entidade_tipo VARCHAR(50);"))
        db.session.commit()
        print("[OK] Updated columns in movimentacoes_armazem to VARCHAR(50).")
    except Exception as e:
        db.session.rollback()

    for sql in [
        "ALTER TABLE pedidos ADD CONSTRAINT fk_pedido_evento FOREIGN KEY (evento_id) REFERENCES eventos(id);",
        "ALTER TABLE eventos ADD CONSTRAINT fk_evento_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id);",
        "ALTER TABLE vendas ADD CONSTRAINT fk_venda_evento FOREIGN KEY (evento_id) REFERENCES eventos(id);",
    ]:
        try:
            db.session.execute(text(sql))
            db.session.commit()
        except Exception:
            db.session.rollback()

    for sql in [
        "ALTER TABLE pedidos MODIFY COLUMN estado ENUM('PENDENTE','AGENDADO','CONFIRMADO','EM PRODUCAO','PRONTO','ENTREGUE','CONCLUIDO','CANCELADO') DEFAULT 'PENDENTE';",
        "ALTER TABLE itens_pedido MODIFY COLUMN tipo_item ENUM('PRODUTO','PRODUTO ACABADO','PRODUTO DE REVENDA','SERVICO','ALUGUER','MATERIAL') NOT NULL;",
        "ALTER TABLE eventos MODIFY COLUMN estado ENUM('AGENDADO','CONFIRMADO','EM PREPARACAO','EM EXECUCAO','FINALIZADO','CONCLUIDO','CANCELADO') DEFAULT 'AGENDADO';",
        "ALTER TABLE materiais MODIFY COLUMN estado ENUM('DISPONIVEL','RESERVA','EM USO','DEVOLVIDO','DANIFICADO','MANUTENCAO','CANCELADO') DEFAULT 'DISPONIVEL';",
        "ALTER TABLE materiais ADD COLUMN ativo BOOLEAN DEFAULT TRUE;",
    ]:
        try:
            db.session.execute(text(sql))
            db.session.commit()
        except Exception:
            db.session.rollback()

if __name__ == '__main__':
    # Em ambiente de desenvolvimento
    socketio.run(app, host='0.0.0.0', port=8000, debug=True, allow_unsafe_werkzeug=True)

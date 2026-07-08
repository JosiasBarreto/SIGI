from app import create_app
from app.core.database import db
from sqlalchemy import text
import os

app = create_app()

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
    from app.models.turno import Turno
    from app.models.armazem import Armazem, ProdutoStockArmazem, IngredienteStockArmazem, MaterialStockArmazem

    # Recreate any missing tables (like movimentos_stock or movimentacoes_armazem)
    db.create_all()
    print("Tables verified/created successfully.")

    # Seed default shifts
    try:
        from datetime import time
        if db.session.query(Turno).count() == 0:
            shift_manha = Turno(nome="Manhã", hora_inicio=time(6, 0), hora_fim=time(14, 0))
            shift_tarde = Turno(nome="Tarde", hora_inicio=time(14, 0), hora_fim=time(22, 0))
            shift_noite = Turno(nome="Noite", hora_inicio=time(22, 0), hora_fim=time(6, 0))
            db.session.add_all([shift_manha, shift_tarde, shift_noite])
            db.session.commit()
            print("✓ Seeded default shifts (Manhã, Tarde, Noite).")
    except Exception as e:
        db.session.rollback()
        print("⚠ Could not seed default shifts:", e)

    # Safely alter the ENUM column for 'tipo' on 'produtos' table to ensure 'Consumivel' is supported
    try:
        db.session.execute(text("ALTER TABLE produtos MODIFY COLUMN tipo ENUM('Acabado', 'Revenda', 'Consumivel') NOT NULL;"))
        db.session.commit()
        print("✓ Updated enum column 'tipo' on table 'produtos' successfully.")
    except Exception as e:
        db.session.rollback()
        print("⚠ Could not update enum column 'tipo' on table 'produtos' (might not be MySQL or column already updated):", e)

    # Ensure columns taxa_iva_id and unidade_medida_id exist in 'produtos' table
    try:
        db.session.execute(text("ALTER TABLE produtos ADD COLUMN taxa_iva_id INT NULL;"))
        db.session.commit()
        print("✓ Column 'taxa_iva_id' verified/added on table 'produtos'.")
    except Exception as e:
        db.session.rollback()
    
    try:
        db.session.execute(text("ALTER TABLE produtos ADD COLUMN unidade_medida_id INT NULL;"))
        db.session.commit()
        print("✓ Column 'unidade_medida_id' verified/added on table 'produtos'.")
    except Exception as e:
        db.session.rollback()

    # Ensure foreign key constraints exist on 'produtos' table
    try:
        db.session.execute(text("ALTER TABLE produtos ADD CONSTRAINT fk_produto_iva FOREIGN KEY (taxa_iva_id) REFERENCES taxas_iva(id);"))
        db.session.commit()
        print("✓ Foreign key 'fk_produto_iva' verified/added on table 'produtos'.")
    except Exception as e:
        db.session.rollback()

    try:
        db.session.execute(text("ALTER TABLE produtos ADD CONSTRAINT fk_produto_unidade FOREIGN KEY (unidade_medida_id) REFERENCES unidades_medida(id);"))
        db.session.commit()
        print("✓ Foreign key 'fk_produto_unidade' verified/added on table 'produtos'.")
    except Exception as e:
        db.session.rollback()

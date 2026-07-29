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
    from app.models.empresa import Empresa

    # Recreate any missing tables (like movimentos_stock or movimentacoes_armazem)
    try:
        from apply_migration import run_migrations
        run_migrations()
    except Exception as _mig_err:
        print("[WARN] Migration warning:", _mig_err)

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
        ('eventos', 'cobrar_iva_servicos', 'BOOLEAN DEFAULT TRUE'),
        ('eventos', 'taxa_iva_servicos', 'DECIMAL(10,2) DEFAULT 15.0'),
        ('eventos', 'desconto_total', 'DECIMAL(10,2) DEFAULT 0.0'),
        ('eventos', 'valor_deslocacao', 'DECIMAL(10,2) DEFAULT 0.0'),
        ('eventos', 'outros_encargos', 'DECIMAL(10,2) DEFAULT 0.0'),
        ('eventos', 'numero_convidados_confirmados', 'INT NULL'),
        ('espacos', 'localizacao', 'VARCHAR(255) NULL'),
        ('requisicoes', 'evento_id', 'INT NULL'),
        ('eventos_servicos', 'deslocacao', 'DECIMAL(10,2) DEFAULT 0.0'),
        ('eventos_servicos', 'observacoes', 'TEXT NULL'),
        ('reservas_espacos', 'valor_aluguer', 'DECIMAL(10,2) DEFAULT 0.0'),
        ('reservas_materiais', 'valor_unitario', 'DECIMAL(12,2) DEFAULT 0'),
        ('reservas_materiais', 'subtotal', 'DECIMAL(12,2) DEFAULT 0'),
        ('espacos', 'preco_aluguer', 'DECIMAL(10,2) DEFAULT 0.0'),
        ('ordens_producao', 'responsavel_id', 'INT NULL'),
        ('eventos', 'cronograma', 'JSON NULL'),
        ('eventos', 'checklist', 'JSON NULL'),
        ('eventos', 'equipamentos', 'JSON NULL'),
        ('vendas', 'evento_id', 'INT NULL'),
        ('reservas_espacos', 'valor', 'DECIMAL(12,2) DEFAULT 0'),
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

    # Safely alter enum columns to VARCHAR to prevent Data truncated errors
    try:
        db.session.execute(text("ALTER TABLE movimentacoes_armazem MODIFY COLUMN origem VARCHAR(50);"))
        db.session.execute(text("ALTER TABLE movimentacoes_armazem MODIFY COLUMN tipo VARCHAR(50);"))
        db.session.execute(text("ALTER TABLE movimentacoes_armazem MODIFY COLUMN entidade_tipo VARCHAR(50);"))
        db.session.execute(text("ALTER TABLE pedidos MODIFY COLUMN estado VARCHAR(50);"))
        db.session.execute(text("ALTER TABLE ordens_producao MODIFY COLUMN estado VARCHAR(50);"))
        db.session.execute(text("ALTER TABLE eventos MODIFY COLUMN estado VARCHAR(50);"))
        db.session.commit()
        print("[OK] Updated enum columns to VARCHAR(50).")
    except Exception as e:
        db.session.rollback()
        db.session.rollback()

    for sql in [
        "ALTER TABLE vendas ADD COLUMN pedido_id INTEGER;",
        "ALTER TABLE eventos ADD COLUMN pedido_id INTEGER;",
        "ALTER TABLE requisicoes ADD COLUMN motivo TEXT;",
        "ALTER TABLE movimentacoes_armazem ADD COLUMN quantidade_antes NUMERIC(10,3) DEFAULT 0;",
        "ALTER TABLE movimentacoes_armazem ADD COLUMN quantidade_depois NUMERIC(10,3) DEFAULT 0;",
        "ALTER TABLE movimentacoes_armazem ADD COLUMN armazem_id INTEGER NULL;",
        "ALTER TABLE vendas MODIFY subtotal NUMERIC(12,2) NULL;",
        "ALTER TABLE vendas MODIFY desconto_total NUMERIC(12,2) NULL;",
        "ALTER TABLE vendas MODIFY base_tributavel NUMERIC(12,2) NULL;",
        "ALTER TABLE vendas MODIFY total_iva NUMERIC(12,2) NULL;",
        "ALTER TABLE vendas MODIFY total NUMERIC(12,2) NULL;",
        "ALTER TABLE vendas MODIFY valor_pago NUMERIC(12,2) NULL;",
        "ALTER TABLE vendas MODIFY saldo NUMERIC(12,2) NULL;",
        "ALTER TABLE eventos MODIFY valor_total NUMERIC(10,2) NULL;",
        "ALTER TABLE eventos MODIFY valor_pago NUMERIC(10,2) NULL;",
        "ALTER TABLE eventos MODIFY saldo NUMERIC(10,2) NULL;",
    ]:
        try:
            db.session.execute(text(sql))
            db.session.commit()
            print(f"[OK] Executed: {sql}")
        except Exception:
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
        "ALTER TABLE pedidos MODIFY COLUMN estado ENUM('PENDENTE','AGENDADO','CONFIRMADO','EM_PRODUCAO','PRONTO','ENTREGUE','CONCLUIDO','CANCELADO') DEFAULT 'PENDENTE';",
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

    # Seed Database Entities for Event Types, Services, Teams, Spaces, and Commercial Policy
    try:
        from app.models.evento import (
            TipoEventoCadastro, ServicoCadastro, EquipaCadastro, Espaco,
            PoliticaComercialEvento, PoliticaComercialRegra, TipoItemEvento, TipoCalculoPolitica
        )

        # 1. Tipos de Evento
        if db.session.query(TipoEventoCadastro).count() == 0:
            default_tipos = [
                'Casamento', 'Aniversario', 'Batizado', 'Empresarial', 
                'Catering', 'Formatura', 'Conferencia', 'Cocktail', 'Funeral'
            ]
            for t_nome in default_tipos:
                db.session.add(TipoEventoCadastro(nome=t_nome, descricao=f"Tipo de evento {t_nome}", ativo=True))
            db.session.commit()
            print("[SEED] Default Tipos de Evento cadastrados na BD com sucesso.")

        # 2. Serviços
        if db.session.query(ServicoCadastro).count() == 0:
            default_servicos = [
                ('Cozinha', 'Gastronomia', 150.0),
                ('Pastelaria', 'Gastronomia', 80.0),
                ('Bar & Bebidas', 'Bebidas', 100.0),
                ('Logistica & Transporte', 'Logistica', 50.0),
                ('Aluguer de Equipamentos', 'Equipamento', 75.0),
                ('Limpeza & Higienizacao', 'Operacional', 40.0),
                ('Seguranca', 'Operacional', 60.0),
                ('Decoracao & Ornamentacao', 'Decoracao', 120.0),
                ('Empregados de Mesa', 'Servico', 35.0),
                ('Bartenders', 'Servico', 45.0),
                ('Cozinheiros de Apoio', 'Servico', 50.0),
                ('Som & Iluminacao', 'Tecnico', 200.0)
            ]
            for idx, (s_nome, cat, pr) in enumerate(default_servicos, 1):
                db.session.add(ServicoCadastro(
                    codigo=f"SERV-{idx:03d}",
                    nome=s_nome,
                    categoria=cat,
                    descricao=f"Serviço especializado de {s_nome}",
                    preco_sugerido=pr,
                    ativo=True
                ))
            db.session.commit()
            print("[SEED] Default Serviços cadastrados na BD com sucesso.")

        # 3. Equipas / Mão de Obra
        if db.session.query(EquipaCadastro).count() == 0:
            default_equipas = [
                ('Chefe de Cozinha', 'Cozinha', 35.0, 70.0),
                ('Cozinheiro', 'Cozinha', 20.0, 45.0),
                ('Pasteleiro', 'Pastelaria', 20.0, 45.0),
                ('Empregado de Mesa', 'Atendimento', 15.0, 30.0),
                ('Bartender', 'Bar', 18.0, 35.0),
                ('Motorista / Logistica', 'Logistica', 15.0, 30.0),
                ('Supervisor de Evento', 'Gestao', 30.0, 60.0)
            ]
            for e_nome, dep, custo, preco in default_equipas:
                db.session.add(EquipaCadastro(
                    nome=e_nome,
                    departamento=dep,
                    descricao=f"Cargo de {e_nome} na equipa de {dep}",
                    custo_sugerido=custo,
                    preco_sugerido=preco,
                    ativo=True
                ))
            db.session.commit()
            print("[SEED] Default Equipas cadastradas na BD com sucesso.")

        # 4. Espaços
        if db.session.query(Espaco).count() == 0:
            default_espacos = [
                ('Salão Nobre Principal', 350, 'Piso 1', 'Salão climatizado com palco e pista', 500.0),
                ('Jardim de Eventos', 200, 'Exterior', 'Área verde para cerimónias e cocktails ao ar livre', 350.0),
                ('Área VIP Lounge', 80, 'Piso 2', 'Espaço reservado para pequenos eventos e recepções', 250.0),
                ('Sala de Conferências', 120, 'Bloco B', 'Aparelhagem audiovisual e projetores', 200.0)
            ]
            for esp_nome, cap, loc, desc, pr in default_espacos:
                db.session.add(Espaco(
                    nome=esp_nome,
                    capacidade=cap,
                    localizacao=loc,
                    descricao=desc,
                    preco_aluguer=pr,
                    estado='Ativo'
                ))
            db.session.commit()
            print("[SEED] Default Espaços cadastrados na BD com sucesso.")

        # 5. Política Comercial / Tabela de Preços Padrão
        if db.session.query(PoliticaComercialEvento).count() == 0:
            pol = PoliticaComercialEvento(
                codigo='POL-2026-001',
                nome='Tabela Comercial Padrão - Eventos',
                tipo_evento='Casamento',
                estado='Ativa',
                observacoes='Tabela de preços sugeridos por participante e fixo para casamentos e banquetes.'
            )
            db.session.add(pol)
            db.session.flush()

            s_cozinha = db.session.query(ServicoCadastro).filter_by(nome='Cozinha').first()
            s_bar = db.session.query(ServicoCadastro).filter_by(nome='Bar & Bebidas').first()
            esp_salao = db.session.query(Espaco).filter_by(nome='Salão Nobre Principal').first()
            eq_chefe = db.session.query(EquipaCadastro).filter_by(nome='Chefe de Cozinha').first()

            if s_cozinha:
                db.session.add(PoliticaComercialRegra(
                    politica_id=pol.id,
                    tipo_item=TipoItemEvento.SERVICO,
                    referencia_id=s_cozinha.id,
                    nome_item=s_cozinha.nome,
                    min_participantes=1,
                    max_participantes=500,
                    valor_sugerido=25.0,
                    tipo_calculo=TipoCalculoPolitica.POR_PARTICIPANTE,
                    mensagem_sugestao='Preço sugerido de refeição/cozinha por convidado para Casamentos.'
                ))

            if s_bar:
                db.session.add(PoliticaComercialRegra(
                    politica_id=pol.id,
                    tipo_item=TipoItemEvento.SERVICO,
                    referencia_id=s_bar.id,
                    nome_item=s_bar.nome,
                    min_participantes=1,
                    max_participantes=500,
                    valor_sugerido=12.0,
                    tipo_calculo=TipoCalculoPolitica.POR_PARTICIPANTE,
                    mensagem_sugestao='Open Bar e Bebidas por convidado.'
                ))

            if esp_salao:
                db.session.add(PoliticaComercialRegra(
                    politica_id=pol.id,
                    tipo_item=TipoItemEvento.ESPACO,
                    referencia_id=esp_salao.id,
                    nome_item=esp_salao.nome,
                    min_participantes=50,
                    max_participantes=350,
                    valor_sugerido=500.0,
                    tipo_calculo=TipoCalculoPolitica.FIXO,
                    mensagem_sugestao='Taxa fixa de aluguer do Salão Nobre Principal.'
                ))

            if eq_chefe:
                db.session.add(PoliticaComercialRegra(
                    politica_id=pol.id,
                    tipo_item=TipoItemEvento.MAO_DE_OBRA,
                    referencia_id=eq_chefe.id,
                    nome_item=eq_chefe.nome,
                    min_participantes=1,
                    max_participantes=500,
                    valor_sugerido=80.0,
                    tipo_calculo=TipoCalculoPolitica.FIXO,
                    mensagem_sugestao='Taxa fixa de chefia de cozinha por evento.'
                ))

            db.session.commit()
            print("[SEED] Tabela de Preço / Política Comercial Padrão inicializada com sucesso.")

    except Exception as e:
        db.session.rollback()
        print(f"[WARN] Erro ao executar seed de entidades de evento: {e}")

if __name__ == '__main__':
    # Em ambiente de desenvolvimento
    socketio.run(app, host='0.0.0.0', port=8000, debug=True, allow_unsafe_werkzeug=True)

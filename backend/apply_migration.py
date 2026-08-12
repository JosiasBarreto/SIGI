from app import create_app
from app.core.database import db
from sqlalchemy import text

def run_migrations():
    queries = [
        "ALTER TABLE receitas_producao ADD COLUMN IF NOT EXISTS custo_gas NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE receitas_producao ADD COLUMN IF NOT EXISTS custo_energia NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE receitas_producao ADD COLUMN IF NOT EXISTS custo_pessoal NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE receitas_producao ADD COLUMN IF NOT EXISTS custo_outros NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE receitas_producao ADD COLUMN IF NOT EXISTS setor VARCHAR(50) NOT NULL DEFAULT 'Cozinha';",
        "ALTER TABLE consumos_ingredientes MODIFY COLUMN ingrediente_id INTEGER NULL;",
        "ALTER TABLE consumos_ingredientes ADD COLUMN IF NOT EXISTS produto_consumivel_id INTEGER NULL;",
        # Remove ENUMs legados e normaliza grafias antigas antes de o ORM ler pedidos.
        "ALTER TABLE pedidos MODIFY COLUMN tipo VARCHAR(50) NOT NULL;",
        "ALTER TABLE pedidos MODIFY COLUMN origem VARCHAR(50) NOT NULL;",
        "ALTER TABLE pedidos MODIFY COLUMN estado VARCHAR(50) NULL;",
        "ALTER TABLE pedidos MODIFY COLUMN forma_pagamento VARCHAR(50) NULL;",
        "ALTER TABLE pedidos MODIFY COLUMN estado_pagamento VARCHAR(50) NULL;",
        "UPDATE pedidos SET tipo = CASE UPPER(tipo) WHEN 'SIMPLES' THEN 'Simples' WHEN 'COMPOSTO' THEN 'Composto' ELSE tipo END;",
        "UPDATE pedidos SET origem = CASE UPPER(origem) WHEN 'BALCAO' THEN 'Balcao' WHEN 'WHATSAPP' THEN 'Whatsapp' WHEN 'TELEFONE' THEN 'Telefone' WHEN 'EMAIL' THEN 'Email' ELSE origem END;",
        "UPDATE pedidos SET estado = CASE UPPER(estado) WHEN 'PENDENTE' THEN 'Pendente' WHEN 'AGENDADO' THEN 'Agendado' WHEN 'CONFIRMADO' THEN 'Confirmado' WHEN 'EM_PRODUCAO' THEN 'Em Producao' WHEN 'PRONTO' THEN 'Pronto' WHEN 'ENTREGUE' THEN 'Entregue' WHEN 'CONCLUIDO' THEN 'Concluido' WHEN 'CANCELADO' THEN 'Cancelado' ELSE estado END;",
        "UPDATE pedidos SET estado_pagamento = CASE UPPER(estado_pagamento) WHEN 'PENDENTE' THEN 'Pendente' WHEN 'PARCIAL' THEN 'Parcial' WHEN 'PAGO' THEN 'Pago' ELSE estado_pagamento END;",
        # Atualizar ENUM tipo_item na tabela itens_pedido para incluir 'Produto'
        "ALTER TABLE itens_pedido MODIFY COLUMN tipo_item ENUM('Produto', 'Produto Acabado', 'Produto Revenda', 'Servico', 'Aluguer') NOT NULL;",
        
        # Garantir todas as colunas de valor/desconto e totais na tabela itens_pedido
        "ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS total NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS desconto NUMERIC(10,2) DEFAULT 0;",
        "ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS taxa_iva_id INTEGER NULL;",
        "ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS taxa_iva NUMERIC(5,2) DEFAULT 0;",
        "ALTER TABLE itens_pedido ADD COLUMN IF NOT EXISTS valor_iva NUMERIC(10,2) DEFAULT 0;",
        
        # Garantir colunas em vendas e eventos
        "ALTER TABLE vendas ADD COLUMN IF NOT EXISTS pedido_id INTEGER NULL;",
        "ALTER TABLE eventos ADD COLUMN IF NOT EXISTS pedido_id INTEGER NULL;",
        
        # Garantir coluna de forma_pagamento em movimentos_caixa
        "ALTER TABLE movimentos_caixa ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(100) NULL;",
        
        # Garantir coluna servico na tabela produtos
        "ALTER TABLE produtos ADD COLUMN IF NOT EXISTS servico ENUM('ABASTECIMENTO', 'COZINHA', 'PASTELARIA', 'BAR') NULL;",
        
        # Atualizar registros existentes de produtos
        "UPDATE produtos SET servico = 'ABASTECIMENTO' WHERE tipo IN ('Consumivel', 'CONSUMIVEL');",
        "UPDATE produtos SET servico = 'BAR' WHERE tipo IN ('Revenda', 'REVENDA');",
    ]
    
    print("[MIGRATION] Iniciando verificação e aplicação de colunas no BD...")
    for q in queries:
        try:
            db.session.execute(text(q))
            db.session.commit()
            print(f"  ✅ Executado: {q}")
        except Exception as e:
            db.session.rollback()
            # Tentar sintaxe sem 'IF NOT EXISTS' (caso versão do MySQL exija)
            if "IF NOT EXISTS" in q:
                try:
                    q_clean = q.replace(" IF NOT EXISTS", "")
                    db.session.execute(text(q_clean))
                    db.session.commit()
                    print(f"  ✅ Executado (sem IF NOT EXISTS): {q_clean}")
                except Exception as e2:
                    db.session.rollback()
                    # Coluna já existe ou outro motivo benigno
                    pass

if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        run_migrations()
        db.create_all()
        print("Migration e db.create_all concluidos!")

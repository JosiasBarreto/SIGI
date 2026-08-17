from app import create_app
from app.core.database import db
from sqlalchemy import text

def run_migrations():
    queries = [
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

        # Criar tabela de proformas se não existir
        """CREATE TABLE IF NOT EXISTS proformas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            numero_documento VARCHAR(50) NOT NULL UNIQUE,
            cliente_id INT NULL,
            pedido_id INT NULL,
            origem VARCHAR(20) NOT NULL DEFAULT 'POS',
            subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            desconto_total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            total_iva DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            estado VARCHAR(20) NOT NULL DEFAULT 'Emitida',
            observacoes TEXT NULL,
            criado_por INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by INT NULL,
            updated_by INT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            deleted_at TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",

        # Criar tabela de proforma_itens se não existir
        """CREATE TABLE IF NOT EXISTS proforma_itens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            proforma_id INT NOT NULL,
            item_tipo VARCHAR(50) NOT NULL DEFAULT 'Produto',
            item_id INT NULL,
            descricao VARCHAR(255) NOT NULL,
            quantidade DECIMAL(10,2) NOT NULL DEFAULT 1.00,
            preco_unitario DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            desconto DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            taxa_iva DECIMAL(5,2) NOT NULL DEFAULT 0.00,
            valor_iva DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            total DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by INT NULL,
            updated_by INT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            deleted_at TIMESTAMP NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;""",
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
        print("🎉 Migration e db.create_all() concluídos!")

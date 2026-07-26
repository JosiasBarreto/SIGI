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

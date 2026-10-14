from app import create_app
from app.core.database import db
from sqlalchemy import text
from app.models.pedido import Pedido
from app.models.item_pedido import ItemPedido

app = create_app()

def run_migration():
    with app.app_context():
        queries = [
            "ALTER TABLE pedidos ADD COLUMN subtotal NUMERIC(10,2) DEFAULT 0;",
            "ALTER TABLE pedidos ADD COLUMN desconto_total NUMERIC(10,2) DEFAULT 0;",
            "ALTER TABLE pedidos ADD COLUMN base_tributavel NUMERIC(10,2) DEFAULT 0;",
            "ALTER TABLE pedidos ADD COLUMN total_iva NUMERIC(10,2) DEFAULT 0;",
            "ALTER TABLE itens_pedido ADD COLUMN desconto NUMERIC(10,2) DEFAULT 0;",
            "ALTER TABLE itens_pedido ADD COLUMN taxa_iva_id INT;",
            "ALTER TABLE itens_pedido ADD COLUMN taxa_iva NUMERIC(5,2) DEFAULT 0;",
            "ALTER TABLE itens_pedido ADD COLUMN valor_iva NUMERIC(10,2) DEFAULT 0;",
            "ALTER TABLE itens_pedido ADD COLUMN total NUMERIC(10,2) DEFAULT 0;"
        ]
        for query in queries:
            try:
                db.session.execute(text(query))
            except Exception as e:
                print(f"Ignorado erro em '{query}': {e}")
        
        # Opcional: Atualizar os registos existentes para que `total` = `subtotal` e `base_tributavel` = `subtotal`
        try:
            db.session.execute(text("UPDATE pedidos SET subtotal = valor_total, base_tributavel = valor_total, total_iva = 0 WHERE subtotal = 0 OR subtotal IS NULL;"))
            db.session.execute(text("UPDATE itens_pedido SET total = subtotal, valor_iva = 0 WHERE total = 0 OR total IS NULL;"))
        except Exception as e:
            print(f"Erro ao atualizar registos antigos: {e}")
        
        db.session.commit()
        print("Migração concluída com sucesso! Os campos de IVA foram adicionados à tabela pedidos e itens_pedido.")

if __name__ == '__main__':
    run_migration()

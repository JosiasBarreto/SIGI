from app import create_app
from app.core.database import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    queries = [
        "ALTER TABLE movimentacoes_armazem MODIFY COLUMN origem VARCHAR(50);",
        "ALTER TABLE movimentacoes_armazem MODIFY COLUMN tipo VARCHAR(50);",
        "ALTER TABLE movimentacoes_armazem MODIFY COLUMN entidade_tipo VARCHAR(50);"
    ]
    for q in queries:
        try:
            db.session.execute(text(q))
            db.session.commit()
            print(f"Sucesso: {q}")
        except Exception as e:
            db.session.rollback()
            print(f"Erro: {q} -> {e}")

from app import create_app
from app.core.database import db
from sqlalchemy import text
import traceback

app = create_app()
with app.app_context():
    queries = [
        "ALTER TABLE movimentacoes_armazem MODIFY COLUMN origem VARCHAR(50);",
        "ALTER TABLE movimentacoes_armazem MODIFY COLUMN tipo VARCHAR(50);",
        "ALTER TABLE movimentacoes_armazem MODIFY COLUMN entidade_tipo VARCHAR(50);",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS event_id VARCHAR(64) NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS event_type VARCHAR(64) NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS entity_type VARCHAR(64) NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS entity_id INT NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS aggregate_id VARCHAR(128) NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS actor_user_id INT NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS recipient_user_id INT NULL;",
        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS recipient_role VARCHAR(50) NULL;"
    ]
    for q in queries:
        try:
            db.session.execute(text(q))
            db.session.commit()
            print(f"Sucesso: {q}")
        except Exception as e:
            db.session.rollback()
            if "IF NOT EXISTS" in q:
                try:
                    q_clean = q.replace(" IF NOT EXISTS", "")
                    db.session.execute(text(q_clean))
                    db.session.commit()
                    print(f"Sucesso (compat): {q_clean}")
                except Exception as e2:
                    db.session.rollback()
                    print(f"Erro: {q} -> {e2}")
            else:
                print(f"Erro: {q} -> {e}")

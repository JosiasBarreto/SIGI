from app import create_app
from app.core.database import db
from sqlalchemy import text

app = create_app()
with app.app_context():
    res = db.session.execute(text("SHOW CREATE TABLE movimentacoes_armazem;")).fetchall()
    for row in res:
        print(row)

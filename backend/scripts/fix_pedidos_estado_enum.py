from sqlalchemy import text

from app import create_app
from app.core.database import db


SQL = """
ALTER TABLE pedidos
MODIFY COLUMN estado ENUM(
    'PENDENTE',
    'AGENDADO',
    'CONFIRMADO',
    'EM_PRODUCAO',
    'PRONTO',
    'ENTREGUE',
    'CONCLUIDO',
    'CANCELADO'
) DEFAULT 'PENDENTE'
"""


app = create_app()

with app.app_context():
    db.session.execute(text(SQL))
    db.session.commit()
    print("pedidos.estado enum atualizado")

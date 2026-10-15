from app.core.database import db
from app.models.cliente import Cliente

DEFAULT_CLIENT_NAME = 'Consumidor Final'
DEFAULT_CLIENT_NIF = '999999999'


def get_or_create_consumidor_final():
    cliente = Cliente.query.filter(
        db.func.lower(Cliente.nome) == DEFAULT_CLIENT_NAME.lower()
    ).order_by(Cliente.id.asc()).first()
    if cliente:
        return cliente

    cliente = Cliente(nome=DEFAULT_CLIENT_NAME, nif=DEFAULT_CLIENT_NIF)
    db.session.add(cliente)
    db.session.flush()
    return cliente
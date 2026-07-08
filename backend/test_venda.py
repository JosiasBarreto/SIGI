from app import create_app
from app.core.database import db
from app.services.comercial_service import ComercialService
from app.models.caixa import Caixa
import time

app = create_app()
with app.app_context():
    # create a mock caixa if not exists
    if not Caixa.query.first():
        db.session.add(Caixa(valor_inicial=100, estado='Aberto'))
        db.session.commit()
    elif Caixa.query.filter_by(estado='Aberto').count() == 0:
        c = Caixa.query.first()
        c.estado = 'Aberto'
        db.session.commit()

    cs = ComercialService()
    payload = {
        "tipo_documento": "FR",
        "observacoes": "Teste",
        "itens": [],
        "pagamentos": [
            {"forma_pagamento_id": 1, "valor": 990}
        ]
    }
    try:
        venda = cs.create_venda(payload, 1)
        print("Success:", venda.id)
    except Exception as e:
        print("Error:", e)

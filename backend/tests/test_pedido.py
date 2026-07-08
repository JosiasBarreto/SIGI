import pytest
from app import create_app
from app.core.database import db
from app.models.user import User, RoleEnum
from app.models.produto import Produto, TipoProduto
from werkzeug.security import generate_password_hash, check_password_hash

@pytest.fixture
def test_app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "mysql+pymysql://root:rootpassword@127.0.0.1:3306/sigi_erp_test",
        "WTF_CSRF_ENABLED": False
    })

    with app.app_context():
        db.create_all()
        user = User(
            name="Admin Atendimento",
            email="atendimento@test.com",
            password_hash=generate_password_hash("password"),
            role=RoleEnum.ADMINISTRADOR
        )
        # Create valid product
        p = Produto(nome="Bolo", tipo=TipoProduto.ACABADO, preco_venda=10.0)
        # Create ingredient (invalid product for pedido)
        # Wait, the rule checks TipoProduto so we just make an ingredient and test if it fails
        db.session.add(user)
        db.session.add(p)
        db.session.commit()
        yield app
        db.drop_all()

@pytest.fixture
def client(test_app):
    return test_app.test_client()

@pytest.fixture
def token(client):
    res = client.post('/api/v1/auth/login', json={"email": "atendimento@test.com", "password": "password"})
    return res.get_json()["access_token"]

def test_create_cliente(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post('/api/v1/pedidos/clientes', headers=headers, json={"nome": "João", "nif": "999"})
    assert res.status_code == 201

def test_create_pedido_success(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post('/api/v1/pedidos', headers=headers, json={
        "tipo": "Simples",
        "origem": "Balcao",
        "data_entrega": "2026-10-10",
        "itens": [
            {
                "tipo_item": "Produto Acabado",
                "produto_id": 1,
                "quantidade": 2,
                "preco_unitario": 10.0
            }
        ]
    })
    
    assert res.status_code == 201
    data = res.get_json()
    assert "numero" in data
    assert float(data["valor_total"]) == 20.0

def test_create_pedido_fail_ingredient(client, test_app, token):
    with test_app.app_context():
        from app.models.ingrediente import Ingrediente
        i = Ingrediente(nome="Farinha", unidade_medida="kg")
        db.session.add(i)
        db.session.commit()
        
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post('/api/v1/pedidos', headers=headers, json={
        "tipo": "Simples",
        "origem": "Balcao",
        "itens": [
            {
                "tipo_item": "Servico",
                "produto_id": 2, # Note: this doesn't exist in Produto table since it's in ingrediente
                "quantidade": 1,
                "preco_unitario": 5.0
            }
        ]
    })
    assert res.status_code == 400

def test_cancel_pedido_no_justificativa(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post('/api/v1/pedidos', headers=headers, json={
        "tipo": "Simples",
        "origem": "Balcao",
        "itens": [
            {
                "tipo_item": "Produto Acabado",
                "produto_id": 1,
                "quantidade": 2,
                "preco_unitario": 10.0
            }
        ]
    })
    p_id = res.get_json()["id"]
    
    # Try cancel without message
    res_cancel = client.put(f'/api/v1/pedidos/{p_id}/estado', headers=headers, json={
        "estado": "Cancelado"
    })
    assert res_cancel.status_code == 400

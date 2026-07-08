import pytest
from app import create_app
from app.core.database import db
from app.models.user import User, RoleEnum
from app.models.fornecedor import Fornecedor
from app.models.ingrediente import Ingrediente
from app.models.produto import Produto, TipoProduto
from app.models.material import Material, TipoMaterial, EstadoMaterial
from app.models.movimento_stock import MovimentoStock, TipoMovimento, OrigemMovimento, EntidadeMovimento
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
            name="Admin Armazem",
            email="armazem@test.com",
            password_hash=generate_password_hash("password"),
            role=RoleEnum.ADMINISTRADOR
        )
        db.session.add(user)
        db.session.commit()
        yield app
        db.drop_all()

@pytest.fixture
def client(test_app):
    return test_app.test_client()

@pytest.fixture
def token(client):
    res = client.post('/api/v1/auth/login', json={"email": "armazem@test.com", "password": "password"})
    return res.get_json()["access_token"]

def test_create_fornecedor(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post('/api/v1/armazem/fornecedores', headers=headers, json={
        "nome": "Fornecedor Teste",
        "nif": "123456789"
    })
    assert res.status_code == 201
    data = res.get_json()
    assert data["nome"] == "Fornecedor Teste"

def test_create_ingrediente(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post('/api/v1/armazem/ingredientes', headers=headers, json={
        "nome": "Farinha",
        "unidade_medida": "Kg"
    })
    assert res.status_code == 201

def test_movimento_stock(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Criar ingrediente primeiro
    res = client.post('/api/v1/armazem/ingredientes', headers=headers, json={
        "nome": "Ovos",
        "unidade_medida": "Dz"
    })
    ing_id = res.get_json()["id"]
    
    # Mover stock
    res_mov = client.post('/api/v1/armazem/movimentacoes', headers=headers, json={
        "tipo": "Entrada",
        "origem": "Compra",
        "entidade_tipo": "Ingrediente",
        "referencia_id": ing_id,
        "quantidade": 10.5
    })
    
    assert res_mov.status_code == 201
    
    # Verificar getredientes -> stock incrementado
    res_get = client.get('/api/v1/armazem/ingredientes', headers=headers)
    items = res_get.get_json()["items"]
    ovos = next(item for item in items if item["id"] == ing_id)
    assert float(ovos["stock_atual"]) == 10.5

def test_movimento_stock_negativo_restrito(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post('/api/v1/armazem/ingredientes', headers=headers, json={
        "nome": "Arroz",
        "unidade_medida": "Kg"
    })
    ing_id = res.get_json()["id"]
    
    # Saida sem stock -> deve falhar
    res_mov = client.post('/api/v1/armazem/movimentacoes', headers=headers, json={
        "tipo": "Saida",
        "origem": "Armazem",
        "entidade_tipo": "Ingrediente",
        "referencia_id": ing_id,
        "quantidade": 5.0
    })
    
    assert res_mov.status_code == 400

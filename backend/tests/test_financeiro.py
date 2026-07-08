import pytest
from app import create_app
from app.core.database import db
from app.models.user import User, RoleEnum
from app.models.financeiro import ContaReceber, Receita
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
        user1 = User(
            name="Admin Financeiro",
            email="fin@test.com",
            password_hash=generate_password_hash("password"),
            role=RoleEnum.ADMINISTRADOR
        )
        from app.models.cliente import Cliente
        c = Cliente(id=1, nome="Teste", nif="111")
        db.session.add(user1)
        db.session.add(c)
        db.session.commit()
        yield app
        db.drop_all()

@pytest.fixture
def client(test_app):
    return test_app.test_client()

@pytest.fixture
def token(client):
    res = client.post('/api/v1/auth/login', json={"email": "fin@test.com", "password": "password"})
    return res.get_json()["access_token"]

def test_abrir_e_fechar_caixa(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res_abrir = client.post('/api/v1/financeiro/caixas/abrir', headers=headers, json={"valor_inicial": 100})
    assert res_abrir.status_code == 201
    caixa_id = res_abrir.get_json()["id"]
    
    # Tenta abrir outro
    res_abrir2 = client.post('/api/v1/financeiro/caixas/abrir', headers=headers, json={"valor_inicial": 50})
    assert res_abrir2.status_code == 400
    
    # Fecha o caixa
    res_fechar = client.put(f'/api/v1/financeiro/caixas/{caixa_id}/fechar', headers=headers)
    assert res_fechar.status_code == 200

def test_movimentos_caixa(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res_abrir = client.post('/api/v1/financeiro/caixas/abrir', headers=headers, json={"valor_inicial": 100})
    caixa_id = res_abrir.get_json()["id"]

    res_mov = client.post(f'/api/v1/financeiro/caixas/{caixa_id}/movimentos', headers=headers, json={
        "tipo": "Venda",
        "valor": 50,
        "descricao": "Venda Dinheiro"
    })
    assert res_mov.status_code == 201
    
    # Fechar e testar movimento em caixa fechado
    client.put(f'/api/v1/financeiro/caixas/{caixa_id}/fechar', headers=headers)
    
    res_mov2 = client.post(f'/api/v1/financeiro/caixas/{caixa_id}/movimentos', headers=headers, json={
        "tipo": "Venda",
        "valor": 50,
        "descricao": "Venda Dinheiro"
    })
    assert res_mov2.status_code == 400

def test_contas_receber(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post('/api/v1/financeiro/contas-receber', headers=headers, json={
        "cliente_id": 1,
        "valor_original": 1000,
        "vencimento": "2026-12-31"
    })
    assert res.status_code == 201
    conta_id = res.get_json()["id"]
    
    res_pag = client.post(f'/api/v1/financeiro/contas-receber/{conta_id}/receber', headers=headers, json={"valor": 500})
    assert res_pag.status_code == 200
    assert float(res_pag.get_json()["saldo"]) == 500

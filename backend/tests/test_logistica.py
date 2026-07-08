import pytest
from app import create_app
from app.core.database import db
from app.models.user import User, RoleEnum
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
            name="Admin Logistica",
            email="logistica@test.com",
            password_hash=generate_password_hash("password"),
            role=RoleEnum.ADMINISTRADOR
        )
        db.session.add(user1)
        db.session.commit()
        yield app
        db.drop_all()

@pytest.fixture
def client(test_app):
    return test_app.test_client()

@pytest.fixture
def token(client):
    res = client.post('/api/v1/auth/login', json={"email": "logistica@test.com", "password": "password"})
    return res.get_json()["access_token"]

def test_criar_motorista_e_viatura(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res1 = client.post('/api/v1/logistica/motoristas', headers=headers, json={"nome": "Carlos Silva"})
    assert res1.status_code == 201
    
    res2 = client.post('/api/v1/logistica/viaturas', headers=headers, json={"matricula": "AA-00-BB"})
    assert res2.status_code == 201

def test_criar_entrega_e_ocorrencia(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    # Preparar dados
    client.post('/api/v1/logistica/motoristas', headers=headers, json={"nome": "Motorista"})
    client.post('/api/v1/logistica/viaturas', headers=headers, json={"matricula": "XX-11-ZZ"})
    
    res_ent = client.post('/api/v1/logistica/entregas', headers=headers, json={
        "motorista_id": 1,
        "viatura_id": 1,
        "checklists": [
            {"tipo": "SAIDA", "item": "Verificar pneus"}
        ]
    })
    assert res_ent.status_code == 201
    ent_id = res_ent.get_json()["id"]
    
    # Ocorrência
    res_oc = client.post(f'/api/v1/logistica/entregas/{ent_id}/ocorrencia', headers=headers, json={
        "tipo": "Atraso",
        "justificacao": "Transito intenso"
    })
    assert res_oc.status_code == 201

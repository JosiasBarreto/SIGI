import pytest
from app import create_app
from app.core.database import db
from app.models.user import User, RoleEnum
from app.models.evento import Evento, Espaco
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
            name="Admin Evento",
            email="evento@test.com",
            password_hash=generate_password_hash("password"),
            role=RoleEnum.ADMINISTRADOR
        )
        # We need a client for Eventos
        from app.models.cliente import Cliente
        c = Cliente(id=1, nome="Joao Silva", nif="123456789")
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
    res = client.post('/api/v1/auth/login', json={"email": "evento@test.com", "password": "password"})
    return res.get_json()["access_token"]

def test_criar_espaco(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post('/api/v1/eventos/espacos', headers=headers, json={"nome": "Salão VIP", "capacidade": 50})
    assert res.status_code == 201

def test_criar_evento_com_conflito(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    # Criar espaço
    res_esp = client.post('/api/v1/eventos/espacos', headers=headers, json={"nome": "Tenda Eventos", "capacidade": 200})
    espaco_id = res_esp.get_json()["id"]
    
    # Criar Primeiro Evento
    data1 = {
        "cliente_id": 1,
        "tipo_evento": "Casamento",
        "titulo": "Casamento do João",
        "data_evento": "2026-10-10",
        "hora_inicio": "10:00",
        "hora_fim": "18:00",
        "numero_convidados": 150,
        "reservas_espaco": [
            {
                "espaco_id": espaco_id,
                "data_inicio": "2026-10-10T10:00:00",
                "data_fim": "2026-10-10T18:00:00"
            }
        ]
    }
    res1 = client.post('/api/v1/eventos', headers=headers, json=data1)
    assert res1.status_code == 201
    
    # Criar Segundo Evento (Conflito no mesmo espaço)
    data2 = {
        "cliente_id": 1,
        "tipo_evento": "Aniversario",
        "titulo": "Festa da Maria",
        "data_evento": "2026-10-10",
        "hora_inicio": "12:00",
        "hora_fim": "16:00",
        "numero_convidados": 50,
        "reservas_espaco": [
            {
                "espaco_id": espaco_id,
                "data_inicio": "2026-10-10T12:00:00",
                "data_fim": "2026-10-10T16:00:00"
            }
        ]
    }
    res2 = client.post('/api/v1/eventos', headers=headers, json=data2)
    assert res2.status_code == 400
    assert "Conflito" in res2.get_json()["msg"]

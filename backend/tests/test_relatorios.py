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
            name="Admin Relatorios",
            email="rel@test.com",
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
    res = client.post('/api/v1/auth/login', json={"email": "rel@test.com", "password": "password"})
    return res.get_json()["access_token"]

def test_dashboard(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get('/api/v1/relatorios/dashboard', headers=headers)
    assert res.status_code == 200
    assert "kpis" in res.get_json()["data"]

def test_exportar(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get('/api/v1/relatorios/exportar/vendas?formato=pdf', headers=headers)
    assert res.status_code == 200
    assert res.headers['Content-Type'] == 'application/pdf'

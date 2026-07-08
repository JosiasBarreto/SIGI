import pytest
from app import create_app
from app.core.database import db

@pytest.fixture
def app():
    app = create_app()
    app.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "mysql+pymysql://root:rootpassword@127.0.0.1:3306/sigi_erp_test"
    })
    
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_health_endpoint(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json == {"status": "healthy"}

def test_version_endpoint(client):
    response = client.get('/api/version')
    assert response.status_code == 200
    assert "version" in response.json

def test_auth_login_fail(client):
    response = client.post('/api/v1/auth/login', json={"email": "wrong@test.com", "password": "wrong"})
    assert response.status_code == 401

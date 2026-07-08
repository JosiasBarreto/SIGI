import pytest
from app import create_app
from app.core.database import db
from app.models.user import User, RoleEnum
from werkzeug.security import generate_password_hash, check_password_hash
import json

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
        # Create a test user
        user = User(
            name="Test Admin",
            email="admin@test.com",
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

def test_login_success(client):
    response = client.post('/api/v1/auth/login', json={
        "email": "admin@test.com",
        "password": "password"
    })
    data = json.loads(response.data)
    assert response.status_code == 200
    assert "access_token" in data
    assert "refresh_token" in data

def test_login_failure(client):
    response = client.post('/api/v1/auth/login', json={
        "email": "admin@test.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    
def test_logout(client):
    # First login to get a token
    login_response = client.post('/api/v1/auth/login', json={
        "email": "admin@test.com",
        "password": "password"
    })
    token = json.loads(login_response.data)["access_token"]
    
    # Then logout
    response = client.post('/api/v1/auth/logout', headers={
        "Authorization": f"Bearer {token}"
    })
    assert response.status_code == 200
    
    # Trying to use the blacklisted token should fail
    response_after = client.post('/api/v1/auth/change-password', headers={
        "Authorization": f"Bearer {token}"
    }, json={"old_password": "x", "new_password": "y"})
    assert response_after.status_code == 401

import pytest
from app import create_app
from app.core.database import db
from app.models.user import User, RoleEnum
from app.models.material import Material, TipoMaterial
from app.models.ingrediente import Ingrediente
from app.models.requisicao import EstadoRequisicao, OcorrenciaMaterial
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
        user1 = User(
            name="Admin Req",
            email="req@test.com",
            password_hash=generate_password_hash("password"),
            role=RoleEnum.ADMINISTRADOR
        )
        db.session.add(user1)
        
        # Injects mock ingredients and materials
        mat = Material(id=1, nome="Cadeira", tipo=TipoMaterial.REUTILIZAVEL, quantidade_total=10, quantidade_disponivel=10)
        ing = Ingrediente(id=1, nome="Arroz", unidade_medida="kg", stock_atual=50)
        db.session.add(mat)
        db.session.add(ing)
        db.session.commit()
        yield app
        db.drop_all()

@pytest.fixture
def client(test_app):
    return test_app.test_client()

@pytest.fixture
def token(client):
    res = client.post('/api/v1/auth/login', json={"email": "req@test.com", "password": "password"})
    return res.get_json()["access_token"]

def test_fluxo_requisicao(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Criação
    res_criar = client.post('/api/v1/requisicoes', headers=headers, json={
        "tipo": "Inicial",
        "sector": "Cozinha",
        "itens": [
            {
                "tipo_item": "Ingrediente",
                "item_id": 1,
                "quantidade_solicitada": 5
            },
            {
                "tipo_item": "Material",
                "item_id": 1,
                "quantidade_solicitada": 4
            }
        ]
    })
    assert res_criar.status_code == 201
    req_id = res_criar.get_json()["id"]
    
    # 2. Aprovação
    res_aprov = client.put(f'/api/v1/requisicoes/{req_id}/aprovar', headers=headers, json={
        "itens": [
            {"item_id": 1, "quantidade_aprovada": 5}, # Ignorando qual é ingr. qual é material no teste simples
            {"item_id": 1, "quantidade_aprovada": 4}
        ]
    })
    assert res_aprov.status_code == 200
    assert res_aprov.get_json()["estado"] == EstadoRequisicao.APROVADA.value
    
    # 3. Entrega
    res_entr = client.put(f'/api/v1/requisicoes/{req_id}/entregar', headers=headers, json={
        "observacao": "Tudo certo"
    })
    assert res_entr.status_code == 200
    assert res_entr.get_json()["estado"] == EstadoRequisicao.EM_USO.value
    
    # 4. Devolução
    res_dev = client.post(f'/api/v1/requisicoes/{req_id}/devolver', headers=headers, json=[
        {
            "material_id": 1,
            "quantidade_devolvida": 3,
            "quantidade_danificada": 1, # Danificou 1 cadeira
            "justificacao": "Quebrou perna"
        }
    ])
    assert res_dev.status_code == 200
    
    data_dev = res_dev.get_json()
    assert data_dev["estado"] == EstadoRequisicao.DEVOLVIDA.value

    # Verificando as ocorrencias
    res_oc = client.get(f'/api/v1/requisicoes/ocorrencias', headers=headers)
    assert res_oc.status_code == 200
    oco = res_oc.get_json()["items"]
    assert len(oco) == 1
    assert oco[0]["quantidade"] == '1.000'
    assert oco[0]["tipo"] == "Danificado"
    
    # 5. Encerrar
    res_enc = client.put(f'/api/v1/requisicoes/{req_id}/encerrar', headers=headers)
    assert res_enc.status_code == 200
    assert res_enc.get_json()["estado"] == EstadoRequisicao.ENCERRADA.value

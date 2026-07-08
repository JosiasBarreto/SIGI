import pytest
from app import create_app
from app.core.database import db
from app.models.user import User, RoleEnum
from app.models.produto import Produto, TipoProduto
from app.models.ingrediente import Ingrediente
from app.models.pedido import Pedido, TipoPedido, OrigemPedido, EstadoPedido
from app.models.item_pedido import ItemPedido, TipoItem
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta

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
            name="Admin Producao",
            email="producao@test.com",
            password_hash=generate_password_hash("password"),
            role=RoleEnum.ADMINISTRADOR
        )
        p = Produto(id=1, nome="Bolo Chocolate", tipo=TipoProduto.ACABADO, preco_venda=20.0)
        i = Ingrediente(id=1, nome="Farinha", unidade_medida="kg", stock_atual=10.0)
        
        db.session.add(user)
        db.session.add(p)
        db.session.add(i)
        db.session.commit()
        
        # Pedido para testes
        pedido = Pedido(id=1, numero="PED123", tipo=TipoPedido.SIMPLES, origem=OrigemPedido.BALCAO, estado=EstadoPedido.AGENDADO)
        item = ItemPedido(pedido_id=1, tipo_item=TipoItem.PRODUTO_ACABADO, produto_id=1, quantidade=1, preco_unitario=20, subtotal=20)
        db.session.add(pedido)
        db.session.add(item)
        db.session.commit()
        
        yield app
        db.drop_all()

@pytest.fixture
def client(test_app):
    return test_app.test_client()

@pytest.fixture
def token(client):
    res = client.post('/api/v1/auth/login', json={"email": "producao@test.com", "password": "password"})
    return res.get_json()["access_token"]

def test_create_ficha_tecnica(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = client.post('/api/v1/producao/fichas', headers=headers, json={
        "nome": "Ficha Bolo Chocolate",
        "tipo": "Pastelaria",
        "produto_acabado_id": 1,
        "itens": [
            {
                "ingrediente_id": 1,
                "quantidade": 0.5,
                "unidade": "kg"
            }
        ]
    })
    
    assert res.status_code == 201

def test_auto_generate_ordem_and_consume(client, token, test_app):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Criar a ficha primeiro
    client.post('/api/v1/producao/fichas', headers=headers, json={
        "nome": "Ficha Bolo",
        "tipo": "Pastelaria",
        "produto_acabado_id": 1,
        "itens": [
            {
                "ingrediente_id": 1,
                "quantidade": 0.5,
                "unidade": "kg"
            }
        ]
    })
    
    # Mover estado do pedido para CONFIRMADO -> deve gerar OP
    res_pedido = client.put('/api/v1/pedidos/1/estado', headers=headers, json={
        "estado": "Confirmado"
    })
    assert res_pedido.status_code == 200
    
    # Verificar ordens
    res_ordens = client.get('/api/v1/producao/ordens', headers=headers)
    assert res_ordens.status_code == 200
    items = res_ordens.get_json()["items"]
    assert len(items) == 1
    ordem_id = items[0]["id"]
    
    # Marcar ordem pronta -> consumir ingrediente
    res_pronto = client.put(f'/api/v1/producao/ordens/{ordem_id}/estado', headers=headers, json={
        "estado": "Pronto"
    })
    assert res_pronto.status_code == 200
    
    # Validar stock ingrediente (10 inicial - 0.5 consumido) -> 9.5
    with test_app.app_context():
        ing = db.session.query(Ingrediente).filter_by(id=1).first()
        assert float(ing.stock_atual) == 9.5

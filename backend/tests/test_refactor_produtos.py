import pytest
from app import create_app
from app.core.database import db
from app.models.produto import Produto, TipoProduto
from app.models.stock_movement import StockMovement, TipoMovimentoStock
from app.models.receita import ReceitaProducao, ReceitaItem
from app.services.armazem_service import armazem_service
from app.services.receita_service import receita_service
from app.models.unidade_medida import UnidadeMedida
from app.models.categoria_produto import CategoriaProduto
from app.models.user import User

@pytest.fixture
def app_context():
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.app_context():
        db.create_all()
        # Create user
        user = User(username="test", password_hash="test", role="Administrador")
        db.session.add(user)
        
        # Create cat and un
        cat = CategoriaProduto(nome="Cat Test")
        un = UnidadeMedida(nome="Quilo", sigla="KG")
        db.session.add_all([cat, un])
        db.session.commit()
        yield {"app": app, "user": user, "cat": cat, "un": un}
        db.session.remove()
        db.drop_all()

def test_geracao_automatica_codigo(app_context):
    cat = app_context['cat']
    un = app_context['un']
    user = app_context['user']
    
    # Consumivel
    prod1, err = armazem_service.create_produto({
        "nome": "Farinha",
        "tipo": "Consumivel",
        "categoria_id": cat.id,
        "unidade_medida_id": un.id,
        "preco_compra": 1.5,
        "stock_minimo": 10
    }, user.id)
    assert prod1.codigo == "ING000001"
    
    # Acabado
    prod2, err = armazem_service.create_produto({
        "nome": "Bolo",
        "tipo": "Acabado",
        "categoria_id": cat.id,
        "unidade_medida_id": un.id,
        "preco_venda": 15.0,
        "tempo_producao": 60
    }, user.id)
    assert prod2.codigo == "PAC000001"

def test_validacoes_por_tipo(app_context):
    cat = app_context['cat']
    un = app_context['un']
    user = app_context['user']
    
    # Missing preco_compra for Consumivel
    prod, err = armazem_service.create_produto({
        "nome": "Farinha",
        "tipo": "Consumivel",
        "categoria_id": cat.id,
        "unidade_medida_id": un.id,
        "stock_minimo": 10
    }, user.id)
    assert "Campos obrigatórios para Consumível" in err

def test_movimentacoes_stock(app_context):
    cat = app_context['cat']
    un = app_context['un']
    user = app_context['user']
    
    prod1, _ = armazem_service.create_produto({
        "nome": "Farinha",
        "tipo": "Consumivel",
        "categoria_id": cat.id,
        "unidade_medida_id": un.id,
        "preco_compra": 1.5,
        "stock_minimo": 10
    }, user.id)
    
    assert prod1.stock_atual == 0
    
    armazem_service.entrada_stock(prod1.id, {"quantidade": 50, "preco_compra": 2.0}, user.id)
    
    db.session.refresh(prod1)
    assert prod1.stock_atual == 50
    assert prod1.preco_compra == 2.0
    
    movs = StockMovement.query.filter_by(produto_id=prod1.id).all()
    assert len(movs) == 1
    assert movs[0].tipo_movimento == TipoMovimentoStock.ENTRADA

def test_criacao_receitas_e_calculo(app_context):
    cat = app_context['cat']
    un = app_context['un']
    user = app_context['user']
    
    ingrediente, _ = armazem_service.create_produto({
        "nome": "Farinha",
        "tipo": "Consumivel",
        "categoria_id": cat.id,
        "unidade_medida_id": un.id,
        "preco_compra": 2.0,
        "stock_minimo": 10
    }, user.id)
    
    acabado, _ = armazem_service.create_produto({
        "nome": "Bolo",
        "tipo": "Acabado",
        "categoria_id": cat.id,
        "unidade_medida_id": un.id,
        "preco_venda": 10.0,
        "tempo_producao": 60
    }, user.id)
    
    receita, err = receita_service.create_receita({
        "produto_acabado_id": acabado.id,
        "itens": [
            {"produto_consumivel_id": ingrediente.id, "quantidade": 2} # 2 units * 2.0 cost = 4.0
        ]
    }, user.id)
    
    assert err is None
    assert receita.custo_total == 4.0
    assert receita.custo_unitario == 4.0
    assert receita.margem_lucro == 6.0
    
    # Change cost
    armazem_service.entrada_stock(ingrediente.id, {"quantidade": 10, "preco_compra": 3.0}, user.id)
    
    db.session.refresh(receita)
    assert receita.custo_total == 6.0
    assert receita.custo_unitario == 6.0
    assert receita.margem_lucro == 4.0

def test_ativacao_desativacao(app_context):
    cat = app_context['cat']
    un = app_context['un']
    user = app_context['user']
    
    ingrediente, _ = armazem_service.create_produto({
        "nome": "Farinha",
        "tipo": "Consumivel",
        "categoria_id": cat.id,
        "unidade_medida_id": un.id,
        "preco_compra": 2.0,
        "stock_minimo": 10
    }, user.id)
    
    armazem_service.deactivate_produto(ingrediente.id, user.id)
    db.session.refresh(ingrediente)
    assert ingrediente.ativo == False
    
    armazem_service.activate_produto(ingrediente.id, user.id)
    db.session.refresh(ingrediente)
    assert ingrediente.ativo == True

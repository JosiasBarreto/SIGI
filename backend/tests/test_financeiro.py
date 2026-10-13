import pytest
from app import create_app
from app.core.database import db
from app.models.user import User, RoleEnum
from app.models.financeiro import ContaReceber, Receita
from werkzeug.security import generate_password_hash, check_password_hash

class FinanceiroTestConfig:
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = "test-secret"
    JWT_SECRET_KEY = "test-jwt-secret"
    SOCKETIO_CORS_ALLOWED_ORIGINS = "*"
    SOCKETIO_MESSAGE_QUEUE = None
    SKIP_DATABASE_INITIALIZATION = True

@pytest.fixture
def test_app():
    app = create_app(FinanceiroTestConfig)

    with app.app_context():
        db.create_all()
        user1 = User(
            name="Admin Financeiro",
            email="fin@test.com",
            password_hash=generate_password_hash("password"),
            role=RoleEnum.ADMINISTRADOR
        )
        user2 = User(
            name="Outro Operador",
            email="outro-fin@test.com",
            password_hash=generate_password_hash("password"),
            role=RoleEnum.ATENDIMENTO
        )
        from app.models.cliente import Cliente
        c = Cliente(id=1, nome="Teste", nif="111")
        db.session.add(user1)
        db.session.add(user2)
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

@pytest.fixture
def token_outro_operador(client):
    res = client.post('/api/v1/auth/login', json={"email": "outro-fin@test.com", "password": "password"})
    return res.get_json()["access_token"]

def test_abrir_e_fechar_caixa(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res_abrir = client.post('/api/v1/financeiro/caixas/abrir', headers=headers, json={"valor_inicial": 100})
    assert res_abrir.status_code == 201
    abertura = res_abrir.get_json()
    assert abertura["success"] is True
    caixa_id = abertura["sessao"]["id"]

    # A fresh frontend load must recover the same persisted session.
    res_sessao = client.get('/api/v1/financeiro/caixas/minha-sessao', headers=headers)
    assert res_sessao.status_code == 200
    assert res_sessao.get_json()["aberta"] is True
    assert res_sessao.get_json()["sessao"]["id"] == caixa_id
    
    # Tenta abrir outro
    res_abrir2 = client.post('/api/v1/financeiro/caixas/abrir', headers=headers, json={"valor_inicial": 50})
    assert res_abrir2.status_code == 409
    
    # Fecha o caixa
    res_fechar = client.put(f'/api/v1/financeiro/caixas/{caixa_id}/fechar', headers=headers)
    assert res_fechar.status_code == 200
    assert res_fechar.get_json()["aberta"] is False

    res_sem_sessao = client.get('/api/v1/financeiro/caixas/minha-sessao', headers=headers)
    assert res_sem_sessao.status_code == 200
    assert res_sem_sessao.get_json()["aberta"] is False
    assert res_sem_sessao.get_json()["sessao"] is None

def test_movimentos_caixa(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res_abrir = client.post('/api/v1/financeiro/caixas/abrir', headers=headers, json={"valor_inicial": 100})
    caixa_id = res_abrir.get_json()["sessao"]["id"]

    res_mov = client.post(f'/api/v1/financeiro/caixas/{caixa_id}/movimentos', headers=headers, json={
        "tipo": "Venda",
        "valor": 50,
        "descricao": "Venda Dinheiro",
        "forma_pagamento": "Dinheiro"
    })
    assert res_mov.status_code == 201
    
    # Fechar e testar movimento em caixa fechado
    client.put(f'/api/v1/financeiro/caixas/{caixa_id}/fechar', headers=headers)
    
    res_mov2 = client.post(f'/api/v1/financeiro/caixas/{caixa_id}/movimentos', headers=headers, json={
        "tipo": "Venda",
        "valor": 50,
        "descricao": "Venda Dinheiro",
        "forma_pagamento": "Dinheiro"
    })
    assert res_mov2.status_code == 400

def test_venda_pos_com_pagamento_na_caixa(client, token, test_app):
    """Uma FR direta deve liquidar o pagamento sem exigir que a venda seja de evento."""
    headers = {"Authorization": f"Bearer {token}"}
    with test_app.app_context():
        from app.models.financeiro import FormaPagamento
        db.session.add(FormaPagamento(nome="Dinheiro"))
        db.session.commit()

    abertura = client.post('/api/v1/financeiro/caixas/abrir', headers=headers, json={"valor_inicial": 100})
    assert abertura.status_code == 201

    venda = client.post('/api/v1/vendas', headers=headers, json={
        "tipo_documento": "FR",
        "observacoes": "Venda direta via POS",
        "itens": [{
            "item_tipo": "Produto",
            "descricao": "Produto de teste",
            "quantidade": 1,
            "preco_unitario": 20,
            "desconto": 0,
        }],
        "pagamentos": [{"forma_pagamento_id": 1, "valor": 20}],
    })

    assert venda.status_code == 201
    corpo = venda.get_json()
    assert corpo["estado"] == "Pago"
    assert float(corpo["saldo"]) == 0

def test_outro_operador_nao_pode_movimentar_ou_fechar(client, token, token_outro_operador):
    headers_proprietario = {"Authorization": f"Bearer {token}"}
    headers_outro = {"Authorization": f"Bearer {token_outro_operador}"}
    abertura = client.post('/api/v1/financeiro/caixas/abrir', headers=headers_proprietario, json={"valor_inicial": 100})
    caixa_id = abertura.get_json()["sessao"]["id"]

    movimento = client.post(f'/api/v1/financeiro/caixas/{caixa_id}/movimentos', headers=headers_outro, json={
        "caixa_id": caixa_id,
        "tipo": "Sangria",
        "valor": 10,
        "descricao": "Tentativa indevida"
    })
    assert movimento.status_code == 400
    assert movimento.get_json()["success"] is False

    fecho = client.put(f'/api/v1/financeiro/caixas/{caixa_id}/fechar', headers=headers_outro)
    assert fecho.status_code == 400
    assert fecho.get_json()["success"] is False

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


def test_pagamento_recusa_venda_cancelada_liquidada_e_excesso(test_app):
    """A proteção financeira deve existir no serviço, não apenas na UI."""
    from app.models.financeiro import FormaPagamento
    from app.models.comercial import EstadoVenda
    from app.models.caixa import MovimentoCaixa
    from app.services.comercial_service import ComercialService
    from app.services.financeiro_service import FinanceiroService

    with test_app.app_context():
        forma = FormaPagamento(nome="Dinheiro")
        db.session.add(forma)
        db.session.commit()
        caixa, erro = FinanceiroService().abrir_caixa(0, 1)
        assert erro is None

        service = ComercialService()
        venda = service.create_venda({
            "tipo_documento": "FT",
            "itens": [{"descricao": "Serviço", "quantidade": 1, "preco_unitario": 10}],
        }, 1)

        with pytest.raises(ValueError, match="superior ao saldo"):
            service.add_pagamento(venda.id, {"valor": 11, "forma_pagamento_id": forma.id}, 1)
        db.session.rollback()
        assert MovimentoCaixa.query.filter_by(caixa_id=caixa.id).count() == 1  # abertura apenas

        pagamento = service.add_pagamento(venda.id, {"valor": 10, "forma_pagamento_id": forma.id}, 1)
        assert float(pagamento.valor) == 10
        assert venda.estado == EstadoVenda.PAGO
        assert float(venda.saldo) == 0
        with pytest.raises(ValueError, match="totalmente liquidada"):
            service.add_pagamento(venda.id, {"valor": 1, "forma_pagamento_id": forma.id}, 1)
        db.session.rollback()

        cancelada = service.create_venda({
            "tipo_documento": "FT",
            "itens": [{"descricao": "Outro serviço", "quantidade": 1, "preco_unitario": 5}],
        }, 1)
        cancelada.estado = EstadoVenda.CANCELADO
        db.session.commit()
        with pytest.raises(ValueError, match="cancelada"):
            service.add_pagamento(cancelada.id, {"valor": 5, "forma_pagamento_id": forma.id}, 1)


def test_venda_do_pedido_guarda_snapshot_fiscal(test_app):
    """Editar o pedido posteriormente não pode alterar valores já faturados."""
    from app.models.pedido import Pedido, TipoPedido, OrigemPedido
    from app.services.comercial_service import ComercialService

    with test_app.app_context():
        pedido = Pedido(
            numero="PED-SNAPSHOT-1", tipo=TipoPedido.SIMPLES.value,
            origem=OrigemPedido.BALCAO.value, valor_total=10, saldo=10,
        )
        db.session.add(pedido)
        db.session.commit()
        venda = ComercialService().create_venda({
            "tipo_documento": "FT", "pedido_id": pedido.id,
            "itens": [{"descricao": "Preço acordado", "quantidade": 1, "preco_unitario": 10}],
        }, 1)
        assert float(venda.total) == 10

        pedido.valor_total = 999
        db.session.commit()
        db.session.expire(venda)
        assert float(venda.total) == 10


def test_evento_parcial_emite_ft_e_reutiliza_documento(test_app):
    """Entrada de evento deve gerar FT e não duplicar a fatura ao liquidar."""
    from datetime import date, time
    from app.models.caixa import MovimentoCaixa
    from app.models.comercial import Venda, TipoDocumento, EstadoVenda
    from app.models.evento import Evento, EventoItem
    from app.models.financeiro import FormaPagamento
    from app.services.comercial_service import ComercialService
    from app.services.financeiro_service import FinanceiroService

    with test_app.app_context():
        forma = FormaPagamento(nome="Numerário")
        db.session.add(forma)
        evento = Evento(
            numero="EVT-TESTE-PARCIAL", cliente_id=1, tipo_evento="Festa",
            titulo="Evento de teste", data_evento=date.today(),
            hora_inicio=time(10), hora_fim=time(12), numero_convidados=1,
            estado="Confirmado",
        )
        evento.itens.append(EventoItem(
            tipo_item="Servico", descricao="Serviço do evento", quantidade=1,
            preco_unitario=100, subtotal=100, taxa_iva=15, valor_iva=15, total=115,
        ))
        db.session.add(evento)
        db.session.commit()
        caixa, erro = FinanceiroService().abrir_caixa(0, 1)
        assert erro is None

        service = ComercialService()
        venda, erro = service.converter_evento_em_venda(evento.id, {
            "tipo_documento": "FT",
            "pagamento": {"valor": 50, "forma_pagamento_id": forma.id},
        }, 1)
        assert erro is None
        assert venda.tipo_documento == TipoDocumento.FT
        assert float(venda.total) == 115
        assert float(venda.valor_pago) == 50
        assert float(venda.saldo) == 65
        assert float(evento.valor_pago) == 50

        mesma_venda, erro = service.converter_evento_em_venda(evento.id, {
            "tipo_documento": "FT",
            "pagamento": {"valor": 65, "forma_pagamento_id": forma.id},
        }, 1)
        assert erro is None
        assert mesma_venda.id == venda.id
        assert Venda.query.filter_by(evento_id=evento.id).count() == 1
        assert mesma_venda.estado == EstadoVenda.PAGO
        assert float(evento.valor_pago) == 115
        assert MovimentoCaixa.query.filter_by(caixa_id=caixa.id).count() == 3


def test_evento_nao_duplica_itens_no_pedido_tecnico(test_app):
    """O pedido operacional de um evento não é uma segunda venda."""
    from datetime import date, time
    from app.models.evento import Evento, EventoItem
    from app.models.item_pedido import ItemPedido
    from app.models.pedido import Pedido, TipoPedido, OrigemPedido

    with test_app.app_context():
        pedido = Pedido(
            numero="PED-EVT-NAO-DUPLICAR", tipo=TipoPedido.SIMPLES.value,
            origem=OrigemPedido.BALCAO.value, valor_total=100, saldo=100,
        )
        pedido.itens.append(ItemPedido(
            tipo_item="Produto", descricao="Produto do evento", quantidade=1,
            preco_unitario=100, desconto=0, taxa_iva=0, valor_iva=0,
            subtotal=100, total=100,
        ))
        db.session.add(pedido)
        db.session.flush()
        evento = Evento(
            numero="EVT-NAO-DUPLICAR", cliente_id=1, pedido_id=pedido.id,
            tipo_evento="Festa", titulo="Evento com pedido técnico",
            data_evento=date.today(), hora_inicio=time(10), hora_fim=time(12),
            numero_convidados=1,
        )
        evento.itens.append(EventoItem(
            tipo_item="Produto", descricao="Produto do evento", quantidade=1,
            preco_unitario=100, subtotal=100, taxa_iva=15, valor_iva=15, total=115,
        ))
        db.session.add(evento)
        db.session.commit()

        resumo = evento.calcular_resumo_financeiro()
        assert resumo["subtotal_produtos"] == 100
        assert resumo["total_iva_produtos"] == 0
        assert resumo["total_geral"] == 100

import pytest
from app import create_app
from app.core.database import db
from datetime import datetime

from app.models.user import User, RoleEnum
from app.models.produto import Produto, TipoProduto
from app.models.cliente import Cliente
from app.models.pedido import Pedido, TipoPedido, EstadoPedido, OrigemPedido
from app.models.ordem_producao import OrdemProducao, EstadoProducao, SectorProducao, PrioridadeProducao
from app.models.requisicao import Requisicao, EstadoRequisicao, SectorRequisicao, TipoRequisicao
from app.models.logistica import Entrega, Motorista, Viatura, EstadoEntrega
from app.models.financeiro import Pagamento, ContaReceber
from app.models.auditoria import Auditoria

@pytest.fixture
def test_app():
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

def test_business_flow_end_to_end(test_app):
    with test_app.app_context():
        # Setup: Cliente, Produto
        cliente = Cliente(nome="E2E Client", nif="888888888")
        db.session.add(cliente)
        produto = Produto(nome="Produto E2E", preco_venda=100.0, tipo=TipoProduto.ACABADO)
        db.session.add(produto)
        db.session.commit()

        # 1. Atendimento cria pedido
        pedido = Pedido(
            numero="PED-E2E-1", 
            cliente_id=cliente.id, 
            tipo=TipoPedido.COMPOSTO, 
            origem=OrigemPedido.BALCAO, 
            estado=EstadoPedido.CONFIRMADO,
            valor_total=100.0
        )
        db.session.add(pedido)
        db.session.commit()
        
        # 2. Ordem de produção é gerada
        op = OrdemProducao(
            numero="OP-E2E-1", 
            pedido_id=pedido.id, 
            produto_id=produto.id, 
            sector=SectorProducao.PASTELARIA, 
            prioridade=PrioridadeProducao.ALTA, 
            estado=EstadoProducao.EM_PRODUCAO, 
            quantidade=1
        )
        db.session.add(op)
        db.session.commit()
        
        # 3. Requisição é criada
        req = Requisicao(
            numero="REQ-E2E-1",
            ordem_producao_id=op.id,
            sector_requisitante=SectorRequisicao.PASTELARIA,
            tipo_requisicao=TipoRequisicao.CONSUMO,
            estado=EstadoRequisicao.EM_USO
        )
        db.session.add(req)
        db.session.commit()

        # 4. Produção conclui
        op.estado = EstadoProducao.PRONTO
        pedido.estado = EstadoPedido.CONCLUIDO
        db.session.commit()

        # 5. Entrega
        motorista = Motorista(nome="Motorista E2E")
        viatura = Viatura(matricula="E2E-00-11")
        db.session.add(motorista)
        db.session.add(viatura)
        db.session.commit()

        entrega = Entrega(
            pedido_id=pedido.id,
            motorista_id=motorista.id,
            viatura_id=viatura.id,
            estado=EstadoEntrega.ENTREGUE
        )
        db.session.add(entrega)
        db.session.commit()

        # 6. Financeiro recebe pagamento
        conta = ContaReceber(cliente_id=cliente.id, valor=100.0, pedido_id=pedido.id)
        db.session.add(conta)
        db.session.commit()

        pagamento = Pagamento(conta_receber_id=conta.id, valor=100.0, responsavel_id=1)
        db.session.add(pagamento)
        db.session.commit()

        # 7. Verificações
        assert pedido.estado == EstadoPedido.CONCLUIDO
        assert op.estado == EstadoProducao.PRONTO
        assert req.estado == EstadoRequisicao.EM_USO
        assert entrega.estado == EstadoEntrega.ENTREGUE
        assert pagamento.valor == 100.0

import sys
from os.path import abspath, dirname
import datetime
from decimal import Decimal

sys.path.insert(0, dirname(dirname(abspath(__file__))))

from app import create_app
from app.core.database import db
from werkzeug.security import generate_password_hash, check_password_hash

from app.models.user import User, RoleEnum
from app.models.cliente import Cliente
from app.models.fornecedor import Fornecedor
from app.models.material import Material, TipoMaterial, EstadoMaterial
from app.models.produto import Produto, TipoProduto
from app.models.ingrediente import Ingrediente
from app.models.pedido import Pedido, TipoPedido, OrigemPedido, EstadoPedido, FormaPagamento, EstadoPagamento
from app.models.item_pedido import ItemPedido, TipoItem
from app.models.ficha_tecnica import FichaTecnica, TipoFicha, FichaTecnicaItem
from app.models.ordem_producao import OrdemProducao, SectorProducao, PrioridadeProducao, EstadoProducao, ConsumoIngrediente
from app.models.requisicao import Requisicao, TipoRequisicao, SectorRequisicao, EstadoRequisicao, RequisicaoItem, TipoItemRequisicao
from app.models.evento import Evento, TipoEvento, EstadoEvento, TipoServicoEvento, Espaco, ReservaEspaco
from app.models.logistica import Motorista, Viatura, Entrega, EstadoMotorista, EstadoViatura, EstadoEntrega
from app.models.financeiro import Pagamento, ContaReceber, ContaPagar, Receita, Despesa
from app.models.auditoria import Auditoria

app = create_app()

def clear_db():
    print("🧹 Limpando dados existentes...")
    meta = db.metadata
    for table in reversed(meta.sorted_tables):
        db.session.execute(table.delete())
    db.session.commit()

def seed_data():
    with app.app_context():
        # Descomente para limpar tudo antes de popular:
        # clear_db()
        
        print("🌱 Iniciando o processo de seeding...")

        # 1. Utilizadores (RBAC Roles)
        users_data = [
            ("admin@sigi.com", "Admin Sigi", RoleEnum.ADMINISTRADOR),
            ("atendimento@sigi.com", "João Atendimento", RoleEnum.ATENDIMENTO),
            ("cozinha@sigi.com", "Maria Cozinha", RoleEnum.COZINHA),
            ("pastelaria@sigi.com", "Chef Carlos", RoleEnum.PASTELARIA),
            ("armazem@sigi.com", "Jose Armazem", RoleEnum.ARMAZEM),
            ("controlador@sigi.com", "Ana Controlador", RoleEnum.CONTROLADOR_MATERIAIS),
            ("motorista@sigi.com", "Rui Motorista", RoleEnum.MOTORISTA),
            ("financeiro@sigi.com", "Sofia Financeiro", RoleEnum.FINANCEIRO),
        ]
        
        users_map = {}
        for email, name, role in users_data:
            user = User.query.filter_by(email=email).first()
            if not user:
                user = User(
                    name=name,
                    email=email,
                    password_hash=generate_password_hash("password"),
                    role=role,
                    is_active=True
                )
                db.session.add(user)
                db.session.flush() # get IDs early
            users_map[role.name] = user.id

        admin_id = users_map.get("ADMINISTRADOR", 1)
        
        # 2. Fornecedores
        f1 = Fornecedor.query.filter_by(nif="500123456").first()
        if not f1:
            f1 = Fornecedor(nome="Distribuidora Nacional", nif="500123456", email="contato@dn.pt", telefone="210000000", tipo_entidade="Fornecedor")
            db.session.add(f1)
            db.session.flush()

        # 3. Ingredientes
        ingr1 = Ingrediente.query.filter_by(codigo="ING001").first()
        if not ingr1:
            ingr1 = Ingrediente(codigo="ING001", nome="Farinha de Trigo", categoria="Secos", unidade_medida="Kg", stock_atual=150, preco_compra=0.80, fornecedor_id=f1.id)
            db.session.add(ingr1)
            
        ingr2 = Ingrediente.query.filter_by(codigo="ING002").first()
        if not ingr2:
            ingr2 = Ingrediente(codigo="ING002", nome="Açúcar Refinado", categoria="Secos", unidade_medida="Kg", stock_atual=100, preco_compra=1.10, fornecedor_id=f1.id)
            db.session.add(ingr2)
            
        ingr3 = Ingrediente.query.filter_by(codigo="ING003").first()
        if not ingr3:
            ingr3 = Ingrediente(codigo="ING003", nome="Chocolate em Pó 50%", categoria="Secos", unidade_medida="Kg", stock_atual=50, preco_compra=5.00, fornecedor_id=f1.id)
            db.session.add(ingr3)
            
        db.session.flush()

        # 4. Materiais (Reutilizáveis e Consumíveis)
        mat1 = Material.query.filter_by(codigo="MAT001").first()
        if not mat1:
            mat1 = Material(codigo="MAT001", nome="Bandeja de Prata", categoria="Mobiliário", tipo=TipoMaterial.REUTILIZAVEL, quantidade_total=20, quantidade_disponivel=15, estado=EstadoMaterial.DISPONIVEL)
            db.session.add(mat1)
            
        mat2 = Material.query.filter_by(codigo="MAT002").first()
        if not mat2:
            mat2 = Material(codigo="MAT002", nome="Guardanapos Papel", categoria="Consumíveis", tipo=TipoMaterial.CONSUMIVEL, quantidade_total=5000, quantidade_disponivel=5000, estado=EstadoMaterial.DISPONIVEL)
            db.session.add(mat2)
            
        db.session.flush()

        # 5. Produtos (Acabados e Revenda)
        prod1 = Produto.query.filter_by(codigo="PRD001").first()
        if not prod1:
            prod1 = Produto(codigo="PRD001", nome="Bolo de Chocolate Decorado", tipo=TipoProduto.ACABADO, categoria="Pastelaria", preco_venda=25.00, tempo_producao=120)
            db.session.add(prod1)

        prod2 = Produto.query.filter_by(codigo="PRD002").first()
        if not prod2:
            prod2 = Produto(codigo="PRD002", nome="Coca-Cola 1L", tipo=TipoProduto.REVENDA, categoria="Bebidas", preco_venda=2.50, stock_atual=100)
            db.session.add(prod2)
            
        db.session.flush()

        # Ficha Tecnica do Bolo de Chocolate
        ft = FichaTecnica.query.filter_by(produto_id=prod1.id).first()
        if not ft:
            ft = FichaTecnica(nome_ficha="Ficha Bolo Chocolate", produto_id=prod1.id, tipo_ficha=TipoFicha.PRODUCAO, rendimento=1, tempo_preparacao=120, valido_desde=datetime.date.today())
            db.session.add(ft)
            db.session.flush()
            
            db.session.add(FichaTecnicaItem(ficha_id=ft.id, ingrediente_id=ingr1.id, quantidade=0.500, quebra=0))
            db.session.add(FichaTecnicaItem(ficha_id=ft.id, ingrediente_id=ingr2.id, quantidade=0.300, quebra=0))
            db.session.add(FichaTecnicaItem(ficha_id=ft.id, ingrediente_id=ingr3.id, quantidade=0.150, quebra=0))

        # 6. Clientes
        cl1 = Cliente.query.filter_by(nif="200000001").first()
        if not cl1:
            cl1 = Cliente(nome="Maria Silva", nif="200000001", email="maria@exemplo.pt", telefone="912345678", morada="Rua 1, Lisboa")
            db.session.add(cl1)

        cl2 = Cliente.query.filter_by(nif="200000002").first()
        if not cl2:
            cl2 = Cliente(nome="Empresa ABC", nif="200000002", email="contato@abc.pt", telefone="913333333", morada="Rua 2, Porto")
            db.session.add(cl2)
            
        db.session.flush()

        # 7. Pedidos (Agendado, Confirmado, Concluído)
        hoje = datetime.date.today()
        agora = datetime.datetime.now().time()
        
        # Pedido Simples (Revenda, Estado: CONCLUIDO)
        p1 = Pedido.query.filter_by(numero="PED-0001").first()
        if not p1:
            p1 = Pedido(numero="PED-0001", cliente_id=cl1.id, tipo=TipoPedido.SIMPLES, origem=OrigemPedido.BALCAO, estado=EstadoPedido.CONCLUIDO, valor_total=5.00, valor_pago=5.00, estado_pagamento=EstadoPagamento.PAGO, forma_pagamento=FormaPagamento.DINHEIRO, data_entrega=hoje)
            db.session.add(p1)
            db.session.flush()
            db.session.add(ItemPedido(pedido_id=p1.id, tipo_item=TipoItem.PRODUTO, referencia_id=prod2.id, quantidade=2, valor_unitario=2.50, subtotal=5.00))

        # Pedido Composto / Produção (Bolo, Estado: CONFIRMADO)
        p2 = Pedido.query.filter_by(numero="PED-0002").first()
        if not p2:
            p2 = Pedido(numero="PED-0002", cliente_id=cl2.id, tipo=TipoPedido.COMPOSTO, origem=OrigemPedido.WHATSAPP, estado=EstadoPedido.CONFIRMADO, valor_total=25.00, valor_pago=10.00, estado_pagamento=EstadoPagamento.PARCIAL, forma_pagamento=FormaPagamento.TRANSFERENCIA, data_entrega=hoje + datetime.timedelta(days=2))
            db.session.add(p2)
            db.session.flush()
            
            item_bolo = ItemPedido(pedido_id=p2.id, tipo_item=TipoItem.PRODUTO, referencia_id=prod1.id, quantidade=1, valor_unitario=25.00, subtotal=25.00)
            db.session.add(item_bolo)
            db.session.flush()
            
            # Ordem de Produção gerada do Pedido
            op = OrdemProducao(numero="OP-0001", data_prevista=hoje + datetime.timedelta(days=1), sector=SectorProducao.PASTELARIA, prioridade=PrioridadeProducao.MEDIA, estado=EstadoProducao.EM_ANDAMENTO, produto_id=prod1.id, pedido_id=p2.id, quantidade=1)
            db.session.add(op)
            db.session.flush()

            # Requisição de material para essa ordem
            req = Requisicao(numero="REQ-0001", data_requisicao=datetime.datetime.utcnow(), sector_requisitante=SectorRequisicao.PASTELARIA, tipo_requisicao=TipoRequisicao.CONSUMO, estado=EstadoRequisicao.APROVADA, ordem_producao_id=op.id)
            db.session.add(req)
            db.session.flush()
            
            db.session.add(RequisicaoItem(requisicao_id=req.id, tipo_item=TipoItemRequisicao.INGREDIENTE, item_id=ingr1.id, quantidade_solicitada=0.5, quantidade_entregue=0.5))

        # 8. Eventos e Logs de Logística
        espaco = Espaco.query.filter_by(nome="Sala Principal").first()
        if not espaco:
            espaco = Espaco(nome="Sala Principal", capacidade=100)
            db.session.add(espaco)
            db.session.flush()

        evt1 = Evento.query.filter_by(nome="Casamento Silva").first()
        if not evt1:
            evt1 = Evento(nome="Casamento Silva", cliente_id=cl1.id, tipo=TipoEvento.CASAMENTO, data_evento=datetime.datetime.now() + datetime.timedelta(days=10), estado=EstadoEvento.EM_PREPARACAO, numero_convidados=50)
            db.session.add(evt1)
            db.session.flush()

        # Logística (Viatura, Motorista, Entrega)
        mot = Motorista.query.filter_by(nome="Rui Motorista").first()
        if not mot:
            mot = Motorista(nome="Rui Motorista", carta_conducao="PT12345", estado=EstadoMotorista.DISPONIVEL)
            db.session.add(mot)

        via = Viatura.query.filter_by(matricula="11-AA-22").first()
        if not via:
            via = Viatura(matricula="11-AA-22", marca="Ford", modelo="Transit", estado=EstadoViatura.OPERACIONAL)
            db.session.add(via)
            db.session.flush()

        ent = Entrega.query.filter_by(pedido_id=p1.id).first()
        if not ent:
            ent = Entrega(pedido_id=p1.id, motorista_id=mot.id, viatura_id=via.id, data_prevista=hoje, estado=EstadoEntrega.CONCLUIDA)
            db.session.add(ent)

        # 9. Conta Corrente e Caixa
        conta = ContaReceber.query.filter_by(pedido_id=p2.id).first()
        if not conta:
            conta = ContaReceber(cliente_id=cl2.id, descricao="Sinal - Casamento Silva", valor=10.00, data_vencimento=hoje, estado="Pendente", pedido_id=p2.id)
            db.session.add(conta)

        # 10. Auditoria Mock (Simulando log do Admin)
        auditoria_check = Auditoria.query.first()
        if not auditoria_check:
            audit = Auditoria(utilizador_id=admin_id, operacao="CREATE", entidade="pedidos", registo_id=p1.id, valor_novo="Criou Pedido PED-0001", modulo="ATENDIMENTO")
            db.session.add(audit)

        db.session.commit()
        print("✅ Ambiente de demonstração completo criado com sucesso! Dados reais inseridos.")

if __name__ == '__main__':
    seed_data()

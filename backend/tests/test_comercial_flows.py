import pytest
from app.models.comercial import TipoDocumento, EstadoVenda, TaxaIVA
from app.models.financeiro import FormaPagamento
from app.services.comercial_service import ComercialService
from app.core.database import db

def test_criar_taxa_iva(app_context):
    service = ComercialService()
    iva = service.create_taxa_iva({'descricao': 'Normal', 'percentagem': 23.0})
    assert iva.id is not None
    assert float(iva.percentagem) == 23.0

def test_criar_venda(app_context, admin_user):
    service = ComercialService()
    iva = service.create_taxa_iva({'descricao': 'Reduzida', 'percentagem': 6.0})
    
    dados_venda = {
        'tipo_documento': 'FT',
        'cliente_id': None,
        'pedido_id': None,
        'observacoes': 'Teste de venda',
        'itens': [
            {
                'item_tipo': 'Produto',
                'descricao': 'Bolo',
                'quantidade': 2,
                'preco_unitario': 10.0,
                'desconto': 0.0,
                'taxa_iva_id': iva.id
            }
        ]
    }
    
    venda = service.create_venda(dados_venda, admin_user.id)
    assert venda.id is not None
    assert venda.numero_documento.startswith('FT')
    assert venda.subtotal == 20.0
    assert venda.total_iva == 1.2
    assert venda.total == 21.2
    assert venda.estado == EstadoVenda.PENDENTE

def test_pagamento_parcial_venda(app_context, admin_user):
    service = ComercialService()
    
    fp = FormaPagamento(nome='Dinheiro')
    db.session.add(fp)
    db.session.commit()
    
    venda = service.create_venda({
        'tipo_documento': 'FT',
        'itens': [{'descricao': 'Café', 'quantidade': 1, 'preco_unitario': 5.0}]
    }, admin_user.id)
    
    pagamento = service.add_pagamento(venda.id, {'valor': 2.0, 'forma_pagamento_id': fp.id}, admin_user.id)
    assert pagamento.valor == 2.0
    assert venda.valor_pago == 2.0
    assert venda.saldo == 3.0
    assert venda.estado == EstadoVenda.PARCIALMENTE_PAGO

def test_pagamento_total_venda(app_context, admin_user):
    service = ComercialService()
    
    fp = FormaPagamento(nome='Multibanco')
    db.session.add(fp)
    db.session.commit()
    
    venda = service.create_venda({
        'tipo_documento': 'FT',
        'itens': [{'descricao': 'Sumo', 'quantidade': 1, 'preco_unitario': 3.0}]
    }, admin_user.id)
    
    service.add_pagamento(venda.id, {'valor': 3.0, 'forma_pagamento_id': fp.id}, admin_user.id)
    assert venda.valor_pago == 3.0
    assert venda.saldo == 0.0
    assert venda.estado == EstadoVenda.PAGO

def test_fecho_diario(app_context, admin_user):
    service = ComercialService()
    fecho = service.fecho_diario('2026-06-20', admin_user.id)
    assert fecho.id is not None
    assert fecho.total_vendas >= 0

def test_cancelamento_venda(app_context, admin_user):
    service = ComercialService()
    venda = service.create_venda({
        'tipo_documento': 'PF',
        'itens': [{'descricao': 'Teste', 'quantidade': 1, 'preco_unitario': 100.0}]
    }, admin_user.id)
    
    cancelada = service.cancel_venda(venda.id, admin_user.id)
    assert cancelada.estado == EstadoVenda.CANCELADO

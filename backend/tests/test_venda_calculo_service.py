import pytest
from decimal import Decimal
from app.services.venda_calculo_service import calcular_item_venda, calcular_venda

def test_iva_e_desconto_percentual_regra_oficial():
    item = calcular_item_venda('50.00', 5, 15, desconto_percentual=3)
    assert item.subtotal == Decimal('250.00')
    assert item.desconto == Decimal('7.50')
    assert item.base_tributavel == Decimal('242.50')
    assert item.valor_iva == Decimal('36.38')
    assert item.total == Decimal('278.88')

def test_iva_zero_e_desconto_valor():
    item = calcular_item_venda('20', 2, 0, desconto_valor='5')
    assert (item.base_tributavel, item.valor_iva, item.total) == (Decimal('35.00'), Decimal('0.00'), Decimal('35.00'))

def test_multiplas_taxas_somam_valores_das_linhas():
    itens = [calcular_item_venda(17, 10, 15), calcular_item_venda(20, 2, 0)]
    totais = calcular_venda(itens)
    assert totais['total'] == sum(item.total for item in itens)
    assert totais['valor_iva'] == sum(item.valor_iva for item in itens)

@pytest.mark.parametrize('desconto', [-1, 101])
def test_rejeita_desconto_percentual_invalido(desconto):
    with pytest.raises(ValueError):
        calcular_item_venda(10, 1, 15, desconto_percentual=desconto)

def test_rejeita_quantidade_zero_e_desconto_superior_ao_bruto():
    with pytest.raises(ValueError): calcular_item_venda(10, 0, 15)
    with pytest.raises(ValueError): calcular_item_venda(10, 1, 15, desconto_valor=11)

"""Fonte única da verdade financeira para vendas.

Todos os valores monetários são arredondados a 2 casas com ROUND_HALF_UP ao
fechar cada linha. O desconto é sempre aplicado antes do IVA.
"""
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP, InvalidOperation

CENT = Decimal('0.01')

def money(value):
    try:
        return Decimal(str(value or 0)).quantize(CENT, rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError):
        raise ValueError('Valor monetário inválido.')

def decimal_value(value, field):
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        raise ValueError(f'{field} inválido.')

@dataclass(frozen=True)
class ItemCalculado:
    quantidade: Decimal
    preco_unitario: Decimal
    subtotal: Decimal
    desconto: Decimal
    base_tributavel: Decimal
    taxa_iva: Decimal
    valor_iva: Decimal
    total: Decimal

def calcular_item_venda(preco_unitario, quantidade, taxa_iva=0, desconto_percentual=None, desconto_valor=None):
    preco = money(preco_unitario)
    qtd = decimal_value(quantidade, 'Quantidade')
    taxa = decimal_value(taxa_iva or 0, 'Taxa de IVA')
    if preco < 0 or qtd <= 0 or taxa < 0:
        raise ValueError('Preço, quantidade e IVA devem ser valores não negativos; quantidade deve ser maior que zero.')
    bruto = money(preco * qtd)
    if desconto_percentual is not None:
        percentual = decimal_value(desconto_percentual, 'Desconto percentual')
        if percentual < 0 or percentual > 100:
            raise ValueError('Desconto percentual deve estar entre 0 e 100.')
        desconto = money(bruto * percentual / Decimal('100'))
    else:
        desconto = money(desconto_valor or 0)
        if desconto < 0 or desconto > bruto:
            raise ValueError('Desconto não pode ser negativo nem superior ao subtotal da linha.')
    base = money(bruto - desconto)
    iva = money(base * taxa / Decimal('100'))
    total = money(base + iva)
    return ItemCalculado(qtd, preco, bruto, desconto, base, taxa, iva, total)

def calcular_venda(itens):
    if not itens:
        raise ValueError('A venda deve ter pelo menos um item.')
    campos = ('subtotal', 'desconto', 'base_tributavel', 'valor_iva', 'total')
    totais = {campo: Decimal('0.00') for campo in campos}
    for item in itens:
        for campo in campos:
            totais[campo] += getattr(item, campo)
    totais = {campo: money(valor) for campo, valor in totais.items()}
    if money(totais['base_tributavel'] + totais['valor_iva']) != totais['total']:
        raise ValueError('Inconsistência financeira: base tributável + IVA não corresponde ao total.')
    return totais

from marshmallow import Schema, fields, validate
from app.models.caixa import EstadoCaixa, TipoMovimentoCaixa
from app.models.financeiro import EstadoPagamento, EstadoConta, CategoriaReceita, CategoriaDespesa

class CaixaSchema(Schema):
    id = fields.Int(dump_only=True)
    numero = fields.Str(dump_only=True)
    data_abertura = fields.DateTime(dump_only=True)
    data_fecho = fields.DateTime(dump_only=True)
    valor_inicial = fields.Decimal(required=True)
    valor_final = fields.Decimal(dump_only=True)
    utilizador_abertura_id = fields.Int(dump_only=True)
    estado = fields.Enum(EstadoCaixa, by_value=True, dump_only=True)
    valor_declarado_dinheiro = fields.Decimal(required=False, allow_none=True)
    valor_declarado_transferencia = fields.Decimal(required=False, allow_none=True)
    valor_declarado_pos = fields.Decimal(required=False, allow_none=True)
    valor_esperado_dinheiro = fields.Decimal(dump_only=True)
    valor_esperado_transferencia = fields.Decimal(dump_only=True)
    valor_esperado_pos = fields.Decimal(dump_only=True)
    diferenca_dinheiro = fields.Decimal(dump_only=True)
    diferenca_transferencia = fields.Decimal(dump_only=True)
    diferenca_pos = fields.Decimal(dump_only=True)
    explicacao_divergencia = fields.Str(required=False, allow_none=True)

class MovimentoCaixaSchema(Schema):
    id = fields.Int(dump_only=True)
    caixa_id = fields.Int(required=True)
    tipo = fields.Enum(TipoMovimentoCaixa, by_value=True, required=True)
    valor = fields.Decimal(required=True)
    descricao = fields.Str(required=False, allow_none=True)
    data_movimento = fields.DateTime(dump_only=True)
    codigo_transferencia = fields.Str(required=False, allow_none=True)
    emissor = fields.Str(required=False, allow_none=True)
    forma_pagamento = fields.Str(required=False, allow_none=True)

class PagamentoSchema(Schema):
    id = fields.Int(dump_only=True)
    pedido_id = fields.Int(required=False, allow_none=True)
    venda_id = fields.Int(required=False, allow_none=True)
    evento_id = fields.Int(required=False, allow_none=True)
    valor = fields.Decimal(required=True)
    forma_pagamento_id = fields.Int(required=True)
    estado = fields.Enum(EstadoPagamento, by_value=True, required=False)
    codigo_transferencia = fields.Str(required=False, allow_none=True)
    emissor = fields.Str(required=False, allow_none=True)
    referencia = fields.Str(required=False, allow_none=True)
    data_pagamento = fields.DateTime(dump_only=True)

class ContaReceberSchema(Schema):
    id = fields.Int(dump_only=True)
    cliente_id = fields.Int(required=False, allow_none=True)
    pedido_id = fields.Int(required=False, allow_none=True)
    evento_id = fields.Int(required=False, allow_none=True)
    valor_original = fields.Decimal(required=True)
    valor_pago = fields.Decimal(dump_only=True)
    saldo = fields.Decimal(dump_only=True)
    vencimento = fields.Date(required=True)
    estado = fields.Enum(EstadoConta, by_value=True, dump_only=True)

class PagamentoContaSchema(Schema):
    valor = fields.Decimal(required=True)

class ContaPagarSchema(Schema):
    id = fields.Int(dump_only=True)
    fornecedor_id = fields.Int(required=False, allow_none=True)
    descricao = fields.Str(required=True)
    valor = fields.Decimal(required=True)
    vencimento = fields.Date(required=True)
    estado = fields.Enum(EstadoConta, by_value=True, dump_only=True)

class ReceitaSchema(Schema):
    id = fields.Int(dump_only=True)
    categoria = fields.Enum(CategoriaReceita, by_value=True, required=True)
    valor = fields.Decimal(required=True)
    descricao = fields.Str(required=False, allow_none=True)
    data_receita = fields.Date(required=True)

class DespesaSchema(Schema):
    id = fields.Int(dump_only=True)
    categoria = fields.Enum(CategoriaDespesa, by_value=True, required=True)
    valor = fields.Decimal(required=True)
    descricao = fields.Str(required=False, allow_none=True)
    data_despesa = fields.Date(required=True)
    centro_custo_id = fields.Int(required=False, allow_none=True)

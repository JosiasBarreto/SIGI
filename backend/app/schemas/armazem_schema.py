from marshmallow import Schema, fields, validate
from app.models.produto import TipoProduto
from app.models.material import TipoMaterial, EstadoMaterial
from app.models.movimento_stock import TipoMovimento, OrigemMovimento, EntidadeMovimento

class CategoriaProdutoSchema(Schema):
    id = fields.Int(dump_only=True)
    nome = fields.Str(required=True)
    descricao = fields.Str(required=False)
    is_active = fields.Bool(dump_only=True)

class UnidadeMedidaSchema(Schema):
    id = fields.Int(dump_only=True)
    nome = fields.Str(required=True)
    sigla = fields.Str(required=True)
    descricao = fields.Str(required=False)
    is_active = fields.Bool(dump_only=True)

class FornecedorSchema(Schema):
    id = fields.Int(dump_only=True)
    codigo = fields.Str(required=False)
    nome = fields.Str(required=True, validate=validate.Length(min=2))
    nif = fields.Str(required=False)
    email = fields.Email(required=False)
    telefone = fields.Str(required=False)
    morada = fields.Str(required=False)
    contacto_principal = fields.Str(required=False)
    observacoes = fields.Str(required=False)
    is_active = fields.Bool(dump_only=True)

class IngredienteSchema(Schema):
    id = fields.Int(dump_only=True)
    codigo = fields.Str(required=False)
    nome = fields.Str(required=True, validate=validate.Length(min=2))
    categoria = fields.Str(required=False)
    unidade_medida = fields.Str(required=True)
    stock_atual = fields.Decimal(dump_only=True)
    stock_minimo = fields.Decimal(required=False)
    stock_maximo = fields.Decimal(required=False)
    validade = fields.Date(required=False, allow_none=True)
    preco_compra = fields.Decimal(required=False)
    observacoes = fields.Str(required=False)
    fornecedor_id = fields.Int(required=False, allow_none=True)
    armazem_id = fields.Function(
        serialize=lambda obj: obj.stocks_armazem[0].armazem_id if (hasattr(obj, 'stocks_armazem') and obj.stocks_armazem) else None,
        deserialize=lambda val: val,
        required=False,
        allow_none=True
    )
    is_active = fields.Bool(dump_only=True)

class ProdutoSchema(Schema):
    id = fields.Int(dump_only=True)
    codigo = fields.Str(dump_only=True)
    nome = fields.Str(required=True, validate=validate.Length(min=2))
    tipo = fields.Enum(TipoProduto, by_value=True, required=True)
    categoria = fields.Str(required=False) # Mantido por compatibilidade
    categoria_id = fields.Int(required=False, allow_none=True)
    unidade_medida_id = fields.Int(required=False, allow_none=True)
    tempo_producao = fields.Int(required=False, allow_none=True)
    preco_venda = fields.Decimal(required=False, allow_none=True)
    preco_compra = fields.Decimal(required=False, allow_none=True)
    descricao = fields.Str(required=False)
    stock_atual = fields.Decimal(dump_only=True)
    stock_minimo = fields.Decimal(required=False)
    taxa_iva_id = fields.Int(required=False, allow_none=True)
    data_validade = fields.Date(required=False, allow_none=True)
    taxa_iva = fields.Function(lambda obj: obj.taxa_iva.percentagem if obj.taxa_iva else None)
    unidade_medida_sigla = fields.Function(lambda obj: obj.unidade_medida.sigla if obj.unidade_medida else None)
    categoria_nome = fields.Function(lambda obj: obj.categoria_rel.nome if hasattr(obj, 'categoria_rel') and obj.categoria_rel else None)
    armazem_id = fields.Function(
        serialize=lambda obj: obj.stocks_armazem[0].armazem_id if (hasattr(obj, 'stocks_armazem') and obj.stocks_armazem) else None,
        deserialize=lambda val: val,
        required=False,
        allow_none=True
    )
    armazem_nome = fields.Function(lambda obj: obj.stocks_armazem[0].armazem.nome if (hasattr(obj, 'stocks_armazem') and obj.stocks_armazem and obj.stocks_armazem[0].armazem) else None)
    ativo = fields.Bool(dump_only=True)

class MaterialSchema(Schema):
    id = fields.Int(dump_only=True)
    codigo = fields.Str(required=False)
    nome = fields.Str(required=True)
    categoria = fields.Str(required=False)
    tipo = fields.Enum(TipoMaterial, by_value=True, required=True)
    quantidade_total = fields.Decimal(dump_only=True)
    quantidade_disponivel = fields.Decimal(dump_only=True)
    quantidade_reservada = fields.Decimal(dump_only=True)
    estado = fields.Enum(EstadoMaterial, by_value=True, dump_only=True)
    valor_unitario = fields.Decimal(required=False)
    unidade_medida_id = fields.Int(required=False, allow_none=True)
    unidade_medida_sigla = fields.Function(lambda obj: obj.unidade_medida.sigla if obj.unidade_medida else None)
    armazem_id = fields.Function(
        serialize=lambda obj: obj.stocks_armazem[0].armazem_id if (hasattr(obj, 'stocks_armazem') and obj.stocks_armazem) else None,
        deserialize=lambda val: val,
        required=False,
        allow_none=True
    )
    is_active = fields.Bool(dump_only=True)

class MovimentoStockSchema(Schema):
    id = fields.Int(dump_only=True)
    tipo = fields.Enum(TipoMovimento, by_value=True, required=True)
    origem = fields.Enum(OrigemMovimento, by_value=True, required=True)
    entidade_tipo = fields.Enum(EntidadeMovimento, by_value=True, required=True)
    referencia_id = fields.Int(required=True)
    quantidade = fields.Decimal(required=True)
    justificacao = fields.Str(required=False)
    armazem_id = fields.Int(required=False, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    created_by = fields.Int(dump_only=True)

class ArmazemSchema(Schema):
    id = fields.Int(dump_only=True)
    codigo = fields.Str(required=True)
    nome = fields.Str(required=True)
    localizacao = fields.Str(required=False, allow_none=True)
    descricao = fields.Str(required=False, allow_none=True)
    principal = fields.Bool(required=False, default=False)
    is_active = fields.Bool(dump_only=True)

class ProdutoStockArmazemSchema(Schema):
    id = fields.Int(dump_only=True)
    produto_id = fields.Int(required=True)
    produto_nome = fields.Function(lambda obj: obj.produto.nome if obj.produto else None)
    produto_codigo = fields.Function(lambda obj: obj.produto.codigo if obj.produto else None)
    armazem_id = fields.Int(required=True)
    armazem_nome = fields.Function(lambda obj: obj.armazem.nome if obj.armazem else None)
    stock_atual = fields.Decimal(required=True)
    stock_minimo = fields.Decimal(required=True)

class IngredienteStockArmazemSchema(Schema):
    id = fields.Int(dump_only=True)
    ingrediente_id = fields.Int(required=True)
    ingrediente_nome = fields.Function(lambda obj: obj.ingrediente.nome if obj.ingrediente else None)
    ingrediente_codigo = fields.Function(lambda obj: obj.ingrediente.codigo if obj.ingrediente else None)
    armazem_id = fields.Int(required=True)
    armazem_nome = fields.Function(lambda obj: obj.armazem.nome if obj.armazem else None)
    stock_atual = fields.Decimal(required=True)
    stock_minimo = fields.Decimal(required=True)

class MaterialStockArmazemSchema(Schema):
    id = fields.Int(dump_only=True)
    material_id = fields.Int(required=True)
    material_nome = fields.Function(lambda obj: obj.material.nome if obj.material else None)
    material_codigo = fields.Function(lambda obj: obj.material.codigo if obj.material else None)
    armazem_id = fields.Int(required=True)
    armazem_nome = fields.Function(lambda obj: obj.armazem.nome if obj.armazem else None)
    stock_atual = fields.Decimal(required=True)
    stock_minimo = fields.Decimal(required=True)



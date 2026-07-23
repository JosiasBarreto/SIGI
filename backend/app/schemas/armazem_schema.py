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
    ativo = fields.Bool(required=False)
    is_active = fields.Bool(dump_only=True)

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
    ativo = fields.Bool(required=False)
    is_active = fields.Bool(dump_only=True)

class MovimentoStockSchema(Schema):
    id = fields.Int(dump_only=True)
    tipo = fields.Enum(TipoMovimento, by_value=True, required=True)
    origem = fields.Enum(OrigemMovimento, by_value=True, required=True)
    entidade_tipo = fields.Enum(EntidadeMovimento, by_value=True, required=True)
    referencia_id = fields.Int(required=True)
    entidade_nome = fields.Method("get_entidade_nome")
    quantidade = fields.Decimal(required=True)
    justificacao = fields.Str(required=False)
    armazem_id = fields.Int(required=False, allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    created_by = fields.Int(dump_only=True)
    created_by_nome = fields.Method("get_created_by_nome")

    def get_created_by_nome(self, obj):
        from app.core.database import db
        if not getattr(obj, 'created_by', None): return None
        try:
            from app.models.user import User
            user = db.session.query(User.name).filter_by(id=obj.created_by).first()
            return user[0] if user else None
        except: return None

    def get_entidade_nome(self, obj):
        from app.core.database import db
        if not getattr(obj, 'entidade_tipo', None) or not getattr(obj, 'referencia_id', None):
            return None
        try:
            # Handle both Enum and string cases
            tipo_str = obj.entidade_tipo.value if hasattr(obj.entidade_tipo, 'value') else str(obj.entidade_tipo)
            tipo_str = tipo_str.replace('EntidadeMovimento.', '')
            
            if tipo_str == 'Material':
                from app.models.material import Material
                ent = db.session.query(Material.nome).filter_by(id=obj.referencia_id).first()
                return ent[0] if ent else None
            elif tipo_str == 'Produto':
                from app.models.produto import Produto
                ent = db.session.query(Produto.nome).filter_by(id=obj.referencia_id).first()
                return ent[0] if ent else None
            elif tipo_str == 'Ingrediente':
                from app.models.ingrediente import Ingrediente
                ent = db.session.query(Ingrediente.nome).filter_by(id=obj.referencia_id).first()
                return ent[0] if ent else None
        except Exception as e:
            print("Error in get_entidade_nome:", e)
            return None
        return None

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
    unidade_medida = fields.Function(lambda obj: obj.produto.unidade_medida.sigla if (obj.produto and obj.produto.unidade_medida) else None)
    categoria = fields.Function(lambda obj: obj.produto.categoria or (obj.produto.categoria_rel.nome if (obj.produto and obj.produto.categoria_rel) else None) if obj.produto else None)
    preco_compra = fields.Function(lambda obj: float(obj.produto.preco_compra) if (obj.produto and obj.produto.preco_compra is not None) else 0.0)
    preco_venda = fields.Function(lambda obj: float(obj.produto.preco_venda) if (obj.produto and obj.produto.preco_venda is not None) else 0.0)
    preco_com_iva = fields.Function(lambda obj: float(obj.produto.preco_venda * (1 + (obj.produto.taxa_iva.percentagem / 100))) if (obj.produto and obj.produto.preco_venda is not None and obj.produto.taxa_iva) else (float(obj.produto.preco_venda) if (obj.produto and obj.produto.preco_venda is not None) else 0.0))
    estado = fields.Function(lambda obj: "Ativo" if (obj.produto and getattr(obj.produto, 'ativo', True)) else "Inativo")
    tipo = fields.Function(lambda obj: obj.produto.tipo.value if (obj.produto and hasattr(obj.produto.tipo, 'value')) else (str(obj.produto.tipo) if (obj.produto and obj.produto.tipo) else None))

class IngredienteStockArmazemSchema(Schema):
    id = fields.Int(dump_only=True)
    ingrediente_id = fields.Int(required=True)
    ingrediente_nome = fields.Function(lambda obj: obj.ingrediente.nome if obj.ingrediente else None)
    ingrediente_codigo = fields.Function(lambda obj: obj.ingrediente.codigo if obj.ingrediente else None)
    armazem_id = fields.Int(required=True)
    armazem_nome = fields.Function(lambda obj: obj.armazem.nome if obj.armazem else None)
    stock_atual = fields.Decimal(required=True)
    stock_minimo = fields.Decimal(required=True)
    unidade_medida = fields.Function(lambda obj: obj.ingrediente.unidade_medida if obj.ingrediente else None)
    categoria = fields.Function(lambda obj: obj.ingrediente.categoria if obj.ingrediente else None)
    preco_compra = fields.Function(lambda obj: float(obj.ingrediente.preco_compra) if (obj.ingrediente and obj.ingrediente.preco_compra is not None) else 0.0)
    preco_venda = fields.Function(lambda obj: 0.0)
    preco_com_iva = fields.Function(lambda obj: 0.0)
    estado = fields.Function(lambda obj: "Ativo")
    tipo = fields.Function(lambda obj: "Ingrediente")

class MaterialStockArmazemSchema(Schema):
    id = fields.Int(dump_only=True)
    material_id = fields.Int(required=True)
    material_nome = fields.Function(lambda obj: obj.material.nome if obj.material else None)
    material_codigo = fields.Function(lambda obj: obj.material.codigo if obj.material else None)
    armazem_id = fields.Int(required=True)
    armazem_nome = fields.Function(lambda obj: obj.armazem.nome if obj.armazem else None)
    stock_atual = fields.Decimal(required=True)
    stock_minimo = fields.Decimal(required=True)
    unidade_medida = fields.Function(lambda obj: obj.material.unidade_medida.sigla if (obj.material and obj.material.unidade_medida) else None)
    categoria = fields.Function(lambda obj: obj.material.categoria if obj.material else None)
    preco_compra = fields.Function(lambda obj: float(obj.material.valor_unitario) if (obj.material and obj.material.valor_unitario is not None) else 0.0)
    preco_venda = fields.Function(lambda obj: 0.0)
    preco_com_iva = fields.Function(lambda obj: 0.0)
    estado = fields.Function(lambda obj: obj.material.estado.value if (obj.material and hasattr(obj.material.estado, 'value')) else (str(obj.material.estado) if (obj.material and obj.material.estado) else "Disponivel"))
    tipo = fields.Function(lambda obj: obj.material.tipo.value if (obj.material and hasattr(obj.material.tipo, 'value')) else (str(obj.material.tipo) if (obj.material and obj.material.tipo) else "Material"))


from marshmallow import Schema, fields, validate
from app.models.requisicao import TipoRequisicao, SectorRequisicao, EstadoRequisicao, TipoItemRequisicao, TipoOcorrencia, EstadoOcorrencia

class RequisicaoItemSchema(Schema):
    id = fields.Int(dump_only=True)
    tipo_item = fields.Enum(TipoItemRequisicao, by_value=True, required=True)
    item_id = fields.Int(required=True)
    nome = fields.Method("get_item_nome", dump_only=True)
    codigo = fields.Method("get_item_codigo", dump_only=True)
    unidade_medida = fields.Method("get_item_unidade", dump_only=True)
    quantidade_solicitada = fields.Decimal(required=True)
    quantidade_aprovada = fields.Decimal(required=False)
    quantidade_entregue = fields.Decimal(required=False)
    quantidade_devolvida = fields.Decimal(required=False)
    quantidade_danificada = fields.Decimal(required=False)
    quantidade_perdida = fields.Decimal(required=False)
    observacao = fields.Str(required=False, allow_none=True)

    def get_item_nome(self, obj):
        from app.models.ingrediente import Ingrediente
        from app.models.material import Material
        from app.models.produto import Produto
        from app.core.database import db
        
        if obj.tipo_item == 'Ingrediente':
            item = db.session.query(Ingrediente).get(obj.item_id)
            return item.nome if item else None
        elif obj.tipo_item == 'Material':
            item = db.session.query(Material).get(obj.item_id)
            return item.nome if item else None
        elif obj.tipo_item == 'Consumivel':
            item = db.session.query(Produto).get(obj.item_id)
            return item.nome if item else None
        return None

    def get_item_codigo(self, obj):
        from app.models.ingrediente import Ingrediente
        from app.models.material import Material
        from app.models.produto import Produto
        from app.core.database import db
        
        if obj.tipo_item == 'Ingrediente':
            item = db.session.query(Ingrediente).get(obj.item_id)
            return item.codigo if item else None
        elif obj.tipo_item == 'Material':
            item = db.session.query(Material).get(obj.item_id)
            return item.codigo if item else None
        elif obj.tipo_item == 'Consumivel':
            item = db.session.query(Produto).get(obj.item_id)
            return item.codigo if item else None
        return None

    def get_item_unidade(self, obj):
        from app.models.ingrediente import Ingrediente
        from app.models.produto import Produto
        from app.core.database import db
        
        if obj.tipo_item == 'Ingrediente':
            item = db.session.query(Ingrediente).get(obj.item_id)
            return item.unidade_medida if item else None
        elif obj.tipo_item == 'Material':
            return "un"
        elif obj.tipo_item == 'Consumivel':
            item = db.session.query(Produto).get(obj.item_id)
            if item and item.unidade_medida:
                return item.unidade_medida.sigla
            return "un"
        return None

class RequisicaoSchema(Schema):
    id = fields.Int(dump_only=True)
    numero = fields.Str(dump_only=True)
    tipo = fields.Enum(TipoRequisicao, by_value=True, required=True)
    sector = fields.Enum(SectorRequisicao, by_value=True, required=True)
    turno_id = fields.Int(required=False, allow_none=True)
    turno_nome = fields.Function(lambda obj: obj.turno.nome if obj.turno else None, dump_only=True)
    responsavel_id = fields.Int(dump_only=True)
    responsavel_nome = fields.Function(lambda obj: obj.responsavel.name if obj.responsavel else None, dump_only=True)
    data_requisicao = fields.DateTime(dump_only=True)
    estado = fields.Enum(EstadoRequisicao, by_value=True, dump_only=True)
    observacoes = fields.Str(required=False, allow_none=True)
    
    itens = fields.List(fields.Nested(RequisicaoItemSchema), required=False)

class AprovarRequisicaoSchema(Schema):
    itens = fields.List(fields.Dict(), required=True) # List of dicts with item_id and quantidade_aprovada

class EntregaRequisicaoSchema(Schema):
    observacao = fields.Str(required=False, allow_none=True)

class DevolucaoMaterialSchema(Schema):
    material_id = fields.Int(required=True)
    quantidade_devolvida = fields.Decimal(required=True)
    quantidade_danificada = fields.Decimal(required=False)
    quantidade_perdida = fields.Decimal(required=False)
    observacao = fields.Str(required=False, allow_none=True)
    justificacao = fields.Str(required=False, allow_none=True)

class OcorrenciaMaterialSchema(Schema):
    id = fields.Int(dump_only=True)
    numero = fields.Str(dump_only=True)
    material_id = fields.Int(required=True)
    material_nome = fields.Function(lambda obj: obj.material.nome if obj.material else None, dump_only=True)
    material_codigo = fields.Function(lambda obj: obj.material.codigo if obj.material else None, dump_only=True)
    responsavel_id = fields.Int(dump_only=True)
    responsavel_nome = fields.Function(lambda obj: obj.responsavel.name if obj.responsavel else None, dump_only=True)
    tipo = fields.Enum(TipoOcorrencia, by_value=True, required=True)
    quantidade = fields.Decimal(required=True)
    valor_estimado = fields.Decimal(required=False)
    justificacao = fields.Str(required=True)
    data_ocorrencia = fields.DateTime(dump_only=True)
    estado = fields.Enum(EstadoOcorrencia, by_value=True, dump_only=True)

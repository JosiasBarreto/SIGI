from marshmallow import Schema, fields, validate
from app.models.requisicao import (
    TipoRequisicao, SectorRequisicao, EstadoRequisicao,
    TipoItemRequisicao, TipoOcorrencia, EstadoOcorrencia
)
from app.models.ingrediente import Ingrediente
from app.models.material import Material
from app.models.produto import Produto
from app.core.database import db


class RequisicaoItemSchema(Schema):
    id = fields.Int(dump_only=True)
    requisicao_id = fields.Int(dump_only=True)
    tipo_item = fields.Str(required=True)
    item_id = fields.Int(required=True)
    quantidade_solicitada = fields.Decimal(as_string=True, required=True)
    quantidade_aprovada = fields.Decimal(as_string=True, dump_default="0.000")
    quantidade_entregue = fields.Decimal(as_string=True, dump_default="0.000")
    quantidade_devolvida = fields.Decimal(as_string=True, dump_default="0.000")
    quantidade_danificada = fields.Decimal(as_string=True, dump_default="0.000")
    quantidade_perdida = fields.Decimal(as_string=True, dump_default="0.000")
    observacao = fields.Str(allow_none=True)

    item_nome = fields.Method('get_item_nome', dump_only=True)
    item_codigo = fields.Method('get_item_codigo', dump_only=True)
    item_unidade = fields.Method('get_item_unidade', dump_only=True)

    def get_item_nome(self, obj):
        tipo = getattr(obj, 'tipo_item', None)
        item_id = getattr(obj, 'item_id', None)
        if not item_id:
            return None
        tipo_str = tipo.value if hasattr(tipo, 'value') else str(tipo)
        if tipo_str == TipoItemRequisicao.INGREDIENTE.value:
            ing = db.session.query(Ingrediente).get(item_id)
            return ing.nome if ing else None
        elif tipo_str == TipoItemRequisicao.MATERIAL.value:
            mat = db.session.query(Material).get(item_id)
            return mat.nome if mat else None
        elif tipo_str == TipoItemRequisicao.CONSUMIVEL.value:
            prod = db.session.query(Produto).get(item_id)
            return prod.nome if prod else None
        return None

    def get_item_codigo(self, obj):
        tipo = getattr(obj, 'tipo_item', None)
        item_id = getattr(obj, 'item_id', None)
        if not item_id:
            return None
        tipo_str = tipo.value if hasattr(tipo, 'value') else str(tipo)
        if tipo_str == TipoItemRequisicao.MATERIAL.value:
            mat = db.session.query(Material).get(item_id)
            return mat.codigo if mat else None
        elif tipo_str == TipoItemRequisicao.CONSUMIVEL.value:
            prod = db.session.query(Produto).get(item_id)
            return prod.codigo if prod else None
        return None

    def get_item_unidade(self, obj):
        tipo = getattr(obj, 'tipo_item', None)
        item_id = getattr(obj, 'item_id', None)
        if not item_id:
            return None
        tipo_str = tipo.value if hasattr(tipo, 'value') else str(tipo)
        if tipo_str == TipoItemRequisicao.INGREDIENTE.value:
            ing = db.session.query(Ingrediente).get(item_id)
            return ing.unidade_medida if ing else "un"
        elif tipo_str == TipoItemRequisicao.MATERIAL.value:
            mat = db.session.query(Material).get(item_id)
            return mat.unidade_medida.sigla if (mat and mat.unidade_medida) else "un"
        elif tipo_str == TipoItemRequisicao.CONSUMIVEL.value:
            prod = db.session.query(Produto).get(item_id)
            return prod.unidade_medida.sigla if (prod and prod.unidade_medida) else "un"
        return "un"


class RequisicaoSchema(Schema):
    id = fields.Int(dump_only=True)
    numero = fields.Str(dump_only=True)
    tipo = fields.Str(required=True)
    sector = fields.Str(required=True)
    turno_id = fields.Int(allow_none=True)
    turno_nome = fields.Function(lambda obj: obj.turno.nome if (obj.turno and hasattr(obj.turno, 'nome')) else None, dump_only=True)
    responsavel_id = fields.Int(allow_none=True)
    responsavel_nome = fields.Function(lambda obj: obj.responsavel.name if (obj.responsavel and hasattr(obj.responsavel, 'name')) else None, dump_only=True)
    evento_id = fields.Int(allow_none=True)
    data_requisicao = fields.DateTime(dump_only=True)
    estado = fields.Function(lambda obj: obj.estado.value if hasattr(obj.estado, 'value') else str(obj.estado), dump_only=True)
    motivo = fields.Str(allow_none=True)
    observacoes = fields.Str(allow_none=True)
    itens = fields.List(fields.Nested(RequisicaoItemSchema))


class AprovarRequisicaoSchema(Schema):
    itens = fields.List(fields.Dict(), required=True)


class EntregaRequisicaoSchema(Schema):
    observacao = fields.Str(allow_none=True)


class DevolucaoMaterialSchema(Schema):
    material_id = fields.Int(required=True)
    quantidade_devolvida = fields.Decimal(as_string=True, load_default=0)
    quantidade_danificada = fields.Decimal(as_string=True, load_default=0)
    quantidade_perdida = fields.Decimal(as_string=True, load_default=0)
    justificacao = fields.Str(allow_none=True)
    observacao = fields.Str(allow_none=True)


class OcorrenciaMaterialSchema(Schema):
    id = fields.Int(dump_only=True)
    numero = fields.Str(dump_only=True)
    material_id = fields.Int(dump_only=True)
    material_nome = fields.Function(lambda obj: obj.material.nome if (obj.material and hasattr(obj.material, 'nome')) else None, dump_only=True)
    material_codigo = fields.Function(lambda obj: obj.material.codigo if (obj.material and hasattr(obj.material, 'codigo')) else None, dump_only=True)
    responsavel_id = fields.Int(dump_only=True)
    responsavel_nome = fields.Function(lambda obj: obj.responsavel.name if (obj.responsavel and hasattr(obj.responsavel, 'name')) else None, dump_only=True)
    tipo = fields.Function(lambda obj: obj.tipo.value if hasattr(obj.tipo, 'value') else str(obj.tipo), dump_only=True)
    estado = fields.Function(lambda obj: obj.estado.value if hasattr(obj.estado, 'value') else str(obj.estado), dump_only=True)
    quantidade = fields.Function(lambda obj: f"{float(obj.quantidade):.3f}" if obj.quantidade is not None else "0.000", dump_only=True)
    valor_estimado = fields.Decimal(as_string=True, dump_only=True)
    justificacao = fields.Str(dump_only=True)
    data_ocorrencia = fields.DateTime(dump_only=True)

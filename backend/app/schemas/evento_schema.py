from marshmallow import Schema, fields, validate
from app.models.evento import (
    TipoEvento, EstadoEvento, TipoServicoEvento, EstadoEspaco,
    EstadoReservaEspaco, FuncaoEquipa, TipoItemEvento, TipoCalculoPolitica
)

class ServicoCadastroSchema(Schema):
    id = fields.Int(dump_only=True)
    codigo = fields.Str(required=False, allow_none=True)
    nome = fields.Str(required=True)
    categoria = fields.Str(required=False, allow_none=True)
    descricao = fields.Str(required=False, allow_none=True)
    unidade_padrao = fields.Str(required=False, allow_none=True, default='Unidade')
    preco_sugerido = fields.Decimal(required=False, allow_none=True, default=0.0)
    ativo = fields.Bool(required=False, default=True)

class TipoEventoCadastroSchema(Schema):
    id = fields.Int(dump_only=True)
    nome = fields.Str(required=True)
    descricao = fields.Str(required=False, allow_none=True)
    ativo = fields.Bool(required=False, default=True)

class EquipaCadastroSchema(Schema):
    id = fields.Int(dump_only=True)
    nome = fields.Str(required=True)
    departamento = fields.Str(required=False, allow_none=True)
    descricao = fields.Str(required=False, allow_none=True)
    custo_sugerido = fields.Decimal(required=False, allow_none=True, default=0.0)
    preco_sugerido = fields.Decimal(required=False, allow_none=True, default=0.0)
    ativo = fields.Bool(required=False, default=True)

class PoliticaComercialRegraSchema(Schema):
    id = fields.Int(dump_only=True)
    politica_id = fields.Int(dump_only=True)
    tipo_item = fields.Str(required=True)
    referencia_id = fields.Int(required=False, allow_none=True)
    nome_item = fields.Str(required=False, allow_none=True)
    min_participantes = fields.Int(required=False, allow_none=True, default=1)
    max_participantes = fields.Int(required=False, allow_none=True, default=99999)
    valor_sugerido = fields.Decimal(required=True)
    tipo_calculo = fields.Str(required=False, allow_none=True, default='Fixo')
    prioridade = fields.Int(required=False, allow_none=True, default=1)
    mensagem_sugestao = fields.Str(required=False, allow_none=True)

class PoliticaComercialEventoSchema(Schema):
    id = fields.Int(dump_only=True)
    codigo = fields.Str(required=True)
    nome = fields.Str(required=True)
    tipo_evento = fields.Str(required=True)
    estado = fields.Str(required=False, allow_none=True, default='Ativa')
    data_inicio = fields.Date(required=False, allow_none=True)
    data_fim = fields.Date(required=False, allow_none=True)
    observacoes = fields.Str(required=False, allow_none=True)
    regras = fields.List(fields.Nested(PoliticaComercialRegraSchema), required=False)

class EventoItemSchema(Schema):
    id = fields.Int(dump_only=True)
    evento_id = fields.Int(dump_only=True)
    tipo_item = fields.Str(required=True)
    referencia_id = fields.Int(required=False, allow_none=True)
    produto_id = fields.Int(required=False, allow_none=True)
    
    descricao = fields.Str(required=True)
    quantidade = fields.Decimal(required=False, allow_none=True, default=1.0)
    unidade = fields.Str(required=False, allow_none=True, default='Unidade')
    preco_unitario = fields.Decimal(required=False, allow_none=True, default=0.0)
    percentual_desconto = fields.Decimal(required=False, allow_none=True, default=0.0)
    valor_desconto = fields.Decimal(required=False, allow_none=True, default=0.0)
    taxa_iva = fields.Decimal(required=False, allow_none=True, default=0.0)
    valor_iva = fields.Decimal(required=False, allow_none=True, default=0.0)
    subtotal = fields.Decimal(required=False, allow_none=True, default=0.0)
    total = fields.Decimal(required=False, allow_none=True, default=0.0)
    observacoes = fields.Str(required=False, allow_none=True)
    
    sugestao_politica_id = fields.Int(required=False, allow_none=True)
    sugestao_origem = fields.Str(required=False, allow_none=True)

class EspacoSchema(Schema):
    id = fields.Int(dump_only=True)
    nome = fields.Str(required=True)
    capacidade = fields.Int(required=True)
    localizacao = fields.Str(required=False, allow_none=True)
    descricao = fields.Str(required=False, allow_none=True)
    preco_aluguer = fields.Decimal(required=False, allow_none=True)
    estado = fields.Str(required=False, allow_none=True, default='Ativo')

class EventoServicoSchema(Schema):
    id = fields.Int(dump_only=True)
    tipo = fields.Str(required=True)
    descricao = fields.Str(required=False, allow_none=True)
    quantidade = fields.Decimal(required=True)
    valor_unitario = fields.Decimal(required=True)
    deslocacao = fields.Decimal(required=False, allow_none=True)
    subtotal = fields.Decimal(dump_only=True)
    observacoes = fields.Str(required=False, allow_none=True)

class ReservaEspacoSchema(Schema):
    id = fields.Int(dump_only=True)
    espaco_id = fields.Int(required=True)
    data_inicio = fields.DateTime(required=True)
    data_fim = fields.DateTime(required=True)
    valor_aluguer = fields.Decimal(required=False, allow_none=True)
    estado = fields.Str(dump_only=True)

class ReservaMaterialSchema(Schema):
    id = fields.Int(dump_only=True)
    material_id = fields.Int(required=True)
    quantidade = fields.Decimal(required=True)
    valor_unitario = fields.Decimal(required=False, allow_none=True)
    subtotal = fields.Decimal(dump_only=True)
    data_inicio = fields.DateTime(required=True)
    data_fim = fields.DateTime(required=True)
    estado = fields.Str(dump_only=True)

class EventoEquipaSchema(Schema):
    id = fields.Int(dump_only=True)
    utilizador_id = fields.Int(required=True)
    funcao = fields.Str(required=True)
    estado = fields.Str(dump_only=True)

class EventoSchema(Schema):
    id = fields.Int(dump_only=True)
    numero = fields.Str(dump_only=True)
    cliente_id = fields.Int(required=False, allow_none=True)
    pedido_id = fields.Int(required=False, allow_none=True)
    responsavel_id = fields.Int(required=False, allow_none=True)
    
    tipo_evento = fields.Str(required=True)
    titulo = fields.Str(required=True)
    descricao = fields.Str(required=False, allow_none=True)
    local_evento = fields.Str(required=False, allow_none=True)
    
    data_evento = fields.Date(required=True)
    hora_inicio = fields.Time(required=True)
    hora_fim = fields.Time(required=True)
    numero_convidados = fields.Int(required=True)
    numero_convidados_confirmados = fields.Int(required=False, allow_none=True)
    estado = fields.Str(required=False, default='Agendado')
    observacoes = fields.Str(required=False, allow_none=True)
    
    cobrar_iva_servicos = fields.Bool(required=False, allow_none=True, default=True)
    taxa_iva_servicos = fields.Decimal(required=False, allow_none=True, default=15.0)
    desconto_total = fields.Decimal(required=False, allow_none=True, default=0.0)
    valor_deslocacao = fields.Decimal(required=False, allow_none=True, default=0.0)
    outros_encargos = fields.Decimal(required=False, allow_none=True, default=0.0)

    valor_total = fields.Decimal(dump_only=True)
    valor_pago = fields.Decimal(required=False)
    saldo = fields.Decimal(dump_only=True)

    resumo_financeiro = fields.Method("get_resumo_financeiro", dump_only=True)

    def get_resumo_financeiro(self, obj):
        return obj.calcular_resumo_financeiro() if hasattr(obj, 'calcular_resumo_financeiro') else {}

    itens = fields.List(fields.Nested(EventoItemSchema), required=False)
    servicos = fields.List(fields.Nested(EventoServicoSchema), required=False)
    reservas_espaco = fields.List(fields.Nested(ReservaEspacoSchema), required=False)
    reservas_material = fields.List(fields.Nested(ReservaMaterialSchema), required=False)
    equipas = fields.List(fields.Nested(EventoEquipaSchema), required=False)

class AlterarEstadoEventoSchema(Schema):
    estado = fields.Str(required=True)


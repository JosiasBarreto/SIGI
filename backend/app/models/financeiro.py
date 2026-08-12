from enum import Enum
from app.core.database import db
from app.models.base import BaseModel

class FormaPagamento(BaseModel):
    __tablename__ = 'formas_pagamento'
    nome = db.Column(db.String(100), unique=True, nullable=False)
    ativo = db.Column(db.Boolean, default=True)

class EstadoPagamento(str, Enum):
    PENDENTE = 'Pendente'
    PARCIAL = 'Parcial'
    PAGO = 'Pago'
    CANCELADO = 'Cancelado'

class Pagamento(BaseModel):
    __tablename__ = 'pagamentos'
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=True)
    venda_id = db.Column(db.Integer, db.ForeignKey('vendas.id'), nullable=True)
    valor = db.Column(db.Numeric(12, 2), nullable=False)
    forma_pagamento_id = db.Column(db.Integer, db.ForeignKey('formas_pagamento.id'), nullable=False)
    estado = db.Column(db.Enum(EstadoPagamento), default=EstadoPagamento.PENDENTE)
    data_pagamento = db.Column(db.DateTime, nullable=True)
    referencia = db.Column(db.String(100), nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    codigo_transferencia = db.Column(db.String(100), nullable=True)
    emissor = db.Column(db.String(100), nullable=True)

class EstadoConta(str, Enum):
    ABERTA = 'Aberta'
    PARCIAL = 'Parcial'
    PAGA = 'Paga'
    ATRASADA = 'Atrasada'

class ContaReceber(BaseModel):
    __tablename__ = 'contas_receber'
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=True)
    venda_id = db.Column(db.Integer, db.ForeignKey('vendas.id'), nullable=True)
    valor_original = db.Column(db.Numeric(12, 2), nullable=False)
    valor_pago = db.Column(db.Numeric(12, 2), default=0)
    saldo = db.Column(db.Numeric(12, 2), nullable=False)
    vencimento = db.Column(db.Date, nullable=False)
    estado = db.Column(db.Enum(EstadoConta), default=EstadoConta.ABERTA)

class ContaPagar(BaseModel):
    __tablename__ = 'contas_pagar'
    fornecedor_id = db.Column(db.Integer, db.ForeignKey('fornecedores.id'), nullable=True)
    descricao = db.Column(db.String(255), nullable=False)
    valor = db.Column(db.Numeric(12, 2), nullable=False)
    vencimento = db.Column(db.Date, nullable=False)
    estado = db.Column(db.Enum(EstadoConta), default=EstadoConta.ABERTA)

class CategoriaReceita(str, Enum):
    VENDA = 'Venda'
    EVENTO = 'Evento'
    ALUGUER = 'Aluguer'
    SERVICO = 'Servico'
    OUTROS = 'Outros'

class Receita(BaseModel):
    __tablename__ = 'receitas'
    categoria = db.Column(db.Enum(CategoriaReceita), nullable=False)
    valor = db.Column(db.Numeric(12, 2), nullable=False)
    descricao = db.Column(db.String(255), nullable=True)
    data_receita = db.Column(db.Date, nullable=False)

class CategoriaDespesa(str, Enum):
    FORNECEDOR = 'Fornecedor'
    COMBUSTIVEL = 'Combustivel'
    SALARIO = 'Salario'
    ENERGIA = 'Energia'
    AGUA = 'Agua'
    INTERNET = 'Internet'
    MANUTENCAO = 'Manutencao'
    OUTROS = 'Outros'

class CentroCusto(BaseModel):
    __tablename__ = 'centros_custo'
    nome = db.Column(db.String(100), unique=True, nullable=False)

class Despesa(BaseModel):
    __tablename__ = 'despesas'
    categoria = db.Column(db.Enum(CategoriaDespesa), nullable=False)
    valor = db.Column(db.Numeric(12, 2), nullable=False)
    descricao = db.Column(db.String(255), nullable=True)
    data_despesa = db.Column(db.Date, nullable=False)
    centro_custo_id = db.Column(db.Integer, db.ForeignKey('centros_custo.id'), nullable=True)

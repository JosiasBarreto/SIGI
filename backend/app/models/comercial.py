from enum import Enum
from app.core.database import db
from app.models.base import BaseModel
from datetime import datetime

class TipoDocumento(str, Enum):
    FT = 'FT'
    FR = 'FR'
    PROFORMA = 'PROFORMA'
    NC = 'NC'
    ND = 'ND'

class EstadoVenda(str, Enum):
    PENDENTE = 'Pendente'
    PARCIALMENTE_PAGO = 'Parcialmente Pago'
    PAGO = 'Pago'
    CANCELADO = 'Cancelado'

class TaxaIVA(BaseModel):
    __tablename__ = 'taxas_iva'
    descricao = db.Column(db.String(50), nullable=False)
    percentagem = db.Column(db.Numeric(5, 2), nullable=False)
    ativo = db.Column(db.Boolean, default=True)

class SerieDocumento(BaseModel):
    __tablename__ = 'series_documento'
    tipo_documento = db.Column(db.Enum(TipoDocumento), nullable=False)
    ano = db.Column(db.Integer, nullable=False)
    ultimo_numero = db.Column(db.Integer, default=0)

class Venda(BaseModel):
    __tablename__ = 'vendas'
    numero_documento = db.Column(db.String(50), unique=True, nullable=False)
    tipo_documento = db.Column(db.Enum(TipoDocumento), nullable=False)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=True)
    
    subtotal = db.Column(db.Numeric(12, 2), default=0)
    desconto_total = db.Column(db.Numeric(12, 2), default=0)
    base_tributavel = db.Column(db.Numeric(12, 2), default=0)
    total_iva = db.Column(db.Numeric(12, 2), default=0)
    total = db.Column(db.Numeric(12, 2), default=0)
    
    valor_pago = db.Column(db.Numeric(12, 2), default=0)
    saldo = db.Column(db.Numeric(12, 2), default=0)
    
    estado = db.Column(db.Enum(EstadoVenda), default=EstadoVenda.PENDENTE)
    observacoes = db.Column(db.Text, nullable=True)
    criado_por = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    itens = db.relationship('VendaItem', backref='venda', lazy='selectin', cascade='all, delete-orphan')
    pagamentos = db.relationship('Pagamento', backref='venda_rel', lazy='selectin')
    contas_receber = db.relationship('ContaReceber', backref='venda_rel', lazy='selectin')

class VendaItem(BaseModel):
    __tablename__ = 'venda_itens'
    venda_id = db.Column(db.Integer, db.ForeignKey('vendas.id'), nullable=False)
    item_tipo = db.Column(db.String(50), nullable=False) # 'Produto', 'Servico', 'Aluguer', etc.
    item_id = db.Column(db.Integer, nullable=True) # ForeignKey could vary, thus Integer
    descricao = db.Column(db.String(255), nullable=False)
    quantidade = db.Column(db.Numeric(10, 2), nullable=False)
    preco_unitario = db.Column(db.Numeric(12, 2), nullable=False)
    desconto = db.Column(db.Numeric(12, 2), default=0)
    
    taxa_iva_id = db.Column(db.Integer, db.ForeignKey('taxas_iva.id'), nullable=True)
    taxa_iva = db.Column(db.Numeric(5, 2), default=0)
    valor_iva = db.Column(db.Numeric(12, 2), default=0)
    
    subtotal = db.Column(db.Numeric(12, 2), nullable=False)
    total = db.Column(db.Numeric(12, 2), nullable=False)

class FechoDiario(BaseModel):
    __tablename__ = 'fechos_diarios'
    data = db.Column(db.Date, unique=True, nullable=False)
    total_vendas = db.Column(db.Numeric(12, 2), default=0)
    total_recebido = db.Column(db.Numeric(12, 2), default=0)
    total_despesas = db.Column(db.Numeric(12, 2), default=0)
    total_caixas = db.Column(db.Numeric(12, 2), default=0)
    observacoes = db.Column(db.Text, nullable=True)
    criado_por = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

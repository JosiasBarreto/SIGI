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
    _cliente_id = db.Column('cliente_id', db.Integer, db.ForeignKey('clientes.id'), nullable=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=True)
    
    _subtotal = db.Column('subtotal', db.Numeric(12, 2), default=0, nullable=True)
    _desconto_total = db.Column('desconto_total', db.Numeric(12, 2), default=0, nullable=True)
    _base_tributavel = db.Column('base_tributavel', db.Numeric(12, 2), default=0, nullable=True)
    _total_iva = db.Column('total_iva', db.Numeric(12, 2), default=0, nullable=True)
    _total = db.Column('total', db.Numeric(12, 2), default=0, nullable=True)
    
    _valor_pago = db.Column('valor_pago', db.Numeric(12, 2), default=0, nullable=True)
    _saldo = db.Column('saldo', db.Numeric(12, 2), default=0, nullable=True)
    _cliente_id = db.Column('cliente_id', db.Integer, db.ForeignKey('clientes.id'), nullable=True)
    
    estado = db.Column(db.Enum(EstadoVenda), default=EstadoVenda.PENDENTE)
    observacoes = db.Column(db.Text, nullable=True)
    criado_por = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    itens = db.relationship('VendaItem', backref='venda', lazy='selectin', cascade='all, delete-orphan')

    # Link back to Pedido (already implicitly backreffed by Venda in some places, but good to have explicit property)
    @property
    def pedido(self):
        from app.models.pedido import Pedido
        if not self.pedido_id: return None
        return Pedido.query.get(self.pedido_id)

    @property
    def cliente_id(self):
        return self._cliente_id or (self.pedido.cliente_id if self.pedido else None)
    @cliente_id.setter
    def cliente_id(self, value):
        self._cliente_id = value

    @property
    def subtotal(self):
        return self._subtotal if self._subtotal is not None else (self.pedido.subtotal if self.pedido else 0)
    @subtotal.setter
    def subtotal(self, value): self._subtotal = value

    @property
    def desconto_total(self):
        return self._desconto_total if self._desconto_total is not None else (self.pedido.desconto_total if self.pedido else 0)
    @desconto_total.setter
    def desconto_total(self, value): self._desconto_total = value

    @property
    def base_tributavel(self):
        return self._base_tributavel if self._base_tributavel is not None else (self.pedido.base_tributavel if self.pedido else 0)
    @base_tributavel.setter
    def base_tributavel(self, value): self._base_tributavel = value

    @property
    def total_iva(self):
        return self._total_iva if self._total_iva is not None else (self.pedido.total_iva if self.pedido else 0)
    @total_iva.setter
    def total_iva(self, value): self._total_iva = value

    @property
    def total(self):
        return self._total if self._total is not None else (self.pedido.valor_total if self.pedido else 0)
    @total.setter
    def total(self, value): self._total = value

    @property
    def valor_pago(self):
        return self._valor_pago if self._valor_pago is not None else (self.pedido.valor_pago if self.pedido else 0)
    @valor_pago.setter
    def valor_pago(self, value): self._valor_pago = value

    @property
    def saldo(self):
        return self._saldo if self._saldo is not None else (self.pedido.saldo if self.pedido else 0)
    @saldo.setter
    def saldo(self, value): self._saldo = value
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

from app.core.database import db
from app.models.base import BaseModel
from app.models.produto import Produto

class ReceitaProducao(BaseModel):
    __tablename__ = 'receitas_producao'

    produto_acabado_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False, unique=True)
    descricao = db.Column(db.Text, nullable=True)
    tempo_preparacao = db.Column(db.Integer, nullable=True) # em minutos
    rendimento_unidades = db.Column(db.Numeric(10, 2), default=1)
    
    # Valores calculados
    custo_total = db.Column(db.Numeric(10, 2), default=0)
    custo_unitario = db.Column(db.Numeric(10, 2), default=0)
    margem_lucro = db.Column(db.Numeric(10, 2), default=0)
    rentabilidade = db.Column(db.Numeric(10, 2), default=0)

    ativo = db.Column(db.Boolean, default=True)

    produto_acabado = db.relationship('Produto', backref='receita_associada')
    itens = db.relationship('ReceitaItem', backref='receita', cascade="all, delete-orphan", lazy=True)

    def recalcular_custos(self):
        custo = 0
        for item in self.itens:
            # fetch preco_compra directly from relation
            custo_item = float(item.consumivel.preco_compra or 0) * float(item.quantidade)
            item.custo_calculado = custo_item
            custo += custo_item
            
        self.custo_total = custo
        rendimento = float(self.rendimento_unidades or 1)
        if rendimento <= 0:
            rendimento = 1
        self.custo_unitario = custo / rendimento
        
        produto = self.produto_acabado
        if produto and float(produto.preco_venda or 0) > 0:
            pv = float(produto.preco_venda)
            self.margem_lucro = pv - self.custo_unitario
            self.rentabilidade = (self.margem_lucro / pv) * 100
        else:
            self.margem_lucro = 0
            self.rentabilidade = 0
            
        # Update also product's own cost if needed, but requirements say "custo da receita".
        if produto:
            produto.preco_compra = self.custo_unitario

class ReceitaItem(db.Model):
    __tablename__ = 'receita_itens'

    id = db.Column(db.Integer, primary_key=True)
    receita_id = db.Column(db.Integer, db.ForeignKey('receitas_producao.id'), nullable=False)
    produto_consumivel_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=False) # MUST BE CONSUMIVEL
    quantidade = db.Column(db.Numeric(10, 3), nullable=False)
    
    # Cached
    custo_calculado = db.Column(db.Numeric(10, 2), default=0)
    observacao = db.Column(db.String(255), nullable=True)

    consumivel = db.relationship('Produto', foreign_keys=[produto_consumivel_id])

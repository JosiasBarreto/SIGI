from enum import Enum
from app.core.database import db
from app.models.base import BaseModel

class TipoMovimento(str, Enum):
    ENTRADA = 'Entrada'
    SAIDA = 'Saida'
    AJUSTE = 'Ajuste'
    DEVOLUCAO = 'Devolucao'
    PERDA = 'Perda'
    DANIFICADO = 'Danificado'

class OrigemMovimento(str, Enum):
    ARMAZEM = 'Armazem'
    REQUISICAO = 'Requisicao'
    DEVOLUCAO = 'Devolucao'
    COMPRA = 'Compra'
    AJUSTE = 'Ajuste'
    VENDA = 'Venda'

class EntidadeMovimento(str, Enum):
    INGREDIENTE = 'Ingrediente'
    PRODUTO = 'Produto'
    MATERIAL = 'Material'

class MovimentoStock(BaseModel):
    __tablename__ = 'movimentacoes_armazem'

    tipo = db.Column(db.Enum(TipoMovimento), nullable=False)
    origem = db.Column(db.Enum(OrigemMovimento), nullable=False)
    entidade_tipo = db.Column(db.Enum(EntidadeMovimento), nullable=False)
    referencia_id = db.Column(db.Integer, nullable=False) # ID of Ingrediente/Produto/Material
    
    quantidade = db.Column(db.Numeric(10, 3), nullable=False)
    justificacao = db.Column(db.String(255), nullable=True)

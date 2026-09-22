from enum import Enum
from app.core.database import db
from app.models.base import BaseModel


class EstadoQuarentena(str, Enum):
    QUARENTENA = 'Quarentena'
    DESCARTADO = 'Descartado'
    REINTEGRADO = 'Reintegrado'


class QuarentenaItem(BaseModel):
    __tablename__ = 'quarentena_itens'

    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materiais.id'), nullable=True)
    armazem_id = db.Column(db.Integer, db.ForeignKey('armazens.id'), nullable=False)
    quantidade = db.Column(db.Numeric(10, 3), nullable=False)
    motivo = db.Column(db.String(120), nullable=False)
    lote = db.Column(db.String(100), nullable=True)
    validade = db.Column(db.Date, nullable=True)
    observacao = db.Column(db.Text, nullable=True)
    responsavel_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    estado = db.Column(db.Enum(EstadoQuarentena), nullable=False, default=EstadoQuarentena.QUARENTENA)
    resolvido_em = db.Column(db.DateTime, nullable=True)
    justificativa_resolucao = db.Column(db.Text, nullable=True)

    produto = db.relationship('Produto')
    material = db.relationship('Material')
    armazem = db.relationship('Armazem')
    responsavel = db.relationship('User')

    def to_dict(self):
        item = self.produto or self.material
        return {
            'id': str(self.id), 'item_id': self.produto_id or self.material_id,
            'tipo_item': 'Produto' if self.produto_id else 'Material',
            'codigo': getattr(item, 'codigo', ''), 'nome': getattr(item, 'nome', ''),
            'armazem_id': self.armazem_id, 'armazem_nome': self.armazem.nome if self.armazem else '',
            'quantidade': float(self.quantidade), 'unidade_medida': getattr(getattr(item, 'unidade_medida', None), 'sigla', 'UN'),
            'lote': self.lote, 'validade': self.validade.isoformat() if self.validade else None,
            'motivo': self.motivo, 'observacao': self.observacao,
            'data_bloqueio': self.created_at.isoformat() if self.created_at else None,
            'responsavel': self.responsavel.name if self.responsavel else '', 'status': self.estado.value,
        }

from enum import Enum
from app.core.database import db
from app.models.base import BaseModel
from datetime import datetime, date

class TipoInventario(str, Enum):
    COMPLETO = 'COMPLETO'
    PARCIAL = 'PARCIAL'

class EstadoInventario(str, Enum):
    RASCUNHO = 'RASCUNHO'
    EM_CONTAGEM = 'EM_CONTAGEM'
    EM_CONFERENCIA = 'EM_CONFERENCIA'
    APROVADO = 'APROVADO'
    APLICADO = 'APLICADO'
    CANCELADO = 'CANCELADO'

class SituacaoDivergencia(str, Enum):
    SEM_DIVERGENCIA = 'SEM_DIVERGENCIA'
    FALTA = 'FALTA'
    SOBRA = 'SOBRA'
    NAO_CONTADO = 'NAO_CONTADO'

class MotivoAjusteInventario(str, Enum):
    QUEBRA = 'QUEBRA'
    PERDA = 'PERDA'
    DANIFICADO = 'DANIFICADO'
    CONSUMO_NAO_REGISTADO = 'CONSUMO_NAO_REGISTADO'
    ERRO_CONTAGEM = 'ERRO_CONTAGEM'
    ERRO_REGISTO = 'ERRO_REGISTO'
    VALIDACAO_INVENTARIO = 'VALIDACAO_INVENTARIO'
    OUTRO = 'OUTRO'

class Inventario(BaseModel):
    __tablename__ = 'inventarios'

    numero = db.Column(db.String(50), unique=True, nullable=False, index=True)
    armazem_id = db.Column(db.Integer, db.ForeignKey('armazens.id'), nullable=False)
    tipo = db.Column(db.Enum(TipoInventario), default=TipoInventario.COMPLETO, nullable=False)
    estado = db.Column(db.Enum(EstadoInventario), default=EstadoInventario.RASCUNHO, nullable=False, index=True)
    data_inventario = db.Column(db.Date, default=date.today, nullable=False)
    
    responsavel_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    observacao = db.Column(db.Text, nullable=True)

    # Datas de ciclo de vida
    iniciado_em = db.Column(db.DateTime, nullable=True)
    finalizado_em = db.Column(db.DateTime, nullable=True)
    
    aprovado_em = db.Column(db.DateTime, nullable=True)
    aprovado_por = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    aplicado_em = db.Column(db.DateTime, nullable=True)
    aplicado_por = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    cancelado_em = db.Column(db.DateTime, nullable=True)
    cancelado_por = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    motivo_cancelamento = db.Column(db.String(255), nullable=True)

    # Relacionamentos
    armazem = db.relationship('Armazem', foreign_keys=[armazem_id])
    responsavel = db.relationship('User', foreign_keys=[responsavel_id])
    aprovador = db.relationship('User', foreign_keys=[aprovado_por])
    aplicador = db.relationship('User', foreign_keys=[aplicado_por])
    cancelador = db.relationship('User', foreign_keys=[cancelado_por])

    items = db.relationship('InventarioItem', back_populates='inventario', cascade="all, delete-orphan", lazy=True)

    def to_dict(self, include_resumo=True):
        res = {
            "id": self.id,
            "numero": self.numero,
            "armazem_id": self.armazem_id,
            "armazem": self.armazem.nome if self.armazem else None,
            "armazem_codigo": self.armazem.codigo if self.armazem else None,
            "tipo": self.tipo.value if hasattr(self.tipo, 'value') else str(self.tipo),
            "estado": self.estado.value if hasattr(self.estado, 'value') else str(self.estado),
            "data_inventario": self.data_inventario.isoformat() if self.data_inventario else None,
            "responsavel_id": self.responsavel_id,
            "responsavel": self.responsavel.name if self.responsavel else None,
            "observacao": self.observacao,
            "iniciado_em": self.iniciado_em.isoformat() if self.iniciado_em else None,
            "finalizado_em": self.finalizado_em.isoformat() if self.finalizado_em else None,
            "aprovado_em": self.aprovado_em.isoformat() if self.aprovado_em else None,
            "aprovado_por": self.aprovador.name if self.aprovador else None,
            "aplicado_em": self.aplicado_em.isoformat() if self.aplicado_em else None,
            "aplicado_por": self.aplicador.name if self.aplicador else None,
            "cancelado_em": self.cancelado_em.isoformat() if self.cancelado_em else None,
            "cancelado_por": self.cancelador.name if self.cancelador else None,
            "motivo_cancelamento": self.motivo_cancelamento,
            "created_at": self.created_at.isoformat() if hasattr(self, 'created_at') and self.created_at else None,
            "updated_at": self.updated_at.isoformat() if hasattr(self, 'updated_at') and self.updated_at else None,
        }
        if include_resumo:
            res["resumo"] = self.calcular_resumo()
        return res

    def calcular_resumo(self):
        total_itens = len(self.items)
        itens_contados = 0
        itens_sem_divergencia = 0
        itens_com_falta = 0
        itens_com_sobra = 0
        quantidade_falta = 0.0
        quantidade_sobra = 0.0
        valor_estimado_falta = 0.0
        valor_estimado_sobra = 0.0

        for it in self.items:
            if it.quantidade_contada is not None:
                itens_contados += 1
                diff = float(it.diferenca or 0.0)
                unit_price = it.obter_preco_unitario()

                if diff == 0.0:
                    itens_sem_divergencia += 1
                elif diff < 0.0:
                    itens_com_falta += 1
                    qtd_abs = abs(diff)
                    quantidade_falta += qtd_abs
                    valor_estimado_falta += qtd_abs * unit_price
                else:
                    itens_com_sobra += 1
                    quantidade_sobra += diff
                    valor_estimado_sobra += diff * unit_price

        return {
            "total_itens": total_itens,
            "itens_contados": itens_contados,
            "itens_nao_contados": total_itens - itens_contados,
            "itens_sem_divergencia": itens_sem_divergencia,
            "itens_com_falta": itens_com_falta,
            "itens_com_sobra": itens_com_sobra,
            "quantidade_falta": round(quantidade_falta, 3),
            "quantidade_sobra": round(quantidade_sobra, 3),
            "valor_estimado_falta": round(valor_estimado_falta, 2),
            "valor_estimado_sobra": round(valor_estimado_sobra, 2),
            "percentagem_concluida": round((itens_contados / total_itens * 100), 1) if total_itens > 0 else 0.0
        }


class InventarioItem(BaseModel):
    __tablename__ = 'inventario_items'

    inventario_id = db.Column(db.Integer, db.ForeignKey('inventarios.id', ondelete='CASCADE'), nullable=False, index=True)
    
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=True, index=True)
    material_id = db.Column(db.Integer, db.ForeignKey('materiais.id'), nullable=True, index=True)
    unidade_medida_id = db.Column(db.Integer, db.ForeignKey('unidades_medida.id'), nullable=True)

    # Snapshot imutável no momento em que o inventário foi iniciado
    quantidade_sistema = db.Column(db.Numeric(12, 3), nullable=False, default=0.0)
    
    # Preenchido durante a contagem
    quantidade_contada = db.Column(db.Numeric(12, 3), nullable=True)
    
    # Calculado estritamente pelo backend: quantidade_contada - quantidade_sistema
    diferenca = db.Column(db.Numeric(12, 3), nullable=True)
    
    situacao = db.Column(db.Enum(SituacaoDivergencia), default=SituacaoDivergencia.NAO_CONTADO, nullable=False, index=True)
    motivo_ajuste = db.Column(db.Enum(MotivoAjusteInventario), nullable=True)
    observacao = db.Column(db.Text, nullable=True)

    contado_por = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    contado_em = db.Column(db.DateTime, nullable=True)

    # Relacionamentos
    inventario = db.relationship('Inventario', back_populates='items')
    produto = db.relationship('Produto')
    material = db.relationship('Material')
    unidade_medida = db.relationship('UnidadeMedida')
    contador = db.relationship('User', foreign_keys=[contado_por])

    def obter_nome(self):
        if self.produto:
            return self.produto.nome
        if self.material:
            return self.material.nome
        return "Item Desconhecido"

    def obter_codigo(self):
        if self.produto:
            return self.produto.codigo
        if self.material:
            return self.material.codigo
        return ""

    def obter_tipo_item(self):
        if self.produto:
            return "Produto"
        if self.material:
            return "Material"
        return "N/A"

    def obter_unidade_sigla(self):
        if self.unidade_medida:
            return self.unidade_medida.sigla
        if self.produto and self.produto.unidade_medida:
            return self.produto.unidade_medida.sigla
        if self.material and self.material.unidade_medida:
            return self.material.unidade_medida.sigla
        return "UN"

    def obter_preco_unitario(self):
        if self.produto:
            return float(self.produto.preco_compra or self.produto.preco_venda or 0.0)
        if self.material:
            return float(self.material.valor_unitario or 0.0)
        return 0.0

    def to_dict(self):
        return {
            "id": self.id,
            "inventario_id": self.inventario_id,
            "produto_id": self.produto_id,
            "material_id": self.material_id,
            "tipo_item": self.obter_tipo_item(),
            "codigo": self.obter_codigo(),
            "nome": self.obter_nome(),
            "unidade": self.obter_unidade_sigla(),
            "unidade_medida_id": self.unidade_medida_id,
            "quantidade_sistema": float(self.quantidade_sistema or 0.0),
            "quantidade_contada": float(self.quantidade_contada) if self.quantidade_contada is not None else None,
            "diferenca": float(self.diferenca) if self.diferenca is not None else None,
            "situacao": self.situacao.value if hasattr(self.situacao, 'value') else str(self.situacao),
            "motivo_ajuste": self.motivo_ajuste.value if self.motivo_ajuste and hasattr(self.motivo_ajuste, 'value') else (str(self.motivo_ajuste) if self.motivo_ajuste else None),
            "observacao": self.observacao,
            "contado_por_id": self.contado_por,
            "contado_por": self.contador.name if self.contador else None,
            "contado_em": self.contado_em.isoformat() if self.contado_em else None,
            "preco_unitario": self.obter_preco_unitario(),
            "valor_diferenca": round(float(self.diferenca or 0.0) * self.obter_preco_unitario(), 2) if self.diferenca is not None else 0.0
        }

from app.core.database import db
from app.models.base import BaseModel


class CategoriaProduto(BaseModel):
    __tablename__ = "categorias_produto"

    nome = db.Column(
        db.String(100),
        nullable=False
    )

    descricao = db.Column(db.Text, nullable=True)

    grupo_id = db.Column(
        db.Integer,
        db.ForeignKey(
            "grupos_categoria.id",
            ondelete="RESTRICT"
        ),
        nullable=False,
        index=True
    )

    ativo = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    grupo = db.relationship("GrupoCategoria", back_populates="categorias")

    produtos = db.relationship("Produto", back_populates="categoria_rel")
    materiais = db.relationship("Material", back_populates="categoria_rel")

    __table_args__ = (
        db.UniqueConstraint("grupo_id", "nome", name="uq_categorias_produto_grupo_nome"),
    )

    

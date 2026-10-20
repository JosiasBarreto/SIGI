from app.core.database import db
from app.models.base import BaseModel


class GrupoCategoria(BaseModel):
    __tablename__ = "grupos_categoria"

    # Context is deliberately stored on the group, rather than copied on each
    # category.  This makes categories with the same name distinct while
    # keeping the compatibility rule in one place.
    contexto = db.Column(db.String(30), nullable=False, index=True)

    nome = db.Column(db.String(100), nullable=False)

    descricao = db.Column(db.Text, nullable=True)

    ativo = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    categorias = db.relationship(
        "CategoriaProduto", back_populates="grupo", lazy=True
    )

    __table_args__ = (
        db.UniqueConstraint("nome", "contexto", name="uq_grupos_categoria_nome_contexto"),
    )
    

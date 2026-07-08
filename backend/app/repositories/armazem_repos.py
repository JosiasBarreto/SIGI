from app.models.fornecedor import Fornecedor
from app.models.ingrediente import Ingrediente
from app.models.produto import Produto
from app.models.material import Material
from app.models.movimento_stock import MovimentoStock
from app.models.categoria_produto import CategoriaProduto
from app.models.unidade_medida import UnidadeMedida
from app.models.armazem import Armazem, ProdutoStockArmazem, IngredienteStockArmazem, MaterialStockArmazem
from app.repositories.base_repository import BaseRepository

class CategoriaProdutoRepository(BaseRepository[CategoriaProduto]):
    def __init__(self):
        super().__init__(CategoriaProduto)

class UnidadeMedidaRepository(BaseRepository[UnidadeMedida]):
    def __init__(self):
        super().__init__(UnidadeMedida)

class FornecedorRepository(BaseRepository[Fornecedor]):
    def __init__(self):
        super().__init__(Fornecedor)

class IngredienteRepository(BaseRepository[Ingrediente]):
    def __init__(self):
        super().__init__(Ingrediente)

class ProdutoRepository(BaseRepository[Produto]):
    def __init__(self):
        super().__init__(Produto)

class MaterialRepository(BaseRepository[Material]):
    def __init__(self):
        super().__init__(Material)

class MovimentoStockRepository(BaseRepository[MovimentoStock]):
    def __init__(self):
        super().__init__(MovimentoStock)

class ArmazemRepository(BaseRepository[Armazem]):
    def __init__(self):
        super().__init__(Armazem)

class ProdutoStockArmazemRepository(BaseRepository[ProdutoStockArmazem]):
    def __init__(self):
        super().__init__(ProdutoStockArmazem)

class IngredienteStockArmazemRepository(BaseRepository[IngredienteStockArmazem]):
    def __init__(self):
        super().__init__(IngredienteStockArmazem)

class MaterialStockArmazemRepository(BaseRepository[MaterialStockArmazem]):
    def __init__(self):
        super().__init__(MaterialStockArmazem)


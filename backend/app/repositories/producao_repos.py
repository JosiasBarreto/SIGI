from app.models.ficha_tecnica import FichaTecnica, FichaTecnicaItem
from app.models.ordem_producao import OrdemProducao, ConsumoIngrediente
from app.models.reserva import ReservaIngrediente
from app.repositories.base_repository import BaseRepository

class FichaTecnicaRepository(BaseRepository[FichaTecnica]):
    def __init__(self):
        super().__init__(FichaTecnica)

class FichaTecnicaItemRepository(BaseRepository[FichaTecnicaItem]):
    def __init__(self):
        super().__init__(FichaTecnicaItem)

class OrdemProducaoRepository(BaseRepository[OrdemProducao]):
    def __init__(self):
        super().__init__(OrdemProducao)

class ConsumoIngredienteRepository(BaseRepository[ConsumoIngrediente]):
    def __init__(self):
        super().__init__(ConsumoIngrediente)

class ReservaIngredienteRepository(BaseRepository[ReservaIngrediente]):
    def __init__(self):
        super().__init__(ReservaIngrediente)

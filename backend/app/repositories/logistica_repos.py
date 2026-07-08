from app.models.logistica import Motorista, Viatura, Entrega
from app.repositories.base_repository import BaseRepository

class MotoristaRepository(BaseRepository[Motorista]):
    def __init__(self):
        super().__init__(Motorista)

class ViaturaRepository(BaseRepository[Viatura]):
    def __init__(self):
        super().__init__(Viatura)

class EntregaRepository(BaseRepository[Entrega]):
    def __init__(self):
        super().__init__(Entrega)

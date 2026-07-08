from app.models.evento import Evento, Espaco
from app.repositories.base_repository import BaseRepository

class EventoRepository(BaseRepository[Evento]):
    def __init__(self):
        super().__init__(Evento)

class EspacoRepository(BaseRepository[Espaco]):
    def __init__(self):
        super().__init__(Espaco)

from app.models.requisicao import Requisicao, OcorrenciaMaterial
from app.repositories.base_repository import BaseRepository

class RequisicaoRepository(BaseRepository[Requisicao]):
    def __init__(self):
        super().__init__(Requisicao)

class OcorrenciaMaterialRepository(BaseRepository[OcorrenciaMaterial]):
    def __init__(self):
        super().__init__(OcorrenciaMaterial)

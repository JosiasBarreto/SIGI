from app.repositories.base_repository import BaseRepository
from app.models.comercial import Venda, TaxaIVA, SerieDocumento, VendaItem, FechoDiario

class VendaRepository(BaseRepository):
    def __init__(self):
        super().__init__(Venda)

class VendaItemRepository(BaseRepository):
    def __init__(self):
        super().__init__(VendaItem)

class TaxaIVARepository(BaseRepository):
    def __init__(self):
        super().__init__(TaxaIVA)

class SerieDocumentoRepository(BaseRepository):
    def __init__(self):
        super().__init__(SerieDocumento)

class FechoDiarioRepository(BaseRepository):
    def __init__(self):
        super().__init__(FechoDiario)

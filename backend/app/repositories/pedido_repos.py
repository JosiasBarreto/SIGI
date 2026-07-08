from app.models.cliente import Cliente
from app.models.pedido import Pedido
from app.models.item_pedido import ItemPedido
from app.repositories.base_repository import BaseRepository

class ClienteRepository(BaseRepository[Cliente]):
    def __init__(self):
        super().__init__(Cliente)

class PedidoRepository(BaseRepository[Pedido]):
    def __init__(self):
        super().__init__(Pedido)

class ItemPedidoRepository(BaseRepository[ItemPedido]):
    def __init__(self):
        super().__init__(ItemPedido)

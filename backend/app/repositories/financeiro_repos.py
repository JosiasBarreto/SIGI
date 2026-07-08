from app.models.caixa import Caixa, MovimentoCaixa
from app.models.financeiro import FormaPagamento, Pagamento, ContaReceber, ContaPagar, Receita, Despesa, CentroCusto
from app.repositories.base_repository import BaseRepository

class CaixaRepository(BaseRepository[Caixa]):
    def __init__(self):
        super().__init__(Caixa)

class MovimentoCaixaRepository(BaseRepository[MovimentoCaixa]):
    def __init__(self):
        super().__init__(MovimentoCaixa)

class ContaReceberRepository(BaseRepository[ContaReceber]):
    def __init__(self):
        super().__init__(ContaReceber)

class ContaPagarRepository(BaseRepository[ContaPagar]):
    def __init__(self):
        super().__init__(ContaPagar)

class ReceitaRepository(BaseRepository[Receita]):
    def __init__(self):
        super().__init__(Receita)

class DespesaRepository(BaseRepository[Despesa]):
    def __init__(self):
        super().__init__(Despesa)

from enum import Enum
from app.core.database import db
from app.models.base import BaseModel

class TipoEvento(str, Enum):
    CASAMENTO = 'Casamento'
    ANIVERSARIO = 'Aniversario'
    BATIZADO = 'Batizado'
    EMPRESARIAL = 'Empresarial'
    CATERING = 'Catering'
    FORMATURA = 'Formatura'
    CONFERENCIA = 'Conferencia'
    COCKTAIL = 'Cocktail'
    FUNERAL = 'Funeral'
    OUTRO = 'Outro'

class EstadoEvento(str, Enum):
    RASCUNHO = 'Rascunho'
    ORCAMENTO = 'Orcamento'
    ORCAMENTADO = 'Orcamentado'
    AGUARDANDO_APROVACAO = 'Aguardando Aprovacao'
    AGENDADO = 'Agendado'
    CONFIRMADO = 'Confirmado'
    PLANEAMENTO_GERADO = 'Planeamento Gerado'
    EM_PREPARACAO = 'Em Preparacao'
    EM_EXECUCAO = 'Em Execucao'
    CONCLUIDO = 'Concluido'
    FATURADO = 'Faturado'
    ENCERRADO = 'Encerrado'
    CANCELADO = 'Cancelado'
    ARQUIVADO = 'Arquivado'

class TipoItemEvento(str, Enum):
    SERVICO = 'Servico'
    ESPACO = 'Espaco'
    MATERIAL = 'Material'
    PRODUTO = 'Produto'
    DESLOCACAO = 'Deslocacao'
    MAO_DE_OBRA = 'MaoDeObra'
    OUTRO = 'Outro'

class TipoCalculoPolitica(str, Enum):
    FIXO = 'Fixo'
    POR_PARTICIPANTE = 'Por Participante'
    POR_HORA = 'Por Hora'
    POR_DIA = 'Por Dia'
    POR_UNIDADE = 'Por Unidade'

class TipoServicoEvento(str, Enum):
    COZINHA = 'Cozinha'
    PASTELARIA = 'Pastelaria'
    BAR = 'Bar'
    LOGISTICA = 'Logistica'
    ALUGUER = 'Aluguer'
    LIMPEZA = 'Limpeza'
    SEGURANCA = 'Seguranca'
    ORNAMENTACAO = 'Ornamentacao'
    DECORACAO = 'Decoracao'
    EMPREGADOS_MESA = 'Empregados de mesa'
    BARTENDERS = 'Bartenders'
    COZINHEIROS = 'Cozinheiros'
    MOTORISTAS = 'Motoristas'
    OUTRO = 'Outro'

class EstadoEspaco(str, Enum):
    ATIVO = 'Ativo'
    INATIVO = 'Inativo'

class EstadoReservaEspaco(str, Enum):
    RESERVADO = 'Reservado'
    UTILIZADO = 'Utilizado'
    FINALIZADO = 'Finalizado'
    CANCELADO = 'Cancelado'

class FuncaoEquipa(str, Enum):
    CHEFE_COZINHA = 'Chefe Cozinha'
    COZINHEIRO = 'Cozinheiro'
    PASTELEIRO = 'Pasteleiro'
    ATENDIMENTO = 'Atendimento'
    BAR = 'Bar'
    MOTORISTA = 'Motorista'
    SUPERVISOR = 'Supervisor'

# CADASTROS DE REFERÊNCIA (NUNCA FORÇAM PREÇOS)
class ServicoCadastro(BaseModel):
    __tablename__ = 'servicos_cadastro'
    codigo = db.Column(db.String(50), unique=True, nullable=True)
    nome = db.Column(db.String(100), nullable=False)
    categoria = db.Column(db.String(100), nullable=True)
    descricao = db.Column(db.Text, nullable=True)
    unidade_padrao = db.Column(db.String(50), default='Unidade')
    preco_sugerido = db.Column(db.Numeric(10, 2), default=0.0)
    ativo = db.Column(db.Boolean, default=True)

class TipoEventoCadastro(BaseModel):
    __tablename__ = 'tipos_evento_cadastro'
    nome = db.Column(db.String(100), unique=True, nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    ativo = db.Column(db.Boolean, default=True)

class EquipaCadastro(BaseModel):
    __tablename__ = 'equipas_cadastro'
    nome = db.Column(db.String(100), nullable=False)
    departamento = db.Column(db.String(100), nullable=True)
    descricao = db.Column(db.Text, nullable=True)
    custo_sugerido = db.Column(db.Numeric(10, 2), default=0.0)
    preco_sugerido = db.Column(db.Numeric(10, 2), default=0.0)
    ativo = db.Column(db.Boolean, default=True)

# POLÍTICA COMERCIAL E TABELA DE SUGESTÃO DE PREÇOS
class PoliticaComercialEvento(BaseModel):
    __tablename__ = 'politicas_comerciais_eventos'
    codigo = db.Column(db.String(50), unique=True, nullable=False)
    nome = db.Column(db.String(100), nullable=False)
    tipo_evento = db.Column(db.String(100), nullable=False)
    estado = db.Column(db.String(20), default='Ativa') # Ativa / Inativa
    data_inicio = db.Column(db.Date, nullable=True)
    data_fim = db.Column(db.Date, nullable=True)
    observacoes = db.Column(db.Text, nullable=True)
    
    regras = db.relationship('PoliticaComercialRegra', backref='politica', cascade="all, delete-orphan", lazy='selectin')

class PoliticaComercialRegra(BaseModel):
    __tablename__ = 'politica_comercial_regras'
    politica_id = db.Column(db.Integer, db.ForeignKey('politicas_comerciais_eventos.id'), nullable=False)
    tipo_item = db.Column(db.Enum(TipoItemEvento), nullable=False)
    referencia_id = db.Column(db.Integer, nullable=True)
    nome_item = db.Column(db.String(255), nullable=True)
    min_participantes = db.Column(db.Integer, default=1)
    max_participantes = db.Column(db.Integer, default=99999)
    valor_sugerido = db.Column(db.Numeric(10, 2), nullable=False)
    tipo_calculo = db.Column(db.Enum(TipoCalculoPolitica), default=TipoCalculoPolitica.FIXO)
    prioridade = db.Column(db.Integer, default=1)
    mensagem_sugestao = db.Column(db.String(255), nullable=True)

class Espaco(BaseModel):
    __tablename__ = 'espacos'
    nome = db.Column(db.String(100), nullable=False)
    capacidade = db.Column(db.Integer, nullable=False)
    localizacao = db.Column(db.String(255), nullable=True)
    descricao = db.Column(db.Text, nullable=True)
    preco_aluguer = db.Column(db.Numeric(10, 2), default=0.0)
    estado = db.Column(db.Enum(EstadoEspaco), default=EstadoEspaco.ATIVO)

class Evento(BaseModel):
    __tablename__ = 'eventos'
    numero = db.Column(db.String(50), unique=True, nullable=False)
    _cliente_id = db.Column('cliente_id', db.Integer, db.ForeignKey('clientes.id'), nullable=True)
    pedido_id = db.Column(db.Integer, db.ForeignKey('pedidos.id'), nullable=True)
    responsavel_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    tipo_evento = db.Column(db.String(100), nullable=False)
    titulo = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text, nullable=True)
    local_evento = db.Column(db.String(255), nullable=True)
    
    data_evento = db.Column(db.Date, nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fim = db.Column(db.Time, nullable=False)
    numero_convidados = db.Column(db.Integer, nullable=False)
    numero_convidados_confirmados = db.Column(db.Integer, nullable=True)
    estado = db.Column(db.String(50), default='Agendado')
    observacoes = db.Column(db.Text, nullable=True)
    
    # Configurações fiscais e financeiras do Evento
    cobrar_iva_servicos = db.Column(db.Boolean, default=True)
    taxa_iva_servicos = db.Column(db.Numeric(10, 2), default=15.0)
    desconto_total = db.Column(db.Numeric(10, 2), default=0.0)
    valor_deslocacao = db.Column(db.Numeric(10, 2), default=0.0)
    outros_encargos = db.Column(db.Numeric(10, 2), default=0.0)

    _valor_total = db.Column('valor_total', db.Numeric(10, 2), default=0, nullable=True)
    _valor_pago = db.Column('valor_pago', db.Numeric(10, 2), default=0, nullable=True)
    _saldo = db.Column('saldo', db.Numeric(10, 2), default=0, nullable=True)

    responsavel = db.relationship('User', foreign_keys=[responsavel_id], lazy='selectin')
    itens = db.relationship('EventoItem', backref='evento', lazy='selectin', cascade="all, delete-orphan")
    servicos = db.relationship('EventoServico', backref='evento', lazy='selectin', cascade="all, delete-orphan")
    reservas_espaco = db.relationship('ReservaEspaco', backref='evento', lazy='selectin', cascade="all, delete-orphan")
    reservas_material = db.relationship('ReservaMaterial', backref='evento', lazy='selectin', cascade="all, delete-orphan")
    equipas = db.relationship('EventoEquipa', backref='evento', lazy='selectin', cascade="all, delete-orphan")
    
    @property
    def pedido(self):
        from app.models.pedido import Pedido
        if not self.pedido_id: return None
        return Pedido.query.get(self.pedido_id)

    @property
    def cliente_id(self):
        return self._cliente_id or (self.pedido.cliente_id if self.pedido else None)
    @cliente_id.setter
    def cliente_id(self, value):
        self._cliente_id = value

    @property
    def valor_total(self):
        res = self.calcular_resumo_financeiro()
        return res['total_geral']
    @valor_total.setter
    def valor_total(self, value): self._valor_total = value

    @property
    def valor_pago(self):
        return float(self._valor_pago or 0) if self._valor_pago is not None else (float(self.pedido.valor_pago or 0) if self.pedido else 0.0)
    @valor_pago.setter
    def valor_pago(self, value): self._valor_pago = value

    @property
    def saldo(self):
        return float(self.valor_total) - float(self.valor_pago)
    @saldo.setter
    def saldo(self, value): self._saldo = value

    def calcular_resumo_financeiro(self):
        """
        Calcula os totais discriminados do evento:
        - Produtos (Acabados, Revenda ou Consumíveis/Ingredientes) respeitam SEMPRE a sua taxa de IVA individual.
        - Serviços, Alugueres, Deslocação, Mão de Obra e Outros respeitam a configuração de IVA do Evento (cobrar_iva_servicos).
        """
        subtotal_produtos = 0.0
        total_iva_produtos = 0.0
        subtotal_servicos = 0.0
        total_iva_servicos = 0.0
        subtotal_alugueres = 0.0
        total_iva_alugueres = 0.0
        subtotal_deslocacoes = 0.0
        subtotal_mao_obra = 0.0
        subtotal_outros = 0.0

        cobrar_iva = bool(self.cobrar_iva_servicos if self.cobrar_iva_servicos is not None else True)
        taxa_servicos = float(self.taxa_iva_servicos or 15.0) if cobrar_iva else 0.0

        # 1. Processar itens de EventoItem (A nova entidade agregadora)
        for it in (self.itens or []):
            q = float(it.quantidade or 0)
            pu = float(it.preco_unitario or 0)
            desc = float(it.valor_desconto or 0)
            base = max(0.0, (q * pu) - desc)
            tipo_str = str(it.tipo_item.value if hasattr(it.tipo_item, 'value') else it.tipo_item).lower()

            if 'produto' in tipo_str:
                # Regra de ouro: Produtos respeitam sempre a taxa de IVA individual da ficha do produto
                taxa_p = float(it.taxa_iva or (it.produto.taxa_iva.percentagem if (it.produto and it.produto.taxa_iva) else 0.0))
                iva_val = base * (taxa_p / 100.0)
                subtotal_produtos += base
                total_iva_produtos += iva_val
            elif 'servico' in tipo_str or 'serviço' in tipo_str:
                iva_val = base * (taxa_servicos / 100.0) if cobrar_iva else 0.0
                subtotal_servicos += base
                total_iva_servicos += iva_val
            elif 'espaco' in tipo_str or 'espaço' in tipo_str or 'material' in tipo_str or 'aluguer' in tipo_str:
                iva_val = base * (taxa_servicos / 100.0) if cobrar_iva else 0.0
                subtotal_alugueres += base
                total_iva_alugueres += iva_val
            elif 'deslocacao' in tipo_str or 'deslocação' in tipo_str:
                subtotal_deslocacoes += base
            elif 'mao_de_obra' in tipo_str or 'mão' in tipo_str:
                subtotal_mao_obra += base
            else:
                subtotal_outros += base

        # 2. Processar produtos oriundos de Pedido vinculado se existir
        if self.pedido and self.pedido.itens:
            for item in self.pedido.itens:
                q = float(item.quantidade or 0)
                pu = float(item.preco_unitario or 0)
                desc = float(item.desconto or 0)
                base = max(0.0, (q * pu) - desc)
                iva_val = float(item.valor_iva or 0)
                subtotal_produtos += base
                total_iva_produtos += iva_val

        # 3. Processar coleções legadas (servicos, reservas_espaco, reservas_material)
        for s in (self.servicos or []):
            q = float(s.quantidade or 0)
            pu = float(s.valor_unitario or 0)
            desl = float(s.deslocacao or 0)
            sub = (q * pu) + desl
            iva_val = sub * (taxa_servicos / 100.0) if cobrar_iva else 0.0
            subtotal_servicos += sub
            total_iva_servicos += iva_val

        subtotal_espacos = sum(float(r.valor_aluguer or 0) for r in (self.reservas_espaco or []))
        subtotal_materiais = sum(float(m.subtotal or (m.quantidade or 0) * (m.valor_unitario or 0)) for m in (self.reservas_material or []))
        legado_alugueres = subtotal_espacos + subtotal_materiais
        if legado_alugueres > 0:
            iva_val = legado_alugueres * (taxa_servicos / 100.0) if cobrar_iva else 0.0
            subtotal_alugueres += legado_alugueres
            total_iva_alugueres += iva_val

        deslocacao_global = float(self.valor_deslocacao or 0.0) + subtotal_deslocacoes
        outros = float(self.outros_encargos or 0.0) + subtotal_outros + subtotal_mao_obra
        desconto = float(self.desconto_total or 0.0)

        subtotal_geral = subtotal_produtos + subtotal_servicos + subtotal_alugueres + deslocacao_global + outros
        total_iva_geral = total_iva_produtos + total_iva_servicos + total_iva_alugueres
        total_geral = max(0.0, subtotal_geral - desconto + total_iva_geral)

        return {
            'subtotal_produtos': subtotal_produtos,
            'total_iva_produtos': total_iva_produtos,
            'subtotal_servicos': subtotal_servicos,
            'total_iva_servicos': total_iva_servicos,
            'subtotal_alugueres': subtotal_alugueres,
            'total_iva_alugueres': total_iva_alugueres,
            'subtotal_deslocacoes': deslocacao_global,
            'subtotal_mao_obra': subtotal_mao_obra,
            'subtotal_outros': outros,
            'valor_deslocacao': deslocacao_global,
            'outros_encargos': outros,
            'desconto_total': desconto,
            'cobrar_iva_servicos': cobrar_iva,
            'taxa_iva_servicos': taxa_servicos,
            'subtotal_geral': subtotal_geral,
            'total_iva_geral': total_iva_geral,
            'total_geral': total_geral,
            'valor_pago': float(self.valor_pago or 0.0),
            'saldo': max(0.0, total_geral - float(self.valor_pago or 0.0))
        }

class EventoItem(db.Model):
    __tablename__ = 'eventos_itens'
    id = db.Column(db.Integer, primary_key=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=False)
    tipo_item = db.Column(db.Enum(TipoItemEvento), nullable=False)
    referencia_id = db.Column(db.Integer, nullable=True) # Referência ao cadastro base (serviço, espaço, material)
    produto_id = db.Column(db.Integer, db.ForeignKey('produtos.id'), nullable=True) # Se for produto (Acabado, Revenda, Consumível)
    
    descricao = db.Column(db.String(255), nullable=False)
    quantidade = db.Column(db.Numeric(10, 2), nullable=False, default=1.0)
    unidade = db.Column(db.String(50), default='Unidade')
    preco_unitario = db.Column(db.Numeric(10, 2), nullable=False, default=0.0)
    percentual_desconto = db.Column(db.Numeric(10, 2), default=0.0)
    valor_desconto = db.Column(db.Numeric(10, 2), default=0.0)
    taxa_iva = db.Column(db.Numeric(10, 2), default=0.0)
    valor_iva = db.Column(db.Numeric(10, 2), default=0.0)
    subtotal = db.Column(db.Numeric(10, 2), default=0.0)
    total = db.Column(db.Numeric(10, 2), default=0.0)
    observacoes = db.Column(db.Text, nullable=True)
    
    sugestao_politica_id = db.Column(db.Integer, nullable=True)
    sugestao_origem = db.Column(db.String(255), nullable=True)

    produto = db.relationship('Produto', foreign_keys=[produto_id], lazy='selectin')

class EventoServico(db.Model):
    __tablename__ = 'eventos_servicos'
    id = db.Column(db.Integer, primary_key=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=False)
    tipo = db.Column(db.Enum(TipoServicoEvento), nullable=False)
    descricao = db.Column(db.String(255), nullable=True)
    quantidade = db.Column(db.Numeric(10, 2), nullable=False)
    valor_unitario = db.Column(db.Numeric(10, 2), nullable=False)
    deslocacao = db.Column(db.Numeric(10, 2), default=0.0)
    subtotal = db.Column(db.Numeric(10, 2), nullable=False)
    observacoes = db.Column(db.Text, nullable=True)

class ReservaEspaco(db.Model):
    __tablename__ = 'reservas_espacos'
    id = db.Column(db.Integer, primary_key=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=False)
    espaco_id = db.Column(db.Integer, db.ForeignKey('espacos.id'), nullable=False)
    data_inicio = db.Column(db.DateTime, nullable=False)
    data_fim = db.Column(db.DateTime, nullable=False)
    valor_aluguer = db.Column(db.Numeric(10, 2), default=0.0)
    estado = db.Column(db.Enum(EstadoReservaEspaco), default=EstadoReservaEspaco.RESERVADO)

class ReservaMaterial(db.Model):
    __tablename__ = 'reservas_materiais'
    id = db.Column(db.Integer, primary_key=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=False)
    material_id = db.Column(db.Integer, db.ForeignKey('materiais.id'), nullable=False)
    quantidade = db.Column(db.Numeric(10, 2), nullable=False)
    valor_unitario = db.Column(db.Numeric(10, 2), default=0.0)
    subtotal = db.Column(db.Numeric(10, 2), default=0.0)
    data_inicio = db.Column(db.DateTime, nullable=False)
    data_fim = db.Column(db.DateTime, nullable=False)
    estado = db.Column(db.String(50), default='Reservado') # RESERVADO, UTILIZADO, DEVOLVIDO, CANCELADO

class EventoEquipa(db.Model):
    __tablename__ = 'eventos_equipas'
    id = db.Column(db.Integer, primary_key=True)
    evento_id = db.Column(db.Integer, db.ForeignKey('eventos.id'), nullable=False)
    utilizador_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    funcao = db.Column(db.Enum(FuncaoEquipa), nullable=False)
    estado = db.Column(db.String(50), default='Alocado')


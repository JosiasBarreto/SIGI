export enum TipoProduto {
  ACABADO = 'ACABADO',
  REVENDA = 'REVENDA',
  CONSUMIVEL = 'CONSUMIVEL',
  SERVICO = 'SERVICO',
  ALUGUER = 'ALUGUER'
}

export enum ServicoEnum {
  COZINHA = 'COZINHA',
  PASTELARIA = 'PASTELARIA',
  BAR = 'BAR',
  ABASTECIMENTO = 'ABASTECIMENTO'
}

export enum EstadoPedido {
  PENDENTE = 'Pendente',
  AGENDADO = 'Agendado',
  CONFIRMADO = 'Confirmado',
  EM_PRODUCAO = 'Em Producao',
  PRONTO = 'Pronto',
  ENTREGUE = 'Entregue',
  CONCLUIDO = 'Concluido',
  CANCELADO = 'Cancelado'
}

export enum EstadoProducao {
  PENDENTE = 'Pendente',
  EM_PRODUCAO = 'Em Producao',
  PRONTO = 'Pronto',
  ENTREGUE = 'Entregue',
  CANCELADO = 'Cancelado'
}

export enum EstadoVenda {
  PENDENTE = 'PENDENTE',
  PARCIALMENTE_PAGO = 'PARCIALMENTE_PAGO',
  PAGO = 'PAGO',
  CANCELADO = 'CANCELADO'
}

export enum TipoDocumento {
  FR = 'FR', // Fatura Recibo
  VD = 'VD', // Venda a Dinheiro
  FT = 'FT'  // Fatura
}

export enum FormaPagamento {
  DINHEIRO = 'DINHEIRO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  POS = 'POS',
  MIXTO = 'MIXTO'
}

export enum OrigemMovimento {
  ARMAZEM = 'ARMAZEM',
  VENDA = 'VENDA',
  COMPRA = 'COMPRA',
  AJUSTE = 'AJUSTE',
  PRODUCAO = 'PRODUCAO'
}

export enum TipoMovimento {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
  AJUSTE = 'AJUSTE',
  PERDA = 'PERDA'
}

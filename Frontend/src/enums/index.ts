export enum TipoProduto {
  ACABADO = 'ACABADO',
  REVENDA = 'REVENDA',
  CONSUMIVEL = 'CONSUMIVEL',
  SERVICO = 'SERVICO',
  ALUGUER = 'ALUGUER'
}

export enum EstadoPedido {
  PENDENTE = 'PENDENTE',
  AGENDADO = 'AGENDADO',
  CONFIRMADO = 'CONFIRMADO',
  EM_PREPARACAO = 'EM_PREPARACAO',
  PRONTO = 'PRONTO',
  ENTREGUE = 'ENTREGUE',
  CONCLUIDO = 'CONCLUIDO',
  CANCELADO = 'CANCELADO'
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

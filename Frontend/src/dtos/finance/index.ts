
export interface PagamentoRequest {
  valor: number;
  forma_pagamento_id: number;
  observacoes?: string;
}
export interface PagamentoResponse {
  id: number;
  venda_id: number;
  valor: number;
  forma_pagamento_id: number;
  forma_pagamento_nome?: string;
  data_pagamento: string;
  observacoes?: string;
  novo_saldo_venda: number;
  estado_venda: string;
  troco_gerado: number;
}
export interface CaixaDTO {
  id: number;
  numero: string;
  data_abertura: string;
  data_fecho?: string;
  valor_inicial: string | number;
  valor_final?: string | number;
  utilizador_abertura_id?: number;
  estado: string;
}
export interface ContaReceberDTO {
  id: number;
  cliente_id: number;
  pedido_id?: number;
  evento_id?: number;
  valor_original: string | number;
  valor_pago: string | number;
  saldo: string | number;
  vencimento: string;
  estado: string;
}

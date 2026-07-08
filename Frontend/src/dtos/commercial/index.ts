
export interface VendaItemRequest {
  item_id: number;
  item_tipo?: string;
  descricao?: string;
  quantidade: number;
  preco_unitario: number;
  desconto?: number;
  taxa_iva_id?: number;
}
export interface VendaRequest {
  tipo_documento: string;
  cliente_id?: number;
  observacoes?: string;
  itens: VendaItemRequest[];
  pagamentos?: { forma_pagamento_id: number; valor: number }[];
  valor_pago?: number;
  forma_pagamento_id?: number; 
}
export interface VendaItemResponse {
  id: number;
  produto_id: number;
  produto_nome: string;
  quantidade: number;
  preco_unitario: number;
  desconto: number;
  subtotal: number;
}
export interface VendaResponse {
  id: number;
  numero_fatura: string;
  tipo_documento: string;
  estado: string;
  cliente_id?: number;
  cliente_nome?: string;
  valor_total: number;
  valor_pago: number;
  troco: number;
  observacoes?: string;
  itens: VendaItemResponse[];
  data_venda: string;
}
export interface CheckoutPedidoRequest {
  pedido_id: number;
  pagamento?: import('../finance').PagamentoRequest;
}
export interface EventoFaturacaoRequest {
  valor: number;
  forma_pagamento_id: number;
  observacoes?: string;
}

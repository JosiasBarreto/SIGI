
import { EstadoPedido } from '../../enums';
export interface PedidoItemDTO {
  id?: number;
  tipo_item: string;
  produto_id: number;
  descricao?: string;
  quantidade: string | number;
  preco_unitario: string | number;
}
export interface PedidoDTO {
  id: number;
  numero: string;
  cliente_id: number;
  tipo: string;
  origem: string;
  data_pedido: string;
  data_entrega?: string;
  hora_entrega?: string;
  estado: EstadoPedido | string;
  observacoes?: string;
  justificativa_cancelamento?: string;
  valor_total: string | number;
  valor_pago: string | number;
  saldo: string | number;
  forma_pagamento?: string;
  estado_pagamento?: string;
  itens: PedidoItemDTO[];}
export interface OrdemProducaoDTO {
  id: number;
  numero: string;
  pedido_id: number;
  sector: string;
  data_producao?: string;
  hora_inicio?: string;
  hora_fim?: string;
  prioridade: string;
  estado: string;
  observacoes?: string;
  consumos: any[];
}

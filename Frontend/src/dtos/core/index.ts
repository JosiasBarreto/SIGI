
export interface TurnoDTO {
  id: number;
  nome: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  ativo: boolean;
}
export interface DashboardStatsDTO {
  kpis: {
    total_vendas: number;
    total_eventos: number;
    receita_estimada: number;
    pedidos_pendentes: number;
    ordens_ativas: number;
  };
  graficos: {
    vendas_por_mes: Array<{
      mes: string;
      valor: number;
    }>;
  };
}
export interface RequisicaoItemDTO {
  id?: number;
  tipo_item: string;
  item_id: number;
  quantidade_solicitada: string | number;
  quantidade_aprovada?: string | number;
  quantidade_entregue?: string | number;
  quantidade_devolvida?: string | number;
  quantidade_danificada?: string | number;
  quantidade_perdida?: string | number;
  observacao?: string;
}
export interface RequisicaoDTO {
  id: number;
  numero: string;
  tipo: string;
  sector: string;
  turno_id?: number;
  turno_nome?: string;
  responsavel_id?: number;
  responsavel_nome?: string;
  data_requisicao: string;
  estado: string;
  observacoes?: string;
  itens: RequisicaoItemDTO[];
}
export interface MotoristaDTO {
  id: number;
  nome: string;
  telefone?: string;
  carta_conducao?: string;
  validade_carta?: string;
  estado: string;
}
export interface ViaturaDTO {
  id: number;
  matricula: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  capacidade?: string | number;
  quilometragem?: string | number;
  estado: string;
}
export interface EntregaDTO {
  id: number;
  numero: string;
  pedido_id?: number;
  evento_id?: number;
  motorista_id?: number;
  viatura_id?: number;
  data_saida?: string;
  hora_saida?: string;
  data_entrega?: string;
  hora_entrega?: string;
  estado: string;
  checklists: any[];
}

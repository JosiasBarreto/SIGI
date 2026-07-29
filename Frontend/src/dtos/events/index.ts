
export interface EspacoDTO {
  id: number;
  nome: string;
  capacidade?: number;
  descricao?: string;
  estado: string;
}
export interface EventoDTO {
  id: number;
  numero: string;
  cliente_id: number;
  tipo_evento: string;
  titulo: string;
  descricao?: string;
  local_evento?: string;
  espaco_id?: number | null;
  data_evento?: string;
  hora_inicio?: string;
  hora_fim?: string;
  numero_convidados?: number;
  cobrar_iva_servicos?: boolean;
  taxa_iva_servicos?: number;
  valor_deslocacao?: number;
  outros_encargos?: number;
  desconto_total?: number;
  estado: string;
  observacoes?: string;
  valor_total: string | number;
  valor_pago: string | number;
  saldo: string | number;
  servicos: any[];
  reservas_espaco: any[];
  reservas_material: any[];
  equipas: any[];
  itens?: any[];
  resumo_financeiro?: any;
}


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
  data_evento?: string;
  hora_inicio?: string;
  hora_fim?: string;
  numero_convidados?: number;
  estado: string;
  observacoes?: string;
  valor_total: string | number;
  valor_pago: string | number;
  saldo: string | number;
  servicos: any[];
  reservas_espaco: any[];
  reservas_material: any[];
  equipas: any[];
}

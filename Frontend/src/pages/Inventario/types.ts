export type StockStatus = 'Normal' | 'Baixo' | 'Critico' | 'Esgotado' | 'Excesso';

export type ItemType = 'Consumivel' | 'Acabado' | 'Revenda' | 'Material';

export type InventarioEstado = 
  | 'RASCUNHO' 
  | 'EM_CONTAGEM' 
  | 'EM_CONFERENCIA' 
  | 'APROVADO' 
  | 'APLICADO' 
  | 'CANCELADO';

export type InventarioTipo = 'COMPLETO' | 'PARCIAL';

export type ItemSituacao = 'SEM_DIVERGENCIA' | 'FALTA' | 'SOBRA' | 'NAO_CONTADO';

export type MotivoAjuste = 
  | 'QUEBRA' 
  | 'PERDA' 
  | 'SOBRA_FORNECEDOR'
  | 'ERRO_CONTAGEM'
  | 'ERRO_REGISTO' 
  | 'DANIFICADO' 
  | 'VENCIDO' 
  | 'OUTROS'
  | 'OUTRO';

export interface InventarioSessao {
  id: number;
  numero?: string;
  armazem_id: number;
  armazem_nome?: string;
  tipo: InventarioTipo;
  estado: InventarioEstado;
  data_inventario: string;
  observacao?: string;
  total_itens?: number;
  itens_contados?: number;
  percentagem_concluida?: number;
  total_divergencias?: number;
  total_faltas?: number;
  total_sobras?: number;
  valor_faltas?: number;
  valor_sobras?: number;
  impacto_financeiro_liquido?: number;
  responsavel_nome?: string;
  created_at?: string;
  updated_at?: string;
  data_fecho?: string;
}

export interface InventarioItemBackend {
  id: number;
  inventario_id: number;
  item_id: number;
  tipo_item: 'PRODUTO' | 'MATERIAL' | string;
  codigo?: string;
  nome: string;
  unidade_medida?: string;
  preco_custo?: number;
  quantidade_sistema: number;
  quantidade_contada: number | null;
  diferenca: number | null;
  situacao: ItemSituacao;
  motivo_ajuste?: string | null;
  observacao?: string | null;
  valor_impacto?: number | null;
  categoria?: string;
  lote?: string;
}

export interface InventarioConferenciaResumo {
  total_itens: number;
  itens_contados: number;
  itens_pendentes: number;
  percentagem_concluida: number;
  total_sem_divergencia: number;
  total_divergencias: number;
  total_faltas: number;
  total_sobras: number;
  valor_faltas: number;
  valor_sobras: number;
  saldo_financeiro: number;
  itens?: InventarioItemBackend[];
}

export interface InventarioAuditoriaItem {
  id: number;
  inventario_id: number;
  acao: string;
  utilizador_nome?: string;
  data_hora: string;
  ip?: string;
  detalhes?: string;
}

export interface InventoryItem {
  id: string | number;
  original_id: number | string;
  codigo: string;
  nome: string;
  tipo_item: 'Produto' | 'Material';
  tipo: ItemType;
  categoria: string;
  categoria_id?: number | null;
  armazem_id: number | string;
  armazem_nome: string;
  stock_atual: number;
  stock_minimo: number;
  stock_maximo?: number;
  unidade_medida: string;
  preco_compra: number;
  preco_venda?: number;
  valor_total: number;
  status_stock: StockStatus;
  validade?: string;
  lote?: string;
  is_active: boolean;
  descricao?: string;
}

export interface ContagemItem {
  key: string;
  item_id: number | string;
  codigo: string;
  nome: string;
  tipo_item: 'Produto' | 'Material';
  tipo: ItemType;
  categoria: string;
  armazem_id: number | string;
  armazem_nome: string;
  unidade_medida: string;
  preco_unitario: number;
  saldo_sistema: number;
  quantidade_contada: number | null;
  diferenca: number;
  impacto_financeiro: number;
  motivo_desvio?: string;
  observacao?: string;
  status_conferencia: 'Conforme' | 'Sobra' | 'Quebra' | 'Pendente';
}

export interface QuarentenaItem {
  id: string;
  item_id: number | string;
  tipo_item: 'Produto' | 'Material';
  codigo: string;
  nome: string;
  armazem_id: number | string;
  armazem_nome: string;
  quantidade: number;
  unidade_medida: string;
  lote?: string;
  validade?: string;
  motivo: 'Vencido' | 'Avariado / Danificado' | 'Embalagem Violada' | 'Descongelamento / Contaminação' | 'Outro';
  observacao?: string;
  data_bloqueio: string;
  responsavel: string;
  status: 'Quarentena' | 'Descartado' | 'Reintegrado';
}

export interface MovimentoItem {
  id: number | string;
  data: string;
  tipo: 'Entrada' | 'Saida' | 'Ajuste' | 'Transferencia' | 'Quebra' | 'Quarentena';
  item_nome: string;
  codigo: string;
  armazem_nome: string;
  quantidade: number;
  unidade: string;
  saldo_resultante?: number;
  origem: string;
  operador: string;
  observacao?: string;
}

export interface InventoryStats {
  totalItens: number;
  valorTotalKz: number;
  itensCriticos: number;
  itensEsgotados: number;
  itensNormais: number;
  itensQuarentena: number;
}

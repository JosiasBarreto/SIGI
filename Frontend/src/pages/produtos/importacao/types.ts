export type ItemTipo = 'Consumivel' | 'Acabado' | 'Revenda' | 'Material';
export type TipoMaterial = 'Reutilizavel' | 'Consumivel' | 'Descartavel';

export interface ImportRowRaw {
  tipo?: string;
  codigo?: string | number;
  nome?: string;
  descricao?: string;
  categoria?: string;
  categoria_id?: string | number;
  unidade_medida?: string;
  unidade_medida_id?: string | number;
  servico?: string;
  taxa_iva?: string | number;
  taxa_iva_id?: string | number;
  preco_compra?: string | number;
  preco_venda?: string | number;
  valor_unitario?: string | number;
  tempo_producao?: string | number;
  stock_minimo?: string | number;
  quantidade_inicial?: string | number;
  armazem?: string;
  armazem_id?: string | number;
  tipo_material?: string;
  [key: string]: any;
}

export interface ImportRowNormalized {
  linha: number;
  tipo: ItemTipo | string;
  codigo: string;
  nome: string;
  descricao?: string;
  categoria: string;
  categoria_id: number | null;
  unidade_medida: string;
  unidade_medida_id: number | null;
  servico: string;
  taxa_iva: number | null;
  taxa_iva_id: number | null;
  preco_compra: number | null;
  preco_venda: number | null;
  valor_unitario: number | null;
  tempo_producao: number | null;
  stock_minimo: number | null;
  quantidade_inicial: number | null;
  armazem: string;
  armazem_id: number | null;
  tipo_material: TipoMaterial | string | null;
  _errosLocais?: string[];
  _avisosLocais?: string[];
}

export interface ValidationRowResult {
  linha: number;
  valido: boolean;
  dados: ImportRowNormalized;
  erros: string[];
  alertas: string[];
}

export interface ValidationSummary {
  total: number;
  validas: number;
  erros: number;
  avisos: number;
  produtos: number;
  materiais: number;
}

export interface CategoriaRef {
  id: number;
  nome: string;
  descricao?: string;
}

export interface UnidadeMedidaRef {
  id: number;
  sigla: string;
  nome: string;
  descricao?: string;
}

export interface TaxaIvaRef {
  id: number;
  taxa: number;
  percentagem?: number;
  descricao?: string;
  ativo?: boolean;
}

export interface ServicoDetalheRef {
  codigo: string;
  nome: string;
  tipo_padrao?: string;
}

export interface ArmazemRef {
  id: number;
  codigo?: string;
  nome: string;
  localizacao?: string;
  descricao?: string;
  principal?: boolean;
}

export interface ReferenceData {
  categorias: CategoriaRef[];
  unidades: UnidadeMedidaRef[];
  armazens: ArmazemRef[];
  taxasIva: TaxaIvaRef[];
  servicos: string[];
  servicosDetalhe?: ServicoDetalheRef[];
  tipos: string[];
  tiposMaterial: string[];
  origem?: 'backend_consolidado' | 'backend_legado' | 'fallback';
  endpointOrigem?: string;
  totalCategorias?: number;
  totalUnidades?: number;
  totalArmazens?: number;
  totalTaxasIva?: number;
  timestampSincronizacao?: string;
  isLoading: boolean;
  error?: string | null;
}

export type ImportStep = 'idle' | 'file_loaded' | 'parsing' | 'ready_to_validate' | 'validating' | 'validated' | 'confirming' | 'completed' | 'error';

export interface ImportFinalResult {
  success: boolean;
  totalProcessado: number;
  produtosImportados: number;
  materiaisImportados: number;
  movimentosStock: number;
  codigoOperacao?: string;
  mensagem?: string;
  timestamp?: string;
}

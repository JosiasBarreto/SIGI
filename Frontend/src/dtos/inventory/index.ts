
import { TipoProduto, TipoMovimento, OrigemMovimento } from '../../enums';
export interface FornecedorDTO {
  id: number;
  codigo?: string;
  nome: string;
  nif?: string;
  email?: string;
  telefone?: string;
  morada?: string;
  contacto_principal?: string;
  observacoes?: string;
  is_active: boolean;
}
export interface IngredienteDTO {
  id: number;
  codigo?: string;
  nome: string;
  categoria?: string;
  unidade_medida: string;
  stock_atual: string | number;
  stock_minimo: string | number;
  stock_maximo: string | number;
  validade?: string;
  preco_compra?: string | number;
  observacoes?: string;
  fornecedor_id?: number;
  is_active: boolean;
}
export interface ProdutoDTO {
  id: number;
  codigo?: string;
  nome: string;
  tipo: TipoProduto | string;
  categoria?: string;
  tempo_producao?: number;
  preco_venda: string | number;
  descricao?: string;
  stock_atual: string | number;
  stock_minimo: string | number;
  is_active: boolean;
}
export interface MaterialDTO {
  id: number;
  codigo?: string;
  nome: string;
  categoria?: string;
  tipo: 'Reutilizavel' | 'Consumivel';
  quantidade_total: string | number;
  quantidade_disponivel: string | number;
  quantidade_reservada: string | number;
  unidade_medida_id?: number | null;
  unidade_medida_sigla?: string;
  estado: string;
  valor_unitario?: string | number;
  is_active: boolean;
}
export interface MovimentoStockDTO {
  id: number;
  tipo: TipoMovimento | string;
  origem: OrigemMovimento | string;
  entidade_tipo: string;
  referencia_id?: number;
  quantidade: string | number;
  justificacao?: string;
  created_at?: string;
  created_by?: number;
}

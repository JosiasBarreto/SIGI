export const IMPORT_TYPES = ['Consumivel', 'Acabado', 'Revenda', 'Material'] as const;

export const MATERIAL_TYPES = ['Reutilizavel', 'Consumivel', 'Descartavel'] as const;

export const DEFAULT_SERVICOS = [
  'ABASTECIMENTO',
  'PASTELARIA',
  'BAR',
  'COZINHA'
] as const;

export interface ExcelColumnDef {
  key: string;
  label: string;
  aliases: string[];
  width: number;
  requiredFor?: string[];
  description: string;
}

export const EXCEL_COLUMNS: ExcelColumnDef[] = [
  {
    key: 'tipo',
    label: 'tipo',
    aliases: ['tipo', 'tipo_item', 'type'],
    width: 15,
    requiredFor: ['Consumivel', 'Acabado', 'Revenda', 'Material'],
    description: 'Valores: Consumivel, Acabado, Revenda, Material'
  },
  {
    key: 'codigo',
    label: 'codigo',
    aliases: ['codigo', 'código', 'referencia', 'ref', 'sku'],
    width: 16,
    description: 'Código de referência único (opcional, pode ser auto-gerado)'
  },
  {
    key: 'nome',
    label: 'nome',
    aliases: ['nome', 'designacao', 'designação', 'item', 'artigo', 'name'],
    width: 32,
    requiredFor: ['Consumivel', 'Acabado', 'Revenda', 'Material'],
    description: 'Nome do produto ou material (obrigatório)'
  },
  {
    key: 'descricao',
    label: 'descricao',
    aliases: ['descricao', 'descrição', 'detalhes', 'description'],
    width: 30,
    description: 'Descrição detalhada do artigo (opcional)'
  },
  {
    key: 'categoria',
    label: 'categoria',
    aliases: ['categoria', 'categoria_nome', 'cat', 'categoria_id'],
    width: 24,
    requiredFor: ['Consumivel', 'Acabado', 'Revenda'],
    description: 'Nome da categoria (ver folha Categorias)'
  },
  {
    key: 'unidade_medida',
    label: 'unidade_medida',
    aliases: ['unidade_medida', 'unidade', 'unidade_medida_id', 'medida', 'um'],
    width: 18,
    requiredFor: ['Consumivel', 'Acabado', 'Revenda', 'Material'],
    description: 'Sigla ou nome da unidade (KG, UN, L, CX...)'
  },
  {
    key: 'servico',
    label: 'servico',
    aliases: ['servico', 'serviço', 'area', 'departamento'],
    width: 20,
    requiredFor: ['Consumivel', 'Acabado', 'Revenda'],
    description: 'Área de afetação (ABASTECIMENTO, PASTELARIA, BAR, COZINHA)'
  },
  {
    key: 'taxa_iva',
    label: 'taxa_iva',
    aliases: ['taxa_iva', 'taxa_iva_id', 'iva', 'imposto', 'taxa'],
    width: 14,
    description: 'Taxa de IVA (ex: 0%, 5%, 14%, 15%)'
  },
  {
    key: 'preco_compra',
    label: 'preco_compra',
    aliases: ['preco_compra', 'preço_compra', 'custo', 'valor_compra', 'custo_unitario'],
    width: 16,
    requiredFor: ['Consumivel', 'Revenda'],
    description: 'Preço unitário de compra'
  },
  {
    key: 'preco_venda',
    label: 'preco_venda',
    aliases: ['preco_venda', 'preço_venda', 'venda', 'pvp', 'valor_venda'],
    width: 16,
    requiredFor: ['Acabado', 'Revenda'],
    description: 'Preço unitário de venda'
  },
  {
    key: 'valor_unitario',
    label: 'valor_unitario',
    aliases: ['valor_unitario', 'valor_unitário', 'preco_unitario', 'preço_unitário'],
    width: 16,
    requiredFor: ['Material'],
    description: 'Valor patrimonial unitário (Materiais)'
  },
  {
    key: 'tempo_producao',
    label: 'tempo_producao',
    aliases: ['tempo_producao', 'tempo_produção', 'tempo_minutos', 'tempo_prep'],
    width: 18,
    description: 'Tempo de confeção/produção em minutos (Acabados)'
  },
  {
    key: 'stock_minimo',
    label: 'stock_minimo',
    aliases: ['stock_minimo', 'stock_mínimo', 'estoque_minimo', 'minimo'],
    width: 16,
    description: 'Quantidade mínima de alerta de stock'
  },
  {
    key: 'quantidade_inicial',
    label: 'quantidade_inicial',
    aliases: ['quantidade_inicial', 'qtd_inicial', 'stock_inicial', 'saldo_inicial'],
    width: 20,
    description: 'Stock inicial a dar entrada automaticamente'
  },
  {
    key: 'armazem',
    label: 'armazem',
    aliases: ['armazem', 'armazém', 'armazem_id', 'deposito', 'armazem_nome'],
    width: 24,
    description: 'Nome do armazém para entrada de stock (ver folha Armazéns)'
  },
  {
    key: 'tipo_material',
    label: 'tipo_material',
    aliases: ['tipo_material', 'material_tipo', 'categoria_material'],
    width: 18,
    requiredFor: ['Material'],
    description: 'Para materiais: Reutilizavel ou Consumivel'
  }
];

export const MODELO_EXEMPLOS = [
  {
    tipo: 'Consumivel',
    codigo: 'ING-001',
    nome: 'Farinha de Trigo Extra',
    descricao: 'Farinha alimentar especial para confeitaria e pães',
    categoria: 'Ingredientes',
    unidade_medida: 'KG',
    servico: 'ABASTECIMENTO',
    taxa_iva: '0%',
    preco_compra: 450,
    preco_venda: '',
    valor_unitario: '',
    tempo_producao: '',
    stock_minimo: 10,
    quantidade_inicial: 50,
    armazem: 'Armazém Principal',
    tipo_material: ''
  },
  {
    tipo: 'Acabado',
    codigo: 'ACA-001',
    nome: 'Bolo de Chocolate Simples',
    descricao: 'Bolo de chocolate confecionado na pastelaria interna',
    categoria: 'Pastelaria',
    unidade_medida: 'UN',
    servico: 'PASTELARIA',
    taxa_iva: '14%',
    preco_compra: '',
    preco_venda: 5000,
    valor_unitario: '',
    tempo_producao: 90,
    stock_minimo: 2,
    quantidade_inicial: 5,
    armazem: 'Armazém Principal',
    tipo_material: ''
  },
  {
    tipo: 'Revenda',
    codigo: 'REV-001',
    nome: 'Refrigerante Cola 330ml',
    descricao: 'Refrigerante gaseificado lata 330ml para bar',
    categoria: 'Bebidas',
    unidade_medida: 'UN',
    servico: 'BAR',
    taxa_iva: '14%',
    preco_compra: 500,
    preco_venda: 850,
    valor_unitario: '',
    tempo_producao: '',
    stock_minimo: 24,
    quantidade_inicial: 96,
    armazem: 'Armazém Principal',
    tipo_material: ''
  },
  {
    tipo: 'Material',
    codigo: 'MAT-001',
    nome: 'Mesa Dobrável Eventos 1.80m',
    descricao: 'Mesa retangular dobrável em polietileno para eventos',
    categoria: '',
    unidade_medida: 'UN',
    servico: '',
    taxa_iva: '0%',
    preco_compra: '',
    preco_venda: '',
    valor_unitario: 12000,
    tempo_producao: '',
    stock_minimo: 2,
    quantidade_inicial: 10,
    armazem: 'Armazém Principal',
    tipo_material: 'Reutilizavel'
  }
];

import * as XLSX from 'xlsx';
import { ImportRowRaw } from './types';
import { EXCEL_COLUMNS } from './constants';

export interface ParseResult {
  rows: ImportRowRaw[];
  totalRows: number;
  sheetName: string;
}

/**
 * Normaliza uma string de cabeçalho para comparação flexível
 */
function normalizeHeaderName(header: string): string {
  return String(header || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Mapeia cabeçalhos encontrados no Excel para as chaves oficiais do sistema
 */
function createHeaderMap(headers: string[]): Record<number, string> {
  const map: Record<number, string> = {};

  headers.forEach((h, colIndex) => {
    if (!h) return;
    const cleanHeader = normalizeHeaderName(h);

    for (const colDef of EXCEL_COLUMNS) {
      const match = colDef.aliases.some(alias => normalizeHeaderName(alias) === cleanHeader);
      if (match) {
        map[colIndex] = colDef.key;
        return;
      }
    }

    // Se não encontrou correspondência nos aliases mas o nome limpo bate com a chave
    map[colIndex] = cleanHeader;
  });

  return map;
}

/**
 * Faz o parsing de um ficheiro Excel (.xlsx ou .xls)
 */
export async function parseExcelFile(file: File): Promise<ParseResult> {
  if (!file) {
    throw new Error('Nenhum ficheiro fornecido.');
  }

  const validExtensions = ['.xlsx', '.xls'];
  const fileName = file.name.toLowerCase();
  const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExt) {
    throw new Error('Formato de ficheiro não suportado. Por favor utilize ficheiros .xlsx ou .xls.');
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    raw: false,
    dateNF: 'yyyy-mm-dd'
  });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('O ficheiro Excel não contém nenhuma folha de cálculo.');
  }

  // Localizar a folha "Importação" (ou "importacao", ou a primeira se não encontrar)
  let sheetName = workbook.SheetNames.find(
    name => normalizeHeaderName(name) === 'importacao' || normalizeHeaderName(name) === 'import'
  );

  if (!sheetName) {
    sheetName = workbook.SheetNames[0];
  }

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) {
    throw new Error(`A folha "${sheetName}" está vazia ou não pôde ser lida.`);
  }

  // Converter a folha numa matriz de dados (AOA - Array of Arrays)
  const aoa: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    blankrows: false
  });

  if (!aoa || aoa.length === 0) {
    throw new Error('O ficheiro Excel está vazio ou não possui linhas.');
  }

  // A primeira linha são os cabeçalhos
  const rawHeaders: string[] = (aoa[0] || []).map((h: any) => String(h || '').trim());
  const headerMap = createHeaderMap(rawHeaders);

  // Verificar se há pelo menos cabeçalhos essenciais (tipo, nome)
  const mappedKeys = Object.values(headerMap);
  const hasNome = mappedKeys.includes('nome');
  const hasTipo = mappedKeys.includes('tipo');

  if (!hasNome && !hasTipo) {
    throw new Error(
      'Estrutura do modelo inválida. O ficheiro deve conter pelo menos as colunas "tipo" e "nome". Utilize o modelo oficial do SIGI.'
    );
  }

  const rows: ImportRowRaw[] = [];

  // Percorrer da linha 1 em diante (dados reais)
  for (let rowIndex = 1; rowIndex < aoa.length; rowIndex++) {
    const rawRow = aoa[rowIndex];
    if (!rawRow || !Array.isArray(rawRow)) continue;

    // Verificar se a linha está completamente vazia
    const hasAnyContent = rawRow.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
    if (!hasAnyContent) continue;

    const rowObj: ImportRowRaw = {
      _excelRowNumber: rowIndex + 1 // Número real da linha no Excel (2-based)
    };

    rawRow.forEach((cellVal, colIndex) => {
      const fieldKey = headerMap[colIndex];
      if (!fieldKey) return;

      if (cellVal === null || cellVal === undefined) {
        rowObj[fieldKey] = null;
        return;
      }

      const strVal = String(cellVal).trim();
      if (strVal === '') {
        rowObj[fieldKey] = null;
        return;
      }

      // Se for código ou referência, preservar sempre como string
      if (fieldKey === 'codigo') {
        rowObj[fieldKey] = strVal;
        return;
      }

      // Se for número em campos numéricos
      const numericFields = [
        'preco_compra',
        'preco_venda',
        'valor_unitario',
        'tempo_producao',
        'stock_minimo',
        'quantidade_inicial'
      ];

      if (numericFields.includes(fieldKey)) {
        // Tratar vírgulas e pontos decimais
        const cleanNum = strVal.replace(/\s+/g, '').replace(',', '.');
        const parsed = Number(cleanNum);
        rowObj[fieldKey] = isNaN(parsed) ? strVal : parsed;
        return;
      }

      // Se for taxa de IVA
      if (fieldKey === 'taxa_iva') {
        rowObj[fieldKey] = strVal;
        return;
      }

      rowObj[fieldKey] = strVal;
    });

    rows.push(rowObj);
  }

  if (rows.length === 0) {
    throw new Error('Não foram encontradas linhas de dados para importar. A folha contém apenas cabeçalhos.');
  }

  return {
    rows,
    totalRows: rows.length,
    sheetName
  };
}

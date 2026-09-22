import { ImportRowRaw, ImportRowNormalized, ReferenceData, ItemTipo, TipoMaterial } from './types';
import { IMPORT_TYPES, MATERIAL_TYPES, DEFAULT_SERVICOS } from './constants';

function cleanString(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str).trim();
}

function parseNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  const cleaned = String(val).replace(/\s+/g, '').replace(',', '.');
  const num = Number(cleaned);
  return isNaN(num) ? null : num;
}

function parseTaxaIva(val: any): { taxa: number | null; raw: string } {
  if (val === null || val === undefined || val === '') {
    return { taxa: null, raw: '' };
  }
  const str = String(val).trim();
  const numStr = str.replace('%', '').replace(',', '.').trim();
  const parsed = Number(numStr);
  return {
    taxa: isNaN(parsed) ? null : parsed,
    raw: str
  };
}

function normalizeTipo(rawTipo: string): ItemTipo | string {
  const clean = rawTipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (clean === 'consumivel' || clean === 'ingrediente' || clean === 'consumiveis') return 'Consumivel';
  if (clean === 'acabado' || clean === 'producao' || clean === 'fabricado') return 'Acabado';
  if (clean === 'revenda' || clean === 'mercadoria' || clean === 'comercial') return 'Revenda';
  if (clean === 'material' || clean === 'equipamento' || clean === 'utensilio') return 'Material';
  return rawTipo;
}

function normalizeTipoMaterial(rawMat: string, allowedMaterials?: string[]): TipoMaterial | string | null {
  if (!rawMat) return null;
  const clean = rawMat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (allowedMaterials && allowedMaterials.length > 0) {
    const match = allowedMaterials.find(
      m => m.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() === clean
    );
    if (match) return match;
  }
  if (clean === 'reutilizavel' || clean === 'fixo') return 'Reutilizavel';
  if (clean === 'descartavel' || clean === 'descartaveis' || clean === 'consumivel') return 'Descartavel';
  return rawMat;
}

function normalizeServico(rawServico: string, allowedServicos?: string[]): string {
  if (!rawServico) return '';
  const clean = rawServico.toUpperCase().trim();
  const list = allowedServicos && allowedServicos.length > 0 ? allowedServicos : DEFAULT_SERVICOS;
  for (const s of list) {
    if (s.toUpperCase().trim() === clean) return s;
  }
  return clean;
}

/**
 * Normaliza todas as linhas lidas do ficheiro Excel com auxílio dos dados de referência do sistema
 */
export function normalizeImportRows(
  rawRows: ImportRowRaw[],
  refData: Partial<ReferenceData>
): {
  normalizedRows: ImportRowNormalized[];
  localErrorsCount: number;
  localWarningsCount: number;
} {
  const normalizedRows: ImportRowNormalized[] = [];
  const seenCodes = new Map<string, number>(); // codigo -> primeira linha onde apareceu

  const categorias = refData.categorias || [];
  const unidades = refData.unidades || [];
  const armazens = refData.armazens || [];
  const taxasIva = refData.taxasIva || [];

  rawRows.forEach((raw, idx) => {
    const excelLine = raw._excelRowNumber || idx + 2;
    const errosLocais: string[] = [];
    const avisosLocais: string[] = [];

    // 1. Tipo
    const rawTipoStr = cleanString(raw.tipo);
    const tipo = normalizeTipo(rawTipoStr);

    if (!tipo) {
      errosLocais.push('Tipo de artigo obrigatório (Consumivel, Acabado, Revenda ou Material).');
    } else if (!IMPORT_TYPES.includes(tipo as ItemTipo)) {
      errosLocais.push(`Tipo de artigo "${tipo}" inválido. Permitidos: ${IMPORT_TYPES.join(', ')}.`);
    }

    // 2. Nome
    const nome = cleanString(raw.nome);
    if (!nome) {
      errosLocais.push('Nome da designação do artigo é obrigatório.');
    }

    // 3. Código
    const codigo = cleanString(raw.codigo);
    if (codigo) {
      const codeUpper = codigo.toUpperCase();
      if (seenCodes.has(codeUpper)) {
        errosLocais.push(
          `Código "${codigo}" duplicado no próprio Excel (já registado na linha ${seenCodes.get(codeUpper)}).`
        );
      } else {
        seenCodes.set(codeUpper, excelLine);
      }
    }

    // 4. Categoria (Resolução com dados de referência)
    const categoriaNome = cleanString(raw.categoria);
    let categoriaId: number | null = null;

    if (raw.categoria_id && !isNaN(Number(raw.categoria_id))) {
      categoriaId = Number(raw.categoria_id);
    } else if (categoriaNome) {
      const foundCat = categorias.find(
        c => c.nome.trim().toLowerCase() === categoriaNome.toLowerCase()
      );
      if (foundCat) {
        categoriaId = foundCat.id;
      } else {
        avisosLocais.push(`Categoria "${categoriaNome}" não encontrada na lista atual do sistema.`);
      }
    } else if (tipo !== 'Material') {
      avisosLocais.push('Categoria não informada.');
    }

    // 5. Unidade de Medida
    const unidadeStr = cleanString(raw.unidade_medida);
    let unidadeId: number | null = null;

    if (raw.unidade_medida_id && !isNaN(Number(raw.unidade_medida_id))) {
      unidadeId = Number(raw.unidade_medida_id);
    } else if (unidadeStr) {
      const foundUni = unidades.find(
        u =>
          (u.sigla && u.sigla.trim().toLowerCase() === unidadeStr.toLowerCase()) ||
          (u.nome && u.nome.trim().toLowerCase() === unidadeStr.toLowerCase())
      );
      if (foundUni) {
        unidadeId = foundUni.id;
      } else {
        avisosLocais.push(`Unidade de medida "${unidadeStr}" não localizada nas unidades padrão.`);
      }
    } else {
      errosLocais.push('Unidade de medida é obrigatória.');
    }

    // 6. Serviço (Regras por tipo conforme Matriz Oficial)
    let servico = normalizeServico(cleanString(raw.servico), refData.servicos);
    if (tipo === 'Consumivel') {
      if (!servico) {
        servico = 'ABASTECIMENTO';
      } else if (servico !== 'ABASTECIMENTO') {
        errosLocais.push('Serviço inválido para Consumível. Apenas ABASTECIMENTO é permitido.');
      }
    } else if (tipo === 'Acabado') {
      if (!servico) {
        errosLocais.push('Serviço obrigatório para Produto Acabado (COZINHA ou PASTELARIA).');
      } else if (servico !== 'COZINHA' && servico !== 'PASTELARIA') {
        errosLocais.push('Serviço inválido para Produto Acabado. Apenas COZINHA ou PASTELARIA são permitidos.');
      }
    } else if (tipo === 'Revenda') {
      if (!servico) {
        servico = 'BAR';
      } else if (servico !== 'BAR') {
        errosLocais.push('Serviço inválido para Revenda. Apenas BAR é permitido.');
      }
    } else if (tipo === 'Material') {
      servico = ''; // Não aplicável
    }

    // 7. Taxa IVA
    const { taxa: taxaIvaNum, raw: taxaIvaRaw } = parseTaxaIva(raw.taxa_iva);
    let taxaIvaId: number | null = null;

    if (raw.taxa_iva_id && !isNaN(Number(raw.taxa_iva_id))) {
      taxaIvaId = Number(raw.taxa_iva_id);
    } else if (taxaIvaNum !== null) {
      const foundTaxa = taxasIva.find(t => Number(t.taxa) === taxaIvaNum);
      if (foundTaxa) {
        taxaIvaId = foundTaxa.id;
      }
    }

    // 8. Preços e Valores (Matriz por tipo de item)
    let precoCompra = parseNumber(raw.preco_compra);
    let precoVenda = parseNumber(raw.preco_venda);
    let valorUnitario = parseNumber(raw.valor_unitario);
    let tempoProducao = parseNumber(raw.tempo_producao);

    if (tipo === 'Consumivel') {
      if (precoCompra === null || precoCompra <= 0) {
        errosLocais.push('Preço de compra é obrigatório para artigos do tipo Consumível.');
      }
      precoVenda = 0; // Forçado a 0
      tempoProducao = null; // Não permitido
      if (valorUnitario === null && precoCompra !== null) {
        valorUnitario = precoCompra;
      }
    } else if (tipo === 'Acabado') {
      if (precoVenda === null || precoVenda <= 0) {
        errosLocais.push('Preço de venda é obrigatório para Produto Acabado.');
      }
      precoCompra = 0; // Forçado a 0 (calculado por ficha técnica)
      if (tempoProducao === null || tempoProducao <= 0 || !Number.isInteger(tempoProducao)) {
        errosLocais.push('Tempo de produção (em minutos inteiros) é obrigatório para Produto Acabado.');
      }
    } else if (tipo === 'Revenda') {
      if (precoCompra === null || precoCompra <= 0) {
        errosLocais.push('Preço de compra é obrigatório para artigos de Revenda.');
      }
      if (precoVenda === null || precoVenda <= 0) {
        errosLocais.push('Preço de venda é obrigatório para artigos de Revenda.');
      }
      tempoProducao = null; // Não permitido
    } else if (tipo === 'Material') {
      if (valorUnitario === null || valorUnitario <= 0) {
        errosLocais.push('Valor patrimonial unitário é obrigatório para Material.');
      }
      precoCompra = null;
      precoVenda = null;
      tempoProducao = null;
    }

    // 9. Stock e Armazém
    const stockMinimo = parseNumber(raw.stock_minimo) ?? 0;
    const quantidadeInicial = parseNumber(raw.quantidade_inicial) ?? 0;
    const armazemNome = cleanString(raw.armazem);
    let armazemId: number | null = null;

    if (raw.armazem_id && !isNaN(Number(raw.armazem_id))) {
      armazemId = Number(raw.armazem_id);
    } else if (armazemNome) {
      const foundArm = armazens.find(
        a => a.nome.trim().toLowerCase() === armazemNome.toLowerCase()
      );
      if (foundArm) {
        armazemId = foundArm.id;
      } else {
        avisosLocais.push(`Armazém "${armazemNome}" não encontrado nas configurações.`);
      }
    }

    if (quantidadeInicial && quantidadeInicial > 0 && !armazemId && !armazemNome) {
      errosLocais.push(
        `Para dar entrada inicial de ${quantidadeInicial} unidades de stock, é obrigatório indicar o armazém.`
      );
    }

    // 10. Tipo de Material
    const tipoMaterial = normalizeTipoMaterial(cleanString(raw.tipo_material), refData.tiposMaterial);
    if (tipo === 'Material') {
      if (!tipoMaterial) {
        errosLocais.push('Tipo de material é obrigatório (Reutilizavel ou Consumivel).');
      } else if (tipoMaterial !== 'Reutilizavel' && tipoMaterial !== 'Consumivel' && tipoMaterial !== 'Descartavel') {
        errosLocais.push(
          `Tipo de material "${tipoMaterial}" inválido. Utilize Reutilizavel ou Consumivel.`
        );
      }
    }

    // 11. Descrição opcional
    const descricao = cleanString(raw.descricao);

    const rowNormalized: ImportRowNormalized = {
      linha: excelLine,
      tipo,
      codigo,
      nome,
      descricao: descricao || undefined,
      categoria: categoriaNome,
      categoria_id: categoriaId,
      unidade_medida: unidadeStr,
      unidade_medida_id: unidadeId,
      servico,
      taxa_iva: taxaIvaNum,
      taxa_iva_id: taxaIvaId,
      preco_compra: precoCompra,
      preco_venda: precoVenda,
      valor_unitario: valorUnitario,
      tempo_producao: tempoProducao,
      stock_minimo: stockMinimo,
      quantidade_inicial: quantidadeInicial,
      armazem: armazemNome,
      armazem_id: armazemId,
      tipo_material: tipo === 'Material' ? tipoMaterial : null,
      _errosLocais: errosLocais,
      _avisosLocais: avisosLocais
    };

    normalizedRows.push(rowNormalized);
  });

  const localErrorsCount = normalizedRows.reduce(
    (acc, r) => acc + (r._errosLocais?.length || 0),
    0
  );
  const localWarningsCount = normalizedRows.reduce(
    (acc, r) => acc + (r._avisosLocais?.length || 0),
    0
  );

  return {
    normalizedRows,
    localErrorsCount,
    localWarningsCount
  };
}

/**
 * Re-avalia e normaliza uma linha específica quando um valor é alterado pelo ComboBox na interface
 */
export function renormalizeSingleRow(
  row: ImportRowNormalized,
  refData: Partial<ReferenceData>
): ImportRowNormalized {
  const errosLocais: string[] = [];
  const avisosLocais: string[] = [];

  const categorias = refData.categorias || [];
  const unidades = refData.unidades || [];
  const armazens = refData.armazens || [];
  const taxasIva = refData.taxasIva || [];

  // 1. Tipo
  const tipo = normalizeTipo(cleanString(row.tipo));
  if (!tipo) {
    errosLocais.push('Tipo de artigo obrigatório (Consumivel, Acabado, Revenda ou Material).');
  } else if (!IMPORT_TYPES.includes(tipo as ItemTipo)) {
    errosLocais.push(`Tipo de artigo "${tipo}" inválido.`);
  }

  // 2. Nome
  const nome = cleanString(row.nome);
  if (!nome) {
    errosLocais.push('Nome da designação do artigo é obrigatório.');
  }

  // 3. Categoria
  const categoriaNome = cleanString(row.categoria);
  let categoriaId: number | null = row.categoria_id;

  if (categoriaNome) {
    const foundCat = categorias.find(
      c => c.nome.trim().toLowerCase() === categoriaNome.toLowerCase()
    );
    if (foundCat) {
      categoriaId = foundCat.id;
    } else if (!categoriaId) {
      avisosLocais.push(`Categoria "${categoriaNome}" não encontrada na lista atual do sistema.`);
    }
  } else if (tipo !== 'Material') {
    avisosLocais.push('Categoria não informada.');
  }

  // 4. Unidade
  const unidadeStr = cleanString(row.unidade_medida);
  let unidadeId: number | null = row.unidade_medida_id;

  if (unidadeStr) {
    const foundUni = unidades.find(
      u =>
        (u.sigla && u.sigla.trim().toLowerCase() === unidadeStr.toLowerCase()) ||
        (u.nome && u.nome.trim().toLowerCase() === unidadeStr.toLowerCase())
    );
    if (foundUni) {
      unidadeId = foundUni.id;
    } else if (!unidadeId) {
      avisosLocais.push(`Unidade de medida "${unidadeStr}" não localizada nas unidades padrão.`);
    }
  } else {
    errosLocais.push('Unidade de medida é obrigatória.');
  }

  // 5. Servico
  let servico = normalizeServico(cleanString(row.servico), refData.servicos);
  if (tipo === 'Consumivel') {
    if (!servico) {
      servico = 'ABASTECIMENTO';
    } else if (servico !== 'ABASTECIMENTO') {
      errosLocais.push('Serviço inválido para Consumível. Apenas ABASTECIMENTO é permitido.');
    }
  } else if (tipo === 'Acabado') {
    if (!servico) {
      errosLocais.push('Serviço obrigatório para Produto Acabado (COZINHA ou PASTELARIA).');
    } else if (servico !== 'COZINHA' && servico !== 'PASTELARIA') {
      errosLocais.push('Serviço inválido para Produto Acabado. Apenas COZINHA ou PASTELARIA são permitidos.');
    }
  } else if (tipo === 'Revenda') {
    if (!servico) {
      servico = 'BAR';
    } else if (servico !== 'BAR') {
      errosLocais.push('Serviço inválido para Revenda. Apenas BAR é permitido.');
    }
  } else if (tipo === 'Material') {
    servico = ''; // Não aplicável
  }

  // 6. Taxa IVA
  const taxaIvaNum = row.taxa_iva;
  let taxaIvaId = row.taxa_iva_id;
  if (taxaIvaNum !== null) {
    const foundTaxa = taxasIva.find(t => Number(t.taxa) === Number(taxaIvaNum));
    if (foundTaxa) {
      taxaIvaId = foundTaxa.id;
    }
  }

  // 7. Preços e Valores (Matriz Oficial)
  let precoCompra = row.preco_compra;
  let precoVenda = row.preco_venda;
  let valorUnitario = row.valor_unitario;
  let tempoProducao = row.tempo_producao;

  if (tipo === 'Consumivel') {
    if (precoCompra === null || precoCompra <= 0) {
      errosLocais.push('Preço de compra é obrigatório para artigos do tipo Consumível.');
    }
    precoVenda = 0;
    tempoProducao = null;
    if (valorUnitario === null && precoCompra !== null) {
      valorUnitario = precoCompra;
    }
  } else if (tipo === 'Acabado') {
    if (precoVenda === null || precoVenda <= 0) {
      errosLocais.push('Preço de venda é obrigatório para Produto Acabado.');
    }
    precoCompra = 0;
    if (tempoProducao === null || tempoProducao <= 0 || !Number.isInteger(tempoProducao)) {
      errosLocais.push('Tempo de produção (em minutos inteiros) é obrigatório para Produto Acabado.');
    }
  } else if (tipo === 'Revenda') {
    if (precoCompra === null || precoCompra <= 0) {
      errosLocais.push('Preço de compra é obrigatório para artigos de Revenda.');
    }
    if (precoVenda === null || precoVenda <= 0) {
      errosLocais.push('Preço de venda é obrigatório para artigos de Revenda.');
    }
    tempoProducao = null;
  } else if (tipo === 'Material') {
    if (valorUnitario === null || valorUnitario <= 0) {
      errosLocais.push('Valor patrimonial unitário é obrigatório para Material.');
    }
    precoCompra = null;
    precoVenda = null;
    tempoProducao = null;
  }

  // 8. Armazem e Stock
  const armazemNome = cleanString(row.armazem);
  let armazemId = row.armazem_id;
  if (armazemNome) {
    const foundArm = armazens.find(
      a => a.nome.trim().toLowerCase() === armazemNome.toLowerCase()
    );
    if (foundArm) {
      armazemId = foundArm.id;
    }
  }

  const quantidadeInicial = row.quantidade_inicial ?? 0;
  if (quantidadeInicial > 0 && !armazemId && !armazemNome) {
    errosLocais.push(
      `Para dar entrada inicial de ${quantidadeInicial} unidades de stock, é obrigatório indicar o armazém.`
    );
  }

  // 9. Tipo de Material
  const tipoMaterial = normalizeTipoMaterial(cleanString(row.tipo_material), refData.tiposMaterial);
  if (tipo === 'Material') {
    if (!tipoMaterial) {
      errosLocais.push('Tipo de material é obrigatório (Reutilizavel ou Consumivel).');
    } else if (tipoMaterial !== 'Reutilizavel' && tipoMaterial !== 'Consumivel' && tipoMaterial !== 'Descartavel') {
      errosLocais.push('Tipo de material inválido. Utilize Reutilizavel ou Consumivel.');
    }
  }

  return {
    ...row,
    tipo: tipo as ItemTipo,
    nome,
    categoria: categoriaNome,
    categoria_id: categoriaId,
    unidade_medida: unidadeStr,
    unidade_medida_id: unidadeId,
    servico,
    taxa_iva: taxaIvaNum,
    taxa_iva_id: taxaIvaId,
    preco_compra: precoCompra,
    preco_venda: precoVenda,
    valor_unitario: valorUnitario,
    tempo_producao: tempoProducao,
    stock_minimo: row.stock_minimo ?? 0,
    quantidade_inicial: quantidadeInicial,
    armazem: armazemNome,
    armazem_id: armazemId,
    tipo_material: tipo === 'Material' ? tipoMaterial : null,
    _errosLocais: errosLocais,
    _avisosLocais: avisosLocais
  };
}

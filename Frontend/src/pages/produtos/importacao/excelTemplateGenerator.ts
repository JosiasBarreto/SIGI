import ExcelJS from 'exceljs';
import { ReferenceData, ImportRowNormalized } from './types';
import { EXCEL_COLUMNS, MODELO_EXEMPLOS, IMPORT_TYPES, MATERIAL_TYPES, DEFAULT_SERVICOS } from './constants';

export async function gerarModeloExcel(
  refData?: Partial<ReferenceData>,
  linhasIniciais?: ImportRowNormalized[] | any[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIGI Armazém';
  workbook.lastModifiedBy = 'SIGI Armazém';
  workbook.created = new Date();
  workbook.modified = new Date();

  // 1. Folha principal: Importação
  const wsImportacao = workbook.addWorksheet('Importação', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // Configurar colunas da folha Importação
  wsImportacao.columns = EXCEL_COLUMNS.map(col => ({
    header: col.key,
    key: col.key,
    width: col.width
  }));

  // Estilizar a linha de cabeçalho
  const headerRow = wsImportacao.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' } // Azul escuro corporativo
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 28;

  // Inserir linhas de exemplo ou linhas personalizadas
  if (linhasIniciais && linhasIniciais.length > 0) {
    linhasIniciais.forEach(item => {
      wsImportacao.addRow({
        tipo: item.tipo || 'Consumivel',
        codigo: item.codigo || '',
        nome: item.nome || '',
        descricao: item.descricao || '',
        categoria: item.categoria || '',
        unidade_medida: item.unidade_medida || 'UN',
        servico: item.servico || '',
        taxa_iva: item.taxa_iva !== null && item.taxa_iva !== undefined ? `${item.taxa_iva}%` : '15%',
        preco_compra: item.preco_compra ?? '',
        preco_venda: item.preco_venda ?? '',
        valor_unitario: item.valor_unitario ?? '',
        tempo_producao: item.tempo_producao ?? '',
        stock_minimo: item.stock_minimo ?? '',
        quantidade_inicial: item.quantidade_inicial ?? '',
        armazem: item.armazem || '',
        tipo_material: item.tipo_material || ''
      });
    });
  } else {
    MODELO_EXEMPLOS.forEach(ex => {
      wsImportacao.addRow(ex);
    });
  }

  // 1.1 Preparar listas de valores controlados do backend
  const tiposDisponiveis = refData?.tipos?.length ? refData.tipos : IMPORT_TYPES;
  const matTiposDisponiveis = refData?.tiposMaterial?.length ? refData.tiposMaterial : MATERIAL_TYPES;

  // Lista de Categorias vindas do backend
  const catNames = refData?.categorias?.length
    ? Array.from(new Set(refData.categorias.map(c => c.nome.trim()).filter(Boolean)))
    : [
        'Bebidas',
        'Lacticínios',
        'Ingredientes',
        'Pastelaria',
        'Padaria',
        'Embalagens',
        'Limpeza e Higiene',
        'Carnes e Derivados',
        'Mercearia',
        'Frutas e Legumes'
      ];

  // Lista de Unidades de Medida vindas do backend
  const unitNames = refData?.unidades?.length
    ? Array.from(new Set(refData.unidades.map(u => (u.sigla || u.nome).trim()).filter(Boolean)))
    : ['KG', 'UN', 'L', 'G', 'ML', 'CX', 'PCT', 'DZ', 'PAR'];

  // Lista de Serviços vindos do backend
  const servNames: string[] = refData?.servicos?.length
    ? Array.from(new Set(refData.servicos.map(s => s.trim()).filter(Boolean)))
    : [...DEFAULT_SERVICOS];

  // Lista de Taxas de IVA vindas do backend
  const ivaValues = refData?.taxasIva?.length
    ? Array.from(new Set(refData.taxasIva.map(t => `${t.taxa}%`)))
    : ['15%', '0%', '14%', '7%', '5%'];

  // Lista de Armazéns vindos do backend
  const armNames = refData?.armazens?.length
    ? Array.from(new Set(refData.armazens.map(a => a.nome.trim()).filter(Boolean)))
    : ['Armazém Principal', 'Armazém Cozinha', 'Armazém Pastelaria', 'Armazém Bar'];

  // 2. Folha: Tipos
  const wsTipos = workbook.addWorksheet('Tipos');
  wsTipos.columns = [
    { header: 'Tipo', key: 'tipo', width: 16 },
    { header: 'Finalidade', key: 'finalidade', width: 45 },
    { header: 'Campos Relevantes', key: 'campos', width: 70 }
  ];
  wsTipos.getRow(1).font = { bold: true };
  wsTipos.addRows([
    { tipo: 'Consumivel', finalidade: 'Ingrediente ou matéria-prima para confeção', campos: 'tipo, nome, categoria, unidade_medida, servico, preco_compra, stock_minimo, quantidade_inicial, armazem' },
    { tipo: 'Acabado', finalidade: 'Produto final confecionado internamente pela empresa', campos: 'tipo, nome, categoria, unidade_medida, servico, preco_venda, tempo_producao, stock_minimo, quantidade_inicial, armazem, taxa_iva' },
    { tipo: 'Revenda', finalidade: 'Artigo comercial adquirido pronto para venda direta', campos: 'tipo, nome, categoria, unidade_medida, servico, preco_compra, preco_venda, stock_minimo, quantidade_inicial, armazem, taxa_iva' },
    { tipo: 'Material', finalidade: 'Equipamento, mobiliário ou utensílio para eventos e serviços', campos: 'tipo, nome, tipo_material (Reutilizavel/Consumivel), unidade_medida, valor_unitario, stock_minimo, quantidade_inicial, armazem' }
  ]);

  // 3. Folha: Categorias (do backend)
  const wsCategorias = workbook.addWorksheet('Categorias');
  wsCategorias.columns = [
    { header: 'Categoria', key: 'nome', width: 35 },
    { header: 'Descrição', key: 'descricao', width: 45 }
  ];
  wsCategorias.getRow(1).font = { bold: true };
  catNames.forEach(nome => {
    const found = refData?.categorias?.find(c => c.nome.trim().toLowerCase() === nome.toLowerCase());
    wsCategorias.addRow({ nome, descricao: found?.descricao || '' });
  });

  // 4. Folha: Unidades (do backend)
  const wsUnidades = workbook.addWorksheet('Unidades');
  wsUnidades.columns = [
    { header: 'Sigla / Código', key: 'sigla', width: 16 },
    { header: 'Nome', key: 'nome', width: 25 },
    { header: 'Descrição', key: 'descricao', width: 35 }
  ];
  wsUnidades.getRow(1).font = { bold: true };
  unitNames.forEach(sigla => {
    const found = refData?.unidades?.find(u => (u.sigla || u.nome).trim().toUpperCase() === sigla.toUpperCase());
    wsUnidades.addRow({ sigla, nome: found?.nome || sigla, descricao: found?.descricao || '' });
  });

  // 5. Folha: Taxas_IVA (do backend)
  const wsTaxasIva = workbook.addWorksheet('Taxas_IVA');
  wsTaxasIva.columns = [
    { header: 'Taxa', key: 'taxa', width: 14 },
    { header: 'Descrição', key: 'descricao', width: 35 }
  ];
  wsTaxasIva.getRow(1).font = { bold: true };
  ivaValues.forEach(taxaStr => {
    const num = parseFloat(taxaStr.replace('%', ''));
    const found = refData?.taxasIva?.find(t => t.taxa === num);
    wsTaxasIva.addRow({ taxa: taxaStr, descricao: found?.descricao || `Taxa de ${taxaStr}` });
  });

  // 6. Folha: Armazéns (do backend)
  const wsArmazens = workbook.addWorksheet('Armazéns');
  wsArmazens.columns = [
    { header: 'Armazém', key: 'nome', width: 30 },
    { header: 'Código', key: 'codigo', width: 15 },
    { header: 'Localização', key: 'localizacao', width: 25 },
    { header: 'Descrição', key: 'descricao', width: 35 }
  ];
  wsArmazens.getRow(1).font = { bold: true };
  armNames.forEach(nome => {
    const found = refData?.armazens?.find(a => a.nome.trim().toLowerCase() === nome.toLowerCase());
    wsArmazens.addRow({
      nome,
      codigo: found?.codigo || '',
      localizacao: found?.localizacao || '',
      descricao: found?.descricao || ''
    });
  });

  // 7. Folha: Serviços (do backend)
  const wsServicos = workbook.addWorksheet('Serviços');
  wsServicos.columns = [
    { header: 'Código do Serviço', key: 'codigo', width: 22 },
    { header: 'Designação', key: 'nome', width: 30 },
    { header: 'Tipo Padrão Sugerido', key: 'tipo_padrao', width: 25 }
  ];
  wsServicos.getRow(1).font = { bold: true };
  if (refData?.servicosDetalhe?.length) {
    refData.servicosDetalhe.forEach(sd => wsServicos.addRow({ codigo: sd.codigo, nome: sd.nome, tipo_padrao: sd.tipo_padrao || '' }));
  } else {
    servNames.forEach(s => wsServicos.addRow({ codigo: s, nome: s, tipo_padrao: s === 'ABASTECIMENTO' ? 'Consumivel' : s === 'BAR' ? 'Revenda' : 'Acabado' }));
  }

  // 8. Folha: Tipo_Material
  const wsTipoMaterial = workbook.addWorksheet('Tipo_Material');
  wsTipoMaterial.columns = [
    { header: 'Tipo_Material', key: 'tipo', width: 20 },
    { header: 'Descrição', key: 'descricao', width: 70 }
  ];
  wsTipoMaterial.getRow(1).font = { bold: true };
  wsTipoMaterial.addRow({ tipo: 'Reutilizavel', descricao: 'Material com retorno ao armazém após eventos (louças, toalhas, mesas, bandejas)' });
  wsTipoMaterial.addRow({ tipo: 'Descartavel', descricao: 'Material de utilização única (copos de plástico, guardanapos, palitos, película)' });

  // 9. Folha: Instruções / Leia-me
  const wsInstrucoes = workbook.addWorksheet('Leia-me');
  wsInstrucoes.columns = [{ header: 'Manual de Importação de Catálogo SIGI', key: 'texto', width: 110 }];
  wsInstrucoes.getRow(1).font = { bold: true, size: 12 };
  const linhasManual = [
    'SIGI – SISTEMA INTEGRADO DE GESTÃO INTERNA SABOR IMBATÍVEL',
    'GUIA DE PREENCHIMENTO DO MODELO DE IMPORTAÇÃO DE CATÁLOGO',
    '',
    '1. LISTAS SUSPENSAS / COMBOBOXES NATIVOS:',
    '• Cada célula das colunas Tipo, Categoria, Unidade, Serviço, Taxa IVA, Armazém e Tipo Material possui uma seta suspensa (ComboBox).',
    '• Ao clicar na célula, clique na seta que aparece à direita para selecionar diretamente uma opção válida.',
    '',
    '2. CAMPOS OBRIGATÓRIOS POR TIPO:',
    '• Consumivel: tipo, nome, categoria, unidade_medida, servico, preco_compra',
    '• Acabado: tipo, nome, categoria, unidade_medida, servico, preco_venda, tempo_producao',
    '• Revenda: tipo, nome, categoria, unidade_medida, servico, preco_compra, preco_venda',
    '• Material: tipo, nome, tipo_material (Reutilizavel ou Descartavel), unidade_medida, valor_unitario',
    '',
    '3. CONTROLO E ENTRADA DE STOCK INICIAL:',
    '• Para criar automaticamente o registo de stock inicial, preencha os campos "quantidade_inicial" e "armazem".',
    '• Se a quantidade_inicial for deixada em branco ou 0, o artigo será criado sem movimento de stock inicial.',
    '',
    '4. PREÇOS E MOEDA:',
    '• Introduza valores numéricos sem símbolos de moeda (ex: 450 ou 5000.50).',
    '• A taxa de IVA pode ser selecionada diretamente na lista suspensa (ex: 15%, 0%).'
  ];
  linhasManual.forEach(linha => wsInstrucoes.addRow({ texto: linha }));

  // =========================================================================
  // APLICAÇÃO DE REGRAS DE VALIDAÇÃO DE DADOS (COMBOBOX COM SETA NAS CÉLULAS)
  // Alinhamento exato com a matriz EXCEL_COLUMNS:
  // 1: tipo | 2: codigo | 3: nome | 4: descricao | 5: categoria | 6: unidade_medida
  // 7: servico | 8: taxa_iva | 9: preco_compra | 10: preco_venda | 11: valor_unitario
  // 12: tempo_producao | 13: stock_minimo | 14: quantidade_inicial | 15: armazem | 16: tipo_material
  // =========================================================================
  const getColIdx = (key: string): number => {
    const idx = EXCEL_COLUMNS.findIndex(c => c.key === key);
    return idx >= 0 ? idx + 1 : -1;
  };

  const colTipo = getColIdx('tipo');
  const colCategoria = getColIdx('categoria');
  const colUnidade = getColIdx('unidade_medida');
  const colServico = getColIdx('servico');
  const colTaxaIva = getColIdx('taxa_iva');
  const colArmazem = getColIdx('armazem');
  const colTipoMaterial = getColIdx('tipo_material');

  // Helper para construir fórmulas de validação compatíveis (inline <= 250 caracteres ou referência à folha com '=')
  const buildFormula = (list: readonly string[] | string[], sheetName: string): string => {
    const inline = list.join(',');
    if (inline.length <= 250 && !inline.includes('"')) {
      return `"${inline}"`;
    }
    return `='${sheetName}'!$A$2:$A$${list.length + 1}`;
  };

  const catFormula = buildFormula(catNames, 'Categorias');
  const unitFormula = buildFormula(unitNames, 'Unidades');
  const servFormula = buildFormula(servNames, 'Serviços');
  const armFormula = buildFormula(armNames, 'Armazéns');
  const ivaFormula = buildFormula(ivaValues, 'Taxas_IVA');
  const tipoListInline = tiposDisponiveis.join(',');
  const matListInline = matTiposDisponiveis.join(',');

  // Aplicar validações nas células da folha de importação (linhas 2 a 500)
  for (let r = 2; r <= 500; r++) {
    const row = wsImportacao.getRow(r);

    // Coluna 1 - Tipo (ComboBox: Consumivel, Acabado, Revenda, Material)
    if (colTipo > 0) {
      row.getCell(colTipo).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [`"${tipoListInline}"`],
        showErrorMessage: true,
        errorTitle: 'Tipo Inválido',
        error: 'Selecione um tipo de produto da lista suspensa.'
      };
    }

    // Coluna 5 - Categoria (ComboBox com todas as categorias registadas na BD)
    if (colCategoria > 0) {
      row.getCell(colCategoria).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [catFormula],
        showErrorMessage: true,
        errorTitle: 'Categoria Inválida',
        error: 'Selecione uma categoria válida da lista suspensa.'
      };
    }

    // Coluna 6 - Unidade de Medida (ComboBox com todas as unidades registadas na BD)
    if (colUnidade > 0) {
      row.getCell(colUnidade).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: [unitFormula],
        showErrorMessage: true,
        errorTitle: 'Unidade Inválida',
        error: 'Selecione uma unidade de medida da lista suspensa (ex: KG, UN, L).'
      };
    }

    // Coluna 7 - Serviço (ComboBox com as áreas de afetação)
    if (colServico > 0) {
      row.getCell(colServico).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [servFormula],
        showErrorMessage: true,
        errorTitle: 'Serviço Inválido',
        error: 'Selecione uma área de serviço da lista suspensa.'
      };
    }

    // Coluna 8 - Taxa de IVA (ComboBox com todas as taxas fiscais da BD)
    if (colTaxaIva > 0) {
      row.getCell(colTaxaIva).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [ivaFormula],
        showErrorMessage: true,
        errorTitle: 'Taxa IVA Inválida',
        error: 'Selecione uma taxa de IVA da lista suspensa (ex: 14%, 0%).'
      };
    }

    // Coluna 15 - Armazém (ComboBox com os armazéns registados na BD)
    if (colArmazem > 0) {
      row.getCell(colArmazem).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [armFormula],
        showErrorMessage: true,
        errorTitle: 'Armazém Inválido',
        error: 'Selecione um armazém da lista suspensa.'
      };
    }

    // Coluna 16 - Tipo de Material (ComboBox Reutilizavel ou Consumivel)
    if (colTipoMaterial > 0) {
      row.getCell(colTipoMaterial).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${matListInline}"`],
        showErrorMessage: true,
        errorTitle: 'Tipo Material Inválido',
        error: 'Selecione Reutilizavel ou Consumivel.'
      };
    }
  }

  // Gerar o buffer binário com ExcelJS e descarregar no navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SIGI_Modelo_Importacao_Produtos_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

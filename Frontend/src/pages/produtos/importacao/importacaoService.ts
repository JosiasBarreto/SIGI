import apiClient from '../../../api/client';
import { productService, warehouseService, fiscalService } from '../../../services';
import {
  ImportRowNormalized,
  ValidationRowResult,
  ReferenceData,
  ImportFinalResult
} from './types';
import { DEFAULT_SERVICOS, IMPORT_TYPES, MATERIAL_TYPES } from './constants';

export class ImportacaoServiceError extends Error {
  statusCode?: number;
  errorCode?: string;
  details?: any;

  constructor(message: string, statusCode?: number, errorCode?: string, details?: any) {
    super(message);
    this.name = 'ImportacaoServiceError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

/**
 * Trata erros de requisição HTTP respeitando os requisitos de mensagens ERP
 */
function handleApiError(err: any): never {
  const status = err?.response?.status || err?.status || err?.statusCode;
  const data = err?.response?.data || err?.data;

  const serverMsg = data?.message || data?.detail || err?.message;
  const errorCode = data?.error_code || data?.code;

  if (status === 400) {
    const errorDetails = data?.errors || data?.erros || data?.details;
    const msg = serverMsg || 'Dados de importação inválidos. Verifique as linhas assinaladas.';
    throw new ImportacaoServiceError(msg, 400, errorCode, errorDetails);
  }

  if (status === 401) {
    throw new ImportacaoServiceError('A sua sessão expirou. Efetue novamente o login.', 401, errorCode);
  }

  if (status === 403) {
    throw new ImportacaoServiceError('Não possui permissão para realizar esta operação no armazém.', 403, errorCode);
  }

  if (status === 409) {
    throw new ImportacaoServiceError(
      serverMsg || 'Foram encontrados conflitos com dados já existentes na base de dados (códigos ou nomes duplicados).',
      409,
      errorCode
    );
  }

  if (status >= 500) {
    throw new ImportacaoServiceError(
      'Ocorreu um erro interno no servidor. Nenhum dado deve ser considerado importado até que a operação seja confirmada pelo sistema.',
      500,
      errorCode
    );
  }

  throw new ImportacaoServiceError(
    serverMsg || 'Ocorreu um erro inesperado na comunicação com o servidor.',
    status,
    errorCode
  );
}

/**
 * Carrega todos os dados de referência ativos no sistema.
 * Consulta prioritariamente as rotas oficiais de gestão onde o utilizador cria e edita
 * Categorias (/v1/armazem/categorias), Unidades (/v1/armazem/unidades-medida),
 * Taxas de IVA (/v1/fiscal/iva) e Armazéns (/v1/armazem/armazens),
 * combinando com os dados auxiliares consolidados para obter serviços e detalhes adicionais.
 */
export async function carregarDadosReferencia(): Promise<ReferenceData> {
  // 1. Executar chamadas em paralelo para máxima velocidade e garantir dados reais atualizados
  const endpointsAuxiliares = [
    '/v1/armazem/dados-auxiliares',
    '/api/v1/armazem/dados-auxiliares',
    '/v1/armazem/opcoes',
    '/v1/armazem/auxiliares'
  ];

  const buscarDadosAuxiliares = async (): Promise<any> => {
    for (const ep of endpointsAuxiliares) {
      try {
        const res: any = await apiClient.get(ep, { timeout: 6000 });
        const data = res?.data && typeof res.data === 'object' && (res.data.categorias || res.data.unidades_medida)
          ? res.data
          : res;
        if (data && (data.categorias || data.unidades_medida || data.taxas_iva || data.armazens || data.servicos)) {
          return data;
        }
      } catch {
        continue;
      }
    }
    return null;
  };

  const [catRes, uniRes, armRes, ivaRes, auxRes] = await Promise.allSettled([
    productService.getCategorias(),
    productService.getUnidadesMedida(),
    warehouseService.getAll({ per_page: 1000 }),
    fiscalService.getIvaRates(),
    buscarDadosAuxiliares()
  ]);

  const rawAux = auxRes.status === 'fulfilled' ? auxRes.value : null;

  // 2. Processar e Unificar Categorias
  const categoriasMap = new Map<string, { id: number; nome: string; descricao?: string }>();

  // Prioridade 1: Categorias da rota oficial /v1/armazem/categorias
  if (catRes.status === 'fulfilled' && Array.isArray(catRes.value)) {
    catRes.value.forEach((c: any) => {
      const nome = String(c.nome || c.name || '').trim();
      if (nome) {
        categoriasMap.set(nome.toLowerCase(), {
          id: Number(c.id),
          nome,
          descricao: c.descricao || ''
        });
      }
    });
  }

  // Prioridade 2: Categorias de dados-auxiliares (adiciona se não existir)
  if (rawAux) {
    const rawCats: any[] = rawAux.categorias || rawAux.categories || [];
    rawCats.forEach((c: any) => {
      const nome = String(c.nome || c.name || '').trim();
      if (nome && !categoriasMap.has(nome.toLowerCase())) {
        categoriasMap.set(nome.toLowerCase(), {
          id: Number(c.id),
          nome,
          descricao: c.descricao || ''
        });
      }
    });
  }

  const categorias = Array.from(categoriasMap.values());

  // 3. Processar e Unificar Unidades de Medida
  const unidadesMap = new Map<string, { id: number; sigla: string; nome: string; descricao?: string }>();

  // Prioridade 1: Unidades da rota oficial /v1/armazem/unidades-medida
  if (uniRes.status === 'fulfilled' && Array.isArray(uniRes.value)) {
    uniRes.value.forEach((u: any) => {
      const sigla = String(u.sigla || u.nome || '').trim().toUpperCase();
      const nome = String(u.nome || u.sigla || '').trim();
      if (sigla) {
        unidadesMap.set(sigla, {
          id: Number(u.id),
          sigla,
          nome,
          descricao: u.descricao || ''
        });
      }
    });
  }

  // Prioridade 2: Unidades de dados-auxiliares
  if (rawAux) {
    const rawUnis: any[] = rawAux.unidades_medida || rawAux.unidades || [];
    rawUnis.forEach((u: any) => {
      const sigla = String(u.sigla || u.nome || '').trim().toUpperCase();
      const nome = String(u.nome || u.sigla || '').trim();
      if (sigla && !unidadesMap.has(sigla)) {
        unidadesMap.set(sigla, {
          id: Number(u.id),
          sigla,
          nome,
          descricao: u.descricao || ''
        });
      }
    });
  }

  const unidades = Array.from(unidadesMap.values());

  // 4. Processar e Unificar Taxas de IVA
  const taxasMap = new Map<number, { id: number; taxa: number; percentagem: number; descricao: string; ativo: boolean }>();

  // Prioridade 1: Taxas da rota oficial /v1/fiscal/iva
  if (ivaRes.status === 'fulfilled') {
    const val: any = ivaRes.value;
    const rawIva = Array.isArray(val) ? val : Array.isArray(val?.data) ? val.data : val?.items || [];
    rawIva.forEach((t: any) => {
      const percentagem = Number(
        t.percentagem !== undefined ? t.percentagem : t.taxa !== undefined ? t.taxa : (t.valor ?? 0)
      );
      if (!isNaN(percentagem)) {
        taxasMap.set(percentagem, {
          id: Number(t.id),
          taxa: percentagem,
          percentagem,
          descricao: t.descricao || `Taxa ${percentagem}%`,
          ativo: t.ativo !== false
        });
      }
    });
  }

  // Prioridade 2: Taxas de dados-auxiliares
  if (rawAux) {
    const rawTaxas: any[] = rawAux.taxas_iva || rawAux.taxasIva || [];
    rawTaxas.forEach((t: any) => {
      const percentagem = Number(
        t.percentagem !== undefined ? t.percentagem : t.taxa !== undefined ? t.taxa : (t.valor ?? 0)
      );
      if (!isNaN(percentagem) && !taxasMap.has(percentagem)) {
        taxasMap.set(percentagem, {
          id: Number(t.id),
          taxa: percentagem,
          percentagem,
          descricao: t.descricao || `Taxa ${percentagem}%`,
          ativo: t.ativo !== false
        });
      }
    });
  }

  const taxasIva = Array.from(taxasMap.values()).sort((a, b) => a.taxa - b.taxa);

  // 5. Processar e Unificar Armazéns
  const armazensMap = new Map<string, { id: number; codigo: string; nome: string; localizacao?: string; descricao?: string; principal?: boolean }>();

  if (armRes.status === 'fulfilled') {
    const val: any = armRes.value;
    const rawArms = Array.isArray(val) ? val : Array.isArray(val?.items) ? val.items : val?.data || [];
    rawArms.forEach((a: any) => {
      const nome = String(a.nome || a.name || '').trim();
      if (nome) {
        armazensMap.set(nome.toLowerCase(), {
          id: Number(a.id),
          codigo: a.codigo || '',
          nome,
          localizacao: a.localizacao || '',
          descricao: a.descricao || '',
          principal: Boolean(a.principal)
        });
      }
    });
  }

  if (rawAux) {
    const rawArms: any[] = rawAux.armazens || rawAux.warehouses || [];
    rawArms.forEach((a: any) => {
      const nome = String(a.nome || a.name || '').trim();
      if (nome && !armazensMap.has(nome.toLowerCase())) {
        armazensMap.set(nome.toLowerCase(), {
          id: Number(a.id),
          codigo: a.codigo || '',
          nome,
          localizacao: a.localizacao || '',
          descricao: a.descricao || '',
          principal: Boolean(a.principal)
        });
      }
    });
  }

  const armazens = Array.from(armazensMap.values());

  // 6. Serviços e Detalhes
  const servicos: string[] = rawAux && Array.isArray(rawAux.servicos) && rawAux.servicos.length > 0
    ? rawAux.servicos.map((s: any) => String(s).trim().toUpperCase())
    : [...DEFAULT_SERVICOS];

  const servicosDetalhe = rawAux && Array.isArray(rawAux.servicos_detalhe)
    ? rawAux.servicos_detalhe.map((sd: any) => ({
        codigo: String(sd.codigo || sd.cod || '').trim().toUpperCase(),
        nome: String(sd.nome || sd.label || '').trim(),
        tipo_padrao: sd.tipo_padrao
      }))
    : undefined;

  // 7. Tipos de Produto / Tipos de Material
  const tipos: string[] = rawAux && Array.isArray(rawAux.tipos_produto) && rawAux.tipos_produto.length > 0
    ? rawAux.tipos_produto
    : [...IMPORT_TYPES];

  const tiposMaterial: string[] = rawAux && Array.isArray(rawAux.tipos_material) && rawAux.tipos_material.length > 0
    ? rawAux.tipos_material
    : [...MATERIAL_TYPES];

  return {
    categorias,
    unidades,
    armazens,
    taxasIva,
    servicos,
    servicosDetalhe,
    tipos,
    tiposMaterial,
    origem: 'backend_consolidado',
    endpointOrigem: 'rotas oficiais de gestao e dados auxiliares',
    totalCategorias: categorias.length,
    totalUnidades: unidades.length,
    totalArmazens: armazens.length,
    totalTaxasIva: taxasIva.length,
    timestampSincronizacao: new Date().toLocaleTimeString('pt-PT'),
    isLoading: false,
    error: null
  };
}

/**
 * Helper para extrair texto amigável de erros e avisos retornados pelo backend
 */
function extractMessage(item: any): string {
  if (typeof item === 'string') return item;
  if (!item) return '';
  if (item.message) {
    return item.campo ? `[${item.campo}] ${item.message}` : item.message;
  }
  if (item.msg) return item.msg;
  if (item.detail) return item.detail;
  return JSON.stringify(item);
}

/**
 * Constrói o payload canónico para a API de Importação do SIGI
 */
export function buildCanonicalImportPayload(linhas: ImportRowNormalized[]) {
  return {
    linhas: linhas.map(r => ({
      linha: r.linha,
      tipo: r.tipo,
      codigo: r.codigo ? r.codigo.trim() : null,
      nome: r.nome ? r.nome.trim() : '',
      categoria: r.categoria ? r.categoria.trim() : null,
      categoria_id: r.categoria_id ?? null,
      unidade_medida: r.unidade_medida ? r.unidade_medida.trim() : null,
      unidade_medida_id: r.unidade_medida_id ?? null,
      servico: r.tipo === 'Material' ? null : (r.servico ? r.servico.trim().toUpperCase() : null),
      taxa_iva: r.taxa_iva ?? 0,
      taxa_iva_id: r.taxa_iva_id ?? null,
      preco_compra:
        r.tipo === 'Consumivel' || r.tipo === 'Revenda'
          ? r.preco_compra
          : r.tipo === 'Acabado'
          ? 0
          : null,
      preco_venda:
        r.tipo === 'Acabado' || r.tipo === 'Revenda'
          ? r.preco_venda
          : r.tipo === 'Consumivel'
          ? 0
          : null,
      valor_unitario:
        r.tipo === 'Material'
          ? r.valor_unitario
          : r.tipo === 'Consumivel'
          ? r.valor_unitario ?? r.preco_compra
          : null,
      tempo_producao: r.tipo === 'Acabado' ? r.tempo_producao : null,
      stock_minimo: r.stock_minimo ?? 0,
      quantidade_inicial: r.quantidade_inicial ?? 0,
      armazem: r.armazem ? r.armazem.trim() : null,
      armazem_id: r.armazem_id ?? null,
      tipo_material: r.tipo === 'Material' ? (r.tipo_material || 'Reutilizavel') : null,
      descricao: r.descricao ? r.descricao.trim() : (r.nome ? r.nome.trim() : '')
    }))
  };
}

/**
 * Envia as linhas preparadas para o endpoint de validação do backend:
 * Fase 1: POST /api/v1/armazem/catalogo/validar
 */
export async function validarLinhasBackend(
  linhas: ImportRowNormalized[]
): Promise<ValidationRowResult[]> {
  const payload = buildCanonicalImportPayload(linhas);

  let res: any;
  try {
    // Tenta primeiro o endpoint canónico da especificação técnica
    try {
      res = await apiClient.post('/v1/armazem/catalogo/validar', payload);
    } catch (errFirst: any) {
      if (errFirst?.response?.status === 404) {
        // Fallback de rota alternativa caso o backend use prefixo direto
        res = await apiClient.post('/v1/armazem/importacao/validar', payload);
      } else {
        throw errFirst;
      }
    }
  } catch (err: any) {
    // Se o backend retornou 400 com linhas bloqueadas (Seção 5.C)
    const errData = err?.response?.data;
    if (errData && Array.isArray(errData.linhas)) {
      const rawResults: any[] = errData.linhas;
      return linhas.map((linhaLocal, index) => {
        const backendRow =
          rawResults.find(b => b.linha === linhaLocal.linha) || rawResults[index];
        const errosBackend = Array.isArray(backendRow?.erros)
          ? backendRow.erros.map(extractMessage)
          : [];
        const avisosBackend = Array.isArray(backendRow?.avisos)
          ? backendRow.avisos.map(extractMessage)
          : [];

        const todosErros = Array.from(
          new Set([...(linhaLocal._errosLocais || []), ...errosBackend])
        );
        const todosAlertas = Array.from(
          new Set([...(linhaLocal._avisosLocais || []), ...avisosBackend])
        );

        return {
          linha: linhaLocal.linha,
          valido: todosErros.length === 0 && (backendRow ? Boolean(backendRow.valido) : true),
          dados: linhaLocal,
          erros: todosErros,
          alertas: todosAlertas
        };
      });
    }

    // Se o backend não estiver acessível (404/500/offline), responder com a validação local
    if (err?.response?.status === 404 || !err?.response) {
      console.warn('Endpoint de validação backend indisponível, usando validação de integridade local.');
      return linhas.map(r => ({
        linha: r.linha,
        valido: (r._errosLocais?.length || 0) === 0,
        dados: r,
        erros: r._errosLocais || [],
        alertas: r._avisosLocais || []
      }));
    }

    handleApiError(err);
  }

  // O backend retorna { total, validas, bloqueadas, avisos, pode_importar, linhas: [...] }
  const rawResults: any[] = Array.isArray(res)
    ? res
    : res?.linhas || res?.data?.linhas || [];

  return linhas.map((linhaLocal, index) => {
    const backendRow =
      rawResults.find(b => b.linha === linhaLocal.linha) || rawResults[index];

    const errosBackend = Array.isArray(backendRow?.erros)
      ? backendRow.erros.map(extractMessage)
      : [];
    const avisosBackend = Array.isArray(backendRow?.avisos)
      ? backendRow.avisos.map(extractMessage)
      : Array.isArray(backendRow?.alertas)
      ? backendRow.alertas.map(extractMessage)
      : [];

    // Se o backend forneceu dados resolvidos, enriquecemos a linha
    const dadosResolvidos = backendRow?.dados_resolvidos;
    const linhaComResolvidos = dadosResolvidos
      ? {
          ...linhaLocal,
          categoria_id: dadosResolvidos.categoria_id ?? linhaLocal.categoria_id,
          unidade_medida_id: dadosResolvidos.unidade_medida_id ?? linhaLocal.unidade_medida_id,
          taxa_iva_id: dadosResolvidos.taxa_iva_id ?? linhaLocal.taxa_iva_id,
          armazem_id: dadosResolvidos.armazem_id ?? linhaLocal.armazem_id
        }
      : linhaLocal;

    const todosErros = Array.from(
      new Set([...(linhaComResolvidos._errosLocais || []), ...errosBackend])
    );
    const todosAlertas = Array.from(
      new Set([...(linhaComResolvidos._avisosLocais || []), ...avisosBackend])
    );

    const ehValido =
      todosErros.length === 0 && (backendRow ? Boolean(backendRow.valido) : true);

    return {
      linha: linhaLocal.linha,
      valido: ehValido,
      dados: linhaComResolvidos,
      erros: todosErros,
      alertas: todosAlertas
    };
  });
}

/**
 * Confirma a importação definitiva no backend:
 * Fase 2: POST /api/v1/armazem/catalogo/importar
 */
export async function confirmarImportacaoBackend(
  linhas: ImportRowNormalized[]
): Promise<ImportFinalResult> {
  const payload = buildCanonicalImportPayload(linhas);

  let res: any;
  try {
    try {
      res = await apiClient.post('/v1/armazem/catalogo/importar', payload);
    } catch (errFirst: any) {
      if (errFirst?.response?.status === 404) {
        res = await apiClient.post('/v1/armazem/importacao/confirmar', payload);
      } else {
        throw errFirst;
      }
    }

    const produtosCount = linhas.filter(l => l.tipo !== 'Material').length;
    const materiaisCount = linhas.filter(l => l.tipo === 'Material').length;
    const movimentosStock = linhas.filter(l => (l.quantidade_inicial || 0) > 0).length;

    const resumo = res?.resumo || res?.data?.resumo || {};

    return {
      success: true,
      totalProcessado: res?.total_linhas || res?.total || linhas.length,
      produtosImportados: resumo?.produtos_criados ?? res?.produtos_criados ?? produtosCount,
      materiaisImportados: resumo?.materiais_criados ?? res?.materiais_criados ?? materiaisCount,
      movimentosStock: resumo?.movimentos_stock_criados ?? res?.movimentos_criados ?? movimentosStock,
      codigoOperacao:
        res?.importacao_id ||
        res?.operacao_id ||
        res?.codigo ||
        res?.id ||
        `IMP-${Date.now().toString(36).toUpperCase()}`,
      mensagem: res?.message || res?.mensagem || 'Importação de catálogo concluída com sucesso.',
      timestamp: new Date().toLocaleString('pt-PT')
    };
  } catch (err: any) {
    handleApiError(err);
  }
}

import apiClient from '../api/client';
import { InventarioAuditoriaItem, InventarioConferenciaResumo, InventarioEstado, InventarioItemBackend, InventarioSessao, InventarioTipo, ItemSituacao } from '../pages/Inventario/types';

const BASE_URL = '/v1/armazem/inventarios';
const payloadOf = (response: any): any => response?.data ?? response;
const failure = (response: any) => new Error(response?.msg || response?.message || 'Não foi possível concluir a operação de inventário.');

function normalizeSession(response: any): InventarioSessao {
  const value = payloadOf(response);
  const summary = value.resumo ?? {};
  const total = Number(summary.total_itens ?? value.total_itens ?? 0);
  const counted = Number(summary.itens_contados ?? value.itens_contados ?? 0);
  const faltas = Number(summary.itens_com_falta ?? value.total_faltas ?? 0);
  const sobras = Number(summary.itens_com_sobra ?? value.total_sobras ?? 0);
  const valorFaltas = Number(summary.valor_estimado_falta ?? value.valor_faltas ?? 0);
  const valorSobras = Number(summary.valor_estimado_sobra ?? value.valor_sobras ?? 0);
  return {
    id: Number(value.id), numero: value.numero, armazem_id: Number(value.armazem_id), armazem_nome: value.armazem_nome,
    tipo: value.tipo as InventarioTipo, estado: value.estado as InventarioEstado, data_inventario: value.data_inventario,
    observacao: value.observacao, responsavel_nome: value.responsavel_nome, total_itens: total, itens_contados: counted,
    percentagem_concluida: Number(summary.percentagem_concluida ?? value.percentagem_concluida ?? (total ? counted * 100 / total : 0)),
    total_divergencias: Number(summary.total_divergencias ?? (faltas + sobras)), total_faltas: faltas, total_sobras: sobras,
    valor_faltas: valorFaltas, valor_sobras: valorSobras, impacto_financeiro_liquido: Number(summary.saldo_financeiro ?? (valorSobras - valorFaltas)),
    created_at: value.created_at, updated_at: value.updated_at, data_fecho: value.aplicado_em ?? value.finalizado_em,
  };
}

function normalizeItem(response: any, inventarioId: number): InventarioItemBackend {
  const value = payloadOf(response);
  const system = Number(value.quantidade_sistema ?? 0);
  const counted = value.quantidade_contada == null ? null : Number(value.quantidade_contada);
  return {
    id: Number(value.id), inventario_id: Number(value.inventario_id ?? inventarioId), item_id: Number(value.item_id ?? value.produto_id ?? value.material_id),
    tipo_item: value.tipo_item ?? (value.material_id ? 'MATERIAL' : 'PRODUTO'), codigo: value.codigo, nome: value.nome,
    unidade_medida: value.unidade_medida, preco_custo: Number(value.preco_custo ?? value.preco_unitario ?? 0), quantidade_sistema: system,
    quantidade_contada: counted, diferenca: value.diferenca == null ? (counted == null ? null : counted - system) : Number(value.diferenca),
    situacao: value.situacao as ItemSituacao, motivo_ajuste: value.motivo_ajuste, observacao: value.observacao,
    valor_impacto: Number(value.valor_impacto ?? value.valor_diferenca ?? 0), categoria: value.categoria, lote: value.lote,
  };
}

async function download(id: number, format: 'excel' | 'pdf') {
  const token = localStorage.getItem('access_token') || localStorage.getItem('token');
  const response = await fetch(`${apiClient.defaults.baseURL}${BASE_URL}/${id}/exportar/${format}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!response.ok) throw new Error('Falha ao gerar o ficheiro de inventário.');
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url; link.download = `inventario-${id}.${format === 'excel' ? 'xlsx' : 'pdf'}`; link.click(); URL.revokeObjectURL(url);
}

export const inventoryAuditService = {
  async listar(params?: Record<string, unknown>): Promise<{ items: InventarioSessao[]; total: number }> {
    const response: any = await apiClient.get(BASE_URL, { params }); if (response?.success === false) throw failure(response);
    const data = payloadOf(response); const items = data?.items ?? data?.inventarios ?? [];
    return { items: items.map(normalizeSession), total: Number(data?.total ?? items.length) };
  },
  async obter(id: number) { const response: any = await apiClient.get(`${BASE_URL}/${id}`); if (response?.success === false) throw failure(response); return normalizeSession(response); },
  async criar(payload: { armazem_id: number; tipo: InventarioTipo; data_inventario: string; observacao?: string }) { const response: any = await apiClient.post(BASE_URL, payload); if (response?.success === false) throw failure(response); return normalizeSession(response); },
  async iniciar(id: number) { const response: any = await apiClient.post(`${BASE_URL}/${id}/iniciar`); if (response?.success === false) throw failure(response); return normalizeSession(response); },
  async listarItens(id: number, params?: Record<string, unknown>): Promise<{ items: InventarioItemBackend[]; total: number }> {
    const response: any = await apiClient.get(`${BASE_URL}/${id}/itens`, { params }); if (response?.success === false) throw failure(response);
    const data = payloadOf(response); const items = data?.items ?? []; return { items: items.map((item: any) => normalizeItem(item, id)), total: Number(data?.total ?? items.length) };
  },
  async atualizarItem(id: number, itemId: number, payload: { quantidade_contada: number; motivo_ajuste?: string; observacao?: string }) { const response: any = await apiClient.patch(`${BASE_URL}/${id}/itens/${itemId}`, payload); if (response?.success === false) throw failure(response); return normalizeItem(response, id); },
  async salvarContagensLote(id: number, contagens: Array<{ item_id: number; quantidade_contada: number; motivo_ajuste?: string; observacao?: string }>) { const response: any = await apiClient.post(`${BASE_URL}/${id}/contagens`, { contagens }); if (response?.success === false) throw failure(response); return payloadOf(response); },
  async finalizarContagem(id: number, forcar = false) { const response: any = await apiClient.post(`${BASE_URL}/${id}/finalizar-contagem`, { forcar }); if (response?.success === false) throw failure(response); return normalizeSession(response); },
  async obterConferencia(id: number): Promise<InventarioConferenciaResumo> { const response: any = await apiClient.get(`${BASE_URL}/${id}/conferencia`); if (response?.success === false) throw failure(response); return payloadOf(response) as InventarioConferenciaResumo; },
  async aprovar(id: number) { const response: any = await apiClient.post(`${BASE_URL}/${id}/aprovar`); if (response?.success === false) throw failure(response); return normalizeSession(response); },
  async aplicar(id: number) { const response: any = await apiClient.post(`${BASE_URL}/${id}/aplicar`); if (response?.success === false) throw failure(response); return normalizeSession(response); },
  async cancelar(id: number, motivo: string) { const response: any = await apiClient.post(`${BASE_URL}/${id}/cancelar`, { motivo }); if (response?.success === false) throw failure(response); return normalizeSession(response); },
  async obterAuditoria(id: number): Promise<InventarioAuditoriaItem[]> { const response: any = await apiClient.get(`${BASE_URL}/${id}/historico`); if (response?.success === false) throw failure(response); const data = payloadOf(response); return data?.items ?? data ?? []; },
  exportarExcel: (id: number) => download(id, 'excel'), exportarPdf: (id: number) => download(id, 'pdf'),
};

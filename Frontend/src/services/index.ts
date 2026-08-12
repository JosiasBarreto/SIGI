import apiClient, { ApiResponse, PaginatedData } from '../api/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  UserDTO, 
  ProdutoDTO, 
  IngredienteDTO, 
  MaterialDTO, 
  ClienteDTO, 
  PedidoDTO, 
  OrdemProducaoDTO, 
  RequisicaoDTO, 
  CaixaDTO,
  FornecedorDTO,
  EventoDTO,
  DashboardStatsDTO,
  TurnoDTO
} from '../dtos';

export interface BaseServiceParams {
  page?: number;
  per_page?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}

export function createService<T>(endpoint: string, _fakeCollection?: string) {
  return {
    async getAll(params?: BaseServiceParams): Promise<PaginatedData<T>> {
      try {
        const response = await apiClient.get<any, any>(endpoint, { params });
        // Normalize array response into PaginatedData if needed
        if (Array.isArray(response)) {
          const page = Number(params?.page || 1);
          const perPage = Number(params?.per_page || 10);
          const total = response.length;
          const pages = Math.max(1, Math.ceil(total / perPage));
          const startIndex = (page - 1) * perPage;
          const endIndex = startIndex + perPage;
          
          return {
            items: response.slice(startIndex, endIndex),
            total: total,
            pages: pages,
            page: page
          };
        }
        
        // If response is an object but might be missing pagination metadata
        if (response && Array.isArray(response.items)) {
          const page = Number(response.page || params?.page || 1);
          const perPage = Number(response.per_page || params?.per_page || 10);
          
          // Se backend mandou tudo dentro de items ignorando a paginação
          if (response.items.length > perPage && !response.total) {
              const total = response.items.length;
              const pages = Math.max(1, Math.ceil(total / perPage));
              const startIndex = (page - 1) * perPage;
              const endIndex = startIndex + perPage;
              return {
                 items: response.items.slice(startIndex, endIndex),
                 total,
                 pages,
                 page
              };
          }
          
          // Se a API não retornou pages/total, vamos inferir de forma inteligente
          let inferredPages = response.pages;
          if (inferredPages === undefined || inferredPages === null) {
              if (response.items.length < perPage) {
                  inferredPages = page; // Estamos na última página
              } else {
                  inferredPages = -1; // Tem mais itens, total desconhecido
              }
          }
          
          let inferredTotal = response.total;
          if (inferredTotal === undefined || inferredTotal === null) {
              if (response.items.length < perPage) {
                  inferredTotal = (page - 1) * perPage + response.items.length;
              } else {
                  inferredTotal = -1;
              }
          }

          return {
            items: response.items,
            total: inferredTotal,
            pages: inferredPages,
            page: page
          };
        }

        return response;
      } catch (err: any) {
        if (err?.error_code === 'SIGI_404' || err?.error_code === '404') {
          return { items: [], total: 0, pages: 1, page: 1 };
        }
        throw err;
      }
    },

    async getById(id: string): Promise<T> {
      const response = await apiClient.get<any, T>(`${endpoint}/${id}`);
      return response;
    },

    async create(item: Partial<T>): Promise<T> {
      const response = await apiClient.post<any, T>(endpoint, item);
      return response;
    },

    async update(id: string, item: Partial<T>): Promise<T> {
      const response = await apiClient.put<any, T>(`${endpoint}/${id}`, item);
      return response;
    },

    async delete(id: string): Promise<boolean> {
      const response = await apiClient.delete<any, any>(`${endpoint}/${id}`);
      return response.success ?? true;
    }
  };
}

export const userService = {
  ...createService<UserDTO>('/v1/users', 'users'),
  async toggleStatus(id: string | number): Promise<UserDTO> {
    return apiClient.patch<any, UserDTO>(`/v1/users/${id}/toggle-status`);
  }
};

export const receitaService = {
  getAll: async (params?: { page?: number; per_page?: number; search?: string }): Promise<any> => {
    const res = await apiClient.get<any, any>(`/v1/receitas`, { params });
    return res?.data || res;
  },
  create: async (data: any): Promise<any> => {
    return apiClient.post(`/v1/receitas`, data);
  },
  getById: async (id: string | number): Promise<any> => {
    const res = await apiClient.get<any, any>(`/v1/receitas/${id}`);
    return res?.data || res;
  },
  getByProdutoId: async (produtoId: string | number): Promise<any> => {
    const res = await apiClient.get<any, any>(`/v1/receitas`, { params: { produto_acabado_id: produtoId } });
    return res?.data || res;
  },
  update: async (id: string | number, data: any): Promise<any> => {
    return apiClient.put(`/v1/receitas/${id}`, data);
  },
  addIngrediente: async (id: string | number, data: { produto_consumivel_id: number; quantidade: number; observacao?: string }): Promise<any> => {
    return apiClient.post(`/v1/receitas/${id}/itens`, data);
  },
  removeIngrediente: async (id: string | number, itemId: string | number): Promise<any> => {
    return apiClient.delete(`/v1/receitas/${id}/itens/${itemId}`);
  },
  duplicar: async (id: string | number, data: { novo_produto_id: number }): Promise<any> => {
    return apiClient.post(`/v1/receitas/${id}/duplicar`, data);
  }
};

const baseProductService = createService<ProdutoDTO>('/v1/armazem/produtos', 'products');

export const productService = {
  ...baseProductService,
  async create(data: Partial<ProdutoDTO>): Promise<ProdutoDTO> {
    const payload: any = { ...data };
    if (payload.tipo === 'Consumivel') {
      payload.servico = 'ABASTECIMENTO';
    } else if (payload.tipo === 'Revenda') {
      payload.servico = 'BAR';
    } else if (payload.tipo === 'Acabado') {
      if (!payload.servico || (payload.servico !== 'COZINHA' && payload.servico !== 'PASTELARIA')) {
        payload.servico = 'COZINHA';
      }
    }
    return baseProductService.create(payload);
  },
  async update(id: string | number, data: Partial<ProdutoDTO>): Promise<ProdutoDTO> {
    const payload: any = { ...data };
    if (payload.tipo === 'Consumivel') {
      payload.servico = 'ABASTECIMENTO';
    } else if (payload.tipo === 'Revenda') {
      payload.servico = 'BAR';
    } else if (payload.tipo === 'Acabado') {
      if (payload.servico && payload.servico !== 'COZINHA' && payload.servico !== 'PASTELARIA') {
        payload.servico = 'COZINHA';
      }
    }
    return baseProductService.update(String(id), payload);
  },
  migrate: async (): Promise<any> => {
    return apiClient.post('/v1/armazem/migrate');
  },
  async ativar(id: string | number): Promise<any> {
    return apiClient.put<any, any>(`/v1/armazem/produtos/${id}/ativar`);
  },
  async desativar(id: string | number): Promise<any> {
    return apiClient.put<any, any>(`/v1/armazem/produtos/${id}/desativar`);
  },
  entradaStock: async (id: string | number, data: any): Promise<any> => {
    return apiClient.post(`/v1/armazem/produtos/${id}/entrada-stock`, data);
  },
  saidaStock: async (id: string | number, data: any): Promise<any> => {
    return apiClient.post(`/v1/armazem/produtos/${id}/saida-stock`, data);
  },
  getMovimentos: async (id: string | number, params?: any): Promise<any> => {
    const res = await apiClient.get<any, any>(`/v1/armazem/produtos/${id}/movimentos`, { params });
    const response = res?.data || res || [];
    if (Array.isArray(response)) {
          const page = Number(params?.page || 1);
          const perPage = Number(params?.per_page || 10);
          const total = response.length;
          const pages = Math.max(1, Math.ceil(total / perPage));
          const startIndex = (page - 1) * perPage;
          const endIndex = startIndex + perPage;
          
          return {
            items: response.slice(startIndex, endIndex),
            total: total,
            pages: pages,
            page: page
          };
    }
    return response;
  },
  toggleAtivo: async (id: string | number, ativar: boolean): Promise<any> => {
    const action = ativar ? 'ativar' : 'desativar';
    return apiClient.put(`/v1/armazem/produtos/${id}/${action}`);
  },
  getCategorias: async (): Promise<any[]> => {
    const res = await apiClient.get<any, any>('/v1/armazem/categorias');
    if (res?.items) return res.items;
    if (res?.data?.items) return res.data.items;
    if (res?.data?.data) return res.data.data;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  },
  createCategoria: async (data: any): Promise<any> => {
    return apiClient.post<any, any>('/v1/armazem/categorias', data);
  },
  updateCategoria: async (id: string | number, data: any): Promise<any> => {
    return apiClient.put<any, any>(`/v1/armazem/categorias/${id}`, data);
  },
  deleteCategoria: async (id: string | number): Promise<void> => {
    return apiClient.delete(`/v1/armazem/categorias/${id}`);
  },
  getUnidadesMedida: async (): Promise<any[]> => {
    const res = await apiClient.get<any, any>('/v1/armazem/unidades-medida');
    if (res?.items) return res.items;
    if (res?.data?.items) return res.data.items;
    if (res?.data?.data) return res.data.data;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res)) return res;
    return [];
  },
  createUnidadeMedida: async (data: any): Promise<any> => {
    return apiClient.post<any, any>('/v1/armazem/unidades-medida', data);
  },
  updateUnidadeMedida: async (id: string | number, data: any): Promise<any> => {
    return apiClient.put<any, any>(`/v1/armazem/unidades-medida/${id}`, data);
  },
  deleteUnidadeMedida: async (id: string | number): Promise<void> => {
    return apiClient.delete(`/v1/armazem/unidades-medida/${id}`);
  }
};

export const ingredientService = createService<IngredienteDTO>('/v1/armazem/ingredientes', 'inventory');
export const materialService = {
  ...createService<MaterialDTO>('/v1/armazem/materiais', 'materials'),
  async ativar(id: string | number): Promise<any> {
    return apiClient.put<any, any>(`/v1/armazem/materiais/${id}/ativar`);
  },
  async desativar(id: string | number): Promise<any> {
    return apiClient.put<any, any>(`/v1/armazem/materiais/${id}/desativar`);
  },
  async updateEstado(id: string | number, estado: string): Promise<any> {
    return apiClient.put<any, any>(`/v1/armazem/materiais/${id}`, { estado });
  },
  async getMovimentos(id: string | number, params?: any): Promise<any> {
    const res = await apiClient.get<any, any>(`/v1/armazem/movimentacoes`, { 
      params: { 
        ...params, 
        entidade_tipo: 'Material', 
        referencia_id: id 
      } 
    });
    const response = res?.data || res || [];
    if (Array.isArray(response)) {
      const page = Number(params?.page || 1);
      const perPage = Number(params?.per_page || 10);
      const total = response.length;
      const pages = Math.max(1, Math.ceil(total / perPage));
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      
      return {
        items: response.slice(startIndex, endIndex),
        total,
        page,
        pages,
        per_page: perPage
      };
    }
    return response;
  }
};
export const supplierService = createService<FornecedorDTO>('/v1/armazem/fornecedores', 'clients'); 
export const clientService = {
  ...createService<ClienteDTO>('/v1/pedidos/clientes', 'clients'),
  async toggleStatus(id: string | number): Promise<ClienteDTO> {
    return apiClient.put<any, ClienteDTO>(`/v1/pedidos/clientes/${id}/toggle`);
  }
};

const cleanEnumString = (val: any): string => {
  if (!val || typeof val !== 'string') return '';
  let str = val.trim();
  if (str.includes('.')) {
    str = str.split('.').pop() || str;
  }
  return str;
};

const normalizeOrderFromBackend = (order: any): any => {
  if (!order || typeof order !== 'object') return order;

  const rawEstado = cleanEnumString(order.estado || order.status).toUpperCase();
  let estado = 'Pendente';
  if (rawEstado === 'PENDENTE') estado = 'Pendente';
  else if (rawEstado === 'AGENDADO') estado = 'Agendado';
  else if (rawEstado === 'CONFIRMADO') estado = 'Confirmado';
  else if (rawEstado === 'EM_PRODUCAO' || rawEstado === 'EM_PRODUÇÃO' || rawEstado === 'EM_PREPARACAO' || rawEstado === 'EM_PREPARAÇÃO' || rawEstado === 'EM_EXECUCAO') estado = 'Em Producao';
  else if (rawEstado === 'PRONTO') estado = 'Pronto';
  else if (rawEstado === 'EM_ENTREGA') estado = 'Em Entrega';
  else if (rawEstado === 'ENTREGUE') estado = 'Entregue';
  else if (rawEstado === 'CONCLUIDO' || rawEstado === 'CONCLUÍDO') estado = 'Concluido';
  else if (rawEstado === 'CANCELADO') estado = 'Cancelado';
  else if (order.estado || order.status) {
    const raw = cleanEnumString(order.estado || order.status);
    estado = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }

  const rawPag = cleanEnumString(order.estado_pagamento).toUpperCase();
  let estado_pagamento = 'Pendente';
  if (rawPag === 'PAGO') estado_pagamento = 'Pago';
  else if (rawPag === 'PARCIAL') estado_pagamento = 'Parcial';
  else if (rawPag === 'PENDENTE') estado_pagamento = 'Pendente';
  else if (rawPag === 'CANCELADO') estado_pagamento = 'Cancelado';
  else if (order.estado_pagamento) {
    estado_pagamento = cleanEnumString(order.estado_pagamento);
  }

  const rawForma = cleanEnumString(order.forma_pagamento).toUpperCase();
  let forma_pagamento = cleanEnumString(order.forma_pagamento);
  if (rawForma === 'DINHEIRO') forma_pagamento = 'Dinheiro';
  else if (rawForma === 'MULTIBANCO') forma_pagamento = 'Multibanco';
  else if (rawForma === 'TRANSFERENCIA') forma_pagamento = 'Transferência';

  const rawOrigem = cleanEnumString(order.origem).toUpperCase();
  let origem = cleanEnumString(order.origem);
  if (rawOrigem === 'BALCAO') origem = 'Balcão';
  else if (rawOrigem === 'EVENTO') origem = 'Evento';

  const rawTipo = cleanEnumString(order.tipo).toUpperCase();
  let tipo = cleanEnumString(order.tipo);
  if (rawTipo === 'SIMPLES') tipo = 'Simples';
  else if (rawTipo === 'COMPOSTO') tipo = 'Composto';

  return {
    ...order,
    estado,
    status: estado,
    estado_pagamento,
    forma_pagamento: forma_pagamento || order.forma_pagamento,
    origem: origem || order.origem,
    tipo: tipo || order.tipo,
    valor_total: typeof order.valor_total === 'string' ? parseFloat(order.valor_total) : (order.valor_total ?? order.total ?? 0),
    valor_pago: typeof order.valor_pago === 'string' ? parseFloat(order.valor_pago) : (order.valor_pago ?? 0),
    saldo: typeof order.saldo === 'string' ? parseFloat(order.saldo) : (order.saldo ?? 0)
  };
};

const normalizePedidoEstado = (estado: string): string => {
  if (!estado) return "Agendado";
  const e = estado.trim();
  const upper = e.toUpperCase().replace(/\s+/g, '_');
  
  if (upper === 'EM_PRODUCAO' || upper === 'EM_PRODUÇÃO' || upper === 'EM_PREPARACAO' || upper === 'EM_PREPARAÇÃO') {
    return 'Em Producao';
  }
  if (upper === 'CONCLUIDO' || upper === 'CONCLUÍDO' || upper === 'CONCLUIDA' || upper === 'COMPLETADO') {
    return 'Concluido';
  }
  if (upper === 'PENDENTE' || upper === 'AGENDADO' || upper === 'RASCUNHO') {
    return 'Agendado';
  }
  if (upper === 'CONFIRMADO') return 'Confirmado';
  if (upper === 'PRONTO') return 'Pronto';
  if (upper === 'ENTREGUE') return 'Entregue';
  if (upper === 'CANCELADO') return 'Cancelado';

  const validMap: Record<string, string> = {
    "agendado": "Agendado",
    "pendente": "Agendado",
    "confirmado": "Confirmado",
    "em producao": "Em Producao",
    "em produção": "Em Producao",
    "em_producao": "Em Producao",
    "pronto": "Pronto",
    "entregue": "Entregue",
    "concluido": "Concluido",
    "concluído": "Concluido",
    "cancelado": "Cancelado"
  };
  return validMap[e.toLowerCase()] || e;
};

const baseOrderService = createService<PedidoDTO>('/v1/pedidos', 'orders');

export const orderService = {
  ...baseOrderService,
  async getAll(params?: BaseServiceParams): Promise<PaginatedData<PedidoDTO>> {
    const res = await baseOrderService.getAll(params);
    if (res && Array.isArray(res.items)) {
      return {
        ...res,
        items: res.items.map(normalizeOrderFromBackend)
      };
    }
    return res;
  },
  async getById(id: string | number): Promise<PedidoDTO> {
    const res = await baseOrderService.getById(String(id));
    return normalizeOrderFromBackend(res);
  },
  async create(data: Partial<PedidoDTO>): Promise<PedidoDTO> {
    const payload: any = { ...data };
    if (payload.estado) {
      payload.estado = normalizePedidoEstado(payload.estado);
    } else {
      payload.estado = "Agendado";
    }
    if (Array.isArray(payload.itens)) {
      payload.itens = payload.itens.map((it: any) => {
        let normalizedTipo = it.tipo_item || 'Produto';
        if (['ProdutoCozinha', 'ProdutoPastelaria', 'ProdutoRevenda', 'PRODUTO'].includes(it.tipo_item) || (typeof it.tipo_item === 'string' && it.tipo_item.startsWith('Produto'))) {
          normalizedTipo = 'Produto';
        }
        return {
          ...it,
          tipo_item: normalizedTipo
        };
      });
    }
    return baseOrderService.create(payload);
  },
  async update(id: string | number, data: Partial<PedidoDTO>): Promise<PedidoDTO> {
    const payload: any = { ...data };
    if (payload.estado) {
      payload.estado = normalizePedidoEstado(payload.estado);
    }
    if (Array.isArray(payload.itens)) {
      payload.itens = payload.itens.map((it: any) => {
        let normalizedTipo = it.tipo_item || 'Produto';
        if (['ProdutoCozinha', 'ProdutoPastelaria', 'ProdutoRevenda', 'PRODUTO'].includes(it.tipo_item) || (typeof it.tipo_item === 'string' && it.tipo_item.startsWith('Produto'))) {
          normalizedTipo = 'Produto';
        }
        return {
          ...it,
          tipo_item: normalizedTipo
        };
      });
    }
    return baseOrderService.update(String(id), payload);
  },
  async updateEstado(id: string | number, estado: string, justificativa_cancelamento?: string): Promise<PedidoDTO> {
    const estadoNormalized = normalizePedidoEstado(estado);
    const body: any = { estado: estadoNormalized };
    if (estadoNormalized === 'Cancelado' && justificativa_cancelamento) {
      body.justificativa_cancelamento = justificativa_cancelamento;
    }
    return apiClient.put<any, PedidoDTO>(`/v1/pedidos/${id}/estado`, body);
  },
  async checkoutPedido(id: string | number, payload: { forma_pagamento_id?: number | string; valor?: number; codigo_transferencia?: string | null; emissor?: string | null; observacoes?: string; serie_id?: number }): Promise<any> {
    return await apiClient.post<any, any>(`/v1/comercial/checkout-pedido/${id}`, payload);
  },
  async adicionarPagamento(id: string | number, payload: { forma_pagamento_id?: number | string; valor: number; codigo_transferencia?: string | null; emissor?: string | null; referencia?: string; observacoes?: string }): Promise<any> {
    return apiClient.post<any, any>(`/v1/pedidos/${id}/pagamentos`, payload);
  }
};

const getCompanyConfig = () => {
  try {
    const sigi = JSON.parse(localStorage.getItem('sigi_config') || '{}');
    return {
      empresa: sigi.empresa || sigi.nome_empresa || sigi.nome || 'Sabor Imbatível, S.A.',
      nif: sigi.nif || '500123456',
      telefone: sigi.telefone || sigi.telemovel || '923000000',
      email: sigi.email || 'comercial@saborimbativel.co.ao',
      endereco: sigi.endereco || sigi.morada || 'Luanda, Angola',
      licenca: sigi.licenca || sigi.certificado || '001/SIGI/2026',
      moeda: sigi.moeda || sigi.moeda_simbolo || 'Kz'
    };
  } catch {
    return {
      empresa: 'Sabor Imbatível, S.A.',
      nif: '500123456',
      telefone: '923000000',
      email: 'comercial@saborimbativel.co.ao',
      endereco: 'Luanda, Angola',
      licenca: '001/SIGI/2026',
      moeda: 'Kz'
    };
  }
};

async function fetchBlobWithFallbacks(paths: string[]): Promise<Blob> {
  let lastErr: any = null;
  for (const path of paths) {
    try {
      const res = await apiClient.get<any, Blob>(path, { responseType: 'blob' });
      const blob = res as unknown as Blob;
      if (blob && blob.size > 0) {
        if (blob.type && blob.type.includes('json')) {
          const text = await blob.text();
          try {
            const parsed = JSON.parse(text);
            lastErr = new Error(parsed.detail || parsed.message || 'Erro no documento');
            continue;
          } catch {
            // Not json
          }
        }
        return blob;
      }
    } catch (err: any) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Documento não disponível no servidor.');
}

async function fetchJsonWithFallbacks(paths: string[]): Promise<any> {
  let lastErr: any = null;
  for (const path of paths) {
    try {
      const res = await apiClient.get<any, any>(path);
      if (res) return res.data || res;
    } catch (err: any) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Dados do documento não encontrados.');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

function printBlob(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        window.open(url, '_blank');
      }
      setTimeout(() => {
        iframe.remove();
        URL.revokeObjectURL(url);
      }, 60000);
    }, 300);
  };
}

function printHtmlThermalReceipt(raw: any) {
  const company = getCompanyConfig();
  const d = raw?.data || raw?.recibo || raw || {};
  const items = d.itens || d.items || [];
  
  const docTipo = d.tipo_documento || d.documento_tipo || 'FR';
  const docNumero = d.numero || d.numero_documento || d.codigo || d.id;
  const docSerie = d.serie || '2026';
  const fullDocNum = docNumero ? `${docTipo} ${docSerie}/${docNumero}` : `${docTipo} ${d.id || 'N/A'}`;
  
  const clienteNome = d.cliente_nome || d.cliente?.nome || d.client_name || 'Consumidor Final';
  const clienteNif = d.cliente_nif || d.cliente?.nif || 'Consumidor Final';
  const operador = d.operador || d.usuario || d.atendente || 'Operador POS';
  
  const dataHora = d.data_venda ? new Date(d.data_venda).toLocaleString('pt-PT') : new Date().toLocaleString('pt-PT');
  const dataAgendada = (d.data_agendada || d.data_entrega || d.data_recebimento) 
    ? new Date(d.data_agendada || d.data_entrega || d.data_recebimento).toLocaleString('pt-PT') 
    : null;

  const subtotal = Number(d.subtotal || d.valor_subtotal || 0);
  const desconto = Number(d.desconto || d.valor_desconto || 0);
  const totalIva = Number(d.total_iva || d.iva_valor || d.iva || 0);
  const total = Number(d.total || d.valor_total || (subtotal - desconto + totalIva));
  const valorPago = Number(d.valor_pago || d.pago || total);
  const troco = Number(d.troco || (valorPago > total ? valorPago - total : 0));
  const saldo = Number(d.saldo || (total > valorPago ? total - valorPago : 0));
  const formaPagamento = d.forma_pagamento || d.pagamento_forma || 'Dinheiro';

  const moeda = company.moeda || 'Kz';

  const itemsHtml = items.map((it: any) => {
    const qtd = it.quantidade || it.qty || 1;
    const un = it.unidade || 'un';
    const nome = it.produto_nome || it.nome || it.descricao || 'Item';
    const preco = Number(it.preco_unitario || it.preco || 0);
    const itemTotal = Number(it.total || it.subtotal || (qtd * preco));
    return `
      <tr>
        <td colspan="2" style="font-weight: bold; padding-top: 4px;">${nome}</td>
      </tr>
      <tr>
        <td style="color: #444;">${qtd} ${un} x ${preco.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}</td>
        <td style="text-align: right; font-weight: bold;">${itemTotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}</td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Recibo ${fullDocNum}</title>
        <meta charset="utf-8">
        <style>
          @page { size: 80mm auto; margin: 2mm; }
          body { width: 74mm; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; margin: 0 auto; padding: 4px; line-height: 1.2; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .right { text-align: right; }
          .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { vertical-align: top; font-size: 11px; }
          .highlight { background: #f0f0f0; padding: 4px; margin: 4px 0; border: 1px solid #000; }
        </style>
      </head>
      <body>
        <div class="center title">${company.empresa}</div>
        <div class="center">NIF: ${company.nif}</div>
        <div class="center">Tel: ${company.telefone}</div>
        <div class="center">${company.endereco}</div>
        <div class="center" style="font-size: 9px; margin-top: 2px;">Certificado: ${company.licenca}</div>
        
        <div class="divider"></div>
        
        <div class="bold center" style="font-size: 12px;">${fullDocNum}</div>
        <div>Data/Hora: ${dataHora}</div>
        <div>Operador: ${operador}</div>
        <div>Cliente: ${clienteNome} (NIF: ${clienteNif})</div>
        ${dataAgendada ? `<div class="highlight center bold">📅 ENTREGA/RECEBIMENTO:<br/>${dataAgendada}</div>` : ''}

        <div class="divider"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left;">Descrição</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || '<tr><td colspan="2">Sem itens</td></tr>'}
          </tbody>
        </table>

        <div class="divider"></div>

        <table>
          <tr><td>Subtotal:</td><td class="right">${subtotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}</td></tr>
          ${desconto > 0 ? `<tr><td>Desconto:</td><td class="right">-${desconto.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}</td></tr>` : ''}
          <tr><td>Total IVA:</td><td class="right">${totalIva.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}</td></tr>
          <tr class="bold" style="font-size: 13px;"><td>TOTAL GERAL:</td><td class="right">${total.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}</td></tr>
        </table>

        <div class="divider"></div>

        <table>
          <tr><td>Forma Pagamento:</td><td class="right">${formaPagamento}</td></tr>
          <tr><td>Valor Pago:</td><td class="right">${valorPago.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}</td></tr>
          ${troco > 0 ? `<tr class="bold"><td>Troco:</td><td class="right">${troco.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}</td></tr>` : ''}
          ${saldo > 0 ? `<tr class="bold" style="color: red;"><td>Saldo Restante:</td><td class="right">${saldo.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}</td></tr>` : ''}
        </table>

        <div class="divider"></div>
        <div class="center bold">Obrigado pela preferência!</div>
        <div class="center" style="font-size: 9px; margin-top: 4px;">Processado por Software Validado nº ${company.licenca}</div>
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(html);
          win.document.close();
          win.print();
        }
      }
      setTimeout(() => iframe.remove(), 30000);
    }, 300);
  }
}

function downloadJsPdfReceipt(raw: any, filename: string) {
  const company = getCompanyConfig();
  const d = raw?.data || raw?.recibo || raw || {};
  const items = d.itens || d.items || [];
  
  const docTipo = d.tipo_documento || d.documento_tipo || 'FR';
  const docNumero = d.numero || d.numero_documento || d.codigo || d.id;
  const docSerie = d.serie || '2026';
  const fullDocNum = docNumero ? `${docTipo} ${docSerie}/${docNumero}` : `${docTipo} ${d.id || 'N/A'}`;
  
  const clienteNome = d.cliente_nome || d.cliente?.nome || d.client_name || 'Consumidor Final';
  const clienteNif = d.cliente_nif || d.cliente?.nif || 'Consumidor Final';
  const operador = d.operador || d.usuario || d.atendente || 'Operador POS';
  
  const dataHora = d.data_venda ? new Date(d.data_venda).toLocaleString('pt-PT') : new Date().toLocaleString('pt-PT');

  const subtotal = Number(d.subtotal || d.valor_subtotal || 0);
  const desconto = Number(d.desconto || d.valor_desconto || 0);
  const totalIva = Number(d.total_iva || d.iva_valor || d.iva || 0);
  const total = Number(d.total || d.valor_total || (subtotal - desconto + totalIva));
  const valorPago = Number(d.valor_pago || d.pago || total);
  const troco = Number(d.troco || (valorPago > total ? valorPago - total : 0));
  const saldo = Number(d.saldo || (total > valorPago ? total - valorPago : 0));
  const formaPagamento = d.forma_pagamento || d.pagamento_forma || 'Dinheiro';
  const moeda = company.moeda || 'Kz';

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(company.empresa, 14, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIF: ${company.nif} | Tel: ${company.telefone} | Email: ${company.email}`, 14, 26);
  doc.text(`Endereço: ${company.endereco}`, 14, 31);
  doc.text(`Certificado/Licença: ${company.licenca}`, 14, 36);

  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`DOCUMENTO: ${fullDocNum}`, 14, 48);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data/Hora: ${dataHora}`, 14, 55);
  doc.text(`Operador: ${operador}`, 14, 60);
  doc.text(`Cliente: ${clienteNome} (NIF: ${clienteNif})`, 14, 65);

  const tableData = items.map((it: any) => [
    it.produto_nome || it.nome || it.descricao || 'Item',
    `${it.quantidade || it.qty || 1} ${it.unidade || 'un'}`,
    `${Number(it.preco_unitario || it.preco || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}`,
    `${Number(it.total || it.subtotal || 0).toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}`
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['Descrição do Item', 'Qtd', 'Preço Unit.', 'Total']],
    body: tableData.length > 0 ? tableData : [['Nenhum item listado', '-', '-', `0.00 ${moeda}`]],
    theme: 'striped',
    headStyles: { fillColor: [30, 41, 59] },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 120;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Subtotal: ${subtotal.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}`, 130, finalY + 10);
  if (desconto > 0) {
    doc.text(`Desconto: -${desconto.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}`, 130, finalY + 16);
  }
  doc.text(`Total IVA: ${totalIva.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}`, 130, finalY + 22);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`TOTAL GERAL: ${total.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}`, 130, finalY + 30);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Forma de Pagamento: ${formaPagamento}`, 14, finalY + 10);
  doc.text(`Valor Pago: ${valorPago.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}`, 14, finalY + 16);
  if (troco > 0) doc.text(`Troco: ${troco.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}`, 14, finalY + 22);
  if (saldo > 0) doc.text(`Saldo Restante: ${saldo.toLocaleString('pt-AO', { minimumFractionDigits: 2 })} ${moeda}`, 14, finalY + 28);

  doc.save(filename);
}

export const documentService = {
  async vendaPdf(id: string | number) {
    const filename = `fatura_a4_${id}.pdf`;
    try {
      const blob = await fetchBlobWithFallbacks([
        `/v1/vendas/${id}/pdf`,
        `/v1/comercial/vendas/${id}/pdf`,
        `/v1/comercial/${id}/pdf`,
        `/v1/vendas/${id}/recibo`,
        `/v1/comercial/${id}/recibo`
      ]);
      downloadBlob(blob, filename);
    } catch {
      const data = await this.vendaReciboData(id);
      downloadJsPdfReceipt(data, filename);
    }
  },

  async vendaRecibo(id: string | number) {
    const filename = `recibo_termico_${id}.pdf`;
    try {
      const blob = await fetchBlobWithFallbacks([
        `/v1/vendas/${id}/recibo`,
        `/v1/comercial/vendas/${id}/recibo`,
        `/v1/comercial/${id}/recibo`,
        `/v1/vendas/${id}/pdf`,
        `/v1/comercial/${id}/pdf`
      ]);
      downloadBlob(blob, filename);
    } catch {
      const data = await this.vendaReciboData(id);
      downloadJsPdfReceipt(data, filename);
    }
  },

  async imprimirReciboVenda(id: string | number) {
    try {
      const blob = await fetchBlobWithFallbacks([
        `/v1/vendas/${id}/recibo`,
        `/v1/comercial/vendas/${id}/recibo`,
        `/v1/comercial/${id}/recibo`
      ]);
      printBlob(blob);
    } catch {
      const data = await this.vendaReciboData(id);
      printHtmlThermalReceipt(data);
    }
  },

  async vendaReciboData(id: string | number): Promise<any> {
    try {
      return await fetchJsonWithFallbacks([
        `/v1/vendas/${id}/recibo-data`,
        `/v1/vendas/${id}`,
        `/v1/comercial/vendas/${id}`,
        `/v1/comercial/${id}/recibo-data`,
        `/v1/comercial/vendas/${id}/recibo-data`
      ]);
    } catch {
      try {
        return await vendaService.getById(id);
      } catch {
        return {
          id: id,
          numero: `FR 2026/${id}`,
          tipo_documento: 'FR',
          cliente_nome: 'Consumidor Final',
          itens: [],
          total: 0
        };
      }
    }
  },

  async pedidoPdf(id: string | number) {
    const filename = `pedido_${id}.pdf`;
    try {
      const blob = await fetchBlobWithFallbacks([
        `/v1/pedidos/${id}/pdf`,
        `/v1/comercial/pedidos/${id}/pdf`,
        `/v1/pedidos/${id}/recibo`
      ]);
      downloadBlob(blob, filename);
    } catch {
      const data = await this.pedidoReciboData(id);
      downloadJsPdfReceipt(data, filename);
    }
  },

  async pedidoRecibo(id: string | number) {
    const filename = `recibo_pedido_${id}.pdf`;
    try {
      const blob = await fetchBlobWithFallbacks([
        `/v1/pedidos/${id}/recibo`,
        `/v1/comercial/pedidos/${id}/recibo`,
        `/v1/pedidos/${id}/pdf`
      ]);
      downloadBlob(blob, filename);
    } catch {
      const data = await this.pedidoReciboData(id);
      downloadJsPdfReceipt(data, filename);
    }
  },

  async imprimirReciboPedido(id: string | number) {
    try {
      const blob = await fetchBlobWithFallbacks([
        `/v1/pedidos/${id}/recibo`,
        `/v1/comercial/pedidos/${id}/recibo`
      ]);
      printBlob(blob);
    } catch {
      const data = await this.pedidoReciboData(id);
      printHtmlThermalReceipt(data);
    }
  },

  async pedidoReciboData(id: string | number): Promise<any> {
    try {
      return await fetchJsonWithFallbacks([
        `/v1/pedidos/${id}/recibo-data`,
        `/v1/comercial/pedidos/${id}/recibo-data`,
        `/v1/pedidos/${id}`,
        `/v1/comercial/pedidos/${id}`
      ]);
    } catch {
      try {
        return await orderService.getById(String(id));
      } catch {
        return {
          id: id,
          numero: `PP 2026/${id}`,
          tipo_documento: 'PP',
          cliente_nome: 'Consumidor Final',
          itens: [],
          total: 0
        };
      }
    }
  },

  async eventoDocumento(id: string | number, tipo: 'proforma' | 'pdf' | 'word' = 'proforma') {
    const filename = `evento_${id}_${tipo}.${tipo === 'word' ? 'docx' : 'pdf'}`;
    try {
      const blob = await fetchBlobWithFallbacks([
        `/v1/eventos/${id}/documento/${tipo}`,
        `/v1/eventos/${id}/${tipo}`
      ]);
      downloadBlob(blob, filename);
    } catch {
      const data = await fetchJsonWithFallbacks([`/v1/eventos/${id}`]);
      downloadJsPdfReceipt(data, filename);
    }
  }
};

const baseEventService = createService<EventoDTO>('/v1/eventos', 'events');

const normalizeEspacoPayload = (data: any) => {
  if (!data || typeof data !== 'object') return data;
  const payload = { ...data };

  let raw = payload.estado || payload.estado_espaco || payload.status;
  let estadoVal = 'Ativo';

  if (typeof raw === 'string') {
    const trimmed = raw.trim().toUpperCase();
    if (trimmed === 'INATIVO' || trimmed === 'INACTIVE' || trimmed === 'FALSE' || trimmed === '0') {
      estadoVal = 'Inativo';
    } else {
      estadoVal = 'Ativo';
    }
  } else if (typeof raw === 'boolean') {
    estadoVal = raw ? 'Ativo' : 'Inativo';
  }

  payload.estado = estadoVal;
  payload.estado_espaco = estadoVal;
  payload.is_active = estadoVal === 'Ativo';

  return payload;
};

export const eventService = {
  ...baseEventService,
  async create(data: Partial<EventoDTO>): Promise<EventoDTO> {
    const payload: any = { ...data };
    delete payload.espaco_id;
    if (Array.isArray(payload.itens)) {
      payload.itens = payload.itens.map((it: any) => {
        let normalizedTipo = it.tipo_item || 'Servico';
        if (['ProdutoCozinha', 'ProdutoPastelaria', 'ProdutoRevenda', 'PRODUTO'].includes(it.tipo_item) || (typeof it.tipo_item === 'string' && it.tipo_item.startsWith('Produto'))) {
          normalizedTipo = 'Produto';
        }
        return {
          ...it,
          tipo_item: normalizedTipo
        };
      });
    }
    return baseEventService.create(payload);
  },
  async update(id: string | number, data: Partial<EventoDTO>): Promise<EventoDTO> {
    const payload: any = { ...data };
    delete payload.espaco_id;
    if (Array.isArray(payload.itens)) {
      payload.itens = payload.itens.map((it: any) => {
        let normalizedTipo = it.tipo_item || 'Servico';
        if (['ProdutoCozinha', 'ProdutoPastelaria', 'ProdutoRevenda', 'PRODUTO'].includes(it.tipo_item) || (typeof it.tipo_item === 'string' && it.tipo_item.startsWith('Produto'))) {
          normalizedTipo = 'Produto';
        }
        return {
          ...it,
          tipo_item: normalizedTipo
        };
      });
    }
    return baseEventService.update(String(id), payload);
  },
  faturar: async (id: string | number, pagamento?: { valor: number; forma_pagamento_id: number; codigo_transferencia?: string | null; emissor?: string | null; observacoes?: string }): Promise<any> => {
    return apiClient.post<any, any>(`/v1/eventos/${id}/faturar`, { pagamento: pagamento || {} });
  },
  gerarPlaneamento: async (id: string | number): Promise<any> => {
    return apiClient.post<any, any>(`/v1/eventos/${id}/gerar-planeamento`, {});
  },
  async updateEstado(id: string | number, estado: string): Promise<EventoDTO> {
    return apiClient.put<any, EventoDTO>(`/v1/eventos/${id}/estado`, { estado });
  },
  sugerirPreco: async (data: { tipo_evento?: string; numero_convidados?: number; tipo_item?: string; referencia_id?: number; nome_item?: string }): Promise<any> => {
    return apiClient.post<any, any>('/v1/eventos/sugerir-preco', data);
  },
  // Cadastros Auxiliares
  tiposEvento: {
    async listar(params?: any): Promise<any> {
      return apiClient.get<any, any>('/v1/eventos/cadastros/tipos-evento', { params });
    },
    async criar(data: any): Promise<any> {
      return apiClient.post<any, any>('/v1/eventos/cadastros/tipos-evento', data);
    },
    async atualizar(id: string | number, data: any): Promise<any> {
      return apiClient.put<any, any>(`/v1/eventos/cadastros/tipos-evento/${id}`, data);
    },
    async desativar(id: string | number): Promise<any> {
      return apiClient.patch<any, any>(`/v1/eventos/cadastros/tipos-evento/${id}/desativar`);
    }
  },
  servicosCadastro: {
    async listar(params?: any): Promise<any> {
      return apiClient.get<any, any>('/v1/eventos/cadastros/servicos', { params });
    },
    async criar(data: any): Promise<any> {
      return apiClient.post<any, any>('/v1/eventos/cadastros/servicos', data);
    },
    async atualizar(id: string | number, data: any): Promise<any> {
      return apiClient.put<any, any>(`/v1/eventos/cadastros/servicos/${id}`, data);
    },
    async desativar(id: string | number): Promise<any> {
      return apiClient.patch<any, any>(`/v1/eventos/cadastros/servicos/${id}/desativar`);
    }
  },
  equipasCadastro: {
    async listar(params?: any): Promise<any> {
      return apiClient.get<any, any>('/v1/eventos/cadastros/equipas', { params });
    },
    async criar(data: any): Promise<any> {
      return apiClient.post<any, any>('/v1/eventos/cadastros/equipas', data);
    },
    async atualizar(id: string | number, data: any): Promise<any> {
      return apiClient.put<any, any>(`/v1/eventos/cadastros/equipas/${id}`, data);
    },
    async desativar(id: string | number): Promise<any> {
      return apiClient.patch<any, any>(`/v1/eventos/cadastros/equipas/${id}/desativar`);
    }
  },
  espacos: {
    async listar(params?: any): Promise<any> {
      try {
        return await apiClient.get<any, any>('/v1/eventos/cadastros/espacos', { params });
      } catch {
        try {
          return await apiClient.get<any, any>('/v1/eventos/espacos', { params });
        } catch {
          return await apiClient.get<any, any>('/v1/espacos', { params });
        }
      }
    },
    async criar(data: any): Promise<any> {
      const payload = normalizeEspacoPayload(data);
      try {
        return await apiClient.post<any, any>('/v1/eventos/cadastros/espacos', payload);
      } catch {
        return await apiClient.post<any, any>('/v1/eventos/espacos', payload);
      }
    },
    async atualizar(id: string | number, data: any): Promise<any> {
      const payload = normalizeEspacoPayload(data);
      try {
        return await apiClient.put<any, any>(`/v1/eventos/cadastros/espacos/${id}`, payload);
      } catch {
        return await apiClient.put<any, any>(`/v1/eventos/espacos/${id}`, payload);
      }
    },
    async desativar(id: string | number): Promise<any> {
      try {
        return await apiClient.patch<any, any>(`/v1/eventos/cadastros/espacos/${id}/desativar`);
      } catch {
        try {
          return await apiClient.patch<any, any>(`/v1/eventos/espacos/${id}/desativar`);
        } catch {
          return await apiClient.put<any, any>(`/v1/eventos/cadastros/espacos/${id}`, { estado: 'Inativo', estado_espaco: 'Inativo' });
        }
      }
    }
  },
  politicasComerciais: {
    async listar(params?: any): Promise<any> {
      return apiClient.get<any, any>('/v1/eventos/politicas-comerciais', { params });
    },
    async obter(id: string | number): Promise<any> {
      return apiClient.get<any, any>(`/v1/eventos/politicas-comerciais/${id}`);
    },
    async criar(data: any): Promise<any> {
      return apiClient.post<any, any>('/v1/eventos/politicas-comerciais', data);
    },
    async atualizar(id: string | number, data: any): Promise<any> {
      return apiClient.put<any, any>(`/v1/eventos/politicas-comerciais/${id}`, data);
    },
    async desativar(id: string | number): Promise<any> {
      return apiClient.patch<any, any>(`/v1/eventos/politicas-comerciais/${id}/desativar`);
    },
    async criarRegra(politicaId: string | number, data: any): Promise<any> {
      return apiClient.post<any, any>(`/v1/eventos/politicas-comerciais/${politicaId}/regras`, data);
    },
    async eliminarRegra(politicaId: string | number, regraId: string | number): Promise<any> {
      return apiClient.delete<any, any>(`/v1/eventos/politicas-comerciais/${politicaId}/regras/${regraId}`);
    }
  }
};

export const warehouseService = {
  ...createService<any>('/v1/armazem/armazens', 'inventory'),
  async getStock(id: string | number, params?: any) {
    const res = await apiClient.get<any, any>(`/v1/armazem/armazens/${id}/stock`, { params });
    return res;
  },
  async transfer(data: any) {
    const res = await apiClient.post<any, any>('/v1/armazem/transferir', data);
    return res;
  },
  async ativar(id: string | number) {
    const res = await apiClient.put<any, any>(`/v1/armazem/armazens/${id}/ativar`);
    return res;
  },
  async desativar(id: string | number) {
    const res = await apiClient.put<any, any>(`/v1/armazem/armazens/${id}/desativar`);
    return res;
  },
  async createMovimentacao(data: any) {
    const res = await apiClient.post<any, any>('/v1/armazem/movimentacoes', data);
    return res;
  },
  async entradaStockLote(data: any) {
    const res = await apiClient.post<any, any>('/v1/armazem/produtos/entrada-stock-lote', data);
    return res;
  },
  async movimentacaoLote(data: any) {
    // 1. Try batch endpoint /v1/armazem/movimentacoes/lote
    try {
      const res = await apiClient.post<any, any>('/v1/armazem/movimentacoes/lote', data, { timeout: 30000 });
      if (res) return res;
    } catch (err: any) {
      console.warn('Endpoint /v1/armazem/movimentacoes/lote indisponível:', err?.message || err);
    }

    // 2. Try secondary batch endpoint /v1/armazem/produtos/entrada-stock-lote
    try {
      const res = await apiClient.post<any, any>('/v1/armazem/produtos/entrada-stock-lote', data, { timeout: 30000 });
      if (res) return res;
    } catch (err: any) {
      console.warn('Endpoint /v1/armazem/produtos/entrada-stock-lote indisponível:', err?.message || err);
    }

    // 3. Fallback: Process item by item via single movement endpoint /v1/armazem/movimentacoes
    const itens = data?.itens || [];
    if (!Array.isArray(itens) || itens.length === 0) {
      throw new Error('Nenhum item fornecido para a movimentação em lote.');
    }

    let successCount = 0;
    const errors: string[] = [];

    for (const item of itens) {
      const itemPayload = {
        tipo: item.tipo || 'Entrada',
        armazem_id: Number(item.armazem_id),
        quantidade: Number(item.quantidade),
        preco_compra: item.preco_compra ? Number(item.preco_compra) : undefined,
        observacao: item.observacao || data.observacao,
        origem: data.numero_fatura ? `Fatura ${data.numero_fatura}` : 'Movimentação em Lote',
        fornecedor_id: data.fornecedor_id ? Number(data.fornecedor_id) : undefined,
        produto_id: item.tipo_item === 'Produto' ? Number(item.produto_id) : undefined,
        material_id: item.tipo_item === 'Material' ? Number(item.material_id) : undefined,
        entidade_tipo: item.tipo_item,
        referencia_id: item.produto_id || item.material_id || item.ingrediente_id
      };

      try {
        await apiClient.post<any, any>('/v1/armazem/movimentacoes', itemPayload);
        successCount++;
      } catch (itemErr: any) {
        // Attempt direct item stock update if single movement endpoint fails
        try {
          const targetStock = item.tipo === 'Entrada' 
            ? ((item.stock_atual || 0) + item.quantidade) 
            : Math.max(0, (item.stock_atual || 0) - item.quantidade);

          if (item.tipo_item === 'Produto' && item.produto_id) {
            await apiClient.put(`/v1/armazem/produtos/${item.produto_id}`, {
              stock_atual: targetStock,
              quantidade: targetStock
            });
            successCount++;
          } else if (item.tipo_item === 'Material' && item.material_id) {
            await apiClient.put(`/v1/armazem/materiais/${item.material_id}`, {
              stock_atual: targetStock,
              quantidade: targetStock
            });
            successCount++;
          } else {
            throw itemErr;
          }
        } catch (subErr: any) {
          console.error(`Falha ao processar item #${item.produto_id || item.material_id}:`, subErr);
          errors.push(item.nome || `Item #${item.produto_id || item.material_id}`);
        }
      }
    }

    if (successCount > 0) {
      return {
        success: true,
        msg: `Movimentação em lote registada com sucesso (${successCount} de ${itens.length} itens processados).`,
        dados: {
          numero_fatura: data.numero_fatura,
          fornecedor_id: data.fornecedor_id,
          total_processados: successCount,
          erros: errors
        }
      };
    }

    throw new Error(
      errors.length > 0 
        ? `Erro ao registar movimentação dos itens: ${errors.join(', ')}.`
        : 'Não foi possível ligar ao serviço de armazém. Verifique a ligação com o servidor.'
    );
  }
};

export const productionService = {
  ...createService<OrdemProducaoDTO>('/v1/producao/ordens', 'orders'),
  async updateEstado(id: string | number, estado: string): Promise<OrdemProducaoDTO> {
    const upper = String(estado || '').trim().toUpperCase().replace(/\s+/g, '_');
    const estadoNormalized =
      upper === 'EM_PRODUCAO' || upper === 'EM_PRODUÇÃO' || upper === 'EM_PREPARACAO' || upper === 'EM_PREPARAÇÃO'
        ? 'Em Producao'
        : upper === 'PENDENTE'
          ? 'Pendente'
          : upper === 'PRONTO'
            ? 'Pronto'
            : upper === 'ENTREGUE' || upper === 'CONCLUIDO' || upper === 'CONCLUÍDO'
              ? 'Entregue'
              : estado;
    return apiClient.put<any, OrdemProducaoDTO>(`/v1/producao/ordens/${id}/estado`, { estado: estadoNormalized });
  }
};

export const requestService = {
  ...createService<RequisicaoDTO>('/v1/requisicoes', 'requisitions'),
  async aprovar(id: string | number, itens: Array<{id: number, quantidade_aprovada: number}>): Promise<RequisicaoDTO> {
    return apiClient.put<any, RequisicaoDTO>(`/v1/requisicoes/${id}/aprovar`, { itens });
  },
  async entregar(id: string | number, observacao?: string): Promise<RequisicaoDTO> {
    return apiClient.put<any, RequisicaoDTO>(`/v1/requisicoes/${id}/entregar`, { observacao });
  },
  async devolver(id: string | number, devolvcoes: Array<{material_id: number, quantidade_devolvida: number, quantidade_danificada?: number, quantidade_perdida?: number, observacao?: string, justificacao?: string}>): Promise<RequisicaoDTO> {
    return apiClient.post<any, RequisicaoDTO>(`/v1/requisicoes/${id}/devolver`, devolvcoes);
  },
  async encerrar(id: string | number): Promise<RequisicaoDTO> {
    return apiClient.put<any, RequisicaoDTO>(`/v1/requisicoes/${id}/encerrar`, {});
  },
  async getSugestao(params?: { sector?: string }): Promise<any> {
    const res = await apiClient.get<any, any>(`/v1/requisicoes/sugestao`, { params });
    return res?.data || res;
  },
  async getOcorrencias(params?: { page?: number; per_page?: number }): Promise<any> {
    const res = await apiClient.get<any, any>(`/v1/requisicoes/ocorrencias`, { params });
    return res?.data || res;
  }
};

export const shiftService = {
  ...createService<TurnoDTO>('/v1/turnos', 'shifts'),
  async toggle(id: string | number): Promise<TurnoDTO> {
    const response = await apiClient.patch<any, TurnoDTO>(`/v1/turnos/${id}/toggle`, {});
    return response;
  }
};

export const financialService = {
  ...createService<CaixaDTO>('/v1/financeiro/caixas', 'financial'),
  async abrir(valor_inicial: number | string): Promise<CaixaDTO> {
    return apiClient.post<any, CaixaDTO>('/v1/financeiro/caixas/abrir', { valor_inicial });
  },
  async fechar(id: string | number, data?: any): Promise<any> {
    return apiClient.put<any, any>(`/v1/financeiro/caixas/${id}/fechar`, data || {});
  },
  async movimento(caixa_id: string | number, tipo: string, valor: number | string, descricao?: string, forma_pagamento?: string): Promise<any> {
    return apiClient.post<any, any>(`/v1/financeiro/caixas/${caixa_id}/movimentos`, { caixa_id, tipo, valor, descricao, forma_pagamento });
  },
  async getValoresEsperados(id: string | number): Promise<{ valor_esperado_dinheiro: number; valor_esperado_transferencia: number; valor_esperado_pos: number }> {
    const res = await apiClient.get<any, any>(`/v1/financeiro/caixas/${id}/valores-esperados`);
    return res?.data || res;
  },
  async getFluxoCaixa(inicio?: string, fim?: string): Promise<any> {
    const params: any = {};
    if (inicio) params.inicio = inicio;
    if (fim) params.fim = fim;
    const res = await apiClient.get<any, any>('/v1/financeiro/fluxo-caixa', { params });
    return res?.data || res;
  }
};

export const auditService = createService<any>('/v1/auditoria', 'audit');

export const deliveryService = {
  ...createService<any>('/v1/logistica/entregas', 'deliveries'),
  async updateEstado(id: string | number, estado: string): Promise<any> {
    return apiClient.put<any, any>(`/v1/logistica/entregas/${id}/estado`, { estado });
  }
};
export const vehicleService = createService<any>('/v1/logistica/viaturas', 'vehicles');

import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';

export const notificationService = {
   socket: null as Socket | null,
   init() {
     if (!this.socket) {
       this.socket = io(apiClient.defaults.baseURL?.replace('/api', '') || 'http://localhost:5000', {
         auth: { token: localStorage.getItem('access_token') }
       });
       
       this.socket.on('connect', () => console.log('Socket ligado'));
       
       // Registar eventos pedidos pelo backend
       this.socket.on('novo_pedido', (data) => toast.info(`Novo Pedido criado: ${data.numero || '...'}`));
       this.socket.on('pedido_atualizado', (data) => toast.success(`Pedido Atualizado para ${data.estado}`));
       this.socket.on('producao_concluida', (data) => toast.success(`Produção Concluída: ${data.numero || '...'}`));
       this.socket.on('requisicao_aprovada', (data) => toast.success('Requisição Aprovada!'));
       this.socket.on('stock_critico', (data) => toast.error(`Aviso de Stock Crítico: ${data.nome || ''}`));
       this.socket.on('caixa_fechado', (data) => toast.warning('O Caixa foi fechado.'));
     }
   },
   async getLatest() {
     return []; // Could fetch initial state from an endpoint if available
   }
};

export const dashboardService = {
  async getStats(): Promise<DashboardStatsDTO> {
    const res = await apiClient.get<any, any>('/v1/relatorios/dashboard');
    // The interceptor unwraps response.data, so res might be { success: true, data: {...} } or just the data.
    return res?.data || res || {
      kpis: { total_vendas: 0, total_eventos: 0, receita_estimada: 0, pedidos_pendentes: 0, ordens_ativas: 0 },
      graficos: { vendas_por_mes: [] }
    };
  }
};

export const configService = {
  async get(): Promise<any> {
    try {
      const res = await apiClient.get<any, any>('/v1/setup/empresa');
      const data = res.data || res || {};
      localStorage.setItem("sigi_config", JSON.stringify(data));
      
      

      return {
        empresa: data.nome || 'Não atribuido',
        nif: data.nif || 'Não atribuido',
        email: data.correio_eletronico || 'Não atribuido',
        telefone: data.telefone || 'Não atribuido',
        morada: data.localizacao || 'Não atribuido',
        website: data.endereco_web || 'Não atribuido',
        certificado: data.licenca_empresa || 'Não atribuido',
        moeda: data.moeda || 'Não atribuido',
        formato_impressao: data.tipo_formato_impressao || 'A4',
        impressaoAuto: data.impressao_auto ?? false,
        backupAuto: data.backup_auto ?? false,
        numVias: data.numero_vias ?? 2,
        taxaIva: data.taxa_iva ?? 14,
        licenca_aplicacao: data.licenca_aplicacao || 'Não atribuido',
        numero_whatsapp: data.numero_whatsapp || 'Não atribuido',
        telemoveis: data.telemoveis || []
      };
    } catch {
      const cached = localStorage.getItem("sigi_config");
      if (cached) {
        return JSON.parse(cached);
      }
      return {
        empresa: 'Não atribuido',
        nif: 'Não atribuido',
        email: 'Não atribuido',
        telefone: 'Não atribuido',
        morada: 'Não atribuido',
        website: 'Não atribuido',
        certificado: 'Não atribuido',
        moeda: 'Não atribuido',
        formato_impressao: 'A4',
        impressaoAuto: false,
        backupAuto: false,
        numVias: 2,
        taxaIva: 14,
        logotipo: ""
      };
    }
  },
  async update(uiData: any): Promise<any> {
    // Save to local storage for fields not handled by API yet
    localStorage.setItem("sigi_config", JSON.stringify(uiData));
    
    const payload = {
        nome: uiData.empresa,
        nif: uiData.nif,
        correio_eletronico: uiData.email,
        telefone: uiData.telefone,
        localizacao: uiData.morada,
        endereco_web: uiData.website,
        licenca_empresa: uiData.certificado,
        licenca_aplicacao: uiData.licenca_aplicacao,
        moeda: uiData.moeda,
        tipo_formato_impressao: uiData.formato_impressao,
        logo: uiData.logotipo,
        utiliza_iva: uiData.utiliza_iva,
        numero_whatsapp: uiData.numero_whatsapp,
        telemoveis: uiData.telemoveis
    };
    
    // Remove undefined/empty fields that we don't want to overwrite with null
    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) {
            delete payload[key];
        }
    });

    const res = await apiClient.put<any, any>('/v1/setup/empresa', payload);
    return res;
  }
};

export const fiscalService = {
  getIvaRates: async (): Promise<any[]> => {
    const res = await apiClient.get<any, any>('/v1/fiscal/iva');
    return res?.data || res || [];
  },
  createIvaRate: async (data: any): Promise<any> => {
    const res = await apiClient.post<any, any>('/v1/fiscal/iva', data);
    return res;
  },
  updateIvaRate: async (id: string | number, data: any): Promise<any> => {
    const res = await apiClient.put<any, any>(`/v1/fiscal/iva/${id}`, data);
    return res;
  },
  toggleIvaStatus: async (id: string | number): Promise<any> => {
    const res = await apiClient.patch<any, any>(`/v1/fiscal/iva/${id}/toggle-status`, {});
    return res;
  },
  deleteIvaRate: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/v1/fiscal/iva/${id}`);
  }
};

export const vendaService = {
  getAll: async (params?: BaseServiceParams & { estado?: string; cliente_id?: string; tipo_documento?: string; data_inicio?: string; data_fim?: string }): Promise<PaginatedData<any>> => {
    try {
      const res = await apiClient.get<any, any>('/v1/vendas', { params });
      if (Array.isArray(res)) {
        const page = Number(params?.page || 1);
        const perPage = Number(params?.per_page || 10);
        const total = res.length;
        const pages = Math.max(1, Math.ceil(total / perPage));
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        
        return {
          items: res.slice(startIndex, endIndex),
          total: total,
          pages: pages,
          page: page
        };
      }
      return res;
    } catch (err) {
      const res = await apiClient.get<any, any>('/v1/comercial/vendas', { params });
      if (Array.isArray(res)) {
        const page = Number(params?.page || 1);
        const perPage = Number(params?.per_page || 10);
        const total = res.length;
        const pages = Math.max(1, Math.ceil(total / perPage));
        const startIndex = (page - 1) * perPage;
        const endIndex = startIndex + perPage;
        
        return {
          items: res.slice(startIndex, endIndex),
          total: total,
          pages: pages,
          page: page
        };
      }
      return res;
    }
  },
  getById: async (id: string | number): Promise<any> => {
    try {
      return await apiClient.get<any, any>(`/v1/vendas/${id}`);
    } catch (err) {
      return apiClient.get<any, any>(`/v1/comercial/vendas/${id}`);
    }
  },
  create: async (venda: any): Promise<any> => {
    try {
      return await apiClient.post<any, any>('/v1/vendas', venda);
    } catch (err) {
      return apiClient.post<any, any>('/v1/comercial/vendas', venda);
    }
  },
  registrarPagamento: async (vendaId: string | number, param: { valor: number; metodo_pagamento: string; observacao?: string; codigo_transferencia?: string | null; emissor?: string | null; referencia?: string | null }): Promise<any> => {
    let forma_pagamento_id = 1; // Dinheiro
    if (param.metodo_pagamento === 'Transferência') forma_pagamento_id = 2;
    if (param.metodo_pagamento === 'TPA / POS' || param.metodo_pagamento === 'Multicaixa') forma_pagamento_id = 3;
    
    try {
      return await apiClient.post<any, any>(`/v1/vendas/${vendaId}/pagamentos`, {
        valor: Number(param.valor),
        forma_pagamento_id,
        observacoes: param.observacao,
        codigo_transferencia: param.codigo_transferencia,
        emissor: param.emissor,
        referencia: param.referencia
      });
    } catch (err) {
      return apiClient.post<any, any>(`/v1/comercial/vendas/${vendaId}/pagamentos`, {
        valor: Number(param.valor),
        forma_pagamento_id,
        observacoes: param.observacao,
        codigo_transferencia: param.codigo_transferencia,
        emissor: param.emissor,
        referencia: param.referencia
      });
    }
  },
  cancelar: async (id: string | number): Promise<any> => {
    try {
      return await apiClient.post<any, any>(`/v1/vendas/${id}/cancelar`, {});
    } catch (err) {
      return apiClient.post<any, any>(`/v1/comercial/vendas/${id}/cancelar`, {});
    }
  },
  sendDocument: async (vendaId: string | number, payload: { method: 'email' | 'whatsapp'; contact: string }): Promise<any> => {
    return apiClient.post<any, any>(`/v1/vendas/${vendaId}/send`, payload);
  }
};

export const financeiroService = {
  getContasReceber: async (params?: { estado?: string; search?: string }): Promise<any[]> => {
    const res = await apiClient.get<any, any>('/v1/financeiro/contas-receber', { params });
    // build_pagination devolve { items, total, pages, page }; manter a tela
    // protegida para os dois formatos usados pelos endpoints legados.
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.items)) return res.items;
    if (Array.isArray(res?.data?.items)) return res.data.items;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  },

  receberPagamento: async (contaId: string | number, param: { valor: number; metodo_pagamento: string; observacao?: string }): Promise<any> => {
    return apiClient.post<any, any>(`/v1/financeiro/contas-receber/${contaId}/receber`, param);
  },

  getFechosDiarios: async (): Promise<any[]> => {
    const res = await apiClient.get<any, any>('/v1/financeiro/fecho-diario');
    return res?.data || res || [];
  },

  gerarFechoDiario: async (dataObj?: any): Promise<any> => {
    return apiClient.post<any, any>('/v1/financeiro/fecho-diario', dataObj || {});
  },

  getContasPagar: async (params?: any): Promise<any[]> => {
    const res = await apiClient.get<any, any>('/v1/financeiro/contas-pagar', { params });
    return res?.data || res || [];
  },

  createContaPagar: async (data: any): Promise<any> => {
    return apiClient.post<any, any>('/v1/financeiro/contas-pagar', data);
  },

  liquidarContaPagar: async (id: string | number): Promise<any> => {
    return apiClient.post<any, any>(`/v1/financeiro/contas-pagar/${id}/pagar`, {});
  },

  getFluxoCaixa: async (params?: any): Promise<any> => {
    const res = await apiClient.get<any, any>('/v1/financeiro/fluxo-caixa', { params });
    return res?.data || res || { entradas: 0, saidas: 0, saldo: 0 };
  },

  createCreditoDireto: async (data: any): Promise<any> => {
    return apiClient.post<any, any>('/v1/financeiro/contas-receber', data);
  }
};

export const calendarioService = {
  getMesStats: async (ano: number | string, mes: number | string): Promise<any> => {
    const res = await apiClient.get<any, any>(`/v1/calendario/mes`, { params: { ano, mes } });
    return res?.data || res || { dias: {} };
  },
  
  getDiaDetalhes: async (data: string): Promise<any> => {
    const res = await apiClient.get<any, any>(`/v1/calendario/dia`, { params: { data } });
    return res?.data || res || { pedidos: [], producoes: [], entregas: [] };
  }
};

export * from './commercial/commercialService';

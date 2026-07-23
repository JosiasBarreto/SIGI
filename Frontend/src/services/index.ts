import apiClient, { ApiResponse, PaginatedData } from '../api/client';
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

export const productService = {
  ...createService<ProdutoDTO>('/v1/armazem/produtos', 'products'),
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

export const orderService = {
  ...createService<PedidoDTO>('/v1/pedidos', 'orders'),
  async updateEstado(id: string | number, estado: string, justificativa_cancelamento?: string): Promise<PedidoDTO> {
    return apiClient.put<any, PedidoDTO>(`/v1/pedidos/${id}/estado`, { estado, justificativa_cancelamento });
  },
  async checkoutPedido(id: string | number, payload: { forma_pagamento_id?: number | string; valor: number; codigo_transferencia?: string | null; emissor?: string | null; observacoes?: string }): Promise<any> {
    const robustPayload = {
      pagamento: {
        ...payload
      }
    };
    try {
      return await apiClient.post<any, any>(`/v1/vendas/checkout-pedido/${id}`, robustPayload);
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.status === 404) {
        return apiClient.post<any, any>(`/v1/comercial/checkout-pedido/${id}`, robustPayload);
      }
      throw err;
    }
  }
};

export const documentService = {
  async openAuthenticated(path: string, filename: string): Promise<void> {
    const baseUrl = String(apiClient.defaults.baseURL || '').replace(/\/$/, '');
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${baseUrl}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) {
      throw new Error(`Erro ao gerar documento (${response.status})`);
    }
    const blob = await response.blob();
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
  },
  vendaPdf(id: string | number) {
    return this.openAuthenticated(`/v1/vendas/${id}/pdf`, `venda_${id}.pdf`);
  },
  pedidoPdf(id: string | number) {
    return this.openAuthenticated(`/v1/pedidos/${id}/pdf`, `pedido_${id}.pdf`);
  },
  pedidoRecibo(id: string | number) {
    return this.openAuthenticated(`/v1/pedidos/${id}/recibo`, `recibo_pedido_${id}.pdf`);
  },
  eventoDocumento(id: string | number, tipo: 'proforma' | 'pdf' | 'word' = 'proforma') {
    return this.openAuthenticated(`/v1/eventos/${id}/documento/${tipo}`, `evento_${id}_${tipo}.${tipo === 'word' ? 'docx' : 'pdf'}`);
  }
};

export const eventService = {
  ...createService<EventoDTO>('/v1/eventos', 'events'),
  faturar: async (id: string | number, pagamento?: { valor: number; forma_pagamento_id: number; codigo_transferencia?: string | null; emissor?: string | null; observacoes?: string }): Promise<any> => {
    return apiClient.post<any, any>(`/v1/eventos/${id}/faturar`, { pagamento: pagamento || {} });
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
  }
};

export const productionService = {
  ...createService<OrdemProducaoDTO>('/v1/producao/ordens', 'orders'),
  async updateEstado(id: string | number, estado: string): Promise<OrdemProducaoDTO> {
    return apiClient.put<any, OrdemProducaoDTO>(`/v1/producao/ordens/${id}/estado`, { estado });
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
  async movimento(caixa_id: string | number, tipo: string, valor: number | string, descricao?: string): Promise<any> {
    return apiClient.post<any, any>(`/v1/financeiro/caixas/${caixa_id}/movimentos`, { caixa_id, tipo, valor, descricao });
  },
  async getValoresEsperados(id: string | number): Promise<{ valor_esperado_dinheiro: number; valor_esperado_transferencia: number; valor_esperado_pos: number }> {
    const res = await apiClient.get<any, any>(`/v1/financeiro/caixas/${id}/valores-esperados`);
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
    return res?.data || res || [];
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

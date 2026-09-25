import apiClient from '../../api/client';
import { 
  VendaRequest, 
  VendaResponse, 
  PagamentoRequest, 
  PagamentoResponse,
  CheckoutPedidoRequest,
  EventoFaturacaoRequest
} from '../../dtos';

export const commercialService = {
  // POS Checkout (Venda Direta)
  createVenda: async (data: VendaRequest): Promise<VendaResponse> => {
    const payload = {
      evento_id: null,
      cliente_id: null,
      ...data
    };
    try {
      return await apiClient.post<any, VendaResponse>('/v1/vendas', payload);
    } catch (err: any) {
      try {
        return await apiClient.post<any, VendaResponse>('/v1/comercial/vendas', payload);
      } catch (err2: any) {
        throw err || err2;
      }
    }
  },

  // Checkout a partir de um Pedido Existente
  checkoutPedido: async (data: CheckoutPedidoRequest): Promise<VendaResponse> => {
    // Transforma Pedido em Venda (gera documento fiscal)
    const pedidoId = data.pedido_id;
    const payload = { pagamento: data.pagamento };
    try {
      return await apiClient.post<any, VendaResponse>(`/v1/comercial/checkout-pedido/${pedidoId}`, payload);
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.status === 404 || err?.response?.status === 405) {
        return apiClient.post<any, VendaResponse>(`/v1/vendas/checkout-pedido/${pedidoId}`, payload);
      }
      throw err;
    }
  },

  // Faturar Evento
  faturarEvento: async (eventoId: number, data: EventoFaturacaoRequest): Promise<VendaResponse> => {
    return apiClient.post<any, VendaResponse>(`/v1/eventos/${eventoId}/faturar`, data);
  },

  // Adicionar Pagamento a uma Venda Existente (Pagamentos parciais / múltiplos)
  adicionarPagamento: async (vendaId: number, data: PagamentoRequest): Promise<PagamentoResponse> => {
    try {
      return await apiClient.post<any, PagamentoResponse>(`/v1/vendas/${vendaId}/pagamentos`, data);
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.status === 404 || err?.response?.status === 405) {
        return apiClient.post<any, PagamentoResponse>(`/v1/comercial/vendas/${vendaId}/pagamentos`, data);
      }
      throw err;
    }
  },

  // Envio de Fatura via e-mail ou WhatsApp
  enviarFatura: async (vendaId: number, data: { method: 'email' | 'whatsapp', contact: string }): Promise<void> => {
    try {
      return await apiClient.post<any, void>(`/v1/vendas/${vendaId}/send`, data);
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.status === 404 || err?.response?.status === 405) {
        return apiClient.post<any, void>(`/v1/comercial/vendas/${vendaId}/send`, data);
      }
      throw err;
    }
  },

  // Opcional: Listar Vendas, se existir
  getVendas: async (params?: any): Promise<any> => {
    try {
      const res = await apiClient.get<any, any>('/v1/vendas', { params });
      if (Array.isArray(res)) return { items: res, total: res.length, pages: 1, page: 1 };
      return res;
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.status === 404 || err?.response?.status === 405) {
        return apiClient.get<any, any>('/v1/comercial/vendas', { params });
      }
      throw err;
    }
  },

  // Obter detalhes de Venda
  getVendaById: async (id: number | string): Promise<VendaResponse> => {
    try {
      return await apiClient.get<VendaResponse, any>(`/v1/vendas/${id}`);
    } catch (err: any) {
      if (err?.response?.status === 404 || err?.status === 404 || err?.response?.status === 405) {
        return apiClient.get<VendaResponse, any>(`/v1/comercial/vendas/${id}`);
      }
      throw err;
    }
  }
};

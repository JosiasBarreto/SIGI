import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commercialService } from '../services/commercial/commercialService';
import { 
  VendaRequest, 
  PagamentoRequest, 
  CheckoutPedidoRequest, 
  EventoFaturacaoRequest 
} from '../dtos';
import { toast } from 'react-toastify';

export const useComercial = () => {
  const queryClient = useQueryClient();

  // Venda Direta (POS)
  const createVenda = useMutation({
    mutationFn: (data: VendaRequest) => commercialService.createVenda(data),
    onSuccess: () => {
      toast.success('Venda realizada com sucesso');
      // Invalida cache para atualizar painéis
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['caixa'] });
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao realizar venda');
    }
  });

  // Checkout de Pedido (Restaurante/Mesa)
  const checkoutPedido = useMutation({
    mutationFn: (data: CheckoutPedidoRequest) => commercialService.checkoutPedido(data),
    onSuccess: () => {
      toast.success('Pedido faturado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['caixa'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao faturar pedido');
    }
  });

  // Faturar Evento
  const faturarEvento = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EventoFaturacaoRequest }) => 
      commercialService.faturarEvento(id, data),
    onSuccess: () => {
      toast.success('Evento faturado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['eventos'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['caixa'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao faturar evento');
    }
  });

  // Adicionar Pagamento
  const adicionarPagamento = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PagamentoRequest }) => 
      commercialService.adicionarPagamento(id, data),
    onSuccess: () => {
      toast.success('Pagamento registado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['contas_receber'] });
      queryClient.invalidateQueries({ queryKey: ['caixa'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao registar pagamento');
    }
  });

  // Enviar Fatura
  const enviarFatura = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { method: 'email' | 'whatsapp'; contact: string } }) => 
      commercialService.enviarFatura(id, data),
    onSuccess: () => {
      toast.success('Fatura enviada com sucesso');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao solicitar envio de fatura');
    }
  });

  return {
    createVenda,
    checkoutPedido,
    faturarEvento,
    adicionarPagamento,
    enviarFatura
  };
};

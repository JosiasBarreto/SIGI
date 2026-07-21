import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../contexts/SocketContext';
import { useNotifications } from '../components/NotificationContext';
import { toast } from 'react-toastify';

export function SocketListeners() {
  const { socket, on, off, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const handleNovoPedido = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      const msg = payload?.numero ? `Novo pedido recebido: ${payload.numero}` : 'Novo pedido recebido!';
      toast.info(msg);
      addNotification({ title: 'Novo Pedido', message: msg, type: 'info' });
    };

    const handleNovaOrdemProducao = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      const msg = payload?.numero ? `Nova ordem de produção na cozinha: ${payload.numero}` : 'Tlim! Nova ordem recebida na cozinha!';
      toast.success(msg);
      addNotification({ title: 'Cozinha', message: msg, type: 'success' });
    };

    const handleProducaoIniciada = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      const msg = payload?.numero ? `Produção iniciada para: ${payload.numero}` : 'Produção iniciada!';
      toast.info(msg);
      addNotification({ title: 'Cozinha', message: msg, type: 'info' });
    };

    const handleProducaoConcluida = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      const msg = payload?.numero ? `Ordem de produção concluída: ${payload.numero}` : 'Ordem de produção concluída!';
      toast.success(msg);
      addNotification({ title: 'Produção', message: msg, type: 'success' });
    };

    const handleAlertaStock = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      const msg = payload?.msg && payload?.ingrediente 
        ? `Atenção: ${payload.msg} (Ingrediente: ${payload.ingrediente})`
        : payload?.msg || 'Alerta de stock mínimo atingido!';
      toast.error(msg);
      addNotification({ title: 'Stock Crítico', message: msg, type: 'error' });
    };

    const handlePedidoPronto = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      const clienteNome = payload?.cliente || 'Cliente';
      const orderNum = payload?.numero || payload?.id || '...';
      const msg = `Pedido ${orderNum} (${clienteNome}) pronto para entrega!`;
      toast.success(msg);
      addNotification({ title: 'Pedido Pronto', message: msg, type: 'success' });
    };

    const handlePedidoAtualizado = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
    };

    const handleLogisticaOcorrencia = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      const msg = payload?.msg || 'Ocorrência registada na logística / transporte.';
      toast.warning(msg);
      addNotification({ title: 'Ocorrência Logística', message: msg, type: 'warning' });
    };

    on('novo_pedido', handleNovoPedido);
    on('nova_ordem_producao', handleNovaOrdemProducao);
    on('producao_iniciada', handleProducaoIniciada);
    on('producao_concluida', handleProducaoConcluida);
    on('alerta_stock', handleAlertaStock);
    on('pedido_pronto', handlePedidoPronto);
    on('pedido_atualizado', handlePedidoAtualizado);
    on('logistica_ocorrencia', handleLogisticaOcorrencia);

    return () => {
      off('novo_pedido', handleNovoPedido);
      off('nova_ordem_producao', handleNovaOrdemProducao);
      off('producao_iniciada', handleProducaoIniciada);
      off('producao_concluida', handleProducaoConcluida);
      off('alerta_stock', handleAlertaStock);
      off('pedido_pronto', handlePedidoPronto);
      off('pedido_atualizado', handlePedidoAtualizado);
      off('logistica_ocorrencia', handleLogisticaOcorrencia);
    };
  }, [on, off, queryClient, addNotification]);

  return null;
}

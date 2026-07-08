import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../contexts/SocketContext';
import { useNotifications } from '../components/NotificationContext';

export function SocketListeners() {
  const { socket, on, off, isConnected } = useSocket();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const handleNovoPedido = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      addNotification({ title: 'Novo Pedido', message: 'Novo pedido recebido!', type: 'info' });
    };

    const handleProducaoConcluida = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      addNotification({ title: 'Produção', message: 'Ordem de produção concluída', type: 'success' });
    };

    const handleAlertaStock = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      addNotification({ title: 'Stock', message: 'Alerta de stock mínimo atingido', type: 'warning' });
    };

    const handlePedidoAtualizado = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
    };

    on('novo_pedido', handleNovoPedido);
    on('producao_concluida', handleProducaoConcluida);
    on('alerta_stock', handleAlertaStock);
    on('pedido_atualizado', handlePedidoAtualizado);

    return () => {
      off('novo_pedido', handleNovoPedido);
      off('producao_concluida', handleProducaoConcluida);
      off('alerta_stock', handleAlertaStock);
      off('pedido_atualizado', handlePedidoAtualizado);
    };
  }, [on, off, queryClient, addNotification]);

  return null;
}

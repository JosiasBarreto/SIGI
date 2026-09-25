import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../contexts/SocketContext';
import { notificationManager } from '../services/notifications';

export function SocketListeners() {
  const { on, off, emit } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    // 1. Notificação genérica / contrato direto de toasts e avisos
    const handleNotificacao = (payload: any) => {
      notificationManager.handleEvent('notificacao', payload);
    };

    // 2. Pedidos Comerciais
    const handleNovoPedido = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['orders-cal'] });
      notificationManager.handleEvent('novo_pedido', payload);
    };

    const handlePedidoAtualizado = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['orders-cal'] });
      notificationManager.handleEvent('pedido_actualizado', payload);
    };

    const handlePedidoCancelado = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['orders-cal'] });
      notificationManager.handleEvent('pedido_cancelado', payload);
    };

    const handlePedidoPronto = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders-cal'] });
      notificationManager.handleEvent('pedido_pronto', payload);
    };

    // 3. Produção & Cozinha / Pastelaria
    const handleNovaOrdemProducao = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['prod-cal'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-dia'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      notificationManager.handleEvent('nova_ordem_producao', payload);
    };

    const handleOrdemProducaoAtualizada = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      notificationManager.handleEvent('ordem_producao_actualizada', payload);
    };

    const handleProducaoIniciada = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      notificationManager.handleEvent('producao_iniciada', payload);
    };

    const handleProducaoConcluida = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      notificationManager.handleEvent('producao_concluida', payload);
    };

    const handleAlertaProducao = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      notificationManager.handleEvent('alerta_producao', payload);
    };

    // 4. Armazém, Stock & Inventário
    const handleStockBaixo = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
      notificationManager.handleEvent('stock_baixo', payload);
    };

    const handleStockCritico = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      queryClient.invalidateQueries({ queryKey: ['materiais'] });
      notificationManager.handleEvent('stock_critico', payload);
    };

    const handleInventarioConcluido = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      queryClient.invalidateQueries({ queryKey: ['inventarios'] });
      notificationManager.handleEvent('inventario_concluido', payload);
    };

    const handleDivergenciaInventario = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      queryClient.invalidateQueries({ queryKey: ['auditoria'] });
      notificationManager.handleEvent('divergencia_inventario', payload);
    };

    // 5. Requisições de Material
    const handleNovaRequisicao = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['requisicoes'] });
      notificationManager.handleEvent('requisicao_criada', payload);
    };

    const handleRequisicaoAprovada = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['requisicoes'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      notificationManager.handleEvent('requisicao_aprovada', payload);
    };

    const handleRequisicaoRejeitada = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['requisicoes'] });
      notificationManager.handleEvent('requisicao_rejeitada', payload);
    };

    // 6. Caixa & Financeiro
    const handleCaixaAberto = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['minha-sessao-caixa'] });
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      notificationManager.handleEvent('caixa_aberto', payload);
    };

    const handleCaixaFechado = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['minha-sessao-caixa'] });
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      queryClient.invalidateQueries({ queryKey: ['caixas_historico'] });
      notificationManager.handleEvent('caixa_fechado', payload);
    };

    const handlePagamentoRecebido = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['financeiro'] });
      notificationManager.handleEvent('pagamento_recebido', payload);
    };

    // 7. Logística & Eventos
    const handleLogisticaOcorrencia = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['logistica'] });
      notificationManager.handleEvent('logistica_ocorrencia', payload);
    };

    const handleNovoEvento = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events-cal'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-stats'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-dia'] });
      notificationManager.handleEvent('novo_evento', payload);
    };

    const handleAlertaEvento = (payload: any) => {
      notificationManager.handleEvent('alerta_evento_proximo', payload);
    };

    // 8. Alertas e Erros de Sistema
    const handleAlertaSistema = (payload: any) => {
      notificationManager.handleEvent('alerta_sistema', payload);
    };

    const handleErroSistema = (payload: any) => {
      notificationManager.handleEvent('erro_sistema', payload);
    };

    // 9. Heartbeat bidirecional (ping_server)
    const handlePingServer = () => {
      emit('pong_client', { status: 'ok' });
    };

    // Subscrições
    on('notificacao', handleNotificacao);
    on('notification', handleNotificacao);

    // Pedidos
    on('novo_pedido', handleNovoPedido);
    on('pedido_actualizado', handlePedidoAtualizado);
    on('pedido_atualizado', handlePedidoAtualizado);
    on('pedido_cancelado', handlePedidoCancelado);
    on('pedido_pronto', handlePedidoPronto);

    // Produção
    on('nova_ordem_producao', handleNovaOrdemProducao);
    on('ordem_producao_actualizada', handleOrdemProducaoAtualizada);
    on('ordem_producao_atualizada', handleOrdemProducaoAtualizada);
    on('producao_iniciada', handleProducaoIniciada);
    on('producao_concluida', handleProducaoConcluida);
    on('alerta_producao', handleAlertaProducao);

    // Stock
    on('stock_baixo', handleStockBaixo);
    on('alerta_stock', handleStockBaixo);
    on('alerta_material', handleStockBaixo);
    on('stock_critico', handleStockCritico);
    on('inventario_concluido', handleInventarioConcluido);
    on('divergencia_inventario', handleDivergenciaInventario);

    // Requisições
    on('requisicao_criada', handleNovaRequisicao);
    on('nova_requisicao', handleNovaRequisicao);
    on('requisicao_aprovada', handleRequisicaoAprovada);
    on('requisicao_rejeitada', handleRequisicaoRejeitada);

    // Caixa e Financeiro
    on('caixa_aberto', handleCaixaAberto);
    on('caixa_fechado', handleCaixaFechado);
    on('pagamento_recebido', handlePagamentoRecebido);

    // Logística e Eventos
    on('logistica_ocorrencia', handleLogisticaOcorrencia);
    on('novo_evento', handleNovoEvento);
    on('alerta_evento_proximo', handleAlertaEvento);

    // Sistema
    on('alerta_sistema', handleAlertaSistema);
    on('erro_sistema', handleErroSistema);
    on('ping_server', handlePingServer);

    return () => {
      off('notificacao', handleNotificacao);
      off('notification', handleNotificacao);
      off('novo_pedido', handleNovoPedido);
      off('pedido_actualizado', handlePedidoAtualizado);
      off('pedido_atualizado', handlePedidoAtualizado);
      off('pedido_cancelado', handlePedidoCancelado);
      off('pedido_pronto', handlePedidoPronto);

      off('nova_ordem_producao', handleNovaOrdemProducao);
      off('ordem_producao_actualizada', handleOrdemProducaoAtualizada);
      off('ordem_producao_atualizada', handleOrdemProducaoAtualizada);
      off('producao_iniciada', handleProducaoIniciada);
      off('producao_concluida', handleProducaoConcluida);
      off('alerta_producao', handleAlertaProducao);

      off('stock_baixo', handleStockBaixo);
      off('alerta_stock', handleStockBaixo);
      off('alerta_material', handleStockBaixo);
      off('stock_critico', handleStockCritico);
      off('inventario_concluido', handleInventarioConcluido);
      off('divergencia_inventario', handleDivergenciaInventario);

      off('requisicao_criada', handleNovaRequisicao);
      off('nova_requisicao', handleNovaRequisicao);
      off('requisicao_aprovada', handleRequisicaoAprovada);
      off('requisicao_rejeitada', handleRequisicaoRejeitada);

      off('caixa_aberto', handleCaixaAberto);
      off('caixa_fechado', handleCaixaFechado);
      off('pagamento_recebido', handlePagamentoRecebido);

      off('logistica_ocorrencia', handleLogisticaOcorrencia);
      off('novo_evento', handleNovoEvento);
      off('alerta_evento_proximo', handleAlertaEvento);

      off('alerta_sistema', handleAlertaSistema);
      off('erro_sistema', handleErroSistema);
      off('ping_server', handlePingServer);
    };
  }, [on, off, emit, queryClient]);

  return null;
}

// File: Frontend/src/components/SocketListeners.tsx
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../contexts/SocketContext';
import { useNotifications } from '../components/NotificationContext';
import { toast } from 'react-toastify';

export function SocketListeners() {
  const { on, off, emit } = useSocket();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const playProductionAlert = () => {
      try {
        const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
        const context = new AudioContextCtor();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = 880;
        gain.gain.setValueAtTime(0.12, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.45);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.45);
      } catch {
        // Áudio silenciado se o browser exigir interação prévia do utilizador
      }
    };

    // 1. Evento: notificacao (Contrato principal de notificações / toasts)
    // Payload esperado: { titulo: string, mensagem: string, tipo: 'info' | 'success' | 'error', data: object }
    const handleNotificacao = (payload: any) => {
      if (!payload || typeof payload !== 'object') return;
      const titulo = payload.titulo || payload.title || 'Notificação';
      const mensagem = payload.mensagem || payload.message || payload.msg || '';
      const tipoRaw = String(payload.tipo || payload.type || 'info').toLowerCase();
      const tipo: 'info' | 'success' | 'warning' | 'error' =
        tipoRaw === 'success' ? 'success' :
        tipoRaw === 'error' ? 'error' :
        tipoRaw === 'warning' ? 'warning' : 'info';

      if (mensagem) {
        toast[tipo](mensagem);
      }
      addNotification({
        title: titulo,
        message: mensagem || titulo,
        type: tipo,
        data: payload.data
      });
    };

    // 2. Evento: caixa_fechado
    // Payload esperado: { caixa_id, valor_final, data_fecho }
    const handleCaixaFechado = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['minha-sessao-caixa'] });
      queryClient.invalidateQueries({ queryKey: ['caixas'] });
      queryClient.invalidateQueries({ queryKey: ['caixas_historico'] });

      const caixaId = payload?.caixa_id || payload?.id;
      const valor = typeof payload?.valor_final === 'number' ? ` (${payload.valor_final.toFixed(2)} STN)` : '';
      const msg = caixaId ? `Caixa #${caixaId} foi encerrado${valor}.` : 'Uma sessão de caixa foi encerrada.';

      toast.warning(msg);
      addNotification({
        title: 'Fecho de Caixa',
        message: msg,
        type: 'warning',
        data: payload
      });
    };

    // 3. Evento: novo_pedido
    // Payload esperado: { numero, cliente_id, total }
    const handleNovoPedido = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      const numero = payload?.numero || payload?.id || '';
      const totalStr = typeof payload?.total === 'number' ? ` (Total: ${payload.total.toFixed(2)} STN)` : '';
      const msg = numero ? `Novo pedido #${numero} recebido${totalStr}!` : 'Novo pedido recebido no sistema!';

      toast.info(msg);
      addNotification({
        title: 'Novo Pedido',
        message: msg,
        type: 'info',
        data: payload
      });
    };

    // 4. Evento: pedido_atualizado
    // Payload esperado: { id, estado }
    const handlePedidoAtualizado = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });

      const id = payload?.id || payload?.pedido_id || '';
      const estado = payload?.estado || payload?.status || '';
      const msg = id && estado ? `Pedido #${id} atualizado para: ${estado}.` : (payload?.msg || 'Pedido atualizado!');

      toast.info(msg);
      addNotification({
        title: 'Pedido Atualizado',
        message: msg,
        type: 'info',
        data: payload
      });
    };

    // 5. Evento: nova_ordem_producao
    // Payload esperado: { numero, produto_id }
    const handleNovaOrdemProducao = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['prod-cal'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-dia'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });

      const numero = payload?.numero || payload?.id || '';
      const sector = payload?.sector || 'Produção';
      const msg = numero ? `Nova ordem de produção em ${sector}: ${numero}` : `Tlim! Nova ordem recebida em ${sector}!`;

      playProductionAlert();
      toast.success(msg);
      addNotification({
        title: sector,
        message: msg,
        type: 'success',
        data: payload
      });
    };

    // 6. Evento: alerta_producao
    // Payload esperado: { msg, ordem_id }
    const handleAlertaProducao = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });

      const msgText = payload?.msg || payload?.mensagem || 'Alerta operacional na linha de produção.';
      const ordem = payload?.ordem_id ? ` (OP #${payload.ordem_id})` : '';
      const fullMsg = `${msgText}${ordem}`;

      toast.warning(fullMsg);
      addNotification({
        title: 'Alerta de Produção',
        message: fullMsg,
        type: 'warning',
        data: payload
      });
    };

    // 7. Evento: alerta_stock
    // Payload esperado: { ingrediente, msg }
    const handleAlertaStock = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['produtos'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      queryClient.invalidateQueries({ queryKey: ['materiais'] });

      const ingrediente = payload?.ingrediente || payload?.material || payload?.nome || '';
      const msgText = payload?.msg || payload?.mensagem || 'Aviso de rutura/baixo stock de ingrediente.';
      const fullMsg = ingrediente ? `${msgText} (Ingrediente: ${ingrediente})` : msgText;

      toast.error(fullMsg);
      addNotification({
        title: 'Alerta de Stock',
        message: fullMsg,
        type: 'error',
        data: payload
      });
    };

    // 8. Evento: ping_server (Heartbeat / liveness check)
    // Payload esperado: { status: "ok" } -> Resposta obrigatória: emit('pong_client', { status: 'ok' })
    const handlePingServer = () => {
      emit('pong_client', { status: 'ok' });
    };

    // Outros eventos operacionais de apoio
    const handleProducaoIniciada = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['prod-cal'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-dia'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      const msg = payload?.numero ? `Produção iniciada para: ${payload.numero}` : 'Produção iniciada!';
      toast.info(msg);
      addNotification({ title: 'Cozinha', message: msg, type: 'info', data: payload });
    };

    const handleProducaoConcluida = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['prod-cal'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-dia'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      const msg = payload?.numero ? `Ordem de produção concluída: ${payload.numero}` : 'Ordem de produção concluída!';
      toast.success(msg);
      addNotification({ title: 'Produção', message: msg, type: 'success', data: payload });
    };

    const handlePedidoPronto = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['producao'] });
      const clienteNome = payload?.cliente || 'Cliente';
      const orderNum = payload?.numero || payload?.id || '...';
      const msg = `Pedido ${orderNum} (${clienteNome}) pronto para entrega!`;
      toast.success(msg);
      addNotification({ title: 'Pedido Pronto', message: msg, type: 'success', data: payload });
    };

    const handleLogisticaOcorrencia = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['entregas'] });
      const msg = payload?.msg || 'Ocorrência registada na logística / transporte.';
      toast.warning(msg);
      addNotification({ title: 'Ocorrência Logística', message: msg, type: 'warning', data: payload });
    };

    const handleNovaRequisicao = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      const msg = payload?.codigo ? `Nova requisição de material criada: ${payload.codigo}` : 'Nova requisição de material recebida!';
      toast.info(msg);
      addNotification({ title: 'Armazém / Logística', message: msg, type: 'info', data: payload });
    };

    const handleRequisicaoAprovada = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      const msg = payload?.codigo ? `Requisição ${payload.codigo} aprovada!` : 'Requisição de material aprovada!';
      toast.success(msg);
      addNotification({ title: 'Requisição Aprovada', message: msg, type: 'success', data: payload });
    };

    const handleNovoEvento = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['events-cal'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-stats'] });
      queryClient.invalidateQueries({ queryKey: ['calendario-dia'] });
      const msg = payload?.titulo ? `Novo evento agendado: ${payload.titulo}` : 'Novo evento agendado!';
      toast.info(msg);
      addNotification({ title: 'Novo Evento', message: msg, type: 'info', data: payload });
    };

    const handleAlertaEvento = (payload: any) => {
      const msg = payload?.msg || payload?.mensagem || 'Alerta de evento próximo!';
      toast.warning(msg);
      addNotification({ title: 'Eventos', message: msg, type: 'warning', data: payload });
    };

    // Subscrição a todos os eventos contratuais
    on('notificacao', handleNotificacao);
    on('notification', handleNotificacao);
    on('caixa_fechado', handleCaixaFechado);
    on('novo_pedido', handleNovoPedido);
    on('pedido_atualizado', handlePedidoAtualizado);
    on('nova_ordem_producao', handleNovaOrdemProducao);
    on('alerta_producao', handleAlertaProducao);
    on('alerta_stock', handleAlertaStock);
    on('alerta_material', handleAlertaStock);
    on('ping_server', handlePingServer);

    // Eventos operacionais complementares
    on('producao_iniciada', handleProducaoIniciada);
    on('producao_concluida', handleProducaoConcluida);
    on('pedido_pronto', handlePedidoPronto);
    on('logistica_ocorrencia', handleLogisticaOcorrencia);
    on('nova_requisicao', handleNovaRequisicao);
    on('requisicao_aprovada', handleRequisicaoAprovada);
    on('novo_evento', handleNovoEvento);
    on('alerta_evento_proximo', handleAlertaEvento);

    return () => {
      off('notificacao', handleNotificacao);
      off('notification', handleNotificacao);
      off('caixa_fechado', handleCaixaFechado);
      off('novo_pedido', handleNovoPedido);
      off('pedido_atualizado', handlePedidoAtualizado);
      off('nova_ordem_producao', handleNovaOrdemProducao);
      off('alerta_producao', handleAlertaProducao);
      off('alerta_stock', handleAlertaStock);
      off('alerta_material', handleAlertaStock);
      off('ping_server', handlePingServer);

      off('producao_iniciada', handleProducaoIniciada);
      off('producao_concluida', handleProducaoConcluida);
      off('pedido_pronto', handlePedidoPronto);
      off('logistica_ocorrencia', handleLogisticaOcorrencia);
      off('nova_requisicao', handleNovaRequisicao);
      off('requisicao_aprovada', handleRequisicaoAprovada);
      off('novo_evento', handleNovoEvento);
      off('alerta_evento_proximo', handleAlertaEvento);
    };
  }, [on, off, emit, queryClient, addNotification]);

  return null;
}

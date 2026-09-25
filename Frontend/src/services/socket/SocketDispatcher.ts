import { QueryClient } from '@tanstack/react-query';
import { socketManager } from './SocketManager';
import { SOCKET_CHANNELS, DOMAIN_SYNC_EVENTS } from './socketEvents';
import { notificationManager } from '../notifications/notificationManager';
import { RawNotificationPayload } from './socketTypes';

export class SocketDispatcher {
  private queryClient: QueryClient | null = null;
  private unsubscribers: Array<() => void> = [];
  private isInitialized: boolean = false;

  /**
   * Inicializa o dispatcher com a instância do QueryClient para invalidar queries
   */
  public init(queryClient: QueryClient): void {
    if (this.isInitialized && this.queryClient === queryClient) {
      return;
    }

    this.destroy();
    this.queryClient = queryClient;
    this.registerListeners();
    this.isInitialized = true;
  }

  public destroy(): void {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
    this.isInitialized = false;
  }

  private registerListeners(): void {
    if (!this.queryClient) return;

    // =========================================================================
    // 1. CANAL CENTRAL DE NOTIFICAÇÃO AO UTILIZADOR (Único que gera Toast/Som/UI)
    // =========================================================================
    const handleNotificacao = (payload: RawNotificationPayload) => {
      notificationManager.handleEvent(SOCKET_CHANNELS.NOTIFICACAO, payload);
    };

    this.unsubscribers.push(socketManager.on(SOCKET_CHANNELS.NOTIFICACAO, handleNotificacao));
    this.unsubscribers.push(socketManager.on(SOCKET_CHANNELS.NOTIFICATION, handleNotificacao));

    // =========================================================================
    // 2. EVENTOS TÉCNICOS DE SINCRONIZAÇÃO DE DOMÍNIO (React Query / KDS)
    //    IMPORTANTE: Estes eventos NÃO disparam Toasts nem Sons.
    // =========================================================================

    // --- A. Pedidos Comerciais ---
    const handleSyncPedidos = () => {
      if (!this.queryClient) return;
      this.queryClient.invalidateQueries({ queryKey: ['orders'] });
      this.queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      this.queryClient.invalidateQueries({ queryKey: ['requests'] });
      this.queryClient.invalidateQueries({ queryKey: ['vendas'] });
      this.queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      this.queryClient.invalidateQueries({ queryKey: ['orders-cal'] });
    };

    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.NOVO_PEDIDO, handleSyncPedidos));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.PEDIDO_ATUALIZADO, handleSyncPedidos));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.PEDIDO_ACTUALIZADO, handleSyncPedidos));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.PEDIDO_CANCELADO, handleSyncPedidos));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.PEDIDO_PRONTO, handleSyncPedidos));

    // --- B. Produção Fabril & Cozinha / Pastelaria ---
    const handleSyncProducao = () => {
      if (!this.queryClient) return;
      this.queryClient.invalidateQueries({ queryKey: ['producao'] });
      this.queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      this.queryClient.invalidateQueries({ queryKey: ['prod-cal'] });
      this.queryClient.invalidateQueries({ queryKey: ['calendario-dia'] });
      this.queryClient.invalidateQueries({ queryKey: ['orders'] });
      this.queryClient.invalidateQueries({ queryKey: ['pedidos'] });
    };

    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.NOVA_ORDEM_PRODUCAO, handleSyncProducao));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.ORDEM_PRODUCAO_ATUALIZADA, handleSyncProducao));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.ORDEM_PRODUCAO_ACTUALIZADA, handleSyncProducao));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.PRODUCAO_INICIADA, handleSyncProducao));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.PRODUCAO_CONCLUIDA, handleSyncProducao));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.ALERTA_PRODUCAO, handleSyncProducao));

    // --- C. Stock, Armazém & Inventário ---
    const handleSyncStock = () => {
      if (!this.queryClient) return;
      this.queryClient.invalidateQueries({ queryKey: ['produtos'] });
      this.queryClient.invalidateQueries({ queryKey: ['warehouse'] });
      this.queryClient.invalidateQueries({ queryKey: ['materiais'] });
      this.queryClient.invalidateQueries({ queryKey: ['inventarios'] });
      this.queryClient.invalidateQueries({ queryKey: ['auditoria'] });
    };

    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.STOCK_ATUALIZADO, handleSyncStock));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.STOCK_BAIXO, handleSyncStock));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.STOCK_CRITICO, handleSyncStock));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.ALERTA_STOCK, handleSyncStock));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.ALERTA_MATERIAL, handleSyncStock));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.INVENTARIO_CONCLUIDO, handleSyncStock));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.DIVERGENCIA_INVENTARIO, handleSyncStock));

    // --- D. Requisições de Material ---
    const handleSyncRequisicoes = () => {
      if (!this.queryClient) return;
      this.queryClient.invalidateQueries({ queryKey: ['requests'] });
      this.queryClient.invalidateQueries({ queryKey: ['requisicoes'] });
      this.queryClient.invalidateQueries({ queryKey: ['warehouse'] });
    };

    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.REQUISICAO_CRIADA, handleSyncRequisicoes));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.NOVA_REQUISICAO, handleSyncRequisicoes));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.REQUISICAO_ATUALIZADA, handleSyncRequisicoes));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.REQUISICAO_APROVADA, handleSyncRequisicoes));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.REQUISICAO_REJEITADA, handleSyncRequisicoes));

    // --- E. Caixa, Pagamentos & Financeiro ---
    const handleSyncCaixa = () => {
      if (!this.queryClient) return;
      this.queryClient.invalidateQueries({ queryKey: ['minha-sessao-caixa'] });
      this.queryClient.invalidateQueries({ queryKey: ['caixas'] });
      this.queryClient.invalidateQueries({ queryKey: ['caixas_historico'] });
      this.queryClient.invalidateQueries({ queryKey: ['vendas'] });
      this.queryClient.invalidateQueries({ queryKey: ['financeiro'] });
    };

    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.CAIXA_ABERTO, handleSyncCaixa));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.CAIXA_FECHADO, handleSyncCaixa));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.PAGAMENTO_RECEBIDO, handleSyncCaixa));

    // --- F. Logística & Eventos ---
    const handleSyncLogistica = () => {
      if (!this.queryClient) return;
      this.queryClient.invalidateQueries({ queryKey: ['entregas'] });
      this.queryClient.invalidateQueries({ queryKey: ['logistica'] });
      this.queryClient.invalidateQueries({ queryKey: ['eventos'] });
    };

    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.LOGISTICA_OCORRENCIA, handleSyncLogistica));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.NOVO_EVENTO, handleSyncLogistica));
    this.unsubscribers.push(socketManager.on(DOMAIN_SYNC_EVENTS.ALERTA_EVENTO_PROXIMO, handleSyncLogistica));
  }
}

export const socketDispatcher = new SocketDispatcher();

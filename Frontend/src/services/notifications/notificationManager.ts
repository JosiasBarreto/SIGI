import { toast, ToastOptions } from 'react-toastify';
import { AppNotification, NOTIFICATION_TYPES } from './notificationTypes';
import { NotificationAdapter } from './notificationAdapter';
import { notificationSoundManager } from './notificationSoundManager';
import { osNotificationManager } from './osNotificationManager';

type NotificationListener = (notification: AppNotification) => void;

class NotificationManager {
  private listeners: Set<NotificationListener> = new Set();
  private orderEventListeners: Set<NotificationListener> = new Set();
  // Cache de desduplicação: chave (hash/id) -> timestamp em ms
  private recentEvents: Map<string, number> = new Map();
  private readonly DEDUP_WINDOW_MS = 3000; // Ignora duplicados exatos recebidos dentro de 3 segundos

  // Controlo de sessão ativa de criação/finalização de pedidos (evita enxurrada de 3-4 toasts soltos)
  private orderSessionActive: boolean = false;
  private orderSessionExpiry: number = 0;
  private orderSessionReference: string | null = null;

  /**
   * Inicia um período de finalização de pedido onde múltiplos eventos relacionados
   * (novo pedido, nova OP, pagamento, etc.) são agrupados no Modal/Swal do Pedido
   * em vez de disparar 3 a 4 toasts flutuantes na tela.
   */
  public startOrderSession(orderReference?: string | number, durationMs: number = 7000) {
    this.orderSessionActive = true;
    this.orderSessionExpiry = Date.now() + durationMs;
    this.orderSessionReference = orderReference ? String(orderReference) : null;
  }

  /**
   * Encerra imediatamente a sessão de finalização do pedido
   */
  public endOrderSession() {
    this.orderSessionActive = false;
    this.orderSessionReference = null;
  }

  /**
   * Verifica se existe uma sessão ativa de pedido
   */
  public isOrderSessionActive(): boolean {
    if (!this.orderSessionActive) return false;
    if (Date.now() > this.orderSessionExpiry) {
      this.orderSessionActive = false;
      this.orderSessionReference = null;
      return false;
    }
    return true;
  }

  /**
   * Regista um ouvinte específico para o Modal/Swal de resumo de pedido
   */
  public subscribeToOrderEvents(listener: NotificationListener): () => void {
    this.orderEventListeners.add(listener);
    return () => {
      this.orderEventListeners.delete(listener);
    };
  }

  /**
   * Processa qualquer evento recebido do Socket.IO ou da aplicação
   */
  public handleEvent(eventName: string, payload: any): AppNotification | null {
    const notification = NotificationAdapter.fromBackendEvent(eventName, payload);

    // Verificação de desduplicação
    const dedupKey = this.buildDedupKey(notification);
    const now = Date.now();
    const lastSeen = this.recentEvents.get(dedupKey);

    if (lastSeen && (now - lastSeen) < this.DEDUP_WINDOW_MS) {
      // Evento duplicado descartado silenciosamente
      return null;
    }

    // Registar na janela de desduplicação
    this.recentEvents.set(dedupKey, now);
    this.cleanRecentEvents(now);

    // 1. Tocar som apropriado
    if (notification.sound !== false) {
      const typeConfig = NOTIFICATION_TYPES[notification.type];
      const preset = notification.priority === 'critical'
        ? 'critical'
        : notification.priority === 'high'
        ? 'alarm'
        : (typeConfig?.soundPreset || 'chime');

      notificationSoundManager.play(preset);
    }

    // 2. Notificar ouvintes do React (Store / Context / Notificações Gerais)
    this.notifyListeners(notification);

    // 3. Notificar o modal de pedido caso esteja ativo
    if (this.isOrderSessionActive() || this.orderEventListeners.size > 0) {
      this.orderEventListeners.forEach((listener) => {
        try {
          listener(notification);
        } catch (err) {
          console.error('[NotificationManager] Erro no ouvinte de pedido:', err);
        }
      });
    }

    // 4. Apresentar notificação Toast de acordo com a prioridade
    // Se a sessão de pedido estiver ativa, suprime toasts de eventos de fluxo de pedido
    // para que todas as mensagens fiquem organizadas dentro do componente/modal/swal
    const isOrderRelatedEvent = [
      'novo_pedido',
      'pedido_actualizado',
      'nova_ordem_producao',
      'ordem_producao_actualizada',
      'pagamento_recebido',
      'stock_baixo',
      'notificacao',
    ].includes(notification.type);

    if (this.isOrderSessionActive() && isOrderRelatedEvent && notification.priority !== 'critical') {
      // Suprimido da tela flutuante de toasts: fica organizado no componente/modal
    } else {
      this.showToast(notification);
    }

    // 5. Notificação do Sistema Operacional (se janela não estiver com foco ou para high/critical)
    if (notification.priority !== 'low' && !this.isOrderSessionActive()) {
      osNotificationManager.show(notification, (targetUrl) => {
        if (targetUrl && window.location.pathname !== targetUrl) {
          window.location.href = targetUrl;
        }
      });
    }

    return notification;
  }

  /**
   * Adiciona um ouvinte para receber novas notificações processadas
   */
  public subscribe(listener: NotificationListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(notification: AppNotification) {
    this.listeners.forEach((listener) => {
      try {
        listener(notification);
      } catch (err) {
        console.error('[NotificationManager] Erro no ouvinte de notificação:', err);
      }
    });
  }

  /**
   * Apresenta o Toast na interface de acordo com a prioridade
   */
  private showToast(notification: AppNotification) {
    // Se for prioridade baixa (low), não incomodar o utilizador com toast invasivo
    if (notification.priority === 'low') return;

    const options: ToastOptions = {
      autoClose: notification.priority === 'critical' ? false : (notification.priority === 'high' ? 6000 : 4000),
      closeOnClick: true,
      pauseOnHover: true,
    };

    const displayMsg = notification.title && notification.message && notification.title !== notification.message
      ? `${notification.title}: ${notification.message}`
      : (notification.message || notification.title);

    switch (notification.priority) {
      case 'critical':
        toast.error(`🚨 ${displayMsg}`, options);
        break;
      case 'high':
        toast.warning(`⚠️ ${displayMsg}`, options);
        break;
      case 'normal':
      default:
        if (notification.type.includes('concluid') || notification.type.includes('pronto') || notification.type.includes('aprovad')) {
          toast.success(`✓ ${displayMsg}`, options);
        } else {
          toast.info(`ℹ️ ${displayMsg}`, options);
        }
        break;
    }
  }

  private buildDedupKey(notif: AppNotification): string {
    if (notif.id && !notif.id.startsWith(Date.now().toString().slice(0, 7))) {
      return `id:${notif.id}`;
    }
    return `hash:${notif.type}:${notif.title}:${notif.message}`;
  }

  private cleanRecentEvents(now: number) {
    if (this.recentEvents.size > 200) {
      for (const [key, timestamp] of this.recentEvents.entries()) {
        if (now - timestamp > this.DEDUP_WINDOW_MS * 2) {
          this.recentEvents.delete(key);
        }
      }
    }
  }
}

export const notificationManager = new NotificationManager();

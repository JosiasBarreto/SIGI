import { toast, ToastOptions } from 'react-toastify';
import { AppNotification, NOTIFICATION_TYPES } from './notificationTypes';
import { NotificationAdapter } from './notificationAdapter';
import { notificationSoundManager } from './notificationSoundManager';
import { osNotificationManager } from './osNotificationManager';

type NotificationListener = (notification: AppNotification) => void;

class NotificationManager {
  private listeners: Set<NotificationListener> = new Set();
  // Cache de desduplicação: chave (hash/id) -> timestamp em ms
  private recentEvents: Map<string, number> = new Map();
  private readonly DEDUP_WINDOW_MS = 3000; // Ignora duplicados exatos recebidos dentro de 3 segundos

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

    // 2. Apresentar notificação Toast de acordo com a prioridade
    this.showToast(notification);

    // 3. Notificação do Sistema Operacional (se janela não estiver com foco ou para high/critical)
    if (notification.priority !== 'low') {
      osNotificationManager.show(notification, (targetUrl) => {
        if (targetUrl && window.location.pathname !== targetUrl) {
          window.location.href = targetUrl;
        }
      });
    }

    // 4. Notificar ouvintes do React (Store / Context)
    this.notifyListeners(notification);

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

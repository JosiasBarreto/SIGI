import { AppNotification } from './notificationTypes';

class OSNotificationManager {
  private permission: NotificationPermission = 'default';

  constructor() {
    if (this.isSupported()) {
      this.permission = Notification.permission;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    this.permission = Notification.permission;
    return this.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const result = await Notification.requestPermission();
      this.permission = result;
      return result;
    } catch {
      return 'denied';
    }
  }

  /**
   * Dispara uma notificação nativa do sistema operacional caso permitido.
   * Se o utilizador clicar na notificação, foca a janela e navega para a URL de destino.
   */
  public show(
    notification: AppNotification,
    onClickCallback?: (actionUrl?: string) => void
  ): boolean {
    if (!this.isSupported() || this.getPermission() !== 'granted') {
      return false;
    }

    try {
      // Usar a tag para agrupar ou evitar repetições
      const tag = notification.id || `sigi-notif-${notification.type}`;
      const title = `SIGI ERP: ${notification.title}`;
      const options: NotificationOptions = {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: tag,
        data: {
          id: notification.id,
          actionUrl: notification.actionUrl,
        },
        requireInteraction: notification.priority === 'critical',
      };

      const nativeNotif = new Notification(title, options);

      nativeNotif.onclick = () => {
        window.focus();
        nativeNotif.close();
        if (onClickCallback) {
          onClickCallback(notification.actionUrl);
        } else if (notification.actionUrl && window.location.pathname !== notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
      };

      return true;
    } catch (err) {
      console.warn('[OSNotificationManager] Erro ao disparar notificação OS:', err);
      return false;
    }
  }
}

export const osNotificationManager = new OSNotificationManager();

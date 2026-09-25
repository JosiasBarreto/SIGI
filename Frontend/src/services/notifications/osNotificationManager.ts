import { AppNotification } from './notificationTypes';

class OSNotificationManager {
  private permission: NotificationPermission = 'default';
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSwRegistered = false;

  constructor() {
    if (this.isSupported()) {
      this.permission = Notification.permission;
      this.initServiceWorker();
    }
  }

  /**
   * Inicializa o Service Worker para suportar notificações em segundo plano,
   * barra de estado e ecrã de bloqueio no telemóvel (Android / PWA).
   */
  private async initServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;
      this.isSwRegistered = true;
      // Força a atualização do worker caso haja nova versão
      reg.update().catch(() => {});
    } catch (err) {
      console.warn('[OSNotificationManager] Registo do Service Worker não disponível ou em modo de desenvolvimento:', err);
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && ('Notification' in window || 'serviceWorker' in navigator);
  }

  public getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    if (typeof Notification !== 'undefined') {
      this.permission = Notification.permission;
    }
    return this.permission;
  }

  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';

    try {
      // Regista o Service Worker se ainda não estiver
      if (!this.swRegistration && 'serviceWorker' in navigator) {
        this.initServiceWorker().catch(() => {});
      }

      if (typeof Notification !== 'undefined' && Notification.requestPermission) {
        const result = await Notification.requestPermission();
        this.permission = result;
        return result;
      }
      return 'denied';
    } catch {
      return 'denied';
    }
  }

  /**
   * Dispara uma notificação nativa do sistema operacional (Desktop, Barra de Notificações
   * e Ecrã de Bloqueio em dispositivos móveis Android/PWA).
   */
  public async show(
    notification: AppNotification,
    onClickCallback?: (actionUrl?: string) => void
  ): Promise<boolean> {
    if (!this.isSupported() || this.getPermission() !== 'granted') {
      return false;
    }

    try {
      const tag = notification.id || `sigi-notif-${notification.type}-${Date.now()}`;
      const title = notification.title.startsWith('SIGI') ? notification.title : `SIGI: ${notification.title}`;
      
      const options: any = {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: tag,
        renotify: true,
        vibrate: notification.priority === 'critical' ? [250, 100, 250, 100, 400] : [200, 100, 200],
        data: {
          id: notification.id,
          actionUrl: notification.actionUrl || '/notificacoes',
          type: notification.type,
        },
        requireInteraction: notification.priority === 'critical' || notification.priority === 'high',
        silent: false,
      };

      // 1. Tentar exibir via ServiceWorker (funciona com tela bloqueada e barra de notificações no telemóvel)
      if ('serviceWorker' in navigator) {
        try {
          const reg = this.swRegistration || (await navigator.serviceWorker.ready);
          if (reg && reg.showNotification) {
            await reg.showNotification(title, options);
            return true;
          }
        } catch (swErr) {
          console.warn('[OSNotificationManager] Falha ao disparar via ServiceWorker, tentando Notification API tradicional:', swErr);
        }
      }

      // 2. Fallback para Notification API clássica de desktop
      if (typeof Notification !== 'undefined') {
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
      }

      return false;
    } catch (err) {
      console.warn('[OSNotificationManager] Erro ao disparar notificação OS:', err);
      return false;
    }
  }
}

export const osNotificationManager = new OSNotificationManager();

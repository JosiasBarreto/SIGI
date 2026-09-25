import {
  AppNotification,
  NotificationChannel,
  NotificationPriority,
  NOTIFICATION_TYPES,
  SoundPreset
} from './notificationTypes';

export class NotificationPolicy {
  /**
   * Obtém o ID do utilizador autenticado no frontend
   */
  public getCurrentUserId(): string | number | null {
    try {
      const userStr = localStorage.getItem('sigi_user') || localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user?.id || user?.user_id || null;
      }
    } catch {}
    return null;
  }

  /**
   * Verifica se a notificação foi originada pelo próprio utilizador local e deve ser suprimida
   * caso a política do evento dite exclude_actor = true.
   */
  public isActorOriginator(notification: AppNotification): boolean {
    if (!notification.exclude_actor && notification.exclude_actor !== undefined) {
      return false;
    }

    const currentUserId = this.getCurrentUserId();
    if (!currentUserId || !notification.actor_user_id) {
      return false;
    }

    return String(currentUserId) === String(notification.actor_user_id);
  }

  /**
   * Resolve os canais ativos para uma notificação (IN_APP, SOUND, OS_NOTIFICATION, PERSISTENT)
   */
  public resolveActiveChannels(notification: AppNotification): Set<NotificationChannel> {
    const rawChannels = notification.channels || [];
    const active = new Set<NotificationChannel>();

    if (rawChannels.length > 0) {
      rawChannels.forEach((c) => {
        const upper = String(c).toUpperCase() as NotificationChannel;
        if (['IN_APP', 'SOUND', 'OS_NOTIFICATION', 'PERSISTENT'].includes(upper)) {
          active.add(upper);
        }
      });
    } else {
      // Canais padrão baseados na prioridade e configuração
      active.add('IN_APP');
      active.add('PERSISTENT');

      const priority = this.normalizePriority(notification.priority);
      if (priority === 'HIGH' || priority === 'CRITICAL') {
        active.add('SOUND');
        active.add('OS_NOTIFICATION');
      } else if (notification.sound !== false) {
        active.add('SOUND');
      }
    }

    return active;
  }

  public normalizePriority(priority?: NotificationPriority): 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' {
    const p = String(priority || '').toUpperCase();
    if (p === 'CRITICAL' || p === 'CRITICA' || p === 'CRÍTICA') return 'CRITICAL';
    if (p === 'HIGH' || p === 'ALTA' || p === 'ALTO') return 'HIGH';
    if (p === 'LOW' || p === 'BAIXA' || p === 'BAIXO') return 'LOW';
    return 'NORMAL';
  }

  public getToastDuration(priority?: NotificationPriority): number | false {
    const p = this.normalizePriority(priority);
    switch (p) {
      case 'CRITICAL':
        return false; // Persistente até dispensar
      case 'HIGH':
        return 6000;
      case 'NORMAL':
        return 4000;
      case 'LOW':
      default:
        return 3000;
    }
  }

  public getSoundPreset(notification: AppNotification): SoundPreset {
    const priority = this.normalizePriority(notification.priority);
    if (priority === 'CRITICAL') return 'critical';
    if (priority === 'HIGH') return 'alarm';

    const typeConfig = NOTIFICATION_TYPES[notification.type];
    return typeConfig?.soundPreset || 'chime';
  }
}

export const notificationPolicy = new NotificationPolicy();

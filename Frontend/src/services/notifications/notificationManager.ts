import { toast, ToastOptions } from 'react-toastify';
import { AppNotification } from './notificationTypes';
import { NotificationAdapter } from './notificationAdapter';
import { notificationDeduplicator } from './NotificationDeduplicator';
import { notificationPolicy } from './NotificationPolicy';
import { notificationSoundManager } from './notificationSoundManager';
import { osNotificationManager } from './osNotificationManager';

type NotificationListener = (notification: AppNotification) => void;

export interface OrderSessionConfig {
  pedidoId?: string | number;
  numero?: string;
  durationMs?: number;
}

class NotificationManager {
  private listeners: Set<NotificationListener> = new Set();
  private orderEventListeners: Set<NotificationListener> = new Set();

  // Controlo de sessão ativa de finalização de pedido
  private orderSession: {
    active: boolean;
    expiry: number;
    pedidoId?: string;
    numero?: string;
  } | null = null;

  /**
   * Inicia um período de finalização de pedido onde mensagens relacionadas
   * a esse pedido específico são concentradas no Modal/Swal de resumo
   */
  public startOrderSession(config?: OrderSessionConfig | string | number, durationMs: number = 8000) {
    const pedidoId = typeof config === 'object' ? config?.pedidoId : config;
    const numero = typeof config === 'object' ? config?.numero : undefined;
    const finalDuration = (typeof config === 'object' && config?.durationMs) ? config.durationMs : durationMs;

    this.orderSession = {
      active: true,
      expiry: Date.now() + finalDuration,
      pedidoId: pedidoId ? String(pedidoId) : undefined,
      numero: numero ? String(numero) : undefined,
    };
  }

  /**
   * Encerra imediatamente a sessão de pedido
   */
  public endOrderSession() {
    this.orderSession = null;
  }

  /**
   * Verifica se existe uma sessão ativa de pedido
   */
  public isOrderSessionActive(targetPedidoId?: string | number, targetNumero?: string): boolean {
    if (!this.orderSession || !this.orderSession.active) return false;
    if (Date.now() > this.orderSession.expiry) {
      this.orderSession = null;
      return false;
    }

    // Se a sessão foi iniciada com identificador de pedido, valida se coincide
    if (this.orderSession.pedidoId && targetPedidoId) {
      return String(this.orderSession.pedidoId) === String(targetPedidoId);
    }
    if (this.orderSession.numero && targetNumero) {
      return String(this.orderSession.numero) === String(targetNumero);
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
   * Processa qualquer evento recebido do Socket.IO ou da aplicação.
   *
   * FLUXO DE EXECUÇÃO:
   * 1. Validar e normalizar payload
   * 2. Verificar deduplicação por event_id / chave semântica
   * 3. Registar como processado
   * 4. Verificar política de originador (exclude_actor)
   * 5. Adicionar ao NotificationContext / UI Store
   * 6. Disparar Toast (se canal IN_APP ativo e não suprimido)
   * 7. Tocar Som (se canal SOUND ativo)
   * 8. Disparar OS Notification (se canal OS_NOTIFICATION ativo)
   */
  public handleEvent(eventName: string, payload: any): AppNotification | null {
    if (!payload) return null;

    // 1. Normalizar payload para o modelo canónico
    const notification = NotificationAdapter.fromBackendEvent(eventName, payload);

    // 2. Chave de deduplicação semântica de fallback
    const fallbackKey = notificationDeduplicator.buildSemanticFallbackKey(
      notification.event_type || notification.type,
      notification.entity_type,
      notification.entity_id,
      notification.data?.novo_estado,
      notification.title,
      notification.message
    );

    // 3. Verificação de deduplicação idempotente
    if (notificationDeduplicator.isDuplicate(notification.event_id, fallbackKey)) {
      // Evento duplicado descartado silenciosamente ANTES de tocar qualquer som ou emitir toast
      return null;
    }

    // 4. Registar na memória de deduplicação
    notificationDeduplicator.markProcessed(notification.event_id, fallbackKey);

    // 5. Verificar política de canais
    const activeChannels = notificationPolicy.resolveActiveChannels(notification);

    // 6. Verificar se o utilizador atual é o próprio autor da ação (exclude_actor)
    const isActor = notificationPolicy.isActorOriginator(notification);

    // 7. Notificar ouvintes do React (NotificationContext / Centro de Notificações)
    this.notifyListeners(notification);

    // 8. Notificar o modal de pedido caso esteja ativo
    const isOrderRelated = [
      'novo_pedido',
      'pedido_actualizado',
      'pedido_atualizado',
      'nova_ordem_producao',
      'ordem_producao_actualizada',
      'ordem_producao_atualizada',
      'pagamento_recebido',
      'notificacao',
    ].includes(notification.type);

    const isSessionActive = this.isOrderSessionActive(
      notification.data?.pedido_id,
      notification.data?.numero
    );

    if (isSessionActive || this.orderEventListeners.size > 0) {
      this.orderEventListeners.forEach((listener) => {
        try {
          listener(notification);
        } catch (err) {
          console.error('[NotificationManager] Erro no ouvinte de pedido:', err);
        }
      });
    }

    // 9. Toast: Apresentar se o canal IN_APP estiver ativo, não for o autor com exclude_actor e não estiver em sessão de pedido
    if (activeChannels.has('IN_APP') && !isActor) {
      if (!(isSessionActive && isOrderRelated && notification.priority !== 'CRITICAL')) {
        this.showToast(notification);
      }
    }

    // 10. Som: Tocar APENAS se o canal SOUND estiver ativo e o som não estiver silenciado
    if (activeChannels.has('SOUND') && !isActor && notification.sound !== false) {
      const soundPreset = notificationPolicy.getSoundPreset(notification);
      notificationSoundManager.play(soundPreset);
    }

    // 11. Notificação do Sistema Operativo (OS Notification)
    if (activeChannels.has('OS_NOTIFICATION') && !isActor && !isSessionActive) {
      osNotificationManager.show(notification, (targetUrl) => {
        if (targetUrl && typeof window !== 'undefined' && window.location.pathname !== targetUrl) {
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
    const priority = notificationPolicy.normalizePriority(notification.priority);
    if (priority === 'LOW') return;

    const autoClose = notificationPolicy.getToastDuration(notification.priority);

    const options: ToastOptions = {
      autoClose,
      closeOnClick: true,
      pauseOnHover: true,
    };

    const displayMsg = notification.title && notification.message && notification.title !== notification.message
      ? `${notification.title}: ${notification.message.split('\n')[0]}`
      : (notification.message || notification.title);

    switch (priority) {
      case 'CRITICAL':
        toast.error(`🚨 ${displayMsg}`, options);
        break;
      case 'HIGH':
        toast.warning(`⚠️ ${displayMsg}`, options);
        break;
      case 'NORMAL':
      default:
        if (
          notification.type.includes('concluid') ||
          notification.type.includes('pronto') ||
          notification.type.includes('aprovad')
        ) {
          toast.success(`✓ ${displayMsg}`, options);
        } else {
          toast.info(`ℹ️ ${displayMsg}`, options);
        }
        break;
    }
  }
}

export const notificationManager = new NotificationManager();

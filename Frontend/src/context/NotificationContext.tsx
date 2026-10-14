// src/context/NotificationContext.tsx
// Implementação do Contexto de Notificações conforme a Secção 5 do Relatório de Arquitetura

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { AppNotification, NotificationType } from '../types/notifications';
import { upsertNotification } from '../utils/notificationUtils';
import { socketManager } from '../services/socket/SocketManager';
import {
  notificationSoundManager,
  osNotificationManager,
  notificationAuditService,
  notificationManager,
  SoundSettings
} from '../services/notifications';

const MAX_STORED = 100;

export interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  deleteNotification: (id: string) => void; // alias para clearNotification
  clearNotifications: () => void;
  refreshNotifications: () => Promise<void>;
  addNotification: (notification: Partial<AppNotification> & { title?: string; message?: string; titulo?: string; mensagemAtual?: string }) => AppNotification;
  dispatchNotification: (eventName: string, payload: any) => AppNotification | null;
  soundSettings: SoundSettings;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  osPermission: NotificationPermission;
  requestOsPermission: () => Promise<NotificationPermission>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider: React.FC<{ children: React.ReactNode; userRole?: string }> = ({
  children,
  userRole: propUserRole,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [soundSettings, setSoundSettingsState] = useState<SoundSettings>(() =>
    notificationSoundManager.getSettings()
  );
  const [osPermission, setOsPermission] = useState<NotificationPermission>(() =>
    osNotificationManager.getPermission()
  );
  const [authVersion, setAuthVersion] = useState(0);

  // O provider monta antes do login. Sem este sinal, o primeiro efeito vê um
  // token vazio e nunca instala os listeners do Socket.IO após autenticar.
  useEffect(() => {
    const handleAuthChanged = () => {
      setNotifications([]);
      setAuthVersion((version) => version + 1);
    };
    window.addEventListener('sigi:auth-changed', handleAuthChanged);
    return () => window.removeEventListener('sigi:auth-changed', handleAuthChanged);
  }, []);

  // O histórico vem do backend autenticado; o estado do browser não é partilhado
  // entre utilizadores da mesma máquina.
  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const backendItems = await notificationAuditService.getHistorico({ per_page: 50 });
      const mappedItems = backendItems.map((item: any): AppNotification => {
        const canal = String(item.canal || item.entity_type || item.event_type || '').toLowerCase();
        const entityType: AppNotification['entityType'] = canal.includes('pedido')
          ? 'pedido'
          : canal.includes('producao') || canal.includes('ordem')
            ? 'producao'
            : canal.includes('requisicao')
              ? 'requisicao'
              : canal.includes('stock') || canal.includes('material')
                ? 'material'
                : 'sistema';
        const entityId = item.entity_id || item.data?.requisicao_id || item.data?.pedido_id || item.data?.ordem_id || item.id;
        const reference = item.data?.numero || item.data?.ordem_numero || `#${entityId}`;
        const priority = String(item.priority || '').toLowerCase();
        const tipo: NotificationType = priority === 'critical' || priority === 'error'
          ? 'error'
          : priority === 'high' || priority === 'warning'
            ? 'warning'
            : 'info';
        const timestamp = item.timestamp || new Date().toISOString();
        const read = Boolean(item.read || item.lida || item.lida_por_mim);
        return {
          id: String(item.id),
          entityType,
          entityId,
          referencia: reference,
          titulo: item.title || item.titulo || 'Notificação',
          mensagemAtual: item.message || item.mensagem || '',
          estadoAtual: item.data?.novo_estado || item.data?.estado || 'Notificado',
          tipo,
          prioridade: priority === 'critical' || priority === 'high' ? 'alta' : 'media',
          lida: read,
          criadaEm: timestamp,
          atualizadaEm: timestamp,
          historico: [],
          type: item.type || item.event_type || 'notificacao',
          title: item.title || item.titulo || 'Notificação',
          message: item.message || item.mensagem || '',
          read,
          priority: item.priority || 'normal',
          timestamp,
          actionUrl: item.actionUrl,
          canal: item.canal,
          data: item.data,
          event_id: item.event_id,
          event_type: item.event_type,
          entity_type: item.entity_type,
          entity_id: item.entity_id,
        };
      });
      setNotifications(mappedItems.slice(0, MAX_STORED));
    } catch (err) {
      console.warn('[NotificationContext] Falha ao sincronizar histórico backend:', err);
    } finally {
      setIsLoading(false);
    }
  }, [authVersion]);

  // Sincroniza o histórico logo após autenticar, para que o sino não dependa
  // de abrir a página de notificações ou de recarregar manualmente.
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  useEffect(() => {
    if (!localStorage.getItem('access_token') && !localStorage.getItem('token')) return;
    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 30_000);
    return () => window.clearInterval(intervalId);
  }, [authVersion, refreshNotifications]);

  // Escuta WebSocket do Socket.IO com token JWT no Handshake e canais oficiais do relatório
  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) return;

    // Conectar socket central ou criar instância compatível com a documentação
    const socketInstance = socketManager.connect();
    const unsubscribeSocketStatus = socketManager.onStatusChange((status) => {
      if (status === 'connected') {
        console.info('[SIGI][notificacoes] Socket.IO ligado');
      } else if (status === 'disconnected') {
        console.warn('[SIGI][notificacoes] Socket.IO desligado; histórico continuará a sincronizar.');
      }
    });

    // Recebe o evento normalizado do único canal responsável por toast,
    // som e notificação do sistema operativo. O contexto apenas atualiza o
    // sino/histórico, evitando que o mesmo WebSocket gere dois toasts.
    const handleNotificacaoGeral = (data: any) => {
      if (!data) return;
      const titulo = data.titulo || data.title || 'Aviso do Sistema';
      const mensagem = data.mensagem || data.message || 'Notificação recebida';
      const tipo: NotificationType = data.tipo === 'error' || data.type === 'error' ? 'error' : data.tipo === 'success' || data.type === 'success' ? 'success' : 'info';
      const rawEntityType = String(data.entity_type || data.entidade_tipo || 'sistema').toLowerCase();
      const entityId = data.entity_id || data.entidade_id || data.data?.pedido_id || data.data?.ordem_id || data.id || Date.now();
      const isPedido = rawEntityType.includes('pedido') || Boolean(data.data?.pedido_id);
      const isProducao = rawEntityType.includes('ordem') || rawEntityType.includes('producao') || Boolean(data.data?.ordem_id);
      const entityType = isPedido ? 'pedido' : isProducao ? 'producao' : rawEntityType.includes('requisicao') ? 'requisicao' : rawEntityType.includes('material') ? 'material' : 'sistema';

      setNotifications((prev) =>
        upsertNotification(prev, {
          notificationId: data.id,
          entityType,
          entityId,
          referencia: titulo,
          novoEstado: 'Notificado',
          mensagem,
          tipo,
          prioridade: ['alta', 'high', 'critical'].includes(String(data.prioridade || data.priority || '').toLowerCase())
            ? 'alta'
            : 'media',
          actionUrl: isPedido ? '/pedidos' : isProducao ? '/producao' : '/notificacoes',
          data,
        })
      );

    };

    const unsubscribeNotificationManager = notificationManager.subscribe((notification) => {
      handleNotificacaoGeral({
        ...notification,
        entity_type: notification.entity_type,
        entity_id: notification.entity_id,
        titulo: notification.title,
        mensagem: notification.message,
        tipo: notification.type,
        prioridade: notification.priority,
        data: notification.data,
      });
    });

    return () => {
      unsubscribeNotificationManager();
      unsubscribeSocketStatus();
    };
  }, [propUserRole, authVersion]);

  // Ações sobre notificações
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, lida: true, read: true } : n
      )
    );
    void notificationAuditService.marcarComoLida(id).catch((err) => {
      console.warn('[NotificationContext] Não foi possível marcar notificação como lida:', err);
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, lida: true, read: true }))
    );
    void notificationAuditService.marcarTodasComoLidas().catch((err) => {
      console.warn('[NotificationContext] Não foi possível marcar todas como lidas:', err);
    });
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    notificationAuditService.eliminarNotificacao(id);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const addNotification = useCallback((payload: any): AppNotification => {
    const entityType = payload.entityType || 'sistema';
    const entityId = payload.entityId || Date.now();
    const referencia = payload.referencia || payload.title || payload.titulo || 'AVISO';
    const novoEstado = payload.estadoAtual || payload.novoEstado || 'Ativo';
    const mensagem = payload.mensagemAtual || payload.message || payload.mensagem || '';

    let created: AppNotification | null = null;
    setNotifications((prev) => {
      const nextList = upsertNotification(prev, {
        entityType,
        entityId,
        referencia,
        novoEstado,
        mensagem,
        tipo: payload.tipo || 'info',
        prioridade: payload.prioridade || 'media',
        actionUrl: payload.actionUrl,
        data: payload.data,
      });
      created = nextList[0];
      return nextList;
    });

    return created || ({} as AppNotification);
  }, []);

  const dispatchNotification = useCallback((eventName: string, payload: any) => {
    addNotification({
      ...payload,
      entityType: eventName.includes('pedido') ? 'pedido' : eventName.includes('req') ? 'requisicao' : 'sistema',
      novoEstado: payload.novo_estado || 'Disparado',
    });
    return null;
  }, [addNotification]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    notificationSoundManager.setEnabled(enabled);
    setSoundSettingsState(notificationSoundManager.getSettings());
  }, []);

  const setSoundVolume = useCallback((volume: number) => {
    notificationSoundManager.setVolume(volume);
    setSoundSettingsState(notificationSoundManager.getSettings());
  }, []);

  const requestOsPermission = useCallback(async () => {
    const perm = await osNotificationManager.requestPermission();
    setOsPermission(perm);
    return perm;
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.lida && !n.read).length,
    [notifications]
  );

  const contextValue = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      clearNotification,
      deleteNotification: clearNotification,
      clearNotifications,
      refreshNotifications,
      addNotification,
      dispatchNotification,
      soundSettings,
      setSoundEnabled,
      setSoundVolume,
      osPermission,
      requestOsPermission,
    }),
    [
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearNotifications,
      refreshNotifications,
      addNotification,
      dispatchNotification,
      soundSettings,
      setSoundEnabled,
      setSoundVolume,
      osPermission,
      requestOsPermission,
    ]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de NotificationProvider');
  }
  return context;
};

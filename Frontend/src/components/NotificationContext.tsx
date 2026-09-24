import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  AppNotification,
  notificationManager,
  notificationSoundManager,
  osNotificationManager,
  SoundSettings
} from '../services/notifications';

const NOTIFICATIONS_STORAGE_KEY = 'sigi_notifications_history_v1';
const MAX_NOTIFICATIONS_STORED = 100;

export interface NotificationContextProps {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (notification: Partial<AppNotification> & { title: string; message: string }) => AppNotification;
  dispatchNotification: (eventName: string, payload: any) => AppNotification | null;
  soundSettings: SoundSettings;
  setSoundEnabled: (enabled: boolean) => void;
  setSoundVolume: (volume: number) => void;
  osPermission: NotificationPermission;
  requestOsPermission: () => Promise<NotificationPermission>;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.slice(0, MAX_NOTIFICATIONS_STORED);
        }
      }
    } catch {}
    return [];
  });

  const [soundSettings, setSoundSettingsState] = useState<SoundSettings>(() =>
    notificationSoundManager.getSettings()
  );

  const [osPermission, setOsPermission] = useState<NotificationPermission>(() =>
    osNotificationManager.getPermission()
  );

  // Guardar no localStorage sempre que as notificações forem atualizadas
  useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS_STORED)));
    } catch (e) {
      console.warn('[NotificationContext] Erro ao persistir histórico no localStorage:', e);
    }
  }, [notifications]);

  // Registar o Context como ouvinte do NotificationManager
  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((newNotif) => {
      setNotifications((prev) => {
        // Evita duplicados na lista
        if (prev.some((n) => n.id === newNotif.id)) {
          return prev;
        }
        return [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS_STORED);
      });
    });
    return unsubscribe;
  }, []);

  // Limpar ou atualizar quando utilizador faz logout
  useEffect(() => {
    const handleAuthChange = () => {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        setNotifications([]);
        try {
          localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
        } catch {}
      }
    };
    window.addEventListener('sigi:auth-changed', handleAuthChange);
    return () => window.removeEventListener('sigi:auth-changed', handleAuthChange);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.removeItem(NOTIFICATIONS_STORAGE_KEY);
    } catch {}
  }, []);

  const addNotification = useCallback(
    (notification: Partial<AppNotification> & { title: string; message: string }): AppNotification => {
      const result = notificationManager.handleEvent(
        notification.type || 'notificacao',
        {
          ...notification,
          id: notification.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: notification.timestamp || new Date().toISOString(),
          read: false,
        }
      );
      return (
        result || {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type: notification.type || 'notificacao',
          title: notification.title,
          message: notification.message,
          priority: notification.priority || 'normal',
          timestamp: new Date().toISOString(),
          read: false,
        }
      );
    },
    []
  );

  const dispatchNotification = useCallback((eventName: string, payload: any) => {
    return notificationManager.handleEvent(eventName, payload);
  }, []);

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
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearNotifications,
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
      markAsRead,
      markAllAsRead,
      deleteNotification,
      clearNotifications,
      addNotification,
      dispatchNotification,
      soundSettings,
      setSoundEnabled,
      setSoundVolume,
      osPermission,
      requestOsPermission,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}

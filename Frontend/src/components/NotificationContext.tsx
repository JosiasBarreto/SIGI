import React, { createContext, useContext, useState } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'error';
}

interface NotificationContextProps {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'read' | 'time'>) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // Sem dados de demonstração: SocketListeners adiciona somente eventos reais.
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const addNotification = (notification: Omit<AppNotification, 'id' | 'read' | 'time'>) => {
    setNotifications((previous) => [{ ...notification, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, read: false, time: new Date().toISOString() }, ...previous]);
  };
  const markAsRead = (id: string) => setNotifications((previous) => previous.map((item) => item.id === id ? { ...item, read: true } : item));
  const markAllAsRead = () => setNotifications((previous) => previous.map((item) => ({ ...item, read: true })));
  const unreadCount = notifications.filter((item) => !item.read).length;
  return <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}

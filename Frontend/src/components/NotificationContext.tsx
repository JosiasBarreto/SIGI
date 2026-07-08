import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [notifications, setNotifications] = useState<AppNotification[]>([
    { id: '1', title: 'Novo pedido recebido', message: 'Sr. Manuel encomendou Bolo de Casamento', time: new Date().toISOString(), read: false, type: 'info' },
    { id: '2', title: 'Requisição Aprovada', message: 'Tendas e Cadeiras para evento Ilha', time: new Date(Date.now() - 3600000).toISOString(), read: false, type: 'success' },
    { id: '3', title: 'Stock Crítico', message: 'Açúcar Refinado atingiu stock mínimo (50kg)', time: new Date(Date.now() - 7200000).toISOString(), read: true, type: 'error' }
  ]);

  useEffect(() => {
    // Simulate incoming notifications randomly
    const interval = setInterval(() => {
      const examples: Omit<AppNotification, 'id' | 'read' | 'time'>[] = [
        { title: 'Pedido Concluído', message: 'Salgados para Confraternização prontos.', type: 'success' },
        { title: 'Evento Próximo', message: 'O casamento Silva & Mota começa em 2h.', type: 'warning' },
        { title: 'Material não devolvido', message: 'Faltam 5 Copos Cristal na devolução do ID 394.', type: 'error' },
        { title: 'Entrega Atribuída', message: 'Carrinha Frigorífica alocada ao motorista Pedro.', type: 'info' }
      ];
      
      if (Math.random() > 0.6) {
        const randomNotif = examples[Math.floor(Math.random() * examples.length)];
        addNotification(randomNotif);
      }
    }, 45000); // Check every 45 secs

    return () => clearInterval(interval);
  }, []);

  const addNotification = (notif: Omit<AppNotification, 'id' | 'read' | 'time'>) => {
    setNotifications(prev => [{
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      read: false,
      time: new Date().toISOString()
    }, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addNotification }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

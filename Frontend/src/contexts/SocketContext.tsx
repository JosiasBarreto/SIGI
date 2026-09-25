import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { socketManager } from '../services/socket/SocketManager';
import { SocketConnectionStatus } from '../services/socket/socketTypes';

interface SocketContextType {
  isConnected: boolean;
  status: SocketConnectionStatus;
  on: (event: string, callback: (...args: any[]) => void) => () => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  isConnected: false,
  status: 'disconnected',
  on: () => () => {},
  off: () => {},
  emit: () => {},
  reconnect: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SocketConnectionStatus>(() => socketManager.getStatus());

  useEffect(() => {
    // Inicia a conexão única gerenciada pelo SocketManager
    socketManager.connect();

    const unsubStatus = socketManager.onStatusChange((newStatus) => {
      setStatus(newStatus);
    });

    return () => {
      unsubStatus();
    };
  }, []);

  const value = useMemo<SocketContextType>(() => ({
    isConnected: status === 'connected',
    status,
    on: (event, cb) => socketManager.on(event, cb),
    off: (event, cb) => socketManager.off(event, cb),
    emit: (event, ...args) => socketManager.emit(event, ...args),
    reconnect: () => socketManager.reconnectWithCurrentAuth(),
  }), [status]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

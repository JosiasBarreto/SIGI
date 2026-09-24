// File: Frontend/src/contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
  emit: (event: string, ...args: any[]) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  on: () => {},
  off: () => {},
  emit: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const apiUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://192.168.100.141:8000/api';
    const socketUrl = apiUrl.replace(/\/api(?:\/v\d+)?\/?$/, '');
    const newSocket = io(socketUrl, {
      auth: { token },
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Compatibility fallback for deployments that still use the explicit
      // join event. The backend validates the same JWT before joining rooms.
      
    });
    newSocket.on('disconnect', (reason) => {
      console.warn('[Socket.IO] Desconectado:', reason);
      setIsConnected(false);
    });
    newSocket.on('connect_error', (error) => {
      console.error('[Socket.IO] Erro de conexão:', error);
      console.error('[Socket.IO] URL:', socketUrl);
      console.error('[Socket.IO] Transport:', newSocket.io.engine?.transport?.name);
    
      setIsConnected(false);
    });
    
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [authVersion]);

  useEffect(() => {
    const refreshAuthentication = () => setAuthVersion((version) => version + 1);
    window.addEventListener('sigi:auth-changed', refreshAuthentication);
    return () => window.removeEventListener('sigi:auth-changed', refreshAuthentication);
  }, []);

  const value: SocketContextType = {
    socket,
    isConnected,
    on: (event, cb) => {
      socket?.on(event, cb);
    },
    off: (event, cb) => {
      socket?.off(event, cb);
    },
    emit: (event, ...args) => {
      socket?.emit(event, ...args);
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}

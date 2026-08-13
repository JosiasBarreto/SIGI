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

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://192.168.100.141:8000/api';
    const socketUrl = apiUrl.replace(/\/api(?:\/.*)?\/?$/, '');
    const newSocket = io(socketUrl, {
      auth: {
        token: localStorage.getItem('access_token')
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      newSocket.emit('join', { token: localStorage.getItem('access_token') });
    });
    newSocket.on('disconnect', () => setIsConnected(false));
    
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
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

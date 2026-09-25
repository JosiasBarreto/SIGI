import { io, Socket } from 'socket.io-client';
import { ApiSockeit } from '../../api/SockectPort';
import apiClient from '../../api/client';
import { SocketConnectionStatus } from './socketTypes';

type SocketListenerCallback = (...args: any[]) => void;
type StatusListenerCallback = (status: SocketConnectionStatus) => void;

function resolveSocketUrl(): string {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/api(?:\/v\d+)?\/?$/, '');
  }
  if (ApiSockeit) {
    return ApiSockeit.replace(/\/api(?:\/v\d+)?\/?$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api(?:\/v\d+)?\/?$/, '');
  }
  const apiUrl = apiClient.defaults.baseURL || 'https://c805-197-159-166-222.ngrok-free.app';
  return apiUrl.replace(/\/api(?:\/v\d+)?\/?$/, '');
}

class SocketManager {
  private socket: Socket | null = null;
  private status: SocketConnectionStatus = 'disconnected';
  private listeners: Map<string, Set<SocketListenerCallback>> = new Map();
  private statusListeners: Set<StatusListenerCallback> = new Set();
  private isConnecting: boolean = false;

  constructor() {
    // Escuta mudanças de token/autenticação no browser
    if (typeof window !== 'undefined') {
      window.addEventListener('sigi:auth-changed', () => {
        this.reconnectWithCurrentAuth();
      });
    }
  }

  public getStatus(): SocketConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.status === 'connected' && Boolean(this.socket?.connected);
  }

  public onStatusChange(callback: StatusListenerCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private setStatus(newStatus: SocketConnectionStatus) {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.statusListeners.forEach((cb) => {
        try {
          cb(newStatus);
        } catch (e) {
          console.error('[SocketManager] Erro no listener de status:', e);
        }
      });
    }
  }

  /**
   * Conecta o Socket.IO com o token JWT atual se houver sessão ativa
   */
  public connect(): Socket | null {
    if (typeof window === 'undefined') return null;

    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) {
      this.disconnect();
      return null;
    }

    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.isConnecting && this.socket) {
      return this.socket;
    }

    this.isConnecting = true;
    this.setStatus('connecting');

    const socketUrl = resolveSocketUrl();

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    const socket = io(socketUrl, {
      auth: { token },
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      upgrade: true,
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true',
      },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socket.on('connect', () => {
      this.isConnecting = false;
      this.setStatus('connected');
      socket.emit('join', { token });
    });

    socket.on('disconnect', (reason) => {
      this.isConnecting = false;
      this.setStatus('disconnected');
    });

    socket.on('reconnect_attempt', () => {
      this.setStatus('reconnecting');
    });

    socket.on('connect_error', (error) => {
      this.isConnecting = false;
      this.setStatus('disconnected');
      console.warn('[SocketManager] Erro de ligação Socket.IO:', error?.message || error);
    });

    // Heartbeat bidirecional de integridade
    socket.on('ping_server', () => {
      socket.emit('pong_client', { status: 'ok' });
    });

    // Anexar todos os listeners registados previamente
    this.listeners.forEach((callbacks, eventName) => {
      callbacks.forEach((cb) => {
        socket.on(eventName, cb);
      });
    });

    this.socket = socket;
    return this.socket;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.setStatus('disconnected');
  }

  public reconnectWithCurrentAuth() {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) {
      this.disconnect();
    } else {
      this.disconnect();
      this.connect();
    }
  }

  /**
   * Regista um ouvinte para um evento de forma segura e sem duplicados
   */
  public on(event: string, callback: SocketListenerCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const callbackSet = this.listeners.get(event)!;
    callbackSet.add(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => {
      this.off(event, callback);
    };
  }

  /**
   * Remove um ouvinte específico
   */
  public off(event: string, callback: SocketListenerCallback): void {
    const callbackSet = this.listeners.get(event);
    if (callbackSet) {
      callbackSet.delete(callback);
      if (callbackSet.size === 0) {
        this.listeners.delete(event);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Emite um evento via Socket.IO
   */
  public emit(event: string, ...args: any[]): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, ...args);
    }
  }
}

export const socketManager = new SocketManager();

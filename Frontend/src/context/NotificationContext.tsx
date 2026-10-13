// src/context/NotificationContext.tsx
// Implementação do Contexto de Notificações conforme a Secção 5 do Relatório de Arquitetura

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { AppNotification, NotificationType, NotificationPriorityLevel } from '../types/notifications';
import { upsertNotification, playNotificationSound } from '../utils/notificationUtils';
import { socketManager } from '../services/socket/SocketManager';
import {
  notificationSoundManager,
  osNotificationManager,
  notificationAuditService,
  SoundSettings
} from '../services/notifications';

const STORAGE_KEY = 'sigi_notifications';
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
  // Estado persistido no localStorage (chave 'sigi_notifications')
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('sigi_notifications_history_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            id: item.id || `notif_${Date.now()}`,
            entityType: item.entityType || 'sistema',
            entityId: item.entityId || item.id,
            referencia: item.referencia || item.title || 'SISTEMA',
            titulo: item.titulo || item.title || 'Notificação',
            mensagemAtual: item.mensagemAtual || item.message || '',
            estadoAtual: item.estadoAtual || (item.read ? 'Lida' : 'Pendente'),
            tipo: (item.tipo || (item.priority === 'critical' ? 'error' : item.priority === 'high' ? 'warning' : 'info')) as NotificationType,
            prioridade: (item.prioridade || (item.priority === 'critical' || item.priority === 'high' ? 'alta' : 'media')) as NotificationPriorityLevel,
            lida: item.lida !== undefined ? Boolean(item.lida) : Boolean(item.read),
            criadaEm: item.criadaEm || item.timestamp || new Date().toISOString(),
            atualizadaEm: item.atualizadaEm || item.timestamp || new Date().toISOString(),
            historico: Array.isArray(item.historico) ? item.historico : [
              {
                estado: item.estadoAtual || 'Registo',
                timestamp: item.timestamp || new Date().toISOString(),
                mensagem: item.mensagemAtual || item.message,
              }
            ],
            // Compatibilidade com código legados
            title: item.titulo || item.title,
            message: item.mensagemAtual || item.message,
            read: item.lida !== undefined ? Boolean(item.lida) : Boolean(item.read),
            priority: item.priority || 'normal',
            type: item.type || 'notificacao',
            timestamp: item.atualizadaEm || item.timestamp || new Date().toISOString(),
            actionUrl: item.actionUrl,
            data: item.data,
          })).slice(0, MAX_STORED);
        }
      }
    } catch (e) {
      console.warn('[NotificationContext] Erro ao carregar localStorage:', e);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [soundSettings, setSoundSettingsState] = useState<SoundSettings>(() =>
    notificationSoundManager.getSettings()
  );
  const [osPermission, setOsPermission] = useState<NotificationPermission>(() =>
    osNotificationManager.getPermission()
  );

  // Guardar no localStorage sempre que o estado é alterado
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_STORED)));
    } catch (err) {
      console.warn('[NotificationContext] Erro ao guardar no localStorage:', err);
    }
  }, [notifications]);

  // Carregar histórico do backend para consolidar
  const refreshNotifications = useCallback(async () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    try {
      const backendItems = await notificationAuditService.getHistorico({ per_page: 50 });
      if (backendItems && backendItems.length > 0) {
        setNotifications((prev) => {
          let updatedList = [...prev];
          backendItems.forEach((item: any) => {
            const entityType = item.type?.includes('pedido')
              ? 'pedido'
              : item.type?.includes('requisicao')
              ? 'requisicao'
              : item.type?.includes('material')
              ? 'material'
              : 'sistema';
            const entityId = item.entity_id || item.id;
            const ref = item.data?.numero || item.data?.ordem_numero || `#${entityId}`;

            updatedList = upsertNotification(updatedList, {
              entityType,
              entityId,
              referencia: ref,
              novoEstado: item.data?.novo_estado || 'Notificado',
              mensagem: item.message || item.mensagemAtual || 'Atualização do sistema',
              tipo: item.priority === 'critical' ? 'error' : item.priority === 'high' ? 'warning' : 'info',
              prioridade: item.priority === 'critical' || item.priority === 'high' ? 'alta' : 'media',
              actionUrl: item.actionUrl,
              data: item.data,
            });
          });
          return updatedList.slice(0, MAX_STORED);
        });
      }
    } catch (err) {
      console.warn('[NotificationContext] Falha ao sincronizar histórico backend:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Escuta WebSocket do Socket.IO com token JWT no Handshake e canais oficiais do relatório
  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) return;

    // Conectar socket central ou criar instância compatível com a documentação
    const socketInstance = socketManager.connect();

    // 1. Escuta de Notificações de Requisição (Armazém, Admin, Controlador)
    const handleRequisicaoNotificacao = (data: any) => {
      if (!data) return;
      const estado = data.estado || 'Pendente';
      const isAprovada = estado.toLowerCase() === 'aprovada';
      const isEncerrada = estado.toLowerCase() === 'encerrada';
      const tipo: NotificationType = isAprovada ? 'success' : isEncerrada ? 'info' : 'warning';
      const ref = data.numero || `REQ-${data.requisicao_id}`;

      setNotifications((prev) =>
        upsertNotification(prev, {
          entityType: 'requisicao',
          entityId: data.requisicao_id || Date.now(),
          referencia: ref,
          novoEstado: estado,
          mensagem: data.mensagem || `Requisição ${ref} atualizada para ${estado}.`,
          tipo,
          prioridade: 'media',
          actionUrl: '/requisicoes',
          data,
        })
      );

      // Feedback sonoro e toast
      toast.info(`Requisição ${ref}: ${estado}`);
    };

    // 2. Escuta de Atualização de Pedido
    const handlePedidoAtualizado = (data: any) => {
      if (!data) return;
      const novoEstado = data.novo_estado || data.estado || 'Atualizado';
      const isPronto = novoEstado.toLowerCase() === 'pronto';
      const numero = data.numero || data.pedido_numero || `#${data.pedido_id}`;

      const mensagem = isPronto
        ? `Pedido #${numero} está PRONTO! (Cliente notificado via Email/WhatsApp)`
        : `Pedido #${numero} mudou para: ${novoEstado}`;

      setNotifications((prev) =>
        upsertNotification(prev, {
          entityType: 'pedido',
          entityId: data.pedido_id || Date.now(),
          referencia: `PED-${numero}`,
          novoEstado,
          mensagem,
          tipo: isPronto ? 'success' : 'info',
          prioridade: isPronto ? 'alta' : 'media',
          actionUrl: '/pedidos',
          data,
        })
      );

      // Se estiver pronto, emitir alerta sonoro discreto para sala de expedição/balcão e toast de destaque
      if (isPronto) {
        playNotificationSound('bell');
        toast.success(`🎉 ${mensagem}`, { autoClose: 7000 });
      } else {
        toast.info(mensagem);
      }
    };

    // 3. Escuta de Novo Pedido Criado
    const handleNovoPedido = (data: any) => {
      if (!data) return;
      const numero = data.numero || `#${data.pedido_id}`;
      const cliente = data.cliente_nome || data.cliente || 'Consumidor Final';
      const totalTxt = data.total ? ` - Total: ${data.total} STN` : '';
      const mensagem = `Novo pedido #${numero} recebido (${cliente})${totalTxt}.`;

      setNotifications((prev) =>
        upsertNotification(prev, {
          entityType: 'pedido',
          entityId: data.pedido_id || Date.now(),
          referencia: `PED-${numero}`,
          novoEstado: 'Novo',
          mensagem,
          tipo: 'info',
          prioridade: 'media',
          actionUrl: '/pedidos',
          data,
        })
      );

      playNotificationSound('chime');
      toast.info(`🔔 ${mensagem}`);
    };

    // 4. Escuta de Alerta do Sistema Geral
    const handleNotificacaoGeral = (data: any) => {
      if (!data) return;
      const titulo = data.titulo || data.title || 'Aviso do Sistema';
      const mensagem = data.mensagem || data.message || 'Notificação recebida';
      const tipo: NotificationType = data.tipo === 'error' || data.type === 'error' ? 'error' : data.tipo === 'success' || data.type === 'success' ? 'success' : 'info';

      setNotifications((prev) =>
        upsertNotification(prev, {
          entityType: 'sistema',
          entityId: data.id || Date.now(),
          referencia: titulo,
          novoEstado: 'Notificado',
          mensagem,
          tipo,
          prioridade: data.prioridade === 'alta' ? 'alta' : 'media',
          data,
        })
      );

      if (tipo === 'error') {
        toast.error(`${titulo}: ${mensagem}`);
      } else {
        toast.info(`${titulo}: ${mensagem}`);
      }
    };

    // 5. Escuta de Alerta de Material (Danos/Perdas de Materiais)
    const handleAlertaMaterial = (data: any) => {
      if (!data) return;
      const msg = data.msg || data.mensagem || 'Ocorrência registada no controlo de materiais';
      const materialId = data.material_id || Date.now();

      setNotifications((prev) =>
        upsertNotification(prev, {
          entityType: 'material',
          entityId: materialId,
          referencia: `MAT-${materialId}`,
          novoEstado: 'Alerta',
          mensagem: msg,
          tipo: 'warning',
          prioridade: 'alta',
          actionUrl: '/controlo-materiais',
          data,
        })
      );

      toast.warn(`⚠️ Alerta de Material: ${msg}`);
    };

    // Registar no socket central
    const unsubRequisicao = socketManager.on('requisicao_notificacao', handleRequisicaoNotificacao);
    const unsubPedidoAtualizado = socketManager.on('pedido_atualizado', handlePedidoAtualizado);
    const unsubNovoPedido = socketManager.on('novo_pedido', handleNovoPedido);
    const unsubNotificacao = socketManager.on('notificacao', handleNotificacaoGeral);
    const unsubAlertaMaterial = socketManager.on('alerta_material', handleAlertaMaterial);

    return () => {
      unsubRequisicao();
      unsubPedidoAtualizado();
      unsubNovoPedido();
      unsubNotificacao();
      unsubAlertaMaterial();
    };
  }, [propUserRole]);

  // Ações sobre notificações
  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, lida: true, read: true } : n
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, lida: true, read: true }))
    );
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    notificationAuditService.eliminarNotificacao(id);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
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

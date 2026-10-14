// src/context/NotificationContext.tsx
// Implementação do Contexto de Notificações conforme a Secção 5 do Relatório de Arquitetura

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppNotification, NotificationType, NotificationPriorityLevel } from '../types/notifications';
import { upsertNotification } from '../utils/notificationUtils';
import { socketManager } from '../services/socket/SocketManager';
import {
  notificationSoundManager,
  osNotificationManager,
  notificationAuditService,
  notificationManager,
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
  const [authVersion, setAuthVersion] = useState(0);

  // O provider monta antes do login. Sem este sinal, o primeiro efeito vê um
  // token vazio e nunca instala os listeners do Socket.IO após autenticar.
  useEffect(() => {
    const handleAuthChanged = () => setAuthVersion((version) => version + 1);
    window.addEventListener('sigi:auth-changed', handleAuthChanged);
    return () => window.removeEventListener('sigi:auth-changed', handleAuthChanged);
  }, []);

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

  // Sincroniza o histórico logo após autenticar, para que o sino não dependa
  // de abrir a página de notificações ou de recarregar manualmente.
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Escuta WebSocket do Socket.IO com token JWT no Handshake e canais oficiais do relatório
  useEffect(() => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (!token) return;

    // Conectar socket central ou criar instância compatível com a documentação
    const socketInstance = socketManager.connect();
    const recentProductionAlertKeys = new Set<string>();
    const unsubscribeSocketStatus = socketManager.onStatusChange((status) => {
      if (status === 'connected') {
        console.info('[SIGI][notificacoes] Socket.IO ligado');
      } else if (status === 'disconnected') {
        console.warn('[SIGI][notificacoes] Socket.IO desligado; histórico continuará a sincronizar.');
      }
    });

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

      // O toast/som é responsabilidade exclusiva do NotificationManager.
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

      // O evento visual correspondente é tratado pelo NotificationManager.
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

      // O evento visual correspondente é tratado pelo NotificationManager.
    };

    // 4. Recebe o evento normalizado do único canal responsável por toast,
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
          entityType,
          entityId,
          referencia: titulo,
          novoEstado: 'Notificado',
          mensagem,
          tipo,
          prioridade: data.prioridade === 'alta' ? 'alta' : 'media',
          actionUrl: isPedido ? '/pedidos' : isProducao ? '/producao' : '/notificacoes',
          data,
        })
      );

    };

    // Eventos de sector continuam a ser emitidos para os KDS legados. Também
    // entram na central para que o sino notifique operadores que só usam a UI
    // geral, mesmo quando não existe uma notificação global associada.
    const handleAlertaProducao = (data: any) => {
      if (!data) return;
      const setor = data.setor || data.sector || 'Produção';
      const numero = data.numero || data.pedido_numero || data.ordem_numero || `#${data.pedido_id || data.ordem_id || ''}`;
      const mensagem = data.msg || data.mensagem || `Novo trabalho recebido em ${setor}.`;
      const alertKey = `${setor}:${data.ordem_id || data.pedido_id || numero}`;

      // O backend publica o mesmo alerta para a room global e para a room do
      // sector. Um cliente pertencente às duas recebe ambas as cópias.
      if (recentProductionAlertKeys.has(alertKey)) return;
      recentProductionAlertKeys.add(alertKey);
      window.setTimeout(() => recentProductionAlertKeys.delete(alertKey), 3000);

      setNotifications((prev) =>
        upsertNotification(prev, {
          entityType: 'producao',
          entityId: data.ordem_id || data.pedido_id || Date.now(),
          referencia: `${setor}: ${numero}`,
          novoEstado: 'Novo',
          mensagem,
          tipo: 'info',
          prioridade: 'alta',
          actionUrl: '/producao',
          data,
        })
      );

      // O alerta pode chegar em mais de uma room; não deve criar toast/som
      // local. Quando houver notificação visual, o NotificationManager trata-a.
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

      // Toast/som ficam centralizados no NotificationManager.
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

    // Registar no socket central
    const unsubRequisicao = socketManager.on('requisicao_notificacao', handleRequisicaoNotificacao);
    const unsubPedidoAtualizado = socketManager.on('pedido_atualizado', handlePedidoAtualizado);
    const unsubNovoPedido = socketManager.on('novo_pedido', handleNovoPedido);
    // Alguns fluxos antigos publicam o evento técnico sem publicar o evento
    // visual. Encaminhar pelo NotificationManager garante toast imediato e
    // mantém a deduplicação quando ambos os eventos chegam.
    const unsubNovoPedidoVisual = socketManager.on('novo_pedido', (data) => {
      notificationManager.handleEvent('novo_pedido', data);
    });
    const unsubNovaOrdemVisual = socketManager.on('nova_ordem_producao', (data) => {
      notificationManager.handleEvent('nova_ordem_producao', data);
    });
    const unsubAlertaProducaoVisual = socketManager.on('alerta_producao', (data) => {
      notificationManager.handleEvent('alerta_producao', data);
    });
    const unsubAlertaMaterial = socketManager.on('alerta_material', handleAlertaMaterial);
    const unsubAlertaCozinha = socketManager.on('alerta_cozinha', handleAlertaProducao);
    const unsubAlertaPastelaria = socketManager.on('alerta_pastelaria', handleAlertaProducao);
    const unsubAlertaBar = socketManager.on('alerta_bar', handleAlertaProducao);

    return () => {
      unsubRequisicao();
      unsubPedidoAtualizado();
      unsubNovoPedido();
      unsubNovoPedidoVisual();
      unsubNovaOrdemVisual();
      unsubAlertaProducaoVisual();
      unsubscribeNotificationManager();
      unsubAlertaMaterial();
      unsubAlertaCozinha();
      unsubAlertaPastelaria();
      unsubAlertaBar();
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

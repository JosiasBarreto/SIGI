import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketDispatcher } from '../services/socket/SocketDispatcher';

/**
 * Componente central que anexa o SocketDispatcher ao QueryClient do TanStack Query.
 * Garante que eventos de domínio de sincronização invalidam caches em background,
 * e eventos de notificação são encaminhados exclusivamente ao NotificationManager.
 */
export function SocketListeners() {
  const queryClient = useQueryClient();

  useEffect(() => {
    socketDispatcher.init(queryClient);

    return () => {
      socketDispatcher.destroy();
    };
  }, [queryClient]);

  return null;
}

// src/components/NotificationContext.tsx
// Re-exporta o contexto canónico de src/context/NotificationContext para compatibilidade retroativa absoluta

export * from '../context/NotificationContext';
export { NotificationProvider, useNotifications } from '../context/NotificationContext';
export type { NotificationContextType as NotificationContextProps } from '../context/NotificationContext';

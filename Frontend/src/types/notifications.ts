// src/types/notifications.ts
// Tipagem canónica conforme o Relatório de Arquitetura e Implementação de Notificações no Frontend (SIGI ERP)

export type NotificationType = 'info' | 'success' | 'warning' | 'error';
export type NotificationEntity = 'pedido' | 'producao' | 'requisicao' | 'material' | 'sistema';
export type NotificationPriorityLevel = 'baixa' | 'media' | 'alta';

export interface NotificationHistoryEntry {
  estado: string;
  timestamp: string; // ISO String
  mensagem?: string;
  autor?: string;
}

export interface AppNotification {
  id: string; // Ex: 'pedido_45' ou 'req_28'
  entityType: NotificationEntity;
  entityId: number | string;
  referencia: string; // Ex: 'PED-2026-AB12' ou 'REQ-2026-X8'
  titulo: string;
  mensagemAtual: string;
  estadoAtual: string;
  tipo: NotificationType;
  prioridade: NotificationPriorityLevel;
  lida: boolean;
  criadaEm: string;
  atualizadaEm: string;
  historico: NotificationHistoryEntry[];

  // Propriedades para compatibilidade retroativa total com módulos legados
  type: string;
  title: string;
  message: string;
  read: boolean;
  priority: any;
  timestamp: string;
  actionUrl?: string;
  canal?: string;
  data?: any;
  metadados?: any;
  channels?: any[];
  event_id?: string;
  event_type?: string;
  entity_type?: string;
  entity_id?: string | number;
}

export interface UpsertNotificationPayload {
  notificationId?: string | number;
  entityType: NotificationEntity;
  entityId: number | string;
  referencia: string;
  novoEstado: string;
  mensagem: string;
  tipo?: NotificationType;
  prioridade?: NotificationPriorityLevel;
  autor?: string;
  actionUrl?: string;
  data?: any;
}

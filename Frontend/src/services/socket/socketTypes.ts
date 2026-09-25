export type SocketConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting';

export type DomainEventType =
  | 'novo_pedido'
  | 'pedido_atualizado'
  | 'pedido_actualizado'
  | 'pedido_cancelado'
  | 'pedido_pronto'
  | 'nova_ordem_producao'
  | 'ordem_producao_atualizada'
  | 'ordem_producao_actualizada'
  | 'producao_iniciada'
  | 'producao_concluida'
  | 'alerta_producao'
  | 'stock_atualizado'
  | 'stock_baixo'
  | 'stock_critico'
  | 'alerta_stock'
  | 'alerta_material'
  | 'inventario_concluido'
  | 'divergencia_inventario'
  | 'requisicao_criada'
  | 'nova_requisicao'
  | 'requisicao_atualizada'
  | 'requisicao_aprovada'
  | 'requisicao_rejeitada'
  | 'caixa_aberto'
  | 'caixa_fechado'
  | 'pagamento_recebido'
  | 'logistica_ocorrencia'
  | 'novo_evento'
  | 'alerta_evento_proximo'
  | 'alerta_sistema'
  | 'erro_sistema'
  | 'ping_server';

export interface RawNotificationPayload {
  event_id?: string;
  id?: string | number;
  event_type?: string;
  entity_type?: string;
  entity_id?: string | number;
  aggregate_id?: string | number;
  actor_user_id?: string | number;
  actor_id?: string | number;
  exclude_actor?: boolean;
  timestamp?: string;
  created_at?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' | 'low' | 'normal' | 'high' | 'critical';
  prioridade?: string;
  canal?: string;
  channel?: string;
  tipo?: string;
  type?: string;
  titulo?: string;
  title?: string;
  mensagem?: string;
  message?: string;
  channels?: string[];
  notification?: {
    title?: string;
    message?: string;
    type?: string;
    priority?: string;
    channels?: string[];
    sound?: boolean;
    persistent?: boolean;
  };
  data?: Record<string, any>;
  metadados?: Record<string, any>;
  [key: string]: any;
}

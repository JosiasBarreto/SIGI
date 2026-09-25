export type NotificationPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' | 'low' | 'normal' | 'high' | 'critical';

export type NotificationChannel = 'IN_APP' | 'SOUND' | 'OS_NOTIFICATION' | 'PERSISTENT';

export type NotificationTypeKey =
  | 'novo_pedido'
  | 'nova_ordem_producao'
  | 'pedido_actualizado'
  | 'pedido_atualizado'
  | 'pedido_cancelado'
  | 'pedido_pronto'
  | 'ordem_producao_actualizada'
  | 'ordem_producao_atualizada'
  | 'producao_iniciada'
  | 'producao_concluida'
  | 'alerta_producao'
  | 'stock_baixo'
  | 'stock_critico'
  | 'alerta_stock'
  | 'alerta_material'
  | 'requisicao_criada'
  | 'nova_requisicao'
  | 'requisicao_aprovada'
  | 'requisicao_rejeitada'
  | 'inventario_concluido'
  | 'divergencia_inventario'
  | 'pagamento_recebido'
  | 'caixa_aberto'
  | 'caixa_fechado'
  | 'logistica_ocorrencia'
  | 'novo_evento'
  | 'alerta_evento_proximo'
  | 'alerta_sistema'
  | 'erro_sistema'
  | 'notificacao'
  | 'notification';

export type SoundPreset = 'subtle' | 'chime' | 'alarm' | 'critical' | 'success';

export interface NotificationTypeConfig {
  key: NotificationTypeKey;
  label: string;
  category: 'producao' | 'pedidos' | 'stock' | 'financeiro' | 'requisicoes' | 'eventos' | 'sistema';
  defaultPriority: NotificationPriority;
  iconName: string;
  defaultRoute?: string;
  soundPreset: SoundPreset;
  toastDuration: number; // milliseconds, 0 = persistent
}

export interface NotificationMetadata {
  pedido_id?: number | string;
  numero?: string;
  pedido_numero?: string;
  ordem_id?: number | string;
  ordem_numero?: string;
  sector?: string;
  cliente?: string;
  cliente_nome?: string;
  produtos?: string;
  artigos?: string;
  antigo_estado?: string;
  novo_estado?: string;
  estado_anterior?: string;
  estado_novo?: string;
  total?: number;
  origem?: string;
  target_type?: string;
  target_role?: string | null;
  target_sector?: string | null;
  [key: string]: any;
}

export interface AppNotification {
  id: string;
  event_id?: string;
  event_type?: string;
  entity_type?: string;
  entity_id?: string | number;
  aggregate_id?: string | number;
  actor_user_id?: string | number;
  exclude_actor?: boolean;
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  channels?: NotificationChannel[];
  timestamp: string; // ISO 8601
  read: boolean;
  canal?: string;
  sound?: boolean;
  persistent?: boolean;
  source?: string;
  actionUrl?: string;
  data?: NotificationMetadata;
  metadados?: NotificationMetadata;
}

export const NOTIFICATION_TYPES: Record<string, NotificationTypeConfig> = {
  novo_pedido: {
    key: 'novo_pedido',
    label: 'Novo Pedido',
    category: 'pedidos',
    defaultPriority: 'NORMAL',
    iconName: 'ShoppingCart',
    defaultRoute: '/pedidos',
    soundPreset: 'chime',
    toastDuration: 4500,
  },
  pedido_actualizado: {
    key: 'pedido_actualizado',
    label: 'Pedido Atualizado',
    category: 'pedidos',
    defaultPriority: 'NORMAL',
    iconName: 'RefreshCw',
    defaultRoute: '/pedidos',
    soundPreset: 'subtle',
    toastDuration: 3500,
  },
  pedido_atualizado: {
    key: 'pedido_atualizado',
    label: 'Pedido Atualizado',
    category: 'pedidos',
    defaultPriority: 'NORMAL',
    iconName: 'RefreshCw',
    defaultRoute: '/pedidos',
    soundPreset: 'subtle',
    toastDuration: 3500,
  },
  pedido_cancelado: {
    key: 'pedido_cancelado',
    label: 'Pedido Cancelado',
    category: 'pedidos',
    defaultPriority: 'HIGH',
    iconName: 'AlertTriangle',
    defaultRoute: '/pedidos',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  pedido_pronto: {
    key: 'pedido_pronto',
    label: 'Pedido Pronto',
    category: 'pedidos',
    defaultPriority: 'NORMAL',
    iconName: 'CheckCircle2',
    defaultRoute: '/pedidos',
    soundPreset: 'success',
    toastDuration: 5000,
  },
  nova_ordem_producao: {
    key: 'nova_ordem_producao',
    label: 'Nova Ordem de Produção',
    category: 'producao',
    defaultPriority: 'HIGH',
    iconName: 'ChefHat',
    defaultRoute: '/producao',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  ordem_producao_actualizada: {
    key: 'ordem_producao_actualizada',
    label: 'Ordem de Produção Atualizada',
    category: 'producao',
    defaultPriority: 'NORMAL',
    iconName: 'ClipboardEdit',
    defaultRoute: '/producao',
    soundPreset: 'subtle',
    toastDuration: 3500,
  },
  ordem_producao_atualizada: {
    key: 'ordem_producao_atualizada',
    label: 'Ordem de Produção Atualizada',
    category: 'producao',
    defaultPriority: 'NORMAL',
    iconName: 'ClipboardEdit',
    defaultRoute: '/producao',
    soundPreset: 'subtle',
    toastDuration: 3500,
  },
  producao_iniciada: {
    key: 'producao_iniciada',
    label: 'Produção Iniciada',
    category: 'producao',
    defaultPriority: 'NORMAL',
    iconName: 'PlayCircle',
    defaultRoute: '/producao',
    soundPreset: 'subtle',
    toastDuration: 3500,
  },
  producao_concluida: {
    key: 'producao_concluida',
    label: 'Produção Concluída',
    category: 'producao',
    defaultPriority: 'NORMAL',
    iconName: 'CheckSquare',
    defaultRoute: '/producao',
    soundPreset: 'success',
    toastDuration: 5000,
  },
  alerta_producao: {
    key: 'alerta_producao',
    label: 'Alerta de Produção',
    category: 'producao',
    defaultPriority: 'HIGH',
    iconName: 'AlertOctagon',
    defaultRoute: '/producao',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  stock_baixo: {
    key: 'stock_baixo',
    label: 'Stock Baixo',
    category: 'stock',
    defaultPriority: 'HIGH',
    iconName: 'PackageMinus',
    defaultRoute: '/armazem',
    soundPreset: 'alarm',
    toastDuration: 5000,
  },
  alerta_stock: {
    key: 'alerta_stock',
    label: 'Alerta de Stock',
    category: 'stock',
    defaultPriority: 'HIGH',
    iconName: 'PackageMinus',
    defaultRoute: '/armazem',
    soundPreset: 'alarm',
    toastDuration: 5000,
  },
  stock_critico: {
    key: 'stock_critico',
    label: 'Rutura de Stock',
    category: 'stock',
    defaultPriority: 'CRITICAL',
    iconName: 'AlertOctagon',
    defaultRoute: '/armazem',
    soundPreset: 'critical',
    toastDuration: 0,
  },
  alerta_material: {
    key: 'alerta_material',
    label: 'Alerta de Material',
    category: 'stock',
    defaultPriority: 'HIGH',
    iconName: 'Layers',
    defaultRoute: '/materiais',
    soundPreset: 'alarm',
    toastDuration: 5000,
  },
  requisicao_criada: {
    key: 'requisicao_criada',
    label: 'Nova Requisição',
    category: 'requisicoes',
    defaultPriority: 'NORMAL',
    iconName: 'FileText',
    defaultRoute: '/requisicoes',
    soundPreset: 'chime',
    toastDuration: 4000,
  },
  nova_requisicao: {
    key: 'nova_requisicao',
    label: 'Nova Requisição',
    category: 'requisicoes',
    defaultPriority: 'NORMAL',
    iconName: 'FileText',
    defaultRoute: '/requisicoes',
    soundPreset: 'chime',
    toastDuration: 4000,
  },
  requisicao_aprovada: {
    key: 'requisicao_aprovada',
    label: 'Requisição Aprovada',
    category: 'requisicoes',
    defaultPriority: 'NORMAL',
    iconName: 'CheckCheck',
    defaultRoute: '/requisicoes',
    soundPreset: 'success',
    toastDuration: 4000,
  },
  requisicao_rejeitada: {
    key: 'requisicao_rejeitada',
    label: 'Requisição Rejeitada',
    category: 'requisicoes',
    defaultPriority: 'HIGH',
    iconName: 'XCircle',
    defaultRoute: '/requisicoes',
    soundPreset: 'alarm',
    toastDuration: 5000,
  },
  inventario_concluido: {
    key: 'inventario_concluido',
    label: 'Inventário Concluído',
    category: 'stock',
    defaultPriority: 'NORMAL',
    iconName: 'ClipboardCheck',
    defaultRoute: '/inventario',
    soundPreset: 'success',
    toastDuration: 4500,
  },
  divergencia_inventario: {
    key: 'divergencia_inventario',
    label: 'Divergência de Inventário',
    category: 'stock',
    defaultPriority: 'HIGH',
    iconName: 'Scale',
    defaultRoute: '/inventario',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  pagamento_recebido: {
    key: 'pagamento_recebido',
    label: 'Pagamento Recebido',
    category: 'financeiro',
    defaultPriority: 'NORMAL',
    iconName: 'DollarSign',
    defaultRoute: '/financeiro',
    soundPreset: 'success',
    toastDuration: 4000,
  },
  caixa_aberto: {
    key: 'caixa_aberto',
    label: 'Caixa Aberto',
    category: 'financeiro',
    defaultPriority: 'NORMAL',
    iconName: 'Unlock',
    defaultRoute: '/caixa',
    soundPreset: 'chime',
    toastDuration: 3500,
  },
  caixa_fechado: {
    key: 'caixa_fechado',
    label: 'Caixa Fechado',
    category: 'financeiro',
    defaultPriority: 'HIGH',
    iconName: 'Lock',
    defaultRoute: '/caixa',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  logistica_ocorrencia: {
    key: 'logistica_ocorrencia',
    label: 'Ocorrência Logística',
    category: 'pedidos',
    defaultPriority: 'HIGH',
    iconName: 'Truck',
    defaultRoute: '/logistica',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  novo_evento: {
    key: 'novo_evento',
    label: 'Novo Evento Agendado',
    category: 'eventos',
    defaultPriority: 'NORMAL',
    iconName: 'Calendar',
    defaultRoute: '/eventos',
    soundPreset: 'chime',
    toastDuration: 4500,
  },
  alerta_evento_proximo: {
    key: 'alerta_evento_proximo',
    label: 'Alerta de Evento Próximo',
    category: 'eventos',
    defaultPriority: 'HIGH',
    iconName: 'Clock',
    defaultRoute: '/eventos',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  alerta_sistema: {
    key: 'alerta_sistema',
    label: 'Alerta do Sistema',
    category: 'sistema',
    defaultPriority: 'HIGH',
    iconName: 'Bell',
    defaultRoute: '/notificacoes',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  erro_sistema: {
    key: 'erro_sistema',
    label: 'Erro do Sistema',
    category: 'sistema',
    defaultPriority: 'CRITICAL',
    iconName: 'AlertTriangle',
    defaultRoute: '/notificacoes',
    soundPreset: 'critical',
    toastDuration: 0,
  },
  notificacao: {
    key: 'notificacao',
    label: 'Notificação',
    category: 'sistema',
    defaultPriority: 'NORMAL',
    iconName: 'Bell',
    defaultRoute: '/notificacoes',
    soundPreset: 'chime',
    toastDuration: 4000,
  },
  notification: {
    key: 'notification',
    label: 'Notificação',
    category: 'sistema',
    defaultPriority: 'NORMAL',
    iconName: 'Bell',
    defaultRoute: '/notificacoes',
    soundPreset: 'chime',
    toastDuration: 4000,
  }
};

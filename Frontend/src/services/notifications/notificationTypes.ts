export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

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
  type: string;
  title: string;
  message: string;
  priority: NotificationPriority;
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
    defaultPriority: 'normal',
    iconName: 'ShoppingCart',
    defaultRoute: '/pedidos',
    soundPreset: 'chime',
    toastDuration: 4500,
  },
  pedido_actualizado: {
    key: 'pedido_actualizado',
    label: 'Pedido Atualizado',
    category: 'pedidos',
    defaultPriority: 'normal',
    iconName: 'RefreshCw',
    defaultRoute: '/pedidos',
    soundPreset: 'subtle',
    toastDuration: 3500,
  },
  pedido_atualizado: {
    key: 'pedido_atualizado',
    label: 'Pedido Atualizado',
    category: 'pedidos',
    defaultPriority: 'normal',
    iconName: 'RefreshCw',
    defaultRoute: '/pedidos',
    soundPreset: 'subtle',
    toastDuration: 3500,
  },
  pedido_cancelado: {
    key: 'pedido_cancelado',
    label: 'Pedido Cancelado',
    category: 'pedidos',
    defaultPriority: 'high',
    iconName: 'AlertTriangle',
    defaultRoute: '/pedidos',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  pedido_pronto: {
    key: 'pedido_pronto',
    label: 'Pedido Pronto',
    category: 'pedidos',
    defaultPriority: 'normal',
    iconName: 'CheckCircle2',
    defaultRoute: '/pedidos',
    soundPreset: 'success',
    toastDuration: 5000,
  },
  nova_ordem_producao: {
    key: 'nova_ordem_producao',
    label: 'Nova Ordem de Produção',
    category: 'producao',
    defaultPriority: 'high',
    iconName: 'ChefHat',
    defaultRoute: '/producao',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  ordem_producao_actualizada: {
    key: 'ordem_producao_actualizada',
    label: 'Ordem de Produção Atualizada',
    category: 'producao',
    defaultPriority: 'normal',
    iconName: 'ClipboardEdit',
    defaultRoute: '/producao',
    soundPreset: 'subtle',
    toastDuration: 3500,
  },
  ordem_producao_atualizada: {
    key: 'ordem_producao_atualizada',
    label: 'Ordem de Produção Atualizada',
    category: 'producao',
    defaultPriority: 'normal',
    iconName: 'ClipboardEdit',
    defaultRoute: '/producao',
    soundPreset: 'subtle',
    toastDuration: 3500,
  },
  producao_iniciada: {
    key: 'producao_iniciada',
    label: 'Produção Iniciada',
    category: 'producao',
    defaultPriority: 'normal',
    iconName: 'PlayCircle',
    defaultRoute: '/producao',
    soundPreset: 'subtle',
    toastDuration: 3500,
  },
  producao_concluida: {
    key: 'producao_concluida',
    label: 'Produção Concluída',
    category: 'producao',
    defaultPriority: 'normal',
    iconName: 'CheckCircle',
    defaultRoute: '/producao',
    soundPreset: 'success',
    toastDuration: 5000,
  },
  alerta_producao: {
    key: 'alerta_producao',
    label: 'Alerta de Produção',
    category: 'producao',
    defaultPriority: 'high',
    iconName: 'AlertOctagon',
    defaultRoute: '/producao',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  stock_baixo: {
    key: 'stock_baixo',
    label: 'Stock Baixo',
    category: 'stock',
    defaultPriority: 'high',
    iconName: 'PackageMinus',
    defaultRoute: '/armazem',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  stock_critico: {
    key: 'stock_critico',
    label: 'Stock Crítico',
    category: 'stock',
    defaultPriority: 'critical',
    iconName: 'AlertTriangle',
    defaultRoute: '/armazem',
    soundPreset: 'critical',
    toastDuration: 0, // persistent
  },
  alerta_stock: {
    key: 'alerta_stock',
    label: 'Alerta de Stock',
    category: 'stock',
    defaultPriority: 'high',
    iconName: 'PackageMinus',
    defaultRoute: '/armazem',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  alerta_material: {
    key: 'alerta_material',
    label: 'Alerta de Material',
    category: 'stock',
    defaultPriority: 'high',
    iconName: 'Box',
    defaultRoute: '/materiais',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  requisicao_criada: {
    key: 'requisicao_criada',
    label: 'Requisição Criada',
    category: 'requisicoes',
    defaultPriority: 'normal',
    iconName: 'FileText',
    defaultRoute: '/requisicoes',
    soundPreset: 'chime',
    toastDuration: 4000,
  },
  nova_requisicao: {
    key: 'nova_requisicao',
    label: 'Nova Requisição',
    category: 'requisicoes',
    defaultPriority: 'normal',
    iconName: 'FileText',
    defaultRoute: '/requisicoes',
    soundPreset: 'chime',
    toastDuration: 4000,
  },
  requisicao_aprovada: {
    key: 'requisicao_aprovada',
    label: 'Requisição Aprovada',
    category: 'requisicoes',
    defaultPriority: 'normal',
    iconName: 'CheckSquare',
    defaultRoute: '/requisicoes',
    soundPreset: 'success',
    toastDuration: 4500,
  },
  requisicao_rejeitada: {
    key: 'requisicao_rejeitada',
    label: 'Requisição Rejeitada',
    category: 'requisicoes',
    defaultPriority: 'high',
    iconName: 'XCircle',
    defaultRoute: '/requisicoes',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  inventario_concluido: {
    key: 'inventario_concluido',
    label: 'Inventário Concluído',
    category: 'stock',
    defaultPriority: 'normal',
    iconName: 'ClipboardCheck',
    defaultRoute: '/armazem',
    soundPreset: 'success',
    toastDuration: 5000,
  },
  divergencia_inventario: {
    key: 'divergencia_inventario',
    label: 'Divergência de Inventário',
    category: 'stock',
    defaultPriority: 'critical',
    iconName: 'AlertCircle',
    defaultRoute: '/armazem',
    soundPreset: 'critical',
    toastDuration: 0,
  },
  pagamento_recebido: {
    key: 'pagamento_recebido',
    label: 'Pagamento Recebido',
    category: 'financeiro',
    defaultPriority: 'normal',
    iconName: 'Wallet',
    defaultRoute: '/financeiro',
    soundPreset: 'success',
    toastDuration: 4500,
  },
  caixa_aberto: {
    key: 'caixa_aberto',
    label: 'Abertura de Caixa',
    category: 'financeiro',
    defaultPriority: 'normal',
    iconName: 'Unlock',
    defaultRoute: '/caixa',
    soundPreset: 'chime',
    toastDuration: 4000,
  },
  caixa_fechado: {
    key: 'caixa_fechado',
    label: 'Fecho de Caixa',
    category: 'financeiro',
    defaultPriority: 'high',
    iconName: 'Lock',
    defaultRoute: '/caixa',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  logistica_ocorrencia: {
    key: 'logistica_ocorrencia',
    label: 'Ocorrência Logística',
    category: 'pedidos',
    defaultPriority: 'high',
    iconName: 'Truck',
    defaultRoute: '/logistica',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  novo_evento: {
    key: 'novo_evento',
    label: 'Novo Evento Agendado',
    category: 'eventos',
    defaultPriority: 'normal',
    iconName: 'Calendar',
    defaultRoute: '/eventos',
    soundPreset: 'chime',
    toastDuration: 4500,
  },
  alerta_evento_proximo: {
    key: 'alerta_evento_proximo',
    label: 'Alerta de Evento Próximo',
    category: 'eventos',
    defaultPriority: 'high',
    iconName: 'Clock',
    defaultRoute: '/eventos',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  alerta_sistema: {
    key: 'alerta_sistema',
    label: 'Alerta do Sistema',
    category: 'sistema',
    defaultPriority: 'high',
    iconName: 'Bell',
    defaultRoute: '/notificacoes',
    soundPreset: 'alarm',
    toastDuration: 6000,
  },
  erro_sistema: {
    key: 'erro_sistema',
    label: 'Erro do Sistema',
    category: 'sistema',
    defaultPriority: 'critical',
    iconName: 'AlertTriangle',
    defaultRoute: '/notificacoes',
    soundPreset: 'critical',
    toastDuration: 0,
  },
  notificacao: {
    key: 'notificacao',
    label: 'Notificação',
    category: 'sistema',
    defaultPriority: 'normal',
    iconName: 'Bell',
    defaultRoute: '/notificacoes',
    soundPreset: 'chime',
    toastDuration: 4000,
  },
  notification: {
    key: 'notification',
    label: 'Notificação',
    category: 'sistema',
    defaultPriority: 'normal',
    iconName: 'Bell',
    defaultRoute: '/notificacoes',
    soundPreset: 'chime',
    toastDuration: 4000,
  }
};

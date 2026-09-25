export const SOCKET_CHANNELS = {
  NOTIFICACAO: 'notificacao',
  NOTIFICATION: 'notification',
} as const;

export const DOMAIN_SYNC_EVENTS = {
  // Pedidos
  NOVO_PEDIDO: 'novo_pedido',
  PEDIDO_ATUALIZADO: 'pedido_atualizado',
  PEDIDO_ACTUALIZADO: 'pedido_actualizado',
  PEDIDO_CANCELADO: 'pedido_cancelado',
  PEDIDO_PRONTO: 'pedido_pronto',

  // Produção
  NOVA_ORDEM_PRODUCAO: 'nova_ordem_producao',
  ORDEM_PRODUCAO_ATUALIZADA: 'ordem_producao_atualizada',
  ORDEM_PRODUCAO_ACTUALIZADA: 'ordem_producao_actualizada',
  PRODUCAO_INICIADA: 'producao_iniciada',
  PRODUCAO_CONCLUIDA: 'producao_concluida',
  ALERTA_PRODUCAO: 'alerta_producao',

  // Stock e Inventário
  STOCK_ATUALIZADO: 'stock_atualizado',
  STOCK_BAIXO: 'stock_baixo',
  STOCK_CRITICO: 'stock_critico',
  ALERTA_STOCK: 'alerta_stock',
  ALERTA_MATERIAL: 'alerta_material',
  INVENTARIO_CONCLUIDO: 'inventario_concluido',
  DIVERGENCIA_INVENTARIO: 'divergencia_inventario',

  // Requisições
  REQUISICAO_CRIADA: 'requisicao_criada',
  NOVA_REQUISICAO: 'nova_requisicao',
  REQUISICAO_ATUALIZADA: 'requisicao_atualizada',
  REQUISICAO_APROVADA: 'requisicao_aprovada',
  REQUISICAO_REJEITADA: 'requisicao_rejeitada',

  // Caixa e Financeiro
  CAIXA_ABERTO: 'caixa_aberto',
  CAIXA_FECHADO: 'caixa_fechado',
  PAGAMENTO_RECEBIDO: 'pagamento_recebido',

  // Logística e Eventos
  LOGISTICA_OCORRENCIA: 'logistica_ocorrencia',
  NOVO_EVENTO: 'novo_evento',
  ALERTA_EVENTO_PROXIMO: 'alerta_evento_proximo',

  // Sistema
  ALERTA_SISTEMA: 'alerta_sistema',
  ERRO_SISTEMA: 'erro_sistema',
  PING_SERVER: 'ping_server',
} as const;

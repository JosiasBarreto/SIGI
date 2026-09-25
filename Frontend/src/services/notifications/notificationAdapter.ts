import { AppNotification, NOTIFICATION_TYPES, NotificationPriority, NotificationMetadata, NotificationChannel } from './notificationTypes';

/**
 * Adaptador para normalizar eventos brutos vindos do backend (WebSocket / REST API)
 * para o modelo canónico AppNotification segundo o contrato unificado de notificações.
 */
export class NotificationAdapter {
  /**
   * Converte um evento do Socket.IO ou payload da API para o modelo canónico AppNotification
   */
  public static fromBackendEvent(eventName: string, payload: any): AppNotification {
    const raw = payload && typeof payload === 'object' ? payload : { raw: payload };
    const normalizedType = this.resolveType(eventName, raw);
    const config = NOTIFICATION_TYPES[normalizedType] || NOTIFICATION_TYPES['notificacao'];

    // 1. Extrair data ou metadados incorporados
    const metadata: NotificationMetadata = {
      ...(typeof raw.data === 'object' ? raw.data : {}),
      ...(typeof raw.metadados === 'object' ? raw.metadados : {}),
      ...(raw.pedido_id !== undefined ? { pedido_id: raw.pedido_id } : {}),
      ...(raw.ordem_id !== undefined ? { ordem_id: raw.ordem_id } : {}),
      ...(raw.numero ? { numero: raw.numero } : {}),
      ...(raw.pedido_numero ? { pedido_numero: raw.pedido_numero } : {}),
      ...(raw.ordem_numero ? { ordem_numero: raw.ordem_numero } : {}),
      ...(raw.sector ? { sector: raw.sector } : {}),
      ...(raw.cliente || raw.cliente_nome ? { cliente: raw.cliente || raw.cliente_nome } : {}),
      ...(raw.produtos || raw.artigos ? { produtos: raw.produtos || raw.artigos } : {}),
      ...(raw.antigo_estado || raw.estado_anterior ? { antigo_estado: raw.antigo_estado || raw.estado_anterior } : {}),
      ...(raw.novo_estado || raw.estado_novo || raw.estado ? { novo_estado: raw.novo_estado || raw.estado_novo || raw.estado } : {}),
      ...(raw.origem ? { origem: raw.origem } : {}),
    };

    // 2. Extrair identificadores contratuais do evento
    const primaryDbId = (raw.id !== undefined && raw.id !== null && raw.id !== '') ? String(raw.id) : undefined;
    const eventId = raw.event_id || raw.eventId || primaryDbId;
    const id = primaryDbId || eventId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const eventType = raw.event_type || raw.eventType || raw.tipo || normalizedType;
    const entityType = raw.entity_type || raw.entityType || raw.canal || this.resolveCanal(raw, eventName, normalizedType);
    const entityId = raw.entity_id || raw.entityId || metadata.pedido_id || metadata.ordem_id || raw.id;
    const aggregateId = raw.aggregate_id || raw.aggregateId || (entityType && entityId ? `${entityType}:${entityId}` : undefined);
    const actorUserId = raw.actor_user_id || raw.actorUserId || raw.actor_id || raw.actorId;
    const excludeActor = raw.exclude_actor !== undefined ? Boolean(raw.exclude_actor) : Boolean(raw.excludeActor);

    // 3. Determinar canais
    const channels: NotificationChannel[] = Array.isArray(raw.channels)
      ? raw.channels
      : (Array.isArray(raw.notification?.channels) ? raw.notification.channels : []);

    // 4. Determinar canal
    const canal = this.resolveCanal(raw, eventName, normalizedType);

    // 5. Determinar prioridade
    const priority = this.resolvePriority(raw, config.defaultPriority);

    // 6. Determinar título
    const title = this.resolveTitle(raw, metadata, config.label, eventName);

    // 7. Determinar mensagem estruturada
    const message = this.resolveMessage(raw, metadata, title, eventName);

    // 8. Determinar rota de acção
    const actionUrl = this.resolveActionUrl(raw, metadata, config.defaultRoute);

    // 9. Timestamp
    const timestamp = raw.timestamp || raw.created_at || raw.data_criacao || new Date().toISOString();

    return {
      id,
      event_id: eventId,
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      aggregate_id: aggregateId,
      actor_user_id: actorUserId,
      exclude_actor: excludeActor,
      type: normalizedType,
      title,
      message,
      priority,
      channels,
      timestamp,
      canal,
      read: Boolean(raw.read || raw.lida || false),
      sound: raw.sound !== false && raw.notification?.sound !== false,
      persistent: priority === 'CRITICAL' || Boolean(raw.persistent || raw.persistente),
      source: raw.source || raw.origem || metadata.origem || eventName,
      actionUrl,
      data: metadata,
      metadados: metadata,
    };
  }

  private static resolveCanal(raw: any, eventName: string, type: string): string {
    if (raw.canal) return String(raw.canal).toUpperCase();
    if (raw.channel) return String(raw.channel).toUpperCase();
    if (type.startsWith('pedido') || eventName.startsWith('pedido') || raw.data?.pedido_id) return 'PEDIDO';
    if (type.includes('producao') || eventName.includes('producao') || raw.data?.ordem_id) return 'PRODUCAO';
    if (type.includes('stock') || type.includes('inventario') || eventName.includes('stock')) return 'STOCK';
    if (type.includes('requisicao') || eventName.includes('requisicao')) return 'REQUISICAO';
    if (type.includes('caixa') || type.includes('pagamento')) return 'CAIXA';
    if (type.includes('evento')) return 'EVENTOS';
    return 'SISTEMA';
  }

  private static resolveType(eventName: string, raw: any): string {
    if (raw.type && NOTIFICATION_TYPES[raw.type]) return raw.type;
    if (raw.tipo && NOTIFICATION_TYPES[raw.tipo]) return raw.tipo;
    if (NOTIFICATION_TYPES[eventName]) return eventName;

    const lower = eventName.toLowerCase().replace(/[\s-]/g, '_');
    if (NOTIFICATION_TYPES[lower]) return lower;
    if (lower === 'pedido_actualizado') return 'pedido_atualizado';
    if (lower === 'ordem_producao_actualizada') return 'ordem_producao_atualizada';
    if (lower === 'alerta_material') return 'alerta_stock';
    if (lower === 'nova_requisicao') return 'requisicao_criada';

    return 'notificacao';
  }

  private static resolvePriority(raw: any, defaultPriority: NotificationPriority): NotificationPriority {
    const p = String(raw.priority || raw.prioridade || raw.notification?.priority || raw.tipo || '').toUpperCase();
    if (p === 'CRITICAL' || p === 'CRITICA' || p === 'CRÍTICA' || p === 'ERROR' || p === 'DANGER') return 'CRITICAL';
    if (p === 'HIGH' || p === 'ALTA' || p === 'ALTO' || p === 'WARNING') return 'HIGH';
    if (p === 'LOW' || p === 'BAIXA' || p === 'BAIXO') return 'LOW';
    if (p === 'NORMAL' || p === 'MEDIA' || p === 'MÉDIO' || p === 'INFO' || p === 'SUCCESS') return 'NORMAL';

    return defaultPriority;
  }

  private static resolveTitle(raw: any, meta: NotificationMetadata, defaultLabel: string, eventName: string): string {
    if (raw.notification?.title) return String(raw.notification.title);
    if (raw.titulo) return String(raw.titulo);
    if (raw.title) return String(raw.title);

    // Formatação padronizada para Pedidos
    if (eventName === 'novo_pedido' || raw.origem === 'novo_pedido') {
      const ref = meta.numero ? (meta.numero.startsWith('#') ? meta.numero : `#${meta.numero}`) : '#PED-NOVO';
      return `Pedido ${ref}: Registado`;
    }

    if (
      eventName === 'pedido_actualizado' ||
      eventName === 'pedido_atualizado' ||
      eventName === 'pedido_pronto' ||
      eventName === 'pedido_cancelado' ||
      meta.pedido_id ||
      (meta.numero && meta.numero.includes('PED'))
    ) {
      const ref = meta.numero ? (meta.numero.startsWith('#') ? meta.numero : `#${meta.numero}`) : `#PED-${meta.pedido_id || ''}`;
      const estado = meta.novo_estado || (eventName === 'pedido_pronto' ? 'Pronto para Levantamento' : eventName === 'pedido_cancelado' ? 'Cancelado' : 'Atualizado');
      return `Pedido ${ref}: ${estado}`;
    }

    // Formatação padronizada para Ordens de Produção
    if (
      eventName === 'nova_ordem_producao' ||
      eventName === 'ordem_producao_actualizada' ||
      eventName === 'ordem_producao_atualizada' ||
      eventName === 'producao_iniciada' ||
      eventName === 'producao_concluida' ||
      meta.ordem_id ||
      meta.ordem_numero
    ) {
      const setor = meta.sector ? ` (${meta.sector})` : '';
      const ref = meta.ordem_numero
        ? (meta.ordem_numero.startsWith('#') ? meta.ordem_numero : `#${meta.ordem_numero}`)
        : (meta.numero ? (meta.numero.startsWith('#') ? meta.numero : `#${meta.numero}`) : `#OP-${meta.ordem_id || ''}`);
      const estado = meta.novo_estado || (eventName === 'producao_concluida' ? 'Concluída' : eventName === 'producao_iniciada' ? 'Em Produção' : 'Atualizada');
      return `Produção${setor} ${ref}: ${estado}`;
    }

    switch (eventName) {
      case 'alerta_producao':
        return 'Alerta na Linha de Produção';
      case 'stock_baixo':
      case 'alerta_stock':
        return 'Alerta de Stock Baixo';
      case 'stock_critico':
        return 'RUTURA DE STOCK CRÍTICO';
      case 'alerta_material':
        return 'Alerta de Material / Stock';
      case 'requisicao_criada':
      case 'nova_requisicao':
        return 'Nova Requisição de Material';
      case 'requisicao_aprovada':
        return 'Requisição Aprovada';
      case 'requisicao_rejeitada':
        return 'Requisição Rejeitada';
      case 'inventario_concluido':
        return 'Inventário Concluído';
      case 'divergencia_inventario':
        return 'Divergência de Inventário Detetada';
      case 'pagamento_recebido':
        return 'Pagamento Recebido';
      case 'caixa_aberto':
        return 'Caixa Aberto';
      case 'caixa_fechado':
        return 'Fecho de Sessão de Caixa';
      case 'logistica_ocorrencia':
        return 'Ocorrência Logística';
      case 'novo_evento':
        return 'Novo Evento Agendado';
      case 'alerta_evento_proximo':
        return 'Alerta de Evento Próximo';
      case 'alerta_sistema':
        return 'Aviso do Sistema';
      case 'erro_sistema':
        return 'Erro do Sistema';
      default:
        return defaultLabel;
    }
  }

  private static resolveMessage(raw: any, meta: NotificationMetadata, title: string, eventName: string): string {
    if (raw.notification?.message) return String(raw.notification.message);
    if (raw.mensagem) return String(raw.mensagem);
    if (raw.message) return String(raw.message);
    if (raw.msg) return String(raw.msg);

    // 1. Mensagens para Pedidos
    if (
      eventName === 'novo_pedido' ||
      eventName === 'pedido_actualizado' ||
      eventName === 'pedido_atualizado' ||
      eventName === 'pedido_pronto' ||
      eventName === 'pedido_cancelado' ||
      meta.pedido_id ||
      (meta.numero && meta.numero.includes('PED'))
    ) {
      const ref = meta.numero ? (meta.numero.startsWith('#') ? meta.numero : `#${meta.numero}`) : `#PED-${meta.pedido_id || ''}`;
      const cliente = meta.cliente || meta.cliente_nome || 'Consumidor Final';
      const produtos = meta.produtos || meta.artigos || '';
      const novoEst = meta.novo_estado || meta.estado_novo || (eventName === 'pedido_pronto' ? 'PRONTO' : eventName === 'pedido_cancelado' ? 'CANCELADO' : 'REGISTADO');
      const antigoEst = meta.antigo_estado || meta.estado_anterior || '';

      const lines: string[] = [];
      if (antigoEst && novoEst) {
        lines.push(`O estado do Pedido ${ref} foi alterado para '${novoEst}'.`);
      } else {
        lines.push(`O Pedido ${ref} encontra-se no estado '${novoEst}'.`);
      }

      lines.push(`• Cliente: ${cliente}`);
      if (produtos) {
        lines.push(`• Produtos: ${produtos}`);
      }
      if (antigoEst && novoEst) {
        lines.push(`• Transição: ${antigoEst} ➔ ${novoEst}`);
      }

      return lines.join('\n');
    }

    // 2. Mensagens para Ordens de Produção
    if (
      eventName === 'nova_ordem_producao' ||
      eventName === 'ordem_producao_actualizada' ||
      eventName === 'ordem_producao_atualizada' ||
      eventName === 'producao_iniciada' ||
      eventName === 'producao_concluida' ||
      meta.ordem_id ||
      meta.ordem_numero
    ) {
      const ref = meta.ordem_numero
        ? (meta.ordem_numero.startsWith('#') ? meta.ordem_numero : `#${meta.ordem_numero}`)
        : (meta.numero ? (meta.numero.startsWith('#') ? meta.numero : `#${meta.numero}`) : `#OP-${meta.ordem_id || ''}`);
      const setorStr = meta.sector ? ` (${meta.sector})` : '';
      const cliente = meta.cliente || meta.cliente_nome || '';
      const produtos = meta.produtos || meta.artigos || '';
      const pedRef = meta.pedido_numero ? (meta.pedido_numero.startsWith('#') ? meta.pedido_numero : `#${meta.pedido_numero}`) : '';
      const novoEst = meta.novo_estado || meta.estado_novo || (eventName === 'producao_concluida' ? 'PRONTO' : 'EM_PRODUCAO');
      const antigoEst = meta.antigo_estado || meta.estado_anterior || '';

      const lines: string[] = [];
      lines.push(`A ordem de produção ${ref}${setorStr} passou para '${novoEst}'.`);
      if (pedRef) {
        lines.push(`• Pedido: ${pedRef}`);
      }
      if (cliente) {
        lines.push(`• Cliente: ${cliente}`);
      }
      if (produtos) {
        lines.push(`• Artigos: ${produtos}`);
      }
      if (antigoEst && novoEst) {
        lines.push(`• Transição: ${antigoEst} ➔ ${novoEst}`);
      }

      return lines.join('\n');
    }

    // 3. Outros eventos
    switch (eventName) {
      case 'stock_baixo':
      case 'alerta_stock': {
        const item = raw.ingrediente || raw.material || raw.produto || raw.nome || '';
        const qtd = raw.quantidade_atual !== undefined ? ` (Restam: ${raw.quantidade_atual})` : '';
        return item ? `O artigo "${item}" está abaixo do limite de segurança${qtd}.` : 'Existem artigos com stock abaixo do nível mínimo.';
      }
      case 'stock_critico': {
        const item = raw.ingrediente || raw.material || raw.produto || raw.nome || '';
        return item ? `Artigo "${item}" atingiu nível crítico ou rutura!` : 'Artigo em estado de rutura!';
      }
      case 'caixa_fechado': {
        const caixaId = raw.caixa_id || raw.id || '';
        const operador = raw.operador ? ` por ${raw.operador}` : '';
        return caixaId ? `Caixa #${caixaId} foi encerrado${operador}.` : 'Uma sessão de caixa foi encerrada.';
      }
      case 'caixa_aberto': {
        const operador = raw.operador ? ` por ${raw.operador}` : '';
        return `Uma nova sessão de caixa foi iniciada${operador}.`;
      }
      case 'requisicao_criada':
      case 'nova_requisicao': {
        const cod = raw.codigo || raw.id || '';
        const setor = raw.setor_origem || raw.setor ? ` pelo setor ${raw.setor_origem || raw.setor}` : '';
        return cod ? `Requisição ${cod} emitida${setor}.` : 'Nova requisição de material solicitada.';
      }
      case 'requisicao_aprovada': {
        const cod = raw.codigo || raw.id || '';
        return cod ? `Requisição de material ${cod} foi aprovada pelo armazém.` : 'Requisição de material aprovada.';
      }
      case 'requisicao_rejeitada': {
        const cod = raw.codigo || raw.id || '';
        const motivo = raw.motivo ? ` Motivo: ${raw.motivo}` : '';
        return cod ? `Requisição ${cod} foi rejeitada.${motivo}` : 'Requisição de material rejeitada.';
      }
      case 'pagamento_recebido': {
        const ref = raw.referencia || raw.recibo || '';
        return `Recebimento confirmado (${ref || 'comercial'}).`;
      }
      default:
        return title;
    }
  }

  private static resolveActionUrl(raw: any, meta: NotificationMetadata, defaultRoute?: string): string | undefined {
    if (raw.actionUrl || raw.url || raw.link) {
      return raw.actionUrl || raw.url || raw.link;
    }
    if (meta.ordem_id || meta.ordem_numero || (meta.origem && meta.origem.includes('producao'))) {
      return '/producao';
    }
    if (meta.pedido_id || (meta.numero && meta.numero.includes('PED'))) {
      return '/pedidos';
    }
    return defaultRoute;
  }
}

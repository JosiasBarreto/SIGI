import { AppNotification, NOTIFICATION_TYPES, NotificationPriority } from './notificationTypes';

/**
 * Adaptador para normalizar eventos brutos vindos do backend ou de acções locais
 * para o modelo único de dados AppNotification.
 */
export class NotificationAdapter {
  /**
   * Converte um evento do Socket.IO ou payload da API para o modelo canónico AppNotification
   */
  public static fromBackendEvent(eventName: string, payload: any): AppNotification {
    const raw = payload && typeof payload === 'object' ? payload : { raw: payload };
    const normalizedType = this.resolveType(eventName, raw);
    const config = NOTIFICATION_TYPES[normalizedType] || NOTIFICATION_TYPES['notificacao'];

    // Determinar o ID
    const id = raw.id 
      ? String(raw.id) 
      : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Determinar prioridade
    const priority = this.resolvePriority(raw, config.defaultPriority);

    // Determinar título
    const title = this.resolveTitle(raw, config.label, eventName);

    // Determinar mensagem
    const message = this.resolveMessage(raw, title, eventName);

    // Determinar rota de acção
    const actionUrl = this.resolveActionUrl(raw, config.defaultRoute);

    // Timestamp
    const timestamp = raw.timestamp || raw.data_criacao || raw.created_at || new Date().toISOString();

    return {
      id,
      type: normalizedType,
      title,
      message,
      priority,
      timestamp,
      read: Boolean(raw.read || raw.lida || false),
      sound: raw.sound !== false,
      persistent: priority === 'critical' || Boolean(raw.persistent),
      source: raw.source || raw.origem || eventName,
      actionUrl,
      data: raw.data || raw,
    };
  }

  private static resolveType(eventName: string, raw: any): string {
    if (raw.type && NOTIFICATION_TYPES[raw.type]) return raw.type;
    if (raw.tipo && NOTIFICATION_TYPES[raw.tipo]) return raw.tipo;
    if (NOTIFICATION_TYPES[eventName]) return eventName;

    // Normalizações de variações comuns
    const lower = eventName.toLowerCase().replace(/[\s-]/g, '_');
    if (NOTIFICATION_TYPES[lower]) return lower;
    if (lower === 'pedido_atualizado') return 'pedido_actualizado';
    if (lower === 'ordem_producao_atualizada') return 'ordem_producao_actualizada';
    if (lower === 'alerta_material') return 'alerta_stock';
    if (lower === 'nova_requisicao') return 'requisicao_criada';

    return 'notificacao';
  }

  private static resolvePriority(raw: any, defaultPriority: NotificationPriority): NotificationPriority {
    const p = String(raw.priority || raw.prioridade || raw.tipo || '').toLowerCase();
    if (p === 'critical' || p === 'critica' || p === 'crítica') return 'critical';
    if (p === 'high' || p === 'alta' || p === 'alto') return 'high';
    if (p === 'normal' || p === 'media' || p === 'médio' || p === 'medio') return 'normal';
    if (p === 'low' || p === 'baixa' || p === 'baixo') return 'low';

    // Mapear se vier em formato tipo erro/warning/info
    if (p === 'error' || p === 'danger') return 'high';
    if (p === 'warning') return 'high';
    if (p === 'info' || p === 'success') return 'normal';

    return defaultPriority;
  }

  private static resolveTitle(raw: any, defaultLabel: string, eventName: string): string {
    if (raw.titulo) return String(raw.titulo);
    if (raw.title) return String(raw.title);

    switch (eventName) {
      case 'novo_pedido':
        return 'Novo Pedido Recebido';
      case 'nova_ordem_producao':
        return raw.sector ? `Nova Ordem (${raw.sector})` : 'Nova Ordem de Produção';
      case 'pedido_actualizado':
      case 'pedido_atualizado':
        return 'Pedido Atualizado';
      case 'pedido_cancelado':
        return 'Pedido Cancelado';
      case 'pedido_pronto':
        return 'Pedido Pronto para Entrega';
      case 'ordem_producao_actualizada':
      case 'ordem_producao_atualizada':
        return 'Ordem de Produção Atualizada';
      case 'producao_iniciada':
        return 'Produção Iniciada';
      case 'producao_concluida':
        return 'Produção Concluída';
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

  private static resolveMessage(raw: any, title: string, eventName: string): string {
    if (raw.mensagem) return String(raw.mensagem);
    if (raw.message) return String(raw.message);
    if (raw.msg) return String(raw.msg);

    // Gerar mensagens ricas a partir dos campos do payload
    switch (eventName) {
      case 'novo_pedido': {
        const num = raw.numero || raw.pedido_id || raw.id || '';
        const total = typeof raw.total === 'number' ? ` no valor de ${raw.total.toFixed(2)} STN` : '';
        const cliente = raw.cliente ? ` pelo cliente ${raw.cliente}` : '';
        return num ? `Pedido #${num} registado${total}${cliente}.` : 'Novo pedido registado no sistema comercial.';
      }
      case 'nova_ordem_producao': {
        const num = raw.numero || raw.ordem_id || raw.id || '';
        const produto = raw.produto_nome || raw.produto || raw.nome || '';
        const sector = raw.sector ? ` em ${raw.sector}` : '';
        const qtd = raw.quantidade ? ` (${raw.quantidade} un)` : '';
        return num ? `OP #${num}${sector}: ${produto || 'Produção requerida'}${qtd}` : 'Nova ordem enviada para confecção.';
      }
      case 'pedido_actualizado':
      case 'pedido_atualizado': {
        const num = raw.numero || raw.id || '';
        const estado = raw.estado || raw.status || '';
        return num && estado ? `O pedido #${num} mudou para o estado: ${estado}.` : 'O estado do pedido foi alterado.';
      }
      case 'pedido_cancelado': {
        const num = raw.numero || raw.id || '';
        const motivo = raw.motivo || raw.justificativa || '';
        return num ? `Pedido #${num} foi cancelado.${motivo ? ` Motivo: ${motivo}` : ''}` : 'Um pedido foi cancelado no sistema.';
      }
      case 'pedido_pronto': {
        const num = raw.numero || raw.id || '';
        const cliente = raw.cliente ? ` para ${raw.cliente}` : '';
        return num ? `Pedido #${num}${cliente} está finalizado e pronto para levantamento/entrega!` : 'Pedido finalizado!';
      }
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
        const valor = typeof raw.valor_final === 'number' ? ` com saldo final de ${raw.valor_final.toFixed(2)} STN` : '';
        return caixaId ? `Caixa #${caixaId} foi encerrado${operador}${valor}.` : 'Uma sessão de caixa foi encerrada.';
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
        const val = typeof raw.valor === 'number' ? `${raw.valor.toFixed(2)} STN` : '';
        const ref = raw.referencia || raw.recibo || '';
        return val ? `Recebimento de ${val} confirmado (${ref || 'comercial'}).` : 'Novo pagamento processado com sucesso.';
      }
      default:
        return title;
    }
  }

  private static resolveActionUrl(raw: any, defaultRoute?: string): string | undefined {
    if (raw.actionUrl || raw.url || raw.link) {
      return raw.actionUrl || raw.url || raw.link;
    }
    return defaultRoute;
  }
}

import apiClient from '../../api/client';
import { NotificationAdapter } from './notificationAdapter';
import { AppNotification } from './notificationTypes';

export interface EstatisticasNotificacoes {
  notificacoes: {
    total_ativas: number;
    nao_lidas: number;
    persistentes_ativas: number;
    por_canal: {
      PEDIDO: number;
      PRODUCAO: number;
      STOCK: number;
      FINANCEIRO: number;
      SISTEMA: number;
      REQUISICAO?: number;
      EVENTOS?: number;
    };
  };
  comunicacoes_sms: {
    total_enviadas: number;
    confirmadas_lidas: number;
    falhas: number;
    enviadas_hoje: number;
    taxa_leitura_percent: number;
  };
}

export interface UsuarioLeitura {
  user_id: number | string;
  nome: string;
  role: string;
  lido_em?: string;
}

export interface AuditoriaLeitura {
  lidos: UsuarioLeitura[];
  nao_lidos: UsuarioLeitura[];
}

export interface CriarNotificacaoPayload {
  titulo: string;
  mensagem: string;
  tipo?: 'info' | 'success' | 'warning' | 'error';
  canal?: 'PEDIDO' | 'PRODUCAO' | 'STOCK' | 'FINANCEIRO' | 'SISTEMA' | 'REQUISICAO' | 'EVENTOS';
  prioridade?: 'baixa' | 'media' | 'alta' | 'urgente';
  target_type?: 'GLOBAL' | 'SETOR' | 'ROLE';
  target_role?: string;
  target_sector?: string;
  persistente?: boolean;
  actionUrl?: string;
}

class NotificationAuditService {
  /**
   * Obtém as estatísticas e métricas de notificações e comunicações
   */
  public async getEstatisticas(currentNotifications: AppNotification[] = []): Promise<EstatisticasNotificacoes> {
    try {
      const response = await apiClient.get<any, any>('/v1/notificacoes/estatisticas');
      if (response && (response.data || response.notificacoes)) {
        return response.data || response;
      }
    } catch (err) {
      try {
        const response2 = await apiClient.get<any, any>('/notificacoes/estatisticas');
        if (response2 && (response2.data || response2.notificacoes)) {
          return response2.data || response2;
        }
      } catch (err2) {
        // Fallback resiliente usando as notificações locais e registos do ERP
      }
    }

    // Cálculo dinâmico em tempo real
    const total = currentNotifications.length;
    const naoLidas = currentNotifications.filter((n) => !n.read).length;
    const persistentes = currentNotifications.filter((n) => n.persistent || n.priority === 'CRITICAL' || n.priority === 'critical').length;

    const porCanal = {
      PEDIDO: currentNotifications.filter((n) => (n.canal || '').toUpperCase() === 'PEDIDO' || n.type.includes('pedido')).length,
      PRODUCAO: currentNotifications.filter((n) => (n.canal || '').toUpperCase() === 'PRODUCAO' || n.type.includes('producao')).length,
      STOCK: currentNotifications.filter((n) => (n.canal || '').toUpperCase() === 'STOCK' || n.type.includes('stock')).length,
      FINANCEIRO: currentNotifications.filter((n) => (n.canal || '').toUpperCase() === 'CAIXA' || (n.canal || '').toUpperCase() === 'FINANCEIRO' || n.type.includes('caixa') || n.type.includes('pagamento')).length,
      SISTEMA: currentNotifications.filter((n) => (n.canal || '').toUpperCase() === 'SISTEMA' || n.type.includes('notificacao')).length,
      REQUISICAO: currentNotifications.filter((n) => (n.canal || '').toUpperCase() === 'REQUISICAO' || n.type.includes('requisicao')).length,
      EVENTOS: currentNotifications.filter((n) => (n.canal || '').toUpperCase() === 'EVENTOS' || n.type.includes('evento')).length,
    };

    // Estatísticas de comunicações SMS / WhatsApp aos clientes
    const storedLogsStr = localStorage.getItem('sigi_external_notification_logs') || '[]';
    let smsLogs: any[] = [];
    try {
      smsLogs = JSON.parse(storedLogsStr);
    } catch {}

    const totalSms = smsLogs.length;
    const confirmadasSms = smsLogs.filter((l) => l.status === 'sent' || l.status === 'delivered').length;
    const falhasSms = smsLogs.filter((l) => l.status === 'failed').length;
    const hojeIso = new Date().toISOString().split('T')[0];
    const enviadasHoje = smsLogs.filter((l) => (l.timestamp || '').startsWith(hojeIso)).length;
    const taxaLeitura = totalSms > 0 ? Number(((confirmadasSms / totalSms) * 100).toFixed(1)) : 0;

    return {
      notificacoes: {
        total_ativas: total,
        nao_lidas: naoLidas,
        persistentes_ativas: persistentes,
        por_canal: porCanal,
      },
      comunicacoes_sms: {
        total_enviadas: totalSms,
        confirmadas_lidas: confirmadasSms,
        falhas: falhasSms,
        enviadas_hoje: enviadasHoje,
        taxa_leitura_percent: taxaLeitura,
      },
    };
  }

  /**
   * Carrega a lista histórica de notificações do Backend (API REST)
   */
  public async getHistorico(params?: {
    canal?: string;
    lida?: boolean;
    busca?: string;
    page?: number;
    per_page?: number;
  }): Promise<AppNotification[]> {
    let response: any;
    try {
      response = await apiClient.get<any, any>('/v1/notificacoes', { params: { per_page: 100, ...params } });
    } catch (err) {
      try {
        response = await apiClient.get<any, any>('/notificacoes', { params: { per_page: 100, ...params } });
      } catch {
        throw err;
      }
    }

    const rawList = Array.isArray(response)
      ? response
      : (response?.notificacoes || response?.data?.notificacoes || response?.data?.items || response?.items || []);
    if (!Array.isArray(rawList)) {
      throw new Error('A API de notificações devolveu uma resposta inválida.');
    }
    return rawList.map((item: any) =>
      NotificationAdapter.fromBackendEvent(item.tipo || item.event_type || 'notificacao', item)
    );
  }

  /**
   * Obtém a auditoria "Quem Viu vs Quem Não Viu" para uma notificação específica
   */
  public async getAuditoriaLeituras(
    notificacaoId: string | number,
    notificacao?: AppNotification
  ): Promise<AuditoriaLeitura> {
    const targetId = String(notificacaoId || notificacao?.id || notificacao?.event_id);
    const encodedId = encodeURIComponent(targetId);

    try {
      const response = await apiClient.get<any, any>(`/v1/notificacoes/${encodedId}/leituras`);
      const payload = response?.data || response;
      if (payload && (Array.isArray(payload.lidos) || Array.isArray(payload.nao_lidos))) {
        return {
          lidos: Array.isArray(payload.lidos) ? payload.lidos : [],
          nao_lidos: Array.isArray(payload.nao_lidos) ? payload.nao_lidos : [],
        };
      }
    } catch (err) {
      console.warn('[NotificationAuditService] Não foi possível obter a auditoria de leituras:', err);
    }
    return { lidos: [], nao_lidos: [] };
  }

  /**
   * Marca uma notificação como lida no backend (com string ID alfanumérico ou numérico)
   */
  public async marcarComoLida(notificacaoId: string | number): Promise<void> {
    const targetId = String(notificacaoId);
    const encodedId = encodeURIComponent(targetId);

    await apiClient.post(`/v1/notificacoes/${encodedId}/marcar-lida`, {});
  }

  /**
   * Desativa uma notificação específica
   */
  public async desativarNotificacao(notificacaoId: string | number): Promise<void> {
    const encodedId = encodeURIComponent(String(notificacaoId));
    try {
      await apiClient.post(`/v1/notificacoes/${encodedId}/desativar`, {});
    } catch {
      try {
        await apiClient.patch(`/v1/notificacoes/${encodedId}/desativar`, {});
      } catch {}
    }
  }

  /**
   * Alterna o estado de fixação persistente da notificação
   */
  public async setPersistente(notificacaoId: string | number, persistente: boolean): Promise<void> {
    const encodedId = encodeURIComponent(String(notificacaoId));
    try {
      await apiClient.patch(`/v1/notificacoes/${encodedId}/persistente`, { persistente });
    } catch {
      try {
        await apiClient.patch(`/notificacoes/${encodedId}/persistente`, { persistente });
      } catch {}
    }
  }

  /**
   * Elimina uma notificação do histórico no backend
   */
  public async eliminarNotificacao(notificacaoId: string | number): Promise<void> {
    const encodedId = encodeURIComponent(String(notificacaoId));
    try {
      await apiClient.delete(`/v1/notificacoes/${encodedId}`);
    } catch {
      try {
        await apiClient.delete(`/notificacoes/${encodedId}`);
      } catch {}
    }
  }

  /**
   * Marca todas as notificações como lidas
   */
  public async marcarTodasComoLidas(): Promise<void> {
    try {
      await apiClient.post('/v1/notificacoes/marcar-todas-lidas', {});
    } catch {
      try {
        await apiClient.post('/notificacoes/marcar-todas-lidas', {});
      } catch {}
    }
  }

  /**
   * Cria uma nova notificação / comunicado corporativo manual
   */
  public async criarNotificacao(payload: CriarNotificacaoPayload): Promise<AppNotification> {
    const response = await apiClient.post<any, any>('/v1/notificacoes', payload);
    const createdNotification = response?.data || response;
    if (!createdNotification?.id) {
      throw new Error('A API não confirmou a criação da notificação.');
    }
    return NotificationAdapter.fromBackendEvent('notificacao', createdNotification);
  }
}

export const notificationAuditService = new NotificationAuditService();

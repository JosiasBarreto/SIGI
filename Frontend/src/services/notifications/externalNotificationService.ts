import apiClient from '../../api/client';

export interface EnviarMensagemClienteParams {
  telefone: string;
  mensagem: string;
  destinatario_nome?: string;
  canal: 'sms' | 'whatsapp';
  referencia_id?: string | number;
  referencia_tipo?: 'pedido' | 'evento' | 'cobranca';
}

export interface EnviarMensagemClienteResponse {
  sucesso: boolean;
  mensagem_id?: string;
  canal: 'sms' | 'whatsapp';
  detalhes?: string;
}

/**
 * Serviço isolado para despacho de notificações externas para clientes (SMS / WhatsApp)
 * Se o endpoint backend dedicado não estiver provisionado na API, documenta e retorna fallback graceful.
 */
export const externalNotificationService = {
  async enviarNotificacaoCliente(
    params: EnviarMensagemClienteParams
  ): Promise<EnviarMensagemClienteResponse> {
    try {
      // Tentativa de envio através da rota oficial de mensagens do SIGI
      const response = await apiClient.post<any, any>('/v1/notificacoes/enviar-cliente', {
        telefone: params.telefone,
        mensagem: params.mensagem,
        destinatario_nome: params.destinatario_nome,
        canal: params.canal,
        referencia_id: params.referencia_id,
        referencia_tipo: params.referencia_tipo,
      });

      return {
        sucesso: true,
        mensagem_id: response?.mensagem_id || response?.id || `msg-${Date.now()}`,
        canal: params.canal,
        detalhes: response?.mensagem || 'Notificação enviada com sucesso.',
      };
    } catch (error: any) {
      console.warn(
        '[ExternalNotificationService] Rota backend /v1/notificacoes/enviar-cliente pendente ou indisponível:',
        error?.message || error
      );

      // Em ambiente onde o backend ainda está a implementar o gateway SMS/WhatsApp:
      return {
        sucesso: false,
        canal: params.canal,
        detalhes: 'Serviço de envio externo registado localmente (aguardando ativação do gateway no backend).',
      };
    }
  },

  /**
   * Abre directamente o canal WhatsApp Web caso o operador deseje enviar mensagem manual com texto pré-definido
   */
  abrirWhatsAppWeb(telefone: string, mensagem: string) {
    const cleanPhone = telefone.replace(/\D/g, '');
    const encoded = encodeURIComponent(mensagem);
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

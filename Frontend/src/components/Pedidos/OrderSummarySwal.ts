import Swal from 'sweetalert2';
import { externalNotificationService } from '../../services/notifications/externalNotificationService';
import { formatCurrency } from '../../lib/utils';

export interface OrderSummarySwalOptions {
  orderId: string | number;
  orderNumber?: string;
  total: number;
  clienteNome?: string;
  clienteTelefone?: string;
  itensCount?: number;
  isProforma?: boolean;
  documentoNumero?: string;
  formaPagamento?: string;
  valorPago?: number;
  dataEntrega?: string;
  onPrintThermal?: () => void;
  onOpenPdf?: () => void;
}

export async function showOrderSummarySwal(options: OrderSummarySwalOptions) {
  const isDark = document.documentElement.classList.contains('dark');
  const orderNum = options.orderNumber || `#PED-${options.orderId}`;
  const totalFormatted = formatCurrency(options.total || 0);

  const clienteNome = options.clienteNome || 'Cliente Final';
  const clienteTel = options.clienteTelefone || '';
  const isProforma = Boolean(options.isProforma);

  const defaultSmsText = `Olá ${clienteNome}, o seu pedido ${orderNum} no valor de ${totalFormatted} foi registado com sucesso no Sabor Imbatível. Agradecemos a sua preferência!`;

  const htmlContent = `
    <div style="text-align: left; font-family: inherit; font-size: 13px;">
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: ${isDark ? '#1F2937' : '#F3F4F6'}; border-radius: 12px; margin-bottom: 16px;">
        <div>
          <span style="font-size: 11px; color: ${isDark ? '#9CA3AF' : '#6B7280'}; text-transform: uppercase; font-weight: bold; display: block;">Documento</span>
          <strong style="font-size: 14px; color: #FF6B00;">${orderNum}</strong>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 11px; color: ${isDark ? '#9CA3AF' : '#6B7280'}; text-transform: uppercase; font-weight: bold; display: block;">Total</span>
          <strong style="font-size: 15px; color: ${isDark ? '#10B981' : '#059669'};">${totalFormatted}</strong>
        </div>
      </div>

      <div style="font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: ${isDark ? '#9CA3AF' : '#6B7280'}; margin-bottom: 8px;">
        Notificações e Operações do Pedido
      </div>

      <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
        <div style="display: flex; gap: 10px; align-items: flex-start; padding: 8px 12px; background: ${isDark ? '#111827' : '#F9FAFB'}; border-left: 3px solid #10B981; border-radius: 8px;">
          <span style="font-size: 16px;">🛍️</span>
          <div>
            <strong style="display: block; font-size: 12px; color: ${isDark ? '#F9FAFB' : '#111827'};">Pedido Comercial Gravado</strong>
            <span style="font-size: 11px; color: ${isDark ? '#9CA3AF' : '#6B7280'};">${options.itensCount ? `${options.itensCount} itens registados.` : 'Gravado no sistema.'} Cliente: ${clienteNome}</span>
          </div>
        </div>

        <div style="display: flex; gap: 10px; align-items: flex-start; padding: 8px 12px; background: ${isDark ? '#111827' : '#F9FAFB'}; border-left: 3px solid #3B82F6; border-radius: 8px;">
          <span style="font-size: 16px;">👨‍🍳</span>
          <div>
            <strong style="display: block; font-size: 12px; color: ${isDark ? '#F9FAFB' : '#111827'};">Ordem de Produção</strong>
            <span style="font-size: 11px; color: ${isDark ? '#9CA3AF' : '#6B7280'};">Despachada para a cozinha/pastelaria ${options.dataEntrega ? `(Entrega: ${options.dataEntrega})` : '(Imediato)'}.</span>
          </div>
        </div>

        <div style="display: flex; gap: 10px; align-items: flex-start; padding: 8px 12px; background: ${isDark ? '#111827' : '#F9FAFB'}; border-left: 3px solid #8B5CF6; border-radius: 8px;">
          <span style="font-size: 16px;">💳</span>
          <div>
            <strong style="display: block; font-size: 12px; color: ${isDark ? '#F9FAFB' : '#111827'};">Financeiro & Caixa</strong>
            <span style="font-size: 11px; color: ${isDark ? '#9CA3AF' : '#6B7280'};">${options.formaPagamento ? `Liquidado via ${options.formaPagamento}.` : isProforma ? 'Pró-Forma emitida.' : 'Venda/Fatura registada no caixa.'}</span>
          </div>
        </div>

        <div style="display: flex; gap: 10px; align-items: flex-start; padding: 8px 12px; background: ${isDark ? '#111827' : '#F9FAFB'}; border-left: 3px solid #FF6B00; border-radius: 8px;">
          <span style="font-size: 16px;">📱</span>
          <div style="flex: 1;">
            <strong style="display: block; font-size: 12px; color: ${isDark ? '#F9FAFB' : '#111827'};">SMS / Notificação ao Cliente</strong>
            <span style="font-size: 11px; color: ${isDark ? '#9CA3AF' : '#6B7280'}; display: block; margin-bottom: 4px;">Contacto: ${clienteTel || 'Sem contacto direto'}</span>
            <div style="background: ${isDark ? '#1F2937' : '#E5E7EB'}; padding: 6px 8px; border-radius: 6px; font-size: 10px; color: ${isDark ? '#D1D5DB' : '#374151'}; line-height: 1.3;">
              "${defaultSmsText}"
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const result = await Swal.fire({
    title: isProforma ? 'Pró-Forma Concluída' : 'Pedido Concluído com Sucesso!',
    html: htmlContent,
    icon: 'success',
    background: isDark ? '#1B2230' : '#FFFFFF',
    color: isDark ? '#F9FAFB' : '#111827',
    showCancelButton: true,
    showDenyButton: Boolean(clienteTel),
    confirmButtonText: '🖨️ Recibo 80mm',
    denyButtonText: '📱 Enviar WhatsApp',
    cancelButtonText: 'Concluir',
    confirmButtonColor: '#10B981',
    denyButtonColor: '#25D366',
    cancelButtonColor: isDark ? '#374151' : '#6B7280',
    customClass: {
      popup: 'rounded-2xl border ' + (isDark ? 'border-gray-800' : 'border-gray-200'),
    },
  });

  if (result.isConfirmed) {
    options.onPrintThermal?.();
  } else if (result.isDenied && clienteTel) {
    externalNotificationService.abrirWhatsAppWeb(clienteTel, defaultSmsText);
  }
}

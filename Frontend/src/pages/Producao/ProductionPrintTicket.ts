/**
 * Utilitário de Impressão de Comandas de Produção (Ticket Térmico 80mm / KDS)
 */

export interface TicketPrintData {
    order: any;
    items: Array<{
      id: string | number;
      nome: string;
      quantidade: number;
      unidade?: string;
      observacoes?: string;
    }>;
    consumos?: Array<{
      nome: string;
      quantidade_prevista: number;
      unidade?: string;
    }>;
  }
  
  export function printKitchenTicket({ order, items, consumos }: TicketPrintData) {
    const printWindow = window.open('', '_blank', 'width=420,height=650');
    if (!printWindow) {
      return false;
    }
  
    const sector = (order.sector || order.setor || 'Cozinha').toUpperCase();
    const orderNum = order.numero || order.codigo || `#${order.id}`;
    const pedidoNum = order.pedido_numero || (order.pedido_id ? `PED #${order.pedido_id}` : 'Avulso');
    const cliente = order.cliente_nome || order.cliente || 'Balcão';
    const mesa = order.mesa || order.local || order.mesa_numero ? `Mesa: ${order.mesa || order.local || order.mesa_numero}` : '';
    const now = new Date();
    const data = now.toLocaleDateString('pt-PT');
    const hora = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  
    const html = `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <title>Comanda - ${orderNum}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 80mm;
            margin: 0 auto;
            padding: 8px;
            color: #000;
            font-size: 13px;
            line-height: 1.3;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-bottom: 2px dashed #000; margin: 8px 0; }
          .divider-solid { border-bottom: 2px solid #000; margin: 8px 0; }
          .header { text-align: center; margin-bottom: 8px; }
          .header h1 { font-size: 18px; margin: 0; font-weight: bold; }
          .header .sector { font-size: 15px; font-weight: bold; margin: 3px 0; }
          .header .ord-num { font-size: 20px; font-weight: 900; margin: 4px 0; }
          .meta-line { font-size: 11px; margin: 2px 0; }
          .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 6px 0 4px; }
          .item-row { display: flex; justify-content: space-between; align-items: baseline; font-size: 14px; font-weight: bold; margin: 5px 0; }
          .item-obs { font-size: 11px; font-style: italic; margin-left: 18px; color: #222; }
          .obs-box {
            border: 1px solid #000;
            padding: 6px;
            margin: 8px 0;
            font-size: 11px;
            background: #f8f8f8;
          }
          .footer { text-align: center; font-size: 10px; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ORDEM DE PRODUÇÃO</h1>
          <div class="sector">${sector}</div>
          <div class="ord-num">${orderNum}</div>
          <div class="meta-line bold">${pedidoNum} ${mesa ? `· ${mesa}` : ''}</div>
          <div class="meta-line">Cliente: ${cliente}</div>
          <div class="meta-line">${data} · ${hora}</div>
        </div>
  
        <div class="divider"></div>
  
        <div class="section-title">ITENS A PREPARAR (${items.length}):</div>
        <div>
          ${items.map(it => `
            <div class="item-row">
              <span>[ ${it.quantidade}x ] ${it.nome}</span>
              <span>${it.unidade || ''}</span>
            </div>
            ${it.observacoes ? `<div class="item-obs">➥ ${it.observacoes}</div>` : ''}
          `).join('')}
        </div>
  
        ${(order.observacoes || order.observacoes_pedido) ? `
          <div class="obs-box">
            <div class="bold">OBSERVAÇÕES DO PEDIDO:</div>
            <div>${order.observacoes || ''} ${order.observacoes_pedido || ''}</div>
          </div>
        ` : ''}
  
        ${consumos && consumos.length > 0 ? `
          <div class="divider"></div>
          <div class="section-title">MATÉRIAS-PRIMAS / RECEITA:</div>
          <div style="font-size: 11px;">
            ${consumos.map(c => `
              <div style="display: flex; justify-content: space-between;">
                <span>• ${c.nome}</span>
                <span>${c.quantidade_prevista} ${c.unidade || ''}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
  
        <div class="divider-solid"></div>
        <div class="footer">
          <div>SIGI ERP · SISTEMA DE GESTÃO INTEGRADA</div>
          <div>Comanda gerada para monitor de produção</div>
        </div>
  
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 700);
          };
        </script>
      </body>
      </html>
    `;
  
    printWindow.document.write(html);
    printWindow.document.close();
    return true;
  }
  
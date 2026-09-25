import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Printer,
  FileText,
  Download,
  Send,
  X,
  MessageSquare,
  Smartphone,
  Copy,
  ChefHat,
  ShoppingBag,
  CreditCard,
  PackageCheck,
  Check,
  ExternalLink
} from "lucide-react";
import { documentService, commercialService, proformaService } from "../../services";
import { externalNotificationService } from "../../services/notifications/externalNotificationService";
import { notificationManager } from "../../services/notifications/notificationManager";
import { formatCurrency } from "../../lib/utils";
import { showOrderSummarySwal } from "../../components/Pedidos/orderSummarySwal";
import { toast } from "react-toastify";

export interface PedidoSuccessModalProps {
  order: any;
  createdVenda?: any;
  onClose: () => void;
  onNewOrder?: () => void;
}

export default function PedidoSuccessModal({
  order,
  createdVenda,
  onClose,
  onNewOrder,
}: PedidoSuccessModalProps) {
  if (!order) return null;

  const isProforma = Boolean(order?.isProforma || createdVenda?.isProforma);
  const targetId = createdVenda?.id || order?.id;
  const orderNumber = order?.numero || createdVenda?.numero_documento || createdVenda?.numero || `#${order?.id || "NOVO"}`;
  
  const clientName = order?.cliente?.nome || order?.cliente?.name || createdVenda?.cliente?.nome || (createdVenda as any)?.client?.name || "Cliente Final";
  const initialContact = order?.cliente?.telefone || order?.cliente?.phone || order?.cliente?.email || createdVenda?.cliente?.telefone || createdVenda?.cliente?.email || "";
  
  const totalAmount = Number(
    order?.total ?? order?.valor_total ?? createdVenda?.total ?? createdVenda?.valor_total ?? 0
  );

  const [contact, setContact] = useState(initialContact);
  const [sendMethod, setSendMethod] = useState<"whatsapp" | "sms" | "email">("whatsapp");
  const [isSending, setIsSending] = useState(false);
  const [smsStatus, setSmsStatus] = useState<"idle" | "sent" | "copied">("idle");
  const [copied, setCopied] = useState(false);

  // Template da SMS / WhatsApp profissional
  const [customMessage, setCustomMessage] = useState(
    `Olá ${clientName}, o seu atendimento/pedido ${orderNumber} no valor de ${formatCurrency(totalAmount)} foi registado com sucesso no Sabor Imbatível. Agradecemos a sua preferência!`
  );

  // Eventos recebidos em tempo real para este pedido
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  useEffect(() => {
    // Subscrever a eventos de notificação em tempo real enquanto o modal estiver aberto
    const unsubscribe = notificationManager.subscribeToOrderEvents((notif) => {
      setLiveEvents((prev) => [notif, ...prev]);
    });
    return () => {
      unsubscribe();
      notificationManager.endOrderSession();
    };
  }, []);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setSmsStatus("copied");
    setTimeout(() => {
      setCopied(false);
    }, 2500);
  };

  const handleSendExternalMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!contact.trim()) {
      toast.error("Introduza o número de telefone / contacto do cliente.");
      return;
    }

    if (sendMethod === "whatsapp") {
      externalNotificationService.abrirWhatsAppWeb(contact.trim(), customMessage);
      setSmsStatus("sent");
      return;
    }

    if (sendMethod === "sms") {
      setIsSending(true);
      try {
        const res = await externalNotificationService.enviarNotificacaoCliente({
          telefone: contact.trim(),
          mensagem: customMessage,
          destinatario_nome: clientName,
          canal: "sms",
          referencia_id: order?.id,
          referencia_tipo: "pedido",
        });
        setSmsStatus("sent");
        if (res.sucesso) {
          toast.success("SMS enviada com sucesso para o cliente!");
        } else {
          toast.info("SMS registada na fila de envio.");
        }
      } catch (err: any) {
        toast.error(err?.message || "Erro ao processar envio de SMS.");
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Caso seja e-mail
    if (sendMethod === "email") {
      setIsSending(true);
      try {
        if (isProforma) {
          await proformaService.send(targetId, "email", contact.trim());
        } else {
          await commercialService.enviarFatura(targetId, {
            method: "email",
            contact: contact.trim(),
          });
        }
        setSmsStatus("sent");
        toast.success("Documento enviado por e-mail com sucesso!");
      } catch (err: any) {
        toast.error(err?.message || "Erro ao enviar por e-mail.");
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleOpenSwalView = () => {
    showOrderSummarySwal({
      orderId: order?.id,
      orderNumber,
      total: totalAmount,
      clienteNome: clientName,
      clienteTelefone: contact,
      itensCount: order?.itens?.length || 0,
      isProforma,
      formaPagamento: order?.forma_pagamento || "Dinheiro / Caixa",
      dataEntrega: order?.data_entrega,
      onPrintThermal: () => {
        if (isProforma) {
          proformaService.openRecibo(targetId);
        } else {
          documentService.imprimirReciboPedido(order.id).catch(() => {});
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl shadow-2xl w-full max-w-2xl my-auto overflow-hidden animate-fade-in-up relative">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {isProforma ? "Pró-Forma Criada com Sucesso!" : "Pedido Concluído com Sucesso!"}
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                Todas as operações e mensagens do pedido foram organizadas abaixo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto text-left">
          {/* Order Summary Pill */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800 text-xs">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block font-semibold">Documento</span>
              <span className="font-bold text-gray-900 dark:text-white text-sm">{orderNumber}</span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block font-semibold">Cliente</span>
              <span className="font-bold text-gray-900 dark:text-white truncate block" title={clientName}>
                {clientName}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block font-semibold">Total a Pagar</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block font-semibold">Estado</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                Confirmado
              </span>
            </div>
          </div>

          {/* Central de Mensagens e Notificações (Organizadas & Estruturadas) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <MessageSquare size={14} className="text-primary" />
                Central de Mensagens & Notificações do Pedido
              </h3>
              <button
                type="button"
                onClick={handleOpenSwalView}
                className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1"
                title="Abrir em pop-up Swal"
              >
                <ExternalLink size={12} /> Ver em Swal
              </button>
            </div>

            {/* Componente Estruturado: Card 1 - SMS & WhatsApp para o Cliente */}
            <div className="border border-orange-200 dark:border-orange-900/50 bg-orange-50/40 dark:bg-orange-950/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      Notificação ao Cliente (SMS / WhatsApp)
                    </h4>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Mensagem preparada automaticamente para o cliente
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    smsStatus === "sent"
                      ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                      : "bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300"
                  }`}
                >
                  {smsStatus === "sent" ? "✓ Mensagem Enviada" : "Pronta para Envio"}
                </span>
              </div>

              {/* Canal de envio */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="whatsapp"
                    checked={sendMethod === "whatsapp"}
                    onChange={() => setSendMethod("whatsapp")}
                    className="accent-primary"
                  />
                  WhatsApp
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="sms"
                    checked={sendMethod === "sms"}
                    onChange={() => setSendMethod("sms")}
                    className="accent-primary"
                  />
                  SMS
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="email"
                    checked={sendMethod === "email"}
                    onChange={() => setSendMethod("email")}
                    className="accent-primary"
                  />
                  E-mail
                </label>
              </div>

              {/* Contact input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={
                    sendMethod === "email"
                      ? "cliente@exemplo.com"
                      : "Nº de telefone (+244 923 000 000)"
                  }
                  className="flex-1 bg-white dark:bg-surface-dark border border-gray-300 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white font-medium outline-none focus:border-primary shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => handleSendExternalMessage()}
                  disabled={isSending || !contact.trim()}
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <Send size={14} />
                  <span>{isSending ? "A enviar..." : sendMethod === "whatsapp" ? "Abrir WhatsApp" : "Enviar Agora"}</span>
                </button>
              </div>

              {/* Message preview and copy */}
              <div className="relative">
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={2}
                  className="w-full bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl p-2.5 pr-20 text-xs text-gray-700 dark:text-gray-300 outline-none focus:border-primary resize-none"
                />
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="absolute right-2 top-2 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  title="Copiar texto"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copiado</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Componente Estruturado: Linha de Notificações do Sistema */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {/* Notificação 1: Registo Comercial */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <ShoppingBag size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <strong className="text-gray-900 dark:text-white font-bold">
                      Registo Comercial
                    </strong>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                      ✓ Confirmado
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    Gravado no sistema comercial com {order?.itens?.length || 1} itens.
                  </p>
                </div>
              </div>

              {/* Notificação 2: Ordem de Produção */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mt-0.5">
                  <ChefHat size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <strong className="text-gray-900 dark:text-white font-bold">
                      Ordem de Produção
                    </strong>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                      ✓ Despachada
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    Encaminhada para a Cozinha / Linha de Fabrico.
                  </p>
                </div>
              </div>

              {/* Notificação 3: Financeiro & Caixa */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mt-0.5">
                  <CreditCard size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <strong className="text-gray-900 dark:text-white font-bold">
                      Financeiro & Caixa
                    </strong>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                      ✓ Liquidado
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    {order?.forma_pagamento ? `Pagamento em ${order.forma_pagamento}.` : "Documento de caixa emitido."}
                  </p>
                </div>
              </div>

              {/* Notificação 4: Reserva de Stock */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl flex items-start gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mt-0.5">
                  <PackageCheck size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <strong className="text-gray-900 dark:text-white font-bold">
                      Inventário & Stock
                    </strong>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                      ✓ Reservado
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                    Matérias-primas e artigos reservados com sucesso.
                  </p>
                </div>
              </div>
            </div>

            {/* Eventos recebidos em tempo real (se algum foi emitido durante a finalização) */}
            {liveEvents.length > 0 && (
              <div className="p-2.5 bg-gray-100 dark:bg-gray-800/60 rounded-xl text-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Atualizações em tempo real (Socket.IO)
                </span>
                {liveEvents.map((evt, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-300">
                    <span>• {evt.title}: {evt.message}</span>
                    <span className="text-[10px] text-gray-400">{evt.priority}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons (Impressão e Documentos) */}
          <div className="pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
              Documentos do Pedido
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (isProforma) {
                    proformaService.openRecibo(targetId);
                  } else if (createdVenda?.id) {
                    documentService
                      .imprimirReciboVenda(createdVenda.id)
                      .catch(() => {
                        if (order?.id) {
                          documentService
                            .imprimirReciboPedido(order.id)
                            .catch((err) => toast.error(err?.message || "Erro ao imprimir recibo."));
                        }
                      });
                  } else if (order?.id) {
                    documentService
                      .imprimirReciboPedido(order.id)
                      .catch((err) => toast.error(err?.message || "Erro ao imprimir recibo."));
                  }
                }}
                className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer size={18} />
                <span>Imprimir Recibo (80mm)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isProforma) {
                    proformaService.openPdf(targetId);
                  } else if (createdVenda?.id) {
                    documentService
                      .vendaPdf(createdVenda.id)
                      .catch(() => {
                        if (order?.id) {
                          documentService
                            .pedidoPdf(order.id)
                            .catch((err) => toast.error(err?.message || "Erro ao abrir PDF."));
                        }
                      });
                  } else if (order?.id) {
                    documentService
                      .pedidoPdf(order.id)
                      .catch((err) => toast.error(err?.message || "Erro ao abrir PDF."));
                  }
                }}
                className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <FileText size={18} />
                <span>{isProforma ? "Pró-Forma PDF" : "Fatura / PDF (A4)"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isProforma) {
                    proformaService.openRecibo(targetId);
                  } else if (createdVenda?.id) {
                    documentService
                      .vendaRecibo(createdVenda.id)
                      .catch(() => {
                        if (order?.id) {
                          documentService
                            .pedidoRecibo(order.id)
                            .catch((err) => toast.error(err?.message || "Erro ao descarregar recibo."));
                        }
                      });
                  } else if (order?.id) {
                    documentService
                      .pedidoRecibo(order.id)
                      .catch((err) => toast.error(err?.message || "Erro ao descarregar recibo."));
                  }
                }}
                className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Download size={18} />
                <span>Descarregar Recibo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/60 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
          {onNewOrder && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNewOrder();
              }}
              className="px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 rounded-xl transition-all cursor-pointer"
            >
              Criar Outro Pedido
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
          >
            Concluir e Voltar
          </button>
        </div>
      </div>
    </div>
  );
}

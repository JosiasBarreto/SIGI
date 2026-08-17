import React, { useState } from "react";
import { CheckCircle, Printer, FileText, Download, Send, X } from "lucide-react";
import { documentService, commercialService, proformaService } from "../../services";
import { toast } from "react-toastify";

interface PedidoSuccessModalProps {
  order: any;
  createdVenda?: any;
  onClose: () => void;
}

export default function PedidoSuccessModal({
  order,
  createdVenda,
  onClose,
}: PedidoSuccessModalProps) {
  const [sendMethod, setSendMethod] = useState<"email" | "whatsapp">("email");
  const [contact, setContact] = useState(
    order?.cliente?.email || order?.cliente?.telefone || ""
  );
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  if (!order) return null;

  const isProforma = order?.isProforma || createdVenda?.isProforma;
  const targetId = createdVenda?.id || order?.id;

  const handleSendInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim()) {
      toast.error("Por favor, introduza o contacto do cliente.");
      return;
    }
    setIsSending(true);
    try {
      if (isProforma) {
        const res = await proformaService.send(targetId, sendMethod, contact.trim());
        setIsSent(true);
        toast.success(res.msg || `Pró-Forma enviada com sucesso via ${sendMethod === "email" ? "E-mail" : "WhatsApp"}!`);
      } else {
        await commercialService.enviarFatura(targetId, {
          method: sendMethod,
          contact: contact.trim(),
        });
        setIsSent(true);
        toast.success(
          `Fatura enviada com sucesso via ${
            sendMethod === "email" ? "E-mail" : "WhatsApp"
          }!`
        );
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar documento.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-6 animate-fade-in-up relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={36} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {isProforma ? "Pró-Forma Criada com Sucesso!" : "Pedido Concluído com Sucesso!"}
          </h2>
          <p className="text-xs text-gray-500">
            {isProforma ? `Fatura Pró-Forma ${order.numero || `#${order.id}`}` : `Pedido #${order.numero || `PED-${order.id}`} registado e pronto para processamento.`}
          </p>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              if (isProforma) {
                proformaService.openRecibo(targetId);
              } else {
                documentService
                  .imprimirReciboPedido(order.id)
                  .catch((err) => toast.error(err?.message || "Erro ao imprimir recibo."));
              }
            }}
            className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex flex-col items-center gap-1 shadow-sm"
          >
            <Printer size={18} />
            <span>Recibo 80mm</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isProforma) {
                proformaService.openPdf(targetId);
              } else {
                documentService
                  .pedidoPdf(order.id)
                  .catch((err) => toast.error(err?.message || "Erro ao abrir PDF."));
              }
            }}
            className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex flex-col items-center gap-1 shadow-sm"
          >
            <FileText size={18} />
            <span>{isProforma ? "Pró-Forma PDF" : "Fatura / PDF"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (isProforma) {
                proformaService.openRecibo(targetId);
              } else {
                documentService
                  .pedidoRecibo(order.id)
                  .catch((err) => toast.error(err?.message || "Erro ao descarregar recibo."));
              }
            }}
            className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition-all flex flex-col items-center gap-1 shadow-sm"
          >
            <Download size={18} />
            <span>Baixar Recibo</span>
          </button>
        </div>

        {/* Send Invoice Section */}
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            Enviar Comprovativo ao Cliente
          </h4>

          {isSent ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold text-center">
              ✓ Documento enviado com sucesso!
            </div>
          ) : (
            <form onSubmit={handleSendInvoice} className="space-y-3">
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="email"
                    checked={sendMethod === "email"}
                    onChange={() => setSendMethod("email")}
                  />
                  E-mail
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="sendMethod"
                    value="whatsapp"
                    checked={sendMethod === "whatsapp"}
                    onChange={() => setSendMethod("whatsapp")}
                  />
                  WhatsApp
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={
                    sendMethod === "email" ? "cliente@email.com" : "+244 923 000 000"
                  }
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={isSending}
                  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Send size={14} /> Enviar
                </button>
              </div>
            </form>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl text-sm transition-all"
        >
          Concluir e Voltar
        </button>
      </div>
    </div>
  );
}

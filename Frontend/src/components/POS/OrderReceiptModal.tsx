import React, { useState } from "react";
import Modal from "../Common/Modal";
import { documentService } from "../../services";
import { Printer, Download, FileText, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";

interface OrderReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData: {
    id: string | number;
    numero?: string;
    tipo?: "Venda" | "Pedido";
    total?: number;
    cliente_nome?: string;
  } | null;
  currencySymbol?: string;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  isOpen,
  onClose,
  documentData,
  currencySymbol: propCurrencySymbol,
}) => {
  const config = JSON.parse(localStorage.getItem("sigi_config") || "{}");
  const currencySymbol = propCurrencySymbol || config?.moeda || "Kz";
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !documentData) return null;

  const isPedido = documentData.tipo === "Pedido";
  const docId = documentData.id;

  const handlePrintThermal = async () => {
    setIsPrinting(true);
    try {
      if (isPedido) {
        await documentService.imprimirReciboPedido(docId);
      } else {
        await documentService.imprimirReciboVenda(docId);
      }
      toast.success("Recibo térmico enviado para impressão.");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao gerar recibo térmico.");
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadThermalPdf = async () => {
    try {
      if (isPedido) {
        await documentService.pedidoRecibo(docId);
      } else {
        await documentService.vendaRecibo(docId);
      }
      toast.success("Recibo baixado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao baixar recibo.");
    }
  };

  const handleDownloadFullPdf = async () => {
    try {
      if (isPedido) {
        await documentService.pedidoPdf(docId);
      } else {
        await documentService.vendaPdf(docId);
      }
      toast.success("Fatura PDF gerada com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao baixar documento PDF.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isPedido ? "Recibo de Pedido de Produção" : "Fatura-Recibo de Venda"} #${documentData.numero || docId}`}
    >
      <div className="space-y-4 py-2 text-xs">
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-xl flex items-center gap-3">
          <CheckCircle className="text-emerald-600 dark:text-emerald-400 shrink-0" size={28} />
          <div>
            <h4 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
              Operação Registada com Sucesso!
            </h4>
            <p className="text-emerald-700 dark:text-emerald-400 mt-0.5">
              O {isPedido ? "Pedido de Produção" : "documento de venda"} #{documentData.numero || docId} foi processado e sincronizado com o Caixa Ativo.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Cliente:</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {documentData.cliente_nome || "Consumidor Final"}
            </span>
          </div>
          {documentData.total !== undefined && (
            <div className="flex justify-between text-sm pt-1 border-t border-gray-200 dark:border-gray-700">
              <span className="font-bold text-gray-700 dark:text-gray-300">Total Faturado:</span>
              <span className="font-extrabold text-primary">
                {documentData.total.toLocaleString("pt-PT", { minimumFractionDigits: 2 })} {currencySymbol}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
          <button
            type="button"
            disabled={isPrinting}
            onClick={handlePrintThermal}
            className="p-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-bold flex flex-col items-center gap-1.5 transition-all shadow-md shadow-primary/20 disabled:opacity-50"
          >
            <Printer size={20} />
            <span>Imprimir Térmico</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadThermalPdf}
            className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold flex flex-col items-center gap-1.5 transition-all border border-gray-200 dark:border-gray-700"
          >
            <Download size={20} />
            <span>Baixar Térmico</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadFullPdf}
            className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold flex flex-col items-center gap-1.5 transition-all border border-gray-200 dark:border-gray-700"
          >
            <FileText size={20} />
            <span>Fatura A4 PDF</span>
          </button>
        </div>

        <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold bg-gray-900 text-white hover:bg-gray-800 transition-colors"
          >
            Concluir
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderReceiptModal;

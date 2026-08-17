import React from "react";
import Modal from "../../components/Common/Modal";
import PedidoPaymentSection from "./PedidoPaymentSection";
import { formatCurrency } from "../../lib/utils";
import { CheckCircle, FileText, X } from "lucide-react";

interface PedidoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalFinal: number;
  paymentOption: "Sem Pagamento" | "Pagamento Parcial" | "Pagamento Total";
  setPaymentOption: (val: "Sem Pagamento" | "Pagamento Parcial" | "Pagamento Total") => void;
  valPagoInput: number;
  setValPagoInput: (val: number) => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
  codigoTransferencia: string;
  setCodigoTransferencia: (val: string) => void;
  emissor: string;
  setEmissor: (val: string) => void;
  amountReceived: number;
  setAmountReceived: (val: number) => void;
  valorCashMixto: number;
  setValorCashMixto: (val: number) => void;
  valorPosMixto: number;
  setValorPosMixto: (val: number) => void;
  isSubmitting: boolean;
  onConfirmOrder: () => void;
  onGenerateProforma: () => void;
}

export default function PedidoPaymentModal({
  isOpen,
  onClose,
  totalFinal,
  paymentOption,
  setPaymentOption,
  valPagoInput,
  setValPagoInput,
  paymentMethod,
  setPaymentMethod,
  codigoTransferencia,
  setCodigoTransferencia,
  emissor,
  setEmissor,
  amountReceived,
  setAmountReceived,
  valorCashMixto,
  setValorCashMixto,
  valorPosMixto,
  setValorPosMixto,
  isSubmitting,
  onConfirmOrder,
  onGenerateProforma,
}: PedidoPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Finalização e Pagamento - Total: ${formatCurrency(totalFinal)}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        <PedidoPaymentSection
          totalFinal={totalFinal}
          paymentOption={paymentOption}
          setPaymentOption={setPaymentOption}
          valPagoInput={valPagoInput}
          setValPagoInput={setValPagoInput}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          codigoTransferencia={codigoTransferencia}
          setCodigoTransferencia={setCodigoTransferencia}
          emissor={emissor}
          setEmissor={setEmissor}
          amountReceived={amountReceived}
          setAmountReceived={setAmountReceived}
          valorCashMixto={valorCashMixto}
          setValorCashMixto={setValorCashMixto}
          valorPosMixto={valorPosMixto}
          setValorPosMixto={setValorPosMixto}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Voltar / Editar
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onGenerateProforma}
              className="w-full sm:w-auto px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <FileText size={16} /> Emitir Pro Forma
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={onConfirmOrder}
              className="w-full sm:w-auto px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              <CheckCircle size={16} /> {isSubmitting ? "A Processar..." : "CONFIRMAR PEDIDO"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

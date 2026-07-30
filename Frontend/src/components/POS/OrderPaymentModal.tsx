import React, { useState } from "react";
import Modal from "../Common/Modal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { orderService } from "../../services";
import FlexiblePaymentForm, { PaymentFormState } from "./FlexiblePaymentForm";
import { DollarSign, CheckCircle, FileText } from "lucide-react";

interface OrderPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string | number;
    numero?: string;
    valor_total: number;
    valor_pago: number;
    saldo: number;
    cliente?: any;
    cliente_nome?: string;
  } | null;
  onSuccess?: () => void;
  currencySymbol?: string;
}

export const OrderPaymentModal: React.FC<OrderPaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  onSuccess,
  currencySymbol: propCurrencySymbol,
}) => {
  const config = JSON.parse(localStorage.getItem("sigi_config") || "{}");
  const currencySymbol = propCurrencySymbol || config?.moeda || "Kz";
  const queryClient = useQueryClient();
  const [paymentFormState, setPaymentFormState] = useState<PaymentFormState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addPaymentMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: any }) =>
      orderService.adicionarPagamento(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      toast.success("Pagamento registado com sucesso no Caixa!");
      onSuccess?.();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao registar pagamento do pedido.");
    },
  });

  if (!isOpen || !order) return null;

  const saldoRestante = Number(order.saldo ?? (order.valor_total - order.valor_pago));

  const handleConfirm = async () => {
    if (!paymentFormState) return;

    const { method, valorPago, codigoTransferencia, emissor, amountReceived } = paymentFormState;

    if (valorPago <= 0) {
      toast.error("Introduza um valor de pagamento superior a 0.");
      return;
    }

    if (valorPago > saldoRestante + 0.01) {
      toast.error(`O valor do pagamento (${valorPago.toFixed(2)}) não pode ser superior ao saldo em falta (${saldoRestante.toFixed(2)}).`);
      return;
    }

    if ((method === "Transferência" || method === "TPA / POS" || method === "Mixto") && (!codigoTransferencia.trim() || !emissor.trim())) {
      toast.error("Preencha o Código de Transação/Comprovativo e o Emissor/Banco.");
      return;
    }

    if (method === "Dinheiro" && amountReceived < valorPago) {
      toast.error("O valor entregue pelo cliente em dinheiro é inferior ao valor a liquidar.");
      return;
    }

    const forma_pagamento_id =
      method === "Transferência" ? 2 : method === "TPA / POS" ? 3 : method === "Mixto" ? 4 : 1;

    setIsSubmitting(true);
    try {
      await addPaymentMutation.mutateAsync({
        id: order.id,
        payload: {
          valor: valorPago,
          forma_pagamento_id,
          codigo_transferencia: method !== "Dinheiro" ? (codigoTransferencia || null) : null,
          emissor: method !== "Dinheiro" ? (emissor || null) : null,
          observacoes: `Liquidação de saldo no caixa`,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Registar Pagamento - Pedido #${order.numero || order.id}`}
    >
      <div className="space-y-4 py-1">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Cliente:</span>
            <span className="font-bold text-gray-900 dark:text-white">
              {order.cliente?.nome || order.cliente_nome || "Consumidor Final"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Valor Total do Pedido:</span>
            <span className="font-bold">{Number(order.valor_total).toLocaleString("pt-PT")} {currencySymbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-medium">Valor Já Liquidado:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              {Number(order.valor_pago).toLocaleString("pt-PT")} {currencySymbol}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1 text-sm">
            <span className="font-bold text-gray-700 dark:text-gray-300">Saldo Em Falta:</span>
            <span className="font-extrabold text-red-600 dark:text-red-400">
              {saldoRestante.toLocaleString("pt-PT")} {currencySymbol}
            </span>
          </div>
        </div>

        <FlexiblePaymentForm
          total={saldoRestante}
          currencySymbol={currencySymbol}
          isAgendado={false}
          onPaymentStateChange={setPaymentFormState}
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCircle size={16} />
            {isSubmitting ? "A Registar..." : "Confirmar Pagamento no Caixa"}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderPaymentModal;

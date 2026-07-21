import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { orderService } from "../services";

interface PedidoCheckoutFormProps {
  orderId: string | number;
  defaultAmount?: number | string;
  defaultMethod?: string;
  defaultCodigo?: string;
  defaultEmissor?: string;
  defaultObs?: string;
  onCancel?: () => void;
  onSuccess?: (response: any) => void;
}

function normalizePaymentMethod(method: string) {
  if (method === "TPA / POS") return "TPA / POS";
  if (method.toLowerCase().includes("transfer")) return "Transferência";
  return "Dinheiro";
}

export default function PedidoCheckoutForm({
  orderId,
  defaultAmount = "",
  defaultMethod = "Dinheiro",
  defaultCodigo = "",
  defaultEmissor = "",
  defaultObs = "Liquidação do valor restante no levantamento do pedido.",
  onCancel,
  onSuccess,
}: PedidoCheckoutFormProps) {
  const queryClient = useQueryClient();
  const [metodo, setMetodo] = useState(normalizePaymentMethod(defaultMethod));
  const [valor, setValor] = useState(String(defaultAmount || ""));
  const [codigo, setCodigo] = useState(defaultCodigo);
  const [emissor, setEmissor] = useState(defaultEmissor);
  const [observacoes, setObservacoes] = useState(defaultObs);

  const checkoutMutation = useMutation({
    mutationFn: (payload: any) => orderService.checkoutPedido(orderId, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-cal"] });
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("Pagamento registado com sucesso!");
      onSuccess?.(response);
    },
    onError: () => {
      toast.error("Erro ao liquidar o saldo.");
    },
  });

  const paymentMethod = normalizePaymentMethod(metodo);
  const requiresReference = paymentMethod === "Transferência" || paymentMethod === "TPA / POS";

  const handleSubmit = () => {
    if (requiresReference && (!codigo.trim() || !emissor.trim())) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    const parsedValue = parseFloat(valor);
    if (Number.isNaN(parsedValue) || parsedValue <= 0) {
      toast.error("Introduza um valor válido.");
      return;
    }

    checkoutMutation.mutate({
      forma_pagamento_id: paymentMethod === "Transferência" ? 2 : paymentMethod === "TPA / POS" ? 3 : 1,
      valor: parsedValue,
      codigo_transferencia: requiresReference ? codigo : null,
      emissor: requiresReference ? emissor : null,
      observacoes,
    });
  };

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
      <h5 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
        Checkout de Pedido
      </h5>

      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
          Método de Pagamento
        </label>
        <select
          value={metodo}
          onChange={(event) => setMetodo(event.target.value)}
          className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-100"
        >
          <option value="Dinheiro">Dinheiro</option>
          <option value="TPA / POS">TPA / POS</option>
          <option value="Transferência">Transferência</option>
        </select>
      </div>

      {requiresReference && (
        <>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Comprovativo / Código TRX *
            </label>
            <input
              type="text"
              value={codigo}
              onChange={(event) => setCodigo(event.target.value)}
              className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-100 font-medium"
              placeholder="Ex: TRX123456"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
              Emissor / Titular Banco *
            </label>
            <input
              type="text"
              value={emissor}
              onChange={(event) => setEmissor(event.target.value)}
              className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-100 font-medium"
              placeholder="Ex: Manuel Silva (Millennium)"
              required
            />
          </div>
        </>
      )}

      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
          Valor a Cobrar (STD) *
        </label>
        <input
          type="number"
          step="0.01"
          value={valor}
          onChange={(event) => setValor(event.target.value)}
          className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-bold text-gray-800 dark:text-gray-100"
          required
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
          Observações / Notas
        </label>
        <textarea
          value={observacoes}
          onChange={(event) => setObservacoes(event.target.value)}
          className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 h-16 text-gray-800 dark:text-gray-100"
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          disabled={checkoutMutation.isPending}
          onClick={handleSubmit}
          className="px-3 py-1.5 text-xs font-bold text-white bg-success hover:bg-success/90 rounded-lg disabled:opacity-50"
        >
          {checkoutMutation.isPending ? "A processar..." : "Confirmar"}
        </button>
      </div>
    </div>
  );
}

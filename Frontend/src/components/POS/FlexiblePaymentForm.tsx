import React, { useState, useEffect } from "react";
import { Banknote, CreditCard, FileText, Layers, CheckCircle, AlertCircle } from "lucide-react";
import { cn, formatCurrency } from "../../lib/utils";

export type PaymentMethodType = "Dinheiro" | "TPA / POS" | "Transferência" | "Mixto";
export type SettlementModeType = "imediato" | "parcelas" | "deferido";

export interface PaymentFormState {
  method: PaymentMethodType;
  settlementMode: SettlementModeType;
  valorTotal: number;
  valorPago: number;
  valorCashMixto: number;
  valorPosMixto: number;
  codigoTransferencia: string;
  emissor: string;
  amountReceived: number; // For troco calculation
  observacoes: string;
}

interface FlexiblePaymentFormProps {
  total: number;
  currencySymbol?: string;
  isAgendado?: boolean;
  disableDeferredAndInstallments?: boolean;
  onPaymentStateChange: (state: PaymentFormState) => void;
}

export const FlexiblePaymentForm: React.FC<FlexiblePaymentFormProps> = ({
  total,
  currencySymbol = "",
  isAgendado = false,
  disableDeferredAndInstallments = false,
  onPaymentStateChange,
}) => {
  const [method, setMethod] = useState<PaymentMethodType>("Dinheiro");
  const [settlementMode, setSettlementMode] = useState<SettlementModeType>(
    disableDeferredAndInstallments ? "imediato" : isAgendado ? "parcelas" : "imediato"
  );
  const [valorPagoInput, setValorPagoInput] = useState<string>("");
  const [valorCashMixto, setValorCashMixto] = useState<string>("");
  const [valorPosMixto, setValorPosMixto] = useState<string>("");
  const [codigoTransferencia, setCodigoTransferencia] = useState<string>("");
  const [emissor, setEmissor] = useState<string>("");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>("");

  useEffect(() => {
    if (disableDeferredAndInstallments) {
      if (settlementMode !== "imediato") setSettlementMode("imediato");
    } else if (isAgendado && settlementMode === "imediato") {
      setSettlementMode("parcelas");
    }
  }, [isAgendado, disableDeferredAndInstallments]);

  // Determine effective valorPago
  let effectiveValorPago = total;
  if (settlementMode === "deferido") {
    effectiveValorPago = 0;
  } else if (settlementMode === "parcelas") {
    const parsed = parseFloat(valorPagoInput);
    effectiveValorPago = isNaN(parsed) ? 0 : Math.min(total, Math.max(0, parsed));
  }

  // Handle Mixto split calculations
  const cashNum = parseFloat(valorCashMixto) || 0;
  const posNum = parseFloat(valorPosMixto) || 0;

  useEffect(() => {
    const state: PaymentFormState = {
      method,
      settlementMode,
      valorTotal: total,
      valorPago: effectiveValorPago,
      valorCashMixto: cashNum,
      valorPosMixto: posNum,
      codigoTransferencia,
      emissor,
      amountReceived,
      observacoes,
    };
    onPaymentStateChange(state);
  }, [
    method,
    settlementMode,
    total,
    effectiveValorPago,
    cashNum,
    posNum,
    codigoTransferencia,
    emissor,
    amountReceived,
    observacoes,
  ]);

  const saldoPendente = Math.max(0, total - effectiveValorPago);
  const troco = method === "Dinheiro" ? Math.max(0, amountReceived - effectiveValorPago) : 0;

  return (
    <div className="space-y-4 text-xs">
      {/* 1. Modalidade de Liquidação */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Modalidade de Liquidação
          </label>
          {disableDeferredAndInstallments && (
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900">
              Revenda Solteira: Pagamento Imediato Obrigatório
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSettlementMode("imediato")}
            className={cn(
              "py-2.5 px-2 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1",
              settlementMode === "imediato"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 hover:bg-gray-50"
            )}
          >
            <span>Total Imediato</span>
            <span className="text-[10px] opacity-80 font-normal">Paga {total.toLocaleString('pt-PT')} {currencySymbol}</span>
          </button>
          <button
            type="button"
            disabled={disableDeferredAndInstallments}
            onClick={() => !disableDeferredAndInstallments && setSettlementMode("parcelas")}
            className={cn(
              "py-2.5 px-2 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1",
              disableDeferredAndInstallments
                ? "opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-900 dark:border-gray-800"
                : settlementMode === "parcelas"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 hover:bg-gray-50"
            )}
          >
            <span>Sinal / Parcial</span>
            <span className="text-[10px] opacity-80 font-normal">Entrada Inicial</span>
          </button>
          <button
            type="button"
            disabled={disableDeferredAndInstallments}
            onClick={() => !disableDeferredAndInstallments && setSettlementMode("deferido")}
            className={cn(
              "py-2.5 px-2 rounded-xl border text-center font-bold transition-all flex flex-col items-center gap-1",
              disableDeferredAndInstallments
                ? "opacity-40 cursor-not-allowed bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-900 dark:border-gray-800"
                : settlementMode === "deferido"
                ? "bg-primary text-white border-primary shadow-sm"
                : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 hover:bg-gray-50"
            )}
          >
            <span>Pagar no Fim</span>
            <span className="text-[10px] opacity-80 font-normal">Na Entrega</span>
          </button>
        </div>
      </div>

      {/* Inputs para Sinal / Parcial */}
      {settlementMode === "parcelas" && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-xl space-y-2">
          <label className="block font-bold text-blue-900 dark:text-blue-300 uppercase">
            Valor da Entrada / Sinal ({currencySymbol}) *
          </label>
          <input
            type="number"
            step="0.01"
            placeholder={`Ex: ${(total * 0.5).toFixed(2)}`}
            value={valorPagoInput}
            onChange={(e) => setValorPagoInput(e.target.value)}
            className="w-full text-sm font-bold bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex justify-between items-center text-[11px] font-semibold text-blue-700 dark:text-blue-300">
            <span>Saldo a Pagar na Entrega:</span>
            <span className="font-bold text-xs text-amber-600 dark:text-amber-400">
              {saldoPendente.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} {currencySymbol}
            </span>
          </div>
        </div>
      )}

      {settlementMode === "deferido" && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
          <AlertCircle size={18} className="shrink-0" />
          <span>O valor total de {total.toLocaleString('pt-PT')} {currencySymbol} ficará como pendente até à entrega do pedido.</span>
        </div>
      )}

      {/* 2. Formas de Pagamento (FormaPagamento Enum: 1: Dinheiro, 2: Transferencia, 3: POS, 4: Mixto) */}
      {settlementMode !== "deferido" && (
        <div className="space-y-3">
          <label className="block font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
            Forma de Pagamento
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMethod("Dinheiro")}
              className={cn(
                "py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all",
                method === "Dinheiro"
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50"
              )}
            >
              <Banknote size={16} /> Dinheiro
            </button>
            <button
              type="button"
              onClick={() => setMethod("TPA / POS")}
              className={cn(
                "py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all",
                method === "TPA / POS"
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50"
              )}
            >
              <CreditCard size={16} /> TPA / POS
            </button>
            <button
              type="button"
              onClick={() => setMethod("Transferência")}
              className={cn(
                "py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all",
                method === "Transferência"
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50"
              )}
            >
              <FileText size={16} /> Transferência
            </button>
            <button
              type="button"
              onClick={() => setMethod("Mixto")}
              className={cn(
                "py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all",
                method === "Mixto"
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50"
              )}
            >
              <Layers size={16} /> Pagamento Mixto
            </button>
          </div>

          {/* Pagamento Mixto Detail Inputs */}
          {method === "Mixto" && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 rounded-xl space-y-3">
              <span className="font-bold text-purple-900 dark:text-purple-300 uppercase text-[10px]">
                Divisão do Valor a Cobrar ({effectiveValorPago.toLocaleString('pt-PT')} {currencySymbol})
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Valor em Dinheiro
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={valorCashMixto}
                    onChange={(e) => {
                      const val = e.target.value;
                      setValorCashMixto(val);
                      const num = parseFloat(val) || 0;
                      if (num <= effectiveValorPago) {
                        setValorPosMixto((effectiveValorPago - num).toFixed(2));
                      }
                    }}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Valor em POS / Transf.
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={valorPosMixto}
                    onChange={(e) => setValorPosMixto(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>
              {Math.abs(cashNum + posNum - effectiveValorPago) > 0.01 && (
                <p className="text-[10px] text-red-600 dark:text-red-400 font-bold">
                  Soma parcial: {(cashNum + posNum).toLocaleString('pt-PT')} / {effectiveValorPago.toLocaleString('pt-PT')} {currencySymbol}
                </p>
              )}
            </div>
          )}

          {/* Campos de Transação (Transferência / POS / Mixto) */}
          {(method === "Transferência" || method === "TPA / POS" || method === "Mixto") && (
            <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/30 space-y-2.5">
              <h4 className="font-bold text-amber-800 dark:text-amber-400 uppercase text-[10px]">
                Comprovativo e Emissor da Transação
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Código de Transação / TRX *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: TRX-982144"
                    value={codigoTransferencia}
                    onChange={(e) => setCodigoTransferencia(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                    Emissor / Titular da Conta *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Banco Comercial (BCP)"
                    value={emissor}
                    onChange={(e) => setEmissor(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Cálculo de Troco para Dinheiro */}
          {(method === "Dinheiro" || (method === "Mixto" && cashNum > 0)) && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-700 dark:text-gray-300">
                  Valor Entregue pelo Cliente ({currencySymbol})
                </label>
                {troco > 0 && (
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Troco: {troco.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} {currencySymbol}
                  </span>
                )}
              </div>
              <input
                type="number"
                step="0.01"
                placeholder={`Ex: ${(method === "Mixto" ? cashNum : effectiveValorPago).toFixed(2)}`}
                value={amountReceived || ""}
                onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                className="w-full text-base font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>
      )}

      {/* Resumo Final do Cobrança */}
      <div className="p-3 bg-gray-900 text-white rounded-xl flex justify-between items-center">
        <div>
          <span className="text-[10px] text-gray-400 font-bold uppercase block">
            Valor A Liquidar Agora
          </span>
          <span className="text-lg font-black text-amber-400">
            {effectiveValorPago.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} {currencySymbol}
          </span>
        </div>
        {saldoPendente > 0 && (
          <div className="text-right">
            <span className="text-[10px] text-gray-400 font-bold uppercase block">
              Saldo Restante
            </span>
            <span className="text-sm font-bold text-red-400">
              {saldoPendente.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} {currencySymbol}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlexiblePaymentForm;

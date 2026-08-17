import React from "react";
import { CreditCard, Banknote, ShieldAlert, ArrowRight, DollarSign } from "lucide-react";
import { formatCurrency, cn } from "../../lib/utils";

interface PedidoPaymentSectionProps {
  totalFinal: number;
  paymentOption: "Sem Pagamento" | "Pagamento Parcial" | "Pagamento Total";
  setPaymentOption: (opt: "Sem Pagamento" | "Pagamento Parcial" | "Pagamento Total") => void;
  valPagoInput: number;
  setValPagoInput: (val: number) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  codigoTransferencia: string;
  setCodigoTransferencia: (code: string) => void;
  emissor: string;
  setEmissor: (emissor: string) => void;
  amountReceived: number;
  setAmountReceived: (amount: number) => void;
  valorCashMixto: number;
  setValorCashMixto: (val: number) => void;
  valorPosMixto: number;
  setValorPosMixto: (val: number) => void;
}

export default function PedidoPaymentSection({
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
}: PedidoPaymentSectionProps) {
  let valorEfetivoPago = 0;
  if (paymentOption === "Pagamento Total") valorEfetivoPago = totalFinal;
  else if (paymentOption === "Pagamento Parcial") valorEfetivoPago = valPagoInput;

  const saldoPendente = Math.max(0, totalFinal - valorEfetivoPago);
  const trocoCalculado =
    paymentMethod === "Dinheiro" && amountReceived > valorEfetivoPago
      ? amountReceived - valorEfetivoPago
      : 0;

  const requiresTrxReference =
    paymentMethod === "Transferência" || paymentMethod === "TPA / POS" || paymentMethod === "Mixto";

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-5 shadow-sm">
      <div className="border-b border-gray-200 dark:border-gray-800 pb-3">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
          <CreditCard size={18} className="text-primary" />
          Opções e Condições de Pagamento (Caixa)
        </h3>
        <p className="text-xs text-gray-500">
          Escolha se o cliente pretende liquidar na totalidade, sinalizar ou pagar na entrega.
        </p>
      </div>

      {/* 1. Payment Option Selection (Sem Pagamento, Parcial, Total) */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
          Modalidade de Entrada / Liquidação
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => {
              setPaymentOption("Sem Pagamento");
              setValPagoInput(0);
            }}
            className={cn(
              "p-3.5 rounded-xl border text-xs font-bold text-left transition-all space-y-1",
              paymentOption === "Sem Pagamento"
                ? "bg-primary/10 border-primary text-primary shadow-sm"
                : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
            )}
          >
            <span className="block font-extrabold text-sm">A Pagar na Entrega</span>
            <span className="text-[11px] font-normal opacity-80 block">
              Sem pagamento imediato (Fatura a Cobrar)
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPaymentOption("Pagamento Parcial");
              if (valPagoInput <= 0) setValPagoInput(Math.round(totalFinal * 0.5));
            }}
            className={cn(
              "p-3.5 rounded-xl border text-xs font-bold text-left transition-all space-y-1",
              paymentOption === "Pagamento Parcial"
                ? "bg-amber-100 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm"
                : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
            )}
          >
            <span className="block font-extrabold text-sm">Pagamento Parcial (Sinal)</span>
            <span className="text-[11px] font-normal opacity-80 block">
              Registar valor adiantado pelo cliente
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPaymentOption("Pagamento Total")}
            className={cn(
              "p-3.5 rounded-xl border text-xs font-bold text-left transition-all space-y-1",
              paymentOption === "Pagamento Total"
                ? "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-sm"
                : "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
            )}
          >
            <span className="block font-extrabold text-sm">Pagamento Total (Liquidado)</span>
            <span className="text-[11px] font-normal opacity-80 block">
              Liquidação integral imediata
            </span>
          </button>
        </div>
      </div>

      {/* Partial Payment Amount Input */}
      {paymentOption === "Pagamento Parcial" && (
        <div className="p-4 bg-amber-50/70 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-2">
          <label className="text-xs font-bold text-amber-900 dark:text-amber-300 block">
            Valor Pago Adiantado *
          </label>
          <input
            type="number"
            min="1"
            max={totalFinal}
            value={valPagoInput}
            onChange={(e) => setValPagoInput(Math.min(totalFinal, parseFloat(e.target.value) || 0))}
            className="w-full bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-base font-extrabold text-amber-900 dark:text-amber-100 outline-none focus:ring-2 focus:ring-amber-400"
          />
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            Saldo Restante a cobrar na entrega:{" "}
            <strong>{formatCurrency(saldoPendente)}</strong>
          </p>
        </div>
      )}

      {/* Payment Method details if payment is paid partially or fully */}
      {paymentOption !== "Sem Pagamento" && (
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-primary"
              >
                <option value="Dinheiro">Dinheiro (Numerário)</option>
                <option value="TPA / POS">TPA / POS (Multibanco)</option>
                <option value="Transferência">Transferência Bancária</option>
                <option value="Mixto">Mixto (Dinheiro + POS)</option>
              </select>
            </div>

            <div className="space-y-1.5 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
              <span className="text-xs text-gray-500 font-medium block">
                Resumo da Cobrança
              </span>
              <div className="flex justify-between items-center text-xs">
                <span>A Pagar Agora:</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                  {formatCurrency(valorEfetivoPago)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span>Saldo Pendente:</span>
                <span className="font-extrabold text-error text-sm">
                  {formatCurrency(saldoPendente)}
                </span>
              </div>
            </div>
          </div>

          {/* Dinheiro specifics (Amount received and Change) */}
          {paymentMethod === "Dinheiro" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">
                  Valor Entregue pelo Cliente
                </label>
                <input
                  type="number"
                  min={valorEfetivoPago}
                  value={amountReceived || ""}
                  onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                  placeholder={String(valorEfetivoPago)}
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm font-bold text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">
                  Troco a Devolver
                </label>
                <span className="font-black text-lg text-primary block py-1">
                  {formatCurrency(trocoCalculado)}
                </span>
              </div>
            </div>
          )}

          {/* Mixto Breakdown */}
          {paymentMethod === "Mixto" && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                Divisão do Pagamento Mixto (Total: {formatCurrency(valorEfetivoPago)})
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Valor em Dinheiro</label>
                  <input
                    type="number"
                    value={valorCashMixto || ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setValorCashMixto(v);
                      setValorPosMixto(Math.max(0, valorEfetivoPago - v));
                    }}
                    className="w-full bg-white dark:bg-gray-800 border rounded-lg p-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Valor no POS</label>
                  <input
                    type="number"
                    value={valorPosMixto || ""}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setValorPosMixto(v);
                      setValorCashMixto(Math.max(0, valorEfetivoPago - v));
                    }}
                    className="w-full bg-white dark:bg-gray-800 border rounded-lg p-2 text-sm font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bank / TRX details for non-cash payment methods */}
          {requiresTrxReference && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/40">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Código de Transação / Comprovativo *
                </label>
                <input
                  type="text"
                  value={codigoTransferencia}
                  onChange={(e) => setCodigoTransferencia(e.target.value)}
                  placeholder="Ex: TRX-982341"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Emissor / Titular da Conta *
                </label>
                <input
                  type="text"
                  value={emissor}
                  onChange={(e) => setEmissor(e.target.value)}
                  placeholder="Ex: João Pereira (BAI)"
                  className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-semibold"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

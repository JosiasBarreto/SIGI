import React, { useState, useEffect } from "react";
import Modal from "../../components/Common/Modal";
import SearchableClientSelect from "../../components/Common/SearchableClientSelect";
import DateTimePicker from "../../components/Common/DateTimePicker";
import {
  CreditCard,
  Banknote,
  Building2,
  Receipt,
  FileText,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Calculator
} from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { toast } from "react-toastify";

interface CaixaPOSPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  subtotal: number;
  desconto: number;
  totalIva: number;
  cartCount: number;
  clients: any[];
  selectedClient: string;
  setSelectedClient: (clientId: string) => void;
  tipoDocumento: "FR" | "PROFORMA";
  setTipoDocumento: (tipo: "FR" | "PROFORMA") => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  amountReceived: number;
  setAmountReceived: (val: number) => void;
  tipoPedido: "Imediato" | "Agendado";
  setTipoPedido: (tipo: "Imediato" | "Agendado") => void;
  dataEntrega: string;
  setDataEntrega: (val: string) => void;
  valorPago: string;
  setValorPago: (val: string) => void;
  codigoTransferencia: string;
  setCodigoTransferencia: (val: string) => void;
  emissor: string;
  setEmissor: (val: string) => void;
  valorCashMixto: number;
  setValorCashMixto: (val: number) => void;
  valorPosMixto: number;
  setValorPosMixto: (val: number) => void;
  isSubmitting: boolean;
  onConfirm: () => void;
  onEmitirProforma: () => void;
}

export default function CaixaPOSPaymentModal({
  isOpen,
  onClose,
  total,
  subtotal,
  desconto,
  totalIva,
  cartCount,
  clients,
  selectedClient,
  setSelectedClient,
  tipoDocumento,
  setTipoDocumento,
  paymentMethod,
  setPaymentMethod,
  amountReceived,
  setAmountReceived,
  tipoPedido,
  setTipoPedido,
  dataEntrega,
  setDataEntrega,
  valorPago,
  setValorPago,
  codigoTransferencia,
  setCodigoTransferencia,
  emissor,
  setEmissor,
  valorCashMixto,
  setValorCashMixto,
  valorPosMixto,
  setValorPosMixto,
  isSubmitting,
  onConfirm,
  onEmitirProforma,
}: CaixaPOSPaymentModalProps) {
  if (!isOpen) return null;

  const isProforma = tipoDocumento === "PROFORMA";
  const selectedClientObj = clients.find((c) => String(c.id) === String(selectedClient));

  // Payment amounts
  const isAgendado = tipoPedido === "Agendado";
  const valorALiquidar = isProforma ? 0 : (isAgendado && valorPago !== "" ? parseFloat(valorPago) || 0 : total);
  
  // Troco calculation
  const minimoDinheiro = paymentMethod === "Mixto" ? valorCashMixto : valorALiquidar;
  const troco = Math.max(0, amountReceived - minimoDinheiro);

  // Cash preset options
  const handleCashPreset = (addedValue: number) => {
    if (addedValue === 0) {
      setAmountReceived(valorALiquidar);
    } else {
      setAmountReceived(amountReceived + addedValue);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isProforma ? "Finalizar Pró-Forma / Orçamento" : "Finalizar Atendimento / Pagamento"}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-left">
        {/* Top Total Header */}
        <div className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Total a Liquidar ({cartCount} {cartCount === 1 ? "item" : "itens"})
            </span>
            <span className="text-2xl sm:text-3xl font-black text-primary">
              {formatCurrency(total)}
            </span>
          </div>

          {/* Document Type Selector */}
          <div className="flex items-center p-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <button
              type="button"
              onClick={() => setTipoDocumento("FR")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                !isProforma
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <Receipt size={14} /> Fatura Recibo
            </button>
            <button
              type="button"
              onClick={() => setTipoDocumento("PROFORMA")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                isProforma
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <FileText size={14} /> Pró-Forma
            </button>
          </div>
        </div>

        {/* Client & Order Type Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Client Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase flex items-center gap-1">
              <User size={13} className="text-primary" /> Cliente
            </label>
            <SearchableClientSelect
              clients={clients}
              selectedClientId={selectedClient}
              onSelectClient={(id) => setSelectedClient(id)}
            />
            {selectedClientObj && (
              <p className="text-[11px] text-gray-500">
                NIF: {selectedClientObj.nif || "N/A"} | Tel: {selectedClientObj.telefone || "N/A"}
              </p>
            )}
          </div>

          {/* Delivery / Execution Type */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase flex items-center gap-1">
              <Clock size={13} className="text-primary" /> Tipo de Atendimento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipoPedido("Imediato")}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  tipoPedido === "Imediato"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                Imediato (Balcão)
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipoPedido("Agendado");
                  if (!dataEntrega) {
                    const future = new Date(Date.now() + 3 * 3600 * 1000);
                    const tzOffset = future.getTimezoneOffset() * 60000;
                    setDataEntrega(new Date(future.getTime() - tzOffset).toISOString().slice(0, 16));
                  }
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  tipoPedido === "Agendado"
                    ? "bg-primary/10 border-primary text-primary"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                Agendado (Produção)
              </button>
            </div>
          </div>
        </div>

        {/* Scheduled date & initial deposit field if Agendado */}
        {isAgendado && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-3">
            <DateTimePicker
              value={dataEntrega}
              onChange={(val) => setDataEntrega(val)}
              label="Data e Hora de Entrega / Levantamento"
            />
            <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/60">
              <label className="text-xs font-bold text-amber-800 dark:text-amber-300 block mb-1">
                Valor do Sinal / Depósito Inicial (AOA)
              </label>
              <input
                type="number"
                placeholder="Insira o valor do sinal ou 0 se sem sinal..."
                value={valorPago}
                onChange={(e) => setValorPago(e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {/* Payment Methods Section (Only if NOT Proforma) */}
        {!isProforma ? (
          <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-800">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase block">
              Forma de Pagamento
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "Dinheiro", label: "Dinheiro", icon: Banknote },
                { id: "TPA / POS", label: "TPA / Multicaixa", icon: CreditCard },
                { id: "Transferência", label: "Transferência", icon: Building2 },
                { id: "Mixto", label: "Múltiplo / Misto", icon: Calculator },
              ].map((pm) => {
                const Icon = pm.icon;
                const isSel = paymentMethod === pm.id;
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(pm.id);
                      // NOTE: We DO NOT auto-fill amountReceived as requested by user!
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1.5 ${
                      isSel
                        ? "bg-primary text-white border-primary shadow-md scale-[1.02]"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary/50"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{pm.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dinheiro details */}
            {(paymentMethod === "Dinheiro" || paymentMethod === "Mixto") && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl space-y-3">
                {paymentMethod === "Mixto" && (
                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                        Valor em Dinheiro
                      </label>
                      <input
                        type="number"
                        value={valorCashMixto || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setValorCashMixto(val);
                          setValorPosMixto(Math.max(0, valorALiquidar - val));
                        }}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                        Valor em TPA / POS
                      </label>
                      <input
                        type="number"
                        value={valorPosMixto || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setValorPosMixto(val);
                          setValorCashMixto(Math.max(0, valorALiquidar - val));
                        }}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                      Valor Entregue pelo Cliente
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountReceived || ""}
                        onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl pl-3 pr-28 py-2.5 text-base font-extrabold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                        placeholder="Insira o valor recebido..."
                      />
                      <button
                        type="button"
                        onClick={() => setAmountReceived(minimoDinheiro)}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-primary hover:text-white text-gray-700 dark:text-gray-200 text-xs font-bold rounded-lg transition-all shadow-sm"
                        title="Preencher com o valor exato a pagar"
                      >
                        Valor Exato
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl min-w-[150px] text-right shrink-0">
                    <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase block">
                      Troco a Devolver
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(troco)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Transferência / POS Extra Fields */}
            {(paymentMethod === "Transferência" || paymentMethod === "TPA / POS" || paymentMethod === "Mixto") && (
              <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Valor Pago / Entrada pelo Cliente (AOA)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={`Total: ${total} AOA (ou insira valor pago)`}
                    value={valorPago}
                    onChange={(e) => setValorPago(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                      Titular / Emissor do Banco
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do Titular"
                      value={emissor}
                      onChange={(e) => setEmissor(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-gray-400 block mb-1">
                      Nº Comprovativo / Operação
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: TRF-883921 / POS-102"
                      value={codigoTransferencia}
                      onChange={(e) => setCodigoTransferencia(e.target.value)}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-xl space-y-1">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-300 block">
              Modo Fatura Pró-Forma
            </span>
            <p className="text-xs text-purple-700 dark:text-purple-400">
              O documento emitido será um orçamento/Pró-Forma sem movimentação de caixa ou liquidação financeira imediata.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Voltar ao Carrinho
          </button>

          {isProforma ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onEmitirProforma}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              <FileText size={16} />
              <span>{isSubmitting ? "Emitindo..." : "EMITIR PRÓ-FORMA"}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onConfirm}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 active:scale-95"
            >
              <CheckCircle size={16} />
              <span>{isSubmitting ? "Processando..." : "CONCLUIR ATENDIMENTO"}</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

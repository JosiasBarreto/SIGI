import React from 'react';
import { AlertTriangle, Package, Wrench, ArrowDownLeft, Loader2, X } from 'lucide-react';
import { ValidationSummary } from '../types';

interface ImportConfirmationModalProps {
  isOpen: boolean;
  isConfirming: boolean;
  summary: ValidationSummary;
  entradasStockCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ImportConfirmationModal: React.FC<ImportConfirmationModalProps> = ({
  isOpen,
  isConfirming,
  summary,
  entradasStockCount,
  onCancel,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Confirmar Importação?
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Operação com gravação definitiva de registos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumo do que será inserido */}
        <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 space-y-3 text-xs">
          <div className="text-gray-700 dark:text-gray-300 font-semibold">
            Serão processados e criados no sistema:
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700/60">
              <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <Package size={14} className="text-primary" />
                <span>Produtos (Consumo, Acabados e Revenda)</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {summary.produtos}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700/60">
              <div className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <Wrench size={14} className="text-emerald-600" />
                <span>Materiais (Equipamentos / Utensílios)</span>
              </div>
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {summary.materiais}
              </span>
            </div>

            {entradasStockCount > 0 && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-200">
                <div className="flex items-center gap-2">
                  <ArrowDownLeft size={14} className="text-blue-600" />
                  <span>Movimentações de stock inicial</span>
                </div>
                <span className="font-bold">{entradasStockCount}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed pt-1">
            As linhas validadas serão adicionadas ao catálogo e os movimentos de stock serão
            gerados nos respetivos armazéns.
          </p>
        </div>

        {/* Botões de Ação com proteção anti duplo clique */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            {isConfirming ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>A importar...</span>
              </>
            ) : (
              <span>Confirmar importação</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

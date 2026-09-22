import React from 'react';
import { CheckCircle2, Package, Wrench, ArrowDownLeft, Hash, Clock, ArrowRight } from 'lucide-react';
import { ImportFinalResult } from '../types';

interface ImportResultModalProps {
  isOpen: boolean;
  result: ImportFinalResult | null;
  onClose: () => void;
}

export const ImportResultModal: React.FC<ImportResultModalProps> = ({
  isOpen,
  result,
  onClose
}) => {
  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-scale-in text-center">
        {/* Ícone de Sucesso */}
        <div className="mx-auto w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        {/* Título */}
        <div className="space-y-1">
          <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Importação Concluída com Sucesso!
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {result.mensagem || 'O catálogo e os movimentos de stock foram atualizados.'}
          </p>
        </div>

        {/* Estatísticas Detalhadas */}
        <div className="bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 text-left space-y-2.5 text-xs">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700/50">
            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Package size={14} className="text-primary" />
              Produtos adicionados ao catálogo
            </span>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {result.produtosImportados}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-700/50">
            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Wrench size={14} className="text-emerald-600" />
              Materiais registados no sistema
            </span>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {result.materiaisImportados}
            </span>
          </div>

          {result.movimentosStock > 0 && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-200">
              <span className="flex items-center gap-2">
                <ArrowDownLeft size={14} className="text-blue-600" />
                Entradas de stock inicial processadas
              </span>
              <span className="font-bold">{result.movimentosStock}</span>
            </div>
          )}

          {/* Metadados da Operação */}
          <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between text-[11px] text-gray-400">
            <div className="flex items-center gap-1">
              <Hash size={11} />
              <span>Op: {result.codigoOperacao || 'REG-AUTO'}</span>
            </div>
            {result.timestamp && (
              <div className="flex items-center gap-1">
                <Clock size={11} />
                <span>{result.timestamp}</span>
              </div>
            )}
          </div>
        </div>

        {/* Botão de Fechar e Atualizar */}
        <button
          type="button"
          onClick={onClose}
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-sm transition-all"
        >
          <span>Concluir e Voltar ao Catálogo</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

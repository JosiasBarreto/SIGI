import React from 'react';
import { ValidationSummary } from '../types';
import { CheckCircle2, AlertCircle, AlertTriangle, Package, Wrench, Warehouse } from 'lucide-react';

interface ImportSummaryCardsProps {
  summary: ValidationSummary;
  entradasStockCount: number;
}

export const ImportSummaryCards: React.FC<ImportSummaryCardsProps> = ({
  summary,
  entradasStockCount
}) => {
  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 shadow-sm flex flex-wrap items-center justify-between gap-4">
      {/* Contadores principais */}
      <div className="flex flex-wrap items-center gap-6 text-xs">
        {/* Total */}
        <div className="flex items-center gap-2">
          <span className="text-gray-500 font-medium">Total de Artigos:</span>
          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm">
            {summary.total}
          </span>
        </div>

        {/* Separador */}
        <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

        {/* Válidos */}
        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
          <span className="text-gray-500 font-medium">Prontos:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {summary.validas}
          </span>
        </div>

        {/* Bloqueados / Erros (destaque apenas se houver pendências) */}
        {summary.erros > 0 ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50">
            <AlertCircle size={14} className="text-red-600 shrink-0" />
            <span className="font-semibold text-red-700 dark:text-red-300">
              {summary.erros} com campos em falta
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-gray-400">
            <span className="text-xs font-medium">Sem erros</span>
          </div>
        )}

        {/* Avisos */}
        {summary.avisos > 0 && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={14} className="shrink-0" />
            <span className="font-medium">{summary.avisos} avisos</span>
          </div>
        )}
      </div>

      {/* Subcategorias / Detalhes de Composição */}
      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1">
          <Package size={13} className="text-gray-400" />
          <span>{summary.produtos} produtos</span>
        </span>

        {summary.materiais > 0 && (
          <>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <span className="inline-flex items-center gap-1">
              <Wrench size={13} className="text-gray-400" />
              <span>{summary.materiais} materiais</span>
            </span>
          </>
        )}

        {entradasStockCount > 0 && (
          <>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <span className="inline-flex items-center gap-1 text-primary">
              <Warehouse size={13} />
              <span>{entradasStockCount} c/ stock inicial</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
};


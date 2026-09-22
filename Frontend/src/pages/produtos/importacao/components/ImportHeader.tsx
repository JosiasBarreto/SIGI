import React from 'react';
import { Download, Upload, HelpCircle, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { ImportStep, ReferenceData } from '../types';

interface ImportHeaderProps {
  currentStep: ImportStep;
  refData: ReferenceData;
  onBaixarModelo: () => void;
  onRecarregarReferencias: () => void;
  onOpenAjuda?: () => void;
  onCarregarFicheiroClick?: () => void;
}

export const ImportHeader: React.FC<ImportHeaderProps> = ({
  refData,
  onBaixarModelo,
  onRecarregarReferencias,
  onOpenAjuda,
  onCarregarFicheiroClick
}) => {
  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Título e Subtítulo */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Importação de Catálogo
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Importe produtos e materiais em lote a partir do Excel ou edite diretamente na grelha.
            </p>
          </div>
        </div>

        {/* Ações do Topo */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenAjuda && (
            <button
              type="button"
              onClick={onOpenAjuda}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 transition-colors"
              title="Consultar regras e campos obrigatórios"
            >
              <HelpCircle size={14} className="text-gray-400" />
              <span>Regras de Importação</span>
            </button>
          )}

          <button
            type="button"
            onClick={onBaixarModelo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-semibold text-gray-800 dark:text-gray-200 transition-colors"
            title="Descarregar folha de cálculo modelo oficial (.xlsx)"
          >
            <Download size={14} className="text-gray-500" />
            <span>Modelo Excel (.xlsx)</span>
          </button>

          {onCarregarFicheiroClick && (
            <button
              type="button"
              onClick={onCarregarFicheiroClick}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Upload size={14} />
              <span>Carregar Ficheiro</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRecarregarReferencias}
            disabled={refData.isLoading}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="Atualizar dados do sistema (categorias, unidades, armazéns)"
          >
            <RefreshCw size={14} className={refData.isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};


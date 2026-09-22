import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { ValidationRowResult, ReferenceData, ImportRowNormalized } from '../types';
import { ValidationRow } from './ValidationRow';

interface ValidationTableProps {
  resultados: ValidationRowResult[];
  refData?: Partial<ReferenceData>;
  onUpdateRow?: (linha: number, updatedFields: Partial<ImportRowNormalized>) => void;
  onAddRow?: () => void;
  onLoadExamples?: () => void;
  onDeleteRow?: (linha: number) => void;
  onDuplicateRow?: (linha: number) => void;
  onExportExcel?: () => void;
}

type FilterStatus = 'todas' | 'validas' | 'bloqueadas' | 'avisos';

export const ValidationTable: React.FC<ValidationTableProps> = ({
  resultados,
  refData,
  onUpdateRow,
  onAddRow,
  onLoadExamples,
  onDeleteRow,
  onDuplicateRow,
  onExportExcel
}) => {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Filtragem e pesquisa combinada
  const filteredRows = useMemo(() => {
    return resultados.filter(item => {
      const hasErros = item.erros.length > 0 || !item.valido;
      const hasAvisos = item.alertas.length > 0;

      if (filterStatus === 'validas' && hasErros) return false;
      if (filterStatus === 'bloqueadas' && !hasErros) return false;
      if (filterStatus === 'avisos' && !hasAvisos) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const nome = (item.dados.nome || '').toLowerCase();
      const codigo = (item.dados.codigo || '').toLowerCase();
      const tipo = (item.dados.tipo || '').toLowerCase();
      const categoria = (item.dados.categoria || '').toLowerCase();
      const ocorrencias = [...item.erros, ...item.alertas].join(' ').toLowerCase();

      return (
        nome.includes(q) ||
        codigo.includes(q) ||
        tipo.includes(q) ||
        categoria.includes(q) ||
        ocorrencias.includes(q)
      );
    });
  }, [resultados, filterStatus, searchQuery]);

  // Contagens para os botões de filtro
  const counts = useMemo(() => {
    const total = resultados.length;
    const bloqueadas = resultados.filter(r => r.erros.length > 0 || !r.valido).length;
    const validas = total - bloqueadas;
    const avisos = resultados.filter(r => r.alertas.length > 0).length;
    return { total, validas, bloqueadas, avisos };
  }, [resultados]);

  // Paginação
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Barra de Filtros e Ações */}
      <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filtros em Abas Discretas */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => handleFilterChange('todas')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              filterStatus === 'todas'
                ? 'bg-white dark:bg-surface-dark text-gray-900 dark:text-gray-100 shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            Todas ({counts.total})
          </button>

          <button
            type="button"
            onClick={() => handleFilterChange('validas')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
              filterStatus === 'validas'
                ? 'bg-white dark:bg-surface-dark text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-gray-500 hover:text-emerald-700 dark:text-gray-400'
            }`}
          >
            Prontas ({counts.validas})
          </button>

          {counts.bloqueadas > 0 && (
            <button
              type="button"
              onClick={() => handleFilterChange('bloqueadas')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterStatus === 'bloqueadas'
                  ? 'bg-white dark:bg-surface-dark text-red-700 dark:text-red-400 shadow-xs'
                  : 'text-red-600 hover:text-red-700 dark:text-red-400'
              }`}
            >
              Com Pendências ({counts.bloqueadas})
            </button>
          )}

          {counts.avisos > 0 && (
            <button
              type="button"
              onClick={() => handleFilterChange('avisos')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterStatus === 'avisos'
                  ? 'bg-white dark:bg-surface-dark text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-gray-500 hover:text-amber-700 dark:text-gray-400'
              }`}
            >
              Avisos ({counts.avisos})
            </button>
          )}
        </div>

        {/* Ações e Pesquisa */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pesquisa */}
          <div className="relative w-full sm:w-56">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Pesquisar artigo..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-gray-900 dark:text-gray-100"
            />
          </div>

          {onLoadExamples && (
            <button
              type="button"
              onClick={onLoadExamples}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Carregar artigos de demonstração"
            >
              <Sparkles size={13} className="text-amber-500" />
              <span>Exemplos</span>
            </button>
          )}

          {onExportExcel && (
            <button
              type="button"
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title="Exportar dados atuais para Excel"
            >
              <Download size={13} className="text-gray-500" />
              <span>Exportar</span>
            </button>
          )}

          {onAddRow && (
            <button
              type="button"
              onClick={onAddRow}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-medium shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>Adicionar Artigo</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Dados Profissional */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1020px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/70 border-b border-gray-200 dark:border-gray-700 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <th className="py-2.5 px-3 text-center w-10">#</th>
              <th className="py-2.5 px-2 w-32">Tipo</th>
              <th className="py-2.5 px-2 min-w-[200px]">Artigo / Designação</th>
              <th className="py-2.5 px-2 w-44">Categoria</th>
              <th className="py-2.5 px-2 w-28">Unidade</th>
              <th className="py-2.5 px-2 w-36">Serviço</th>
              <th className="py-2.5 px-2 w-28 text-right">Preço</th>
              <th className="py-2.5 px-2 w-24 text-center">Stock Inicial</th>
              <th className="py-2.5 px-2 w-36">Armazém</th>
              <th className="py-2.5 px-2 text-center w-24">Estado</th>
              <th className="py-2.5 px-3 text-right w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedRows.length > 0 ? (
              paginatedRows.map(row => (
                <ValidationRow
                  key={row.linha}
                  resultado={row}
                  refData={refData}
                  onUpdateRow={onUpdateRow}
                  onDeleteRow={onDeleteRow}
                  onDuplicateRow={onDuplicateRow}
                />
              ))
            ) : (
              <tr>
                <td colSpan={11} className="py-12 text-center text-xs text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2.5">
                    <FileSpreadsheet size={28} className="text-gray-300 dark:text-gray-600" />
                    <div>
                      <p className="font-semibold text-gray-600 dark:text-gray-300 text-sm">
                        Nenhum artigo encontrado.
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Adicione um artigo ou carregue um ficheiro Excel.
                      </p>
                    </div>
                    {onAddRow && (
                      <button
                        type="button"
                        onClick={onAddRow}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-medium shadow-xs hover:bg-primary-hover transition-all mt-1"
                      >
                        <Plus size={13} />
                        <span>Adicionar Primeiro Artigo</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {filteredRows.length > pageSize && (
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500">
          <div>
            A mostrar {paginatedRows.length} de {filteredRows.length} artigos
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

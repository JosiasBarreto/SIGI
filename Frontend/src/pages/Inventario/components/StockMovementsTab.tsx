import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  SlidersHorizontal, 
  Filter,
  ArrowRightLeft,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { warehouseService } from '../../../services';
import { MovimentoItem } from '../types';
import { formatCurrency } from '../../../lib/utils';

export const StockMovementsTab: React.FC = () => {
  const [movimentos, setMovimentos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('all');

  const carregarMovimentos = async () => {
    setIsLoading(true);
    try {
      const data = await warehouseService.getMovimentacoes({ per_page: 500 });
      const list = Array.isArray(data) ? data : (data?.items || data?.data || []);
      setMovimentos(list);
    } catch (err) {
      console.error('Erro ao carregar movimentações:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarMovimentos();
  }, []);

  const filtered = useMemo(() => {
    return movimentos.filter(m => {
      const tipoStr = String(m.tipo || m.tipo_movimento || '').toLowerCase();
      if (tipoFilter !== 'all' && !tipoStr.includes(tipoFilter.toLowerCase())) {
        return false;
      }
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        const nome = String(m.produto_nome || m.item_nome || m.nome || '').toLowerCase();
        const obs = String(m.observacao || m.justificacao || '').toLowerCase();
        const orig = String(m.origem || '').toLowerCase();
        if (!nome.includes(t) && !obs.includes(t) && !orig.includes(t)) {
          return false;
        }
      }
      return true;
    });
  }, [movimentos, tipoFilter, searchTerm]);

  const renderBadgeTipo = (tipo: string) => {
    const t = (tipo || '').toLowerCase();
    if (t.includes('entrada')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
          <ArrowDownLeft size={13} className="mr-1" />
          Entrada
        </span>
      );
    }
    if (t.includes('saida') || t.includes('saída')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
          <ArrowUpRight size={13} className="mr-1" />
          Saída
        </span>
      );
    }
    if (t.includes('ajuste')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
          <SlidersHorizontal size={13} className="mr-1" />
          Ajuste
        </span>
      );
    }
    if (t.includes('transfer')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
          <ArrowRightLeft size={13} className="mr-1" />
          Transferência
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
        {tipo || 'Geral'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with search and filters */}
      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Pesquisar movimentação por item, documento ou justificação..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={tipoFilter}
            onChange={e => setTipoFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
          >
            <option value="all">Todos os Movimentos</option>
            <option value="entrada">Entradas</option>
            <option value="saida">Saídas</option>
            <option value="ajuste">Ajustes de Inventário</option>
            <option value="transfer">Transferências</option>
          </select>
        </div>

        <button
          onClick={carregarMovimentos}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          title="Atualizar histórico"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Movements Table */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 text-xs">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Artigo / Item</th>
                <th className="px-4 py-3">Armazém</th>
                <th className="px-4 py-3 text-right">Quantidade</th>
                <th className="px-4 py-3">Origem / Documento</th>
                <th className="px-4 py-3">Operador / Utilizador</th>
                <th className="px-4 py-3">Observações / Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {filtered.map((m, idx) => {
                const dataFormatada = m.created_at 
                  ? new Date(m.created_at).toLocaleString('pt-PT') 
                  : (m.data ? new Date(m.data).toLocaleString('pt-PT') : '-');

                return (
                  <tr key={m.id || idx} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                      {dataFormatada}
                    </td>
                    <td className="px-4 py-3">
                      {renderBadgeTipo(m.tipo || m.tipo_movimento)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                      {m.produto_nome || m.item_nome || m.nome || `Item #${m.produto_id || m.referencia_id || '-'}`}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                      {m.armazem_nome || m.armazem?.nome || `Armazém #${m.armazem_id || 1}`}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs font-bold text-gray-900 dark:text-white">
                      {m.quantidade} {m.unidade_medida || 'UN'}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {m.origem || 'Interno'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {m.utilizador_nome || m.created_by_nome || 'Sistema'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[250px] truncate" title={m.observacao || m.justificacao}>
                      {m.observacao || m.justificacao || '-'}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    <History className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={36} />
                    <p className="font-semibold">Nenhuma movimentação localizada.</p>
                    <p className="text-xs mt-1">Os movimentos efetuados no armazém serão listados aqui com rastreabilidade total.</p>
                  </td>
                </tr>
              )}

              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500">
                    <RefreshCw className="animate-spin mx-auto mb-2 text-primary" size={24} />
                    A carregar livro de movimentações...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

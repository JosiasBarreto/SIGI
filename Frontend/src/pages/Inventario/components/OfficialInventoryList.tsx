import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  Warehouse,
  Calendar,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Boxes,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { InventarioSessao, InventarioEstado, InventarioTipo } from '../types';
import { inventoryAuditService } from '../../../services/inventoryAuditService';
import { formatCurrency } from '../../../lib/utils';
import { NewInventoryModal } from './NewInventoryModal';
import { toast } from 'react-toastify';

interface OfficialInventoryListProps {
  armazens: any[];
  onSelectInventory: (id: number) => void;
  onStockUpdated: () => void;
}

const ESTADOS_FILTRO: { key: 'TODOS' | InventarioEstado; label: string; color: string }[] = [
  { key: 'TODOS', label: 'Todos', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' },
  { key: 'RASCUNHO', label: 'Rascunho', color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300' },
  { key: 'EM_CONTAGEM', label: 'Em Contagem', color: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300' },
  { key: 'EM_CONFERENCIA', label: 'Em Conferência', color: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300' },
  { key: 'APROVADO', label: 'Aprovado', color: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300' },
  { key: 'APLICADO', label: 'Aplicado', color: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' },
  { key: 'CANCELADO', label: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300' },
];

export const OfficialInventoryList: React.FC<OfficialInventoryListProps> = ({
  armazens,
  onSelectInventory,
  onStockUpdated
}) => {
  const [estadoFilter, setEstadoFilter] = useState<'TODOS' | InventarioEstado>('TODOS');
  const [armazemFilter, setArmazemFilter] = useState<string>('TODOS');
  const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  // Busca lista de inventários
  const {
    data: listData,
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['inventarios-oficiais-list'],
    queryFn: () => inventoryAuditService.listar({ per_page: 500 }),
    refetchInterval: 30000,
  });

  const rawSessions = listData?.items || [];

  // Filtragem dos inventários
  const filteredSessions = useMemo(() => {
    return rawSessions.filter(sess => {
      if (estadoFilter !== 'TODOS' && sess.estado !== estadoFilter) {
        return false;
      }
      if (armazemFilter !== 'TODOS' && String(sess.armazem_id) !== armazemFilter) {
        return false;
      }
      if (tipoFilter !== 'TODOS' && sess.tipo !== tipoFilter) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchObs = sess.observacao && sess.observacao.toLowerCase().includes(term);
        const matchArm = sess.armazem_nome && sess.armazem_nome.toLowerCase().includes(term);
        const matchId = String(sess.id).includes(term);
        if (!matchObs && !matchArm && !matchId) return false;
      }
      return true;
    });
  }, [rawSessions, estadoFilter, armazemFilter, tipoFilter, searchTerm]);

  // Estatísticas dos inventários
  const stats = useMemo(() => {
    const total = rawSessions.length;
    const emAndamento = rawSessions.filter(s => s.estado === 'EM_CONTAGEM' || s.estado === 'EM_CONFERENCIA').length;
    const aplicados = rawSessions.filter(s => s.estado === 'APLICADO').length;
    const aprovados = rawSessions.filter(s => s.estado === 'APROVADO').length;
    return { total, emAndamento, aplicados, aprovados };
  }, [rawSessions]);

  const handleExportExcel = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      toast.info('A descarregar Excel oficial...', { autoClose: 2000 });
      await inventoryAuditService.exportarExcel(id);
      toast.success('Ficheiro Excel gerado com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao descarregar Excel.');
    }
  };

  const handleExportPdf = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      toast.info('A descarregar relatório PDF...', { autoClose: 2000 });
      await inventoryAuditService.exportarPdf(id);
      toast.success('Relatório PDF gerado com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao descarregar PDF.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck size={20} className="text-primary" />
            Sessões Oficiais de Inventário & Auditoria
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Processo formal de conferência cega, snapshot congelado, transações atómicas e homologação de desvios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Atualizar lista"
          >
            <RefreshCw size={16} className={isRefetching ? 'animate-spin text-primary' : ''} />
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all hover:scale-[1.01]"
          >
            <Plus size={16} />
            Novo Inventário Oficial
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total de Inventários
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {stats.total}
            </span>
            <span className="text-xs text-gray-500 font-semibold">sessões</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider block flex items-center gap-1">
            <Clock size={13} /> Em Andamento
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {stats.emAndamento}
            </span>
            <span className="text-xs text-gray-500 font-semibold">contagem / conferência</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-purple-500 uppercase tracking-wider block flex items-center gap-1">
            <ShieldCheck size={13} /> Aprovados
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {stats.aprovados}
            </span>
            <span className="text-xs text-gray-500 font-semibold">prontos p/ aplicar</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block flex items-center gap-1">
            <CheckCircle2 size={13} /> Aplicados no Stock
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.aplicados}
            </span>
            <span className="text-xs text-gray-500 font-semibold">arquivados</span>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar (Backend UI/UX Recommendation) */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
        {/* Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-gray-400 mr-2 shrink-0">
            Estado:
          </span>
          {ESTADOS_FILTRO.map((filtro) => {
            const isSelected = estadoFilter === filtro.key;
            return (
              <button
                key={filtro.key}
                type="button"
                onClick={() => setEstadoFilter(filtro.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20 scale-[1.02]'
                    : `${filtro.color} hover:opacity-80`
                }`}
              >
                {filtro.label}
              </button>
            );
          })}
        </div>

        {/* Search, Armazém and Tipo Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar por ID, armazém ou notas de auditoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>

          <select
            value={armazemFilter}
            onChange={(e) => setArmazemFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="TODOS">Todos os Armazéns</option>
            {armazens.map((arm) => (
              <option key={arm.id} value={String(arm.id)}>
                {arm.nome}
              </option>
            ))}
          </select>

          <select
            value={tipoFilter}
            onChange={(e) => setTipoFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 text-xs bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 outline-none"
          >
            <option value="TODOS">Todos os Tipos</option>
            <option value="COMPLETO">Inventário Completo</option>
            <option value="PARCIAL">Inventário Parcial</option>
          </select>
        </div>
      </div>

      {/* Table of Inventories */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold">A carregar sessões de inventário...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ClipboardCheck size={36} className="mx-auto text-gray-300 dark:text-gray-600" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              Nenhuma sessão de inventário encontrada
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Crie um novo inventário de stock para congelar o snapshot do armazém e iniciar a contagem física.
            </p>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow transition-all hover:bg-primary/90"
            >
              + Criar Primeiro Inventário
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-gray-500 font-bold">
                  <th className="py-3 px-4">ID & Data</th>
                  <th className="py-3 px-4">Armazém</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4 text-center w-40">Progresso da Contagem</th>
                  <th className="py-3 px-4 text-right">Divergências</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {filteredSessions.map((sessao) => {
                  const perc = sessao.percentagem_concluida ?? 0;
                  return (
                    <tr
                      key={sessao.id}
                      onClick={() => onSelectInventory(sessao.id)}
                      className="hover:bg-primary/5 dark:hover:bg-primary/5 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-gray-900 dark:text-white block group-hover:text-primary transition-colors">
                          #{sessao.id}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {sessao.data_inventario}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-gray-900 dark:text-white block">
                          {sessao.armazem_nome || `Armazém #${sessao.armazem_id}`}
                        </span>
                        {sessao.observacao && (
                          <span className="text-[10px] text-gray-400 line-clamp-1">
                            {sessao.observacao}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          {sessao.tipo === 'COMPLETO' ? 'Completo' : 'Parcial'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="w-full">
                          <div className="flex justify-between text-[10px] font-bold mb-1">
                            <span className="text-gray-500">
                              {sessao.itens_contados ?? 0} / {sessao.total_itens ?? 0}
                            </span>
                            <span className="text-primary">{perc}%</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full transition-all duration-500"
                              style={{ width: `${perc}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        {(sessao.total_divergencias ?? 0) > 0 ? (
                          <div>
                            <span className="font-mono font-bold text-amber-600 dark:text-amber-400 block">
                              {sessao.total_divergencias} desvios
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {formatCurrency(sessao.impacto_financeiro_liquido || 0)}
                            </span>
                          </div>
                        ) : sessao.estado === 'RASCUNHO' ? (
                          <span className="text-gray-400 italic">Pendente</span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[11px]">
                            Sem Desvios
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase ${
                          sessao.estado === 'RASCUNHO' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' :
                          sessao.estado === 'EM_CONTAGEM' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 ring-2 ring-blue-500/20' :
                          sessao.estado === 'EM_CONFERENCIA' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 ring-2 ring-amber-500/20' :
                          sessao.estado === 'APROVADO' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300' :
                          sessao.estado === 'APLICADO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {sessao.estado.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleExportExcel(e, sessao.id)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                            title="Exportar Excel (.xlsx)"
                          >
                            <FileSpreadsheet size={15} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleExportPdf(e, sessao.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Exportar PDF Oficial"
                          >
                            <FileText size={15} />
                          </button>

                          <button
                            type="button"
                            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors ml-1"
                          >
                            Abrir
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Criação de Inventário */}
      <NewInventoryModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        armazens={armazens}
        onCreated={(newId) => {
          refetch();
          onSelectInventory(newId);
        }}
      />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Download, 
  Printer, 
  ArrowRightLeft, 
  ClipboardCheck, 
  AlertOctagon, 
  ShieldAlert, 
  SlidersHorizontal,
  Plus,
  RefreshCw,
  TrendingDown,
  AlertTriangle,
  Boxes,
  CheckCircle2
} from 'lucide-react';
import { InventoryItem, StockStatus, ItemType } from '../types';
import { formatCurrency } from '../../../lib/utils';
import { inventoryService } from '../../../services/inventoryService';
import { toast } from 'react-toastify';

interface StockOverviewTabProps {
  items: InventoryItem[];
  armazens: any[];
  isLoading: boolean;
  onRefresh: () => void;
  onStartContagem: () => void;
  onOpenTransfer: (item?: InventoryItem) => void;
  onOpenSingleAdjust: (item: InventoryItem) => void;
  onOpenQuarantine: (item?: InventoryItem) => void;
}

export const StockOverviewTab: React.FC<StockOverviewTabProps> = ({
  items,
  armazens,
  isLoading,
  onRefresh,
  onStartContagem,
  onOpenTransfer,
  onOpenSingleAdjust,
  onOpenQuarantine
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArmazem, setSelectedArmazem] = useState<string>('all');
  const [selectedTipo, setSelectedTipo] = useState<string>('all');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Categorias únicas
  const categorias = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      if (it.categoria) set.add(it.categoria);
    });
    return Array.from(set).sort();
  }, [items]);

  // Estatísticas calculadas
  const stats = useMemo(() => {
    let valorTotal = 0;
    let criticos = 0;
    let esgotados = 0;
    let baixos = 0;
    let normais = 0;

    items.forEach(it => {
      valorTotal += it.valor_total;
      if (it.status_stock === 'Esgotado') esgotados++;
      else if (it.status_stock === 'Critico') criticos++;
      else if (it.status_stock === 'Baixo') baixos++;
      else normais++;
    });

    return {
      total: items.length,
      valorTotal,
      criticosTotal: criticos + baixos,
      esgotados,
      normais
    };
  }, [items]);

  // Filtros aplicados
  const filteredItems = useMemo(() => {
    return items.filter(it => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchNome = it.nome.toLowerCase().includes(term);
        const matchCod = it.codigo.toLowerCase().includes(term);
        const matchCat = it.categoria.toLowerCase().includes(term);
        if (!matchNome && !matchCod && !matchCat) return false;
      }

      if (selectedArmazem !== 'all' && String(it.armazem_id) !== selectedArmazem) {
        return false;
      }

      if (selectedTipo !== 'all' && it.tipo !== selectedTipo) {
        return false;
      }

      if (selectedCategoria !== 'all' && it.categoria !== selectedCategoria) {
        return false;
      }

      if (selectedStatus !== 'all') {
        if (selectedStatus === 'CriticosTotal') {
          if (it.status_stock !== 'Critico' && it.status_stock !== 'Baixo') return false;
        } else if (it.status_stock !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [items, searchTerm, selectedArmazem, selectedTipo, selectedCategoria, selectedStatus]);

  const handleExportExcel = () => {
    const armNome = selectedArmazem !== 'all' 
      ? armazens.find(a => String(a.id) === selectedArmazem)?.nome 
      : undefined;
    inventoryService.exportarInventarioExcel(filteredItems, armNome);
    toast.success('Balanço de inventário exportado para Excel com sucesso!');
  };

  const handlePrintFicha = (modoAssistido = false) => {
    const armNome = selectedArmazem !== 'all' 
      ? armazens.find(a => String(a.id) === selectedArmazem)?.nome 
      : undefined;
    inventoryService.imprimirFichaContagemCega(filteredItems, armNome, modoAssistido);
    toast.info('Folha de contagem física gerada em PDF.');
  };

  const renderBadgeStatus = (status: StockStatus) => {
    switch (status) {
      case 'Esgotado':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 mr-1.5"></span>
            Esgotado
          </span>
        );
      case 'Critico':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5 animate-pulse"></span>
            Crítico
          </span>
        );
      case 'Baixo':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600 mr-1.5"></span>
            Abaixo Mín.
          </span>
        );
      case 'Excesso':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            Excesso
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            Normal
          </span>
        );
    }
  };

  const renderBadgeTipo = (tipo: ItemType) => {
    switch (tipo) {
      case 'Consumivel':
        return <span className="text-xs px-2 py-0.5 rounded bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800">Consumível</span>;
      case 'Acabado':
        return <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">Acabado</span>;
      case 'Revenda':
        return <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">Revenda</span>;
      case 'Material':
        return <span className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Material</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => setSelectedStatus('all')}
          className={`p-4 rounded-xl border bg-white dark:bg-surface-dark transition-all cursor-pointer hover:shadow-md ${
            selectedStatus === 'all' ? 'border-primary ring-1 ring-primary/50' : 'border-gray-200 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Artigos Catalogados</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.total}</h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Boxes size={22} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Total de referências ativas</p>
        </div>

        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valor em Stock</p>
              <h3 className="text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {formatCurrency(stats.valorTotal)}
              </h3>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-xl">
              <Package size={22} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Avaliação de custo de aquisição</p>
        </div>

        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'CriticosTotal' ? 'all' : 'CriticosTotal')}
          className={`p-4 rounded-xl border bg-white dark:bg-surface-dark transition-all cursor-pointer hover:shadow-md ${
            selectedStatus === 'CriticosTotal' ? 'border-amber-500 ring-1 ring-amber-500/50' : 'border-gray-200 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Stock Baixo / Crítico</p>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.criticosTotal}</h3>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-950/40 text-amber-600 rounded-xl">
              <AlertTriangle size={22} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Requer reposição urgente</p>
        </div>

        <div 
          onClick={() => setSelectedStatus(selectedStatus === 'Esgotado' ? 'all' : 'Esgotado')}
          className={`p-4 rounded-xl border bg-white dark:bg-surface-dark transition-all cursor-pointer hover:shadow-md ${
            selectedStatus === 'Esgotado' ? 'border-red-500 ring-1 ring-red-500/50' : 'border-gray-200 dark:border-gray-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-red-700 dark:text-red-400 uppercase tracking-wider">Rutura / Esgotados</p>
              <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{stats.esgotados}</h3>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-950/40 text-red-600 rounded-xl">
              <AlertOctagon size={22} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Saldo físico nulo ou negativo</p>
        </div>
      </div>

      {/* Action Bar & Quick Actions */}
      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={onStartContagem}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-sm shadow transition"
          >
            <ClipboardCheck size={18} />
            Iniciar Contagem Física (Balanço)
          </button>

          <button
            onClick={() => onOpenTransfer()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold text-sm transition"
          >
            <ArrowRightLeft size={16} />
            Transferência Entre Armazéns
          </button>

          <button
            onClick={() => onOpenQuarantine()}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg font-semibold text-sm transition border border-amber-200 dark:border-amber-800/60"
          >
            <ShieldAlert size={16} />
            Isolar em Quarentena
          </button>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={() => handlePrintFicha(false)}
            title="Exportar folha de contagem física cega para inventário"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <Printer size={15} />
            Folha Cega (PDF)
          </button>

          <button
            onClick={handleExportExcel}
            title="Descarregar folha de cálculo Excel com balanço de inventário"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 rounded-lg transition"
          >
            <Download size={15} />
            Exportar Excel
          </button>

          <button
            onClick={onRefresh}
            title="Atualizar dados de stock"
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Pesquisar por designação, código de artigo ou categoria..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <select
              value={selectedArmazem}
              onChange={e => setSelectedArmazem(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-gray-200"
            >
              <option value="all">Todos os Armazéns</option>
              {armazens.map(a => (
                <option key={a.id} value={String(a.id)}>{a.nome}</option>
              ))}
            </select>

            <select
              value={selectedTipo}
              onChange={e => setSelectedTipo(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-gray-200"
            >
              <option value="all">Todos os Tipos</option>
              <option value="Consumivel">Ingrediente / Consumível</option>
              <option value="Acabado">Produto Acabado</option>
              <option value="Revenda">Produto de Revenda</option>
              <option value="Material">Material Reutilizável</option>
            </select>

            <select
              value={selectedCategoria}
              onChange={e => setSelectedCategoria(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-gray-200"
            >
              <option value="all">Todas Categorias</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 dark:text-gray-200"
            >
              <option value="all">Todos os Estados</option>
              <option value="Normal">Normal</option>
              <option value="CriticosTotal">Baixo / Crítico</option>
              <option value="Esgotado">Esgotado / Rutura</option>
              <option value="Excesso">Excesso de Stock</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
          <span>A apresentar <strong>{filteredItems.length}</strong> de <strong>{items.length}</strong> artigos</span>
          {(searchTerm || selectedArmazem !== 'all' || selectedTipo !== 'all' || selectedCategoria !== 'all' || selectedStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedArmazem('all');
                setSelectedTipo('all');
                setSelectedCategoria('all');
                setSelectedStatus('all');
              }}
              className="text-primary hover:underline font-semibold"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 text-xs">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Artigo / Designação</th>
                <th className="px-4 py-3">Tipo / Categoria</th>
                <th className="px-4 py-3">Armazém</th>
                <th className="px-4 py-3 text-right">Saldo Atual</th>
                <th className="px-4 py-3 text-right">Stock Mín.</th>
                <th className="px-4 py-3 text-right">Custo Médio</th>
                <th className="px-4 py-3 text-right">Valor Total</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {item.codigo}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-gray-900 dark:text-white">{item.nome}</div>
                    {item.lote && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">Lote: {item.lote}</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-col gap-1 items-start">
                      {renderBadgeTipo(item.tipo)}
                      <span className="text-xs text-gray-500 truncate max-w-[130px]">{item.categoria}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
                    {item.armazem_nome}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-bold text-gray-900 dark:text-white">
                    {item.stock_atual} <span className="text-xs font-normal text-gray-500">{item.unidade_medida}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-500">
                    {item.stock_minimo} {item.unidade_medida}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs text-gray-700 dark:text-gray-300">
                    {formatCurrency(item.preco_compra)}
                  </td>
                  <td className="px-4 py-3.5 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(item.valor_total)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    {renderBadgeStatus(item.status_stock)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onOpenSingleAdjust(item)}
                        title="Ajustar saldo fisicamente com justificação"
                        className="p-1.5 text-gray-600 hover:text-primary hover:bg-primary/10 rounded-md transition"
                      >
                        <SlidersHorizontal size={15} />
                      </button>
                      <button
                        onClick={() => onOpenTransfer(item)}
                        title="Transferir stock para outro armazém"
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition"
                      >
                        <ArrowRightLeft size={15} />
                      </button>
                      <button
                        onClick={() => onOpenQuarantine(item)}
                        title="Isolar item com avaria ou vencimento para Quarentena"
                        className="p-1.5 text-gray-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-md transition"
                      >
                        <ShieldAlert size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500">
                    <Package className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={36} />
                    <p className="font-semibold">Nenhum artigo localizado para os filtros selecionados.</p>
                    <p className="text-xs mt-1">Experimente alterar os critérios de pesquisa ou armazém.</p>
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

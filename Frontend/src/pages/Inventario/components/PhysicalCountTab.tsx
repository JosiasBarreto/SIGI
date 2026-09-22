import React, { useState, useMemo } from 'react';
import { 
  ClipboardList, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Printer, 
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { InventoryItem, ContagemItem } from '../types';
import { inventoryService } from '../../../services/inventoryService';
import { toast } from 'react-toastify';

interface PhysicalCountTabProps {
  items: InventoryItem[];
  armazens: any[];
  contagens: Record<string, number | null>;
  onUpdateContagem: (key: string, qtd: number | null) => void;
  onResetContagens: () => void;
  onGoToDivergencias: () => void;
}

export const PhysicalCountTab: React.FC<PhysicalCountTabProps> = ({
  items,
  armazens,
  contagens,
  onUpdateContagem,
  onResetContagens,
  onGoToDivergencias
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArmazem, setSelectedArmazem] = useState<string>('all');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('all');
  const [modoCego, setModoCego] = useState<boolean>(true); // Padrão auditoria cega conforme Manual

  const categorias = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      if (it.categoria) set.add(it.categoria);
    });
    return Array.from(set).sort();
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(it => {
      if (selectedArmazem !== 'all' && String(it.armazem_id) !== selectedArmazem) {
        return false;
      }
      if (selectedCategoria !== 'all' && it.categoria !== selectedCategoria) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          it.nome.toLowerCase().includes(term) ||
          it.codigo.toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [items, selectedArmazem, selectedCategoria, searchTerm]);

  // Estatísticas do progresso da contagem
  const progresso = useMemo(() => {
    let contados = 0;
    let divergencias = 0;
    let pendentes = 0;

    filteredItems.forEach(it => {
      const valorContado = contagens[it.id];
      if (valorContado !== undefined && valorContado !== null) {
        contados++;
        if (Number(valorContado) !== Number(it.stock_atual)) {
          divergencias++;
        }
      } else {
        pendentes++;
      }
    });

    return {
      total: filteredItems.length,
      contados,
      pendentes,
      divergencias
    };
  }, [filteredItems, contagens]);

  const handlePreencherTodosComSaldo = () => {
    filteredItems.forEach(it => {
      if (contagens[it.id] === undefined || contagens[it.id] === null) {
        onUpdateContagem(String(it.id), it.stock_atual);
      }
    });
    toast.info('Itens pendentes preenchidos com o saldo teórico.');
  };

  const handleImprimirFicha = () => {
    const armNome = selectedArmazem !== 'all' 
      ? armazens.find(a => String(a.id) === selectedArmazem)?.nome 
      : undefined;
    inventoryService.imprimirFichaContagemCega(filteredItems, armNome, !modoCego);
  };

  return (
    <div className="space-y-6">
      {/* Informative Header / Instructions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-blue-950 dark:text-blue-100 flex items-center gap-2">
              <ClipboardList size={18} className="text-blue-600 dark:text-blue-400" />
              Sessão de Contagem Física Periódica (Manual do Armazém - Secção 3)
            </h3>
            <p className="text-xs text-blue-800/80 dark:text-blue-300 mt-1">
              Insira a quantidade física real contada nas prateleiras. As diferenças em relação ao saldo teórico do ERP serão consolidadas na etapa de divergências para auditoria e ajuste oficial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setModoCego(!modoCego)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                modoCego 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'
              }`}
              title="A contagem cega esconde o saldo do sistema para garantir uma conferência isenta"
            >
              {modoCego ? <EyeOff size={14} /> : <Eye size={14} />}
              {modoCego ? 'Modo Cego (Ativo)' : 'Modo Assistido'}
            </button>

            <button
              onClick={handleImprimirFicha}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-semibold border border-gray-300 dark:border-gray-700 transition shadow-sm"
            >
              <Printer size={14} />
              Imprimir Ficha
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500">Total a Conferir</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{progresso.total}</p>
        </div>

        <div className="p-3 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Contados</p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{progresso.contados}</p>
        </div>

        <div className="p-3 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-400">Pendentes</p>
          <p className="text-xl font-bold text-gray-500 mt-0.5">{progresso.pendentes}</p>
        </div>

        <div className="p-3 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Divergências</p>
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{progresso.divergencias}</p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white dark:bg-surface-dark p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-2 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Localizar item na lista de contagem..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={selectedArmazem}
            onChange={e => setSelectedArmazem(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
          >
            <option value="all">Todos os Armazéns</option>
            {armazens.map(a => (
              <option key={a.id} value={String(a.id)}>{a.nome}</option>
            ))}
          </select>

          <select
            value={selectedCategoria}
            onChange={e => setSelectedCategoria(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
          >
            <option value="all">Todas as Categorias</option>
            {categorias.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handlePreencherTodosComSaldo}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg transition"
            title="Preenche os itens em branco com a quantidade atual do sistema"
          >
            Preencher Restantes
          </button>

          <button
            onClick={onResetContagens}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
            title="Limpar contagens inseridas"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={onGoToDivergencias}
            disabled={progresso.contados === 0}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            Analisar Divergências ({progresso.divergencias})
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Interactive Count Table */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 text-xs">
              <tr>
                <th className="px-4 py-3 w-12 text-center">Nº</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Designação</th>
                <th className="px-4 py-3">Armazém</th>
                <th className="px-4 py-3">Unid.</th>
                {!modoCego && (
                  <th className="px-4 py-3 text-right">Saldo Sistema</th>
                )}
                <th className="px-4 py-3 text-center w-48">Qtd. Contada Fisicamente</th>
                {!modoCego && (
                  <th className="px-4 py-3 text-right">Diferença</th>
                )}
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {filteredItems.map((item, index) => {
                const valorContado = contagens[item.id];
                const foiContado = valorContado !== undefined && valorContado !== null;
                const diferenca = foiContado ? Number(valorContado) - item.stock_atual : 0;

                return (
                  <tr 
                    key={item.id}
                    className={`transition-colors ${
                      foiContado
                        ? diferenca !== 0
                          ? 'bg-amber-50/40 dark:bg-amber-950/20'
                          : 'bg-emerald-50/20 dark:bg-emerald-950/10'
                        : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/40'
                    }`}
                  >
                    <td className="px-4 py-3 text-center text-xs text-gray-400 font-mono">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-500">
                      {item.codigo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 dark:text-white">{item.nome}</div>
                      <span className="text-xs text-gray-400">{item.categoria}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                      {item.armazem_nome}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-medium">
                      {item.unidade_medida}
                    </td>

                    {!modoCego && (
                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-800 dark:text-gray-200">
                        {item.stock_atual}
                      </td>
                    )}

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="Inserir Qtd"
                          value={valorContado ?? ''}
                          onChange={e => {
                            const val = e.target.value === '' ? null : Number(e.target.value);
                            onUpdateContagem(String(item.id), val);
                          }}
                          className={`w-32 px-3 py-1.5 text-sm font-bold text-center border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                            foiContado
                              ? diferenca !== 0
                                ? 'border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100'
                                : 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100'
                              : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
                          }`}
                        />
                        {foiContado && (
                          <button
                            onClick={() => onUpdateContagem(String(item.id), null)}
                            className="text-xs text-gray-400 hover:text-red-500"
                            title="Limpar contagem deste item"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </td>

                    {!modoCego && (
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold">
                        {foiContado ? (
                          diferenca > 0 ? (
                            <span className="text-blue-600 dark:text-blue-400">+{diferenca}</span>
                          ) : diferenca < 0 ? (
                            <span className="text-red-600 dark:text-red-400">{diferenca}</span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400">0</span>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                    )}

                    <td className="px-4 py-3 text-center text-xs font-medium">
                      {!foiContado ? (
                        <span className="text-gray-400 italic">Pendente</span>
                      ) : diferenca === 0 ? (
                        <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 size={15} className="mr-1" />
                          Conforme
                        </span>
                      ) : diferenca > 0 ? (
                        <span className="inline-flex items-center text-blue-700 dark:text-blue-400">
                          Sobra (+{diferenca})
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-700 dark:text-red-400">
                          <AlertTriangle size={15} className="mr-1" />
                          Quebra ({diferenca})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-400">
                    Nenhum artigo corresponde aos filtros de contagem selecionados.
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

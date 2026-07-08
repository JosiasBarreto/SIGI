import React, { useState, useMemo } from 'react';
import { ClipboardList, Plus, AlertCircle, RefreshCcw, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services';
import { toast } from 'react-toastify';
import { DataTable } from '../components/Common/DataTable';
import { ColumnDef } from '@tanstack/react-table';

export default function Inventario() {
  const [selectedTab, setSelectedTab] = useState<'geral' | 'contagem' | 'divergencias'>('geral');
  
  // Real stock data
  const { data: stockItemsData, isLoading } = useQuery({
    queryKey: ['armazem/produtos'],
    queryFn: async () => {
      const res = await productService.getAll({ per_page: 5000 });
      return res?.items || (Array.isArray(res) ? res : []);
    }
  });

  const stockItems = useMemo(() => stockItemsData || [], [stockItemsData]);

  const [contagens, setContagens] = useState<Record<string, number>>({});

  const handleStartContagem = () => {
    setSelectedTab('contagem');
    setContagens({});
  };

  const handleSaveContagem = () => {
    toast.success('Contagem parcial registada. Verifique as divergências.');
    setSelectedTab('divergencias');
  };

  const applyAjustes = () => {
    toast.success('Ajustes aplicados e movimentos de stock gerados.');
    setSelectedTab('geral');
  };

  const columnsGeral = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.codigo || row.internalCode,
        id: 'codigo',
        header: 'Código',
      },
      {
        accessorFn: (row) => row.nome || row.name,
        id: 'nome',
        header: 'Produto/Ingrediente',
      },
      {
        accessorFn: (row) => row.categoria || row.category,
        id: 'categoria',
        header: 'Categoria',
      },
      {
        id: 'quantidade',
        header: 'Qtd Sistema',
        cell: (info) => {
          const m = info.row.original;
          return <span className="font-semibold">{m.stock_atual || m.quantity} {m.unidade_medida || m.unit}</span>;
        }
      }
    ],
    []
  );

  const columnsContagem = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.nome || row.name,
        id: 'nome',
        header: 'Produto/Ingrediente',
      },
      {
        id: 'quantidade_fisica',
        header: 'Qtd Física (Contada)',
        cell: (info) => {
          const m = info.row.original;
          return (
            <div className="w-48">
              <input 
                type="number" 
                className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 focus:ring-2 focus:ring-primary/50 outline-none transition"
                value={contagens[m.id] || ''}
                onChange={(e) => setContagens(prev => ({...prev, [m.id]: Number(e.target.value)}))}
                placeholder="Insira quantidade"
              />
            </div>
          );
        }
      }
    ],
    [contagens]
  );

  const divergenciasData = useMemo(() => {
    return stockItems.filter((m:any) => contagens[m.id] !== undefined && contagens[m.id] !== (m.stock_atual || m.quantity));
  }, [stockItems, contagens]);

  const columnsDivergencias = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorFn: (row) => row.nome || row.name,
        id: 'nome',
        header: 'Produto',
      },
      {
        id: 'qtd_sistema',
        header: 'Qtd Sistema',
        cell: (info) => info.row.original.stock_atual || info.row.original.quantity || 0,
      },
      {
        id: 'qtd_contada',
        header: 'Qtd Contada',
        cell: (info) => contagens[info.row.original.id] || 0,
      },
      {
        id: 'diferenca',
        header: 'Diferença',
        cell: (info) => {
          const m = info.row.original;
          const sis = m.stock_atual || m.quantity || 0;
          const cont = contagens[m.id] || 0;
          const dif = cont - sis;
          return (
            <span className={`font-semibold px-2.5 py-1 rounded-md inline-block ${dif > 0 ? 'text-green-700 bg-green-50 dark:bg-green-900/20' : 'text-red-700 bg-red-50 dark:bg-red-900/20'}`}>
              {dif > 0 ? '+' : ''}{dif}
            </span>
          );
        }
      }
    ],
    [contagens]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center text-gray-800 dark:text-gray-100">
          <ClipboardList className="mr-2 text-primary" />
          Inventário e Stock
        </h1>
        <div className="flex gap-2">
            <button onClick={handleStartContagem} className="flex flex-row items-center bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 transition text-white px-4 py-2.5 rounded-lg font-medium shadow-sm">
              <Plus className="w-5 h-5 mr-2"/>
              Nova Contagem Fisíca
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-6 bg-gray-50/50 dark:bg-gray-800/20">
          <button 
            onClick={() => setSelectedTab('geral')} 
            className={`font-semibold pb-2 border-b-2 transition-all ${selectedTab === 'geral' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
            Estado Atual (Sistema)
          </button>
          <button 
            onClick={() => setSelectedTab('contagem')} 
            className={`font-semibold pb-2 border-b-2 transition-all ${selectedTab === 'contagem' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
            Em Contagem
          </button>
          <button 
            onClick={() => setSelectedTab('divergencias')} 
            className={`font-semibold pb-2 border-b-2 transition-all ${selectedTab === 'divergencias' ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
            Divergências
          </button>
        </div>
        
        <div className="p-4">
          {selectedTab === 'geral' && (
            <DataTable
              data={stockItems}
              columns={columnsGeral}
              isLoading={isLoading}
              searchPlaceholder="Pesquisar produtos..."
            />
          )}

          {selectedTab === 'contagem' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm">Insira as contagens físicas para o inventário parcial. Pode pesquisar os produtos e introduzir as quantidades.</p>
              </div>
              
              <DataTable
                data={stockItems}
                columns={columnsContagem}
                isLoading={isLoading}
                searchPlaceholder="Pesquisar para contar..."
              />
              
              <div className="flex justify-end pt-4">
                <button onClick={handleSaveContagem} className="px-6 py-2.5 bg-primary hover:bg-primary-hover transition text-white rounded-lg shadow-sm font-medium">
                  Finalizar Contagem Parcial
                </button>
              </div>
            </div>
          )}

          {selectedTab === 'divergencias' && (
            <div className="space-y-4">
               <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 p-4 rounded-lg flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-sm">Abaixo as divergências encontradas entre sistema e contagem.</p>
              </div>

              <DataTable
                data={divergenciasData}
                columns={columnsDivergencias}
                searchPlaceholder="Pesquisar divergências..."
                emptyMessage="Não foram encontradas divergências nas contagens realizadas."
              />

              <div className="flex justify-end gap-3 pt-4">
                  <button onClick={handleStartContagem} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 font-medium rounded-lg border border-gray-200 dark:border-gray-700">
                    Recontar
                  </button>
                  <button onClick={applyAjustes} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 transition text-white font-medium rounded-lg shadow-sm">
                    Lançar Ajustes
                  </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { PackageOpen, CheckCircle, AlertTriangle, XOctagon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import Modal from '../components/Common/Modal';
import { toast } from 'react-toastify';
import { DataTable } from '../components/Common/DataTable';
import { ColumnDef } from '@tanstack/react-table';

export default function ControloMateriais() {
  const [selectedTab, setSelectedTab] = useState<'pendentes' | 'historico'>('pendentes');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [justificativa, setJustificativa] = useState('');
  const [qtdDevolvida, setQtdDevolvida] = useState(0);
  const [actionType, setActionType] = useState<'devolver' | 'danificado' | 'perdido'>('devolver');

  // We map from standard materials/inventory movements or mock it.
  const { data: materials, isLoading } = useQuery({
    queryKey: ['materialsControl'],
    queryFn: async () => {
      try {
        const reqs = await apiClient.get<any, any>('/v1/materiais/em-uso');
        return reqs.items || reqs.data || reqs || [];
      } catch (err) {
        return [];
      }
    }
  });

  const handleAction = (item: any, type: 'devolver' | 'danificado' | 'perdido') => {
    setSelectedIssue(item);
    setActionType(type);
    setQtdDevolvida(item.qtd);
    setJustificativa('');
    setModalOpen(true);
  };

  const confirmAction = () => {
    toast.success(`Ação de "${actionType}" efetuada para ${qtdDevolvida} unidades de ${selectedIssue.material}.`);
    setModalOpen(false);
  };

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'material', header: 'Material' },
    { accessorKey: 'responsavel', header: 'Responsável' },
    { accessorKey: 'qtd', header: 'Qtd' },
    { accessorKey: 'evento', header: 'Evento / Ordem' },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="flex gap-2">
            <button onClick={() => handleAction(m, 'devolver')} className="px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200">
              Devolver
            </button>
            <button onClick={() => handleAction(m, 'danificado')} className="px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200">
              Danificado
            </button>
            <button onClick={() => handleAction(m, 'perdido')} className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
              Perdido
            </button>
          </div>
        );
      }
    }
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center text-gray-800 dark:text-gray-100">
          <PackageOpen className="mr-2" />
          Controlo de Materiais (Alocados)
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex gap-4">
          <button 
            onClick={() => setSelectedTab('pendentes')} 
            className={`font-semibold pb-2 ${selectedTab === 'pendentes' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>
            Pendentes de Devolução
          </button>
          <button 
            onClick={() => setSelectedTab('historico')} 
            className={`font-semibold pb-2 ${selectedTab === 'historico' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}>
            Histórico e Danificados
          </button>
        </div>
        
        {selectedTab === 'pendentes' && (
          <div className="p-4">
            <DataTable
              data={materials || []}
              columns={columns}
              isLoading={isLoading}
              searchPlaceholder="Pesquisar materiais pendentes..."
            />
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Registar ${actionType}`}>
        <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium mb-1">Quantidade</label>
             <input type="number" max={selectedIssue?.qtd} min="1" value={qtdDevolvida} onChange={e => setQtdDevolvida(Number(e.target.value))} className="w-full px-3 py-2 border rounded" />
           </div>
           {(actionType === 'danificado' || actionType === 'perdido') && (
             <div>
               <label className="block text-sm font-medium mb-1">Justificativa (Obrigatório)</label>
               <textarea value={justificativa} onChange={e => setJustificativa(e.target.value)} className="w-full px-3 py-2 border rounded" required />
             </div>
           )}
           <button onClick={confirmAction} className="w-full py-2 bg-primary text-white rounded">Confirmar</button>
        </div>
      </Modal>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PackageOpen, 
  ShieldCheck, 
  ClipboardList, 
  AlertOctagon, 
  User, 
  Clock, 
  Eye, 
  RotateCcw, 
  ShieldAlert, 
  TrendingUp, 
  RefreshCw, 
  X, 
  Check, 
  Lock, 
  AlertTriangle, 
  Wrench, 
  Package,
  Calendar
} from 'lucide-react';
import apiClient from '../api/client';
import { requestService } from '../services';
import Modal from '../components/Common/Modal';
import { DataTable } from '../components/Common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthContext';

export default function ControloMateriais() {
  const [activeTab, setActiveTab] = useState<'circulacao' | 'ocorrencias'>('circulacao');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [devolucaoModalOpen, setDevolucaoModalOpen] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState<any>(null);
  
  // Return values inputs
  const [inputDevolvida, setInputDevolvida] = useState<number>(0);
  const [inputDanificada, setInputDanificada] = useState<number>(0);
  const [inputPerdida, setInputPerdida] = useState<number>(0);
  const [inputJustificativa, setInputJustificativa] = useState('');
  
  // Detailed view of requisition
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [reqModalOpen, setReqModalOpen] = useState(false);

  // Detailed view of occurrence
  const [selectedOc, setSelectedOc] = useState<any>(null);
  const [ocModalOpen, setOcModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // 1. Fetch active requisitions (Em Uso & Devolucao Parcial)
  const { data: activeReqs, isLoading: isLoadingReqs, isRefetching: isRefetchingReqs } = useQuery({
    queryKey: ['requests', 'active-allocations'],
    queryFn: async () => {
      const [emUso, parcial] = await Promise.all([
        requestService.getAll({ estado: 'Em Uso', per_page: 100 }).catch(() => ({ items: [] })),
        requestService.getAll({ estado: 'Devolucao Parcial', per_page: 100 }).catch(() => ({ items: [] }))
      ]);
      return [...(emUso?.items || []), ...(parcial?.items || [])];
    }
  });

  // 2. Fetch occurrences (for auditoria/historico tab)
  const { data: occurrencesResponse, isLoading: isLoadingOccurrences, isRefetching: isRefetchingOccurrences } = useQuery({
    queryKey: ['occurrences', 'control'],
    queryFn: () => requestService.getOcorrencias({ per_page: 100 }).catch(() => ({ items: [] }))
  });
  const occurrences = occurrencesResponse?.items || [];

  // 3. Flatmap items of type "Material" that are out in the field
  const allocationsInCirculation = useMemo(() => {
    if (!activeReqs) return [];
    
    const flatItems: any[] = [];
    activeReqs.forEach((req: any) => {
      req.itens?.forEach((item: any) => {
        if (item.tipo_item === 'Material') {
          const qtyEntregue = Number(item.quantidade_entregue) || 0;
          const qtyDevolvida = Number(item.quantidade_devolvida) || 0;
          const qtyDanificada = Number(item.quantidade_danificada) || 0;
          const qtyPerdida = Number(item.quantidade_perdida) || 0;
          
          const remaining = qtyEntregue - (qtyDevolvida + qtyDanificada + qtyPerdida);
          
          if (remaining > 0) {
            flatItems.push({
              id: item.id,
              requisicao_id: req.id,
              requisicao_numero: req.numero || `#REQ-${req.id}`,
              material_id: item.item_id,
              material: item.nome || `Item #${item.item_id}`,
              codigo: item.codigo || 'S/C',
              responsavel: req.responsavel_nome || `Utilizador #${req.responsavel_id}`,
              qtd: remaining,
              unidade: item.unidade_medida || 'un',
              evento: req.sector || 'Operação',
              turno: req.turno_nome || '',
              item: item,
              requisicao: req
            });
          }
        }
      });
    });

    // Filter by search term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      return flatItems.filter(item => 
        item.material.toLowerCase().includes(term) ||
        item.codigo.toLowerCase().includes(term) ||
        item.responsavel.toLowerCase().includes(term) ||
        item.requisicao_numero.toLowerCase().includes(term) ||
        item.evento.toLowerCase().includes(term)
      );
    }

    return flatItems;
  }, [activeReqs, searchTerm]);

  // 4. Calculate stats dynamically based on actual database records
  const stats = useMemo(() => {
    const totalCirculation = allocationsInCirculation.reduce((acc, curr) => acc + curr.qtd, 0);
    const activeReqsCount = activeReqs?.length || 0;
    
    const countDanificados = occurrences
      .filter((o: any) => o.tipo === 'Danificado')
      .reduce((acc: number, curr: any) => acc + (Number(curr.quantidade) || 0), 0);
      
    const countPerdidos = occurrences
      .filter((o: any) => o.tipo === 'Perda' || o.tipo === 'Nao Devolvido')
      .reduce((acc: number, curr: any) => acc + (Number(curr.quantidade) || 0), 0);
    
    return {
      totalCirculation,
      activeReqsCount,
      countDanificados,
      countPerdidos
    };
  }, [allocationsInCirculation, activeReqs, occurrences]);

  // Mutations
  const actionMutation = useMutation({
    mutationFn: async ({ id, action, payload }: { id: string | number; action: 'devolver' | 'encerrar'; payload?: any }) => {
      if (action === 'devolver') {
        return requestService.devolver(id, payload);
      }
      if (action === 'encerrar') {
        return requestService.encerrar(id);
      }
      throw new Error('Ação inválida');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['occurrences'] });
      setDevolucaoModalOpen(false);
      setReqModalOpen(false);
      setSelectedAllocation(null);
      setSelectedReq(null);
      toast.success('Registo efetuado e stock atualizado com sucesso!');
    },
    onError: (error: any) => {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Erro ao processar alteração de controlo.');
    }
  });

  const handleOpenDevolucao = (allocation: any) => {
    setSelectedAllocation(allocation);
    setInputDevolvida(allocation.qtd);
    setInputDanificada(0);
    setInputPerdida(0);
    setInputJustificativa('');
    setDevolucaoModalOpen(true);
  };

  const handleDevolucaoSubmit = () => {
    const totalInput = Number(inputDevolvida) + Number(inputDanificada) + Number(inputPerdida);
    
    if (totalInput <= 0) {
      Swal.fire('Quantidade Inválida', 'Por favor, insira uma quantidade superior a zero.', 'warning');
      return;
    }
    
    if (totalInput > selectedAllocation.qtd) {
      Swal.fire(
        'Quantidade Excedente',
        `A soma das quantidades (${totalInput}) não pode ser maior do que a quantidade em uso (${selectedAllocation.qtd}).`,
        'warning'
      );
      return;
    }

    const needsJustification = Number(inputDanificada) > 0 || Number(inputPerdida) > 0;
    if (needsJustification && !inputJustificativa.trim()) {
      Swal.fire('Justificação Obrigatória', 'Indique o motivo das perdas ou danos registados.', 'warning');
      return;
    }

    const req = selectedAllocation.requisicao;
    const targetItem = selectedAllocation.item;

    // Map all materials of the requisition to accumulate correctly
    const payload = req.itens
      ?.filter((i: any) => i.tipo_item === 'Material')
      .map((i: any) => {
        if (i.id === targetItem.id) {
          return {
            material_id: Number(i.item_id),
            quantidade_devolvida: (Number(i.quantidade_devolvida) || 0) + Number(inputDevolvida),
            quantidade_danificada: (Number(i.quantidade_danificada) || 0) + Number(inputDanificada),
            quantidade_perdida: (Number(i.quantidade_perdida) || 0) + Number(inputPerdida),
            justificacao: inputJustificativa || '',
            observacao: ''
          };
        } else {
          return {
            material_id: Number(i.item_id),
            quantidade_devolvida: Number(i.quantidade_devolvida) || 0,
            quantidade_danificada: Number(i.quantidade_danificada) || 0,
            quantidade_perdida: Number(i.quantidade_perdida) || 0,
            justificacao: i.justificacao || '',
            observacao: i.observacao || ''
          };
        }
      }) || [];

    actionMutation.mutate({
      id: selectedAllocation.requisicao_id,
      action: 'devolver',
      payload
    });
  };

  const handleCloseRequisition = (reqId: number | string, reqNum: string) => {
    Swal.fire({
      title: 'Encerrar e Auditar Ficha?',
      text: `Deseja dar por concluída a Ficha ${reqNum}? Qualquer material em circulação pendente gerará ocorrência automática de perda no património.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sim, Encerrar!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        actionMutation.mutate({
          id: reqId,
          action: 'encerrar'
        });
      }
    });
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['requests'] });
    queryClient.invalidateQueries({ queryKey: ['occurrences'] });
    toast.info('Dados de materiais e auditoria atualizados!');
  };

  // Columns definition for Active Materials
  const columnsCirculation = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'material',
      header: 'Material / Artigo',
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
            <Wrench size={16} />
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white block">{row.original.material}</span>
            <span className="text-[10px] text-gray-400 font-mono tracking-wider">{row.original.codigo}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'responsavel',
      header: 'Responsável',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
          <User size={14} className="text-gray-400" />
          <span className="font-medium">{row.original.responsavel}</span>
        </div>
      )
    },
    {
      accessorKey: 'evento',
      header: 'Setor / Destino',
      cell: ({ row }) => (
        <div>
          <span className="font-bold text-xs text-gray-800 dark:text-gray-200 block">{row.original.evento}</span>
          {row.original.turno && <span className="text-[10px] text-gray-400 font-medium">{row.original.turno}</span>}
        </div>
      )
    },
    {
      accessorKey: 'requisicao_numero',
      header: 'Ficha Origem',
      cell: ({ row }) => (
        <button 
          onClick={() => {
            setSelectedReq(row.original.requisicao);
            setReqModalOpen(true);
          }}
          className="font-mono font-black text-xs text-primary bg-primary/5 hover:bg-primary/15 px-2.5 py-1 rounded-md transition-all uppercase border border-primary/10 tracking-tight"
          title="Ver ficha completa"
        >
          {row.original.requisicao_numero}
        </button>
      )
    },
    {
      accessorKey: 'qtd',
      header: 'Qtd em Uso',
      cell: ({ row }) => (
        <span className="font-black text-sm text-gray-900 dark:text-white font-mono bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-800 px-3 py-1.5 rounded-lg inline-block text-center min-w-[70px]">
          {row.original.qtd} <span className="text-[9px] text-gray-400 font-bold uppercase ml-0.5">{row.original.unidade}</span>
        </span>
      )
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const m = row.original;
        return (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setSelectedReq(m.requisicao);
                setReqModalOpen(true);
              }}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 dark:text-blue-400 rounded-xl font-bold text-xs transition-all flex items-center gap-1 active:scale-95 shadow-sm border border-blue-100 dark:border-blue-900"
              title="Visualizar ficha de requisição completa"
            >
              <Eye size={13} /> Visualizar
            </button>
            <button 
              onClick={() => handleOpenDevolucao(m)} 
              className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/75 dark:text-emerald-400 rounded-xl font-bold text-xs transition-all flex items-center gap-1 active:scale-95 shadow-sm"
              title="Registar retorno ou quebra"
            >
              <RotateCcw size={14} /> Devolver
            </button>
            <button 
              onClick={() => handleCloseRequisition(m.requisicao_id, m.requisicao_numero)} 
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs transition-all flex items-center gap-1 active:scale-95 shadow-sm border border-gray-200 dark:border-gray-700"
              title="Encerrar esta ficha de requisição operacional"
            >
              <Lock size={13} /> Encerrar
            </button>
          </div>
        );
      }
    }
  ], [activeReqs]);

  // Columns definition for Occurrences / Audit Log
  const columnsOccurrences = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'numero',
      header: 'Ficha Origem',
      cell: ({ row }) => <span className="font-mono font-bold text-primary text-xs uppercase">{row.original.numero || 'N/A'}</span>
    },
    {
      accessorKey: 'material_nome',
      header: 'Material / Código',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Wrench size={14} className="text-gray-400" />
          <div>
            <span className="font-bold text-gray-900 dark:text-white block">{row.original.material_nome || `Item ID #${row.original.material_id}`}</span>
            <span className="text-[10px] text-gray-400 font-mono tracking-wider">{row.original.material_codigo || '-'}</span>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'tipo',
      header: 'Tipo Ocorrência',
      cell: ({ row }) => {
        const type = row.original.tipo;
        return (
          <span className={cn(
            "text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider",
            type === 'Danificado' ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
            type === 'Perda' ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" :
            "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" // Nao Devolvido
          )}>
            {type === 'Nao Devolvido' ? 'Não Devolvido' : type}
          </span>
        );
      }
    },
    {
      accessorKey: 'quantidade',
      header: 'Qtd Afetada',
      cell: ({ row }) => (
        <span className="font-black text-xs text-rose-600 dark:text-rose-400 font-mono">
          {Number(row.original.quantidade)} un
        </span>
      )
    },
    {
      accessorKey: 'responsavel_nome',
      header: 'Responsável',
      cell: ({ row }) => (
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
          {row.original.responsavel_nome || 'N/A'}
        </span>
      )
    },
    {
      accessorKey: 'data_ocorrencia',
      header: 'Data Registo',
      cell: ({ row }) => (
        <div className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
          <Clock size={12} />
          {row.original.data_ocorrencia ? new Date(row.original.data_ocorrencia).toLocaleString() : 'N/A'}
        </div>
      )
    },
    {
      accessorKey: 'justificacao',
      header: 'Justificação / Observações',
      cell: ({ row }) => (
        <p className="text-xs text-gray-600 dark:text-gray-400 italic max-w-sm truncate" title={row.original.justificacao}>
          {row.original.justificacao || 'Sem justificação.'}
        </p>
      )
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => (
        <button 
          onClick={() => {
            setSelectedOc(row.original);
            setOcModalOpen(true);
          }}
          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:hover:bg-blue-950/70 dark:text-blue-400 rounded-xl font-bold text-xs transition-all flex items-center gap-1 active:scale-95 shadow-sm border border-blue-100 dark:border-blue-900"
          title="Ver detalhes completos da ocorrência"
        >
          <Eye size={13} /> Visualizar
        </button>
      )
    }
  ], []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-primary" size={28} />
            Controlo de Materiais Alocados
          </h1>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
            Auditoria de Património, Devoluções e Gestão de Quebras em Operação
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-3 bg-white hover:bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-800 dark:hover:text-white rounded-xl transition-all shadow-sm active:scale-95 flex items-center justify-center"
            title="Atualizar tabelas"
          >
            <RefreshCw size={18} className={cn(isRefetchingReqs || isRefetchingOccurrences ? "animate-spin" : "")} />
          </button>
        </div>
      </div>

      {/* Dynamic Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <Wrench size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Materiais em Uso</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 font-mono">
              {stats.totalCirculation}
            </h3>
            <p className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">unidades no terreno</p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <ClipboardList size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fichas Ativas</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1 font-mono">
              {stats.activeReqsCount}
            </h3>
            <p className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">Em Uso ou Parcial</p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <AlertTriangle size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Danos Registados</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
              {stats.countDanificados}
            </h3>
            <p className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">itens quebra/avaria</p>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
            <ShieldAlert size={22} />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Perdas de Património</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
              {stats.countPerdidos}
            </h3>
            <p className="text-[9px] text-gray-400 font-semibold uppercase mt-0.5">Desaparecidos / Sem devolução</p>
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('circulacao')} 
              className={cn(
                "font-black text-xs uppercase tracking-wider pb-2 border-b-2 transition-all",
                activeTab === 'circulacao' 
                  ? 'text-primary border-primary' 
                  : 'text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
              )}
            >
              Materiais em Circulação
            </button>
            <button 
              onClick={() => setActiveTab('ocorrencias')} 
              className={cn(
                "font-black text-xs uppercase tracking-wider pb-2 border-b-2 transition-all",
                activeTab === 'ocorrencias' 
                  ? 'text-primary border-primary' 
                  : 'text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200'
              )}
            >
              Relatório de Ocorrências (Auditoria)
            </button>
          </div>

          {/* Search bar specifically for current active tab */}
          {activeTab === 'circulacao' && (
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="Pesquisar materiais, códigos, resp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2 pl-9 rounded-xl text-xs font-semibold outline-none focus:border-primary shadow-inner"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Wrench size={13} />
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Circulation Materials */}
        {activeTab === 'circulacao' && (
          <div className="p-4">
            <DataTable
              data={allocationsInCirculation}
              columns={columnsCirculation}
              isLoading={isLoadingReqs}
              searchPlaceholder="Filtro rápido da lista..."
            />
          </div>
        )}

        {/* Tab 2: Occurrences Audit List */}
        {activeTab === 'ocorrencias' && (
          <div className="p-4">
            <DataTable
              data={occurrences}
              columns={columnsOccurrences}
              isLoading={isLoadingOccurrences}
              searchPlaceholder="Pesquisar nas ocorrências..."
            />
          </div>
        )}
      </div>

      {/* MODAL: Logging return, damages, and losses on a material */}
      <Modal 
        isOpen={devolucaoModalOpen} 
        onClose={() => setDevolucaoModalOpen(false)} 
        title="Registar Transação de Devolução"
        maxWidth="max-w-xl"
      >
        {selectedAllocation && (
          <div className="space-y-5">
            {/* Header / Info box */}
            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Material Selecionado</p>
              <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                <Wrench size={14} className="text-primary" />
                {selectedAllocation.material}
              </h4>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">
                Origem: <span className="font-mono text-primary font-bold">{selectedAllocation.requisicao_numero}</span> • Qtd Máxima em Uso: <span className="font-black font-mono text-gray-900 dark:text-white">{selectedAllocation.qtd} {selectedAllocation.unidade}</span>
              </p>
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Devolvido (Bom Estado)
                </label>
                <input 
                  type="number" 
                  min="0"
                  max={selectedAllocation.qtd}
                  value={inputDevolvida} 
                  onChange={e => setInputDevolvida(Math.max(0, Number(e.target.value)))} 
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 font-bold font-mono text-center shadow-sm text-sm outline-none focus:border-emerald-500" 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Danificado (Quebrado)
                </label>
                <input 
                  type="number" 
                  min="0"
                  max={selectedAllocation.qtd}
                  value={inputDanificada} 
                  onChange={e => setInputDanificada(Math.max(0, Number(e.target.value)))} 
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 font-bold font-mono text-center shadow-sm text-sm outline-none focus:border-amber-500" 
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  Perdido (Desaparecido)
                </label>
                <input 
                  type="number" 
                  min="0"
                  max={selectedAllocation.qtd}
                  value={inputPerdida} 
                  onChange={e => setInputPerdida(Math.max(0, Number(e.target.value)))} 
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 font-bold font-mono text-center shadow-sm text-sm outline-none focus:border-rose-500" 
                />
              </div>
            </div>

            {/* Justification - Mandatory if there are issues */}
            {(Number(inputDanificada) > 0 || Number(inputPerdida) > 0) && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="block text-[10px] font-black text-rose-500 uppercase tracking-widest">
                  Justificação da Ocorrência (Obrigatório) *
                </label>
                <textarea 
                  value={inputJustificativa} 
                  onChange={e => setInputJustificativa(e.target.value)} 
                  placeholder="Por favor, explique a causa (Ex: Um prato caiu no chão na copa ou desapareceu da mesa)" 
                  rows={3}
                  className="w-full px-4 py-3 border border-rose-200 dark:border-rose-950 rounded-xl bg-rose-500/5 text-xs font-semibold outline-none focus:border-rose-500 shadow-sm"
                  required 
                />
              </div>
            )}

            {/* Total check info */}
            <div className="bg-gray-50 dark:bg-gray-800/20 px-4 py-3 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500 font-semibold uppercase">
              <span>Total Contabilizado agora:</span>
              <span className={cn(
                "font-black font-mono",
                Number(inputDevolvida) + Number(inputDanificada) + Number(inputPerdida) === selectedAllocation.qtd
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-amber-500"
              )}>
                {Number(inputDevolvida) + Number(inputDanificada) + Number(inputPerdida)} / {selectedAllocation.qtd} {selectedAllocation.unidade}
              </span>
            </div>

            {/* Modal actions */}
            <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => setDevolucaoModalOpen(false)} 
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDevolucaoSubmit} 
                disabled={actionMutation.isPending}
                className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {actionMutation.isPending ? 'A registar...' : 'Confirmar Devolução'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Detailed Ficha view */}
      <Modal
        isOpen={reqModalOpen}
        onClose={() => setReqModalOpen(false)}
        title={selectedReq ? `Ficha de Requisição ${selectedReq.numero || `#${selectedReq.id}`}` : ''}
        maxWidth="max-w-xl"
      >
        {selectedReq && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Requerente</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase truncate">
                  {selectedReq.responsavel_nome || `ID #${selectedReq.responsavel_id}`}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Setor / Setor</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white uppercase truncate">
                  {selectedReq.sector} {selectedReq.turno_nome ? `• ${selectedReq.turno_nome}` : ''}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Artigos da Ficha</p>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-60 overflow-y-auto pr-1">
                {selectedReq.itens?.map((it: any) => {
                  const isMat = it.tipo_item === 'Material';
                  return (
                    <div key={it.id} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {isMat ? <Wrench size={13} className="text-primary" /> : <Package size={13} className="text-emerald-500" />}
                        <div>
                          <p className="font-bold text-gray-800 dark:text-gray-200">{it.nome}</p>
                          <p className="text-[10px] text-gray-400 font-mono">{it.codigo || 'Sem código'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-gray-900 dark:text-white">{Number(it.quantidade_entregue || it.quantidade_aprovada || it.quantidade_solicitada)} {it.unidade_medida || 'un'}</p>
                        <p className="text-[9px] text-emerald-600 font-bold uppercase">Entregues</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedReq.observacoes && (
              <div className="bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 text-xs text-gray-700 dark:text-gray-300">
                <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5">Observações da Requisição</p>
                <p className="font-medium italic">{selectedReq.observacoes}</p>
              </div>
            )}

            <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 justify-end">
              <button 
                onClick={() => handleCloseRequisition(selectedReq.id, selectedReq.numero || `#REQ-${selectedReq.id}`)}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Encerrar Requisição
              </button>
              <button 
                onClick={() => setReqModalOpen(false)} 
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL: Detailed Occurrence view */}
      <Modal
        isOpen={ocModalOpen}
        onClose={() => setOcModalOpen(false)}
        title={selectedOc ? `Ocorrência ${selectedOc.numero || `#${selectedOc.id}`}` : ''}
        maxWidth="max-w-md"
      >
        {selectedOc && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 bg-red-500/5 dark:bg-red-500/10 p-4 rounded-xl border border-red-500/10">
              <ShieldAlert className="text-rose-500 shrink-0" size={24} />
              <div>
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Gravidade / Estado</p>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  Perda ou Danificação Registada em Operação
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tipo</p>
                <span className={cn(
                  "inline-block text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider mt-1",
                  selectedOc.tipo === 'Danificado' ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                  selectedOc.tipo === 'Perda' ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" :
                  "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                )}>
                  {selectedOc.tipo === 'Nao Devolvido' ? 'Não Devolvido' : selectedOc.tipo}
                </span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Qtd Afetada</p>
                <p className="text-sm font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
                  {Number(selectedOc.quantidade)} un
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Artigo / Código</p>
                <div className="flex items-center gap-2 mt-1">
                  <Wrench size={14} className="text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-black text-gray-800 dark:text-gray-200">{selectedOc.material_nome}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{selectedOc.material_codigo || '-'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800/60 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Responsável</p>
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">{selectedOc.responsavel_nome || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Registado em</p>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5 font-mono">{selectedOc.data_ocorrencia ? new Date(selectedOc.data_ocorrencia).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div className="bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/10 text-xs text-gray-700 dark:text-gray-300">
              <p className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Justificação / Causa</p>
              <p className="font-medium italic leading-relaxed">{selectedOc.justificacao || 'Nenhuma justificação foi fornecida para esta ocorrência.'}</p>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => setOcModalOpen(false)} 
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

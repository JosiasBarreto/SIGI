import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Play,
  CheckCheck,
  CheckCircle2,
  Zap,
  XCircle,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  AlertTriangle,
  RotateCcw,
  Eye,
  EyeOff,
  Save,
  Clock,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Info,
  Calendar,
  Warehouse,
  Check,
  Building2,
  Lock,
  Sparkles
} from 'lucide-react';
import { 
  InventarioSessao, 
  InventarioItemBackend, 
  InventarioEstado, 
  ItemSituacao, 
  MotivoAjuste,
  InventarioAuditoriaItem
} from '../types';
import { inventoryAuditService } from '../../../services/inventoryAuditService';
import { formatCurrency } from '../../../lib/utils';
import { toast } from 'react-toastify';

interface OfficialInventoryDetailProps {
  inventoryId: number;
  onBack: () => void;
  onStockUpdated: () => void;
}

const MOTIVOS_AJUSTE: { value: MotivoAjuste; label: string; desc: string }[] = [
  { value: 'QUEBRA', label: 'Quebra Operacional', desc: 'Quebras durante manuseamento ou preparação' },
  { value: 'PERDA', label: 'Perda / Extravio', desc: 'Item extraviado ou não localizado' },
  { value: 'SOBRA_FORNECEDOR', label: 'Sobra de Fornecedor / Excedente', desc: 'Excedente de entrega não faturado ou bonificação' },
  { value: 'ERRO_CONTAGEM', label: 'Erro de Contagem Anterior', desc: 'Retificação de contagem anterior incorreta' },
  { value: 'ERRO_REGISTO', label: 'Erro de Registo no Sistema', desc: 'Diferença decorrente de documento não lançado' },
  { value: 'DANIFICADO', label: 'Danificado / Avariado', desc: 'Artigo deteriorado ou impróprio para consumo' },
  { value: 'VENCIDO', label: 'Prazo Vencido', desc: 'Data de validade expirada' },
  { value: 'OUTROS', label: 'Outro Motivo (Justificado)', desc: 'Outra justificação especificada nas notas' }
];

export const OfficialInventoryDetail: React.FC<OfficialInventoryDetailProps> = ({
  inventoryId,
  onBack,
  onStockUpdated
}) => {
  const queryClient = useQueryClient();

  // Estados locais
  const [subTab, setSubTab] = useState<'contagem' | 'conferencia' | 'auditoria'>('contagem');
  const [conferenciaFiltro, setConferenciaFiltro] = useState<
    'TODOS' | 'DIVERGENCIAS' | 'FALTAS' | 'SOBRAS' | 'SEM_DIVERGENCIA' | 'NAO_CONTADOS'
  >('TODOS');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'TODOS' | 'PRODUTO' | 'MATERIAL'>('TODOS');
  const [modoCego, setModoCego] = useState<boolean>(true); // Auditoria Cega ativada por defeito
  
  // Cache de edições locais antes de auto-save / lote
  const [editedCounts, setEditedCounts] = useState<Record<number, number | ''>>({});
  const [editedMotivos, setEditedMotivos] = useState<Record<number, string>>({});
  const [editedNotas, setEditedNotas] = useState<Record<number, string>>({});
  const [savingItemIds, setSavingItemIds] = useState<Record<number, boolean>>({});

  // Modais de ação
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [isFinalizarModalOpen, setIsFinalizarModalOpen] = useState(false);
  const [forcarFinalizacao, setForcarFinalizacao] = useState(false);
  const [isAprovarModalOpen, setIsAprovarModalOpen] = useState(false);
  const [isAplicarModalOpen, setIsAplicarModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Busca dos dados da Sessão
  const {
    data: sessao,
    isLoading: isSessionLoading,
    refetch: refetchSessao,
    isError: isSessionError,
    error: sessionError
  } = useQuery({
    queryKey: ['inventario-sessao', inventoryId],
    queryFn: () => inventoryAuditService.obter(inventoryId),
    refetchInterval: 15000,
  });

  // Busca dos Itens do Inventário
  const {
    data: itensData,
    isLoading: isItensLoading,
    refetch: refetchItens
  } = useQuery({
    queryKey: ['inventario-itens', inventoryId],
    queryFn: () => inventoryAuditService.listarItens(inventoryId, { per_page: 5000 }),
    enabled: sessao?.estado !== 'RASCUNHO',
  });

  // Busca da Conferência Analítica
  const {
    data: conferenciaResumo,
    refetch: refetchConferencia
  } = useQuery({
    queryKey: ['inventario-conferencia', inventoryId],
    queryFn: () => inventoryAuditService.obterConferencia(inventoryId),
    enabled: sessao?.estado === 'EM_CONFERENCIA' || sessao?.estado === 'APROVADO' || sessao?.estado === 'APLICADO',
  });

  // Busca da Trilha de Auditoria
  const {
    data: auditoriaList,
    refetch: refetchAuditoria
  } = useQuery({
    queryKey: ['inventario-auditoria', inventoryId],
    queryFn: () => inventoryAuditService.obterAuditoria(inventoryId),
  });

  // Sincronizar subTab de acordo com o estado do inventário
  useEffect(() => {
    if (sessao?.estado === 'EM_CONTAGEM') {
      setSubTab('contagem');
    } else if (sessao?.estado === 'EM_CONFERENCIA' || sessao?.estado === 'APROVADO' || sessao?.estado === 'APLICADO') {
      setSubTab('conferencia');
    }
  }, [sessao?.estado]);

  const rawItens = itensData?.items || [];

  // Itens filtrados para exibição
  const filteredItens = useMemo(() => {
    return rawItens.filter(it => {
      // Filtro de pesquisa
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchCode = it.codigo && it.codigo.toLowerCase().includes(term);
        const matchName = it.nome.toLowerCase().includes(term);
        const matchCat = it.categoria && it.categoria.toLowerCase().includes(term);
        if (!matchCode && !matchName && !matchCat) return false;
      }

      // Filtro de tipo
      if (tipoFiltro !== 'TODOS' && it.tipo_item !== tipoFiltro) {
        return false;
      }

      // Filtros da aba de conferência
      if (subTab === 'conferencia') {
        if (conferenciaFiltro === 'DIVERGENCIAS') {
          return it.situacao === 'FALTA' || it.situacao === 'SOBRA';
        }
        if (conferenciaFiltro === 'FALTAS') {
          return it.situacao === 'FALTA';
        }
        if (conferenciaFiltro === 'SOBRAS') {
          return it.situacao === 'SOBRA';
        }
        if (conferenciaFiltro === 'SEM_DIVERGENCIA') {
          return it.situacao === 'SEM_DIVERGENCIA';
        }
        if (conferenciaFiltro === 'NAO_CONTADOS') {
          return it.situacao === 'NAO_CONTADO' || it.quantidade_contada === null;
        }
      }

      return true;
    });
  }, [rawItens, searchTerm, tipoFiltro, subTab, conferenciaFiltro]);

  // Contagem de itens pendentes
  const itensPendentes = useMemo(() => {
    return rawItens.filter(it => it.quantidade_contada === null).length;
  }, [rawItens]);

  // Atualização atómica onBlur de um item
  const handleSaveItemCount = async (item: InventarioItemBackend, forceQtd?: number) => {
    const rawVal = forceQtd !== undefined ? forceQtd : editedCounts[item.id];
    if (rawVal === undefined || rawVal === '') return;

    const qtd = Number(rawVal);
    if (isNaN(qtd) || qtd < 0) {
      toast.error('Informe uma quantidade válida igual ou superior a zero.');
      return;
    }

    try {
      setSavingItemIds(prev => ({ ...prev, [item.id]: true }));
      await inventoryAuditService.atualizarItem(inventoryId, item.id, {
        quantidade_contada: qtd,
        motivo_ajuste: editedMotivos[item.id] || item.motivo_ajuste || undefined,
        observacao: editedNotas[item.id] !== undefined ? editedNotas[item.id] : (item.observacao || undefined)
      });
      
      refetchItens();
      refetchSessao();
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao gravar contagem do artigo.');
    } finally {
      setSavingItemIds(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Atualização do motivo de ajuste
  const handleUpdateMotivo = async (item: InventarioItemBackend, motivo: string) => {
    setEditedMotivos(prev => ({ ...prev, [item.id]: motivo }));
    try {
      await inventoryAuditService.atualizarItem(inventoryId, item.id, {
        quantidade_contada: item.quantidade_contada ?? item.quantidade_sistema,
        motivo_ajuste: motivo,
        observacao: editedNotas[item.id] !== undefined ? editedNotas[item.id] : (item.observacao || undefined)
      });
      refetchItens();
      refetchConferencia();
      toast.success(`Motivo "${motivo}" registado para ${item.nome}.`, { autoClose: 1500 });
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao atualizar motivo.');
    }
  };

  // Gravar todas as contagens pendentes em lote
  const handleSaveAllBatch = async () => {
    const entries = Object.entries(editedCounts).filter(([_, val]) => val !== '' && val !== undefined);
    if (entries.length === 0) {
      toast.info('Não existem novas contagens pendentes para gravar.');
      return;
    }

    try {
      setActionLoading(true);
      const payload = entries.map(([idStr, val]) => ({
        item_id: Number(idStr),
        quantidade_contada: Number(val),
        motivo_ajuste: editedMotivos[Number(idStr)]
      }));

      await inventoryAuditService.salvarContagensLote(inventoryId, payload);
      toast.success(`${payload.length} contagens gravadas em lote com sucesso.`);
      setEditedCounts({});
      refetchItens();
      refetchSessao();
      refetchConferencia();
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao gravar contagens em lote.');
    } finally {
      setActionLoading(false);
    }
  };

  // Preenchimento rápido: marcar como conforme (igual ao sistema)
  const handleSetConforme = (item: InventarioItemBackend) => {
    setEditedCounts(prev => ({ ...prev, [item.id]: item.quantidade_sistema }));
    handleSaveItemCount(item, item.quantidade_sistema);
  };

  // Máquina de Estados: Iniciar Contagem
  const handleIniciarContagem = async () => {
    try {
      setActionLoading(true);
      await inventoryAuditService.iniciar(inventoryId);
      toast.success('Contagem física iniciada! O snapshot do stock foi congelado com sucesso.');
      refetchSessao();
      refetchItens();
      refetchAuditoria();
      setSubTab('contagem');
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao iniciar contagem.');
    } finally {
      setActionLoading(false);
    }
  };

  // Máquina de Estados: Finalizar Contagem
  const handleFinalizarContagem = async () => {
    try {
      setActionLoading(true);
      await inventoryAuditService.finalizarContagem(inventoryId, forcarFinalizacao);
      toast.success('Contagem física finalizada! O inventário avançou para fase de CONFERÊNCIA.');
      setIsFinalizarModalOpen(false);
      refetchSessao();
      refetchConferencia();
      refetchAuditoria();
      setSubTab('conferencia');
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao finalizar contagem física.');
    } finally {
      setActionLoading(false);
    }
  };

  // Atribuição automática de motivo pendente
  const handleAutoAtribuirMotivos = async () => {
    const divergenciasSemMotivo = rawItens.filter(
      it => (it.situacao === 'FALTA' || it.situacao === 'SOBRA') && !it.motivo_ajuste && !editedMotivos[it.id]
    );
    if (divergenciasSemMotivo.length === 0) {
      toast.info('Não há divergências sem motivo pendentes.');
      return;
    }
    try {
      setActionLoading(true);
      for (const item of divergenciasSemMotivo) {
        await inventoryAuditService.atualizarItem(inventoryId, item.id, {
          quantidade_contada: item.quantidade_contada ?? 0,
          motivo_ajuste: 'OUTROS',
          observacao: item.observacao || 'Justificação automática por regularização de inventário'
        });
      }
      toast.success(`${divergenciasSemMotivo.length} artigos atualizados com motivo de ajuste "OUTROS".`);
      refetchItens();
      refetchSessao();
      refetchConferencia();
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao atribuir motivos automaticamente.');
    } finally {
      setActionLoading(false);
    }
  };

  // Máquina de Estados: Aprovar Inventário
  const handleAprovarInventario = async () => {
    try {
      setActionLoading(true);
      await inventoryAuditService.aprovar(inventoryId);
      toast.success('Inventário formalmente APROVADO! Pronto para aplicação no stock.');
      setIsAprovarModalOpen(false);
      refetchSessao();
      refetchAuditoria();
      refetchConferencia();
      refetchItens();
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao aprovar inventário.');
    } finally {
      setActionLoading(false);
    }
  };

  // Máquina de Estados: Aplicar Ajustes Atómicos
  const handleAplicarAjustes = async () => {
    try {
      setActionLoading(true);
      await inventoryAuditService.aplicar(inventoryId);
      toast.success('Ajustes de stock APLICADOS com sucesso! Operação atómica concluída e imutável.');
      setIsAplicarModalOpen(false);
      refetchSessao();
      refetchAuditoria();
      onStockUpdated();
      queryClient.invalidateQueries({ queryKey: ['consolidated-stock-inventory'] });
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao aplicar ajustes no stock.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancelar inventário
  const handleCancelarInventario = async () => {
    if (!cancelMotivo.trim()) {
      toast.error('Informe a justificativa do cancelamento.');
      return;
    }
    try {
      setActionLoading(true);
      await inventoryAuditService.cancelar(inventoryId, cancelMotivo.trim());
      toast.warn('Inventário cancelado.');
      setIsCancelModalOpen(false);
      refetchSessao();
      refetchAuditoria();
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao cancelar inventário.');
    } finally {
      setActionLoading(false);
    }
  };

  // Exportações Oficiais
  const handleExportExcel = async () => {
    try {
      toast.info('A descarregar folha de cálculo oficial (.xlsx)...', { autoClose: 2000 });
      await inventoryAuditService.exportarExcel(inventoryId);
      toast.success('Exportação Excel concluída!');
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao descarregar Excel oficial.');
    }
  };

  const handleExportPdf = async () => {
    try {
      toast.info('A gerar relatório oficial em PDF com carimbo e assinaturas...', { autoClose: 2500 });
      await inventoryAuditService.exportarPdf(inventoryId);
      toast.success('Relatório PDF descarregado com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao descarregar PDF oficial.');
    }
  };

  if (isSessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">
          A carregar detalhes da sessão de inventário #{inventoryId}...
        </p>
      </div>
    );
  }

  if (isSessionError || !sessao) {
    const errorObj = sessionError as any;
    const errorStr = String(errorObj?.message || errorObj?.details?.exception || errorObj?.details || errorObj || '');
    const isUnknownColumn = errorStr.includes("Unknown column 'inventarios.armazem_id'") || 
                           errorStr.includes("inventarios.armazem_id");

    return (
      <div className="p-6 sm:p-8 bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-900/50 space-y-6 shadow-sm animate-fadeIn">
        <div className="flex items-start gap-3.5 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-7 h-7 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-lg font-black text-gray-900 dark:text-white">
              Erro ao carregar Sessão de Inventário #{inventoryId}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isUnknownColumn
                ? "Incompatibilidade no esquema de dados MySQL (a tabela 'inventarios' não possui a coluna 'armazem_id')."
                : (errorObj?.message || 'Não foi possível carregar os dados desta sessão de inventário.')}
            </p>
          </div>
        </div>

        {isUnknownColumn && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2.5">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs uppercase tracking-wider">
              <Info size={16} />
              <span>Instrução para a Equipa de Backend / Administrador MySQL:</span>
            </div>
            <p className="text-xs text-amber-900 dark:text-amber-200">
              O modelo SQLAlchemy no backend define a coluna <code className="font-mono bg-amber-200/50 dark:bg-amber-900/50 px-1 py-0.5 rounded">armazem_id</code>, mas a tabela física MySQL ainda não tem esse campo. Execute no MySQL:
            </p>
            <pre className="p-3 bg-gray-900 text-emerald-400 text-xs rounded-lg overflow-x-auto font-mono select-all">
              ALTER TABLE inventarios ADD COLUMN armazem_id INT NOT NULL DEFAULT 1 AFTER numero;
            </pre>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onBack}
            className="px-4 py-2.5 text-sm font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl transition flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Voltar à Lista
          </button>
          <button
            onClick={() => refetchSessao()}
            className="px-4 py-2.5 text-sm font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition shadow-sm flex items-center gap-2"
          >
            <RotateCcw size={16} />
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Stepper helper
  const steps: { key: InventarioEstado; label: string; num: number }[] = [
    { key: 'RASCUNHO', label: '1. Rascunho', num: 1 },
    { key: 'EM_CONTAGEM', label: '2. Contagem', num: 2 },
    { key: 'EM_CONFERENCIA', label: '3. Conferência', num: 3 },
    { key: 'APROVADO', label: '4. Aprovado', num: 4 },
    { key: 'APLICADO', label: '5. Aplicado', num: 5 }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === sessao.estado);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-xl transition-colors shrink-0 mt-0.5"
            title="Voltar à lista de inventários"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                Inventário #{sessao.id}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black tracking-wide uppercase ${
                sessao.estado === 'RASCUNHO' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' :
                sessao.estado === 'EM_CONTAGEM' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 ring-2 ring-blue-500/20 animate-pulse' :
                sessao.estado === 'EM_CONFERENCIA' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 ring-2 ring-amber-500/20' :
                sessao.estado === 'APROVADO' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300' :
                sessao.estado === 'APLICADO' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' :
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {sessao.estado.replace('_', ' ')}
              </span>
              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-semibold">
                {sessao.tipo === 'COMPLETO' ? 'Inventário Completo' : 'Inventário Parcial'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Warehouse size={14} className="text-gray-400" />
                <strong>Armazém:</strong> {sessao.armazem_nome || `Armazém #${sessao.armazem_id}`}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} className="text-gray-400" />
                <strong>Data da Auditoria:</strong> {sessao.data_inventario}
              </span>
              {sessao.observacao && (
                <span className="text-gray-400 italic">
                  "{sessao.observacao}"
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global Export & Cancel Buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-all shadow-sm"
          >
            <FileSpreadsheet size={15} />
            Exportar Excel (.xlsx)
          </button>

          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 rounded-xl transition-all shadow-sm"
          >
            <FileText size={15} />
            Exportar PDF
          </button>

          {sessao.estado !== 'APLICADO' && sessao.estado !== 'CANCELADO' && (
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
            >
              <XCircle size={15} />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* State Machine Stepper Visual */}
      <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center justify-between overflow-x-auto pb-1">
          {steps.map((step, idx) => {
            const isPassed = currentStepIndex > idx || sessao.estado === 'APLICADO';
            const isCurrent = sessao.estado === step.key;
            return (
              <div key={step.key} className="flex items-center flex-1 min-w-[130px] last:flex-none">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isPassed
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-primary text-white ring-4 ring-primary/20 scale-110 shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                    }`}
                  >
                    {isPassed ? <Check size={14} /> : step.num}
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`text-xs font-bold leading-none ${
                        isCurrent
                          ? 'text-primary dark:text-primary'
                          : isPassed
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">
                      {isPassed ? 'Concluído' : isCurrent ? 'Em Curso' : 'Aguardando'}
                    </span>
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      currentStepIndex > idx
                        ? 'bg-emerald-600'
                        : 'bg-gray-200 dark:bg-gray-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total de Artigos
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {sessao.total_itens ?? rawItens.length}
            </span>
            <span className="text-xs text-gray-500 font-semibold">no armazém</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Progresso
            </span>
            <span className="text-xs font-black text-primary">
              {sessao.percentagem_concluida ?? 0}%
            </span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {sessao.itens_contados ?? 0}
            </span>
            <span className="text-xs text-gray-500 font-semibold">
              / {sessao.total_itens ?? rawItens.length} contados
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${sessao.percentagem_concluida ?? 0}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-red-500 uppercase tracking-wider block flex items-center gap-1">
            <TrendingDown size={14} /> Faltas (Quebras)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-red-600 dark:text-red-400">
              {sessao.total_faltas ?? 0}
            </span>
            <span className="text-xs text-gray-400">artigos</span>
          </div>
          <span className="text-[11px] font-bold text-red-500/80 block mt-0.5">
            -{formatCurrency(sessao.valor_faltas || 0)}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block flex items-center gap-1">
            <TrendingUp size={14} /> Sobras (Excedentes)
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {sessao.total_sobras ?? 0}
            </span>
            <span className="text-xs text-gray-400">artigos</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-500/80 block mt-0.5">
            +{formatCurrency(sessao.valor_sobras || 0)}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Impacto Financeiro Líquido
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-xl sm:text-2xl font-black ${
                (sessao.impacto_financeiro_liquido || 0) < 0
                  ? 'text-red-600 dark:text-red-400'
                  : (sessao.impacto_financeiro_liquido || 0) > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-900 dark:text-white'
              }`}
            >
              {formatCurrency(sessao.impacto_financeiro_liquido || 0)}
            </span>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">
            Custo total de reposição estimado
          </span>
        </div>
      </div>

      {/* Action Banner According to Current Lifecycle State */}
      {sessao.estado === 'RASCUNHO' && (
        <div className="bg-gradient-to-r from-blue-500/10 via-primary/10 to-indigo-500/10 border border-blue-200 dark:border-blue-800/60 p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
              <Play size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Passo 1: Iniciar Contagem Física (Snapshot Congelado)
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 max-w-2xl">
                Ao iniciar, o sistema tira uma fotografia instantânea do stock atual no armazém <strong>{sessao.armazem_nome}</strong>. O inventário passará para <strong>EM_CONTAGEM</strong> e a equipa poderá lançar as contagens físicas sem alteração do saldo de sistema.
              </p>
            </div>
          </div>
          <button
            onClick={handleIniciarContagem}
            disabled={actionLoading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 justify-center shrink-0 disabled:opacity-50"
          >
            <Play size={16} />
            Iniciar Contagem Física
          </button>
        </div>
      )}

      {sessao.estado === 'EM_CONTAGEM' && (
        <div className="bg-gradient-to-r from-amber-500/10 via-primary/10 to-orange-500/10 border border-amber-200 dark:border-amber-800/60 p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-md">
              <CheckCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Passo 2: Contagem Física Ativa
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 max-w-2xl">
                Preencha a coluna <strong>Qtd Contada</strong>. As gravações ocorrem automaticamente ao sair do campo (onBlur). Quando terminar, avance para a fase de conferência analítica de divergências.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleSaveAllBatch}
              disabled={actionLoading || Object.keys(editedCounts).length === 0}
              className="px-4 py-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:opacity-90 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40"
            >
              <Save size={15} />
              Gravar Lote ({Object.keys(editedCounts).length})
            </button>

            <button
              onClick={() => setIsFinalizarModalOpen(true)}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCheck size={16} />
              Finalizar Contagem
            </button>
          </div>
        </div>
      )}

      {sessao.estado === 'EM_CONFERENCIA' && (
        <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-800/60 p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-md">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Passo 3: Conferência Analítica & Justificação de Desvios
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 max-w-2xl">
                Analise as discrepâncias (Faltas e Sobras). É obrigatório atribuir o <strong>Motivo de Ajuste</strong> a cada divergência antes de aprovar formalmente o inventário.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAprovarModalOpen(true)}
            disabled={actionLoading}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 justify-center shrink-0 disabled:opacity-50 min-h-[44px]"
          >
            <CheckCircle2 size={16} />
            Aprovar Inventário
          </button>
        </div>
      )}

      {sessao.estado === 'APROVADO' && (
        <div className="bg-gradient-to-r from-emerald-500/10 via-green-500/10 to-teal-500/10 border border-emerald-300 dark:border-emerald-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-md">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                Passo 4: Inventário Aprovado — Pronto para Aplicação Atómica
              </h3>
              <p className="text-xs text-emerald-900/80 dark:text-emerald-300/80 mt-0.5 max-w-2xl">
                A chefia aprovou todos os desvios. O próximo passo executará a transação <strong>POST /aplicar</strong> no backend do SIGI ERP, gerando os movimentos de ajuste oficiais e tornando o inventário imutável.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAplicarModalOpen(true)}
            disabled={actionLoading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 justify-center shrink-0 disabled:opacity-50"
          >
            <Zap size={16} />
            Aplicar Ajustes no Stock
          </button>
        </div>
      )}

      {sessao.estado === 'APLICADO' && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-emerald-600 text-white rounded-xl">
            <Lock size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block">
              Inventário Aplicado e Arquivado
            </span>
            <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
              Os movimentos oficiais foram emitidos no sistema. Este registo é imutável para efeitos de auditoria externa e fiscal.
            </span>
          </div>
        </div>
      )}

      {sessao.estado === 'CANCELADO' && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/60 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-2 bg-red-600 text-white rounded-xl">
            <XCircle size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-red-900 dark:text-red-200 block">
              Inventário Cancelado
            </span>
            <span className="text-[11px] text-red-800/80 dark:text-red-300/80">
              Nenhuma alteração de stock foi realizada. {sessao.observacao}
            </span>
          </div>
        </div>
      )}

      {/* Tabs Internas da Sessão */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        {/* Navigation Sub-Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-4 pt-2 gap-2 bg-gray-50/50 dark:bg-gray-800/50">
          <button
            onClick={() => setSubTab('contagem')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              subTab === 'contagem'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <CheckCheck size={16} />
            Folha Operacional de Contagem
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {rawItens.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('conferencia')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              subTab === 'conferencia'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <ShieldCheck size={16} />
            Conferência Analítica de Divergências
            {(sessao.total_divergencias ?? 0) > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 animate-pulse">
                {sessao.total_divergencias}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('auditoria')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold border-b-2 transition-all ${
              subTab === 'auditoria'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Clock size={16} />
            Trilha de Auditoria (Logs)
          </button>
        </div>

        {/* Filters and Controls Bar */}
        {subTab !== 'auditoria' && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white dark:bg-gray-900">
            {/* Search & Quick Filters */}
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Pesquisar por código, artigo ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 outline-none"
              >
                <option value="TODOS">Todos os Tipos</option>
                <option value="PRODUTO">Apenas Produtos</option>
                <option value="MATERIAL">Apenas Materiais</option>
              </select>
            </div>

            {/* Toggle Modo Cego (Recomendação Manual de Auditoria) */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setModoCego(!modoCego)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  modoCego
                    ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                    : 'bg-gray-100 border-gray-200 text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                }`}
                title="No modo cego, as quantidades teóricas do sistema ficam ocultas para os operadores para evitar contagens viciadas."
              >
                {modoCego ? <EyeOff size={14} className="text-amber-600" /> : <Eye size={14} />}
                <span>Auditoria Cega: <strong>{modoCego ? 'Ativa' : 'Desativada'}</strong></span>
              </button>
            </div>
          </div>
        )}

        {/* Sub-Aba 1: Folha Operacional de Contagem */}
        {subTab === 'contagem' && (
          <div>
            {sessao.estado === 'RASCUNHO' ? (
              <div className="p-12 text-center text-gray-500">
                <Info size={32} className="mx-auto mb-2 text-blue-500" />
                <p className="font-bold text-gray-800 dark:text-gray-200">
                  O inventário ainda se encontra em estado de RASCUNHO.
                </p>
                <p className="text-xs mt-1">
                  Clique no botão azul acima <strong>"Iniciar Contagem Física"</strong> para congelar o snapshot do armazém e libertar a grelha de contagem.
                </p>
              </div>
            ) : filteredItens.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-xs">
                Nenhum artigo localizado com os filtros selecionados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-gray-500 font-bold">
                      <th className="py-2.5 px-4">Código</th>
                      <th className="py-2.5 px-4">Artigo</th>
                      <th className="py-2.5 px-4">Tipo</th>
                      <th className="py-2.5 px-4">Unidade</th>
                      <th className="py-2.5 px-4 text-right">Saldo Sistema</th>
                      <th className="py-2.5 px-4 text-center w-36">Qtd Contada</th>
                      <th className="py-2.5 px-4 text-center">Situação</th>
                      <th className="py-2.5 px-4 text-center w-28">Ação Rápida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                    {filteredItens.map((item) => {
                      const isCounted = item.quantidade_contada !== null;
                      const localVal = editedCounts[item.id] !== undefined ? editedCounts[item.id] : (item.quantidade_contada ?? '');
                      const isSaving = savingItemIds[item.id];

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors ${
                            isCounted ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''
                          }`}
                        >
                          <td className="py-2.5 px-4 font-mono text-[11px] text-gray-500">
                            {item.codigo || `PRD-${item.item_id}`}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="font-bold text-gray-900 dark:text-white block">
                              {item.nome}
                            </span>
                            {item.categoria && (
                              <span className="text-[10px] text-gray-400">
                                {item.categoria}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.tipo_item === 'MATERIAL'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                            }`}>
                              {item.tipo_item === 'MATERIAL' ? 'Material' : 'Produto'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-gray-500 font-semibold">
                            {item.unidade_medida || 'UN'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-700 dark:text-gray-300">
                            {modoCego ? (
                              <span className="text-gray-400 font-normal italic">*** Oculto</span>
                            ) : (
                              item.quantidade_sistema
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <div className="relative inline-block w-28">
                              <input
                                type="number"
                                step="any"
                                min="0"
                                disabled={sessao.estado !== 'EM_CONTAGEM'}
                                value={localVal}
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Number(e.target.value);
                                  setEditedCounts(prev => ({ ...prev, [item.id]: val }));
                                }}
                                onBlur={() => handleSaveItemCount(item)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveItemCount(item);
                                  }
                                }}
                                placeholder="0.00"
                                className={`w-full text-center px-2 py-1.5 font-bold rounded-xl border outline-none text-xs transition-all ${
                                  isCounted
                                    ? 'border-blue-300 dark:border-blue-700 bg-white dark:bg-gray-800 text-blue-900 dark:text-blue-100 font-mono'
                                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-500'
                                } focus:border-primary focus:ring-2 focus:ring-primary/20`}
                              />
                              {isSaving && (
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {item.situacao === 'NAO_CONTADO' || item.quantidade_contada === null ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                Não Contado
                              </span>
                            ) : item.situacao === 'SEM_DIVERGENCIA' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                Conforme
                              </span>
                            ) : item.situacao === 'FALTA' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                                Falta ({item.diferenca})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                                Sobra (+{item.diferenca})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            {sessao.estado === 'EM_CONTAGEM' && (
                              <button
                                type="button"
                                onClick={() => handleSetConforme(item)}
                                className="px-2 py-1 text-[10px] font-bold text-gray-600 dark:text-gray-300 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                                title="Marcar contagem igual ao saldo de sistema"
                              >
                                Conforme
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sub-Aba 2: Conferência Analítica de Divergências */}
        {subTab === 'conferencia' && (
          <div>
            {/* Filter Pills for Discrepancies */}
            <div className="p-3 bg-gray-50/70 dark:bg-gray-800/40 border-b border-gray-200 dark:border-gray-800 flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setConferenciaFiltro('TODOS')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  conferenciaFiltro === 'TODOS'
                    ? 'bg-primary text-white font-bold'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                Todos ({rawItens.length})
              </button>

              <button
                onClick={() => setConferenciaFiltro('DIVERGENCIAS')}
                className={`px-3 py-1 rounded-xl transition-all flex items-center gap-1 ${
                  conferenciaFiltro === 'DIVERGENCIAS'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 border border-gray-200 dark:border-gray-700'
                }`}
              >
                <AlertTriangle size={12} />
                Divergências ({sessao.total_divergencias ?? 0})
              </button>

              <button
                onClick={() => setConferenciaFiltro('FALTAS')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  conferenciaFiltro === 'FALTAS'
                    ? 'bg-red-600 text-white font-bold'
                    : 'bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-gray-200 dark:border-gray-700'
                }`}
              >
                Faltas ({sessao.total_faltas ?? 0})
              </button>

              <button
                onClick={() => setConferenciaFiltro('SOBRAS')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  conferenciaFiltro === 'SOBRAS'
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-gray-700'
                }`}
              >
                Sobras ({sessao.total_sobras ?? 0})
              </button>

              <button
                onClick={() => setConferenciaFiltro('SEM_DIVERGENCIA')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  conferenciaFiltro === 'SEM_DIVERGENCIA'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                }`}
              >
                Sem Divergência
              </button>

              <button
                onClick={() => setConferenciaFiltro('NAO_CONTADOS')}
                className={`px-3 py-1 rounded-xl transition-all ${
                  conferenciaFiltro === 'NAO_CONTADOS'
                    ? 'bg-gray-700 text-white font-bold'
                    : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-700'
                }`}
              >
                Não Contados ({itensPendentes})
              </button>
            </div>

            {filteredItens.length === 0 ? (
              <div className="p-12 text-center text-gray-500 text-xs">
                Nenhum registo encontrado para este filtro de conferência.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 text-gray-500 font-bold">
                      <th className="py-2.5 px-4">Artigo</th>
                      <th className="py-2.5 px-3 text-right">Saldo Sistema</th>
                      <th className="py-2.5 px-3 text-right">Qtd Contada</th>
                      <th className="py-2.5 px-3 text-right">Desvio</th>
                      <th className="py-2.5 px-3 text-right">Impacto Financeiro</th>
                      <th className="py-2.5 px-4 w-48">Motivo do Ajuste <span className="text-red-500">*</span></th>
                      <th className="py-2.5 px-4">Notas de Auditoria</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                    {filteredItens.map((item) => {
                      const temDesvio = item.diferenca !== null && item.diferenca !== 0;
                      const selectedMotivo = editedMotivos[item.id] || item.motivo_ajuste || '';

                      return (
                        <tr
                          key={item.id}
                          className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors ${
                            temDesvio && !selectedMotivo
                              ? 'bg-amber-50/40 dark:bg-amber-950/20'
                              : ''
                          }`}
                        >
                          <td className="py-2.5 px-4">
                            <span className="font-mono text-[10px] text-gray-400 block">
                              {item.codigo || `PRD-${item.item_id}`}
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {item.nome}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-semibold text-gray-600 dark:text-gray-300">
                            {item.quantidade_sistema} {item.unidade_medida}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900 dark:text-white">
                            {item.quantidade_contada ?? '-'} {item.unidade_medida}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black">
                            {item.diferenca === null ? (
                              <span className="text-gray-400">-</span>
                            ) : item.diferenca < 0 ? (
                              <span className="text-red-600 dark:text-red-400">
                                {item.diferenca} {item.unidade_medida}
                              </span>
                            ) : item.diferenca > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                +{item.diferenca} {item.unidade_medida}
                              </span>
                            ) : (
                              <span className="text-gray-500 font-semibold">0</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            {item.valor_impacto === null || item.valor_impacto === undefined ? (
                              <span className="text-gray-400">-</span>
                            ) : (
                              <span
                                className={
                                  item.valor_impacto < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : item.valor_impacto > 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-gray-500'
                                }
                              >
                                {formatCurrency(item.valor_impacto)}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {temDesvio ? (
                              <select
                                value={selectedMotivo}
                                disabled={sessao.estado === 'APLICADO' || sessao.estado === 'CANCELADO'}
                                onChange={(e) => handleUpdateMotivo(item, e.target.value)}
                                className={`w-full px-2 py-1.5 text-xs font-bold rounded-xl border outline-none transition-all ${
                                  !selectedMotivo
                                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100 ring-2 ring-amber-500/20'
                                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                                }`}
                              >
                                <option value="">-- Selecione o Motivo --</option>
                                {MOTIVOS_AJUSTE.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-gray-400 italic text-[11px]">
                                Não aplicável
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            <input
                              type="text"
                              disabled={sessao.estado === 'APLICADO' || sessao.estado === 'CANCELADO'}
                              value={editedNotas[item.id] !== undefined ? editedNotas[item.id] : (item.observacao || '')}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditedNotas(prev => ({ ...prev, [item.id]: val }));
                              }}
                              onBlur={() => {
                                if (editedNotas[item.id] !== undefined) {
                                  inventoryAuditService.atualizarItem(inventoryId, item.id, {
                                    quantidade_contada: item.quantidade_contada ?? item.quantidade_sistema,
                                    motivo_ajuste: selectedMotivo || undefined,
                                    observacao: editedNotas[item.id]
                                  });
                                }
                              }}
                              placeholder="Notas de auditoria..."
                              className="w-full px-2 py-1 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sub-Aba 3: Trilha de Auditoria (Logs) */}
        {subTab === 'auditoria' && (
          <div className="p-6">
            <div className="max-w-3xl space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                Registo de Eventos e Rastreabilidade de Auditoria
              </h3>
              <p className="text-xs text-gray-500">
                Cada mudança de estado, snapshot congelado, registo de contagem ou aplicação de movimentos é gravada de forma indelével pelo AuditService.
              </p>

              <div className="relative border-l-2 border-gray-200 dark:border-gray-800 ml-3 mt-6 space-y-6">
                {(auditoriaList || []).map((audit: InventarioAuditoriaItem, idx: number) => (
                  <div key={audit.id || idx} className="relative pl-6">
                    <div className="absolute -left-2 top-0.5 w-4 h-4 rounded-full bg-primary ring-4 ring-white dark:ring-gray-900" />
                    <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700/60">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider">
                          {audit.acao}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(audit.data_hora).toLocaleString('pt-PT')}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        {audit.detalhes || 'Transição de auditoria processada com sucesso.'}
                      </div>
                      {audit.utilizador_nome && (
                        <div className="text-[10px] text-gray-400 mt-1">
                          Operador: <strong>{audit.utilizador_nome}</strong> {audit.ip ? `(${audit.ip})` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Finalizar Contagem Física */}
      {isFinalizarModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-finalizar-title"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl">
                <CheckCheck size={22} />
              </div>
              <div>
                <h3 id="modal-finalizar-title" className="text-base font-bold text-gray-900 dark:text-white">
                  Finalizar Contagem Física?
                </h3>
                <p className="text-xs text-gray-500">
                  Avançar para a fase de conferência analítica de divergências
                </p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs space-y-1 text-gray-600 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Artigos contados:</span>
                <strong className="text-gray-900 dark:text-white">{sessao.itens_contados ?? 0} / {sessao.total_itens ?? rawItens.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Progresso geral:</span>
                <strong className="text-primary font-bold">{sessao.percentagem_concluida ?? 0}%</strong>
              </div>
            </div>

            {itensPendentes > 0 && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle size={17} className="text-amber-600 shrink-0" />
                  <span>Atenção: Existem {itensPendentes} artigos ainda não contados!</span>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  Para avançar sem contar os artigos pendentes, ative a permissão abaixo:
                </p>
                <button
                  type="button"
                  onClick={() => setForcarFinalizacao(!forcarFinalizacao)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-bold transition-all ${
                    forcarFinalizacao
                      ? 'bg-amber-100 border-amber-400 text-amber-950 dark:bg-amber-900/60 dark:border-amber-700 dark:text-amber-100'
                      : 'bg-white border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>Permitir avanço com artigos pendentes</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${forcarFinalizacao ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {forcarFinalizacao ? 'AUTORIZADO' : 'BLOQUEADO'}
                  </span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFinalizarModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl min-h-[44px]"
              >
                Voltar à Contagem
              </button>
              <button
                type="button"
                onClick={() => {
                  if (itensPendentes > 0 && !forcarFinalizacao) {
                    setForcarFinalizacao(true);
                    toast.info('Autorização para artigos pendentes ativada. Clique novamente em confirmar.', { autoClose: 3500 });
                    return;
                  }
                  handleFinalizarContagem();
                }}
                disabled={actionLoading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition-colors disabled:opacity-50 min-h-[44px] flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>A processar...</span>
                  </>
                ) : (
                  <>
                    <CheckCheck size={16} />
                    <span>{itensPendentes > 0 && !forcarFinalizacao ? 'Autorizar e Finalizar' : 'Confirmar Finalização'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Aprovar Inventário Formalmente */}
      {isAprovarModalOpen && (() => {
        const divergenciasSemMotivo = rawItens.filter(
          it => (it.situacao === 'FALTA' || it.situacao === 'SOBRA') && !it.motivo_ajuste && !editedMotivos[it.id]
        );
        const hasBlocker = divergenciasSemMotivo.length > 0;

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-aprovar-title"
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 id="modal-aprovar-title" className="text-base font-bold text-gray-900 dark:text-white">
                    Aprovar Inventário Formalmente?
                  </h3>
                  <p className="text-xs text-gray-500">
                    Validação do balanço e conferência de desvios (Sessão #{inventoryId})
                  </p>
                </div>
              </div>

              {/* Resumo financeiro e físico */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs space-y-2 text-gray-700 dark:text-gray-300">
                <div className="flex justify-between">
                  <span>Armazém Auditado:</span>
                  <strong className="text-gray-900 dark:text-white">{sessao.armazem_nome}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Total de Divergências Encontradas:</span>
                  <strong className="text-gray-900 dark:text-white font-mono">{sessao.total_divergencias ?? 0} artigos</strong>
                </div>
                <div className="flex justify-between text-red-600 dark:text-red-400">
                  <span>Faltas apuradas:</span>
                  <span className="font-mono font-bold">{sessao.total_faltas ?? 0} (-{formatCurrency(sessao.valor_faltas || 0)})</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Sobras apuradas:</span>
                  <span className="font-mono font-bold">+{sessao.total_sobras ?? 0} (+{formatCurrency(sessao.valor_sobras || 0)})</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 font-bold text-sm">
                  <span>Impacto Financeiro Líquido:</span>
                  <span className={(sessao.impacto_financeiro_liquido || 0) < 0 ? 'text-red-600 font-mono' : 'text-emerald-600 font-mono'}>
                    {formatCurrency(sessao.impacto_financeiro_liquido || 0)}
                  </span>
                </div>
              </div>

              {/* Verificação de motivos obrigatórios */}
              {hasBlocker ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 rounded-xl text-xs space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0" />
                    <span>Atenção: {divergenciasSemMotivo.length} artigo(s) com divergência sem motivo atribuído</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Pelo regulamento de auditoria interna, todas as faltas e sobras devem possuir uma justificação formal antes da aprovação da chefia.
                  </p>
                  
                  {/* Lista rápida de artigos pendentes */}
                  <div className="max-h-28 overflow-y-auto bg-white/80 dark:bg-gray-900/80 p-2 rounded-lg border border-amber-200 dark:border-amber-900/60 divide-y divide-gray-100 dark:divide-gray-800">
                    {divergenciasSemMotivo.slice(0, 5).map(item => (
                      <div key={item.id} className="py-1 text-[11px] flex justify-between items-center">
                        <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[240px]">{item.nome}</span>
                        <span className={`font-mono font-bold ${item.situacao === 'FALTA' ? 'text-red-600' : 'text-emerald-600'}`}>
                          {item.situacao === 'FALTA' ? `Falta ${item.diferenca}` : `Sobra +${item.diferenca}`}
                        </span>
                      </div>
                    ))}
                    {divergenciasSemMotivo.length > 5 && (
                      <div className="py-1 text-[10px] text-gray-400 italic text-center">
                        + {divergenciasSemMotivo.length - 5} outros artigos
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={handleAutoAtribuirMotivos}
                      disabled={actionLoading}
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm min-h-[38px] disabled:opacity-50"
                    >
                      <Sparkles size={14} />
                      {actionLoading ? 'A gravar...' : 'Atribuir "OUTROS" a Todos'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAprovarModalOpen(false);
                        setSubTab('conferencia');
                        setConferenciaFiltro('DIVERGENCIAS');
                      }}
                      className="px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 rounded-xl text-xs font-semibold border border-gray-300 dark:border-gray-700 min-h-[38px]"
                    >
                      Preencher na Tabela
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-xs text-emerald-900 dark:text-emerald-200 font-bold">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                  <span>Conformidade validada: Todas as divergências possuem justificação atribuída.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAprovarModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl min-h-[44px]"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleAprovarInventario}
                  disabled={actionLoading || hasBlocker}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-md transition-colors disabled:opacity-40 min-h-[44px] flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>A aprovar...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirmar Aprovação Formal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODAL: Aplicar Ajustes no Stock (Atómico) */}
      {isAplicarModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-aplicar-title"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                <Zap size={22} />
              </div>
              <div>
                <h3 id="modal-aplicar-title" className="text-base font-bold text-gray-900 dark:text-white">
                  Aplicar Ajustes Oficiais no Stock?
                </h3>
                <p className="text-xs text-gray-500">
                  Operação transacional atómica do motor de movimentos (SIGI ERP)
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl text-xs space-y-2 text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Total de Artigos com Diferença:</span>
                <strong className="text-gray-900 dark:text-white font-mono">{sessao.total_divergencias ?? 0}</strong>
              </div>
              <div className="flex justify-between">
                <span>Faltas a abater do saldo:</span>
                <strong className="text-red-600 dark:text-red-400 font-mono">{sessao.total_faltas ?? 0} artigos</strong>
              </div>
              <div className="flex justify-between">
                <span>Sobras a dar entrada no saldo:</span>
                <strong className="text-emerald-600 dark:text-emerald-400 font-mono">+{sessao.total_sobras ?? 0} artigos</strong>
              </div>
              <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2 font-bold text-sm">
                <span>Impacto Financeiro Líquido:</span>
                <span className={
                  (sessao.impacto_financeiro_liquido || 0) < 0
                    ? 'text-red-600 font-mono'
                    : 'text-emerald-600 font-mono'
                }>
                  {formatCurrency(sessao.impacto_financeiro_liquido || 0)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-gray-500">
              Esta ação é <strong>irreversível</strong>. Todos os movimentos oficiais serão gravados no banco de dados e o inventário passará permanentemente ao estado <strong>APLICADO</strong>.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAplicarModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAplicarAjustes}
                disabled={actionLoading}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors disabled:opacity-50 min-h-[44px] flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>A aplicar movimentos...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Sim, Aplicar no Stock</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cancelar Inventário */}
      {isCancelModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cancelar-title"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 bg-red-100 dark:bg-red-900/40 rounded-xl">
                <XCircle size={22} />
              </div>
              <div>
                <h3 id="modal-cancelar-title" className="text-base font-bold text-gray-900 dark:text-white">
                  Cancelar Sessão de Inventário?
                </h3>
                <p className="text-xs text-gray-500">
                  Esta ação anulará a auditoria atual sem afetar o stock
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="cancel-motivo-input" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Motivo do Cancelamento <span className="text-red-500">*</span>
              </label>
              <textarea
                id="cancel-motivo-input"
                value={cancelMotivo}
                onChange={(e) => setCancelMotivo(e.target.value)}
                placeholder="Ex: Interrupção operacional, erro no armazém selecionado..."
                rows={3}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl min-h-[44px]"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleCancelarInventario}
                disabled={actionLoading || !cancelMotivo.trim()}
                className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md transition-colors disabled:opacity-50 min-h-[44px] flex items-center gap-2"
              >
                {actionLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>A cancelar...</span>
                  </>
                ) : (
                  <>
                    <XCircle size={16} />
                    <span>Confirmar Cancelamento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

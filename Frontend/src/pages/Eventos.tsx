import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as allServices from '../services';
import { formatCurrency } from '../lib/utils';
import { 
  Plus, Edit2, Trash2, Eye, Receipt, FileText, Calendar, Clock, MapPin, Users, 
  DollarSign, Wrench, Package, UserCheck, Shield, ChevronRight, CheckCircle2, AlertCircle, Info, Sparkles, Filter,
  ChefHat, Truck, Play, CheckCheck, RefreshCw, Layers
} from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import Modal from '../components/Common/Modal';
import { DataTable } from '../components/Common/DataTable';
import { ColumnDef } from '@tanstack/react-table';

const formatMoeda = (val: number) => formatCurrency(Number(val || 0));

const ESTADO_TABS = [
  { id: 'Todos', label: 'Todos' },
  { id: 'RASCUNHO', label: 'Rascunho' },
  { id: 'ORCAMENTO', label: 'Orçamento' },
  { id: 'AGUARDANDO_APROVACAO', label: 'Aguardando Aprovação' },
  { id: 'CONFIRMADO', label: 'Confirmado' },
  { id: 'PLANEAMENTO_GERADO', label: 'Planeamento Gerado' },
  { id: 'EM_PREPARACAO', label: 'Em Preparação' },
  { id: 'EM_EXECUCAO', label: 'Em Execução' },
  { id: 'CONCLUIDO', label: 'Concluído' },
  { id: 'FATURADO', label: 'Faturado' },
  { id: 'ENCERRADO', label: 'Encerrado' },
  { id: 'CANCELADO', label: 'Cancelado' }
];

export default function Eventos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('Todos');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  const [page, setPage] = useState(1);
  const [perPage] = useState(10);

  // Main Queries
  const { data: paginatedResponse, isLoading } = useQuery({
    queryKey: ['events', page, perPage, searchTerm, estadoFilter],
    queryFn: () => allServices.eventService.getAll({ 
      page, 
      per_page: perPage, 
      search: searchTerm,
      estado: estadoFilter !== 'Todos' ? estadoFilter : undefined 
    })
  });

  const data = paginatedResponse?.items || [];
  const pagination = paginatedResponse || { page: 1, total: 0, pages: 0 };

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => allServices.eventService.delete(String(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Evento eliminado com sucesso.');
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao eliminar evento.')
  });

  const updateEstadoMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string | number; estado: string }) =>
      allServices.eventService.updateEstado(id, estado),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(`Estado do evento alterado para ${variables.estado.replace('_', ' ')}.`);
      if (currentRecord) {
        setCurrentRecord((prev: any) => prev ? { ...prev, estado: variables.estado } : null);
      }
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao atualizar estado.')
  });

  const gerarPlaneamentoMutation = useMutation({
    mutationFn: (id: string | number) => allServices.eventService.gerarPlaneamento(id),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success('Motor de Planeamento executado com sucesso! Ordens de produção, reservas e requisições geradas.');
      if (currentRecord) {
        setCurrentRecord((prev: any) => prev ? { 
          ...prev, 
          estado: 'PLANEAMENTO_GERADO', 
          planeamento_gerado: true,
          ...(res?.evento || res?.data || {})
        } : null);
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao executar o Motor de Planeamento.');
    }
  });

  const faturarMutation = useMutation({
    mutationFn: ({ id, pagamento }: { id: string | number; pagamento: any }) => allServices.eventService.faturar(id, pagamento),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsViewOpen(false);
      toast.success('Evento faturado com sucesso e convertido em Venda!');
      const vendaId = res?.venda_id || res?.venda?.id || res?.id || currentRecord?.venda_id;
      if (vendaId) {
        Swal.fire({
          title: 'Evento Faturado com Sucesso!',
          text: 'Escolha a opção de documento comercial a gerar:',
          icon: 'success',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonText: '🖨️ Recibo Térmico (80mm)',
          denyButtonText: '📄 Fatura A4 (PDF)',
          cancelButtonText: 'Concluir'
        }).then((choice) => {
          if (choice.isConfirmed) {
            allServices.documentService.imprimirReciboVenda(vendaId).catch((err) => toast.error(err?.message || 'Erro ao imprimir recibo.'));
          } else if (choice.isDenied) {
            allServices.documentService.vendaPdf(vendaId).catch((err) => toast.error(err?.message || 'Erro ao abrir fatura.'));
          }
        });
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao faturar evento.');
    }
  });

  const handleOpenView = (record: any) => {
    setCurrentRecord(record);
    setIsViewOpen(true);
  };

  const handleDelete = (id: string | number) => {
    Swal.fire({
      title: 'Tem a certeza?',
      text: "Esta ação eliminará o registo do evento!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sim, eliminar!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  const handleFaturarEvento = async () => {
    if (!currentRecord?.id) return;
    const rf = currentRecord.resumo_financeiro;
    const saldo = rf ? Number(rf.saldo || 0) : Math.max(0, Number(currentRecord.saldo ?? currentRecord.valor_total ?? 0) - Number(currentRecord.valor_pago ?? 0));
    const valorPadrao = saldo > 0 ? saldo : Number(rf?.total_geral || currentRecord.valor_total || 0);

    const config = JSON.parse(localStorage.getItem('sigi_config') || '{}');
    const moeda = config.moeda || 'STN';

    const result = await Swal.fire({
      title: 'Faturar Evento (Converter em Venda)',
      html: `
        <div class="space-y-3 text-left">
          <label class="block text-xs font-bold uppercase text-gray-500">Valor a receber (${moeda})</label>
          <input id="evento-valor" type="number" min="0.01" step="0.01" class="swal2-input w-full m-0" value="${valorPadrao}">
          <label class="block text-xs font-bold uppercase text-gray-500">Forma de pagamento</label>
          <select id="evento-forma" class="swal2-select w-full m-0">
            <option value="1">Dinheiro</option>
            <option value="3">TPA / POS</option>
            <option value="2">Transferência Bancária</option>
          </select>
          <input id="evento-codigo" class="swal2-input w-full m-0" placeholder="Comprovativo / Código TRX">
          <input id="evento-emissor" class="swal2-input w-full m-0" placeholder="Emissor / Titular">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Faturar Evento',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const valor = Number((document.getElementById('evento-valor') as HTMLInputElement).value);
        const forma = Number((document.getElementById('evento-forma') as HTMLSelectElement).value);
        const codigo = (document.getElementById('evento-codigo') as HTMLInputElement).value.trim();
        const emissor = (document.getElementById('evento-emissor') as HTMLInputElement).value.trim();
        if (!valor || valor <= 0) {
          Swal.showValidationMessage('Informe um valor válido.');
          return false;
        }
        if ((forma === 2 || forma === 3) && (!codigo || !emissor)) {
          Swal.showValidationMessage('Código e emissor são obrigatórios para Transferência/POS.');
          return false;
        }
        return {
          valor,
          forma_pagamento_id: forma,
          codigo_transferencia: forma === 2 || forma === 3 ? codigo : null,
          emissor: forma === 2 || forma === 3 ? emissor : null,
          observacoes: `Faturação comercial do evento ${currentRecord.numero || currentRecord.titulo}`
        };
      }
    });

    if (result.isConfirmed && result.value) {
      faturarMutation.mutate({ id: currentRecord.id, pagamento: result.value as any });
    }
  };

  const getEstadoBadge = (est: string) => {
    const normalized = (est || 'RASCUNHO').toUpperCase().replace(' ', '_');
    const badgeMap: Record<string, { label: string; class: string }> = {
      RASCUNHO: { label: 'Rascunho', class: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
      ORCAMENTO: { label: 'Orçamento', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
      ORCAMENTADO: { label: 'Orçamento', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
      AGUARDANDO_APROVACAO: { label: 'Aguardando Aprovação', class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' },
      AGENDADO: { label: 'Agendado', class: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
      CONFIRMADO: { label: 'Confirmado', class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
      PLANEAMENTO_GERADO: { label: 'Planeamento Gerado', class: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' },
      EM_PREPARACAO: { label: 'Em Preparação', class: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300' },
      EM_EXECUCAO: { label: 'Em Execução', class: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
      CONCLUIDO: { label: 'Concluído', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
      FATURADO: { label: 'Faturado', class: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
      ENCERRADO: { label: 'Encerrado', class: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300' },
      CANCELADO: { label: 'Cancelado', class: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300' },
      ARQUIVADO: { label: 'Arquivado', class: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400' }
    };
    const item = badgeMap[normalized] || { label: est, class: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2.5 py-1 text-xs font-extrabold rounded-full ${item.class}`}>
        {item.label}
      </span>
    );
  };

  const tableColumns = React.useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'numero',
      header: 'Nº Evento',
      cell: (info) => (
        <span className="font-mono text-xs font-bold text-primary">
          {(info.getValue() as string) || `EVT-${info.row.original.id}`}
        </span>
      )
    },
    {
      accessorKey: 'titulo',
      header: 'Título / Tipo de Evento',
      cell: (info) => (
        <div>
          <div className="font-bold text-gray-900 dark:text-white">{(info.getValue() as string) || 'Evento'}</div>
          <div className="text-[11px] text-gray-400 font-medium">{info.row.original.tipo_evento || 'Geral'}</div>
        </div>
      )
    },
    {
      accessorKey: 'cliente_nome',
      header: 'Cliente',
      cell: (info) => (info.getValue() as string) || info.row.original.cliente?.nome || 'Consumidor Final'
    },
    {
      accessorKey: 'data_evento',
      header: 'Data & Horário',
      cell: (info) => (
        <div className="text-xs font-medium">
          <div>📅 {info.getValue() ? new Date(info.getValue() as string).toLocaleDateString('pt-PT') : '-'}</div>
          <div className="text-gray-400">🕒 {info.row.original.hora_inicio || ''} - {info.row.original.hora_fim || ''}</div>
        </div>
      )
    },
    {
      accessorKey: 'numero_convidados',
      header: 'Pax Convidados',
      cell: (info) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200/50">
          <Users size={12} /> {(info.getValue() as number) || 0} pax
        </span>
      )
    },
    {
      accessorKey: 'resumo_financeiro.total_geral',
      header: 'Total Geral',
      cell: (info) => {
        const rf = info.row.original.resumo_financeiro;
        const tot = rf ? rf.total_geral : (info.row.original.valor_total || 0);
        return <span className="font-extrabold text-primary">{formatMoeda(tot)}</span>;
      }
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: (info) => getEstadoBadge(info.getValue() as string)
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: (info) => {
        const item = info.row.original;
        const est = (item.estado || '').toUpperCase();
        return (
          <div className="flex items-center justify-end gap-2">
            {est === 'CONFIRMADO' && (
              <button
                onClick={() => gerarPlaneamentoMutation.mutate(item.id)}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-extrabold rounded-lg transition-all flex items-center gap-1 shadow-sm"
                title="Executar Motor de Planeamento (Ordens, Reservas e Requisições)"
              >
                <Sparkles size={13} /> Planeamento
              </button>
            )}
            <button 
              onClick={() => handleOpenView(item)} 
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" 
              title="Ver Detalhes e Orquestração Operacional"
            >
              <Eye size={16} />
            </button>
            <button 
              onClick={() => navigate(`/eventos/editar/${item.id}`)} 
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" 
              title="Editar Evento"
            >
              <Edit2 size={16} />
            </button>
            <button 
              onClick={() => handleDelete(item.id)} 
              className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" 
              title="Eliminar"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      }
    }
  ], [navigate, gerarPlaneamentoMutation]);

  const rf = currentRecord?.resumo_financeiro;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Sparkles className="text-primary" size={26} /> Módulo de Gestão de Eventos
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Orquestrador Comercial e Operacional: Reservas, Requisições, Ordens de Produção e Faturação Integrada.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/eventos/servicos-diversos')}
            className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
          >
            <Wrench size={16} className="text-primary" /> Serviços, Parâmetros & Tabelas de Preço
          </button>

          <button 
            onClick={() => navigate('/eventos/novo')} 
            className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
          >
            <Plus size={16} /> Registo de Evento (Novo)
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800/80 p-1 rounded-2xl overflow-x-auto gap-1">
        {ESTADO_TABS.map(st => (
          <button
            key={st.id}
            onClick={() => { setEstadoFilter(st.id); setPage(1); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              estadoFilter === st.id ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* DATA TABLE */}
      <DataTable
        data={data}
        columns={tableColumns}
        isLoading={isLoading}
        searchPlaceholder="Pesquisar eventos por número, título, cliente ou recinto..."
        manualPagination={true}
        pageCount={pagination.pages}
        paginationState={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(updater) => {
          if (typeof updater === 'function') {
            const newState = updater({ pageIndex: page - 1, pageSize: perPage });
            setPage(newState.pageIndex + 1);
          } else {
            setPage(updater.pageIndex + 1);
          }
        }}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onClearFilters={() => {
          setSearchTerm('');
          setEstadoFilter('Todos');
          setPage(1);
        }}
      />

      {/* VIEW EVENT DETAILS & MOTOR DE PLANEAMENTO MODAL */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={`Detalhes & Orquestração do Evento: ${currentRecord?.titulo || ''}`}
        maxWidth="max-w-4xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400 font-medium">Ciclo de Estado:</span>
              <button
                onClick={() => updateEstadoMutation.mutate({ id: currentRecord.id, estado: 'CONFIRMADO' })}
                className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded hover:bg-blue-200"
              >
                Confirmar
              </button>
              <button
                onClick={() => updateEstadoMutation.mutate({ id: currentRecord.id, estado: 'EM_PREPARACAO' })}
                className="px-2.5 py-1 bg-cyan-100 text-cyan-800 text-xs font-bold rounded hover:bg-cyan-200"
              >
                Em Preparação
              </button>
              <button
                onClick={() => updateEstadoMutation.mutate({ id: currentRecord.id, estado: 'EM_EXECUCAO' })}
                className="px-2.5 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded hover:bg-purple-200"
              >
                Em Execução
              </button>
              <button
                onClick={() => updateEstadoMutation.mutate({ id: currentRecord.id, estado: 'CONCLUIDO' })}
                className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded hover:bg-emerald-200"
              >
                Concluído
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleFaturarEvento} 
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-all active:scale-95"
              >
                <Receipt size={14} /> Faturar / Converter em Venda
              </button>
              <button onClick={() => setIsViewOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl">
                Fechar
              </button>
            </div>
          </div>
        }
      >
        {currentRecord && (
          <div className="space-y-6">
            {/* EVENT HEADER INFO */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 text-xs">
              <div>
                <span className="text-gray-400 font-medium">Nº do Documento</span>
                <p className="font-bold text-gray-900 dark:text-white font-mono">{currentRecord.numero || `EVT-${currentRecord.id}`}</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Tipo & Cliente</span>
                <p className="font-bold text-gray-900 dark:text-white">{currentRecord.tipo_evento} - {currentRecord.cliente?.nome || currentRecord.cliente_nome || 'Consumidor Final'}</p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Data & Convidados</span>
                <p className="font-bold text-gray-900 dark:text-white">
                  📅 {currentRecord.data_evento ? new Date(currentRecord.data_evento).toLocaleDateString('pt-PT') : '-'} ({currentRecord.numero_convidados || 0} pax)
                </p>
              </div>

              <div>
                <span className="text-gray-400 font-medium">Estado Comercial</span>
                <div className="mt-0.5">{getEstadoBadge(currentRecord.estado)}</div>
              </div>
            </div>

            {/* MOTOR DE PLANEAMENTO OPERACIONAL (`PlanningEngine`) SECTION */}
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-indigo-600 dark:text-indigo-400" size={18} />
                  <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-950 dark:text-indigo-200">
                    Motor de Planeamento Operacional (`PlanningEngine`)
                  </h4>
                </div>
                <button
                  onClick={() => gerarPlaneamentoMutation.mutate(currentRecord.id)}
                  disabled={gerarPlaneamentoMutation.isPending}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-all active:scale-95"
                >
                  <RefreshCw size={13} className={gerarPlaneamentoMutation.isPending ? 'animate-spin' : ''} />
                  {gerarPlaneamentoMutation.isPending ? 'A Processar...' : 'Gerar / Atualizar Planeamento Operacional'}
                </button>
              </div>

              <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
                Ao confirmar o evento, o Motor de Planeamento orquestra automaticamente as reservas de disponibilidade, ordens para cozinha/bar e requisições físicas no armazém sem duplicar inventário.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                  <MapPin size={16} className="mx-auto text-blue-500 mb-1" />
                  <span className="block text-[10px] text-gray-400 uppercase font-bold">Reserva Espaço</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {currentRecord.reservas_espaco?.length ? `${currentRecord.reservas_espaco.length} Recinto(s)` : (currentRecord.espaco_id ? 'Reservado' : 'Sem Recinto')}
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                  <Package size={16} className="mx-auto text-amber-500 mb-1" />
                  <span className="block text-[10px] text-gray-400 uppercase font-bold">Reserva Material</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {currentRecord.reservas_material?.length ? `${currentRecord.reservas_material.length} Item(ns)` : 'Bloqueio Stock'}
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                  <Users size={16} className="mx-auto text-purple-500 mb-1" />
                  <span className="block text-[10px] text-gray-400 uppercase font-bold">Afetação Equipas</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {currentRecord.equipas?.length ? `${currentRecord.equipas.length} Equipas` : 'RH Alocado'}
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                  <ChefHat size={16} className="mx-auto text-emerald-500 mb-1" />
                  <span className="block text-[10px] text-gray-400 uppercase font-bold">Cozinha / KDS</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {currentRecord.pedidos?.length || currentRecord.ordens_producao?.length ? 'Ordens Criadas' : 'Produção OK'}
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-center">
                  <Truck size={16} className="mx-auto text-cyan-500 mb-1" />
                  <span className="block text-[10px] text-gray-400 uppercase font-bold">Requisição Logística</span>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {currentRecord.requisicao_id ? `REQ-${currentRecord.requisicao_id}` : 'Saída Física'}
                  </span>
                </div>
              </div>
            </div>

            {/* ITENS COMPONENT (`eventos_itens`) */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase text-gray-500 tracking-wider">Itens do Orçamento Comercial (`eventos_itens`)</h4>
              <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase font-bold text-[10px]">
                    <tr>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Descrição Item</th>
                      <th className="p-3">Qtd / Unid</th>
                      <th className="p-3">Preço Unit.</th>
                      <th className="p-3">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {(currentRecord.itens || []).length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-400 font-medium">Nenhum item discriminado neste evento.</td>
                      </tr>
                    ) : (
                      (currentRecord.itens || []).map((it: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-3 font-bold text-primary">{it.tipo_item}</td>
                          <td className="p-3">
                            <div className="font-semibold text-gray-900 dark:text-white">{it.descricao}</div>
                            {it.sugestao_origem && (
                              <div className="text-[10px] text-emerald-600 font-medium">✨ {it.sugestao_origem}</div>
                            )}
                          </td>
                          <td className="p-3 font-medium">{it.quantidade} {it.unidade}</td>
                          <td className="p-3 font-bold">{formatMoeda(it.preco_unitario)}</td>
                          <td className="p-3 font-black text-gray-900 dark:text-white">
                            {formatMoeda(Number(it.quantidade || 1) * Number(it.preco_unitario || 0))}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RESUMO FINANCEIRO DISCRIMINADO */}
            {rf && (
              <div className="p-5 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 space-y-3">
                <h4 className="font-extrabold text-xs uppercase text-primary tracking-wider">Resumo Financeiro Sintético</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Serviços:</span>
                    <p className="font-bold">{formatMoeda(rf.subtotal_servicos)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Espaços & Alugueres:</span>
                    <p className="font-bold">{formatMoeda(rf.subtotal_espacos || rf.subtotal_alugueres)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Produtos:</span>
                    <p className="font-bold">{formatMoeda(rf.subtotal_produtos)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Total IVA:</span>
                    <p className="font-bold text-amber-600">{formatMoeda(rf.total_iva_geral)}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-primary/20 flex items-center justify-between">
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white">Total Geral do Evento:</span>
                  <span className="font-black text-xl text-primary">{formatMoeda(rf.total_geral)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

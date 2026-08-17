import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService, productService } from '../services';
import { formatCurrency } from '../lib/utils';
import { 
  Plus, Edit2, Trash2, CheckCircle2, XCircle, Shield, Wrench, Users, MapPin, 
  DollarSign, Filter, Layers, Calculator, Tag, Ruler, AlertCircle, Sparkles, Search 
} from 'lucide-react';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import Modal from '../components/Common/Modal';
import { DataTable } from '../components/Common/DataTable';
import { ColumnDef } from '@tanstack/react-table';

type ActiveTab = 'tipos_evento' | 'servicos' | 'equipas' | 'espacos' | 'politicas';

const formatMoeda = (val: number) => formatCurrency(Number(val || 0));

export default function ServicosEDiversos() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('tipos_evento');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState<any>(null);

  // Policy Rules Modal State
  const [isRegraModalOpen, setIsRegraModalOpen] = useState(false);
  const [selectedPolitica, setSelectedPolitica] = useState<any>(null);

  const queryClient = useQueryClient();

  // Queries
  const { data: unidadesMedida = [] } = useQuery({
    queryKey: ['unidades-medida'],
    queryFn: () => productService.getUnidadesMedida()
  });

  const { data: tiposEventoResp, isLoading: isLoadingTipos } = useQuery({
    queryKey: ['tipos-evento', searchTerm],
    queryFn: () => eventService.tiposEvento.listar({ search: searchTerm, include_inativos: true })
  });
  const tiposEvento = tiposEventoResp?.items || tiposEventoResp?.data || (Array.isArray(tiposEventoResp) ? tiposEventoResp : []);

  const { data: servicosResp, isLoading: isLoadingServicos } = useQuery({
    queryKey: ['servicos-cadastro', searchTerm],
    queryFn: () => eventService.servicosCadastro.listar({ search: searchTerm, include_inativos: true })
  });
  const servicos = servicosResp?.items || servicosResp?.data || (Array.isArray(servicosResp) ? servicosResp : []);

  const { data: equipasResp, isLoading: isLoadingEquipas } = useQuery({
    queryKey: ['equipas-cadastro', searchTerm],
    queryFn: () => eventService.equipasCadastro.listar({ search: searchTerm, include_inativos: true })
  });
  const equipas = equipasResp?.items || equipasResp?.data || (Array.isArray(equipasResp) ? equipasResp : []);

  const { data: espacosResp, isLoading: isLoadingEspacos } = useQuery({
    queryKey: ['espacos-cadastro', searchTerm],
    queryFn: () => eventService.espacos.listar({ search: searchTerm })
  });
  const espacos = espacosResp?.items || espacosResp?.data || (Array.isArray(espacosResp) ? espacosResp : []);

  const { data: politicasResp, isLoading: isLoadingPoliticas } = useQuery({
    queryKey: ['politicas-comerciais', searchTerm],
    queryFn: () => eventService.politicasComerciais.listar({ search: searchTerm })
  });
  const politicas = politicasResp?.items || politicasResp?.data || (Array.isArray(politicasResp) ? politicasResp : []);

  // Mutations
  const invalidateCurrent = () => {
    queryClient.invalidateQueries({ queryKey: ['tipos-evento'] });
    queryClient.invalidateQueries({ queryKey: ['servicos-cadastro'] });
    queryClient.invalidateQueries({ queryKey: ['equipas-cadastro'] });
    queryClient.invalidateQueries({ queryKey: ['espacos-cadastro'] });
    queryClient.invalidateQueries({ queryKey: ['politicas-comerciais'] });
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (activeTab === 'tipos_evento') return eventService.tiposEvento.criar(data);
      if (activeTab === 'servicos') return eventService.servicosCadastro.criar(data);
      if (activeTab === 'equipas') return eventService.equipasCadastro.criar(data);
      if (activeTab === 'espacos') return eventService.espacos.criar(data);
      if (activeTab === 'politicas') return eventService.politicasComerciais.criar(data);
    },
    onSuccess: () => {
      invalidateCurrent();
      setIsModalOpen(false);
      toast.success('Registo criado com sucesso.');
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao criar registo.')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string | number; data: any }) => {
      if (activeTab === 'tipos_evento') return eventService.tiposEvento.atualizar(id, data);
      if (activeTab === 'servicos') return eventService.servicosCadastro.atualizar(id, data);
      if (activeTab === 'equipas') return eventService.equipasCadastro.atualizar(id, data);
      if (activeTab === 'espacos') return eventService.espacos.atualizar(id, data);
      if (activeTab === 'politicas') return eventService.politicasComerciais.atualizar(id, data);
    },
    onSuccess: () => {
      invalidateCurrent();
      setIsModalOpen(false);
      toast.success('Registo atualizado com sucesso.');
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao atualizar registo.')
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async (id: string | number) => {
      if (activeTab === 'tipos_evento') return eventService.tiposEvento.desativar(id);
      if (activeTab === 'servicos') return eventService.servicosCadastro.desativar(id);
      if (activeTab === 'equipas') return eventService.equipasCadastro.desativar(id);
      if (activeTab === 'espacos') return eventService.espacos.desativar(id);
      if (activeTab === 'politicas') return eventService.politicasComerciais.desativar(id);
    },
    onSuccess: () => {
      invalidateCurrent();
      toast.success('Estado alterado com sucesso.');
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao alterar estado.')
  });

  const addRegraMutation = useMutation({
    mutationFn: ({ politicaId, data }: { politicaId: string | number; data: any }) =>
      eventService.politicasComerciais.criarRegra(politicaId, data),
    onSuccess: () => {
      invalidateCurrent();
      setIsRegraModalOpen(false);
      toast.success('Regra comercial adicionada com sucesso!');
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao adicionar regra comercial.')
  });

  const deleteRegraMutation = useMutation({
    mutationFn: ({ politicaId, regraId }: { politicaId: string | number; regraId: string | number }) =>
      eventService.politicasComerciais.eliminarRegra(politicaId, regraId),
    onSuccess: () => {
      invalidateCurrent();
      toast.success('Regra comercial removida.');
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao remover regra.')
  });

  const handleOpenForm = (record: any = null) => {
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data: any = {};

    formData.forEach((val, key) => {
      if (val !== '') {
        if (['capacidade', 'referencia_id', 'min_convidados', 'max_convidados'].includes(key)) {
          data[key] = Number(val);
        } else if (['preco_sugerido', 'custo_sugerido', 'preco_aluguer', 'valor_sugerido'].includes(key)) {
          data[key] = Number(val);
        } else {
          data[key] = val;
        }
      }
    });

    if (currentRecord?.id) {
      updateMutation.mutate({ id: currentRecord.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleAddRegraSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolitica) return;
    const formData = new FormData(e.target as HTMLFormElement);
    const payload = {
      tipo_evento: (formData.get('tipo_evento') as string) || null,
      tipo_item: (formData.get('tipo_item') as string) || 'Servico',
      referencia_id: formData.get('referencia_id') ? Number(formData.get('referencia_id')) : null,
      nome_item: (formData.get('nome_item') as string) || '',
      min_convidados: Number(formData.get('min_convidados') || 0),
      max_convidados: formData.get('max_convidados') ? Number(formData.get('max_convidados')) : null,
      tipo_calculo: (formData.get('tipo_calculo') as string) || 'Por Participante',
      valor_sugerido: Number(formData.get('valor_sugerido') || 0)
    };

    addRegraMutation.mutate({ politicaId: selectedPolitica.id, data: payload });
  };

  // Define Columns per Tab
  const tiposColumns = React.useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'nome',
      header: 'Nome do Tipo',
      cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{(info.getValue() as string) || '-'}</span>
    },
    {
      accessorKey: 'descricao',
      header: 'Descrição',
      cell: (info) => <span className="text-xs text-gray-500">{(info.getValue() as string) || 'Sem descrição'}</span>
    },
    {
      accessorKey: 'ativo',
      header: 'Estado',
      cell: (info) => {
        const ativo = info.getValue() ?? true;
        return (
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center w-fit gap-1 ${
            ativo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
          }`}>
            {ativo ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {ativo ? 'Ativo' : 'Inativo'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: (info) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => handleOpenForm(info.row.original)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded">
            <Edit2 size={16} />
          </button>
          <button onClick={() => toggleAtivoMutation.mutate(info.row.original.id)} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded" title="Comutar Ativo/Inativo">
            {info.row.original.ativo ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          </button>
        </div>
      )
    }
  ], []);

  const servicosColumns = React.useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'codigo',
      header: 'Código',
      cell: (info) => <span className="font-mono text-xs font-bold text-primary">{(info.getValue() as string) || `SRV-${info.row.original.id}`}</span>
    },
    {
      accessorKey: 'nome',
      header: 'Nome do Serviço',
      cell: (info) => (
        <div>
          <div className="font-bold text-gray-900 dark:text-white">{(info.getValue() as string) || '-'}</div>
          <div className="text-[11px] text-gray-400">{info.row.original.categoria || 'Geral'}</div>
        </div>
      )
    },
    {
      accessorKey: 'unidade_padrao',
      header: 'Unidade de Medida (Sistema)',
      cell: (info) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
          <Ruler size={12} /> {(info.getValue() as string) || 'Pessoa'}
        </span>
      )
    },
    {
      accessorKey: 'preco_sugerido',
      header: 'Preço Sugerido Base',
      cell: (info) => <span className="font-bold text-primary">{formatMoeda((info.getValue() as number) || 0)}</span>
    },
    {
      accessorKey: 'ativo',
      header: 'Estado',
      cell: (info) => {
        const ativo = info.getValue() ?? true;
        return (
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex items-center w-fit gap-1 ${
            ativo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
          }`}>
            {ativo ? 'Ativo' : 'Inativo'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: (info) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => handleOpenForm(info.row.original)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded">
            <Edit2 size={16} />
          </button>
          <button onClick={() => toggleAtivoMutation.mutate(info.row.original.id)} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded">
            {info.row.original.ativo ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          </button>
        </div>
      )
    }
  ], []);

  const equipasColumns = React.useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'nome',
      header: 'Cargo / Função',
      cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{(info.getValue() as string) || '-'}</span>
    },
    {
      accessorKey: 'departamento',
      header: 'Departamento',
      cell: (info) => <span className="text-xs text-gray-500">{(info.getValue() as string) || 'Operações'}</span>
    },
    {
      accessorKey: 'custo_sugerido',
      header: 'Custo Estimado',
      cell: (info) => <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{formatMoeda((info.getValue() as number) || 0)}</span>
    },
    {
      accessorKey: 'preco_sugerido',
      header: 'Preço Venda / Horas',
      cell: (info) => <span className="font-bold text-primary">{formatMoeda((info.getValue() as number) || 0)}</span>
    },
    {
      accessorKey: 'ativo',
      header: 'Estado',
      cell: (info) => {
        const ativo = info.getValue() ?? true;
        return (
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
            ativo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
          }`}>
            {ativo ? 'Ativo' : 'Inativo'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: (info) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => handleOpenForm(info.row.original)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded">
            <Edit2 size={16} />
          </button>
          <button onClick={() => toggleAtivoMutation.mutate(info.row.original.id)} className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded">
            {info.row.original.ativo ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
          </button>
        </div>
      )
    }
  ], []);

  const espacosColumns = React.useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'nome',
      header: 'Espaço / Salão',
      cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{(info.getValue() as string) || '-'}</span>
    },
    {
      accessorKey: 'capacidade',
      header: 'Capacidade Pax',
      cell: (info) => (
        <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200/50">
          <Users size={12} /> {(info.getValue() as number) || 0} convidados
        </span>
      )
    },
    {
      accessorKey: 'localizacao',
      header: 'Localização',
      cell: (info) => <span className="text-xs text-gray-500">{(info.getValue() as string) || 'Principal'}</span>
    },
    {
      accessorKey: 'preco_aluguer',
      header: 'Valor Aluguer Base',
      cell: (info) => <span className="font-bold text-primary">{formatMoeda((info.getValue() as number) || 0)}</span>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: (info) => (
        <div className="flex items-center justify-end gap-2">
          <button onClick={() => handleOpenForm(info.row.original)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded">
            <Edit2 size={16} />
          </button>
        </div>
      )
    }
  ], []);

  const politicasColumns = React.useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'nome',
      header: 'Tabela / Política Comercial',
      cell: (info) => (
        <div>
          <div className="font-bold text-gray-900 dark:text-white">{(info.getValue() as string) || 'Tabela Comercial Padrão'}</div>
          <div className="text-xs text-gray-500">{info.row.original.descricao || 'Regras ativas de preço'}</div>
        </div>
      )
    },
    {
      accessorKey: 'regras',
      header: 'Regras de Precificação',
      cell: (info) => {
        const regras = info.row.original.regras || [];
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">
            <Calculator size={12} /> {regras.length} regras configuradas
          </span>
        );
      }
    },
    {
      accessorKey: 'ativo',
      header: 'Estado',
      cell: (info) => {
        const ativo = info.getValue() ?? true;
        return (
          <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
            ativo ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800'
          }`}>
            {ativo ? 'Ativa' : 'Inativa'}
          </span>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: (info) => (
        <div className="flex items-center justify-end gap-2">
          <button 
            onClick={() => { setSelectedPolitica(info.row.original); setIsRegraModalOpen(true); }}
            className="px-2.5 py-1 bg-primary text-white text-xs font-bold rounded hover:bg-primary-hover flex items-center gap-1"
          >
            <Plus size={12} /> Gerir Regras
          </button>
          <button onClick={() => handleOpenForm(info.row.original)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded">
            <Edit2 size={16} />
          </button>
        </div>
      )
    }
  ], []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Wrench className="text-primary" size={26} /> Serviços, Cadastros & Tabelas de Preço
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Gestão das entidades base do módulo de Eventos: Tipos de Eventos, Serviços, Mão de Obra, Espaços e Motor de Preços.
          </p>
        </div>

        <button 
          onClick={() => handleOpenForm()} 
          className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
        >
          <Plus size={16} /> Novo Cadastramento ({
            activeTab === 'tipos_evento' ? 'Tipo Evento' :
            activeTab === 'servicos' ? 'Serviço Base' :
            activeTab === 'equipas' ? 'Equipa / Cargo' :
            activeTab === 'espacos' ? 'Espaço' : 'Política Comercial'
          })
        </button>
      </div>

      {/* TABS HEADER */}
      <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl overflow-x-auto gap-2">
        <button
          onClick={() => { setActiveTab('tipos_evento'); setSearchTerm(''); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tipos_evento' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <Tag size={16} /> 1. Tipos de Evento ({tiposEvento.length})
        </button>

        <button
          onClick={() => { setActiveTab('servicos'); setSearchTerm(''); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'servicos' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <Wrench size={16} /> 2. Tipos de Serviços ({servicos.length})
        </button>

        <button
          onClick={() => { setActiveTab('equipas'); setSearchTerm(''); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'equipas' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <Users size={16} /> 3. Equipas / Mão de Obra ({equipas.length})
        </button>

        <button
          onClick={() => { setActiveTab('espacos'); setSearchTerm(''); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'espacos' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <MapPin size={16} /> 4. Espaços / Salões ({espacos.length})
        </button>

        <button
          onClick={() => { setActiveTab('politicas'); setSearchTerm(''); }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'politicas' ? 'bg-white dark:bg-gray-700 text-primary shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
          }`}
        >
          <Calculator size={16} /> 5. Políticas comerciais & Preços ({politicas.length})
        </button>
      </div>

      {/* DATA TABLE DEPENDING ON TAB */}
      {activeTab === 'tipos_evento' && (
        <DataTable
          data={tiposEvento}
          columns={tiposColumns}
          isLoading={isLoadingTipos}
          searchPlaceholder="Pesquisar tipos de evento..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}

      {activeTab === 'servicos' && (
        <DataTable
          data={servicos}
          columns={servicosColumns}
          isLoading={isLoadingServicos}
          searchPlaceholder="Pesquisar serviços cadastrados..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}

      {activeTab === 'equipas' && (
        <DataTable
          data={equipas}
          columns={equipasColumns}
          isLoading={isLoadingEquipas}
          searchPlaceholder="Pesquisar cargos / equipas..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}

      {activeTab === 'espacos' && (
        <DataTable
          data={espacos}
          columns={espacosColumns}
          isLoading={isLoadingEspacos}
          searchPlaceholder="Pesquisar espaços e salões..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
        />
      )}

      {activeTab === 'politicas' && (
        <div className="space-y-6">
          <DataTable
            data={politicas}
            columns={politicasColumns}
            isLoading={isLoadingPoliticas}
            searchPlaceholder="Pesquisar tabelas comerciais..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
          />

          {/* DISPLAY DYNAMIC PRICING MATRIX RULES */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                <Sparkles className="text-primary" size={18} /> Matriz Dinâmica de Sugestão de Preços (Regras Ativas)
              </h3>
              <span className="text-xs text-gray-400">Origem: Políticas Comerciais</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="p-3">Política</th>
                    <th className="p-3">Tipo Evento</th>
                    <th className="p-3">Item / Categoria</th>
                    <th className="p-3">Faixa Pax (Convidados)</th>
                    <th className="p-3">Cálculo</th>
                    <th className="p-3">Valor Sugerido</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {politicas.flatMap((p: any) => (p.regras || []).map((r: any) => ({ ...r, politicaNome: p.nome, politicaId: p.id }))).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-400 font-medium">
                        Nenhuma regra de preço cadastrada. Clique em "Gerir Regras" numa Política Comercial para adicionar regras inteligentes.
                      </td>
                    </tr>
                  ) : (
                    politicas.flatMap((p: any) => (p.regras || []).map((r: any) => ({ ...r, politicaNome: p.nome, politicaId: p.id }))).map((regra: any) => (
                      <tr key={regra.id || `${regra.politicaId}-${regra.nome_item}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                        <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">{regra.politicaNome}</td>
                        <td className="p-3 font-bold text-primary">{regra.tipo_evento || 'Todos'}</td>
                        <td className="p-3">{regra.nome_item || regra.tipo_item}</td>
                        <td className="p-3 font-medium text-gray-600">
                          {regra.min_convidados || 0} a {regra.max_convidados ? `${regra.max_convidados} pax` : 'Sem limite'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            regra.tipo_calculo === 'Por Participante' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            {regra.tipo_calculo}
                          </span>
                        </td>
                        <td className="p-3 font-black text-gray-900 dark:text-white">{formatMoeda(regra.valor_sugerido)}</td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => deleteRegraMutation.mutate({ politicaId: regra.politicaId, regraId: regra.id })}
                            className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50"
                            title="Remover Regra"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentRecord ? `Editar Cadastramento` : `Novo Cadastramento`}
        maxWidth="max-w-2xl"
        footer={
          <>
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancelar
            </button>
            <button type="submit" form="aux-form" className="px-4 py-2 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg">
              Guardar
            </button>
          </>
        }
      >
        <form id="aux-form" onSubmit={handleFormSubmit} className="space-y-4">
          {activeTab === 'tipos_evento' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Nome do Tipo de Evento *</label>
                <input
                  type="text"
                  name="nome"
                  defaultValue={currentRecord?.nome || ''}
                  required
                  placeholder="Ex: Casamento, Gala Empresarial, Aniversário..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Descrição</label>
                <textarea
                  name="descricao"
                  defaultValue={currentRecord?.descricao || ''}
                  rows={3}
                  placeholder="Instruções ou características deste tipo de evento..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                />
              </div>
            </>
          )}

          {activeTab === 'servicos' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Código do Serviço</label>
                  <input
                    type="text"
                    name="codigo"
                    defaultValue={currentRecord?.codigo || ''}
                    placeholder="Ex: SRV-001"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Categoria</label>
                  <input
                    type="text"
                    name="categoria"
                    defaultValue={currentRecord?.categoria || 'Geral'}
                    placeholder="Ex: Atendimento, Decoração, Cozinha..."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Nome do Serviço *</label>
                <input
                  type="text"
                  name="nome"
                  defaultValue={currentRecord?.nome || ''}
                  required
                  placeholder="Ex: Serviço Completo de Garçons"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Unidade Padrão (Sistema) *</label>
                  <select
                    name="unidade_padrao"
                    defaultValue={currentRecord?.unidade_padrao || 'Pessoa'}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                  >
                    <option value="Pessoa">Pessoa (Pax)</option>
                    <option value="Hora">Hora</option>
                    <option value="Dia">Dia</option>
                    <option value="Unidade">Unidade (Uni)</option>
                    <option value="Servico">Serviço Global</option>
                    {unidadesMedida.map((u: any) => (
                      <option key={u.id} value={u.sigla || u.nome}>{u.nome} ({u.sigla})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Preço Sugerido</label>
                  <input
                    type="number"
                    step="0.01"
                    name="preco_sugerido"
                    defaultValue={currentRecord?.preco_sugerido || 0}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Descrição</label>
                <textarea
                  name="descricao"
                  defaultValue={currentRecord?.descricao || ''}
                  rows={2}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                />
              </div>
            </>
          )}

          {activeTab === 'equipas' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Cargo / Função *</label>
                  <input
                    type="text"
                    name="nome"
                    defaultValue={currentRecord?.nome || ''}
                    required
                    placeholder="Ex: Chefe de Sala, Bartender Senior..."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Departamento</label>
                  <input
                    type="text"
                    name="departamento"
                    defaultValue={currentRecord?.departamento || 'Operações'}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Custo Sugerido</label>
                  <input
                    type="number"
                    step="0.01"
                    name="custo_sugerido"
                    defaultValue={currentRecord?.custo_sugerido || 0}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Preço Venda</label>
                  <input
                    type="number"
                    step="0.01"
                    name="preco_sugerido"
                    defaultValue={currentRecord?.preco_sugerido || 0}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'espacos' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Nome do Espaço / Recinto *</label>
                  <input
                    type="text"
                    name="nome"
                    defaultValue={currentRecord?.nome || ''}
                    required
                    placeholder="Ex: Salão Nobre Haupt"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Capacidade Pax (Convidados) *</label>
                  <input
                    type="number"
                    name="capacidade"
                    defaultValue={currentRecord?.capacidade || 200}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Localização / Zona</label>
                  <input
                    type="text"
                    name="localizacao"
                    defaultValue={currentRecord?.localizacao || 'Edifício Principal'}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Preço Aluguer Base</label>
                  <input
                    type="number"
                    step="0.01"
                    name="preco_aluguer"
                    defaultValue={currentRecord?.preco_aluguer || 0}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'politicas' && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Nome da Política / Tabela Comercial *</label>
                <input
                  type="text"
                  name="nome"
                  defaultValue={currentRecord?.nome || ''}
                  required
                  placeholder="Ex: Tabela Comercial Padrão - Eventos 2026"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Descrição</label>
                <textarea
                  name="descricao"
                  defaultValue={currentRecord?.descricao || ''}
                  rows={2}
                  placeholder="Regras de desconto por volume de convidados..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border rounded-lg text-sm"
                />
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* MANAGE POLICY RULES MODAL */}
      <Modal
        isOpen={isRegraModalOpen}
        onClose={() => setIsRegraModalOpen(false)}
        title={`Regras Comerciais: ${selectedPolitica?.nome || ''}`}
        maxWidth="max-w-2xl"
        footer={
          <button onClick={() => setIsRegraModalOpen(false)} className="px-4 py-2 text-xs font-bold bg-gray-200 text-gray-800 rounded-lg">
            Concluir
          </button>
        }
      >
        <form onSubmit={handleAddRegraSubmit} className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border mb-4">
          <h4 className="font-bold text-xs uppercase text-primary tracking-wider">Adicionar Nova Regra de Sugestão de Preço</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Tipo de Evento</label>
              <select name="tipo_evento" className="w-full p-2 text-xs bg-white dark:bg-gray-900 border rounded">
                <option value="">Todos os Eventos</option>
                {tiposEvento.map((t: any) => (
                  <option key={t.id} value={t.nome}>{t.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Tipo de Item *</label>
              <select name="tipo_item" required className="w-full p-2 text-xs bg-white dark:bg-gray-900 border rounded">
                <option value="Servico">Serviço</option>
                <option value="Espaco">Espaço</option>
                <option value="Material">Material Aluguer</option>
                <option value="MaoDeObra">Mão de Obra</option>
                <option value="Produto">Produto</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Nome / Serviço Específico</label>
              <input type="text" name="nome_item" placeholder="Ex: Cozinha, Garçom..." className="w-full p-2 text-xs bg-white dark:bg-gray-900 border rounded" />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Tipo de Cálculo *</label>
              <select name="tipo_calculo" required className="w-full p-2 text-xs bg-white dark:bg-gray-900 border rounded">
                <option value="Por Participante">Por Participante (Pax)</option>
                <option value="Fixo">Valor Fixo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Mín. Convidados</label>
              <input type="number" name="min_convidados" defaultValue={0} className="w-full p-2 text-xs bg-white dark:bg-gray-900 border rounded" />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Máx. Convidados</label>
              <input type="number" name="max_convidados" placeholder="Sem limite" className="w-full p-2 text-xs bg-white dark:bg-gray-900 border rounded" />
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase">Valor Sugerido *</label>
              <input type="number" step="0.01" name="valor_sugerido" required placeholder="0.00" className="w-full p-2 text-xs bg-white dark:bg-gray-900 border rounded font-bold text-primary" />
            </div>
          </div>

          <button type="submit" disabled={addRegraMutation.isPending} className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-colors">
            {addRegraMutation.isPending ? 'A adicionar...' : 'Adicionar Regra à Política'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import apiClient from '../../api/client';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  CheckCircle2,
  Eye,
  Search,
  Clock,
  RefreshCw,
  X,
  AlertTriangle,
  Package,
  Calendar,
  AlertOctagon,
  Users,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  Flame,
  Check,
  CircleDot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { toast } from 'react-toastify';

export interface QuemViuUser {
  user_id?: number | string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
  data_leitura?: string;
}

export interface QuemNaoViuUser {
  id?: number | string;
  name?: string;
  email?: string;
  role?: string;
}

export interface NotificacaoAvancada {
  id: number | string;
  tipo: string;
  titulo: string;
  mensagem: string;
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente' | string;
  entidade_tipo?: string;
  entidade_id?: number | string;
  created_at?: string;
  lida_por_mim?: boolean;
  total_visto?: number;
  total_nao_visto?: number;
  quem_viu?: QuemViuUser[];
  quem_nao_viu?: QuemNaoViuUser[];
  [key: string]: any;
}

export interface CentralNotificacoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  getHeaders?: () => Record<string, string>;
  apiUrl?: string;
}

export const CentralNotificacoesModal: React.FC<CentralNotificacoesModalProps> = ({
  isOpen,
  onClose,
  getHeaders,
  apiUrl = '/api/v1'
}) => {
  const navigate = useNavigate();
  const { refreshNotifications } = useNotifications();

  // Estados principais
  const [notificacoes, setNotificacoes] = useState<NotificacaoAvancada[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('TODAS');
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>('TODAS');
  const [selectedStatus, setSelectedStatus] = useState<'todas' | 'nao_lidas' | 'lidas'>('todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Rastreio modal detalhado
  const [trackingNotif, setTrackingNotif] = useState<NotificacaoAvancada | null>(null);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  // Paginação
  const [page, setPage] = useState<number>(1);
  const perPage = 25;

  const resolveHeaders = useCallback(() => {
    if (getHeaders) return getHeaders();
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  }, [getHeaders]);

  // Carregar Notificações do Backend
  const carregarNotificacoes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.get<any, any>('/v1/notificacoes', {
        params: {
          per_page: 50,
          page: 1,
          ...(selectedCategoria !== 'TODAS' ? { tipo: selectedCategoria } : {})
        }
      });
      const list = data.notificacoes ?? data.items ?? data.data?.items ?? data.data ?? [];
      if (!Array.isArray(list)) {
        throw new Error('A resposta da API /notificacoes não contém uma lista válida.');
      }

      const items: NotificacaoAvancada[] = list;
      setNotificacoes(items);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
      setNotificacoes([]);
      toast.error('Não foi possível carregar as notificações.');
    } finally {
      setLoading(false);
    }
  }, [apiUrl, resolveHeaders, selectedCategoria]);

  // Carregar ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      carregarNotificacoes();
    }
  }, [isOpen, carregarNotificacoes]);

  // Sincronizar Alertas Automáticos (Varre stock, validades, pedidos e caixa)
  const handleSincronizarAlertas = async () => {
    setIsSyncing(true);
    try {
      const response = await apiClient.post<any, any>('/v1/notificacoes/sincronizar', {});
      if (!response?.success) {
        throw new Error('A sincronização remota não foi concluída.');
      }
      toast.success('Varredura concluída! Alertas de stock, validades e pedidos sincronizados.');
      await carregarNotificacoes();
      await refreshNotifications();
    } catch (err) {
      console.error('Erro na sincronização remota de notificações:', err);
      toast.error('Não foi possível sincronizar os alertas.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Marcar Notificação Como Lida
  const handleMarcarLida = async (id: string | number) => {
    try {
      const response = await apiClient.post<any, any>(
        `/v1/notificacoes/${encodeURIComponent(String(id))}/marcar-lida`,
        {}
      );
      if (!response?.success) {
        throw new Error('A API não confirmou a leitura da notificação.');
      }

      // Atualizar localmente
      setNotificacoes(prev =>
        prev.map(n => (n.id === id ? { ...n, lida_por_mim: true } : n))
      );

      await refreshNotifications();

      toast.success('Notificação marcada como lida.');
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
      toast.error('Não foi possível marcar a notificação como lida.');
    }
  };

  // Marcar Todas Como Lidas
  const handleMarcarTodasLidas = async () => {
    try {
      const response = await apiClient.post<any, any>('/v1/notificacoes/marcar-todas-lidas', {});
      if (!response?.success) {
        throw new Error('A API não confirmou a leitura das notificações.');
      }

      setNotificacoes(prev => prev.map(n => ({ ...n, lida_por_mim: true })));
      await refreshNotifications();
      toast.success('Todas as notificações foram marcadas como lidas.');
    } catch (err) {
      console.error('Erro ao marcar todas as notificações como lidas:', err);
      toast.error('Não foi possível marcar todas as notificações como lidas.');
    }
  };

  // Navegar para o módulo correspondente da entidade
  const handleNavegarEntidade = (item: NotificacaoAvancada) => {
    onClose();
    const tipo = (item.entidade_tipo || '').toLowerCase();
    const catTipo = (item.tipo || '').toUpperCase();

    if (tipo.includes('produto') || catTipo.includes('STOCK') || catTipo.includes('VALIDADE')) {
      navigate('/produtos');
    } else if (tipo.includes('pedido') || catTipo.includes('PEDIDO')) {
      navigate('/orders');
    } else if (tipo.includes('caixa') || catTipo.includes('CAIXA')) {
      navigate('/caixa-pos');
    } else if (tipo.includes('evento') || catTipo.includes('EVENTOS')) {
      navigate('/eventos');
    } else {
      navigate('/notificacoes');
    }
  };

  // Filtros aplicados
  const notificacoesFiltradas = useMemo(() => {
    return notificacoes.filter(item => {
      // Filtro de Status
      if (selectedStatus === 'nao_lidas' && item.lida_por_mim) return false;
      if (selectedStatus === 'lidas' && !item.lida_por_mim) return false;

      // Filtro de Prioridade
      if (selectedPrioridade !== 'TODAS') {
        const p = String(item.prioridade || '').toLowerCase();
        if (p !== selectedPrioridade.toLowerCase()) return false;
      }

      // Filtro de Pesquisa
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titulo = (item.titulo || '').toLowerCase();
        const mensagem = (item.mensagem || '').toLowerCase();
        if (!titulo.includes(query) && !mensagem.includes(query)) return false;
      }

      return true;
    });
  }, [notificacoes, selectedCategoria, selectedStatus, selectedPrioridade, searchQuery]);

  const unreadCountTotal = useMemo(() => {
    return notificacoes.filter(n => !n.lida_por_mim).length;
  }, [notificacoes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-slate-100 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO DO MODAL */}
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl shadow-inner">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">Central de Notificações Inteligentes</h2>
                {unreadCountTotal > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-black">
                    {unreadCountTotal} nova{unreadCountTotal > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Rastreio em tempo real com auditoria de visualização ("Quem Viu / Quem Não Viu")
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSincronizarAlertas}
              disabled={isSyncing}
              className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
              title="Executa varredura de stock crítico, validades e pedidos atrasados"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin text-indigo-500 dark:text-indigo-400")} />
              {isSyncing ? "A Sincronizar..." : "Sincronizar Alertas"}
            </button>

            <button
              onClick={handleMarcarTodasLidas}
              className="px-3 py-2 rounded-xl bg-indigo-600/10 dark:bg-indigo-600/20 hover:bg-indigo-600/20 dark:hover:bg-indigo-600/30 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Marcar Todas Lidas
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-200/80 dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition cursor-pointer"
              aria-label="Fechar Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS & PESQUISA */}
        <div className="p-4 bg-gray-100/90 dark:bg-slate-900/90 border-b border-gray-200 dark:border-slate-800/80 space-y-3">
          {/* Categorias Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { id: 'TODAS', label: 'Todas', icon: Bell },
              { id: 'STOCK_BAIXO', label: 'Stock Crítico', icon: Package },
              { id: 'VALIDADE', label: 'Validades', icon: Clock },
              { id: 'PEDIDO', label: 'Pedidos / Atrasos', icon: Flame },
              { id: 'CAIXA', label: 'Caixa & Auditoria', icon: ShieldAlert },
              { id: 'EVENTOS', label: 'Eventos & Salões', icon: Calendar },
            ].map(cat => {
              const Icon = cat.icon;
              const isSelected = selectedCategoria === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoria(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition cursor-pointer",
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "bg-white dark:bg-slate-800/70 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-700/50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Barra de Pesquisa e Filtros Rápidos */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 dark:text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar alerta ou produto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end text-xs">
              {/* Status */}
              <div className="flex bg-white dark:bg-slate-950 p-0.5 rounded-xl border border-gray-200 dark:border-slate-800">
                <button
                  onClick={() => setSelectedStatus('todas')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition",
                    selectedStatus === 'todas' ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white" : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                  )}
                >
                  Todas
                </button>
                <button
                  onClick={() => setSelectedStatus('nao_lidas')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1",
                    selectedStatus === 'nao_lidas' ? "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30" : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                  )}
                >
                  <CircleDot className="w-3 h-3 text-rose-500 dark:text-rose-400" />
                  Não Lidas
                </button>
                <button
                  onClick={() => setSelectedStatus('lidas')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg font-bold transition",
                    selectedStatus === 'lidas' ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white" : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
                  )}
                >
                  Lidas
                </button>
              </div>

              {/* Prioridade */}
              <select
                value={selectedPrioridade}
                onChange={(e) => setSelectedPrioridade(e.target.value)}
                className="bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 text-xs py-1.5 px-2.5 rounded-xl outline-none"
              >
                <option value="TODAS">Qualquer Prioridade</option>
                <option value="urgente">Urgente</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>
        </div>

        {/* LISTA DE NOTIFICAÇÕES */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 scrollbar-thin">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 dark:text-indigo-400 mb-3" />
              <p className="text-sm font-semibold">A carregar alertas e auditorias...</p>
            </div>
          ) : notificacoesFiltradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-slate-500 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 dark:text-emerald-400/60" />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-slate-300">Nenhuma notificação encontrada</h3>
              <p className="text-xs text-gray-500 dark:text-slate-500 max-w-sm mt-1">
                Tudo sob controle! Não há notificações pendentes com os critérios de filtro atuais.
              </p>
            </div>
          ) : (
            notificacoesFiltradas.map((item) => {
              const isLida = Boolean(item.lida_por_mim);
              const prioridade = (item.prioridade || 'media').toLowerCase();
              const tipoUpper = (item.tipo || '').toUpperCase();
              const isExpanded = expandedId === item.id;

              // Identificar cor do ícone
              let badgeColor = "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700";
              let typeIcon = <Bell className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />;

              if (tipoUpper.includes('STOCK')) {
                badgeColor = "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
                typeIcon = <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
              } else if (tipoUpper.includes('VALIDADE')) {
                badgeColor = "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
                typeIcon = <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
              } else if (tipoUpper.includes('PEDIDO') || tipoUpper.includes('ATRASO')) {
                badgeColor = "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";
                typeIcon = <Flame className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
              } else if (tipoUpper.includes('CAIXA') || tipoUpper.includes('DIVERGENCIA')) {
                badgeColor = "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
                typeIcon = <ShieldAlert className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
              }

              return (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-150",
                    isLida 
                      ? "bg-gray-50/70 dark:bg-slate-900/60 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700" 
                      : "bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-500/40 shadow-lg shadow-indigo-950/10 ring-1 ring-indigo-500/20"
                  )}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Ícone de Categoria */}
                      <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 shrink-0">
                        {typeIcon}
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          {/* Tipo Badge */}
                          <span className={cn("px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold tracking-wider uppercase", badgeColor)}>
                            {item.tipo}
                          </span>

                          {/* Prioridade Badge */}
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase",
                            prioridade === 'urgente' ? "bg-rose-600 text-white animate-pulse" :
                            prioridade === 'alta' ? "bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30" :
                            prioridade === 'media' ? "bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30" :
                            "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                          )}>
                            {prioridade}
                          </span>

                          {/* Data/Hora */}
                          <span className="text-[11px] text-gray-500 dark:text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                          </span>

                          {!isLida && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Pendente p/ Você
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                          {item.titulo}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {item.mensagem}
                        </p>

                        {/* RASTREIO "QUEM VIU / QUEM NÃO VIU" BADGES */}
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-slate-700 text-xs font-semibold transition cursor-pointer"
                          >
                            <Users className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                            <span>Visto por: <b>{item.total_visto || (item.quem_viu?.length || 0)}</b></span>
                            <span className="text-gray-400 dark:text-slate-600">•</span>
                            <span className="text-rose-600 dark:text-rose-400">Pendente: <b>{item.total_nao_visto || (item.quem_nao_viu?.length || 0)}</b></span>
                            {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setTrackingNotif(item)}
                            className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            Ver Rastreio Completo
                          </button>
                        </div>

                        {/* ACORDEÃO EXPANSÍVEL DE QUEM LEU */}
                        {isExpanded && (
                          <div className="mt-3 p-3.5 rounded-xl bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-800/80 space-y-3 animate-in fade-in duration-150">
                            {/* Quem Viu */}
                            <div>
                              <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Quem Já Visualizou ({item.quem_viu?.length || 0})
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {item.quem_viu && item.quem_viu.length > 0 ? (
                                  item.quem_viu.map((u, idx) => (
                                    <div 
                                      key={idx}
                                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-emerald-500/20 rounded-lg text-[11px] flex items-center gap-1.5 shadow-xs"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
                                      <span className="font-bold text-gray-800 dark:text-slate-200">{u.user_name || 'Utilizador'}</span>
                                      <span className="text-[10px] text-gray-500 dark:text-slate-500">({u.user_role || 'Staff'})</span>
                                      {u.data_leitura && (
                                        <span className="text-[9px] text-gray-400 dark:text-slate-600 font-mono">
                                          {new Date(u.data_leitura).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-xs text-gray-400 dark:text-slate-500 italic">Ainda ninguém visualizou.</span>
                                )}
                              </div>
                            </div>

                            {/* Quem Não Viu */}
                            <div>
                              <div className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Quem Ainda Não Viu ({item.quem_nao_viu?.length || 0})
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {item.quem_nao_viu && item.quem_nao_viu.length > 0 ? (
                                  item.quem_nao_viu.map((u, idx) => (
                                    <div 
                                      key={idx}
                                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-rose-500/20 rounded-lg text-[11px] flex items-center gap-1.5 shadow-xs"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400"></span>
                                      <span className="text-gray-700 dark:text-slate-300">{u.name || 'Staff'}</span>
                                      <span className="text-[10px] text-gray-400 dark:text-slate-500">({u.role || 'Geral'})</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Todos os utilizadores autorizados já visualizaram!</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AÇÕES LATERAIS */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800">
                      {!isLida && (
                        <button
                          onClick={() => handleMarcarLida(item.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600/10 dark:bg-emerald-600/20 hover:bg-emerald-600/20 dark:hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Confirmar Leitura"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Marcar Lida
                        </button>
                      )}

                      <button
                        onClick={() => handleNavegarEntidade(item)}
                        className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Ir para o módulo operacional correspondente"
                      >
                        <ExternalLink className="w-3 h-3 text-gray-500 dark:text-slate-400" />
                        Resolver
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* MODAL DETALHADO DE RASTREIO "QUEM VIU / QUEM NÃO VIU" */}
        {trackingNotif && (
          <div className="absolute inset-0 bg-black/80 dark:bg-slate-950/90 backdrop-blur-sm z-[110] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">Auditoria de Leitura ("Quem Viu")</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">{trackingNotif.titulo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setTrackingNotif(null)}
                  className="p-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-emerald-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Confirmados / Leram</span>
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">
                    {trackingNotif.quem_viu?.length || trackingNotif.total_visto || 0}
                  </span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-rose-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">Pendentes / Não Leram</span>
                  <span className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1 block">
                    {trackingNotif.quem_nao_viu?.length || trackingNotif.total_nao_visto || 0}
                  </span>
                </div>
              </div>

              <div className="space-y-3 max-h-60 sm:max-h-72 overflow-y-auto scrollbar-thin">
                {/* Lidos */}
                <div>
                  <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Utilizadores que Leram
                  </h4>
                  <div className="space-y-1.5">
                    {trackingNotif.quem_viu && trackingNotif.quem_viu.length > 0 ? (
                      trackingNotif.quem_viu.map((u, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                              {(u.user_name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{u.user_name || 'Utilizador'}</p>
                              <p className="text-[10px] text-gray-500 dark:text-slate-400">{u.user_role} • {u.user_email}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">
                            {u.data_leitura ? new Date(u.data_leitura).toLocaleString('pt-PT') : 'Lido'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 dark:text-slate-500 italic p-2">Nenhum utilizador confirmou leitura até o momento.</p>
                    )}
                  </div>
                </div>

                {/* Não lidos */}
                <div>
                  <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Utilizadores que Não Leram
                  </h4>
                  <div className="space-y-1.5">
                    {trackingNotif.quem_nao_viu && trackingNotif.quem_nao_viu.length > 0 ? (
                      trackingNotif.quem_nao_viu.map((u, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold flex items-center justify-center text-xs">
                              {(u.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 dark:text-white">{u.name || 'Staff'}</p>
                              <p className="text-[10px] text-gray-500 dark:text-slate-400">{u.role} • {u.email}</p>
                            </div>
                          </div>
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded-full">
                            Pendente
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold p-2">Todos leram a notificação.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setTrackingNotif(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-800 dark:text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Fechar Auditoria
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RODAPÉ DO MODAL */}
        <div className="p-4 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-left">
            <span>Total: <b>{notificacoes.length}</b> alertas registados</span>
            <span className="hidden sm:inline text-gray-300 dark:text-slate-600">•</span>
            <span className="text-indigo-600 dark:text-indigo-400">Suporta varredura periódica e tempo real</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 text-gray-800 dark:text-white font-bold rounded-xl transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CentralNotificacoesModal;

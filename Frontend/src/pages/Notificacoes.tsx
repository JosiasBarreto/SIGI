import React, { useState, useMemo } from 'react';
import {
  Bell,
  Search,
  Check,
  Trash2,
  Filter,
  ExternalLink,
  Volume2,
  VolumeX,
  Sliders,
  Monitor,
  Calendar,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../components/NotificationContext';
import { NotificationIcon } from '../components/Notifications/NotificationIcon';
import { NOTIFICATION_TYPES, NotificationPriority, SoundPreset, notificationSoundManager } from '../services/notifications';
import { cn } from '../lib/utils';
import { format, isToday, isThisWeek, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function Notificacoes() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
    addNotification,
    soundSettings,
    setSoundEnabled,
    setSoundVolume,
    osPermission,
    requestOsPermission
  } = useNotifications();

  const navigate = useNavigate();

  // Filtros principais
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'important' | 'settings'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Paginação
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Modal de detalhes
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);

  // Som preview
  const handleTestSound = (preset: SoundPreset) => {
    notificationSoundManager.play(preset);
  };

  // Filtragem dos registos
  const filteredList = useMemo(() => {
    return notifications.filter((item) => {
      // Filtro de aba rápida
      if (activeTab === 'unread' && item.read) return false;
      if (activeTab === 'important' && item.priority !== 'critical' && item.priority !== 'high') return false;

      // Pesquisa por texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(query);
        const matchMsg = item.message?.toLowerCase().includes(query);
        const matchId = item.id?.toLowerCase().includes(query);
        if (!matchTitle && !matchMsg && !matchId) return false;
      }

      // Filtro de Categoria
      if (selectedCategory !== 'all') {
        const config = NOTIFICATION_TYPES[item.type];
        if (config?.category !== selectedCategory) return false;
      }

      // Filtro de Prioridade
      if (selectedPriority !== 'all' && item.priority !== selectedPriority) {
        return false;
      }

      // Filtro de Período
      if (selectedPeriod !== 'all' && item.timestamp) {
        try {
          const date = parseISO(item.timestamp);
          if (selectedPeriod === 'today' && !isToday(date)) return false;
          if (selectedPeriod === 'week' && !isThisWeek(date, { locale: pt })) return false;
        } catch {
          // Mantém se a data for inválida
        }
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery, selectedCategory, selectedPriority, selectedPeriod]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredList.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredList.slice(start, start + perPage);
  }, [filteredList, currentPage, perPage]);

  const handleOpenAction = (item: any) => {
    markAsRead(item.id);
    if (item.actionUrl) {
      navigate(item.actionUrl);
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      return format(parseISO(isoStr), "dd/MM/yyyy 'às' HH:mm", { locale: pt });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-border-dark pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Bell size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Centro de Notificações
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Histórico em tempo real de pedidos, ordens de produção, armazém, caixa e alertas do sistema.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <Check size={16} />
              Marcar todas como lidas ({unreadCount})
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Tem certeza que deseja limpar todo o histórico de notificações?')) {
                  clearNotifications();
                }
              }}
              className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl border border-gray-200 dark:border-gray-800 transition flex items-center gap-1.5"
            >
              <Trash2 size={15} />
              Limpar histórico
            </button>
          )}
        </div>
      </div>

      {/* Tabs Principais de Navegação */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-border-dark">
        <div className="flex gap-2 sm:gap-4 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => {
              setActiveTab('all');
              setPage(1);
            }}
            className={cn(
              "py-3 px-3.5 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap",
              activeTab === 'all'
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            <Bell size={16} />
            Todas as Notificações
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              {notifications.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('unread');
              setPage(1);
            }}
            className={cn(
              "py-3 px-3.5 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap",
              activeTab === 'unread'
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            Não Lidas
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/20 text-primary font-black">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('important');
              setPage(1);
            }}
            className={cn(
              "py-3 px-3.5 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap",
              activeTab === 'important'
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            <AlertTriangle size={16} />
            Críticas & Altas
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={cn(
              "py-3 px-3.5 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-2 whitespace-nowrap",
              activeTab === 'settings'
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
            )}
          >
            <Sliders size={16} />
            Preferências & Sons
          </button>
        </div>
      </div>

      {activeTab === 'settings' ? (
        /* Painel de Configurações de Som e Notificações de Sistema */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cartão de Som */}
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Volume2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Áudio e Efeitos Sonoros</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sons sintetizados Web Audio API sem dependências externas.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-150 dark:border-gray-800">
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">Sons de Notificação</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Tocar alerta acústico quando eventos chegarem em tempo real.</span>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundSettings.enabled)}
                  className={cn(
                    "w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors",
                    soundSettings.enabled ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
                  )}
                >
                  <div
                    className={cn(
                      "bg-white w-4 h-4 rounded-full shadow-md transform transition-transform",
                      soundSettings.enabled ? "translate-x-6" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {soundSettings.enabled && (
                <div className="space-y-2 p-3.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-150 dark:border-gray-800">
                  <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-gray-300">
                    <span>Volume do Áudio</span>
                    <span>{Math.round(soundSettings.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={soundSettings.volume}
                    onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                  />
                </div>
              )}

              {/* Botões para Testar Sons */}
              <div className="pt-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-2">
                  Testar Timbres de Áudio
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleTestSound('chime')}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between"
                  >
                    <span>🔔 Chime (Normal)</span>
                    <Play size={12} className="text-primary" />
                  </button>
                  <button
                    onClick={() => handleTestSound('success')}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between"
                  >
                    <span>✨ Sucesso (Concluído)</span>
                    <Play size={12} className="text-green-600" />
                  </button>
                  <button
                    onClick={() => handleTestSound('alarm')}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between"
                  >
                    <span>⚠️ Alerta (OP / Stock)</span>
                    <Play size={12} className="text-amber-500" />
                  </button>
                  <button
                    onClick={() => handleTestSound('critical')}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between"
                  >
                    <span>🚨 Crítico (Rutura)</span>
                    <Play size={12} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cartão de Notificações do Sistema Operativo */}
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Monitor size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Notificações do Sistema Operativo</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Alertas nativos do Windows, macOS, Linux e Android.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-150 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Estado de Permissão</span>
                  <span className={cn(
                    "text-sm font-extrabold capitalize",
                    osPermission === 'granted' ? "text-green-600 dark:text-green-400" :
                    osPermission === 'denied' ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                  )}>
                    {osPermission === 'granted' ? '✓ Autorizado' : osPermission === 'denied' ? '✗ Bloqueado no Navegador' : '? Aguardando Permissão'}
                  </span>
                </div>

                {osPermission !== 'granted' && (
                  <button
                    onClick={requestOsPermission}
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition"
                  >
                    Solicitar Permissão
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 leading-relaxed bg-blue-50/50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100/60 dark:border-blue-900/40">
                <p className="font-semibold text-blue-900 dark:text-blue-300">Como funciona:</p>
                <p>• Notificações com prioridade Alta e Crítica serão exibidas na área de trabalho mesmo quando estiver numa outra aba ou aplicação.</p>
                <p>• Ao clicar no aviso nativo, o SIGI será colocado em foco e abrirá a página correspondente (OP, Pedido, etc.).</p>
              </div>

              {/* Simulador Completo */}
              <div className="pt-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Disparar Eventos de Demonstração
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      addNotification({
                        type: 'novo_pedido',
                        title: 'Novo Pedido Comercial #415',
                        message: 'Restaurante O Pescador registou Pedido #415 (Total: 920.00 STN).',
                        priority: 'normal',
                        actionUrl: '/pedidos',
                      })
                    }
                    className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-[11px] font-semibold text-gray-800 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 text-left transition"
                  >
                    1. Novo Pedido
                  </button>
                  <button
                    onClick={() =>
                      addNotification({
                        type: 'nova_ordem_producao',
                        title: 'Ordem de Pastelaria OP-908',
                        message: 'Torta de Nozes 2kg pronta para confeção na Pastelaria.',
                        priority: 'high',
                        actionUrl: '/producao',
                      })
                    }
                    className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-[11px] font-semibold text-gray-800 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 text-left transition"
                  >
                    2. Nova OP
                  </button>
                  <button
                    onClick={() =>
                      addNotification({
                        type: 'stock_critico',
                        title: 'Rutura de Stock: Fermento Seco',
                        message: 'Stock do artigo "Fermento Biológico Seco" atingiu 0 unidades!',
                        priority: 'critical',
                        actionUrl: '/armazem',
                      })
                    }
                    className="p-2 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-[11px] font-bold text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/60 text-left transition"
                  >
                    3. Alerta Crítico
                  </button>
                  <button
                    onClick={() =>
                      addNotification({
                        type: 'caixa_fechado',
                        title: 'Fecho de Sessão POS #14',
                        message: 'Caixa fechado por Manuel com saldo final de 2,450.00 STN.',
                        priority: 'high',
                        actionUrl: '/caixa',
                      })
                    }
                    className="p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-[11px] font-semibold text-gray-800 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 text-left transition"
                  >
                    4. Fecho de Caixa
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Lista e Filtros de Notificações */
        <div className="space-y-4">
          {/* Barra de Filtros e Pesquisa */}
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por título, conteúdo ou ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-primary/40 text-gray-900 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Filtro por Categoria */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-hidden"
              >
                <option value="all">Todas as Áreas</option>
                <option value="producao">Produção & Cozinha</option>
                <option value="pedidos">Pedidos Comerciais</option>
                <option value="stock">Stock & Armazém</option>
                <option value="requisicoes">Requisições</option>
                <option value="financeiro">Financeiro / Caixa</option>
                <option value="eventos">Eventos</option>
                <option value="sistema">Sistema</option>
              </select>

              {/* Filtro por Prioridade */}
              <select
                value={selectedPriority}
                onChange={(e) => {
                  setSelectedPriority(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-hidden"
              >
                <option value="all">Todas as Prioridades</option>
                <option value="critical">🚨 Crítica</option>
                <option value="high">⚠️ Alta</option>
                <option value="normal">ℹ️ Normal</option>
                <option value="low">Baixa</option>
              </select>

              {/* Filtro por Período */}
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-hidden"
              >
                <option value="all">Todo o Período</option>
                <option value="today">Hoje</option>
                <option value="week">Esta Semana</option>
              </select>

              {(searchQuery || selectedCategory !== 'all' || selectedPriority !== 'all' || selectedPeriod !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedPriority('all');
                    setSelectedPeriod('all');
                    setPage(1);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  title="Limpar filtros"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Listagem de Notificações */}
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl shadow-xs overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            {paginatedList.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center text-gray-400 mb-3">
                  <Bell size={28} />
                </div>
                <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">Nenhuma notificação encontrada</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Não foram encontradas notificações com os filtros selecionados.
                </p>
              </div>
            ) : (
              paginatedList.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition group",
                    !item.read
                      ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary"
                      : "hover:bg-gray-50/70 dark:hover:bg-gray-800/40"
                  )}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <NotificationIcon type={item.type} priority={item.priority} size={20} />

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-bold truncate",
                            !item.read ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"
                          )}
                        >
                          {item.title}
                        </span>

                        {item.priority === 'critical' && (
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400">
                            Crítica
                          </span>
                        )}
                        {item.priority === 'high' && (
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
                            Alta
                          </span>
                        )}
                        {item.priority === 'normal' && (
                          <span className="px-2 py-0.5 text-[9px] font-semibold uppercase rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                            Normal
                          </span>
                        )}

                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" title="Não lida" />
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-gray-400 pt-0.5">
                        <span>{formatDate(item.timestamp)}</span>
                        {item.source && (
                          <span className="capitalize">• Origem: {item.source}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações da Notificação */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => setSelectedNotification(item)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg transition flex items-center gap-1"
                      title="Ver detalhes técnicos"
                    >
                      <Eye size={13} />
                      <span className="hidden sm:inline">Detalhes</span>
                    </button>

                    {item.actionUrl && (
                      <button
                        onClick={() => handleOpenAction(item)}
                        className="px-3 py-1.5 text-xs font-bold text-primary hover:text-white bg-primary/10 hover:bg-primary rounded-lg transition flex items-center gap-1.5 shadow-2xs"
                      >
                        <span>Abrir</span>
                        <ExternalLink size={13} />
                      </button>
                    )}

                    <button
                      onClick={() => (item.read ? markAsRead(item.id) : markAsRead(item.id))}
                      className="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                      title={item.read ? "Lida" : "Marcar como lida"}
                    >
                      <Check size={16} className={item.read ? "text-green-500" : ""} />
                    </button>

                    <button
                      onClick={() => deleteNotification(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                      title="Eliminar notificação"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Paginação */}
          {filteredList.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <span>Apresentando {paginatedList.length} de {filteredList.length} notificações</span>
                <span>•</span>
                <span>Por página:</span>
                <select
                  value={perPage}
                  onChange={(e) => {
                    setPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-transparent border border-gray-200 dark:border-gray-800 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-hidden"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-3 py-1 font-semibold text-gray-700 dark:text-gray-300">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de Detalhes da Notificação */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2.5">
                <NotificationIcon type={selectedNotification.type} priority={selectedNotification.priority} />
                <div>
                  <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                    {selectedNotification.title}
                  </h3>
                  <span className="text-[11px] text-gray-400">
                    ID: {selectedNotification.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Mensagem</span>
                <p className="text-gray-800 dark:text-gray-200 mt-0.5 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-150 dark:border-gray-800">
                  {selectedNotification.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-150 dark:border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Data e Hora</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {formatDate(selectedNotification.timestamp)}
                  </span>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-150 dark:border-gray-800">
                  <span className="text-[10px] font-bold text-gray-400 uppercase block">Prioridade</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300 uppercase">
                    {selectedNotification.priority}
                  </span>
                </div>
              </div>

              {selectedNotification.data && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Dados do Evento (Payload JSON)
                  </span>
                  <pre className="p-3 bg-gray-900 text-emerald-400 rounded-xl text-[11px] overflow-x-auto max-h-40 font-mono">
                    {JSON.stringify(selectedNotification.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
              >
                Fechar
              </button>

              {selectedNotification.actionUrl && (
                <button
                  onClick={() => {
                    const url = selectedNotification.actionUrl;
                    setSelectedNotification(null);
                    navigate(url);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <span>Ir para Recurso Relacionado</span>
                  <ExternalLink size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

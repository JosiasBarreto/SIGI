import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  Search,
  Check,
  Trash2,
  ExternalLink,
  Volume2,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Smartphone,
  Info,
  CheckCircle2,
  Eye,
  Pin,
  Plus,
  Users,
  Clock,
  RefreshCw,
  Radio,
  Send,
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../components/NotificationContext';
import { NotificationStructuredCard } from '../components/Notifications/NotificationStructuredCard';
import {
  NOTIFICATION_TYPES,
  SoundPreset,
  notificationSoundManager,
  notificationAuditService,
  EstatisticasNotificacoes,
  AuditoriaLeitura,
  AppNotification
} from '../services/notifications';
import { cn } from '../lib/utils';
import { format, isToday, isThisWeek, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function Notificacoes() {
  const {
    notifications,
    unreadCount,
    isLoading: isLoadingNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearNotifications,
    dispatchNotification,
    soundSettings,
    setSoundEnabled,
    setSoundVolume,
    osPermission,
    requestOsPermission
  } = useNotifications();

  const navigate = useNavigate();

  // Abas e Filtros
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'important' | 'settings'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [selectedReadStatus, setSelectedReadStatus] = useState<string>('todas');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Paginação
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [isLoadingSync, setIsLoadingSync] = useState(false);

  // Relatório / Estatísticas em tempo real
  const [estatisticas, setEstatisticas] = useState<EstatisticasNotificacoes | null>(null);

  // Modal de Auditoria (Quem viu / Quem não viu)
  const [selectedForAudit, setSelectedForAudit] = useState<AppNotification | null>(null);
  const [auditoriaData, setAuditoriaData] = useState<AuditoriaLeitura | null>(null);
  const [loadingAuditoria, setLoadingAuditoria] = useState(false);

  // Modal de Detalhes da Notificação
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  // Modal para Criar Novo Comunicado / Notificação
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formNotif, setFormNotif] = useState({
    titulo: '',
    mensagem: '',
    tipo: 'info' as 'info' | 'success' | 'warning' | 'error',
    canal: 'SISTEMA' as 'PEDIDO' | 'PRODUCAO' | 'STOCK' | 'FINANCEIRO' | 'SISTEMA' | 'REQUISICAO' | 'EVENTOS',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    target_type: 'GLOBAL' as 'GLOBAL' | 'SETOR' | 'ROLE',
    target_sector: '',
    persistente: false
  });

  // Carregar Histórico e Estatísticas
  const carregarDadosCompletos = async () => {
    setIsLoadingSync(true);
    try {
      await refreshNotifications();
      const data = await notificationAuditService.getEstatisticas(notifications);
      setEstatisticas(data);
    } catch (e) {
      console.error('[Notificacoes] Erro ao sincronizar dados:', e);
    } finally {
      setIsLoadingSync(false);
    }
  };

  useEffect(() => {
    carregarDadosCompletos();
  }, []);

  useEffect(() => {
    notificationAuditService.getEstatisticas(notifications).then(setEstatisticas);
  }, [notifications]);

  // Abrir Modal de Auditoria "Quem Viu? / Quem Não Viu?"
  const handleOpenAudit = async (notif: AppNotification) => {
    setSelectedForAudit(notif);
    setLoadingAuditoria(true);
    try {
      const data = await notificationAuditService.getAuditoriaLeituras(notif.id, notif);
      setAuditoriaData(data);
    } catch (err) {
      console.error('[Notificacoes] Erro ao carregar auditoria:', err);
    } finally {
      setLoadingAuditoria(false);
    }
  };

  // Marcar como lida e atualizar estatísticas
  const handleMarkAsRead = async (id: string) => {
    markAsRead(id);
    await notificationAuditService.marcarComoLida(id);
    carregarDadosCompletos();
  };

  // Marcar todas como lidas
  const handleMarkAllAsRead = async () => {
    markAllAsRead();
    await notificationAuditService.marcarTodasComoLidas();
    carregarDadosCompletos();
  };

  // Submeter Criação de Nova Notificação / Comunicado
  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNotif.titulo.trim() || !formNotif.mensagem.trim()) return;

    try {
      await notificationAuditService.criarNotificacao(formNotif);
      setShowCreateModal(false);
      setFormNotif({
        titulo: '',
        mensagem: '',
        tipo: 'info',
        canal: 'SISTEMA',
        prioridade: 'media',
        target_type: 'GLOBAL',
        target_sector: '',
        persistente: false
      });
      carregarDadosCompletos();
    } catch (err) {
      console.error('[Notificacoes] Erro ao criar comunicado:', err);
    }
  };

  // Preview de sons
  const handleTestSound = (preset: SoundPreset) => {
    notificationSoundManager.play(preset);
  };

  // Filtragem avançada da lista
  const filteredList = useMemo(() => {
    return notifications.filter((item) => {
      // Filtro de aba rápida
      if (activeTab === 'unread' && item.read) return false;
      if (activeTab === 'important' && item.priority !== 'critical' && item.priority !== 'high') return false;

      // Filtro de Canal
      if (selectedChannel) {
        const c = (item.canal || '').toUpperCase();
        if (c !== selectedChannel) {
          if (selectedChannel === 'PEDIDO' && !item.type.includes('pedido')) return false;
          if (selectedChannel === 'PRODUCAO' && !item.type.includes('producao')) return false;
          if (selectedChannel === 'STOCK' && !item.type.includes('stock')) return false;
          if (selectedChannel === 'FINANCEIRO' && !item.type.includes('caixa') && !item.type.includes('pagamento')) return false;
          if (selectedChannel === 'SISTEMA' && !item.type.includes('notificacao') && !item.type.includes('sistema')) return false;
          if (selectedChannel === 'REQUISICAO' && !item.type.includes('requisicao')) return false;
          if (selectedChannel === 'EVENTOS' && !item.type.includes('evento')) return false;
        }
      }

      // Filtro de Leitura
      if (selectedReadStatus === 'nao_lida' && item.read) return false;
      if (selectedReadStatus === 'lida' && !item.read) return false;

      // Pesquisa por texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = item.title?.toLowerCase().includes(query);
        const matchMsg = item.message?.toLowerCase().includes(query);
        const matchId = item.id?.toLowerCase().includes(query);
        const matchCliente = item.data?.cliente?.toLowerCase().includes(query) || item.data?.cliente_nome?.toLowerCase().includes(query);
        const matchNumero = item.data?.numero?.toLowerCase().includes(query) || item.data?.ordem_numero?.toLowerCase().includes(query);
        if (!matchTitle && !matchMsg && !matchId && !matchCliente && !matchNumero) return false;
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
        } catch {}
      }

      return true;
    });
  }, [notifications, activeTab, selectedChannel, selectedReadStatus, searchQuery, selectedPriority, selectedPeriod]);

  // Paginação
  const totalPages = Math.max(1, Math.ceil(filteredList.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredList.slice(start, start + perPage);
  }, [filteredList, currentPage, perPage]);

  const handleOpenAction = (item: AppNotification) => {
    handleMarkAsRead(item.id);
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
      {/* CABEÇALHO DO ERP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                Central de Gestão de Notificações
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                Histórico em tempo real, auditoria de leitura ("Quem Viu vs Quem Não Viu") e emissão de comunicados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="px-3.5 py-2 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>Marcar todas como lidas</span>
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={16} />
            <span>Nova Notificação / Comunicado</span>
          </button>

          {notifications.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Tem a certeza que deseja limpar todo o histórico de notificações?')) {
                  clearNotifications();
                }
              }}
              className="p-2 text-gray-400 hover:text-red-500 rounded-xl border border-gray-200 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
              title="Limpar histórico"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* CARDS DE RELATÓRIO E ESTATÍSTICAS */}
      {estatisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase">
              <span>Total no Histórico</span>
              <Bell size={16} className="text-primary" />
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              {estatisticas.notificacoes.total_ativas}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">Registo global sincronizado</span>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs text-amber-500 font-semibold uppercase">
              <span>Pendentes / Não Lidas</span>
              <Clock size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {estatisticas.notificacoes.nao_lidas}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">Avisos a requerer atenção</span>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs text-indigo-500 font-semibold uppercase">
              <span>Avisos Fixados</span>
              <Pin size={16} className="text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {estatisticas.notificacoes.persistentes_ativas}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">Prioridade contínua no topo</span>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-xs text-emerald-500 font-semibold uppercase">
              <span>Taxa Leitura SMS/Cli.</span>
              <MessageSquare size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {estatisticas.comunicacoes_sms.taxa_leitura_percent}%
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              {estatisticas.comunicacoes_sms.confirmadas_lidas} de {estatisticas.comunicacoes_sms.total_enviadas} enviadas
            </span>
          </div>
        </div>
      )}

      {/* NAVEGAÇÃO DE ABAS */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-border-dark pb-px">
        <div className="flex gap-2 sm:gap-6 text-xs sm:text-sm font-bold">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'all'
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <span>Todas</span>
            <span className="px-2 py-0.5 text-[11px] rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold">
              {notifications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('unread')}
            className={cn(
              "pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'unread'
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <span>Não lidas</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-[11px] rounded-full bg-primary/20 text-primary font-black">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('important')}
            className={cn(
              "pb-3 border-b-2 transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'important'
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            )}
          >
            <span>Alta Prioridade & Fixadas</span>
          </button>
        </div>

        <button
          onClick={() => setActiveTab('settings')}
          className={cn(
            "pb-3 px-2 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 text-xs sm:text-sm font-bold",
            activeTab === 'settings'
              ? "border-primary text-primary"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          )}
        >
          <Sliders size={16} />
          <span>Configuração de Áudio & Mobile</span>
        </button>
      </div>

      {activeTab === 'settings' ? (
        /* PAINEL DE CONFIGURAÇÕES DE ÁUDIO E SERVICE WORKER */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Volume2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Áudio & Vibração Móvel</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sons sintetizados Web Audio API com desbloqueio contínuo.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-150 dark:border-gray-800">
                <div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white block">Sons de Notificação</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Tocar alerta acústico e vibrar no telemóvel quando novos eventos chegarem.</span>
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

              <div className="pt-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-2">
                  Testar Timbres de Áudio
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleTestSound('chime')}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>🔔 Chime (Normal)</span>
                    <Play size={12} className="text-primary" />
                  </button>
                  <button
                    onClick={() => handleTestSound('success')}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>✨ Sucesso (Pronto)</span>
                    <Play size={12} className="text-green-600" />
                  </button>
                  <button
                    onClick={() => handleTestSound('alarm')}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>⚠️ Alerta (OP / Stock)</span>
                    <Play size={12} className="text-amber-500" />
                  </button>
                  <button
                    onClick={() => handleTestSound('critical')}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>🚨 Crítico (Rutura)</span>
                    <Play size={12} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Ecrã de Bloqueio & Mobile</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Service Worker integrado para entrega em dispositivos móveis Android / PWA / Desktop.</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-150 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Permissão do Navegador</span>
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
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Ativar no Telemóvel
                  </button>
                )}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1.5 leading-relaxed bg-blue-50/50 dark:bg-blue-950/30 p-3.5 rounded-xl border border-blue-100/60 dark:border-blue-900/40">
                <p className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                  <Info size={14} /> Como funcionam as notificações no telemóvel:
                </p>
                <p>• Quando um pedido ou ordem de produção mudar de estado, o telemóvel vibra e emite o sinal sonoro.</p>
                <p>• Mesmo com o telemóvel no bolso ou ecrã bloqueado, o Service Worker apresenta o cartão na barra de notificações.</p>
                <p>• Clicar na notificação desbloqueia e leva diretamente ao pedido ou ordem de produção.</p>
              </div>

              <div className="pt-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Disparar Exemplos do Padrão Universal
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      dispatchNotification('notificacao', {
                        id: `PED-${Date.now()}`,
                        titulo: "Pedido #PED-2026-0042: Pronto para Levantamento",
                        mensagem: "O estado do Pedido #PED-2026-0042 foi alterado para 'PRONTO'.\n• Cliente: Carlos Alberto\n• Produtos: 2x Croissant Simples, 1x Café Expresso\n• Transição: EM_PRODUCAO ➔ PRONTO",
                        tipo: "success",
                        canal: "PEDIDO",
                        prioridade: "alta",
                        persistente: false,
                        data: {
                          pedido_id: 42,
                          numero: "PED-2026-0042",
                          cliente: "Carlos Alberto",
                          produtos: "2x Croissant Simples, 1x Café Expresso",
                          antigo_estado: "EM_PRODUCAO",
                          novo_estado: "PRONTO",
                          origem: "pedido_atualizado"
                        }
                      })
                    }
                    className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold text-emerald-800 dark:text-emerald-200 rounded-xl border border-emerald-200 dark:border-emerald-800 text-left transition cursor-pointer"
                  >
                    1. Pedido Pronto (#PED-2026-0042)
                  </button>

                  <button
                    onClick={() =>
                      dispatchNotification('notificacao', {
                        id: `OP-${Date.now()}`,
                        titulo: "Produção (Pastelaria) #OP-PAS-0089: Concluída",
                        mensagem: "A ordem de produção #OP-PAS-0089 (Pastelaria) passou para 'PRONTO'.\n• Pedido: #PED-2026-0042\n• Cliente: Carlos Alberto\n• Artigos: 2x Croissant Simples\n• Transição: EM_PRODUCAO ➔ PRONTO",
                        tipo: "success",
                        canal: "PRODUCAO",
                        prioridade: "alta",
                        persistente: false,
                        data: {
                          ordem_id: 89,
                          ordem_numero: "OP-PAS-0089",
                          pedido_numero: "PED-2026-0042",
                          sector: "Pastelaria",
                          cliente: "Carlos Alberto",
                          produtos: "2x Croissant Simples",
                          antigo_estado: "EM_PRODUCAO",
                          novo_estado: "PRONTO",
                          origem: "ordem_producao_atualizada"
                        }
                      })
                    }
                    className="p-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-xs font-bold text-amber-800 dark:text-amber-200 rounded-xl border border-amber-200 dark:border-amber-800 text-left transition cursor-pointer"
                  >
                    2. OP Pastelaria (#OP-PAS-0089)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LISTA E FILTROS DE NOTIFICAÇÕES */
        <div className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por texto, #PED-..., #OP-..., cliente, artigos..."
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Filtro Canal */}
              <select
                value={selectedChannel}
                onChange={(e) => {
                  setSelectedChannel(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-hidden cursor-pointer"
              >
                <option value="">Todos os Canais</option>
                <option value="PEDIDO">Pedidos (Vendas)</option>
                <option value="PRODUCAO">Produção (Cozinha/Past.)</option>
                <option value="STOCK">Stock & Armazém</option>
                <option value="REQUISICAO">Requisições</option>
                <option value="FINANCEIRO">Financeiro & Caixa</option>
                <option value="SISTEMA">Sistema / Comunicados</option>
                <option value="EVENTOS">Eventos</option>
              </select>

              {/* Filtro Leitura */}
              <select
                value={selectedReadStatus}
                onChange={(e) => {
                  setSelectedReadStatus(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-hidden cursor-pointer"
              >
                <option value="todas">Todas as Notificações</option>
                <option value="nao_lida">Apenas Não Lidas</option>
                <option value="lida">Apenas Lidas</option>
              </select>

              {/* Filtro Prioridade */}
              <select
                value={selectedPriority}
                onChange={(e) => {
                  setSelectedPriority(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Todas as Prioridades</option>
                <option value="critical">🚨 Urgente / Crítica</option>
                <option value="high">⚠️ Alta</option>
                <option value="normal">ℹ️ Normal / Média</option>
                <option value="low">Baixa</option>
              </select>

              {/* Botão de Atualizar */}
              <button
                onClick={carregarDadosCompletos}
                className="p-2 bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-600 dark:text-gray-300 transition cursor-pointer"
                title="Atualizar dados"
              >
                <RefreshCw className={cn('w-4 h-4', (isLoadingSync || isLoadingNotifications) ? 'animate-spin text-primary' : '')} />
              </button>

              {(searchQuery || selectedChannel || selectedReadStatus !== 'todas' || selectedPriority !== 'all' || selectedPeriod !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedChannel('');
                    setSelectedReadStatus('todas');
                    setSelectedPriority('all');
                    setSelectedPeriod('all');
                    setPage(1);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                  title="Limpar filtros"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Listagem de Notificações com Card e Botão 'Quem Viu?' */}
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
                <div key={item.id} className="relative group">
                  <NotificationStructuredCard
                    notification={item}
                    compact={false}
                    onOpen={handleOpenAction}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={deleteNotification}
                    onSelectDetail={setSelectedNotification}
                  />

                  {/* Botão Flutuante de Auditoria "Quem Viu?" no canto do card */}
                  <div className="absolute right-4 top-3.5 z-10 flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenAudit(item);
                      }}
                      className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800/90 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20 border border-gray-200 dark:border-gray-700/80 rounded-lg text-[11px] font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                      title="Ver auditoria de quem já leu e quem ainda não viu esta notificação"
                    >
                      <Eye size={13} className="text-indigo-500" />
                      <span>Quem Viu?</span>
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
                  className="bg-transparent border border-gray-200 dark:border-gray-800 rounded px-1.5 py-0.5 text-xs font-semibold focus:outline-hidden cursor-pointer"
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
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>

                <span className="px-3 py-1 font-semibold text-gray-700 dark:text-gray-300">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-800 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE AUDITORIA "QUEM VIU / QUEM NÃO VIU" */}
      {selectedForAudit && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    Auditoria de Leitura
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">ID: {selectedForAudit.id}</span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-base mt-1">
                  {selectedForAudit.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                  {selectedForAudit.message}
                </p>
              </div>
              <button
                onClick={() => setSelectedForAudit(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAuditoria ? (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">A consultar registo de leituras em tempo real...</span>
              </div>
            ) : auditoriaData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Coluna 1: Quem Já Leu */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Quem Já Leu
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-full text-[11px] font-black">
                      {auditoriaData.lidos.length}
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {auditoriaData.lidos.length === 0 ? (
                      <p className="text-xs text-gray-400 italic py-4 text-center">Nenhum operador confirmou leitura ainda.</p>
                    ) : (
                      auditoriaData.lidos.map((u) => (
                        <div
                          key={u.user_id}
                          className="text-xs p-2.5 bg-white dark:bg-gray-900/80 rounded-lg border border-emerald-100 dark:border-emerald-900/30 shadow-2xs"
                        >
                          <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                            <span>{u.nome}</span>
                            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{u.role}</span>
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            <Clock size={11} />
                            <span>{u.lido_em ? formatDate(u.lido_em) : 'Confirmado'}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Coluna 2: Quem Não Viu */}
                <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/40">
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Quem Não Viu
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 rounded-full text-[11px] font-black">
                      {auditoriaData.nao_lidos.length}
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {auditoriaData.nao_lidos.length === 0 ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold py-4 text-center">
                        ✓ Todos os operadores já visualizaram!
                      </p>
                    ) : (
                      auditoriaData.nao_lidos.map((u) => (
                        <div
                          key={u.user_id}
                          className="text-xs p-2.5 bg-white dark:bg-gray-900/80 rounded-lg border border-amber-100 dark:border-amber-900/30 shadow-2xs"
                        >
                          <div className="font-bold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                            <span>{u.nome}</span>
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">{u.role}</span>
                          </div>
                          <div className="text-[10px] text-amber-600 dark:text-amber-400/80 mt-1 font-medium">
                            Pendente de Leitura
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setSelectedForAudit(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO MANUAL DE NOTIFICAÇÃO / COMUNICADO */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateNotification}
            className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">Nova Notificação / Comunicado</h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Emissão de aviso em tempo real para operadores e setores</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Título do Comunicado *</label>
              <input
                required
                type="text"
                value={formNotif.titulo}
                onChange={(e) => setFormNotif({ ...formNotif, titulo: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                placeholder="Ex: Reunião Geral de Cozinha às 17h / Aviso de Manutenção"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Mensagem Detalhada *</label>
              <textarea
                required
                rows={3}
                value={formNotif.mensagem}
                onChange={(e) => setFormNotif({ ...formNotif, mensagem: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs sm:text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                placeholder="Insira os detalhes do aviso ou orientações aos operadores..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Canal</label>
                <select
                  value={formNotif.canal}
                  onChange={(e) => setFormNotif({ ...formNotif, canal: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="SISTEMA">Sistema / Geral</option>
                  <option value="PEDIDO">Pedidos (Vendas)</option>
                  <option value="PRODUCAO">Produção Fabril</option>
                  <option value="STOCK">Stock & Armazém</option>
                  <option value="FINANCEIRO">Financeiro / Caixa</option>
                  <option value="REQUISICAO">Requisições</option>
                  <option value="EVENTOS">Eventos</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Prioridade</label>
                <select
                  value={formNotif.prioridade}
                  onChange={(e) => setFormNotif({ ...formNotif, prioridade: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média / Normal</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">🚨 Urgente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Destinatários</label>
                <select
                  value={formNotif.target_type}
                  onChange={(e) => setFormNotif({ ...formNotif, target_type: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="GLOBAL">Todos os Utilizadores (Global)</option>
                  <option value="SETOR">Setor Específico</option>
                  <option value="ROLE">Papel Específico</option>
                </select>
              </div>

              {formNotif.target_type === 'SETOR' ? (
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Setor Alvo</label>
                  <select
                    value={formNotif.target_sector}
                    onChange={(e) => setFormNotif({ ...formNotif, target_sector: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="">Selecione o setor...</option>
                    <option value="Cozinha">Cozinha</option>
                    <option value="Pastelaria">Pastelaria</option>
                    <option value="Bar">Bar</option>
                    <option value="Armazém">Armazém</option>
                    <option value="Caixa">Caixa / Balcão</option>
                  </select>
                </div>
              ) : formNotif.target_type === 'ROLE' ? (
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Papel Alvo</label>
                  <select
                    value={formNotif.target_sector}
                    onChange={(e) => setFormNotif({ ...formNotif, target_sector: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="">Selecione o papel...</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Cozinha">Cozinha</option>
                    <option value="Pastelaria">Pastelaria</option>
                    <option value="Atendimento">Atendimento</option>
                    <option value="Armazém">Armazém</option>
                  </select>
                </div>
              ) : null}
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer pt-2 select-none">
              <input
                type="checkbox"
                checked={formNotif.persistente}
                onChange={(e) => setFormNotif({ ...formNotif, persistente: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-700 text-primary accent-primary"
              />
              <span className="font-semibold">Fixar no topo como aviso prioritário persistente</span>
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Send size={13} />
                <span>Publicar Comunicado</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL DE DETALHES DA NOTIFICAÇÃO (INSPETOR JSON) */}
      {selectedNotification && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-gray-900 dark:text-white leading-tight">
                  {selectedNotification.title}
                </h3>
                <span className="text-[11px] text-gray-400">
                  ID: {selectedNotification.id} • {formatDate(selectedNotification.timestamp)}
                </span>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <NotificationStructuredCard
                  notification={selectedNotification}
                  compact={false}
                />
              </div>

              {(selectedNotification.data || selectedNotification.metadados) && (
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Metadados do Evento (Payload JSON Normalizado)
                  </span>
                  <pre className="p-3 bg-gray-900 text-emerald-400 rounded-xl text-[11px] overflow-x-auto max-h-48 font-mono">
                    {JSON.stringify(selectedNotification.data || selectedNotification.metadados, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  const item = selectedNotification;
                  setSelectedNotification(null);
                  handleOpenAudit(item);
                }}
                className="px-3.5 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              >
                <Eye size={14} />
                <span>Auditoria de Quem Viu</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition cursor-pointer"
                >
                  Fechar
                </button>

                {selectedNotification.actionUrl && (
                  <button
                    onClick={() => {
                      const url = selectedNotification.actionUrl;
                      setSelectedNotification(null);
                      navigate(url!);
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Abrir no Sistema</span>
                    <ExternalLink size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

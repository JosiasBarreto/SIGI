import React, { useState, useMemo } from 'react';
import {
  Bell,
  Search,
  Check,
  Trash2,
  ExternalLink,
  Volume2,
  Sliders,
  Monitor,
  Play,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Smartphone,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../components/NotificationContext';
import { NotificationStructuredCard } from '../components/Notifications/NotificationStructuredCard';
import { NOTIFICATION_TYPES, SoundPreset, notificationSoundManager } from '../services/notifications';
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
    dispatchNotification,
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
        const matchCliente = item.data?.cliente?.toLowerCase().includes(query) || item.data?.cliente_nome?.toLowerCase().includes(query);
        const matchNumero = item.data?.numero?.toLowerCase().includes(query) || item.data?.ordem_numero?.toLowerCase().includes(query);
        if (!matchTitle && !matchMsg && !matchId && !matchCliente && !matchNumero) return false;
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
        } catch {}
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
                Padrão Universal de Notificações para Pedidos, Ordens de Produção Fabril, Stock e Caixa em Tempo Real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={16} />
              <span>Marcar todas como lidas</span>
            </button>
          )}

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

      {/* Navegação por Abas Principais */}
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
            <span>Alta Prioridade</span>
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
        /* Painel de Configurações de Som e Notificações de Sistema & Mobile */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cartão de Som */}
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Volume2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Áudio & Vibração Móvel</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sons sintetizados Web Audio API com desbloqueio táctil contínuo.</p>
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

              {/* Botões para Testar Sons */}
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

          {/* Cartão de Notificações do Sistema Operativo & Mobile Lock Screen */}
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Ecrã de Bloqueio & Barra de Notificações</h3>
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

              {/* Simulador Completo segundo o Padrão Universal */}
              <div className="pt-2">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-500" /> Disparar Exemplos do Padrão Universal
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={() =>
                      dispatchNotification('notificacao', {
                        id: Date.now(),
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
                        id: Date.now() + 1,
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
        /* Lista e Filtros de Notificações */
        <div className="space-y-4">
          {/* Barra de Filtros e Pesquisa */}
          <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar por referência #PED/#OP, cliente, artigos ou estado..."
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
              {/* Filtro por Categoria */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Todas as Áreas</option>
                <option value="producao">Produção Fabril & Cozinha</option>
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
                className="px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-hidden cursor-pointer"
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
                className="px-3 py-2 text-xs font-semibold bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-hidden cursor-pointer"
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
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
                  title="Limpar filtros"
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Listagem de Notificações com Cartões Estruturados Padronizados */}
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
                <NotificationStructuredCard
                  key={item.id}
                  notification={item}
                  compact={false}
                  onOpen={handleOpenAction}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  onSelectDetail={setSelectedNotification}
                />
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

      {/* Modal de Detalhes da Notificação */}
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
              {/* Apresentação no Cartão Estruturado */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <NotificationStructuredCard
                  notification={selectedNotification}
                  compact={false}
                />
              </div>

              {/* Inspetor de Payload JSON */}
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

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
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
                    navigate(url);
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
      )}
    </div>
  );
}

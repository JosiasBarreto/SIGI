import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Check,
  Volume2,
  VolumeX,
  ExternalLink,
  Monitor,
  Sparkles,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotifications } from '../NotificationContext';
import { NotificationStructuredCard } from './NotificationStructuredCard';
import { cn } from '../../lib/utils';

export function NotificationBellDropdown() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    soundSettings,
    setSoundEnabled,
    osPermission,
    requestOsPermission,
    dispatchNotification
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'important'>('all');
  const [showSimulator, setShowSimulator] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredNotifications = notifications.filter((item) => {
    if (filterTab === 'unread') return !item.read;
    if (filterTab === 'important') return item.priority === 'critical' || item.priority === 'high';
    return true;
  });

  const handleNotificationClick = (item: any) => {
    markAsRead(item.id);
    if (item.actionUrl) {
      setIsOpen(false);
      navigate(item.actionUrl);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {/* Botão do Sino com badge de não lidas */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all relative group"
        aria-label="Notificações"
        title="Centro de Notificações"
      >
        <Bell size={20} className={cn(unreadCount > 0 ? "text-primary" : "")} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[19px] h-[19px] bg-red-600 text-white text-[10px] font-extrabold flex items-center justify-center rounded-full px-1 shadow-md ring-2 ring-white dark:ring-surface-dark animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Painel Dropdown do Centro de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-[420px] bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Cabeçalho */}
          <div className="p-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-900/60 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 dark:text-white">Notificações</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/15 text-primary rounded-full">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Botão rápido para ligar/desligar som */}
              <button
                onClick={() => setSoundEnabled(!soundSettings.enabled)}
                className={cn(
                  "p-1.5 rounded-lg text-xs transition-colors cursor-pointer",
                  soundSettings.enabled
                    ? "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
                    : "text-red-500 bg-red-50 dark:bg-red-950/40 hover:bg-red-100"
                )}
                title={soundSettings.enabled ? "Som ativado (clique para silenciar)" : "Som silenciado (clique para ativar)"}
              >
                {soundSettings.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Marcar todas como lidas */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 transition-colors px-1.5 py-1 rounded hover:bg-primary/10 cursor-pointer"
                  title="Marcar todas como lidas"
                >
                  <Check size={14} />
                  <span className="hidden sm:inline">Ler todas</span>
                </button>
              )}
            </div>
          </div>

          {/* Banner de Ativação do Sistema Operativo se ainda não autorizado */}
          {osPermission === 'default' && (
            <div className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-100 dark:border-blue-900/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-blue-900 dark:text-blue-300">
                <Monitor size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] leading-tight">Receber avisos no telemóvel / ecrã de bloqueio?</span>
              </div>
              <button
                onClick={requestOsPermission}
                className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-md shadow-xs transition cursor-pointer"
              >
                Ativar
              </button>
            </div>
          )}

          {/* Tabs de Filtro Rápido */}
          <div className="flex border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30 px-3 pt-2 gap-2 text-xs">
            <button
              onClick={() => setFilterTab('all')}
              className={cn(
                "pb-2 px-2 font-medium border-b-2 transition-all cursor-pointer",
                filterTab === 'all'
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={cn(
                "pb-2 px-2 font-medium border-b-2 transition-all cursor-pointer",
                filterTab === 'unread'
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Não lidas {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              onClick={() => setFilterTab('important')}
              className={cn(
                "pb-2 px-2 font-medium border-b-2 transition-all cursor-pointer",
                filterTab === 'important'
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              Importantes
            </button>
          </div>

          {/* Lista de Notificações com Cards Estruturados */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60 custom-scrollbar">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-2">
                  <Bell size={22} />
                </div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sem notificações</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {filterTab === 'unread' ? 'Todas as notificações foram lidas!' : 'Tudo em ordem por aqui.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <NotificationStructuredCard
                  key={n.id}
                  notification={n}
                  compact={true}
                  onOpen={handleNotificationClick}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </div>

          {/* Simulador Expansível para Testes de Socket.IO / Padrão Universal */}
          <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60 p-2.5">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowSimulator(!showSimulator)}
                className="text-[11px] font-bold text-gray-600 dark:text-gray-400 hover:text-primary flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles size={13} className="text-amber-500" />
                <span>Simulador de Eventos em Tempo Real</span>
              </button>
              <Link
                to="/notificacoes"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
              >
                <span>Ver todas</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            {showSimulator && (
              <div className="mt-2.5 pt-2 border-t border-gray-200 dark:border-gray-800 grid grid-cols-2 gap-1.5">
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
                  className="p-2 bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 text-left transition cursor-pointer"
                >
                  1. Pedido Pronto (Exemplo 1)
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
                  className="p-2 bg-white dark:bg-gray-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] font-semibold text-amber-700 dark:text-amber-300 rounded-lg border border-amber-200 dark:border-amber-800 text-left transition cursor-pointer"
                >
                  2. OP Concluída (Exemplo 2)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

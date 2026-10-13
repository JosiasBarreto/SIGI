// src/components/NotificationCenter.tsx
// Componente Visual do Painel de Notificações (UI/UX) conforme a Secção 6 do Relatório de Arquitetura

import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Clock, Trash2, ChevronDown, ChevronUp, Check, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { AppNotification } from '../types/notifications';
import { cn } from '../lib/utils';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotifications();

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleItemClick = (item: AppNotification) => {
    markAsRead(item.id);
    if (item.actionUrl) {
      setIsOpen(false);
      navigate(item.actionUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Sino */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-800 transition cursor-pointer"
        title="Centro de Notificações"
        aria-label="Abrir Notificações"
      >
        <Bell className={cn("w-5 h-5", unreadCount > 0 ? "text-primary" : "")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center px-1 shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-92 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Cabeçalho */}
          <div className="p-3.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-950/70 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900 dark:text-slate-200">Notificações</span>
              {unreadCount > 0 && (
                <span className="bg-indigo-500/15 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} nova{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Ler todas
              </button>
            )}
          </div>

          {/* Lista de Notificações Desduplicadas */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
                <Bell className="w-8 h-8 opacity-20" />
                <span>Nenhuma notificação no momento.</span>
              </div>
            ) : (
              notifications.map((item) => {
                const isRead = Boolean(item.lida ?? item.read);
                const estadoLower = String(item.estadoAtual || '').toLowerCase();
                const isPronto = estadoLower === 'pronto';
                const isAprovada = estadoLower === 'aprovada';
                const isErro = estadoLower.includes('alerta') || estadoLower.includes('rejeit') || item.tipo === 'error';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={cn(
                      "p-3.5 transition cursor-pointer relative",
                      isRead
                        ? "bg-white dark:bg-slate-900/40 hover:bg-gray-50 dark:hover:bg-slate-800/40"
                        : "bg-indigo-50/40 dark:bg-slate-800/50 hover:bg-indigo-50/70 dark:hover:bg-slate-800/70 border-l-3 border-indigo-500"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* Header do Card: Referência e Badge de Estado */}
                        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300">
                            {item.referencia}
                          </span>

                          <span
                            className={cn(
                              "text-[10px] font-extrabold px-2 py-0.5 rounded",
                              isPronto || isAprovada
                                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30"
                                : isErro
                                ? "bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30"
                                : "bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30"
                            )}
                          >
                            {item.estadoAtual}
                          </span>

                          {isPronto && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                              ✓ Cliente Notificado
                            </span>
                          )}
                        </div>

                        {/* Mensagem Atual */}
                        <p className="text-xs text-gray-800 dark:text-slate-200 font-medium leading-relaxed">
                          {item.mensagemAtual}
                        </p>

                        {/* Horário */}
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1 mt-1.5 font-mono">
                          <Clock className="w-3 h-3" />
                          {item.atualizadaEm ? new Date(item.atualizadaEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                        </span>
                      </div>

                      {/* Botão de Remover */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearNotification(item.id);
                        }}
                        className="text-gray-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 p-1 transition rounded hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Remover notificação"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Histórico Expansível de Transições de Estado */}
                    {Array.isArray(item.historico) && item.historico.length > 1 && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-slate-800/60">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedId(expandedId === item.id ? null : item.id);
                          }}
                          className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-mono font-semibold cursor-pointer"
                        >
                          {expandedId === item.id ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                          Ver histórico ({item.historico.length} etapas)
                        </button>

                        {expandedId === item.id && (
                          <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-indigo-200 dark:border-slate-700/60 ml-1 py-0.5">
                            {item.historico.map((h, i) => (
                              <div
                                key={i}
                                className="text-[10px] text-gray-600 dark:text-slate-400 flex items-center justify-between gap-2"
                              >
                                <span className="font-medium">• {h.estado} {h.mensagem && h.mensagem !== item.mensagemAtual ? `(${h.mensagem.slice(0, 30)}...)` : ''}</span>
                                <span className="text-gray-400 dark:text-slate-500 font-mono text-[9px]">
                                  {h.timestamp ? new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

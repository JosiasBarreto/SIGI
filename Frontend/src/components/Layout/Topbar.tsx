import React, { useState, useRef, useEffect } from "react";
import { Bell, Search, Menu, Moon, Sun, User, Check, Command } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { useAuth } from "../AuthContext";
import { useNotifications, AppNotification } from "../NotificationContext";
import { cn } from "../../lib/utils";

export function Topbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const typeStyles = {
    info: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
    error: 'bg-error/10 text-error'
  };

  return (
    <header className="h-16 bg-white dark:bg-surface-dark border-b border-border dark:border-border-dark flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          title="Alternar Barra Lateral"
        >
          <Menu size={20} />
        </button>
        <button 
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          className="hidden md:flex items-center bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-800 hover:border-primary/50 px-3 py-2 rounded-lg transition-all w-64 lg:w-96 group text-left"
        >
          <Search size={18} className="text-gray-400 group-hover:text-primary transition-colors" />
          <span className="ml-2 text-sm text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 w-full transition-colors">
            Pesquisar ou saltar para...
          </span>
          <div className="flex items-center gap-1 text-xs text-gray-400 font-medium px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-surface-dark">
            <Command size={12} /> K
          </div>
        </button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotif(!showNotif)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface dark:ring-surface-dark animate-pulse"></span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-2xl shadow-xl overflow-hidden animate-fade-in-up origin-top-right">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notificações</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-primary hover:text-primary-hover font-medium flex items-center gap-1">
                    <Check size={14} /> Marcar todas como lidas
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">Sem notificações</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        "p-4 border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer flex gap-3",
                        !n.read ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary" : ""
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs uppercase", typeStyles[n.type || 'info'])}>
                        {n.type === 'error' ? '!' : n.type === 'success' ? '✓' : n.type === 'warning' ? '?' : 'i'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm font-bold truncate", !n.read ? "text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300")}>{n.title}</p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">{new Date(n.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-snug">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Socket Simulator controller */}
              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 border-t border-gray-150 flex flex-col gap-1.5">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">🧪 TESTAR EVENTOS DE SOCKET.IO</span>
                <div className="grid grid-cols-2 gap-1">
                  <button 
                    onClick={() => useNotifications().addNotification({ title: 'Novo pedido recebido', message: 'Cliente Sabor Imbatível registou Pedido #201.', type: 'info' })}
                    className="px-1.5 py-1 bg-white hover:bg-gray-50 text-[8px] font-bold rounded shadow-xs transition border text-gray-700 text-left truncate"
                  >
                    1. Novo Pedido
                  </button>
                  <button 
                    onClick={() => useNotifications().addNotification({ title: 'Pedido Concluído (Cozinha)', message: 'A Ordem de Produção de Bolo de Cenoura foi finalizada.', type: 'success' })}
                    className="px-1.5 py-1 bg-white hover:bg-gray-50 text-[8px] font-bold rounded shadow-xs transition border text-gray-700 text-left truncate"
                  >
                    2. Pedido Concluído
                  </button>
                  <button 
                    onClick={() => useNotifications().addNotification({ title: 'Nova Requisição Criada', message: 'OP #12 solicitou 10kg de Trigo e ovos.', type: 'warning' })}
                    className="px-1.5 py-1 bg-white hover:bg-gray-50 text-[8px] font-bold rounded shadow-xs transition border text-gray-700 text-left truncate"
                  >
                    3. Nova Requisição
                  </button>
                  <button 
                    onClick={() => useNotifications().addNotification({ title: 'Alerta de Stock Crítico', message: 'Matéria-Prima "Sal iodado" atingiu limite de segurança.', type: 'error' })}
                    className="px-1.5 py-1 bg-white hover:bg-gray-50 text-[8px] font-bold rounded shadow-xs transition border text-gray-700 text-left truncate"
                  >
                    4. Stock Crítico
                  </button>
                  <button 
                    onClick={() => useNotifications().addNotification({ title: 'Entrega de Peça Concluída', message: 'O Motorista entregou o pedido do cliente Sagrada Esperança.', type: 'success' })}
                    className="px-1.5 py-1 bg-white hover:bg-gray-50 text-[8px] font-bold rounded shadow-xs transition border text-gray-700 text-left truncate"
                  >
                    5. Entrega Concluída
                  </button>
                  <button 
                    onClick={() => useNotifications().addNotification({ title: 'Fecho de Caixa POS', message: 'Turno fechado por Carla. Fundo final conciliado.', type: 'info' })}
                    className="px-1.5 py-1 bg-white hover:bg-gray-50 text-[8px] font-bold rounded shadow-xs transition border text-gray-700 text-left truncate"
                  >
                    6. Fecho Caixa
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 border-l border-gray-200 dark:border-gray-700 mx-1"></div>
        <Link to="/perfil" className="flex items-center gap-3 cursor-pointer p-1 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition pl-2 pr-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold shadow-sm">
            {user?.name.charAt(0) || <User size={16} />}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-none mb-1">
              {user?.name || "Carregando..."}
            </p>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider leading-none">{user?.role}</p>
          </div>
        </Link>
      </div>
    </header>
  );
}

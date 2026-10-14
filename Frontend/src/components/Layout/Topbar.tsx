import React, { useState } from "react";
import { Search, Menu, Moon, Sun, User, Command, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { useAuth } from "../AuthContext";
import { CentralNotificacoesModal } from "../Notifications/CentralNotificacoesModal";

export function Topbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const getHeaders = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
  };

  return (
    <header className="h-16 bg-white dark:bg-surface-dark border-b border-border dark:border-border-dark flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
          title="Alternar Barra Lateral"
        >
          <Menu size={20} />
        </button>
        <button 
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
          className="hidden md:flex items-center bg-gray-50 dark:bg-background-dark border border-gray-200 dark:border-gray-800 hover:border-primary/50 px-3 py-2 rounded-lg transition-all w-64 lg:w-96 group text-left cursor-pointer"
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
          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
          title={theme === "dark" ? "Modo Claro" : "Modo Escuro"}
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        {/* Botão de Notificações Inteligentes com Badge (conforme Guia de Implementação) */}
        <button 
          onClick={() => setShowNotifications(true)}
          className="relative p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-slate-700 transition cursor-pointer"
          title="Central de Notificações Inteligentes (Quem Viu / Não Viu)"
          aria-label="Abrir Notificações Inteligentes"
        >
          <Bell className="w-5 h-5" />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center px-1 shadow animate-pulse">
              {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
            </span>
          )}
        </button>

        {/* Modal de Notificações com Rastreio 'Quem Viu / Quem Não Viu' */}
        <CentralNotificacoesModal 
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
          getHeaders={getHeaders}
          onNotificacaoCountChange={setUnreadNotifCount}
        />

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

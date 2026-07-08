import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Command, ShoppingCart, UserPlus, PackagePlus, CalendarPlus } from 'lucide-react';
import Swal from 'sweetalert2';

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const quickActions = [
    { id: '1', title: 'Novo Pedido de Catering', icon: ShoppingCart, action: () => { setIsOpen(false); navigate('/pedidos'); Swal.fire('Novo Pedido', 'Modal abriria aqui.', 'info'); } },
    { id: '2', title: 'Registar Cliente Empresarial', icon: UserPlus, action: () => { setIsOpen(false); navigate('/clientes'); } },
    { id: '3', title: 'Novo Registo de Receita/Despesa', icon: PackagePlus, action: () => { setIsOpen(false); navigate('/financeiro'); } },
    { id: '4', title: 'Agendar Evento VIP', icon: CalendarPlus, action: () => { setIsOpen(false); navigate('/eventos'); } },
  ];

  const modules = [
    { id: 'm1', title: 'Ir para Dashboard', path: '/' },
    { id: 'm2', title: 'Ir para Vendas & Pedidos', path: '/pedidos' },
    { id: 'm3', title: 'Ir para Produção (Cozinha)', path: '/producao' },
    { id: 'm4', title: 'Ir para Calendário Global', path: '/calendario' },
    { id: 'm5', title: 'Ir para Controlo de Stock', path: '/produtos' },
    { id: 'm6', title: 'Ir para Gestão de Frota', path: '/logistica' },
  ];

  const results = [...quickActions, ...modules].filter(i => 
    i.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-surface dark:bg-surface-dark w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up border border-gray-200 dark:border-border-dark flex flex-col"
      >
        <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800">
          <Search size={22} className="text-gray-400 mr-3" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400"
            placeholder="Pesquise ações, módulos ou atalhos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 uppercase">
            Esc
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
          {query.length === 0 && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-widest">
              Ações Rápidas (Sabor Imbatível)
            </div>
          )}
          
          {results.length > 0 ? results.map((item: any) => (
            <button
              key={item.id}
              onClick={() => {
                if(item.action) {
                  item.action();
                } else if(item.path) {
                  setIsOpen(false);
                  navigate(item.path);
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors text-left group"
            >
              {item.icon ? (
                <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary">
                  <item.icon size={18} />
                </div>
              ) : (
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
                  <Command size={18} />
                </div>
              )}
              <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-primary dark:group-hover:text-primary">
                {item.title}
              </span>
            </button>
          )) : (
            <div className="p-8 text-center text-gray-500">
              Nenhum resultado encontrado para "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

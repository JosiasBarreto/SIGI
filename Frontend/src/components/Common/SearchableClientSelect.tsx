import React, { useState, useRef, useEffect } from "react";
import { User, Search, ChevronDown, Check, X } from "lucide-react";

interface Client {
  id: string | number;
  nome?: string;
  name?: string;
  nif?: string;
  telefone?: string;
  email?: string;
}

interface SearchableClientSelectProps {
  clients: Client[];
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchableClientSelect({
  clients,
  selectedClientId,
  onSelectClient,
  placeholder = "Consumidor Final (Sem NIF)",
  className = "",
}: SearchableClientSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedClient = clients.find(
    (c) => String(c.id) === String(selectedClientId)
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = clients.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = String(c.nome || c.name || "").toLowerCase();
    const nif = String(c.nif || "").toLowerCase();
    const phone = String(c.telefone || "").toLowerCase();
    return name.includes(q) || nif.includes(q) || phone.includes(q);
  });

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-left shadow-sm hover:border-gray-300 dark:hover:border-gray-600"
      >
        <div className="flex items-center gap-2 truncate">
          <User size={14} className="text-primary shrink-0" />
          <span className="truncate">
            {selectedClient
              ? `${selectedClient.nome || selectedClient.name}${
                  selectedClient.nif ? ` (NIF: ${selectedClient.nif})` : ""
                }`
              : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 text-gray-400">
          {selectedClientId && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onSelectClient("");
                setSearchQuery("");
              }}
              className="p-0.5 hover:text-red-500 rounded transition-colors"
              title="Limpar seleção"
            >
              <X size={13} />
            </span>
          )}
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden text-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Input Box */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-2">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Pesquisar por nome, NIF ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
            {/* Consumidor Final Option */}
            <button
              type="button"
              onClick={() => {
                onSelectClient("");
                setIsOpen(false);
                setSearchQuery("");
              }}
              className={`w-full px-3 py-2.5 text-left flex items-center justify-between transition-colors ${
                !selectedClientId
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              }`}
            >
              <div className="flex flex-col">
                <span className="font-bold">Consumidor Final</span>
                <span className="text-[10px] text-gray-400">Atendimento genérico sem NIF</span>
              </div>
              {!selectedClientId && <Check size={14} className="text-primary" />}
            </button>

            {/* Filtered Clients List */}
            {filteredClients.length === 0 ? (
              <div className="p-4 text-center text-gray-400 italic text-[11px]">
                Nenhum cliente encontrado para "{searchQuery}"
              </div>
            ) : (
              filteredClients.map((c) => {
                const isSelected = String(c.id) === String(selectedClientId);
                const name = c.nome || c.name || "Sem Nome";
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelectClient(String(c.id));
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary font-bold"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex flex-col truncate pr-2">
                      <span className="font-semibold truncate">{name}</span>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        {c.nif && <span>NIF: {c.nif}</span>}
                        {c.telefone && <span>Tel: {c.telefone}</span>}
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-primary shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

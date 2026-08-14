import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, User, AlertTriangle } from "lucide-react";

interface ClientComboboxProps {
  clients: any[];
  selectedClient: string;
  onChange: (clientId: string) => void;
  required?: boolean;
}

export default function ClientCombobox({
  clients,
  selectedClient,
  onChange,
  required = false,
}: ClientComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = clients.filter((c) => {
    const searchStr = `${c.name || c.nome} ${c.nif || ""} ${c.telefone || ""}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const selectedClientObj = clients.find((c) => String(c.id) === String(selectedClient));

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex flex-col gap-1.5 mb-2">
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
          Cliente {required ? <span className="text-amber-600">(OBRIGATÓRIO)</span> : "(Opcional)"}
        </label>
      </div>
      
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between w-full bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm cursor-pointer border ${
          required && !selectedClient
            ? "border-amber-500 shadow-[0_0_0_1px_#f59e0b] dark:shadow-amber-500/50"
            : isOpen
            ? "border-primary ring-1 ring-primary"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        } transition-all`}
      >
        <div className="flex items-center gap-2 truncate">
          <User size={16} className={selectedClient ? "text-primary" : "text-gray-400"} />
          <span className={`truncate font-medium ${selectedClient ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
            {selectedClientObj ? `${selectedClientObj.name || selectedClientObj.nome} ${selectedClientObj.nif ? `(NIF: ${selectedClientObj.nif})` : ""}` : "-- Cliente ao Balcão --"}
          </span>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              autoFocus
              placeholder="Pesquisar por nome, NIF ou telefone..."
              className="w-full bg-transparent border-none focus:outline-none text-sm text-gray-900 dark:text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            <div
              className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                !selectedClient ? "bg-primary/5 text-primary font-medium" : "text-gray-700 dark:text-gray-300"
              }`}
              onClick={() => {
                onChange("");
                setIsOpen(false);
                setSearchTerm("");
              }}
            >
              <span>-- Cliente ao Balcão --</span>
              {!selectedClient && <Check size={16} />}
            </div>
            {filteredClients.map((c) => (
              <div
                key={c.id}
                className={`px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between border-t border-gray-50 dark:border-gray-700/50 ${
                  String(c.id) === String(selectedClient) ? "bg-primary/5 text-primary font-medium" : "text-gray-700 dark:text-gray-300"
                }`}
                onClick={() => {
                  onChange(String(c.id));
                  setIsOpen(false);
                  setSearchTerm("");
                }}
              >
                <div className="flex flex-col">
                  <span>{c.name || c.nome}</span>
                  {(c.nif || c.telefone) && (
                    <span className="text-xs text-gray-500">
                      {c.nif ? `NIF: ${c.nif} ` : ""}
                      {c.telefone ? `Tel: ${c.telefone}` : ""}
                    </span>
                  )}
                </div>
                {String(c.id) === String(selectedClient) && <Check size={16} />}
              </div>
            ))}
            {filteredClients.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                Nenhum cliente encontrado.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

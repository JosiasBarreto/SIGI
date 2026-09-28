import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, AlertCircle, Ban, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { toast } from "react-toastify";

export interface SearchableSelectOption {
  id: string | number;
  label: string;
  sublabel?: string;
  disabled?: boolean;
  disabledReason?: string;
  stock?: number;
  unidade?: string;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione..."
}: {
  options: SearchableSelectOption[];
  value: string | number;
  onChange: (val: string | number) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = options.find((o) => String(o.id) === String(value));
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()) ||
    (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div ref={wrapperRef} className={cn("relative w-full", isOpen ? "z-50" : "z-10")}>
      <div
        className={cn(
          "w-full bg-white dark:bg-gray-900 border px-3 py-2 rounded-xl text-xs font-bold cursor-pointer flex justify-between items-center shadow-sm h-[38px] transition-all",
          selectedOpt?.disabled
            ? "border-rose-300 dark:border-rose-900/60 bg-rose-50/30"
            : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate flex items-center gap-1.5">
          {selectedOpt ? (
            <>
              <span className={selectedOpt.disabled ? "text-rose-600 line-through opacity-70" : ""}>
                {selectedOpt.label}
              </span>
              {selectedOpt.disabled && (
                <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                  Esgotado
                </span>
              )}
            </>
          ) : (
            <span className="text-gray-400 font-medium">{placeholder}</span>
          )}
        </span>
        <ChevronDown size={14} className={cn("text-gray-400 shrink-0 ml-2 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div
          className="absolute z-50 top-full mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl flex flex-col overflow-hidden max-h-[280px]"
        >
          <div className="p-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
            <input
              type="text"
              autoFocus
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs rounded-lg outline-none focus:border-primary text-gray-900 dark:text-gray-100"
              placeholder="Pesquisar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="overflow-y-auto p-1 flex-1 divide-y divide-gray-50 dark:divide-gray-800/40">
            {filtered.length === 0 ? (
              <div className="text-xs text-gray-400 p-4 text-center">Nenhum resultado encontrado</div>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(opt.id) === String(value);
                const isDisabled = !!opt.disabled;

                return (
                  <div
                    key={opt.id}
                    title={isDisabled ? (opt.disabledReason || "Artigo esgotado no armazém") : undefined}
                    className={cn(
                      "px-3 py-2.5 text-xs rounded-lg flex items-center justify-between gap-2 transition-colors select-none",
                      isDisabled
                        ? "opacity-50 cursor-not-allowed bg-gray-50/60 dark:bg-gray-900/60 text-gray-400"
                        : isSelected
                        ? "bg-primary/10 text-primary font-bold cursor-pointer"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 cursor-pointer"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isDisabled) {
                        toast.warn(
                          opt.disabledReason || "Este artigo está sem stock disponível no armazém e não pode ser requisitado."
                        );
                        return;
                      }
                      onChange(opt.id);
                      setIsOpen(false);
                      setSearch("");
                    }}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className={cn("truncate font-medium", isDisabled && "line-through")}>
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <span className="text-[10px] text-gray-400 truncate">
                          {opt.sublabel}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isDisabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                          <Ban size={10} />
                          Sem Stock
                        </span>
                      ) : opt.stock !== undefined ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                          {opt.stock} {opt.unidade || "un"}
                        </span>
                      ) : null}

                      {isSelected && !isDisabled && (
                        <Check size={14} className="text-primary ml-1 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

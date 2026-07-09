import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Selecione..."
}: {
  options: { id: string | number; label: string }[];
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
  const filtered = options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={wrapperRef} className={cn("relative w-full", isOpen ? "z-50" : "z-10")}>
      <div
        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer flex justify-between items-center shadow-sm h-[38px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOpt ? selectedOpt.label : placeholder}</span>
        <ChevronDown size={14} className="text-gray-400 shrink-0 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute z-50 bottom-full mb-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg flex flex-col" style={{ maxHeight: "250px" }}>
          <div className="p-2 border-b border-gray-100 dark:border-gray-800">
            <input
              type="text"
              autoFocus
              className="w-full bg-gray-50 dark:bg-gray-800 border-none px-3 py-1.5 text-xs rounded-lg outline-none"
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto p-1 flex-1">
            {filtered.length === 0 ? (
              <div className="text-xs text-gray-500 p-3 text-center">Nenhum resultado</div>
            ) : (
              filtered.map((opt) => (
                <div
                  key={opt.id}
                  className={cn(
                    "px-3 py-2.5 text-xs rounded-lg cursor-pointer transition-colors",
                    String(opt.id) === String(value)
                      ? "bg-primary/10 text-primary font-bold"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  )}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

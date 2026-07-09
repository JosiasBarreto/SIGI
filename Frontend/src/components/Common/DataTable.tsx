import React, { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnDef,
  flexRender,
  PaginationState,
} from "@tanstack/react-table";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Plus,
} from "lucide-react";

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, any>[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onClearFilters?: () => void;
  renderFilters?: () => React.ReactNode;
  // Status Filter Props
  statusFilter?: 'all' | 'active' | 'inactive';
  onStatusFilterChange?: (status: 'all' | 'active' | 'inactive') => void;
  showStatusFilter?: boolean;
  // Manual Pagination & Search Props
  manualPagination?: boolean;
  pageCount?: number;
  paginationState?: PaginationState;
  onPaginationChange?: (updater: any) => void;
  onSearchChange?: (value: string) => void;
  searchValue?: string;
  storageKey?: string;
  addFunction?: () => void;
}

// Debounced input for search
function DebouncedInput({
  value: initialValue,
  onChange,
  debounce = 300,
  ...props
}: {
  value: string | number;
  onChange: (value: string | number) => void;
  debounce?: number;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      onChange(value);
    }, debounce);

    return () => clearTimeout(timeout);
  }, [value, debounce]); // exclude onChange to prevent infinite resets

  return (
    <input
      {...props}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

export function DataTable<TData>({
  data,
  columns,
  isLoading = false,
  searchPlaceholder = "Pesquisar...",
  emptyMessage = "Nenhum registo encontrado.",
  onClearFilters,
  renderFilters,
  statusFilter,
  onStatusFilterChange,
  showStatusFilter,
  manualPagination,
  pageCount,
  paginationState,
  onPaginationChange,
  onSearchChange,
  searchValue,
  storageKey,
  addFunction,
}: DataTableProps<TData>) {
  const sortingKey = storageKey ? `dataTable_sorting_${storageKey}` : "dataTable_sorting";
  const paginationKey = storageKey ? `dataTable_pagination_${storageKey}` : "dataTable_pagination";
  const safeData = data ?? [];
  const [sorting, setSorting] = useState<SortingState>(() => {
    const saved = localStorage.getItem(sortingKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  
  const [internalGlobalFilter, setInternalGlobalFilter] = useState("");
  const [internalPagination, setInternalPagination] = useState<PaginationState>(() => {
    const saved = localStorage.getItem(paginationKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          pageIndex: 0,
          pageSize: parsed.pageSize || 10,
        };
      } catch (e) {
        return { pageIndex: 0, pageSize: 10 };
      }
    }
    return { pageIndex: 0, pageSize: 10 };
  });

  // Status Filter State Integration
  const [internalStatusFilter, setInternalStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const activeStatusFilter = statusFilter !== undefined ? statusFilter : internalStatusFilter;
  const handleStatusFilterChange = onStatusFilterChange !== undefined ? onStatusFilterChange : setInternalStatusFilter;

  const hasStatusField = React.useMemo(() => {
    if (showStatusFilter !== undefined) return showStatusFilter;
    if (!safeData || safeData.length === 0) return false;
    return safeData.slice(0, 10).some((item: any) => 
      item && (
        item.ativo !== undefined || 
        item.is_active !== undefined || 
        item.status !== undefined
      )
    );
  }, [safeData, showStatusFilter]);

  const filteredData = React.useMemo(() => {
    if (activeStatusFilter === 'all') return safeData;
    return safeData.filter((item: any) => {
      const isActive = item.ativo !== undefined 
        ? item.ativo 
        : (item.is_active !== undefined 
            ? item.is_active 
            : (item.status !== undefined ? (item.status === 'Ativo' || item.status === 'Active' || item.status === 'true' || item.status === true) : true));
      
      const isActiveBool = isActive === true || isActive === 'true' || isActive === 1 || isActive === 'Ativo' || isActive === 'Active';
      
      if (activeStatusFilter === 'active') {
        return isActiveBool;
      }
      if (activeStatusFilter === 'inactive') {
        return !isActiveBool;
      }
      return true;
    });
  }, [data, activeStatusFilter]);

  const isControlledSearch = onSearchChange !== undefined;
  const globalFilter = isControlledSearch ? searchValue : internalGlobalFilter;
  const handleGlobalFilterChange = isControlledSearch ? onSearchChange : setInternalGlobalFilter;

  const isControlledPagination = manualPagination && onPaginationChange;
  const pagination = isControlledPagination ? paginationState! : internalPagination;
  const handlePaginationChange = isControlledPagination ? onPaginationChange : setInternalPagination;

  useEffect(() => {
    localStorage.setItem(sortingKey, JSON.stringify(sorting));
  }, [sorting, sortingKey]);

  useEffect(() => {
    if (!isControlledPagination) {
      localStorage.setItem(
        paginationKey,
        JSON.stringify({ pageSize: internalPagination.pageSize })
      );
    }
  }, [internalPagination.pageSize, isControlledPagination, paginationKey]);

  const table = useReactTable({
    data: filteredData,
    columns,
    pageCount: manualPagination ? pageCount : undefined,
    state: {
      sorting,
      globalFilter,
      pagination,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: handleGlobalFilterChange,
    onPaginationChange: handlePaginationChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination,
    autoResetPageIndex: !manualPagination,
  });

  const exportCSV = () => {
    // Captura os cabeçalhos visíveis
    const headers = table
      .getAllLeafColumns()
      .map((col) => col.columnDef.header || col.id) // usa header se existir
      .join(",");
  
    // Captura as linhas visíveis
    const rows = table.getRowModel().rows
      .map((row) =>
        row
          .getVisibleCells()
          .map((cell) => {
            const value = cell.getValue();
            // Escapa aspas duplas e vírgulas
            const safeValue = value !== undefined && value !== null
              ? String(value).replace(/"/g, '""')
              : "";
            return `"${safeValue}"`;
          })
          .join(",")
      )
      .join("\n");
  
    // Adiciona BOM para compatibilidade com Excel
    const csvContent = "\uFEFF" + headers + "\n" + rows;
  
    // Cria o arquivo para download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-surface dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md w-full">
          <DebouncedInput
            value={globalFilter ?? ""}
            onChange={(value) => handleGlobalFilterChange(String(value))}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-900 dark:text-gray-100 transition-all"
            placeholder={searchPlaceholder}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {addFunction && (
            <button
              onClick={addFunction}
              className="px-3 py-2 text-sm text-white bg-primary hover:bg-primary-dark rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              {'Novo Registo'}
            </button>
          )}

          {hasStatusField && (
            <div className="flex border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => handleStatusFilterChange('all')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeStatusFilter === 'all'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('active')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeStatusFilter === 'active'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Ativos
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange('inactive')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  activeStatusFilter === 'inactive'
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                Inativos
              </button>
            </div>
          )}

          {renderFilters && renderFilters()}
          {onClearFilters && (
            <button
              onClick={() => {
                handleGlobalFilterChange("");
                handleStatusFilterChange("all");
                onClearFilters();
              }}
              className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
            >
              Limpar Filtros
            </button>
          )}
          <button
            onClick={exportCSV}
            title="Exportar CSV"
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <FileSpreadsheet size={18} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[600px] relative">
        <table className="w-full text-left text-sm whitespace-nowrap table-hover">
          <thead className="bg-gray-50 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 font-medium sticky top-0 z-10 shadow-sm backdrop-blur-sm ">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className="px-6 py-4"
                      colSpan={header.colSpan}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          className={`flex items-center gap-2 ${
                            header.column.getCanSort()
                              ? "cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition"
                              : ""
                          }`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() &&
                            ({
                              asc: <ArrowUp size={15} />,
                              desc: <ArrowDown size={15} />,
                            }[header.column.getIsSorted() as string] ?? (
                              <ArrowUpDown size={15} className="opacity-40" />
                            ))}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex justify-center mb-3">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="animate-pulse">A carregar dados...</p>
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center">
                    <p className="mb-4">{emptyMessage}</p>
                    {onClearFilters && (
                      <button
                        onClick={() => {
                          handleGlobalFilterChange("");
                          handleStatusFilterChange("all");
                          onClearFilters();
                        }}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                      >
                        Limpar todos os filtros
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50/80 dark:hover:bg-gray-800/60 transition-all duration-200 group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span>Mostrar</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md outline-none focus:ring-1 focus:ring-primary/50 text-gray-900 dark:text-gray-100"
          >
            {[10, 25, 50, 100, 200].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
          <span>registos</span>
        </div>

        <div>
          Mostrando{" "}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}
          </span>{" "}
          –{" "}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {manualPagination && pageCount !== undefined
              ? Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getState().pagination.pageSize * pageCount
                )
              : Math.min(
                  (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length
                )}
          </span>{" "}
          {manualPagination ? "" : (
            <>
              de{" "}
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {table.getFilteredRowModel().rows.length}
              </span>{" "}
            </>
          )}
          registos
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-1 text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
            title="Primeira Página"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1 px-2 text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
            title="Página Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="px-2 font-medium text-gray-700 dark:text-gray-300">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount() === 0 ? 1 : table.getPageCount()}
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1 px-2 text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
            title="Próxima Página"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-1 text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition"
            title="Última Página"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

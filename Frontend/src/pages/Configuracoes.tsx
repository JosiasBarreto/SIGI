import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Settings,
  Save,
  Building,
  Mail,
  Phone,
  Globe,
  Award,
  FileText,
  Printer,
  HardDriveDownload,
  RefreshCw,
  CheckCircle,
  Trash2,
  UploadCloud,
  AlertCircle,
  Percent,
  Plus,
  Download,
  RotateCcw,
  Clock,
  Code2,
  Info,
  Search,
  Layers,
  Ruler,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTheme } from "../components/Layout/ThemeContext";
import { Palette } from "lucide-react";
import { configService, fiscalService, productService, backupService, BackupItemDTO } from "../services";
import apiClient from "../api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import PainelSobre from "./Configuracoes/PainerSobre";


interface BackupItem {
  id: string;
  filename: string;
  date: string;
  size: string;
  type: "Manual" | "Automático";
}

/**
 * Componente Reutilizável de Paginação para Tabelas de Configuração
 */
function TablePagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
  onPerPageChange,
  itemName = "itens",
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  itemName?: string;
}) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 text-xs">
      <div className="flex flex-wrap items-center gap-3 text-gray-500 dark:text-gray-400">
        <span>
          A mostrar <strong className="text-gray-800 dark:text-gray-200">{startItem}</strong> a{" "}
          <strong className="text-gray-800 dark:text-gray-200">{endItem}</strong> de{" "}
          <strong className="text-gray-800 dark:text-gray-200">{totalItems}</strong> {itemName}
        </span>
        {onPerPageChange && (
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-[11px] text-gray-400">Por pág:</span>
            <select
              value={perPage}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md font-semibold text-gray-700 dark:text-gray-200 outline-none text-xs cursor-pointer shadow-xs"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer flex items-center gap-1"
        >
          <ChevronLeft size={13} />
          <span>Anterior</span>
        </button>
        <span className="font-medium text-gray-600 dark:text-gray-300 px-1">
          Página {currentPage} de {Math.max(1, totalPages)}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer flex items-center gap-1"
        >
          <span>Próximo</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

function IvaSettings() {
  const queryClient = useQueryClient();
  const [editingRate, setEditingRate] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery({
    queryKey: ["iva_rates", page, perPage],
    queryFn: () => fiscalService.getIvaRates({ page, per_page: perPage }),
  });

  const rawRates: any[] = useMemo(() => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.taxas_iva)) return response.taxas_iva;
    if (Array.isArray(response?.taxas)) return response.taxas;
    if (Array.isArray(response?.iva)) return response.iva;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.taxas_iva)) return response.data.taxas_iva;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }, [response]);

  const filteredRates = useMemo(() => {
    if (!search.trim()) return rawRates;
    const term = search.toLowerCase();
    return rawRates.filter((r: any) => {
      const desc = String(r.descricao || r.description || r.nome || "").toLowerCase();
      const perc = String(r.percentagem ?? r.taxa ?? "");
      const id = String(r.id || "");
      return desc.includes(term) || perc.includes(term) || id.includes(term);
    });
  }, [rawRates, search]);

  const total = response?.total !== undefined && !search.trim() ? response.total : filteredRates.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const rates = useMemo(() => {
    const resAny = response as any;
    if (search.trim()) {
      const start = (page - 1) * perPage;
      return filteredRates.slice(start, start + perPage);
    }
    if (resAny?.items && resAny?.total !== undefined && resAny.items.length <= perPage) {
      return resAny.items;
    }
    const start = (page - 1) * perPage;
    return filteredRates.slice(start, start + perPage);
  }, [search, filteredRates, response, page, perPage]);

  const createMutation = useMutation({
    mutationFn: (data: any) => fiscalService.createIvaRate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iva_rates"] });
      toast.success("Taxa de IVA criada com sucesso");
    },
    onError: () => {
      toast.error("Erro ao criar taxa de IVA");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      fiscalService.updateIvaRate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iva_rates"] });
      toast.success("Taxa de IVA atualizada com sucesso");
      setEditingRate(null);
    },
    onError: () => {
      toast.error("Erro ao atualizar taxa de IVA");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string | number) => fiscalService.toggleIvaStatus(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["iva_rates"] });
      toast.success(data?.msg || "Estado da taxa alterado");
    },
    onError: () => {
      toast.error("Erro ao alterar estado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => fiscalService.deleteIvaRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["iva_rates"] });
      toast.success("Taxa de IVA eliminada");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao eliminar taxa");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      descricao: formData.get("descricao"),
      percentagem: Number(formData.get("percentagem")),
      ativo: formData.has("ativo"),
    };

    if (editingRate) {
      updateMutation.mutate({ id: editingRate.id, data });
    } else {
      createMutation.mutate(data);
    }
    e.currentTarget.reset();
  };

  const handleEdit = (rate: any) => {
    setEditingRate(rate);
  };

  const handleCancelEdit = () => {
    setEditingRate(null);
  };

  const handleDelete = (rate: any) => {
    const desc = rate.descricao || `ID ${rate.id}`;
    if (window.confirm(`Tem a certeza que deseja eliminar a taxa de IVA "${desc}"?`)) {
      deleteMutation.mutate(rate.id);
    }
  };
  
  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="p-6 md:w-1/3 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          {editingRate ? (
            <>
              <Plus size={16} className="text-primary" /> Editar Taxa de IVA
            </>
          ) : (
            <>
              <Plus size={16} className="text-primary" /> Nova Taxa de IVA
            </>
          )}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Descrição Completa
            </label>
            <input
              type="text"
              name="descricao"
              defaultValue={editingRate?.descricao || editingRate?.description || ""}
              placeholder="Ex: IVA Normal 15%"
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Percentagem (%)
            </label>
            <input
              type="number"
              name="percentagem"
              defaultValue={editingRate?.percentagem ?? editingRate?.taxa ?? ""}
              placeholder="Ex: 15"
              step="0.01"
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="ativo"
              id="iva_ativo"
              defaultChecked={editingRate ? (editingRate.ativo ?? editingRate.is_active ?? true) : true}
              className="w-4 h-4 text-primary rounded focus:ring-primary/50"
            />
            <label
              htmlFor="iva_ativo"
              className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer"
            >
              Ativa no sistema
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "A guardar..."
                : "Guardar Taxa"}
            </button>
            {editingRate && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="p-0 md:w-2/3 flex flex-col justify-between">
        <div>
          {/* Barra de Pesquisa */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 bg-gray-50/40 dark:bg-gray-800/20">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Pesquisar taxas de IVA..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
              {total} {total === 1 ? "taxa" : "taxas"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Descrição Completa</th>
                  <th className="p-4">Percentagem</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                      A carregar taxas de IVA...
                    </td>
                  </tr>
                ) : rates && rates.length > 0 ? (
                  rates.map((rate: any) => {
                    const isAtivo = rate.ativo ?? rate.is_active ?? true;
                    const desc = rate.descricao || rate.description || rate.nome || "-";
                    const perc = Number(rate.percentagem ?? rate.percentage ?? rate.taxa ?? 0);
                    return (
                      <tr
                        key={rate.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="p-4 text-xs font-mono text-gray-500">
                          {rate.id}
                        </td>
                        <td className="p-4 font-semibold text-gray-900 dark:text-white max-w-xs break-words whitespace-normal">
                          {desc}
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300 font-bold">
                          {perc}%
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-1 text-[10px] font-bold rounded-full ${
                              isAtivo
                                ? "bg-success/10 text-success"
                                : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                            }`}
                          >
                            {isAtivo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(rate)}
                              className="text-xs font-bold text-primary hover:text-primary/80 cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => toggleMutation.mutate(rate.id)}
                              disabled={toggleMutation.isPending}
                              className={`text-xs font-bold cursor-pointer ${
                                isAtivo
                                  ? "text-amber-500 hover:text-amber-600"
                                  : "text-green-500 hover:text-green-600"
                              }`}
                            >
                              {isAtivo ? "Desativar" : "Ativar"}
                            </button>
                            <button
                              onClick={() => handleDelete(rate)}
                              className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer ml-1"
                              title="Eliminar taxa"
                            >
                              <Trash2 size={13} className="inline" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      Nenhuma taxa de IVA encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {total > 0 && (
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
            itemName="taxas de IVA"
          />
        )}
      </div>
    </div>
  );
}

function CategoriasSettings() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery({
    queryKey: ["categorias", page, perPage],
    queryFn: () => productService.getCategorias({ page, per_page: perPage }),
  });

  const rawItems: any[] = useMemo(() => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.categorias)) return response.categorias;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.categorias)) return response.data.categorias;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }, [response]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return rawItems;
    const term = search.toLowerCase();
    return rawItems.filter((item: any) => {
      const nome = String(item.nome || item.name || "").toLowerCase();
      const desc = String(item.descricao || item.description || "").toLowerCase();
      const id = String(item.id || "");
      return nome.includes(term) || desc.includes(term) || id.includes(term);
    });
  }, [rawItems, search]);

  const total = response?.total !== undefined && !search.trim() ? response.total : filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const items = useMemo(() => {
    const resAny = response as any;
    if (search.trim()) {
      const start = (page - 1) * perPage;
      return filteredItems.slice(start, start + perPage);
    }
    if (resAny?.items && resAny?.total !== undefined && resAny.items.length <= perPage) {
      return resAny.items;
    }
    const start = (page - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [search, filteredItems, response, page, perPage]);

  const createMutation = useMutation({
    mutationFn: (data: any) => productService.createCategoria(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria criada com sucesso");
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      productService.updateCategoria(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria atualizada com sucesso");
      setEditingItem(null);
    },
    onError: () => toast.error("Erro ao atualizar categoria"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => productService.deleteCategoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoria eliminada com sucesso");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao eliminar categoria");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      descricao: formData.get("descricao"),
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
    e.currentTarget.reset();
  };

  const handleDelete = (item: any) => {
    const nome = item.nome || item.name || `ID ${item.id}`;
    if (window.confirm(`Tem a certeza que deseja eliminar a categoria "${nome}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="p-6 md:w-1/3 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          {editingItem ? (
            <>
              <Plus size={16} className="text-primary" /> Editar Categoria
            </>
          ) : (
            <>
              <Plus size={16} className="text-primary" /> Nova Categoria
            </>
          )}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Nome da Categoria
            </label>
            <input
              type="text"
              name="nome"
              defaultValue={editingItem?.nome || editingItem?.name || ""}
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Descrição Completa
            </label>
            <textarea
              name="descricao"
              defaultValue={editingItem?.descricao || editingItem?.description || ""}
              rows={4}
              placeholder="Descreva detalhadamente a categoria..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "A guardar..."
                : "Guardar"}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="p-0 md:w-2/3 flex flex-col justify-between">
        <div>
          {/* Barra de Pesquisa */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 bg-gray-50/40 dark:bg-gray-800/20">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Pesquisar categorias por nome ou descrição..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
              {total} {total === 1 ? "categoria" : "categorias"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Descrição Completa</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                      A carregar categorias...
                    </td>
                  </tr>
                ) : items && items.length > 0 ? (
                  items.map((item: any) => {
                    const nome = item.nome || item.name || "-";
                    const desc = item.descricao || item.description;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="p-4 text-xs font-mono text-gray-500">
                          {item.id}
                        </td>
                        <td className="p-4 font-semibold text-gray-900 dark:text-white">
                          {nome}
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300 max-w-md break-words whitespace-normal text-xs">
                          {desc ? (
                            <span>{desc}</span>
                          ) : (
                            <span className="text-gray-400 italic">Sem descrição</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="text-xs font-bold text-primary hover:text-primary/80 cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer ml-1"
                              title="Eliminar categoria"
                            >
                              <Trash2 size={13} className="inline" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500">
                      Nenhuma categoria encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {total > 0 && (
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
            itemName="categorias"
          />
        )}
      </div>
    </div>
  );
}

function UnidadesSettings() {
  const queryClient = useQueryClient();
  const [editingItem, setEditingItem] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");

  const { data: response, isLoading } = useQuery({
    queryKey: ["unidades_medida", page, perPage],
    queryFn: () => productService.getUnidadesMedida({ page, per_page: perPage }),
  });

  const rawItems: any[] = useMemo(() => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.items)) return response.items;
    if (Array.isArray(response?.unidades_medida)) return response.unidades_medida;
    if (Array.isArray(response?.unidades)) return response.unidades;
    if (Array.isArray(response?.data?.items)) return response.data.items;
    if (Array.isArray(response?.data?.unidades_medida)) return response.data.unidades_medida;
    if (Array.isArray(response?.data)) return response.data;
    return [];
  }, [response]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return rawItems;
    const term = search.toLowerCase();
    return rawItems.filter((item: any) => {
      const nome = String(item.nome || item.name || "").toLowerCase();
      const sigla = String(item.sigla || item.symbol || item.code || "").toLowerCase();
      const desc = String(item.descricao || item.description || "").toLowerCase();
      const id = String(item.id || "");
      return nome.includes(term) || sigla.includes(term) || desc.includes(term) || id.includes(term);
    });
  }, [rawItems, search]);

  const total = response?.total !== undefined && !search.trim() ? response.total : filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const items = useMemo(() => {
    const resAny = response as any;
    if (search.trim()) {
      const start = (page - 1) * perPage;
      return filteredItems.slice(start, start + perPage);
    }
    if (resAny?.items && resAny?.total !== undefined && resAny.items.length <= perPage) {
      return resAny.items;
    }
    const start = (page - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }, [search, filteredItems, response, page, perPage]);

  const createMutation = useMutation({
    mutationFn: (data: any) => productService.createUnidadeMedida(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades_medida"] });
      toast.success("Unidade de medida criada com sucesso");
    },
    onError: () => toast.error("Erro ao criar unidade de medida"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      productService.updateUnidadeMedida(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades_medida"] });
      toast.success("Unidade de medida atualizada com sucesso");
      setEditingItem(null);
    },
    onError: () => toast.error("Erro ao atualizar unidade de medida"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => productService.deleteUnidadeMedida(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades_medida"] });
      toast.success("Unidade de medida eliminada com sucesso");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao eliminar unidade de medida");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nome: formData.get("nome"),
      sigla: formData.get("sigla"),
      descricao: formData.get("descricao"),
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data });
    } else {
      createMutation.mutate(data);
    }
    e.currentTarget.reset();
  };

  const handleDelete = (item: any) => {
    const nome = item.nome || item.name || `ID ${item.id}`;
    if (window.confirm(`Tem a certeza que deseja eliminar a unidade de medida "${nome}"?`)) {
      deleteMutation.mutate(item.id);
    }
  };

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row">
      <div className="p-6 md:w-1/3 border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          {editingItem ? (
            <>
              <Plus size={16} className="text-primary" /> Editar Unidade
            </>
          ) : (
            <>
              <Plus size={16} className="text-primary" /> Nova Unidade
            </>
          )}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Nome da Unidade
            </label>
            <input
              type="text"
              name="nome"
              defaultValue={editingItem?.nome || editingItem?.name || ""}
              placeholder="Ex: Quilograma"
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Sigla / Símbolo
            </label>
            <input
              type="text"
              name="sigla"
              defaultValue={editingItem?.sigla || editingItem?.symbol || editingItem?.code || ""}
              placeholder="Ex: Kg, Un, Lt"
              required
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Descrição Completa
            </label>
            <textarea
              name="descricao"
              defaultValue={editingItem?.descricao || editingItem?.description || ""}
              rows={3}
              placeholder="Detalhes ou conversão da unidade..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "A guardar..."
                : "Guardar"}
            </button>
            {editingItem && (
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
      <div className="p-0 md:w-2/3 flex flex-col justify-between">
        <div>
          {/* Barra de Pesquisa */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 bg-gray-50/40 dark:bg-gray-800/20">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Pesquisar unidades por nome ou sigla..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
              {total} {total === 1 ? "unidade" : "unidades"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-500 border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Nome</th>
                  <th className="p-4">Sigla</th>
                  <th className="p-4">Descrição Completa</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      <RefreshCw className="animate-spin inline-block mr-2" size={16} />
                      A carregar unidades...
                    </td>
                  </tr>
                ) : items && items.length > 0 ? (
                  items.map((item: any) => {
                    const nome = item.nome || item.name || "-";
                    const sigla = item.sigla || item.symbol || item.code || "-";
                    const desc = item.descricao || item.description;
                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="p-4 text-xs font-mono text-gray-500">
                          {item.id}
                        </td>
                        <td className="p-4 font-semibold text-gray-900 dark:text-white">
                          {nome}
                        </td>
                        <td className="p-4 font-bold text-primary dark:text-primary-light">
                          {sigla}
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300 max-w-md break-words whitespace-normal text-xs">
                          {desc ? (
                            <span>{desc}</span>
                          ) : (
                            <span className="text-gray-400 italic">Sem descrição</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="text-xs font-bold text-primary hover:text-primary/80 cursor-pointer"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer ml-1"
                              title="Eliminar unidade"
                            >
                              <Trash2 size={13} className="inline" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      Nenhuma unidade encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {total > 0 && (
          <TablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            perPage={perPage}
            onPageChange={setPage}
            onPerPageChange={(newPerPage) => {
              setPerPage(newPerPage);
              setPage(1);
            }}
            itemName="unidades de medida"
          />
        )}
      </div>
    </div>
  );
}

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const { palette, setPalette } = useTheme();
  const [activeTab, setActiveTab] = useState<
    "geral" | "backup" | "iva" | "categorias" | "unidades" | "sobre"
  >("geral");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    id: "",
    empresa: "",
    nif: "",
    email: "",
    telefone: "",
    morada: "",
    website: "",
    certificado: "",
    licenca_aplicacao: "",
    moeda: "",
    formato_impressao: "",
    impressaoAuto: true,
    backupAuto: true,
    numVias: 2,
    taxaIva: 15,
    logotipo: "",
    utiliza_iva: true,
    numero_whatsapp: "",
    telemoveis: "",
  });

  // Estados para Gestão do Módulo de Backup Real do Backend
  const [allBackups, setAllBackups] = useState<BackupItemDTO[]>([]);
  const [loadingBackups, setLoadingBackups] = useState<boolean>(false);
  const [creatingBackup, setCreatingBackup] = useState<boolean>(false);
  const [restoringFilename, setRestoringFilename] = useState<string | null>(null);
  const [uploadingRestore, setUploadingRestore] = useState<boolean>(false);
  const [backupPage, setBackupPage] = useState(1);
  const [backupPerPage, setBackupPerPage] = useState(10);
  const [backupSearch, setBackupSearch] = useState("");

  const loadBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const response: any = await backupService.getAll();
      const list: BackupItemDTO[] = Array.isArray(response)
        ? response
        : Array.isArray(response?.items)
        ? response.items
        : Array.isArray(response?.data?.items)
        ? response.data.items
        : Array.isArray(response?.data)
        ? response.data
        : [];
      setAllBackups(list);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao carregar ficheiros de backup do servidor.");
    } finally {
      setLoadingBackups(false);
    }
  }, []);

  const filteredBackups = useMemo(() => {
    if (!backupSearch.trim()) return allBackups;
    const term = backupSearch.toLowerCase();
    return allBackups.filter((b) => {
      const fn = String(b.filename || "").toLowerCase();
      const dt = String(b.date || b.created_at || "").toLowerCase();
      const tp = String(b.type || "").toLowerCase();
      return fn.includes(term) || dt.includes(term) || tp.includes(term);
    });
  }, [allBackups, backupSearch]);

  const totalBackupPages = Math.max(1, Math.ceil(filteredBackups.length / backupPerPage));
  const backups = useMemo(() => {
    const startIndex = (backupPage - 1) * backupPerPage;
    return filteredBackups.slice(startIndex, startIndex + backupPerPage);
  }, [filteredBackups, backupPage, backupPerPage]);

  useEffect(() => {
    if (activeTab === "backup") {
      loadBackups();
    }
  }, [activeTab, loadBackups]);

  const themes = [
    { key: "default", label: "Laranja", color: "#FF6B00" },
    { key: "theme-green", label: "Verde", color: "#16A34A" },
    { key: "theme-blue", label: "Azul", color: "#2563EB" },
    { key: "theme-purple", label: "Roxo", color: "#7C3AED" },
    { key: "theme-pink", label: "Rosa", color: "#EC4899" },
    { key: "theme-cyan", label: "Ciano", color: "#0891B2" },
    { key: "theme-red", label: "Vermelho", color: "#DC2626" },
    { key: "theme-yellow", label: "Amarelo", color: "#EAB308" },
    { key: "theme-amber", label: "Âmbar", color: "#D97706" },
    { key: "theme-lime", label: "Lima", color: "#65A30D" },
    { key: "theme-indigo", label: "Índigo", color: "#4F46E5" },
    { key: "theme-turquoise", label: "Turquesa", color: "#14B8A6" },
    { key: "theme-coffee", label: "Café", color: "#6F4E37" },
    { key: "theme-brown", label: "Castanho", color: "#8B5E3C" },
    { key: "theme-black", label: "Preto", color: "#1F2937" },
  ];

  useEffect(() => {
    async function loadConfig() {
      try {
        const data = await configService.get();
        if (data) {
          setFormData((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        toast.error("Erro ao carregar configurações do servidor.");
      } finally {
        setFetching(false);
      }
    }
    loadConfig();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logotipo: reader.result as string }));
        toast.info(
          "Logótipo carregado. Não se esqueça de guardar as alterações!"
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await configService.update(formData);
      toast.success("Configurações persistidas e sincronizadas com sucesso!");
    } catch (error) {
      toast.error("Erro ao persistir configurações da empresa.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Criar novo snapshot de backup no servidor
  const triggerManualBackup = async () => {
    setCreatingBackup(true);
    try {
      await backupService.create();
      toast.success("Snapshot .sql criado com sucesso no servidor!");
      await loadBackups();
    } catch (error: any) {
      toast.error(error?.message || "Falha ao criar o snapshot de backup no servidor.");
    } finally {
      setCreatingBackup(false);
    }
  };

  // 2. Descarregar o ficheiro .sql para o computador
  const handleDownloadBackup = async (filename: string) => {
    try {
      await backupService.download(filename);
      toast.info(`A iniciar descarregamento de "${filename}"...`);
    } catch (error: any) {
      toast.error(error?.message || "Erro ao descarregar o ficheiro .sql.");
    }
  };

  // 3. Restaurar a base de dados a partir de um snapshot existente no servidor
  const handleRestoreServerBackup = async (filename: string) => {
    const confirm = window.confirm(
      `Aviso Crítico: Tem a certeza que pretende restaurar a base de dados a partir do ficheiro "${filename}"? Todos os dados atuais do servidor serão substituídos.`
    );
    if (!confirm) return;

    setRestoringFilename(filename);
    try {
      await backupService.restoreServerFile(filename);
      toast.success("Base de dados restaurada com sucesso a partir do snapshot do servidor!");
      await loadBackups();
    } catch (error: any) {
      toast.error(error?.message || `Não foi possível restaurar a base de dados a partir de "${filename}".`);
    } finally {
      setRestoringFilename(null);
    }
  };

  // 4. Restaurar a base de dados via upload de ficheiro .sql local
  const handleRestoreUploadFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.sql')) {
      toast.error("Por favor selecione um ficheiro com extensão .sql válida.");
      return;
    }

    const confirm = window.confirm(
      `Aviso Crítico: Pretende carregar e restaurar a base de dados a partir do ficheiro local "${file.name}"? Esta ação substituirá a base de dados do servidor.`
    );
    if (!confirm) return;

    setUploadingRestore(true);
    try {
      await backupService.restoreUpload(file);
      toast.success("Base de dados restaurada com sucesso através do ficheiro enviado!");
      await loadBackups();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao restaurar a base de dados a partir do ficheiro enviado.");
    } finally {
      setUploadingRestore(false);
    }
  };

  // 5. Eliminar ficheiro de backup do servidor
  const handleDeleteBackup = async (filename: string) => {
    const confirm = window.confirm(`Tem a certeza que deseja eliminar o ficheiro de backup "${filename}" do servidor?`);
    if (!confirm) return;

    try {
      await backupService.delete(filename);
      toast.success(`Ficheiro de backup "${filename}" eliminado do servidor.`);
      setAllBackups((prev) => prev.filter((b) => b.filename !== filename));
    } catch (error: any) {
      toast.error(error?.message || "Erro ao eliminar o ficheiro de backup do servidor.");
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="animate-spin text-primary" size={32} />
        <p className="text-xs text-gray-500">
          A obter configurações gerais da Sabor Imbatível...
        </p>
      </div>
    );
  }

  return (
    <div
      className="space-y-6 pb-12 animate-fade-in text-gray-800 dark:text-gray-100"
      id="configuracoes-root"
    >
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-105 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="text-primary" /> Painel Geral de Configurações
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Configure o perfil corporativo, parâmetros de impostos, moedas de
            faturação, vias de impressão e cópias de segurança.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === "geral" && (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1 px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow transition-all"
            >
              <Save size={15} />{" "}
              {loading ? "A Guardar..." : "Guardar Alterações"}
            </button>
          )}
          {activeTab === "backup" && (
            <button
              onClick={triggerManualBackup}
              disabled={loading || creatingBackup}
              className="flex items-center gap-1 px-4 py-2 bg-success hover:bg-success/90 text-white text-xs font-bold rounded-lg shadow transition-all"
            >
              <HardDriveDownload size={15} />{" "}
              {creatingBackup ? "Processando..." : "Backup & Descarregar Cópia"}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800/40 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("geral")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "geral"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950 dark:hover:text-white"
          }`}
        >
          <Building size={14} /> Dados Corporativos
        </button>
        <button
          onClick={() => setActiveTab("categorias")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "categorias"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950 dark:hover:text-white"
          }`}
        >
          <Award size={14} /> Categorias
        </button>
        <button
          onClick={() => setActiveTab("unidades")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "unidades"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950 dark:hover:text-white"
          }`}
        >
          <FileText size={14} /> Unidades de Medida
        </button>
        <button
          onClick={() => setActiveTab("iva")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "iva"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950 dark:hover:text-white"
          }`}
        >
          <Percent size={14} /> Taxas de IVA
        </button>
        <button
          onClick={() => setActiveTab("backup")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "backup"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950 dark:hover:text-white"
          }`}
        >
          <HardDriveDownload size={14} /> Backup & Restauro
        </button>
        <button
          onClick={() => setActiveTab("sobre")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === "sobre"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950 dark:hover:text-white"
          }`}
        >
          <Info size={14} /> Sobre
        </button>
      </div>

      {/* Tabs Content */}
      {activeTab === "geral" && (
        <form
          onSubmit={handleSave}
          className="bg-white dark:bg-surface-dark border p-6 rounded-2xl shadow-sm space-y-8"
        >
          {/* Company Details Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2 flex items-center gap-2">
              <Building size={16} className="text-gray-400" /> Identificação e
              Dados Fiscais
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Nome Da Empresa / Razão Social *
                </label>
                <input
                  type="text"
                  name="empresa"
                  required
                  value={formData.empresa}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  NIF Geral *
                </label>
                <input
                  type="text"
                  name="nif"
                  required
                  value={formData.nif}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Licença Empresa *
                </label>
                <input
                  type="text"
                  name="certificado"
                  required
                  value={formData.certificado}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Licença Aplicação *
                </label>
                <input
                  type="text"
                  name="licenca_aplicacao"
                  required
                  value={formData.licenca_aplicacao}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Endereço de Website Sede *
                </label>
                <input
                  type="text"
                  name="website"
                  required
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          {/* Contacts Section */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2 flex items-center gap-2">
              <Phone size={16} className="text-gray-400" /> Canais de
              Comunicação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Correio Eletrónico Geral *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Telemóvel Geral *
                </label>
                <input
                  type="text"
                  name="telefone"
                  required
                  value={formData.telefone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Morada Sede *
                </label>
                <input
                  type="text"
                  name="morada"
                  required
                  value={formData.morada}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Número de WhatsApp
                </label>
                <input
                  type="text"
                  name="numero_whatsapp"
                  value={formData.numero_whatsapp}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Outros Telemóveis
                </label>
                <input
                  type="text"
                  name="telemoveis"
                  value={formData.telemoveis}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {themes.map((theme) => {
              const selected = palette === theme.key;

              return (
                <button
                  key={theme.key}
                  type="button"
                  onClick={() => setPalette(theme.key as any)}
                  style={
                    selected
                      ? {
                          borderColor: theme.color,
                          backgroundColor: `${theme.color}15`,
                          color: theme.color,
                        }
                      : {}
                  }
                  className={`
        relative
        rounded-xl
        border
        p-3
        transition-all
        duration-200
        hover:-translate-y-1
        hover:shadow-md
        flex
        flex-col
        items-center
        gap-2
        border-gray-200
        dark:border-gray-700
        bg-white
        dark:bg-gray-900
      `}
                >
                  {selected && (
                    <div
                      className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: theme.color }}
                    />
                  )}

                  <div
                    className="w-8 h-8 rounded-full shadow-sm border border-white"
                    style={{ backgroundColor: theme.color }}
                  />

                  <span
                    className={`text-xs font-medium ${
                      selected ? "" : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* App Engine and Printing Mode */}
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2 flex items-center gap-2">
              <Printer size={16} className="text-gray-400" /> Parâmetros de
              Impressão e Transação de Caixa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Moeda Principal Faturação
                </label>
                <select
                  name="moeda"
                  value={formData.moeda}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="STN">
                    Dobra de São Tomé e Príncipe (STN)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Formato de Impressão Padrão
                </label>
                <select
                  name="formato_impressao"
                  value={formData.formato_impressao}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="A4">A4 (Fatura Consolidada)</option>
                  <option value="A5">A5 (Recibo Geral)</option>
                  <option value="80mm">
                    Bobina Térmica 80mm (Talão Rápido POS)
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">
                  Nº Múltiplo Vias por Impressão
                </label>
                <input
                  type="number"
                  name="numVias"
                  min="1"
                  max="5"
                  value={formData.numVias}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="impressaoAuto"
                  name="impressaoAuto"
                  checked={formData.impressaoAuto}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary"
                />
                <label
                  htmlFor="impressaoAuto"
                  className="text-xs font-semibold select-none"
                >
                  Impressão automática após faturar no POS?
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="utiliza_iva"
                  name="utiliza_iva"
                  checked={formData.utiliza_iva}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary"
                />
                <label
                  htmlFor="utiliza_iva"
                  className="text-xs font-semibold select-none"
                >
                  Empresa sujeita a IVA (Usa IVA nas faturas?)
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="backupAuto"
                  name="backupAuto"
                  checked={formData.backupAuto}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary"
                />
                <label
                  htmlFor="backupAuto"
                  className="text-xs font-semibold select-none"
                >
                  Ativar cópias automáticas diárias?
                </label>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* IVA Tab Content */}
      {activeTab === "iva" && <IvaSettings />}

      {/* Categorias Tab Content */}
      {activeTab === "categorias" && <CategoriasSettings />}

      {/* Unidades Tab Content */}
      {activeTab === "unidades" && <UnidadesSettings />}

      {/* Backup Tab Logic */}
      {activeTab === "backup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Action Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Run Backup Area */}
            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HardDriveDownload className="text-emerald-500" size={20} />
                Gerador de Snapshot & Backup SQL
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Crie um novo ficheiro .sql com a cópia de segurança completa da base de dados (encomendas, faturas, inventário, utilizadores e definições). O ficheiro será guardado no servidor e disponibilizado para descarregamento imediato.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={triggerManualBackup}
                  disabled={creatingBackup}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={16} />
                  <span>{creatingBackup ? "A gerar snapshot .sql no servidor..." : "Criar Novo Snapshot .SQL"}</span>
                </button>

                <button
                  onClick={loadBackups}
                  disabled={loadingBackups}
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer"
                  title="Atualizar lista do servidor"
                >
                  <RefreshCw size={14} className={loadingBackups ? "animate-spin" : ""} />
                  <span>Atualizar Lista</span>
                </button>
              </div>
            </div>

            {/* List backups */}
            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-6 rounded-2xl shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-primary" />
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Histórico Real de Cópias de Segurança no Servidor
                  </h3>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <Search className="absolute left-3 top-2 text-gray-400" size={13} />
                    <input
                      type="text"
                      placeholder="Pesquisar ficheiro..."
                      value={backupSearch}
                      onChange={(e) => {
                        setBackupSearch(e.target.value);
                        setBackupPage(1);
                      }}
                      className="w-full pl-8 pr-3 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full whitespace-nowrap">
                    {filteredBackups.length} {filteredBackups.length === 1 ? "ficheiro" : "ficheiros"}
                  </span>
                </div>
              </div>

              {loadingBackups ? (
                <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                  <RefreshCw size={24} className="animate-spin text-primary" />
                  <span className="text-xs">A carregar cópias de segurança do servidor...</span>
                </div>
              ) : filteredBackups.length === 0 ? (
                <div className="p-8 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl space-y-2">
                  <HardDriveDownload size={32} className="mx-auto text-gray-300 dark:text-gray-600" />
                  <p className="text-xs font-semibold">
                    {backupSearch.trim() ? "Nenhum ficheiro corresponde à pesquisa." : "Nenhuma cópia de segurança encontrada no servidor."}
                  </p>
                  <p className="text-[11px]">Clique em "Criar Novo Snapshot .SQL" para gerar uma nova cópia.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-500">
                      <thead className="bg-gray-50 dark:bg-gray-800/50 font-bold border-b border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300">
                        <tr>
                          <th className="px-4 py-2.5">FICHEIRO .SQL</th>
                          <th className="px-4 py-2.5">DATA DO SNAPSHOT</th>
                          <th className="px-4 py-2.5">TAMANHO</th>
                          <th className="px-4 py-2.5 text-center">ORIGEM</th>
                          <th className="px-4 py-2.5 text-right">AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                        {backups.map((bk: BackupItemDTO) => (
                          <tr
                            key={bk.id || bk.filename}
                            className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition"
                          >
                            <td className="px-4 py-3 font-mono font-bold text-[11px] text-gray-900 dark:text-white break-all">
                              {bk.filename}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {bk.date || (bk.created_at ? new Date(bk.created_at).toLocaleString('pt-PT') : '-')}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {bk.formatted_size || bk.size}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  bk.type === "Automático"
                                    ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300"
                                    : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300"
                                }`}
                              >
                                {bk.type || "Manual"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleDownloadBackup(bk.filename)}
                                  className="bg-primary/10 hover:bg-primary/20 text-primary font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition cursor-pointer"
                                  title="Descarregar ficheiro .sql"
                                >
                                  <Download size={12} />
                                  <span>Download</span>
                                </button>

                                <button
                                  onClick={() => handleRestoreServerBackup(bk.filename)}
                                  disabled={restoringFilename === bk.filename}
                                  className="bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1 transition cursor-pointer"
                                  title="Restaurar a base de dados a partir desta cópia"
                                >
                                  <RotateCcw size={12} className={restoringFilename === bk.filename ? "animate-spin" : ""} />
                                  <span>{restoringFilename === bk.filename ? "A restaurar..." : "Restaurar"}</span>
                                </button>

                                <button
                                  onClick={() => handleDeleteBackup(bk.filename)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer"
                                  title="Eliminar este backup do servidor"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {filteredBackups.length > 0 && (
                    <TablePagination
                      currentPage={backupPage}
                      totalPages={totalBackupPages}
                      totalItems={filteredBackups.length}
                      perPage={backupPerPage}
                      onPageChange={setBackupPage}
                      onPerPageChange={(newPerPage) => {
                        setBackupPerPage(newPerPage);
                        setBackupPage(1);
                      }}
                      itemName="ficheiros .sql"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Restore Dropper File Area */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-6 rounded-2xl shadow-sm text-center space-y-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 justify-center">
                <UploadCloud className="text-primary hover:animate-pulse" size={20} />
                Carregar Ficheiro .SQL para Restauro
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Envie um ficheiro .sql de cópia de segurança para restaurar a base de dados do servidor.
              </p>

              <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 hover:border-primary/50 cursor-pointer p-6 rounded-xl transition text-center space-y-2">
                <UploadCloud className="mx-auto text-gray-400" size={36} />
                <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200">
                  {uploadingRestore ? "A carregar e restaurar..." : "Arraste ou selecione o ficheiro .sql"}
                </p>
                <p className="text-[9px] text-gray-400">
                  Ficheiro .sql de formato universal
                </p>
                <input
                  type="file"
                  accept=".sql"
                  disabled={uploadingRestore}
                  className="hidden"
                  id="backup-restore-input"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleRestoreUploadFile(file);
                    }
                  }}
                />
                <label
                  htmlFor="backup-restore-input"
                  className="block text-[11px] font-bold text-primary hover:underline cursor-pointer mt-1"
                >
                  Procurar ficheiro
                </label>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl flex gap-2 text-left text-[10px] text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50">
                <AlertCircle className="shrink-0 text-amber-600 dark:text-amber-400" size={16} />
                <div>
                  <span className="font-bold block">
                    Aviso Importante de Restauro:
                  </span>
                  O restauro substitui os dados atuais da base de dados do servidor. Recomenda-se criar um novo snapshot antes de proceder a um restauro.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Painel Sobre a Aplicação & Desenvolvedor */}
      {activeTab === "sobre" && <PainelSobre />}

    </div>
  );
}

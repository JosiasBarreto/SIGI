import React, { useMemo, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import * as allServices from "../../services";
import { Plus, Edit2, Trash2, Eye, Power, PackageOpen, Activity, Info } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { schemas } from "../../data/schemas";
import Modal from "../../components/Common/Modal";
import { DataTable } from "../../components/Common/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { useAuth } from "../../components/AuthContext";
import { ProductDetailsModal } from "../../components/Common/ProductDetailsModal";

export default function Consumivel() {
  const title = "Produtos";
  const moduleName = "products";
  
  const { user } = useAuth();
  const isAdmin = ["Administrador"].includes(user?.role || "");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [stockOpType, setStockOpType] = useState<"Entrada" | "Saída">(
    "Entrada"
  );
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [selectedTipo, setSelectedTipo] = useState<string>("");
  const activeTab = "Consumivel";
  const config = JSON.parse(localStorage.getItem("sigi_config") || "{}");

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(10);

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const apiAccessor = allServices.productService;

  const { data: ivaResponse } = useQuery({
    queryKey: ["iva_rates"],
    queryFn: () => allServices.fiscalService.getIvaRates(),
  });

  const { data: categoriasResponse } = useQuery({
    queryKey: ["categorias"],
    queryFn: () => allServices.productService.getCategorias(),
  });

  const { data: unidadesResponse } = useQuery({
    queryKey: ["unidades_medida"],
    queryFn: () => allServices.productService.getUnidadesMedida(),
  });

  const { data: armazensResponse } = useQuery({
    queryKey: ["armazens"],
    queryFn: () => allServices.warehouseService.getAll({ per_page: 1000 }),
  });
  const armazens = armazensResponse?.items || [];

  const schema = React.useMemo(() => {
    const rawSchema = schemas[moduleName];
    if (!rawSchema) return null;
    return {
      ...rawSchema,
      fields: rawSchema.fields.map((f) => {
        if (f.name === "taxa_iva_id" && ivaResponse) {
          return {
            ...f,
            options: ivaResponse
              .filter((r: any) => r.ativo)
              .map((r: any) => ({
                label: `${r.descricao} (${Number(r.percentagem)}%)`,
                value: r.id,
              })),
          };
        }
        if (f.name === "categoria_id" && Array.isArray(categoriasResponse)) {
          return {
            ...f,
            options: categoriasResponse.map((r: any) => ({
              label: r.nome,
              value: r.id,
            })),
          };
        }
        if (f.name === "unidade_medida_id" && Array.isArray(unidadesResponse)) {
          return {
            ...f,
            options: unidadesResponse.map((r: any) => ({
              label: `${r.nome} (${r.sigla})`,
              value: r.id,
            })),
          };
        }

        return f;
      }),
    };
  }, [moduleName, ivaResponse, categoriasResponse, unidadesResponse]);

  const { data: paginatedResponse, isLoading } = useQuery({
    queryKey: [moduleName, page, perPage, searchTerm, activeTab],
    queryFn: () =>
      apiAccessor.getAll({
        page,
        per_page: perPage,
        search: searchTerm,
        tipo: activeTab,
      }),
    placeholderData: keepPreviousData,
  });

  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: [
      "product_history",
      currentRecord?.id,
      historyPage,
      historyPerPage,
    ],
    queryFn: () =>
      allServices.productService.getMovimentos(currentRecord?.id, {
        page: historyPage,
        per_page: historyPerPage,
      }),
    enabled: isHistoryModalOpen && !!currentRecord?.id,
  });

  const createMutation = useMutation({
    mutationFn: (newRecord: any) => apiAccessor.create(newRecord),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
      setIsModalOpen(false);
      toast.success("Registo criado com sucesso." + response?.nome);
    },
    onError: () => toast.error("Erro ao criar registo."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      apiAccessor.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
      setIsModalOpen(false);
      toast.success("O registo foi atualizado.");
    },
    onError: () => toast.error("Erro ao atualizar registo."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiAccessor.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
      toast.success("O registo foi eliminado.");
    },
    onError: () => toast.error("Erro ao eliminar registo."),
  });

  const stockMutation = useMutation({
    mutationFn: ({
      id,
      tipo,
      data,
    }: {
      id: string | number;
      tipo: "Entrada" | "Saída";
      data: any;
    }) => {
      if (tipo === "Entrada") {
        return allServices.productService.entradaStock(id, data);
      } else {
        return allServices.productService.saidaStock(id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
      setIsStockModalOpen(false);
      toast.success("Movimentação de stock registada com sucesso.");
    },
    onError: () => toast.error("Erro ao registar movimentação."),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, ativar }: { id: string | number; ativar: boolean }) =>
      allServices.productService.toggleAtivo(id, ativar),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [moduleName] });
      toast.success("Estado atualizado com sucesso.");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.msg || "Erro ao alterar estado do produto."
      );
    },
  });

  const handleStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const qtd = Number(formData.get("quantidade"));

    if (
      stockOpType === "Saída" &&
      qtd > Number(currentRecord?.stock_atual || 0)
    ) {
      toast.error("Não há stock suficiente para esta saída.");
      return;
    }

    const payload: any = {
      quantidade: qtd,
      observacao: formData.get("observacao") || "",
    };

    if (stockOpType === "Entrada") {
      if (formData.get("preco_compra"))
        payload.preco_compra = Number(formData.get("preco_compra"));
      if (formData.get("numero_fatura"))
        payload.numero_fatura = formData.get("numero_fatura");
      if (formData.get("fornecedor_id"))
        payload.fornecedor_id = Number(formData.get("fornecedor_id"));
    } else {
      payload.motivo = formData.get("motivo");
    }

    stockMutation.mutate({
      id: currentRecord.id,
      tipo: stockOpType,
      data: payload,
    });
  };

  const handleOpenForm = (record: any = null) => {
    setCurrentRecord(record);
    setSelectedTipo(record?.tipo || activeTab);
    setIsModalOpen(true);
  };

  const handleOpenView = (record: any) => {
    setCurrentRecord(record);
    setIsViewOpen(true);
  };
  const handleNew = () => {
    setCurrentRecord(null);
    setSelectedTipo(activeTab);
    setIsModalOpen(true);
  };
  const handleDelete = (id: string) => {
    Swal.fire({
      title: "Tem a certeza?",
      text: "Esta ação não pode ser revertida!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Sim, eliminar!",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(id);
      }
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const dataObj: any = {};

    schema?.fields.forEach((field) => {
      // Ignore read-only fields from submitting
      if (["stock_atual", "ativo", "codigo"].includes(field.name)) return;
      if (currentRecord && field.name === "tipo") return;

      

      if (field.type === "checkbox") {
        dataObj[field.name] = formData.has(field.name);
      } else {
        const val = formData.get(field.name);
        if (val !== null && val !== "") {
          dataObj[field.name] = val;
        }
      }
    });

    const armazemId = formData.get("armazem_id");
    if (armazemId) {
      dataObj["armazem_id"] = Number(armazemId);
    }

    if (dataObj.preco_compra !== undefined && dataObj.preco_compra !== "") {
      dataObj.preco_compra = Number(dataObj.preco_compra);
    }
    if (dataObj.stock_minimo !== undefined && dataObj.stock_minimo !== "") {
      dataObj.stock_minimo = Number(dataObj.stock_minimo);
    }

    if (!currentRecord?.id) {
      dataObj["tipo"] = selectedTipo;
    }

    if (currentRecord?.id) {
      updateMutation.mutate({ id: currentRecord.id, updates: dataObj });
    } else {
      createMutation.mutate(dataObj);
    }
  };

  const data = paginatedResponse?.items || [];
  const pagination = paginatedResponse || {
    page: page,
    total: 0,
    pages: Math.max(1, page),
  };
  const dataHistory = historyData?.items || [];
  const paginationHistory = historyData || {
    page: 1,
    total: 0,
    pages: 0,
  };

  const tableColumns = React.useMemo<ColumnDef<any>[]>(() => {
    const cols: ColumnDef<any>[] = [];
    
    // Consumiveis should only show: Código, Nome, Quantidade Atual, Preço de Compra, Categoria, Estado (Status), Ações
    const ocultas = ["preco_venda", "taxa_iva", "precoliquido", "armazem_nome", "tipo"];

    if (schema) {
      schema.columns
        .filter((col) => !ocultas.includes(col.key))
        .forEach((col) => {
          cols.push({
            accessorKey: col.key,
            header: col.label,
            cell: (info) =>
              col.render
                ? col.render(info.getValue(), info.row.original)
                : info.getValue() || "-",
          });
        });
    }

    cols.push({
      id: "actions",
      header: () => <div className="text-right">Ações</div>,
      cell: (info) => {
        const item = info.row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setCurrentRecord(item);

                setIsModalOpen(false);
                setIsStockModalOpen(true);
              }}
              className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
              title="Movimentação / Ajuste de Stock"
            >
              <PackageOpen size={16} />
            </button>
            <button
              onClick={() => {
                setCurrentRecord(item);
                setIsDetailsModalOpen(true);
              }}
              className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
              title="Visualizar Detalhes"
            >
              <Info size={16} />
            </button>
            <button
              onClick={() => {
                handleOpenForm(item);
                setIsModalOpen(false);
                setIsHistoryModalOpen(true);
              }}
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              title="Histórico de Movimentos"
            >
              <Activity size={16} />
            </button>
            <button
              onClick={() => handleOpenForm(item)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition-colors"
              title="Editar"
            >
              <Edit2 size={16} />
            </button>
            {isAdmin && (
              <button
                onClick={() => handleDelete(item.id)}
                className="p-1.5 text-gray-400 hover:text-error hover:bg-error/10 rounded transition-colors"
                title="Eliminar"
              >
                <Trash2 size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={() =>
                toggleMutation.mutate({
                  id: item.id,
                  ativar: !item.ativo,
                })
              }
              className={`p-1.5 rounded transition-colors ${
                item.ativo
                  ? "text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                  : "text-green-500 hover:text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30"
              }`}
              title={item.ativo ? "Desativar" : "Ativar"}
            >
              <Power size={16} />
            </button>
          </div>
        );
      },
    });

    return cols;
  }, [schema, activeTab]);
  const tableColumnsHistory = React.useMemo<ColumnDef<any>[]>(() => {
    const cols: ColumnDef<any>[] = [];

    if (schema) {
      schema.columnsHistory.forEach((col) => {
        cols.push({
          accessorKey: col.key,
          header: col.label,
          cell: (info) =>
            col.render
              ? col.render(info.getValue(), info.row.original)
              : info.getValue() || "-",
        });
      });
    }

    return cols;
  }, [schema, currentRecord]);

  return (
    <div className="space-y-6 animate-fade-in">
      <DataTable
        key={activeTab}
        storageKey={`products_${activeTab}`}
        data={data}
        columns={tableColumns}
        isLoading={isLoading}
        searchPlaceholder={`Pesquisar em ${schema?.title || title}...`}
        manualPagination={true}
        pageCount={pagination.pages}
        paginationState={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(updater) => {
          const current = {
            pageIndex: page - 1,
            pageSize: perPage,
          };

          const newState =
            typeof updater === "function" ? updater(current) : updater;

          setPage(newState.pageIndex + 1);
          setPerPage(newState.pageSize);
        }}
        searchValue={searchTerm}
        onSearchChange={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onClearFilters={() => {
            setSearchTerm('');
            setStatusFilter('all');
            setPage(1);
        }}
        addFunction={handleNew}
        
        statusFilter={statusFilter}
          onStatusFilterChange={(status) => {
            setStatusFilter(status);
            setPage(1);
          }}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          currentRecord ? "Editar Registo" : `Novo Registo em ${schema?.title}`
        }
        footer={
          <>
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                {currentRecord && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setIsStockModalOpen(true);
                    }}
                    className="px-5 py-2 rounded-lg font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Atualizar Stock
                  </button>
                )}

                {currentRecord && (
                  <button
                    type="button"
                    onClick={() =>
                      toggleMutation.mutate({
                        id: currentRecord.id,
                        ativar: !currentRecord.ativo,
                      })
                    }
                    className={`px-5 py-2 rounded-lg font-medium border transition-colors ${
                      currentRecord.ativo
                        ? "border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                        : "border-green-300 text-green-700 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30"
                    }`}
                  >
                    {currentRecord.ativo ? "Desativar" : "Ativar"}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="crud-form"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="px-5 py-2 rounded-lg font-medium bg-primary hover:bg-primary-hover text-white transition-colors"
                >
                  {currentRecord ? "Atualizar" : "Guardar"}
                </button>
              </div>
            </div>
          </>
        }
      >
        {schema && (
          <form
            id="crud-form"
            onSubmit={handleFormSubmit}
            className="space-y-6"
          >
            <div className="p-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-2">
              <div className="space-y-1 mb-2">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                  Nome do Produto <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  defaultValue={currentRecord?.nome || ""}
                  required
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className=" grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                    Categoria <span className="text-error">*</span>
                  </label>
                  <select
                    name="categoria_id"
                    defaultValue={currentRecord?.categoria_id || ""}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Selecione...</option>
                    {schema.fields
                      .find((f) => f.name === "categoria_id")
                      ?.options?.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                    Unidade de Medida <span className="text-error">*</span>
                  </label>
                  <select
                    name="unidade_medida_id"
                    defaultValue={currentRecord?.unidade_medida_id || ""}
                    required
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">Selecione...</option>
                    {schema.fields
                      .find((f) => f.name === "unidade_medida_id")
                      ?.options?.map((opt: any) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                    Preço de Compra <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      name="preco_compra"
                      defaultValue={currentRecord?.preco_compra || ""}
                      required
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <span className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                      {config.moeda || "STN"}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                    Armazém de Destino
                  </label>
                  <select
                    name="armazem_id"
                    defaultValue={
                      currentRecord?.armazem_id ||
                      armazens.find((a: any) => a.principal)?.id ||
                      ""
                    }
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {armazens.map((a: any) => (
                      <option key={a.id} value={a.id}>
                        {a.nome} {a.principal ? "(Principal)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                    Data de Validade
                  </label>
                  <input
                    type="date"
                    name="data_validade"
                    defaultValue={currentRecord?.data_validade || ""}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-3">
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                    Stock Atual
                  </label>
                  <input
                    type="number"
                    name="stock_atual"
                    defaultValue={currentRecord?.stock_atual || 0}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    name="stock_minimo"
                    defaultValue={currentRecord?.stock_minimo || 0}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden mb-4">
              <div className="p-2 grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                    Descrição
                  </label>
                  <textarea
                    name="descricao"
                    defaultValue={currentRecord?.descricao || ""}
                    rows={2}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Detalhes do Registo"
        maxWidth="max-w-4xl"
        footer={
          <>
            <button
              onClick={() => setIsViewOpen(false)}
              className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => {
                setIsViewOpen(false);
                handleOpenForm(currentRecord);
              }}
              className="px-6 py-2 rounded-lg font-medium bg-primary hover:bg-primary-hover text-white transition-colors flex items-center gap-2"
            >
              <Edit2 size={16} /> Editar Registo
            </button>
          </>
        }
      >
        {schema && currentRecord && (
          <div className="space-y-8">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                ID Externo:{" "}
                <span className="font-mono text-gray-400">
                  {currentRecord.id}
                </span>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {schema.fields.map((field) => (
                <div
                  key={field.name}
                  className={`${
                    field.type === "textarea"
                      ? "md:col-span-2 lg:col-span-3"
                      : ""
                  }`}
                >
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                    {field.label}
                  </h3>
                  <div className="text-base font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800/50">
                    {currentRecord[field.name] || (
                      <span className="text-gray-400 italic">Não definido</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                Metadados e Auditoria
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">Criado (Sistema)</p>
                  <p className="font-medium text-sm dark:text-gray-300">
                    Hoje, por API
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">
                    Sistema Integrado
                  </p>
                  <p className="font-medium text-sm dark:text-gray-300">
                    SIGI ERP Core Sync
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800/30 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                  <p className="text-xs text-gray-500 mb-1">
                    Estado de Auditoria
                  </p>
                  <p className="font-medium text-sm dark:text-gray-300 text-success">
                    Verificado
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Atualizar Stock: ${currentRecord?.nome}`}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsStockModalOpen(false)}
              className="px-5 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="stock-form"
              disabled={stockMutation.isPending}
              className="px-5 py-2 rounded-lg font-medium bg-primary hover:bg-primary-hover text-white transition-colors"
            >
              Confirmar
            </button>
          </>
        }
      >
        <div className="mb-6 flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-lg w-fit">
          <button
            onClick={() => setStockOpType("Entrada")}
            className={`px-4 py-2 text-sm font-bold rounded transition-colors ${
              stockOpType === "Entrada"
                ? "bg-white dark:bg-surface-dark text-success shadow"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Entrada de Stock
          </button>
          <button
            onClick={() => setStockOpType("Saída")}
            className={`px-4 py-2 text-sm font-bold rounded transition-colors ${
              stockOpType === "Saída"
                ? "bg-white dark:bg-surface-dark text-error shadow"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Saída de Stock
          </button>
        </div>

        <form
          id="stock-form"
          onSubmit={handleStockSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
              Quantidade *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              name="quantidade"
              required
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {stockOpType === "Entrada" && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                  Fornecedor (Opcional)
                </label>
                <input
                  type="text"
                  name="fornecedor"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                  Número da Fatura (Opcional)
                </label>
                <input
                  type="text"
                  name="numero_fatura"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </>
          )}

          {stockOpType === "Saída" && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
                Motivo *
              </label>
              <select
                name="motivo"
                required
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Selecione...</option>
                <option value="Quebra/Dano">Quebra/Dano</option>
                <option value="Validade Expirada">Validade Expirada</option>
                <option value="Consumo Interno">Consumo Interno</option>
                <option value="Ajuste de Inventário">
                  Ajuste de Inventário
                </option>
              </select>
            </div>
          )}

          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 tracking-wide uppercase">
              Observação{" "}
              {stockOpType === "Saída" && <span className="text-error">*</span>}
            </label>
            <textarea
              name="observacao"
              required={stockOpType === "Saída"}
              rows={3}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title={`Histórico de Movimentos: ${currentRecord?.nome}`}
        maxWidth="max-w-6xl"
        footer={
          <>
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="px-6 py-2 rounded-lg font-medium bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              Fechar
            </button>
            {currentRecord && (
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setIsStockModalOpen(true);
                  setIsHistoryModalOpen(false);
                }}
                className="px-5 py-2 rounded-lg font-medium border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Atualizar Stock
              </button>
            )}
          </>
        }
      >
        <DataTable
          data={historyData?.items}
          columns={tableColumnsHistory}
          isLoading={isLoadingHistory}
          searchPlaceholder={`Pesquisar no histórico de ${currentRecord?.nome}...`}
          manualPagination={true}
          pageCount={paginationHistory.pages}
          paginationState={{
            pageIndex: historyPage - 1,
            pageSize: historyPerPage,
          }}
          onPaginationChange={(updater) => {
            const current = {
              pageIndex: historyPage - 1,
              pageSize: historyPerPage,
            };

            const newState =
              typeof updater === "function" ? updater(current) : updater;

            setHistoryPage(newState.pageIndex + 1);
            setHistoryPerPage(newState.pageSize);
          }}
          searchValue={searchTerm}
          onSearchChange={(value) => {
            setSearchTerm(value);
            setHistoryPage(1);
          }}
          onClearFilters={() => {
            setSearchTerm("");
            setHistoryPage(1);
          }}
        />
      </Modal>

      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        product={currentRecord}
      />
    </div>
  );
}

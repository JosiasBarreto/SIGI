import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService, clientService, vendaService } from "../../services";
import { Search, FileText, Eye, Plus } from "lucide-react";
import { formatCurrency, cn } from "../../lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../components/Common/DataTable";
import { toast } from "react-toastify";
import OrderDetailsModal from "../../components/OrderDetailsModal";

interface PedidosListProps {
  onOpenNewOrderForm: () => void;
}

export default function PedidosList({ onOpenNewOrderForm }: PedidosListProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("Agendados");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ["orders", searchTerm],
    queryFn: () => orderService.getAll({ search: searchTerm }),
  });

  const { data: clientsResponse } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientService.getAll({ per_page: 5000 }),
  });

  const orders = ordersResponse?.items || [];
  const clients = clientsResponse?.items || [];

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      estado,
      justificativa,
    }: {
      id: string | number;
      estado: string;
      justificativa?: string;
    }) => orderService.updateEstado(id, estado, justificativa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Estado do pedido atualizado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao atualizar estado do pedido.");
    },
  });

  const emitirDocumentoMutation = useMutation({
    mutationFn: ({
      pedidoId,
      tipo,
    }: {
      pedidoId: number;
      tipo: "FT" | "PROFORMA";
    }) => vendaService.emitirDocumentoPedido(pedidoId, tipo),
    onSuccess: (venda, variables) => {
      toast.success(
        `${venda.tipo_documento} emitida: ${venda.numero_documento || venda.numero}`
      );
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      if (variables.tipo === "PROFORMA") {
        vendaService
          .imprimirVendaPdf(venda.id)
          .catch((err) => toast.error(err?.message || "Erro ao imprimir Pró-Forma."));
      }
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error || "Não foi possível emitir o documento."),
  });

  const getClientName = (clientId: string | number) => {
    return (
      clients?.find((c: any) => String(c.id) === String(clientId))?.nome ||
      "Cliente ao Balcão"
    );
  };

  const estadoMap: Record<string, string[]> = {
    Agendados: ["Pendente", "Agendado", "PENDENTE", "AGENDADO"],
    Confirmados: ["Confirmado", "CONFIRMADO"],
    Produção: ["Em Producao", "Em Produção", "EM_PRODUCAO", "EM_PREPARACAO"],
    Prontos: ["Pronto", "PRONTO"],
    Concluídos: ["Em Entrega", "Entregue", "Concluido", "Concluído", "CONCLUIDO", "ENTREGUE"],
    Cancelados: ["Cancelado", "CANCELADO"],
  };

  const normalizarEstado = (valor: unknown) =>
    String(valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toUpperCase()
      .replace(/[\s.-]+/g, "_");

  const visibleOrders =
    orders?.filter((o: any) => {
      const matchesSearch =
        getClientName(o.clientId || o.cliente_id)
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        String(o.numero || o.id).toLowerCase().includes(searchTerm.toLowerCase());

      const mappedStatuses = estadoMap[activeTab] || [];
      const estado = normalizarEstado(o.estado || o.status);
      const matchesStatus = mappedStatuses.some(
        (st) => normalizarEstado(st) === estado
      );

      return matchesSearch && matchesStatus;
    }) || [];

  const handleUpdateStatus = (
    id: string,
    currentStatus: string,
    justificativa?: string
  ) => {
    updateMutation.mutate({ id, estado: currentStatus, justificativa });
  };

  const orderColumns = useMemo<ColumnDef<any, any>[]>(
    () => [
      {
        accessorKey: "numero",
        header: "Nº Pedido",
        cell: ({ row }) => (
          <span className="font-mono font-bold text-primary">
            {row.original.numero || `PED-${row.original.id}`}
          </span>
        ),
      },
      {
        id: "cliente",
        header: "Cliente",
        cell: ({ row }) => (
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {row.original.cliente?.nome || getClientName(row.original.cliente_id)}
          </div>
        ),
      },
      {
        accessorKey: "data_entrega",
        header: "Data Entrega",
        cell: ({ row }) => {
          const date = row.original.data_entrega;
          const time = row.original.hora_entrega;
          return (
            <div className="flex flex-col">
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {date ? new Date(date).toLocaleDateString() : "Não definida"}
              </span>
              {time && <span className="text-xs text-gray-500">{time}</span>}
            </div>
          );
        },
      },
      {
        accessorKey: "estado",
        header: "Estado",
        cell: ({ row }) => {
          const est = row.original.estado || "Pendente";
          let colorClass =
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
          if (est === "Confirmado")
            colorClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400";
          else if (
            est === "Concluido" ||
            est === "Entregue" ||
            est === "Concluído"
          )
            colorClass = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
          else if (est === "Cancelado")
            colorClass = "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400";
          else if (est === "Em Produção" || est === "Em Producao")
            colorClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400";
          return (
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${colorClass}`}>
              {est}
            </span>
          );
        },
      },
      {
        accessorKey: "estado_pagamento",
        header: "Pagamento",
        cell: ({ row }) => {
          const pag = row.original.estado_pagamento || "Pendente";
          let colorClass =
            "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
          if (pag === "Pago")
            colorClass = "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400";
          else if (pag === "Parcial")
            colorClass = "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400";
          return (
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${colorClass}`}>
              {pag}
            </span>
          );
        },
      },
      {
        accessorKey: "valor_total",
        header: "Valor Total",
        cell: ({ row }) => (
          <span className="font-bold text-gray-900 dark:text-white">
            {formatCurrency(row.original.valor_total || row.original.total || 0)}
          </span>
        ),
      },
      {
        id: "acoes",
        header: "Ações",
        cell: ({ row }) => (
          <div className="flex flex-wrap justify-end gap-1.5">
            <button
              type="button"
              onClick={() =>
                emitirDocumentoMutation.mutate({
                  pedidoId: Number(row.original.id),
                  tipo: "PROFORMA",
                })
              }
              className="text-amber-800 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
              title="Emitir Fatura Pró-Forma"
            >
              <FileText size={13} />
              Proforma
            </button>
            <button
              type="button"
              onClick={() =>
                emitirDocumentoMutation.mutate({
                  pedidoId: Number(row.original.id),
                  tipo: "FT",
                })
              }
              className="text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
              title="Emitir Fatura"
            >
              FT
            </button>
            <button
              type="button"
              onClick={() => setSelectedOrder(row.original)}
              className="text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg transition-all flex items-center justify-center font-bold"
              title="Ver detalhes"
            >
              <Eye size={16} />
            </button>
          </div>
        ),
      },
    ],
    [clients, emitirDocumentoMutation]
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1">
          {Object.keys(estadoMap).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-full text-xs font-extrabold transition-all",
                activeTab === tab
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md"
                  : "bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={onOpenNewOrderForm}
          className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-primary/20 shrink-0"
        >
          <Plus size={16} /> Novo Pedido
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl shadow-sm">
        <Search size={18} className="text-gray-400" />
        <input
          type="text"
          placeholder="Pesquisar pedido por número ou nome do cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none outline-none ml-3 w-full text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
        />
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="p-12 text-center text-gray-500 font-medium">
          A carregar pedidos do sistema...
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 border-dashed space-y-2">
          <FileText size={40} className="mx-auto opacity-20" />
          <p className="text-sm font-semibold">Nenhum pedido encontrado na aba {activeTab}.</p>
        </div>
      ) : (
        <DataTable columns={orderColumns} data={visibleOrders} />
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}

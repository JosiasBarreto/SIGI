import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Package, Wrench, Apple, ClipboardList, AlertOctagon, User, Clock, Eye } from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "react-toastify";
import { requestService } from "../services";
import Modal from "../components/Common/Modal";
import { useAuth } from "../components/AuthContext";
import { CreateRequisitionForm } from "./Requisicoes/CreateRequisitionForm";
import { DetailedRequisitionView } from "./Requisicoes/DetailedRequisitionView";
import { DataTable } from "../components/Common/DataTable";
import { ColumnDef } from "@tanstack/react-table";

export default function Requisicoes() {
  const [activeTab, setActiveTab] = useState<string>("Pendente");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Queries for requisitions
  const { data: requisitionsResponse, isLoading } = useQuery({
    queryKey: ["requests", searchTerm, activeTab],
    queryFn: () => {
      if (activeTab === "Ocorrências" || activeTab === "Nova") return null;
      return requestService.getAll({
        estado: activeTab,
        search: searchTerm,
        per_page: 100
      });
    },
    enabled: activeTab !== "Ocorrências" && activeTab !== "Nova"
  });

  // Query for occurrences
  const { data: occurrencesResponse, isLoading: isLoadingOccurrences } = useQuery({
    queryKey: ["occurrences", activeTab],
    queryFn: () => requestService.getOcorrencias({ per_page: 100 }),
    enabled: activeTab === "Ocorrências"
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, action, payload }: { id: string | number; action: "aprovar" | "entregar" | "devolver" | "encerrar"; payload?: any; }) => {
      if (action === "aprovar") {
        return requestService.aprovar(id, payload.itens);
      }
      if (action === "entregar") {
        return requestService.entregar(id, payload?.observacao);
      }
      if (action === "devolver") {
        return requestService.devolver(id, payload);
      }
      if (action === "encerrar") {
        return requestService.encerrar(id);
      }
      throw new Error("Ação inválida");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["occurrences"] });
      setSelectedReq(null);
      toast.success("Requisição atualizada com sucesso!");
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("Erro ao processar ação na requisição.");
    }
  });

  const createMutation = useMutation({
    mutationFn: (newReq: any) => requestService.create(newReq),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      setActiveTab("Pendente");
      toast.success("Ficha de requisição registada com sucesso!");
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("Erro ao registar ficha de requisição.");
    }
  });

  const requisitions = requisitionsResponse?.items || [];
  const occurrences = occurrencesResponse?.items || [];
  const canCreate = ["Administrador", "Cozinha", "Pastelaria"].includes(user?.role || "");

  const tabConfigs = [
    ...(canCreate ? [{ label: "Nova", color: "primary", bg: "bg-primary/10 border-primary/20 text-primary" }] : []),
    { label: "Pendente", color: "amber", bg: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400" },
    { label: "Aprovada", color: "blue", bg: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400" },
    { label: "Em Uso", color: "green", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" },
    { label: "Entregue", color: "blue", bg: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400" },
    { label: "Devolvida", color: "blue", bg: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400" },
    { label: "Devolucao Parcial", color: "blue", bg: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400" },
    { label: "Encerrada", color: "gray", bg: "bg-gray-500/10 border-gray-500/20 text-gray-700 dark:text-gray-400" },
    { label: "Ocorrências", color: "red", bg: "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400" },
    { label: "Cancelada", color: "red", bg: "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400" }
  ];

  const [selectedOccurrence, setSelectedOccurrence] = useState<any>(null);

  const occurrenceColumns = React.useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorKey: "numero",
      header: "Ficha Origem",
      cell: ({ row }) => <span className="font-mono font-bold text-primary">{row.original.numero || "N/A"}</span>
    },
    {
      accessorKey: "material_nome",
      header: "Material/Produto",
      cell: ({ row }) => (
        <span className="font-bold flex items-center gap-2">
          <Wrench size={14} className="text-gray-400" />
          {row.original.material_nome || row.original.material_id || "Material Desconhecido"}
        </span>
      )
    },
    {
      id: "quantidades",
      header: "Quantidades",
      cell: ({ row }) => {
        const oc = row.original;
        return (
          <div className="space-x-2">
            {oc.tipo === "Danificado" && (
              <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold px-2 py-1 rounded">
                {Number(oc.quantidade)} Danificado(s)
              </span>
            )}
            {oc.tipo === "Perda" && (
              <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold px-2 py-1 rounded">
                {Number(oc.quantidade)} Perdido(s)
              </span>
            )}
          </div>
        );
      }
    },
    {
      id: "acoes",
      header: "Ações",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedOccurrence(row.original)}
          className="text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-all flex items-center justify-center font-bold"
        >
          <Eye size={16} className="mr-1" /> Ver detalhes
        </button>
      )
    }
  ], []);

  const requisitionColumns = React.useMemo<ColumnDef<any, any>[]>(() => [
    {
      accessorKey: "numero",
      header: "Número",
      cell: ({ row }) => <span className="font-mono font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight">{row.original.numero || `#REQ-${row.original.id}`}</span>
    },
    {
      accessorKey: "sector",
      header: "Setor / Turno",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-bold text-gray-800 dark:text-gray-200">{row.original.sector}</span>
          {row.original.turno_nome && <span className="text-[10px] text-gray-400 font-medium">{row.original.turno_nome}</span>}
        </div>
      )
    },
    {
      accessorKey: "responsavel_nome",
      header: "Responsável",
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <User size={13} />
          <span className="font-bold text-gray-800 dark:text-gray-200">{row.original.responsavel_nome || `Utilizador #${row.original.responsavel_id}`}</span>
        </div>
      )
    },
    {
      accessorKey: "data_requisicao",
      header: "Data",
      cell: ({ row }) => (
        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
          <Clock size={12} />
          {new Date(row.original.data_requisicao).toLocaleString()}
        </div>
      )
    },
    {
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => {
        const req = row.original;
        return (
          <span
            className={cn(
              "text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider",
              req.estado === "Pendente" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
              req.estado === "Aprovada" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" :
              req.estado === "Em Uso" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
              "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            {req.estado}
          </span>
        );
      }
    },
    {
      id: "acoes",
      header: "Ações",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedReq(row.original)}
          className="text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-xl transition-all flex items-center justify-center font-bold"
          title="Ver mais detalhes"
        >
          <Eye size={16} className="mr-1" /> Ver detalhes
        </button>
      )
    }
  ], []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner / Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
            <ClipboardList className="text-primary" size={28} />
            Requisições Operacionais
          </h1>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
            Fichas de Stock, Devoluções e Controlo de Auditoria
          </p>
        </div>
        {canCreate && activeTab !== "Nova" && (
          <button
            onClick={() => setActiveTab("Nova")}
            className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus size={18} /> Nova Requisição
          </button>
        )}
      </div>

      {/* State Badge Filters / Navigation */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 mt-4">
        {tabConfigs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => {
              setActiveTab(tab.label);
              setSelectedReq(null);
            }}
            className={cn(
              "whitespace-nowrap px-5 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider border-2 flex-1 sm:flex-none text-center flex items-center justify-center gap-2",
              activeTab === tab.label
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-950 border-transparent shadow-md scale-105"
                : `bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-800 text-gray-500 hover:text-gray-900 dark:hover:text-white`
            )}
          >
            <span className={cn("w-2 h-2 rounded-full", 
              tab.color === "amber" ? "bg-amber-500 animate-pulse" :
              tab.color === "primary" ? "bg-primary animate-pulse" :
              tab.color === "blue" ? "bg-blue-500" :
              tab.color === "green" ? "bg-emerald-500" :
              tab.color === "red" ? "bg-rose-500 animate-pulse" : "bg-gray-400"
            )} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Header for everything but Occurrences and Nova */}
      {activeTab !== "Ocorrências" && activeTab !== "Nova" && (
        <div className="relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors"
            size={20}
          />
          <input
            type="text"
            placeholder="Pesquisar por número da ficha ou observações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 dark:text-white shadow-sm"
          />
        </div>
      )}

      {/* Main Grid content or table */}
      {activeTab === "Nova" ? (
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Plus className="text-primary" size={18} />
            Nova Ficha de Requisição Operacional
          </h2>
          <CreateRequisitionForm
            onCancel={() => setActiveTab("Pendente")}
            onSubmit={(data) => createMutation.mutate(data)}
            createMutation={createMutation}
          />
        </div>
      ) : activeTab === "Ocorrências" ? (
        <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
              <AlertOctagon className="text-rose-500" size={18} />
              Lista de Ocorrências e Danos de Materiais
            </h2>
            <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold">
              Registo de perdas e quebras detetadas no retorno ao armazém
            </p>
          </div>
          {isLoadingOccurrences ? (
            <div className="py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
              A carregar ocorrências...
            </div>
          ) : occurrences.length === 0 ? (
            <div className="py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
              Nenhuma ocorrência registada. Excelente trabalho!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                data={occurrences}
                columns={occurrenceColumns}
                isLoading={isLoadingOccurrences}
                searchPlaceholder="Pesquisar ocorrências..."
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2">
          {isLoading ? (
            <div className="col-span-full py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
              A carregar requisições...
            </div>
          ) : requisitions.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-400 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 border-dashed font-bold uppercase tracking-widest text-xs">
              Nenhuma requisição encontrada com o estado "{activeTab}".
            </div>
          ) : (
            <DataTable
              data={requisitions}
              columns={requisitionColumns}
              isLoading={isLoading}
              searchPlaceholder="Pesquisar requisições..."
            />
          )}
        </div>
      )}

      {/* View Detailed & Workflow Management Modal */}
      <Modal
        isOpen={!!selectedReq}
        onClose={() => setSelectedReq(null)}
        title={selectedReq ? `FICHA DE REQUISIÇÃO ${selectedReq.numero || `#${selectedReq.id}`}` : ""}
        maxWidth="max-w-4xl"
      >
        {selectedReq && (
          <DetailedRequisitionView
            req={selectedReq}
            onAction={(action, payload) =>
              updateMutation.mutate({ id: selectedReq.id, action, payload })
            }
            isProcessing={updateMutation.isPending}
            onClose={() => setSelectedReq(null)}
          />
        )}
      </Modal>

      {/* Occurrence Details Modal */}
      <Modal
        isOpen={!!selectedOccurrence}
        onClose={() => setSelectedOccurrence(null)}
        title="Detalhes da Ocorrência"
        maxWidth="max-w-xl"
      >
        {selectedOccurrence && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ficha Origem</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate">
                  {selectedOccurrence.numero || "N/A"}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                  {selectedOccurrence.data_ocorrencia ? new Date(selectedOccurrence.data_ocorrencia).toLocaleString() : "N/A"}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Material / Produto</p>
              <div className="flex items-center gap-2">
                <Wrench size={16} className="text-primary" />
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedOccurrence.material_nome || selectedOccurrence.material_id || "Desconhecido"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tipo</p>
                <p className={cn("text-sm font-bold uppercase", selectedOccurrence.tipo === "Danificado" ? "text-amber-500" : "text-rose-500")}>
                  {selectedOccurrence.tipo}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Quantidade</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                  {Number(selectedOccurrence.quantidade)}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Justificação</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                {selectedOccurrence.justificacao || "Nenhuma justificação registada."}
              </p>
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setSelectedOccurrence(null)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold px-6 py-2 rounded-xl transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

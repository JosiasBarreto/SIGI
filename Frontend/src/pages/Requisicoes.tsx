import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Package,
  Wrench,
  Apple,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  User,
  Clock,
  ClipboardList,
  RotateCcw,
  FileText,
  HelpCircle,
  TrendingUp,
  X,
  AlertOctagon
} from "lucide-react";
import { cn } from "../lib/utils";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  requestService,
  ingredientService,
  materialService,
  shiftService
} from "../services";
import Modal from "../components/Common/Modal";
import { useAuth } from "../components/AuthContext";

export default function Requisicoes() {
  const [activeTab, setActiveTab] = useState<string>("Pendente");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReq, setSelectedReq] = useState<any>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user } = useAuth();

  const queryClient = useQueryClient();

  // Queries for requisitions
  const { data: requisitionsResponse, isLoading } = useQuery({
    queryKey: ["requests", searchTerm, activeTab],
    queryFn: () => {
      if (activeTab === "Ocorrências") return null;
      return requestService.getAll({
        estado: activeTab,
        search: searchTerm,
        per_page: 100
      });
    },
    enabled: activeTab !== "Ocorrências"
  });

  // Query for occurrences
  const { data: occurrencesResponse, isLoading: isLoadingOccurrences } = useQuery({
    queryKey: ["occurrences", activeTab],
    queryFn: () => requestService.getOcorrencias({ per_page: 100 }),
    enabled: activeTab === "Ocorrências"
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      action,
      payload
    }: {
      id: string | number;
      action: "aprovar" | "entregar" | "devolver" | "encerrar";
      payload?: any;
    }) => {
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
      setIsCreateModalOpen(false);
      toast.success("Ficha de requisição registada com sucesso!");
    },
    onError: (error: any) => {
      console.error(error);
      toast.error("Erro ao registar ficha de requisição.");
    }
  });

  const requisitions = requisitionsResponse?.items || [];
  const occurrences = occurrencesResponse?.items || [];

  const tabConfigs = [
    { label: "Pendente", color: "amber", bg: "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400" },
    { label: "Aprovada", color: "blue", bg: "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400" },
    { label: "Em Uso", color: "green", bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400" },
    { label: "Encerrada", color: "gray", bg: "bg-gray-500/10 border-gray-500/20 text-gray-700 dark:text-gray-400" },
    { label: "Ocorrências", color: "red", bg: "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400" }
  ];

  const canCreate = ["Administrador", "Cozinha", "Pastelaria"].includes(user?.role || "");

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
        {canCreate && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
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
              tab.color === "blue" ? "bg-blue-500" :
              tab.color === "green" ? "bg-emerald-500" :
              tab.color === "red" ? "bg-rose-500 animate-pulse" : "bg-gray-400"
            )} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Header for everything but Occurrences */}
      {activeTab !== "Ocorrências" && (
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
      {activeTab === "Ocorrências" ? (
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
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Ficha Origem</th>
                    <th className="px-6 py-4">Material Danificado</th>
                    <th className="px-6 py-4 text-center">Quantidades</th>
                    <th className="px-6 py-4">Justificação / Causa</th>
                    <th className="px-6 py-4">Data da Ocorrência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                  {occurrences.map((oc: any) => (
                    <tr key={oc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                      <td className="px-6 py-4 font-mono font-bold text-primary">
                        #{oc.requisicao_id || "N/A"}
                      </td>
                      <td className="px-6 py-4 font-bold flex items-center gap-2">
                        <Wrench size={14} className="text-gray-400" />
                        {oc.material_nome || oc.material_id || "Material Desconhecido"}
                      </td>
                      <td className="px-6 py-4 text-center space-x-2">
                        {oc.quantidade_danificada > 0 && (
                          <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold px-2 py-1 rounded">
                            {oc.quantidade_danificada} Danificado(s)
                          </span>
                        )}
                        {oc.quantidade_perdida > 0 && (
                          <span className="bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-bold px-2 py-1 rounded">
                            {oc.quantidade_perdida} Perdido(s)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 italic text-gray-500 font-medium">
                        {oc.justificacao || "Sem justificação anotada."}
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] text-gray-400">
                        {oc.data_ocorrencia ? new Date(oc.data_ocorrencia).toLocaleString() : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
          {isLoading ? (
            <div className="col-span-full py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
              A carregar requisições...
            </div>
          ) : requisitions.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-400 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 border-dashed font-bold uppercase tracking-widest text-xs">
              Nenhuma requisição encontrada com o estado "{activeTab}".
            </div>
          ) : (
            requisitions.map((req) => {
              const numIngs = req.itens?.filter((i: any) => i.tipo_item === "Ingrediente").length || 0;
              const numMats = req.itens?.filter((i: any) => i.tipo_item === "Material").length || 0;
              const numCons = req.itens?.filter((i: any) => i.tipo_item === "Consumivel").length || 0;

              return (
                <button
                  key={req.id}
                  onClick={() => setSelectedReq(req)}
                  className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800/80 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all text-left flex flex-col justify-between group h-full cursor-pointer relative overflow-hidden"
                >
                  <div className="w-full space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="font-mono font-black text-sm text-gray-900 dark:text-white uppercase tracking-tight">
                        {req.numero || `#REQ-${req.id}`}
                      </span>
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
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <User size={13} />
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {req.responsavel_nome || `Utilizador #${req.responsavel_id}`}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
                        <Clock size={12} />
                        {new Date(req.data_requisicao).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="bg-primary/5 text-primary text-[9px] font-black px-2 py-0.5 rounded uppercase">
                        {req.tipo}
                      </span>
                      <span className="bg-secondary/5 text-secondary text-[9px] font-black px-2 py-0.5 rounded uppercase">
                        {req.sector}
                      </span>
                      {req.turno_nome && (
                        <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                          {req.turno_nome}
                        </span>
                      )}
                    </div>

                    {req.observacoes && (
                      <p className="text-[11px] text-gray-500 italic truncate border-l-2 border-gray-200 dark:border-gray-800 pl-2 mt-2">
                        {req.observacoes}
                      </p>
                    )}

                    <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-800/60">
                      {numIngs > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase text-amber-600">
                          <Apple size={11} /> {numIngs} Ing
                        </div>
                      )}
                      {numMats > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-600">
                          <Wrench size={11} /> {numMats} Mat
                        </div>
                      )}
                      {numCons > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600">
                          <Package size={11} /> {numCons} Cons
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nova Ficha de Requisição Operacional"
        maxWidth="max-w-4xl"
      >
        <CreateRequisitionForm
          onCancel={() => setIsCreateModalOpen(false)}
          onSubmit={(data) => createMutation.mutate(data)}
          createMutation={createMutation}
        />
      </Modal>

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
    </div>
  );
}

/* ==========================================================================
   CREATION FORM SUB-COMPONENT
   ========================================================================== */
function CreateRequisitionForm({
  onCancel,
  onSubmit,
  createMutation
}: {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  createMutation: any;
}) {
  const [tipo, setTipo] = useState<"Inicial" | "Complementar">("Inicial");
  const [sector, setSector] = useState<"Cozinha" | "Pastelaria">("Cozinha");
  const [turnoId, setTurnoId] = useState<number | "">("");
  const [observacoes, setObservacoes] = useState("");
  const [items, setItems] = useState<any[]>([]);

  // Fetch lists to populate options
  const { data: ingredientsResponse } = useQuery({
    queryKey: ["ingredients"],
    queryFn: () => ingredientService.getAll({ per_page: 1000 })
  });

  const { data: materialsResponse } = useQuery({
    queryKey: ["materials"],
    queryFn: () => materialService.getAll({ per_page: 1000 })
  });

  const { data: shiftsResponse } = useQuery({
    queryKey: ["shifts"],
    queryFn: () => shiftService.getAll({ per_page: 100 })
  });

  const ingredientsList = ingredientsResponse?.items || [];
  const rawMaterialsList = materialsResponse?.items || [];

  const shifts = shiftsResponse?.items || [];

  // Reusable lists filtered
  const materialsList = rawMaterialsList.filter((m: any) => m.tipo === "Reutilizavel");
  const consumablesList = rawMaterialsList.filter((m: any) => m.tipo === "Consumivel");

  const handleSuggest = async () => {
    try {
      toast.info("A consultar planeamento diário de produção...");
      const suggestRes = await requestService.getSugestao({ sector });
      const suggestedItens = Array.isArray(suggestRes) ? suggestRes : (suggestRes?.itens || suggestRes?.items || []);

      if (suggestedItens.length === 0) {
        Swal.fire(
          "Sem Sugestões",
          "Não há Ordens de Produção agendadas para hoje neste setor ou já foram todas requisitadas.",
          "info"
        );
        return;
      }

      // Map suggested items into creation form items list
      const mapped = suggestedItens.map((s: any) => ({
        tipo_item: s.tipo_item || "Ingrediente",
        item_id: s.item_id,
        quantidade_solicitada: s.quantidade_sugerida || s.quantidade_necessaria || 1,
        observacao: s.observacao || "Sugestão automática da produção do dia"
      }));

      setItems(mapped);
      toast.success(`Carregadas ${mapped.length} sugestões de ingredientes para hoje!`);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível gerar sugestões automáticas.");
    }
  };

  const addItemRow = (type: "Ingrediente" | "Material" | "Consumivel") => {
    setItems([
      ...items,
      {
        tipo_item: type,
        item_id: "",
        quantidade_solicitada: 1,
        observacao: ""
      }
    ]);
  };

  const removeItemRow = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItemRow = (idx: number, field: string, val: any) => {
    setItems(
      items.map((item, i) => (i === idx ? { ...item, [field]: val } : item))
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Por favor, adicione pelo menos um artigo à requisição.");
      return;
    }

    const missingFields = items.some((item) => !item.item_id || !item.quantidade_solicitada);
    if (missingFields) {
      toast.error("Preencha todos os campos e quantidades dos artigos listados.");
      return;
    }

    const payload = {
      tipo,
      sector,
      turno_id: turnoId === "" ? null : Number(turnoId),
      observacoes,
      itens: items.map((item) => ({
        tipo_item: item.tipo_item,
        item_id: Number(item.item_id),
        quantidade_solicitada: Number(item.quantidade_solicitada),
        observacao: item.observacao || ""
      }))
    };

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tipo Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
            Tipo de Requisição
          </label>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {(["Inicial", "Complementar"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={cn(
                  "flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all",
                  tipo === t
                    ? "bg-white dark:bg-surface-dark text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Sector Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
            Setor Requerente
          </label>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            {(["Cozinha", "Pastelaria"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSector(s)}
                className={cn(
                  "flex-1 py-2 rounded-lg font-bold text-xs uppercase tracking-wider transition-all",
                  sector === s
                    ? "bg-white dark:bg-surface-dark text-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Turno Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
            Turno / Horário (Opcional)
          </label>
          <select
            value={turnoId}
            onChange={(e) => setTurnoId(e.target.value ? Number(e.target.value) : "")}
            className="w-full bg-gray-50 dark:bg-surface-dark border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-4 py-2.5 rounded-xl outline-none font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white transition-all shadow-inner"
          >
            <option value="">Selecione o Turno</option>
            {shifts.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.nome} ({s.hora_inicio?.slice(0, 5)} - {s.hora_fim?.slice(0, 5)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Observations Textarea */}
      <div className="space-y-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
          Anotações / Observações Gerais
        </label>
        <textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Ex: Necessário para a produção da manhã. Prioridade nos ingredientes."
          rows={2}
          className="w-full bg-gray-50 dark:bg-surface-dark border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-4 py-3 rounded-xl outline-none font-medium text-xs text-gray-900 dark:text-white transition-all shadow-inner"
        />
      </div>

      {/* Articles / Grid Items List Section */}
      <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div>
            <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Artigos Solicitados
            </h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-tight">
              Adicione os materiais ou consumíveis que deseja levantar do armazém
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={handleSuggest}
              className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 shadow-sm border border-primary/20"
            >
              <Sparkles size={12} /> Sugerir Ingredientes do Dia
            </button>
            <button
              type="button"
              onClick={() => addItemRow("Ingrediente")}
              className="bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500 dark:hover:bg-amber-500 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 border border-amber-500/20"
            >
              <Apple size={12} /> + Ingrediente
            </button>
            <button
              type="button"
              onClick={() => addItemRow("Material")}
              className="bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500 dark:hover:bg-blue-500 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 border border-blue-500/20"
            >
              <Wrench size={12} /> + Material
            </button>
            <button
              type="button"
              onClick={() => addItemRow("Consumivel")}
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 border border-emerald-500/20"
            >
              <Package size={12} /> + Consumível
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="py-16 border-2 border-dashed border-gray-100 dark:border-gray-800/80 rounded-2xl text-center text-gray-400 font-bold uppercase tracking-widest text-[10px] flex flex-col items-center justify-center gap-3">
            <HelpCircle size={32} className="text-gray-300" />
            Adicione artigos manualmente ou utilize a sugestão inteligente baseada no planeamento do dia.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              // Get appropriate list of options based on type
              let options: any[] = [];
              if (item.tipo_item === "Ingrediente") options = ingredientsList;
              else if (item.tipo_item === "Material") options = materialsList;
              else if (item.tipo_item === "Consumivel") options = consumablesList;

              const selectedDetails = options.find((o) => Number(o.id) === Number(item.item_id));

              return (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row md:items-center gap-3 bg-gray-50 dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 group relative transition-all"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 self-start md:self-center shadow-sm border",
                      item.tipo_item === "Ingrediente" ? "bg-amber-500/10 text-amber-600 border-amber-500/10" :
                      item.tipo_item === "Material" ? "bg-blue-500/10 text-blue-600 border-blue-500/10" :
                      "bg-emerald-500/10 text-emerald-600 border-emerald-500/10"
                    )}
                  >
                    {item.tipo_item === "Ingrediente" ? <Apple size={14} /> :
                     item.tipo_item === "Material" ? <Wrench size={14} /> :
                     <Package size={14} />}
                  </div>

                  <div className="flex-1 grid grid-cols-12 gap-3">
                    {/* Item dropdown */}
                    <div className="col-span-12 md:col-span-5">
                      <select
                        value={item.item_id}
                        onChange={(e) => updateItemRow(idx, "item_id", e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2 rounded-xl text-xs font-bold outline-none focus:border-primary shadow-sm"
                        required
                      >
                        <option value="">Selecione o Artigo...</option>
                        {options.map((opt: any) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.codigo ? `[${opt.codigo}] ` : ""}{opt.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity requested input */}
                    <div className="col-span-6 md:col-span-3">
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          placeholder="Qtd Solicitada"
                          value={item.quantidade_solicitada}
                          onChange={(e) => updateItemRow(idx, "quantidade_solicitada", Number(e.target.value))}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 pl-3 pr-12 py-2 rounded-xl text-xs font-bold outline-none focus:border-primary shadow-sm"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">
                          {selectedDetails?.unidade_medida || "un"}
                        </span>
                      </div>
                    </div>

                    {/* Brief custom observation / annotation */}
                    <div className="col-span-6 md:col-span-4">
                      <input
                        type="text"
                        placeholder="Observação da linha..."
                        value={item.observacao}
                        onChange={(e) => updateItemRow(idx, "observacao", e.target.value)}
                        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2 rounded-xl text-xs font-medium outline-none focus:border-primary shadow-sm"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItemRow(idx)}
                    className="p-2 text-gray-300 hover:text-rose-500 transition self-end md:self-center hover:bg-rose-500/5 rounded-lg"
                    title="Remover artigo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Footer buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 font-black text-gray-500 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-colors text-[10px] active:scale-95"
        >
          Cancelar Operação
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 text-[10px] active:scale-95 disabled:opacity-50"
        >
          {createMutation.isPending ? "A submeter..." : "Submeter Requisição"}
        </button>
      </div>
    </form>
  );
}

/* ==========================================================================
   VIEW DETAILED & LIFECYCLE MANAGEMENT SUB-COMPONENT
   ========================================================================== */
function DetailedRequisitionView({
  req,
  onAction,
  isProcessing,
  onClose
}: {
  req: any;
  onAction: (action: "aprovar" | "entregar" | "devolver" | "encerrar", payload?: any) => void;
  isProcessing: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [approvedQuantities, setApprovedQuantities] = useState<Record<number, number>>(() => {
    const qtys: Record<number, number> = {};
    req.itens?.forEach((item: any) => {
      qtys[item.id] = Number(item.quantidade_aprovada) || Number(item.quantidade_solicitada) || 0;
    });
    return qtys;
  });

  const [deliveryObservation, setDeliveryObservation] = useState(
    "Entrega efetuada na totalidade do que foi aprovado."
  );

  // Material devolucoes state mapping
  const [devolucoes, setDevolucoes] = useState<Record<number, {
    quantidade_devolvida: number;
    quantidade_danificada: number;
    quantidade_perdida: number;
    observacao: string;
    justificacao: string;
  }>>(() => {
    const devs: Record<number, any> = {};
    req.itens?.forEach((item: any) => {
      if (item.tipo_item === "Material") {
        devs[item.id] = {
          quantidade_devolvida: Number(item.quantidade_entregue) || Number(item.quantidade_aprovada) || 0,
          quantidade_danificada: 0,
          quantidade_perdida: 0,
          observacao: "",
          justificacao: ""
        };
      }
    });
    return devs;
  });

  const handleApproveSubmit = () => {
    const payload = {
      itens: Object.keys(approvedQuantities).map((idStr) => {
        const itemId = Number(idStr);
        return {
          id: itemId,
          quantidade_aprovada: Number(approvedQuantities[itemId])
        };
      })
    };
    onAction("aprovar", payload);
  };

  const handleDeliverySubmit = () => {
    onAction("entregar", { observacao: deliveryObservation });
  };

  const handleDevolucaoSubmit = () => {
    // We only send returns for materials
    const materialsOnly = req.itens?.filter((i: any) => i.tipo_item === "Material") || [];
    
    // Check missing justifications for damages or losses
    const missingJustification = materialsOnly.some((item: any) => {
      const dev = devolucoes[item.id];
      const hasIssues = (dev?.quantidade_danificada || 0) > 0 || (dev?.quantidade_perdida || 0) > 0;
      return hasIssues && !dev?.justificacao?.trim();
    });

    if (missingJustification) {
      Swal.fire(
        "Justificação Obrigatória",
        "Por favor, indique uma justificação para quaisquer materiais danificados ou perdidos.",
        "warning"
      );
      return;
    }

    const payload = materialsOnly.map((item: any) => {
      const dev = devolucoes[item.id];
      return {
        material_id: Number(item.item_id),
        quantidade_devolvida: Number(dev?.quantidade_devolvida || 0),
        quantidade_danificada: Number(dev?.quantidade_danificada || 0),
        quantidade_perdida: Number(dev?.quantidade_perdida || 0),
        observacao: dev?.observacao || "",
        justificacao: dev?.justificacao || ""
      };
    });

    onAction("devolver", payload);
  };

  const handleEncerraSubmit = () => {
    Swal.fire({
      title: "Encerrar Requisição?",
      text: "Quaisquer materiais não devolvidos gerarão ocorrências automáticas de perda no sistema. Esta ação é irreversível.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, Encerrar!",
      cancelButtonText: "Cancelar"
    }).then((res) => {
      if (res.isConfirmed) {
        onAction("encerrar");
      }
    });
  };

  const isArmazemOrAdmin = ["Administrador", "Armazém"].includes(user?.role || "");
  const canDevolve = ["Administrador", "Controlador de Materiais", "Armazém"].includes(user?.role || "");

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Information Cards Header block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Responsável</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate">
            {req.responsavel_nome || `ID #${req.responsavel_id}`}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Setor / Turno</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white uppercase truncate">
            {req.sector} {req.turno_nome ? `• ${req.turno_nome}` : ""} ({req.tipo})
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Data Criação</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
            {new Date(req.data_requisicao).toLocaleDateString()} {new Date(req.data_requisicao).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estado</p>
          <span
            className={cn(
              "inline-block text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider",
              req.estado === "Pendente" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
              req.estado === "Aprovada" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" :
              req.estado === "Em Uso" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" :
              "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            {req.estado}
          </span>
        </div>
      </div>

      {req.observacoes && (
        <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 text-xs">
          <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">
            Observações Gerais do Requerente
          </p>
          <p className="text-gray-700 dark:text-gray-300 font-medium">{req.observacoes}</p>
        </div>
      )}

      {/* Detailed Items List */}
      <div className="space-y-4">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <FileText size={14} className="text-primary" />
          Relação de Itens da Ficha
        </h3>

        <div className="overflow-x-auto border border-gray-100 dark:border-gray-800 rounded-2xl bg-white dark:bg-surface-dark shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-500 font-bold uppercase border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-5 py-3">Artigo</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3 text-center">Qtd Solicitada</th>
                <th className="px-5 py-3 text-center text-blue-600 dark:text-blue-400">Qtd Aprovada</th>
                {req.estado !== "Pendente" && (
                  <th className="px-5 py-3 text-center text-emerald-600 dark:text-emerald-400">Qtd Entregue</th>
                )}
                {req.estado === "Encerrada" && (
                  <>
                    <th className="px-5 py-3 text-center">Devolvida</th>
                    <th className="px-5 py-3 text-center text-rose-500">Perdas/Danos</th>
                  </>
                )}
                <th className="px-5 py-3">Anotação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200 font-medium">
              {req.itens?.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20">
                  <td className="px-5 py-4">
                    <div className="font-bold">{item.nome || `Item ID #${item.item_id}`}</div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.codigo || "-"}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                        item.tipo_item === "Ingrediente" ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" :
                        item.tipo_item === "Material" ? "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" :
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      )}
                    >
                      {item.tipo_item === "Ingrediente" ? <Apple size={10} /> :
                       item.tipo_item === "Material" ? <Wrench size={10} /> :
                       <Package size={10} />}
                      {item.tipo_item}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-bold">
                    {item.quantidade_solicitada} <span className="text-[10px] font-semibold text-gray-400 uppercase">{item.unidade_medida || "un"}</span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {req.estado === "Pendente" && isArmazemOrAdmin ? (
                      <input
                        type="number"
                        step="any"
                        value={approvedQuantities[item.id] ?? ""}
                        onChange={(e) =>
                          setApprovedQuantities({
                            ...approvedQuantities,
                            [item.id]: Number(e.target.value)
                          })
                        }
                        className="w-20 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-2 py-1 rounded font-bold text-center text-xs outline-none focus:border-primary shadow-inner"
                      />
                    ) : (
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {item.quantidade_aprovada} {item.unidade_medida || "un"}
                      </span>
                    )}
                  </td>
                  {req.estado !== "Pendente" && (
                    <td className="px-5 py-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {item.quantidade_entregue} {item.unidade_medida || "un"}
                    </td>
                  )}
                  {req.estado === "Encerrada" && (
                    <>
                      <td className="px-5 py-4 text-center">
                        {item.tipo_item === "Material" ? (
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            {item.quantidade_devolvida || 0} un
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {item.tipo_item === "Material" ? (
                          <span className="font-bold text-rose-500">
                            {(Number(item.quantidade_danificada) || 0) + (Number(item.quantidade_perdida) || 0)} un
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-5 py-4 text-xs text-gray-500 italic">
                    {item.observacao || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          WORKFLOW ACTIONS DEPENDING ON ACTIVE STATE
          ========================================== */}

      {/* Pendente: Let Admin / Armazém Approve */}
      {req.estado === "Pendente" && (
        <div className="bg-gray-50 dark:bg-gray-800/20 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-blue-500" size={24} />
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider text-gray-800 dark:text-gray-200">
                Aprovação da Requisição
              </h4>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">
                Defina as quantidades autorizadas a sair do armazém
              </p>
            </div>
          </div>
          {isArmazemOrAdmin ? (
            <div className="flex justify-between items-center gap-4 pt-2">
              <span className="text-xs text-gray-500 font-medium">
                Reveja os campos acima e altere caso queira aprovar parcialmente.
              </span>
              <button
                onClick={handleApproveSubmit}
                disabled={isProcessing}
                className="bg-primary hover:bg-primary-hover text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95 shrink-0"
              >
                {isProcessing ? "A processar..." : "Confirmar e Aprovar Ficha"}
              </button>
            </div>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
              Apenas utilizadores com cargos de Administrador ou Armazém podem aprovar requisições.
            </p>
          )}
        </div>
      )}

      {/* Aprovada: Confirm Delivery & Inventory Deduction */}
      {req.estado === "Aprovada" && (
        <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/10 space-y-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-emerald-500" size={24} />
            <div>
              <h4 className="font-black text-xs uppercase tracking-wider text-gray-800 dark:text-gray-200">
                Registo de Entrega (Baixa Física no Stock)
              </h4>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">
                Os artigos sairão fisicamente do armazém e baixarão as quantidades disponíveis
              </p>
            </div>
          </div>
          {isArmazemOrAdmin ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                  Anotação / Nota de Entrega
                </label>
                <input
                  type="text"
                  value={deliveryObservation}
                  onChange={(e) => setDeliveryObservation(e.target.value)}
                  placeholder="Ex: Entrega efetuada sem anomalias no ato de levantamento"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3 py-2.5 rounded-xl text-xs font-semibold outline-none focus:border-primary shadow-sm"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleDeliverySubmit}
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95"
                >
                  {isProcessing ? "A processar..." : "Confirmar Entrega e Dar Baixa de Stock"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
              Apenas operadores do Armazém ou Administradores podem despachar e registar entregas.
            </p>
          )}
        </div>
      )}

      {/* Em Uso: Let controllers manage Material Returns or final Closure */}
      {req.estado === "Em Uso" && (
        <div className="space-y-6">
          {/* Detailed Reusable Materials returns logger */}
          {req.itens?.some((i: any) => i.tipo_item === "Material") && (
            <div className="bg-blue-500/5 p-5 rounded-2xl border border-blue-500/10 space-y-4">
              <div className="flex items-center gap-3">
                <RotateCcw className="text-blue-500" size={24} />
                <div>
                  <h4 className="font-black text-xs uppercase tracking-wider text-gray-800 dark:text-gray-200">
                    Registo de Devoluções de Materiais Reutilizáveis
                  </h4>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">
                    Controlo de devoluções no final do turno (Tabuleiros, Utensílios, Recipientes)
                  </p>
                </div>
              </div>

              {canDevolve ? (
                <div className="space-y-4 pt-2">
                  {req.itens
                    ?.filter((item: any) => item.tipo_item === "Material")
                    .map((item: any) => {
                      const dev = devolucoes[item.id] || {
                        quantidade_devolvida: 0,
                        quantidade_danificada: 0,
                        quantidade_perdida: 0,
                        observacao: "",
                        justificacao: ""
                      };
                      const hasIssues = (dev.quantidade_danificada || 0) > 0 || (dev.quantidade_perdida || 0) > 0;

                      return (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 p-4 rounded-xl space-y-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-800/60 pb-2">
                            <span className="font-bold text-xs text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                              <Wrench size={12} className="text-blue-500" />
                              {item.nome}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase font-bold">
                              Entregues: {item.quantidade_entregue} {item.unidade_medida || "un"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                                Devolvido em Bom Estado
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={item.quantidade_entregue}
                                value={dev.quantidade_devolvida}
                                onChange={(e) =>
                                  setDevolucoes({
                                    ...devolucoes,
                                    [item.id]: { ...dev, quantidade_devolvida: Number(e.target.value) }
                                  })
                                }
                                className="w-full bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-800 px-2 py-1.5 rounded-lg font-bold text-xs outline-none focus:border-primary shadow-inner"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest block">
                                Quantidade Danificada
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={item.quantidade_entregue}
                                value={dev.quantidade_danificada}
                                onChange={(e) =>
                                  setDevolucoes({
                                    ...devolucoes,
                                    [item.id]: { ...dev, quantidade_danificada: Number(e.target.value) }
                                  })
                                }
                                className="w-full bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-800 px-2 py-1.5 rounded-lg font-bold text-xs outline-none focus:border-primary shadow-inner"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">
                                Quantidade Perdida
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={item.quantidade_entregue}
                                value={dev.quantidade_perdida}
                                onChange={(e) =>
                                  setDevolucoes({
                                    ...devolucoes,
                                    [item.id]: { ...dev, quantidade_perdida: Number(e.target.value) }
                                  })
                                }
                                className="w-full bg-gray-50 dark:bg-surface-dark border border-gray-200 dark:border-gray-800 px-2 py-1.5 rounded-lg font-bold text-xs outline-none focus:border-primary shadow-inner"
                              />
                            </div>
                          </div>

                          {/* Justificação - obrigatória se houver perdas/danos */}
                          {hasIssues && (
                            <div className="space-y-1 border-t border-gray-50 dark:border-gray-800/40 pt-2 animate-fade-in">
                              <label className="text-[9px] font-black text-rose-500 uppercase tracking-widest block">
                                Justificação da Ocorrência *
                              </label>
                              <input
                                type="text"
                                value={dev.justificacao}
                                onChange={(e) =>
                                  setDevolucoes({
                                    ...devolucoes,
                                    [item.id]: { ...dev, justificacao: e.target.value }
                                  })
                                }
                                required
                                placeholder="Indique a causa (Ex: Um tabuleiro caiu e entortou na prensa do forno)"
                                className="w-full bg-rose-500/5 border border-rose-500/20 px-3 py-2 rounded-xl text-xs font-semibold outline-none focus:border-rose-500 shadow-sm"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleDevolucaoSubmit}
                      disabled={isProcessing}
                      className="bg-primary hover:bg-primary-hover text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl shadow-md transition-all disabled:opacity-50 active:scale-95"
                    >
                      {isProcessing ? "A processar..." : "Registar Devoluções e perdas"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                  Apenas controladores de materiais, operadores ou administradores podem registar devoluções.
                </p>
              )}
            </div>
          )}

          {/* Final Closure button block */}
          {isArmazemOrAdmin && (
            <div className="bg-gray-900 dark:bg-surface-dark text-white p-5 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider">
                  Encerramento Definitivo da Ficha
                </h4>
                <p className="text-[10px] text-gray-400 uppercase font-semibold mt-0.5">
                  Terminar o processo de requisição física. Qualquer material pendente gera quebra automática.
                </p>
              </div>
              <button
                onClick={handleEncerraSubmit}
                disabled={isProcessing}
                className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-md active:scale-95"
              >
                {isProcessing ? "A encerrar..." : "Encerrar Requisição"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Close button at the very bottom */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={onClose}
          className="px-6 py-3 font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition uppercase text-[10px] active:scale-95 border-2 border-gray-100 dark:border-gray-800 rounded-xl"
        >
          Fechar Visualização
        </button>
      </div>
    </div>
  );
}

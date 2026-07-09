import React, { useState } from "react";
import { Package, Wrench, Sparkles, HelpCircle, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import {
  requestService,
  materialService,
  shiftService,
  productService,
} from "../../services";
import { cn } from "../../lib/utils";
import Swal from "sweetalert2";
import { SearchableSelect } from "../../components/Common/SearchableSelect";

export function CreateRequisitionForm({
  onCancel,
  onSubmit,
  createMutation,
}: {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  createMutation: any;
}) {
  const [tipo, setTipo] = useState<"Inicial" | "Complementar">("Inicial");
  const [sector, setSector] = useState<"Cozinha" | "Pastelaria">("Cozinha");
  const [turnoId, setTurnoId] = useState<number | "">("");
  const [observacoes, setObservacoes] = useState(
    "Necessário para a produção do dia. Prioridade nos ingredientes."
  );
  const [items, setItems] = useState<any[]>([]);

  // Fetch lists to populate options
  const { data: consumiveisResp } = useQuery({
    queryKey: ["products-consumivel"],
    queryFn: () =>
      productService.getAll({
        page: 1,
        per_page: 1000,
        tipo: "Consumivel",
        ativo: true,
        have_stock: true,
      }),
  });

  const { data: revendaResp } = useQuery({
    queryKey: ["products-revenda"],
    queryFn: () =>
      productService.getAll({
        page: 1,
        per_page: 1000,
        tipo: "Revenda",
        ativo: true,
        have_stock: true,
      }),
  });

  const { data: materialsResp } = useQuery({
    queryKey: ["materials"],
    queryFn: () =>
      materialService.getAll({
        per_page: 1000,
        is_active: "true",
        have_stock: "true",
      }),
  });

  const { data: shiftsResponse } = useQuery({
    queryKey: ["shifts"],
    queryFn: () => shiftService.getAll({ per_page: 100 }),
  });

  const consumiveisList = consumiveisResp?.items || [];
  const revendaList = revendaResp?.items || [];
  const materialsList = materialsResp?.items || [];
  const shifts = shiftsResponse?.items || [];

  const handleSuggest = async () => {
    try {
      toast.info("A consultar planeamento diário de produção...");
      const suggestRes = await requestService.getSugestao({ sector });
      const suggestedItens = Array.isArray(suggestRes)
        ? suggestRes
        : suggestRes?.itens || suggestRes?.items || [];

      if (suggestedItens.length === 0) {
        Swal.fire(
          "Sem Sugestões",
          "Não há Ordens de Produção agendadas para hoje neste setor ou já foram todas requisitadas.",
          "info"
        );
        return;
      }

      const mapped = suggestedItens.map((s: any) => {
        let tipoUi = "Consumivel";
        if (s.tipo_item === "Material") tipoUi = "Material";
        else if (s.tipo_item === "Revenda") tipoUi = "Revenda";

        return {
          tipo_ui: tipoUi,
          item_id: s.item_id,
          quantidade_solicitada:
            s.quantidade_sugerida || s.quantidade_necessaria || 1,
          observacao: s.observacao || "Sugestão automática da produção do dia",
        };
      });

      setItems(mapped);
      toast.success(`Carregadas ${mapped.length} sugestões para hoje!`);
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível gerar sugestões automáticas.");
    }
  };

  const addItemRow = (type: "Consumivel" | "Revenda" | "Material") => {
    setItems([
      ...items,
      {
        tipo_ui: type,
        item_id: "",
        quantidade_solicitada: 1,
        observacao: "",
      },
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

    const missingFields = items.some(
      (item) => !item.item_id || !item.quantidade_solicitada
    );
    if (missingFields) {
      toast.error(
        "Preencha todos os campos e quantidades dos artigos listados."
      );
      return;
    }

    const payload = {
      tipo,
      sector,
      turno_id: turnoId === "" ? null : Number(turnoId),
      observacoes,
      itens: items.map((item) => ({
        tipo_item: item.tipo_ui === "Material" ? "Material" : "Consumivel",
        item_id: Number(item.item_id),
        quantidade_solicitada: Number(item.quantidade_solicitada),
        observacao: item.observacao || "",
      })),
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
            onChange={(e) =>
              setTurnoId(e.target.value ? Number(e.target.value) : "")
            }
            className="w-full bg-gray-50 dark:bg-surface-dark border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-4 py-2.5 rounded-xl outline-none font-bold text-xs uppercase tracking-wider text-gray-900 dark:text-white transition-all shadow-inner"
          >
            <option value="">Selecione o Turno</option>
            {shifts.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.nome} ({s.hora_inicio?.slice(0, 5)} -{" "}
                {s.hora_fim?.slice(0, 5)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Observations Textarea */}
      <div className="space-y-1">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
          Anotações / Observações Gerais / Destino
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
      <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div>
            <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Artigos Solicitados
            </h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-tight">
              Adicione os materiais ou consumíveis que deseja levantar do
              armazém
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={handleSuggest}
              className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 shadow-sm border border-primary/20"
            >
              <Sparkles size={12} /> Sugerir Planeamento
            </button>
            <button
              type="button"
              onClick={() => addItemRow("Consumivel")}
              className="bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500 dark:hover:bg-amber-500 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 border border-amber-500/20"
            >
              <Package size={12} /> + Consumível
            </button>
            <button
              type="button"
              onClick={() => addItemRow("Revenda")}
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 border border-emerald-500/20"
            >
              <Package size={12} /> + Revenda
            </button>
            <button
              type="button"
              onClick={() => addItemRow("Material")}
              className="bg-blue-500/10 text-blue-700 dark:text-blue-400 hover:bg-blue-500 dark:hover:bg-blue-500 hover:text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 border border-blue-500/20"
            >
              <Wrench size={12} /> + Material
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="py-16 border-2 border-dashed border-gray-100 dark:border-gray-800/80 rounded-2xl text-center text-gray-400 font-bold uppercase tracking-widest text-[10px] flex flex-col items-center justify-center gap-3">
            <HelpCircle size={32} className="text-gray-300" />
            Adicione artigos manualmente ou utilize a sugestão inteligente
            baseada no planeamento do dia.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              // Get appropriate list of options based on type
              let options: any[] = [];
              if (item.tipo_ui === "Consumivel") options = consumiveisList;
              else if (item.tipo_ui === "Material") options = materialsList;
              else if (item.tipo_ui === "Revenda") options = revendaList;

              const selectedDetails = options.find(
                (o) => Number(o.id) === Number(item.item_id)
              );

              const optionsMapped = options
                .filter(
                  (opt) =>
                    opt.tipo === "Reutilizavel" ||
                    opt.tipo === "Consumivel" ||
                    opt.tipo === "Revenda"
                )
                .map((opt) => {
                  const stock = opt.stock_atual ?? opt.quantidade_total ?? 0;
                  const unidade = opt.unidade_medida_sigla
                    ? ` ${opt.unidade_medida_sigla}`
                    : "";

                  return {
                    id: opt.id,
                    label: `${opt.nome} - Qtd: ${Number(stock)}${unidade}`,
                  };
                });

              return (
                <div
                  key={idx}
                  className="flex flex-col md:flex-row md:items-center gap-3 bg-gray-50 dark:bg-surface-dark p-4 rounded-2xl border border-gray-100 dark:border-gray-800 group relative transition-all focus-within:z-50 hover:z-40"
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 self-start md:self-center shadow-sm border",
                      item.tipo_ui === "Consumivel"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/10"
                        : item.tipo_ui === "Material"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/10"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/10"
                    )}
                  >
                    {item.tipo_ui === "Material" ? (
                      <Wrench size={14} />
                    ) : (
                      <Package size={14} />
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-12 gap-3">
                    {/* Item dropdown */}
                    <div className="col-span-12 md:col-span-5">
                      <SearchableSelect
                        options={optionsMapped}
                        value={item.item_id}
                        onChange={(val) => updateItemRow(idx, "item_id", val)}
                        placeholder={`Selecione o ${item.tipo_ui}...`}
                      />
                    </div>

                    {/* Quantity requested input */}
                    <div className="col-span-6 md:col-span-3">
                      {/* Campo de quantidade solicitada */}
                      <div className="relative mt-0">
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          placeholder="Qtd Solicitada"
                          value={item.quantidade_solicitada}
                          onChange={(e) =>
                            updateItemRow(
                              idx,
                              "quantidade_solicitada",
                              Number(e.target.value)
                            )
                          }
                          className={`w-full bg-white dark:bg-gray-900 border pl-3 pr-12 py-2 rounded-xl text-xs font-bold outline-none shadow-sm
                                ${
                                selectedDetails &&
                                item.quantidade_solicitada > selectedDetails.stock_atual
                                    ? "border-rose-500 focus:border-rose-500"
                                    : "border-gray-200 dark:border-gray-800 focus:border-primary"
                                }`}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase">
                          {selectedDetails?.unidade_medida_sigla || "un"}
                        </span>
                        {/* Aviso de erro */}
                      {selectedDetails &&
                        item.quantidade_solicitada >
                          selectedDetails.stock_atual && (
                          <p className="text-rose-500 text-[10px] font-bold mt-1">
                            Quantidade maior que disponível!
                          </p>
                        )}
                      </div>

                      
                    </div>

                    {/* Observação da linha */}
                    <div className="col-span-6 md:col-span-4 mt-0">
                      <input
                        type="text"
                        placeholder="Observação da linha..."
                        value={item.observacao}
                        onChange={(e) =>
                          updateItemRow(idx, "observacao", e.target.value)
                        }
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

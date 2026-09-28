import React, { useState, useEffect, useMemo } from "react";
import { Package, Wrench, Sparkles, HelpCircle, Trash2, AlertCircle, AlertTriangle, CheckCircle2, Ban } from "lucide-react";
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
import { SearchableSelect, SearchableSelectOption } from "../../components/Common/SearchableSelect";
import { useAuth } from "../../components/AuthContext";

export function CreateRequisitionForm({
  onCancel,
  onSubmit,
  createMutation,
}: {
  onCancel: () => void;
  onSubmit: (data: any) => void;
  createMutation: any;
}) {
  const { user } = useAuth();
  const [tipo, setTipo] = useState<"Inicial" | "Complementar">("Inicial");
  const [sector, setSector] = useState<"Cozinha" | "Pastelaria">("Cozinha");
  const [turnoId, setTurnoId] = useState<number | "">("");
  const [observacoes, setObservacoes] = useState(
    "Necessário para a produção do dia. Prioridade nos ingredientes."
  );
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      if (user.role === "Pastelaria") {
        setSector("Pastelaria");
      } else if (user.role === "Cozinha") {
        setSector("Cozinha");
      }
    }
  }, [user]);

  // Fetch lists to populate options
  const { data: allProductsResp } = useQuery({
    queryKey: ["products-for-requisitions"],
    queryFn: () => productService.getAll({ per_page: 5000 }),
  });

  const { data: materialsResp } = useQuery({
    queryKey: ["materials-for-requisitions"],
    queryFn: () => materialService.getAll({ per_page: 5000 }),
  });

  const { data: shiftsResponse } = useQuery({
    queryKey: ["shifts"],
    queryFn: () => shiftService.getAll({ per_page: 100 }),
  });

  const allProdsList = allProductsResp?.items || (Array.isArray(allProductsResp) ? allProductsResp : []);
  const materialsList = materialsResp?.items || (Array.isArray(materialsResp) ? materialsResp : []);
  const shifts = shiftsResponse?.items || [];

  const consumiveisList = useMemo(() => {
    const filtered = allProdsList.filter((p: any) => {
      const t = String(p.tipo || p.tipo_produto || '').toLowerCase();
      return t.includes("consum") || t.includes("ingrediente") || p.servico === "ABASTECIMENTO" || !p.tipo;
    });
    return filtered.length > 0 ? filtered : allProdsList;
  }, [allProdsList]);

  const revendaList = useMemo(() => {
    const filtered = allProdsList.filter((p: any) => {
      const t = String(p.tipo || p.tipo_produto || '').toLowerCase();
      return t.includes("revenda") || p.servico === "BAR";
    });
    return filtered.length > 0 ? filtered : allProdsList;
  }, [allProdsList]);

  // Helper para obter detalhes de um item
  const getItemDetails = (item: any) => {
    if (!item?.item_id) return null;
    const list =
      item.tipo_ui === "Material"
        ? materialsList
        : item.tipo_ui === "Revenda"
        ? revendaList
        : consumiveisList;
    return list.find((o: any) => Number(o.id) === Number(item.item_id)) || null;
  };

  // Helper para obter o stock disponível com segurança de tipo
  const getItemStock = (item: any, detailsOverride?: any) => {
    const details = detailsOverride || getItemDetails(item);
    if (!details) return 0;
    if (item.tipo_ui === "Material") {
      return Math.max(
        0,
        Number(
          details.quantidade_disponivel ??
            details.quantidade_total ??
            details.stock_atual ??
            details.quantidade ??
            0
        )
      );
    }
    return Math.max(
      0,
      Number(
        details.stock_atual ??
          details.quantidade ??
          details.quantidade_total ??
          0
      )
    );
  };

  // Gerador de opções para o SearchableSelect com bloqueio de artigos sem stock
  const getOptionsForType = (tipoUi: "Consumivel" | "Revenda" | "Material"): SearchableSelectOption[] => {
    const list =
      tipoUi === "Material"
        ? materialsList
        : tipoUi === "Revenda"
        ? revendaList
        : consumiveisList;

    return list.map((opt: any) => {
      let stock = 0;
      if (tipoUi === "Material") {
        stock = Math.max(
          0,
          Number(
            opt.quantidade_disponivel ??
              opt.quantidade_total ??
              opt.stock_atual ??
              opt.quantidade ??
              0
          )
        );
      } else {
        stock = Math.max(
          0,
          Number(opt.stock_atual ?? opt.quantidade ?? opt.quantidade_total ?? 0)
        );
      }

      const sigla = opt.unidade_medida_sigla || opt.unidade_medida || "un";
      const nomeItem = opt.nome || opt.descricao || `Item #${opt.id}`;
      const isOutOfStock = stock <= 0;

      return {
        id: opt.id,
        label: nomeItem,
        sublabel: opt.codigo ? `Cód: ${opt.codigo}` : undefined,
        disabled: isOutOfStock,
        disabledReason: `O artigo "${nomeItem}" está sem stock disponível no armazém e não pode ser selecionado.`,
        stock: stock,
        unidade: sigla,
      };
    });
  };

  // Validação em tempo real das linhas
  const itemValidationList = useMemo(() => {
    return items.map((item) => {
      if (!item.item_id) {
        return { hasItem: false, stock: 0, hasExceeded: false, isZero: false, nome: "", sigla: "un" };
      }
      const details = getItemDetails(item);
      const stock = getItemStock(item, details);
      const qtd = Number(item.quantidade_solicitada) || 0;
      const sigla = details?.unidade_medida_sigla || details?.unidade_medida || "un";
      const nome = details?.nome || details?.descricao || `Artigo #${item.item_id}`;

      const isZero = stock <= 0;
      const hasExceeded = qtd > stock;

      return {
        hasItem: true,
        stock,
        qtd,
        isZero,
        hasExceeded,
        nome,
        sigla,
      };
    });
  }, [items, materialsList, revendaList, consumiveisList]);

  // Se houver qualquer erro de stock, bloqueia submissão
  const hasStockErrors = useMemo(() => {
    return itemValidationList.some((v) => v.hasItem && (v.isZero || v.hasExceeded || v.qtd <= 0));
  }, [itemValidationList]);

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

      const validSuggested: any[] = [];
      let outOfStockIgnored = 0;
      let clampedCount = 0;

      suggestedItens.forEach((s: any) => {
        let tipoUi: "Consumivel" | "Material" | "Revenda" = "Consumivel";
        if (s.tipo_item === "Material") tipoUi = "Material";
        else if (s.tipo_item === "Revenda") tipoUi = "Revenda";

        const list =
          tipoUi === "Material"
            ? materialsList
            : tipoUi === "Revenda"
            ? revendaList
            : consumiveisList;
        const details = list.find((o: any) => Number(o.id) === Number(s.item_id));

        let stock = 0;
        if (details) {
          if (tipoUi === "Material") {
            stock = Math.max(
              0,
              Number(
                details.quantidade_disponivel ??
                  details.quantidade_total ??
                  details.stock_atual ??
                  details.quantidade ??
                  0
              )
            );
          } else {
            stock = Math.max(
              0,
              Number(
                details.stock_atual ??
                  details.quantidade ??
                  details.quantidade_total ??
                  0
              )
            );
          }
        }

        // Se o artigo estiver sem stock, ignoramos para não poluir a requisição com artigos impossíveis
        if (stock <= 0) {
          outOfStockIgnored++;
          return;
        }

        const suggestedQtd = Number(s.quantidade_sugerida || s.quantidade_necessaria || 1);
        const finalQtd = Math.min(suggestedQtd, stock);
        if (finalQtd < suggestedQtd) {
          clampedCount++;
        }

        validSuggested.push({
          tipo_ui: tipoUi,
          item_id: s.item_id,
          quantidade_solicitada: finalQtd,
          observacao: s.observacao || "Sugestão automática da produção do dia",
        });
      });

      if (validSuggested.length === 0) {
        Swal.fire(
          "Artigos Esgotados",
          "Todos os artigos planeados para a produção de hoje encontram-se atualmente sem stock disponível no armazém.",
          "warning"
        );
        return;
      }

      setItems(validSuggested);

      let msg = `Carregadas ${validSuggested.length} sugestões de produção.`;
      if (outOfStockIgnored > 0) {
        msg += ` (${outOfStockIgnored} artigo(s) sem stock foram ignorados).`;
      }
      if (clampedCount > 0) {
        msg += ` (${clampedCount} quantidade(s) ajustadas ao stock disponível).`;
      }
      toast.success(msg);
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

  const handleSelectItem = (idx: number, selectedId: string | number) => {
    const currentItem = items[idx];
    const list =
      currentItem.tipo_ui === "Material"
        ? materialsList
        : currentItem.tipo_ui === "Revenda"
        ? revendaList
        : consumiveisList;
    const details = list.find((o: any) => Number(o.id) === Number(selectedId));

    if (!details) {
      updateItemRow(idx, "item_id", selectedId);
      return;
    }

    const stock = getItemStock(currentItem, details);
    const sigla = details.unidade_medida_sigla || details.unidade_medida || "un";
    const nome = details.nome || details.descricao || `Item #${details.id}`;

    if (stock <= 0) {
      toast.warn(`O artigo "${nome}" está esgotado no armazém (0 ${sigla} disponíveis) e não pode ser selecionado.`);
      return;
    }

    // Se a quantidade atual for maior que o stock do novo item, ajusta automaticamente
    const currentQtd = Number(currentItem.quantidade_solicitada) || 1;
    const newQtd = currentQtd > stock ? stock : currentQtd > 0 ? currentQtd : 1;

    setItems((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              item_id: selectedId,
              quantidade_solicitada: newQtd,
            }
          : item
      )
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Por favor, adicione pelo menos um artigo à requisição.");
      return;
    }

    const missingFields = items.some(
      (item) => !item.item_id || !item.quantidade_solicitada || Number(item.quantidade_solicitada) <= 0
    );
    if (missingFields) {
      toast.error(
        "Preencha todos os artigos e certifique-se de que todas as quantidades solicitadas são superiores a zero."
      );
      return;
    }

    // Validação rigorosa de stock: nenhuma requisição pode exceder a quantidade disponível
    for (let i = 0; i < items.length; i++) {
      const v = itemValidationList[i];
      if (v.isZero) {
        Swal.fire({
          icon: "error",
          title: "Artigo Sem Stock",
          text: `O artigo "${v.nome}" não tem unidades disponíveis no armazém. Remova este artigo da lista para prosseguir.`,
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }
      if (v.hasExceeded) {
        Swal.fire({
          icon: "warning",
          title: "Quantidade Superior ao Disponível",
          html: `Não é possível requisitar <b>${v.qtd} ${v.sigla}</b> do artigo <b>"${v.nome}"</b>.<br/><br/>O armazém tem apenas <b>${v.stock} ${v.sigla}</b> em stock disponível.<br/><br/>Por favor ajuste a quantidade solicitada para um valor até <b>${v.stock} ${v.sigla}</b>.`,
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }
    }

    const payload = {
      tipo,
      sector,
      turno_id: turnoId === "" ? null : Number(turnoId),
      observacoes,
      itens: items.map((item) => ({
        tipo_item: item.tipo_ui === "Material" ? "Material" : item.tipo_ui === "Revenda" ? "Revenda" : "Consumivel",
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
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
            <span>Setor Requerente</span>
            {!(user?.role === "Administrador" || user?.role === "Armazém" || user?.role === "Controlador de Materiais") && (
              <span className="text-[9px] font-bold text-amber-500 lowercase normal-case tracking-normal">
                (Predefinido pelo perfil)
              </span>
            )}
          </label>
          {user?.role === "Administrador" || user?.role === "Armazém" || user?.role === "Controlador de Materiais" ? (
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
          ) : (
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-xl font-bold text-xs text-gray-800 dark:text-gray-200 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              {sector}
            </div>
          )}
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
      <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div>
            <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Artigos Solicitados</span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                Validação de Stock Ativa
              </span>
            </h3>
            <p className="text-[10px] text-gray-400 uppercase tracking-tight">
              Apenas artigos com stock disponível podem ser requisitados (limite máximo validado).
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
            Adicione artigos manualmente ou utilize a sugestão inteligente baseada no planeamento do dia.
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const validation = itemValidationList[idx];
              const options = getOptionsForType(item.tipo_ui);
              const hasItem = validation.hasItem;
              const stock = validation.stock;
              const sigla = validation.sigla;
              const hasExceeded = validation.hasExceeded;
              const isZero = validation.isZero;

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col md:flex-row md:items-start gap-3 p-4 rounded-2xl border transition-all focus-within:z-50 hover:z-40",
                    hasExceeded
                      ? "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60"
                      : isZero
                      ? "bg-gray-100/60 dark:bg-gray-800/40 border-rose-300 dark:border-rose-900/60"
                      : "bg-gray-50 dark:bg-surface-dark border-gray-100 dark:border-gray-800"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 self-start md:self-center shadow-sm border mt-1 md:mt-0",
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
                        options={options}
                        value={item.item_id}
                        onChange={(val) => handleSelectItem(idx, val)}
                        placeholder={`Selecione o ${item.tipo_ui}...`}
                      />
                    </div>

                    {/* Quantity requested input */}
                    <div className="col-span-6 md:col-span-3">
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min={stock > 0 ? "0.01" : "0"}
                          max={stock > 0 ? stock : undefined}
                          disabled={!hasItem || isZero}
                          placeholder="Qtd Solicitada"
                          value={item.quantidade_solicitada}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            updateItemRow(idx, "quantidade_solicitada", val);
                          }}
                          onBlur={(e) => {
                            const val = Number(e.target.value) || 0;
                            if (stock > 0 && val > stock) {
                              toast.warn(
                                `Quantidade de "${validation.nome}" ajustada para o máximo em stock (${stock} ${sigla}).`
                              );
                              updateItemRow(idx, "quantidade_solicitada", stock);
                            } else if (val <= 0 && stock > 0) {
                              updateItemRow(idx, "quantidade_solicitada", 1);
                            }
                          }}
                          className={cn(
                            "w-full bg-white dark:bg-gray-900 border pl-3 pr-11 py-2 rounded-xl text-xs font-bold outline-none shadow-sm transition-all",
                            hasExceeded
                              ? "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30"
                              : isZero
                              ? "border-rose-300 bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                              : "border-gray-200 dark:border-gray-800 focus:border-primary text-gray-900 dark:text-white"
                          )}
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase pointer-events-none">
                          {sigla}
                        </span>
                      </div>

                      {/* Feedback visual de stock por linha */}
                      {hasItem && (
                        <div className="mt-1">
                          {isZero ? (
                            <p className="text-rose-600 dark:text-rose-400 text-[10px] font-bold flex items-center gap-1">
                              <Ban size={11} className="shrink-0" />
                              Artigo esgotado (0 {sigla})
                            </p>
                          ) : hasExceeded ? (
                            <div className="flex items-center justify-between text-[10px] text-rose-600 dark:text-rose-400 font-bold gap-1">
                              <span className="truncate flex items-center gap-1">
                                <AlertTriangle size={11} className="shrink-0" />
                                Máx: {stock} {sigla}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateItemRow(idx, "quantidade_solicitada", stock)}
                                className="shrink-0 text-primary hover:underline font-black uppercase text-[9px] bg-primary/10 px-1.5 py-0.5 rounded"
                                title="Ajustar automaticamente para a quantidade máxima disponível"
                              >
                                Usar Máx ({stock})
                              </button>
                            </div>
                          ) : (
                            <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-medium flex items-center gap-1">
                              <CheckCircle2 size={11} className="shrink-0" />
                              Disponível: <span className="font-bold">{stock} {sigla}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Observação da linha */}
                    <div className="col-span-6 md:col-span-4">
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
                    className="p-2 text-gray-300 hover:text-rose-500 transition self-end md:self-center hover:bg-rose-500/5 rounded-lg mt-1 md:mt-0"
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

      {/* Alerta Geral se houver linhas com problemas de stock */}
      {hasStockErrors && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-300 animate-fade-in">
          <AlertCircle size={18} className="text-rose-600 dark:text-rose-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold block">Atenção ao Limite de Stock:</span>
            Existem artigos com quantidades solicitadas superiores ao stock disponível no armazém ou artigos esgotados. Ajuste as quantidades ou remova os artigos esgotados para submeter.
          </div>
        </div>
      )}

      {/* Action Footer buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
        <div className="text-[11px] text-gray-500">
          {items.length > 0 && (
            <span>
              {items.length} artigo(s) adicionado(s) · {hasStockErrors ? (
                <span className="text-rose-600 font-bold">Requer correção de stock</span>
              ) : (
                <span className="text-emerald-600 font-bold">Validação de stock conforme</span>
              )}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 font-black text-gray-500 uppercase tracking-widest hover:text-gray-900 dark:hover:text-white transition-colors text-[10px] active:scale-95"
          >
            Cancelar Operação
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || hasStockErrors}
            className={cn(
              "px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all shadow-xl text-[10px] active:scale-95",
              hasStockErrors
                ? "bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed shadow-none"
                : "bg-primary hover:bg-primary-hover text-white shadow-primary/20 disabled:opacity-50"
            )}
          >
            {createMutation.isPending
              ? "A submeter..."
              : hasStockErrors
              ? "Corrija as Quantidades"
              : "Submeter Requisição"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default CreateRequisitionForm;

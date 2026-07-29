import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productionService, productService } from "../services";
import { Play, CheckCircle, Clock, ChefHat, Timer, AlertCircle, Undo2, Utensils, Cake, Wine, CheckCheck, User, Filter } from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "react-toastify";

type SectorType = "Todos" | "Cozinha" | "Pastelaria" | "Bar";

export default function Producao() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());
  const [selectedSector, setSelectedSector] = useState<SectorType>("Todos");

  // Update clock every minute for time-based alerts
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ["production-orders", selectedSector],
    queryFn: () => productionService.getAll({ 
      sector: selectedSector !== "Todos" ? selectedSector : undefined, 
      per_page: 500 
    }),
    refetchInterval: 10000, // Real-time polling
  });

  const { data: productsResponse } = useQuery({
    queryKey: ["products"],
    queryFn: () => productService.getAll({ per_page: 5000 }),
  });

  const orders = ordersResponse?.items || [];
  const products = productsResponse?.items || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string | number; estado: string }) =>
      productionService.updateEstado(id, estado),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      const estadoVisivel = 
        variables.estado === "Em Producao" ? "Em Produção" : 
        variables.estado === "Entregue" ? "Entregue / Concluído" : variables.estado;
      toast.success(`Ordem #${variables.id} movida para: ${estadoVisivel}`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Erro ao atualizar ordem de produção.");
    }
  });

  const handleUpdateStatus = (id: string | number, novoEstado: string) => {
    updateStatusMutation.mutate({ id, estado: novoEstado });
  };

  const productionOrders = orders || [];
  const normalizeEstadoProducao = (estado: any) => {
    const raw = String(estado?.value || estado || "").trim();
    const key = raw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[\s-]+/g, "_");

    if (key === "PENDENTE") return "Pendente";
    if (key === "EM_PRODUCAO" || key === "EM_PREPARACAO") return "Em Producao";
    if (key === "PRONTO") return "Pronto";
    if (key === "ENTREGUE" || key === "CONCLUIDO") return "Entregue";
    return raw;
  };
  
  // Filtering by state
  const pendentes = productionOrders.filter((o: any) => normalizeEstadoProducao(o.estado || o.status) === "Pendente");
  const emProducao = productionOrders.filter((o: any) => normalizeEstadoProducao(o.estado || o.status) === "Em Producao");
  const prontos = productionOrders.filter((o: any) => normalizeEstadoProducao(o.estado || o.status) === "Pronto");
  const entregues = productionOrders.filter((o: any) => normalizeEstadoProducao(o.estado || o.status) === "Entregue");

  // Format Helper
  const getTempoDecorrido = (dataStr: string) => {
    if (!dataStr) return { mins: 0, text: "Recente" };
    const date = new Date(dataStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return { 
      mins: diffMins, 
      text: diffMins < 1 ? "Agora" : `${diffMins} min` 
    };
  };

  const sectorIcons = {
    Cozinha: <Utensils size={16} className="text-amber-500" />,
    Pastelaria: <Cake size={16} className="text-pink-500" />,
    Bar: <Wine size={16} className="text-purple-500" />,
    Todos: <Filter size={16} className="text-gray-500" />
  };

  // Card Component for KDS
  const OrderCard = ({ order, type }: { order: any, type: 'pendente' | 'producao' | 'pronto' | 'entregue' }) => {
    const tempo = getTempoDecorrido(order.data_producao || order.created_at);
    const isAtrasado = type === 'pendente' && tempo.mins >= 15;
    const sector = order.sector || order.setor || "Cozinha";

    return (
      <div className={cn(
        "bg-white dark:bg-surface-dark p-5 rounded-xl shadow-sm border flex flex-col justify-between transition-all relative overflow-hidden",
        type === 'pendente' ? "border-l-4 border-l-gray-400 dark:border-gray-700" :
        type === 'producao' ? "border-l-4 border-l-warning" :
        type === 'pronto' ? "border-l-4 border-l-secondary" :
        "border-l-4 border-l-emerald-500 opacity-80 hover:opacity-100",
        isAtrasado ? "border-error ring-1 ring-error/50 shadow-error/20 animate-pulse-slow" : ""
      )}>
        {isAtrasado && (
          <div className="absolute top-0 right-0 bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
            <AlertCircle size={10} /> ATRASO
          </div>
        )}
        
        <div>
          <div className="flex justify-between items-start mb-2">
            <span className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tight">
              #{order.numero || order.codigo || order.id}
            </span>
            <span className={cn(
              "text-xs font-bold px-2.5 py-1 rounded-md uppercase flex items-center gap-1.5",
              sector === "Cozinha" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" :
              sector === "Pastelaria" ? "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300" :
              sector === "Bar" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" :
              "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
            )}>
              {sectorIcons[sector as SectorType] || <ChefHat size={14} />}
              {sector}
            </span>
          </div>

          {order.responsavel_nome || order.responsavel_id ? (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
              <User size={12} />
              <span>Responsável: {order.responsavel_nome || `Utilizador #${order.responsavel_id}`}</span>
            </div>
          ) : null}
          
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-bold p-2 rounded-lg mb-3",
            isAtrasado ? "bg-error/10 text-error" : "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400"
          )}>
            <Clock size={14} className={isAtrasado ? "text-error" : "text-primary"}/>
            Tempo em espera: {tempo.text}
          </div>
          
          <div className="space-y-1">
            {order.observacoes && (
              <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                OBS: {order.observacoes}
              </div>
            )}
            
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Itens / Ingredientes</p>
            {(order.consumos?.length ? order.consumos : order.itens || order.items || [])?.map((item: any, idx: number) => {
              const p = products?.find((prod: any) => prod.id === (item.produto_id || item.productId));
              return (
                <div key={idx} className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate py-1 border-b border-gray-100 dark:border-gray-800 last:border-0 flex justify-between items-center">
                  <span>
                    <span className="text-primary font-black mr-2">{item.quantidade || item.quantity || 1}x</span> 
                    {p ? p.nome : item.nome_produto || item.nome || item.descricao || 'Item de Produção'}
                  </span>
                  {item.unidade ? <span className="text-xs text-gray-400 font-normal">{item.unidade}</span> : null}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
          {type === 'pendente' && (
            <button 
              onClick={() => handleUpdateStatus(order.id, "Em Producao")}
              disabled={updateStatusMutation.isPending}
              className="w-full flex justify-center items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
              <Play size={18} /> Iniciar Preparação
            </button>
          )}
          {type === 'producao' && (
            <button 
              onClick={() => handleUpdateStatus(order.id, "Pronto")}
              disabled={updateStatusMutation.isPending}
              className="w-full flex justify-center items-center gap-2 bg-warning hover:bg-warning-hover text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-warning/30 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle size={18} /> Marcar como Pronto
            </button>
          )}
          {type === 'pronto' && (
            <div className="space-y-2">
              <button 
                onClick={() => handleUpdateStatus(order.id, "Entregue")}
                disabled={updateStatusMutation.isPending}
                className="w-full flex justify-center items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs disabled:opacity-50"
              >
                <CheckCheck size={16} /> Entregar ao Cliente / Garçom
              </button>
              <button 
                onClick={() => handleUpdateStatus(order.id, "Em Producao")}
                disabled={updateStatusMutation.isPending}
                className="w-full flex justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 py-2 rounded-xl font-medium transition-all text-xs"
              >
                <Undo2 size={14} /> Voltar para Preparação
              </button>
            </div>
          )}
          {type === 'entregue' && (
            <div className="flex items-center justify-between text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200/50">
              <span className="flex items-center gap-1"><CheckCheck size={14} /> Entregue com Sucesso</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-bold">A carregar ordens de produção por setor...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-12 min-h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <ChefHat size={32} className="text-primary bg-primary/10 p-1.5 rounded-lg" />
          KDS - Monitor de Produção por Setor
        </h1>

        {/* Sector Tabs */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl gap-1 overflow-x-auto">
          {(["Todos", "Cozinha", "Pastelaria", "Bar"] as SectorType[]).map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
                selectedSector === sec
                  ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              )}
            >
              {sectorIcons[sec]}
              {sec === "Todos" ? "Todos os Setores" : sec}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-hidden">
        
        {/* Column: Pendentes */}
        <div className="flex flex-col bg-gray-50/50 dark:bg-gray-900/20 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 bg-white/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm flex justify-between items-center">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              Fila de Espera (Pendente)
            </h2>
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs font-bold">
              {pendentes.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[70vh]">
            {pendentes.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400 font-medium">
                <ChefHat size={32} className="mb-2 opacity-20" />
                Nenhuma ordem pendente
              </div>
            ) : (
              pendentes.map((o: any) => <OrderCard key={o.id} order={o} type="pendente" />)
            )}
          </div>
        </div>

        {/* Column: Em Produção */}
        <div className="flex flex-col bg-warning/5 dark:bg-warning/5 rounded-2xl border border-warning/20 overflow-hidden">
          <div className="p-4 bg-warning/10 border-b border-warning/20 backdrop-blur-sm flex justify-between items-center">
            <h2 className="font-bold text-warning-dark dark:text-warning flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-warning animate-pulse"></span>
              Em Preparação
            </h2>
            <span className="bg-warning text-white px-2 py-0.5 rounded-full text-xs font-bold">
              {emProducao.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[70vh]">
            {emProducao.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-warning/40 font-medium">
                <Play size={32} className="mb-2 opacity-20" />
                Nada em preparação
              </div>
            ) : (
              emProducao.map((o: any) => <OrderCard key={o.id} order={o} type="producao" />)
            )}
          </div>
        </div>

        {/* Column: Prontos (Aguardam Recolha) */}
        <div className="flex flex-col bg-secondary/5 dark:bg-secondary/5 rounded-2xl border border-secondary/20 overflow-hidden">
          <div className="p-4 bg-secondary/10 border-b border-secondary/20 backdrop-blur-sm flex justify-between items-center">
            <h2 className="font-bold text-secondary-dark dark:text-secondary flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-secondary"></span>
              Prontos (Aguardam Entrega)
            </h2>
            <span className="bg-secondary text-white px-2 py-0.5 rounded-full text-xs font-bold">
              {prontos.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[70vh]">
            {prontos.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-secondary/40 font-medium">
                <CheckCircle size={32} className="mb-2 opacity-20" />
                Nenhum prato pronto
              </div>
            ) : (
              prontos.map((o: any) => <OrderCard key={o.id} order={o} type="pronto" />)
            )}
          </div>
        </div>

        {/* Column: Entregues (Concluídos) */}
        <div className="flex flex-col bg-emerald-500/5 dark:bg-emerald-500/5 rounded-2xl border border-emerald-500/20 overflow-hidden">
          <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 backdrop-blur-sm flex justify-between items-center">
            <h2 className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              Entregues / Concluídos
            </h2>
            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
              {entregues.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[70vh]">
            {entregues.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-emerald-500/40 font-medium">
                <CheckCheck size={32} className="mb-2 opacity-20" />
                Sem ordens entregues hoje
              </div>
            ) : (
              entregues.map((o: any) => <OrderCard key={o.id} order={o} type="entregue" />)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

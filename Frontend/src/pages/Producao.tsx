import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productionService, productService } from "../services";
import { Play, CheckCircle, Clock, ChefHat, Timer, AlertCircle, Undo2 } from "lucide-react";
import { cn } from "../lib/utils";
import { toast } from "react-toastify";

export default function Producao() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(new Date());

  // Update clock every minute for time-based alerts
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ["production-orders"],
    queryFn: () => productionService.getAll({ per_page: 500 }),
    refetchInterval: 15000, // Real-time polling
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
      const estadoVisivel = variables.estado === "Em Producao" ? "Em Produção" : variables.estado;
      toast.success(`Ordem movida para: ${estadoVisivel}`);
    },
    onError: () => {
      toast.error("Erro ao atualizar ordem de produção.");
    }
  });

  const handleUpdateStatus = (id: string, novoEstado: string) => {
    updateStatusMutation.mutate({ id, estado: novoEstado });
  };

  const productionOrders = orders || [];
  
  // Strict matching as requested
  const pendentes = productionOrders.filter((o: any) => o.estado === "Pendente");
  const emProducao = productionOrders.filter((o: any) => o.estado === "Em Producao");
  const prontos = productionOrders.filter((o: any) => o.estado === "Pronto");

  // Format Helper
  const getTempoDecorrido = (dataStr: string) => {
    if (!dataStr) return { mins: 0, text: "" };
    const date = new Date(dataStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return { 
      mins: diffMins, 
      text: diffMins < 1 ? "Agora" : `${diffMins} min` 
    };
  };

  // Card Component for KDS
  const OrderCard = ({ order, type }: { order: any, type: 'pendente' | 'producao' | 'pronto' }) => {
    const tempo = getTempoDecorrido(order.data_producao || order.created_at);
    const isAtrasado = type === 'pendente' && tempo.mins >= 15;

    return (
      <div className={cn(
        "bg-white dark:bg-surface-dark p-5 rounded-xl shadow-sm border flex flex-col justify-between transition-all relative overflow-hidden",
        type === 'pendente' ? "border-l-4 border-l-gray-400 dark:border-gray-700" :
        type === 'producao' ? "border-l-4 border-l-warning" :
        "border-l-4 border-l-secondary opacity-75 hover:opacity-100",
        isAtrasado ? "border-error ring-1 ring-error/50 shadow-error/20 animate-pulse-slow" : ""
      )}>
        {isAtrasado && (
          <div className="absolute top-0 right-0 bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
            <AlertCircle size={10} /> ATRASO
          </div>
        )}
        
        <div>
          <div className="flex justify-between items-start mb-3">
            <span className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tight">
              #{order.numero || order.id}
            </span>
            <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-md uppercase">
              {order.sector || "Cozinha"}
            </span>
          </div>
          
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-bold p-2 rounded-lg mb-4",
            isAtrasado ? "bg-error/10 text-error" : "bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400"
          )}>
            <Clock size={14} className={isAtrasado ? "text-error" : "text-primary"}/>
            Espera: {tempo.text}
          </div>
          
          <div className="space-y-1">
            {order.observacoes && (
              <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
                OBS: {order.observacoes}
              </div>
            )}
            
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Itens</p>
            {/* Handling both consumos or itens structure */}
            {(order.consumos?.length ? order.consumos : order.itens || order.items || [])?.map((item: any, idx: number) => {
              const p = products?.find((p:any) => p.id === (item.produto_id || item.productId));
              return (
                <div key={idx} className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-primary font-black mr-2">{item.quantidade || item.quantity}x</span> 
                  {p ? p.nome : item.nome_produto || 'Item'}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
          {type === 'pendente' && (
            <button 
              onClick={() => handleUpdateStatus(order.id, "Em Producao")}
              disabled={updateStatusMutation.isPending}
              className="w-full flex justify-center items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
            >
              <Play size={18} /> Iniciar Preparação
            </button>
          )}
          {type === 'producao' && (
            <button 
              onClick={() => handleUpdateStatus(order.id, "Pronto")}
              disabled={updateStatusMutation.isPending}
              className="w-full flex justify-center items-center gap-2 bg-warning hover:bg-warning-hover text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-warning/30 active:scale-95"
            >
              <CheckCircle size={18} /> Marcar como Pronto
            </button>
          )}
          {type === 'pronto' && (
            <button 
              onClick={() => handleUpdateStatus(order.id, "Em Producao")}
              disabled={updateStatusMutation.isPending}
              className="w-full flex justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 py-2 rounded-xl font-bold transition-all active:scale-95 text-xs"
            >
              <Undo2 size={14} /> Desfazer (Voltar p/ Produção)
            </button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500 font-bold">A sincronizar ecrã da cozinha...</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-12 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <ChefHat size={32} className="text-primary bg-primary/10 p-1.5 rounded-lg" />
          KDS - Ecrã de Cozinha
        </h1>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm font-bold bg-white dark:bg-surface-dark px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <Timer size={16} className="text-primary" /> Atualização em Tempo Real (Polling)
          </div>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-hidden">
        
        {/* Column: Pendentes */}
        <div className="flex flex-col bg-gray-50/50 dark:bg-gray-900/20 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-4 bg-white/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm flex justify-between items-center">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400"></span>
              Fila de Espera
            </h2>
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs font-bold">
              {pendentes.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {pendentes.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 font-medium">
                <ChefHat size={32} className="mb-2 opacity-20" />
                Nenhum pedido novo
              </div>
            ) : (
              pendentes.map((o: any) => <OrderCard key={o.id} order={o} type="pendente" />)
            )}
          </div>
        </div>

        {/* Column: Em Produção */}
        <div className="flex flex-col bg-warning/5 dark:bg-warning/5 rounded-2xl border border-warning/20 overflow-hidden">
          <div className="p-4 bg-warning/10 border-b border-warning/20 backdrop-blur-sm flex justify-between items-center">
            <h2 className="font-bold text-warning-dark dark:text-warning flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warning animate-pulse"></span>
              Em Preparação
            </h2>
            <span className="bg-warning text-white px-2 py-0.5 rounded-full text-xs font-bold">
              {emProducao.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {emProducao.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-warning/40 font-medium">
                <Play size={32} className="mb-2 opacity-20" />
                Nada em preparação
              </div>
            ) : (
              emProducao.map((o: any) => <OrderCard key={o.id} order={o} type="producao" />)
            )}
          </div>
        </div>

        {/* Column: Prontos (Últimos) */}
        <div className="flex flex-col bg-secondary/5 dark:bg-secondary/5 rounded-2xl border border-secondary/20 overflow-hidden">
          <div className="p-4 bg-secondary/10 border-b border-secondary/20 backdrop-blur-sm flex justify-between items-center">
            <h2 className="font-bold text-secondary-dark dark:text-secondary flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-secondary"></span>
              Prontos (Aguardam Recolha)
            </h2>
            <span className="bg-secondary text-white px-2 py-0.5 rounded-full text-xs font-bold">
              {prontos.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {prontos.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-secondary/40 font-medium">
                <CheckCircle size={32} className="mb-2 opacity-20" />
                Nenhum prato pronto
              </div>
            ) : (
              prontos.map((o: any) => <OrderCard key={o.id} order={o} type="pronto" />)
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productionService, productService } from "../services";
import { Play, CheckCircle, Clock, Truck, ChefHat, Timer } from "lucide-react";
import { cn } from "../lib/utils";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import OrderDetailsModal from "../components/OrderDetailsModal";

export default function Producao() {
  const [activeTab, setActiveTab] = useState<string>("Pendentes");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  const queryClient = useQueryClient();
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ["production-orders"],
    queryFn: () => productionService.getAll({ per_page: 500 }),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["production-orders"] });
      toast.success("Ordem de produção atualizada!");
    },
    onError: () => {
      toast.error("Erro ao atualizar ordem.");
    }
  });

  if (isLoading) return <div className="p-8 text-center text-gray-500">A carregar produção...</div>;

  const handleUpdateStatus = (id: string, currentStatus: string) => {
    updateStatusMutation.mutate({ id, estado: currentStatus });
  };

  const estadoMap: Record<string, string[]> = {
    "Pendentes": ["Pendente"],
    "Produção": ["Em Produção"],
    "Prontos": ["Pronto"],
    "Entregues": ["Entregue"],
    "Cancelados": ["Cancelado"],
  };

  const productionOrders = orders || [];
  
  const visibleOrders = productionOrders.filter((o: any) => {
    const mappedStatuses = estadoMap[activeTab] || [];
    return mappedStatuses.includes(o.estado);
  });

  // Calculate Operational Metrics
  const metricPendentes = productionOrders.filter(o => estadoMap["Pendentes"].includes(o.estado)).length;
  const metricProducao = productionOrders.filter(o => estadoMap["Produção"].includes(o.estado)).length;
  const metricProntos = productionOrders.filter(o => estadoMap["Prontos"].includes(o.estado)).length;
  const metricEntregues = productionOrders.filter(o => estadoMap["Entregues"].includes(o.estado)).length;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <ChefHat size={28} className="text-primary" />
          Painel de Produção
        </h1>
      </div>

      {/* Operational Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center">
          <Clock size={24} className="text-gray-400 mb-2" />
          <span className="text-3xl font-bold text-gray-900 dark:text-white">{metricPendentes}</span>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">Pendentes</span>
        </div>
        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-warning/30 shadow-sm flex flex-col items-center justify-center text-center">
           <Play size={24} className="text-warning mb-2" fill="currentColor" />
           <span className="text-3xl font-bold text-warning">{metricProducao}</span>
           <span className="text-xs font-semibold text-warning-dark uppercase tracking-wider mt-1">Em Produção</span>
        </div>
        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-secondary/30 shadow-sm flex flex-col items-center justify-center text-center">
           <GiftIcon size={24} className="text-secondary mb-2" />
           <span className="text-3xl font-bold text-secondary">{metricProntos}</span>
           <span className="text-xs font-semibold text-secondary-dark uppercase tracking-wider mt-1">Prontos</span>
        </div>
        <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-success/30 shadow-sm flex flex-col items-center justify-center text-center">
           <Truck size={24} className="text-success mb-2" />
           <span className="text-3xl font-bold text-success">{metricEntregues}</span>
           <span className="text-xs font-semibold text-success-dark uppercase tracking-wider mt-1">Entregues</span>
        </div>
        <div className="col-span-2 md:col-span-1 bg-primary/10 p-4 rounded-xl border border-primary/20 shadow-sm flex flex-col items-center justify-center text-center">
           <Timer size={24} className="text-primary mb-2" />
           <span className="text-2xl font-bold text-primary">~25m</span>
           <span className="text-xs font-semibold text-primary uppercase tracking-wider mt-1">T. Médio</span>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2 mt-4">
        {Object.keys(estadoMap).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "whitespace-nowrap px-6 py-3 rounded-xl text-sm font-bold transition-all flex-1 sm:flex-none text-center",
              activeTab === tab 
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md transform scale-105" 
                : "bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grid List for Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
        {visibleOrders.length === 0 ? (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 border-dashed">
            <CheckCircle size={48} className="mx-auto mb-4 opacity-20" />
            Nenhuma tarefa na fila de {activeTab}.
          </div>
        ) : (
          visibleOrders.map((order: any) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={cn(
                "bg-white dark:bg-surface-dark p-5 rounded-xl text-left shadow-sm transition-all flex flex-col justify-between border-l-4",
                 activeTab === 'Pendentes' ? "border-gray-300 dark:border-gray-700 hover:shadow-md" :
                 activeTab === 'Produção' ? "border-warning hover:shadow-warning/20 shadow-warning/5" :
                 activeTab === 'Prontos' ? "border-secondary hover:shadow-secondary/20 shadow-secondary/5" :
                 "border-success hover:shadow-success/20 shadow-success/5"
              )}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="font-black text-xl text-gray-900 dark:text-white uppercase tracking-tight">#{order.id}</span>
                  <span className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 text-xs font-bold px-2.5 py-1 rounded-md uppercase">
                    {order.type}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                   <Clock size={14} className="text-primary"/>
                   Para: {new Date(order.dueDate).toLocaleTimeString("pt-ST", { hour: '2-digit', minute:'2-digit' })}
                </div>
                
                <div className="space-y-1">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Itens Principais</p>
                   {order.items?.slice(0, 3).map((item: any, idx: number) => {
                     const p = products?.find((p:any) => p.id === item.productId);
                     return (
                         <div key={idx} className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {item.quantity}x {p ? p.nome : 'Produto'}
                         </div>
                     )
                   })}
                   {order.items?.length > 3 && (
                       <div className="text-xs text-gray-500 font-medium pt-1">
                           + {order.items.length - 3} outros itens
                       </div>
                   )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="w-full text-center py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors">
                  TOCAR PARA GERIR
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <OrderDetailsModal 
        isOpen={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}

function GiftIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect width="20" height="5" x="2" y="7" />
      <line x1="12" x2="12" y1="22" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  )
}


import React, { useState } from "react";
import { List, PlusCircle, ShoppingBag } from "lucide-react";
import { cn } from "../../lib/utils";
import PedidosList from "./PedidosList";
import NovoPedidoForm from "./NovoPedidoForm";

export default function PedidosIndex() {
  const [activeMainTab, setActiveMainTab] = useState<"LISTA" | "NOVO">("LISTA");

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="pedidos-module-root">
      {/* Top Header & Page Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-2.5">
            <ShoppingBag className="text-primary" size={26} />
            Gestão e Emissão de Pedidos
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Módulo integrado de agendamento, vendas de balcão e liquidação em caixa.
          </p>
        </div>

        {/* Top-Level Navigation Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800/80 p-1 rounded-xl shadow-inner border border-gray-200/50 dark:border-gray-700/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveMainTab("LISTA")}
            className={cn(
              "px-5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all",
              activeMainTab === "LISTA"
                ? "bg-white dark:bg-surface-dark text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <List size={16} /> Listagem de Pedidos
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab("NOVO")}
            className={cn(
              "px-5 py-2 rounded-lg text-xs font-extrabold flex items-center gap-2 transition-all",
              activeMainTab === "NOVO"
                ? "bg-primary text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            <PlusCircle size={16} /> Formulário de Novo Pedido
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeMainTab === "LISTA" ? (
        <PedidosList onOpenNewOrderForm={() => setActiveMainTab("NOVO")} />
      ) : (
        <NovoPedidoForm onSuccessRedirect={() => setActiveMainTab("LISTA")} />
      )}
    </div>
  );
}

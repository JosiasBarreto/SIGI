import React, { useState } from "react";
import Consumivel from "./produtos/Consumivel";
import Acabado from "./produtos/Acabado";
import Revenda from "./produtos/Revenda";
import { useQuery } from "@tanstack/react-query";
import { productService } from "../services";

export default function Produtos() {
  const [activeTab, setActiveTab] = useState<"Consumivel" | "Acabado" | "Revenda">("Consumivel");

  const { data: paginatedResponse } = useQuery({
    queryKey: ["products", 1, 1, "", activeTab],
    queryFn: () =>
      productService.getAll({
        page: 1,
        per_page: 1,
        tipo: activeTab,
      }),
  });

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Produtos
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-gray-100 dark:bg-gray-800/40 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("Consumivel")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
            activeTab === "Consumivel"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          Ingredientes ou Consumível
        </button>
        <button
          onClick={() => setActiveTab("Acabado")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
            activeTab === "Acabado"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          Produtos Acabados
        </button>
        <button
          onClick={() => setActiveTab("Revenda")}
          className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${
            activeTab === "Revenda"
              ? "bg-white dark:bg-surface-dark text-primary shadow"
              : "text-gray-500 hover:text-gray-950 dark:text-gray-400 dark:hover:text-gray-100"
          }`}
        >
          Produtos de Revenda
        </button>
      </div>

      <div className="mt-4">
        {activeTab === "Consumivel" && <Consumivel />}
        {activeTab === "Acabado" && <Acabado />}
        {activeTab === "Revenda" && <Revenda />}
      </div>
    </div>
  );
}

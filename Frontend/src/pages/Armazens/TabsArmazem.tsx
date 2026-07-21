import React, { useState } from "react";
import { Box, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/src/lib/utils";
import { DataTable } from "@/src/components/Common/DataTable"; // ajuste o path conforme seu projeto

interface Armazem {
  id: string | number;
  nome: string;
  codigo: string;
  localizacao?: string;
  descricao?: string;
  principal?: boolean;
}

interface TabsArmazemProps {
  armazens: Armazem[];
  warehouseService: any;
}

const TabsArmazem: React.FC<TabsArmazemProps> = ({ armazens, warehouseService }) => {
    const [activeTab, setActiveTab] = useState<string | number | undefined>(
        armazens[0]?.id
      );

  // Query para buscar stock do armazém ativo
  const { data: stockData, isLoading: isLoadingStock } = useQuery({
    queryKey: ["armazem-stock", activeTab],
    queryFn: () => warehouseService.getStock(activeTab),
    enabled: !!activeTab,
  });

  // Normalizar dados: produtos + ingredientes + materiais
  const normalizeStock = (data: any) => {
    if (!data) return [];
  
    const produtos = (data.produtos || []).map((p: any) => ({
      tipo: "Produto",
      codigo: p.produto_codigo,
      nome: p.produto_nome,
      stock_atual: Number(p.stock_atual),
      stock_minimo: Number(p.stock_minimo),
      unidade_medida_sigla: p.unidade_medida_sigla,
      preco_compra: p.preco_compra ?? null,
      preco_venda: p.preco_venda ?? null,
      taxa_iva: p.taxa_iva ?? null,
    }));
      
    const materiais = (data.materiais || []).map((m: any) => ({
      tipo: "Material",
      codigo: m.material_codigo,
      nome: m.material_nome,
      stock_atual: Number(m.stock_atual),
      stock_minimo: Number(m.stock_minimo),
      unidade_medida_sigla: m.unidade_medida_sigla,
      preco_compra: m.preco_compra ?? null,
      preco_venda: m.preco_venda ?? null,
      taxa_iva: m.taxa_iva ?? null,
    }));
 
    return [...produtos, ...materiais];
  };

  const [activeItemType, setActiveItemType] = useState<"Todos" | "Produto" | "Material">("Todos");
  
  const allItems = normalizeStock(stockData);
  const items = activeItemType === "Todos" 
    ? allItems 
    : allItems.filter((i) => i.tipo === activeItemType);

  // Colunas no formato esperado pelo DataTable
  const tableColumns = [
    {
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }: any) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${row.original.tipo === 'Produto' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'}`}>
          {row.original.tipo}
        </span>
      ),
    },
    {
      accessorKey: "codigo",
      header: "Código",
      cell: ({ row }: any) => row.original.codigo,
    },
    {
      accessorKey: "nome",
      header: "Nome",
      cell: ({ row }: any) => row.original.nome,
    },
    {
      accessorKey: "stock_atual",
      header: "Quantidade",
      cell: ({ row }: any) =>
        `${row.original.stock_atual}-${row.original.unidade_medida_sigla}`,
    },
    {
      accessorKey: "preco_compra",
      header: "Preço de Compra",
      cell: ({ row }: any) =>
        row.original.preco_compra !== null
          ? formatCurrency(Number(row.original.preco_compra))
          : "-",
    },
    {
      accessorKey: "preco_venda",
      header: "Preço Bruto",
      cell: ({ row }: any) =>
        row.original.preco_venda !== null
          ? formatCurrency(Number(row.original.preco_venda))
          : "-",
    },
  
  ];

  return (
    <div className="w-full">
      {/* Cabeçalho das Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {armazens.map((armazem) => (
          <button
            key={armazem.id}
            onClick={() => setActiveTab(armazem.id)}
            className={`flex items-center gap-3 px-4 py-3 text-left transition-colors
              ${
                activeTab === armazem.id
                  ? "border-b-2 border-primary text-primary bg-gray-50 dark:bg-gray-800/50"
                  : "text-gray-600 hover:text-primary"
              }`}
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Box size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold uppercase truncate">
                {armazem.nome}
              </span>
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
                Código: {armazem.codigo}
              </span>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <MapPin size={12} />
                <span className="truncate">
                  {armazem.localizacao || "Localização não definida"}
                </span>
              </div>
            </div>
            {armazem.principal && (
              <span className="ml-auto bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider">
                Principal
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conteúdo da Tab ativa: tabela */}
      <div className="p-6 bg-white dark:bg-surface-dark rounded-b-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        {isLoadingStock ? (
          <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            A carregar stock...
          </div>
        ) : (
          <>
            <div className="mb-4 flex gap-2">
              {["Todos", "Produto", "Material"].map((type) => (
                <button
                  key={type}
                  onClick={() => setActiveItemType(type as "Todos" | "Produto" | "Material")}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeItemType === type ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`}
                >
                  {type === "Todos" ? "Todos os Itens" : type === "Produto" ? "Produtos" : "Materiais"}
                </button>
              ))}
            </div>
            <DataTable
              key={activeTab}
              storageKey={`stock_${activeTab}`}
              data={items}
              columns={tableColumns}
              isLoading={isLoadingStock}
              searchPlaceholder={`Pesquisar em ${armazens.find(a => a.id === activeTab)?.nome}...`}
              manualPagination={false}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TabsArmazem;

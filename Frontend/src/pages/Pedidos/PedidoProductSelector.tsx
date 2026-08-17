import React, { useState } from "react";
import { Search, ShoppingBag, Plus, Tag, Check, AlertTriangle, SlidersHorizontal, Percent } from "lucide-react";
import { formatCurrency, cn } from "../../lib/utils";
import { TipoProduto } from "../../enums";
import PedidoAdvancedFilterModal from "./PedidoAdvancedFilterModal";

interface PedidoProductSelectorProps {
  products: any[];
  cart: any[];
  onAddToCart: (product: any) => void;
}

export default function PedidoProductSelector({
  products,
  cart,
  onAddToCart,
}: PedidoProductSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"TODOS" | "ACABADO" | "REVENDA">("TODOS");

  // Advanced Filters Modal State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("NOME_ASC");

  // Extract unique categories
  const categoriesList = Array.from(
    new Set(
      (products || [])
        .map((p) => p.categoria || p.category)
        .filter((c): c is string => Boolean(c))
    )
  ).sort();

  // Filter commercial products (Acabados e Revenda)
  const eligibleProducts = (products || []).filter((p: any) => {
    if (!p) return false;
    const rawType = String(p.tipo || p.type || p.tipo_produto || "").toUpperCase().trim();
    if (
      rawType === "CONSUMIVEL" ||
      rawType === "CONSUMÍVEL" ||
      rawType === "MATERIAL" ||
      rawType === "INGREDIENTE" ||
      rawType === "MATERIA_PRIMA"
    ) {
      return false;
    }

    const isRevenda =
      rawType === TipoProduto.REVENDA ||
      rawType === "REVENDA" ||
      rawType === "PRODUTO_REVENDA" ||
      rawType === "REV" ||
      rawType.includes("REVENDA");

    const isAcabado =
      rawType === TipoProduto.ACABADO ||
      rawType === "ACABADO" ||
      rawType === "PRODUTO_ACABADO" ||
      rawType === "FABRICO" ||
      rawType.includes("ACABADO") ||
      !rawType ||
      rawType === "PRODUTO" ||
      rawType === "GERAL";

    if (activeFilter === "ACABADO") return isAcabado && !isRevenda;
    if (activeFilter === "REVENDA") return isRevenda;
    return true;
  });

  // Apply search & advanced filters
  let filteredProducts = eligibleProducts.filter((p: any) => {
    const name = String(p.name || p.nome || "").toLowerCase();
    const cat = String(p.categoria || p.category || "").toLowerCase();
    const search = searchTerm.toLowerCase();

    if (search && !name.includes(search) && !cat.includes(search)) {
      return false;
    }

    if (selectedCategory && cat !== selectedCategory.toLowerCase()) {
      return false;
    }

    const stock = Number(p.stock_atual ?? p.stock ?? p.quantidade_atual ?? 0);
    if (onlyInStock && stock <= 0) {
      return false;
    }

    const price = Number(
      p.preco_venda_com_iva || p.salePrice || p.preco_venda || p.preco || 0
    );

    if (minPrice !== "" && price < Number(minPrice)) {
      return false;
    }
    if (maxPrice !== "" && price > Number(maxPrice)) {
      return false;
    }

    return true;
  });

  // Apply sorting
  filteredProducts.sort((a, b) => {
    const nameA = String(a.name || a.nome || "").toLowerCase();
    const nameB = String(b.name || b.nome || "").toLowerCase();
    const priceA = Number(a.preco_venda_com_iva || a.salePrice || a.preco_venda || 0);
    const priceB = Number(b.preco_venda_com_iva || b.salePrice || b.preco_venda || 0);
    const stockA = Number(a.stock_atual ?? a.stock ?? 0);
    const stockB = Number(b.stock_atual ?? b.stock ?? 0);

    if (sortBy === "NOME_ASC") return nameA.localeCompare(nameB);
    if (sortBy === "NOME_DESC") return nameB.localeCompare(nameA);
    if (sortBy === "PRECO_ASC") return priceA - priceB;
    if (sortBy === "PRECO_DESC") return priceB - priceA;
    if (sortBy === "STOCK_DESC") return stockB - stockA;
    return 0;
  });

  const getCartQuantity = (productId: string | number) => {
    const item = cart.find((i) => String(i.id) === String(productId));
    return item ? item.qty || item.quantidade || 0 : 0;
  };

  const resetAdvancedFilters = () => {
    setSelectedCategory("");
    setOnlyInStock(false);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("NOME_ASC");
    setActiveFilter("TODOS");
    setSearchTerm("");
  };

  const hasActiveAdvancedFilters =
    Boolean(selectedCategory) ||
    onlyInStock ||
    minPrice !== "" ||
    maxPrice !== "" ||
    sortBy !== "NOME_ASC";

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm h-[620px] flex flex-col justify-between space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
            <ShoppingBag size={18} className="text-primary" />
            Catálogo de Produtos (Acabados e Revenda)
          </h3>
          <p className="text-xs text-gray-500">
            Clique no card para adicionar o produto ao pedido.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveFilter("TODOS")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
              activeFilter === "TODOS"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            Todos ({eligibleProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("ACABADO")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
              activeFilter === "ACABADO"
                ? "bg-primary text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            Produtos Acabados
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("REVENDA")}
            className={cn(
              "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
              activeFilter === "REVENDA"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            Revenda
          </button>
        </div>
      </div>

      {/* Search Bar + Advanced Filter Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome ou categoria do produto..."
            className="w-full bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <button
          type="button"
          onClick={() => setIsFilterModalOpen(true)}
          className={cn(
            "px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shadow-sm",
            hasActiveAdvancedFilters
              ? "bg-primary text-white border-primary"
              : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary"
          )}
        >
          <SlidersHorizontal size={15} />
          <span>Filtros</span>
          {hasActiveAdvancedFilters && (
            <span className="ml-0.5 px-1.5 py-0.2 bg-white text-primary text-[10px] font-black rounded-full">
              !
            </span>
          )}
        </button>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1 overflow-y-auto pr-1">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl space-y-2">
            <p className="font-semibold text-sm">Nenhum produto encontrado com os filtros atuais.</p>
            {hasActiveAdvancedFilters && (
              <button
                type="button"
                onClick={resetAdvancedFilters}
                className="text-xs text-primary font-bold hover:underline"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        ) : (
          filteredProducts.map((p: any) => {
            const inCartQty = getCartQuantity(p.id);
            const price = Number(
              p.preco_venda_com_iva || p.salePrice || p.preco_venda || p.preco || 0
            );
            const stock = Number(
              p.stock_atual ?? p.stock ?? p.quantidade_atual ?? 0
            );
            const isRevenda =
              String(p.tipo || p.type || "").toUpperCase() === "REVENDA";

            const ivaTaxa = p.taxa_iva ?? p.iva_taxa ?? p.iva ?? p.taxa_imposto ?? 15;

            return (
              <div
                key={p.id}
                onClick={() => onAddToCart(p)}
                className={cn(
                  "p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-3 cursor-pointer bg-gray-50/50 dark:bg-gray-800/20 hover:shadow-md hover:border-primary/60 group",
                  inCartQty > 0
                    ? "border-primary ring-2 ring-primary/20 bg-primary/5 dark:bg-primary/10"
                    : "border-gray-200 dark:border-gray-800 hover:bg-white dark:hover:bg-gray-800/60"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span
                        className={cn(
                          "text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider",
                          isRevenda
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                        )}
                      >
                        {isRevenda ? "Revenda" : "Acabado"}
                      </span>

                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 flex items-center gap-0.5">
                        <Percent size={10} /> IVA {ivaTaxa}%
                      </span>
                    </div>

                    {stock <= 0 ? (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle size={11} /> Sem Stock
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-500">
                        Stock: {stock}
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-gray-900 dark:text-white line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {p.name || p.nome}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.categoria || p.category || "Geral"}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400 block font-medium">Preço</span>
                    <span className="font-extrabold text-sm text-primary">
                      {formatCurrency(price)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(p);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-sm",
                      inCartQty > 0
                        ? "bg-primary text-white hover:bg-primary-hover"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary"
                    )}
                  >
                    {inCartQty > 0 ? (
                      <>
                        <Check size={14} /> {inCartQty} no Pedido
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> Adicionar
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Advanced Filter Modal */}
      <PedidoAdvancedFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        categories={categoriesList}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedType={activeFilter}
        setSelectedType={(val) => setActiveFilter(val as any)}
        onlyInStock={onlyInStock}
        setOnlyInStock={setOnlyInStock}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onReset={resetAdvancedFilters}
      />
    </div>
  );
}

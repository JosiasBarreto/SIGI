import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, PackageSearch } from "lucide-react";

interface Product {
  id: string | number;
  category?: string;
  categoria?: string;
  name?: string;
  nome?: string;
  servico?: string;
  tipo?: string;
  salePrice?: number;
  preco_venda?: number;
  preco_venda_com_iva?: number;
  quantity?: number;
  stock_atual?: number;
  unit?: string;
  unidade_medida_sigla?: string;
  taxa_iva?: number;
}

interface ProductGridProps {
  displayProductslist: Product[];
  showPriceWithIva?: boolean;
  handleAddToCart: (product: Product) => void;
  formatCurrency: (value: number) => string;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  displayProductslist: displayProducts,
  showPriceWithIva = false,
  handleAddToCart,
  formatCurrency,
}) => {
  const [page, setPage] = useState(1);
  const pageSize = 48;
  const totalPages = Math.max(1, Math.ceil(displayProducts.length / pageSize));
  const catalogKey = `${displayProducts.length}:${displayProducts[0]?.id ?? ""}:${displayProducts[displayProducts.length - 1]?.id ?? ""}`;
  const visibleProducts = useMemo(
    () => displayProducts.slice((page - 1) * pageSize, page * pageSize),
    [displayProducts, page]
  );

  useEffect(() => {
    setPage(1);
  }, [catalogKey]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-gray-50 dark:bg-background-dark">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{displayProducts.length} produto{displayProducts.length === 1 ? "" : "s"} encontrado{displayProducts.length === 1 ? "" : "s"}</span>
        {displayProducts.length > pageSize && (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="p-1 rounded border border-gray-200 disabled:opacity-40 dark:border-gray-700" aria-label="Página anterior"><ChevronLeft size={15} /></button>
            <span className="font-medium">Página {page} de {totalPages}</span>
            <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="p-1 rounded border border-gray-200 disabled:opacity-40 dark:border-gray-700" aria-label="Página seguinte"><ChevronRight size={15} /></button>
          </div>
        )}
      </div>

      {visibleProducts.length === 0 ? (
        <div className="min-h-56 flex flex-col items-center justify-center text-center text-gray-500">
          <PackageSearch size={34} className="mb-3 opacity-50" />
          <p className="font-medium">Nenhum produto encontrado</p>
          <p className="text-xs mt-1">Ajuste a pesquisa, categoria ou setor.</p>
        </div>
      ) : (
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3">
        {visibleProducts.map((p) => {
          const category = p.category || p.categoria;
          const name = p.name || p.nome;

          const price = Number(p.salePrice || p.preco_venda || 0);
          const quantity = Number(p.quantity || p.stock_atual || 0);
          const unit = p.unit || p.unidade_medida_sigla;

          const iva = Number(p.taxa_iva || 0);

          const priceWithIva = iva ? p.preco_venda_com_iva : price;
          const displayPrice = showPriceWithIva ? priceWithIva : price;
          const secondaryPrice = showPriceWithIva ? price : priceWithIva;

          return (
            <button
              key={p.id}
              onClick={() => handleAddToCart(p)}
              className="min-h-36 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-lg p-3 text-left hover:border-primary/50 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary transition-all flex flex-col justify-between gap-3"
            >
              {/* Categoria + Serviço + Nome */}
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {category && (
                    <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {category}
                    </span>
                  )}
                  {(() => {
                    const serv = p.servico || (p.tipo === "Revenda" ? "BAR" : p.tipo === "Acabado" ? "COZINHA" : p.tipo === "Consumivel" ? "ABASTECIMENTO" : "");
                    if (!serv) return null;
                    return (
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
                        {serv}
                      </span>
                    );
                  })()}
                </div>
                <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {name}
                </h3>
              </div>

              {/* Informação do preço */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(displayPrice)}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      iva
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                    {iva ? "IVA Incluído" : "Isento a Iva"}
                  </span>
                </div>

                {iva > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    IVA {iva}% • {formatCurrency(secondaryPrice)}
                  </p>
                )}

                <p className="text-xs font-medium text-success">
                  
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      quantity > 0
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900"
                    }`}
                  >
                    {quantity > 0 ? `Stock: ${quantity} ${unit || "un"}` : "Sem Stock (Venda p/ Pedido)"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
};

export default ProductGrid;

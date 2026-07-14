import React from "react";

interface Product {
  id: string | number;
  category?: string;
  categoria?: string;
  name?: string;
  nome?: string;
  salePrice?: number;
  preco_venda?: number;
  preco_iva?: number;
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
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-background-dark">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {displayProducts.map((p) => {
          const category = p.category || p.categoria;
          const name = p.name || p.nome;

          const price = Number(p.salePrice || p.preco_venda || 0);
          const quantity = Number(p.quantity || p.stock_atual || 0);
          const unit = p.unit || p.unidade_medida_sigla;

          const iva = Number(p.taxa_iva || 0);

          const priceWithIva = iva ? p.preco_iva : price;
          const displayPrice = showPriceWithIva ? priceWithIva : price;
          const secondaryPrice = showPriceWithIva ? price : priceWithIva;

          return (
            <button
              key={p.id}
              onClick={() => handleAddToCart(p)}
              className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-lg p-3 text-left hover:border-primary/50 hover:shadow-lg transition-all flex flex-col justify-between gap-3"
            >
              {/* Categoria + Nome */}
              <div>
                {category && (
                  <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {category}
                  </span>
                )}
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
                <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        quantity
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                    }`}
                  >
                   Stock: {quantity} {unit}
                  </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProductGrid;

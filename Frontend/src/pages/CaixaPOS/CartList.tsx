import React from "react";
import { ShoppingCart, Trash2, Minus, Plus } from "lucide-react";

interface CartItem {
  id: string | number;
  nome: string;
  salePrice?: number;
  preco_venda?: number;
  taxa_iva?: number;
  qty: number;
}

interface CartListProps {
  cart: CartItem[];
  showPriceWithIva?: boolean;
  formatCurrency: (value: number) => string;
  removeItem: (id: string | number) => void;
  updateQty: (id: string | number, delta: number) => void;
}

const CartList: React.FC<CartListProps> = ({
  cart,
  showPriceWithIva = false,
  formatCurrency,
  removeItem,
  updateQty,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {cart.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400">
          <ShoppingCart size={48} className="mb-4 opacity-20" />
          <p>Carrinho vazio</p>
        </div>
      ) : (
        cart.map((item) => {
          const precoSemIva = Number(item.preco_venda || 0);
          const iva = Number(item.taxa_iva || 0);
          const preco_iva = Number(item.preco_iva || 0);
          const unit =  item.unit || item.unidade_medida_sigla;

          const precoComIva =
            iva > 0 ? preco_iva : precoSemIva;

          const precoUnitario = showPriceWithIva ? precoComIva : precoSemIva;
          const total = precoUnitario * item.qty;

          return (
            <div
              key={item.id}
              className="flex flex-col gap-3 p-3 bg-gray-50 dark:bg-gray-800/20 rounded-lg border border-gray-100 dark:border-gray-800"
            >
              {/* Nome + Remover */}
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">
                    {item.nome}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    IVA {iva}% •{" "}
                    {iva ? "Preço com IVA" : "Preço sem IVA"}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Quantidade + Total */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                  <button
                    onClick={() => updateQty(item.id, -1)}
                    className="px-2 py-1 hover:text-primary"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-semibold">
                    {item.qty} {item.unit}
                  </span>
                  <button
                    onClick={() => updateQty(item.id, 1)}
                    className="px-2 py-1 hover:text-primary"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {item.qty}{item.unit} × {formatCurrency(precoUnitario)}
                  </p>
                  <p className="text-base font-bold text-primary">
                    {formatCurrency(total)}
                  </p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default CartList;

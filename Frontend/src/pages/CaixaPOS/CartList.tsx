import React, { useState } from "react";
import { ShoppingCart, Trash2, Minus, Plus, Tag, AlertCircle } from "lucide-react";

interface CartItem {
  id: string | number;
  nome?: string;
  name?: string;
  categoria?: string;
  category?: string;
  tipo?: string;
  type?: string;
  is_revenda?: boolean;
  salePrice?: number;
  preco_venda?: number;
  preco_venda_com_iva?: number;
  taxa_iva?: number;
  stock_atual?: number;
  stock?: number;
  quantidade_atual?: number;
  qty: number;
  desconto_valor?: number;
  desconto_tipo?: "percentual" | "valor";
}

interface CartListProps {
  cart: CartItem[];
  showPriceWithIva?: boolean;
  currencySymbol?: string;
  formatCurrency: (value: number) => string;
  removeItem: (id: string | number) => void;
  updateQty: (id: string | number, delta: number) => void;
  updateItemDiscount?: (id: string | number, valor: number, tipo: "percentual" | "valor") => void;
}

const CartList: React.FC<CartListProps> = ({
  cart,
  showPriceWithIva = false,
  currencySymbol = "Kz",
  formatCurrency,
  removeItem,
  updateQty,
  updateItemDiscount,
}) => {
  const [openDiscountId, setOpenDiscountId] = useState<string | number | null>(null);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {cart.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
          <ShoppingCart size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-medium">Carrinho vazio</p>
        </div>
      ) : (
        cart.map((item) => {
          const precoSemIva = Number(item.preco_venda || item.salePrice || 0);
          const iva = Number(item.taxa_iva || 0);
          const preco_iva = Number(item.preco_venda_com_iva || 0);

          const precoComIva = iva > 0 && preco_iva > 0 ? preco_iva : precoSemIva;
          const precoUnitario = showPriceWithIva ? precoComIva : precoSemIva;
          const grossTotal = precoUnitario * item.qty;

          // Item discount
          const descValor = Number(item.desconto_valor || 0);
          const descTipo = item.desconto_tipo || "percentual";
          let discountAmt = 0;

          if (descValor > 0) {
            if (descTipo === "percentual") {
              discountAmt = grossTotal * (Math.min(100, Math.max(0, descValor)) / 100);
            } else {
              discountAmt = Math.min(grossTotal, descValor);
            }
          }

          const netTotal = Math.max(0, grossTotal - discountAmt);

          // Stock and Type information
          const stock = Number(item.stock_atual ?? item.stock ?? item.quantidade_atual ?? 0);
          const isOut = stock <= 0 || item.qty > stock;
          const tipoUpper = String(item.tipo || item.type || "").toUpperCase();
          const isRevenda = tipoUpper === "REVENDA" || tipoUpper === "PRODUTO_REVENDA" || item.is_revenda === true;

          return (
            <div
              key={item.id}
              className={`flex flex-col gap-2.5 p-3 rounded-xl border transition-all ${
                isOut
                  ? "bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40"
                  : "bg-gray-50 dark:bg-gray-800/20 border-gray-100 dark:border-gray-800"
              }`}
            >
              {/* Header: Title + Badges + Remove */}
              <div className="flex justify-between items-start gap-2">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-semibold text-xs text-gray-900 dark:text-white leading-tight">
                      {item.nome || item.name || "Item"}
                    </h4>
                    {isRevenda && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        Revenda
                      </span>
                    )}
                  </div>

                  {/* Stock Warning Badge */}
                  {isOut && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      <AlertCircle size={12} />
                      {isRevenda ? (
                        <span>Sem Stock (Indisponível p/ Encomenda)</span>
                      ) : (
                        <span>Sem Stock — Pedido Produção (Cliente Obrigatório)</span>
                      )}
                    </div>
                  )}

                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    IVA {iva}% • {iva ? "Com IVA" : "Sem IVA"} • Stock: {stock} un
                  </p>
                </div>

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Remover do carrinho"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Quantity + Price + Discount trigger */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="px-2 py-1 hover:text-primary rounded text-gray-700 dark:text-gray-300"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center font-bold text-xs text-gray-900 dark:text-white">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, 1)}
                      className="px-2 py-1 hover:text-primary rounded text-gray-700 dark:text-gray-300"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Item Discount Toggle Button */}
                  {updateItemDiscount && (
                    <button
                      type="button"
                      onClick={() => setOpenDiscountId(openDiscountId === item.id ? null : item.id)}
                      className={`px-2 py-1 text-[10px] font-bold rounded-lg border flex items-center gap-1 transition-all ${
                        descValor > 0
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300"
                          : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 hover:bg-gray-100"
                      }`}
                      title="Aplicar desconto neste item"
                    >
                      <Tag size={11} />
                      {descValor > 0 ? `-${descValor}${descTipo === "percentual" ? "%" : ` ${currencySymbol}`}` : "Desc."}
                    </button>
                  )}
                </div>

                {/* Subtotal Display */}
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">
                    {item.qty} × {formatCurrency(precoUnitario)}
                  </p>
                  <div className="flex items-baseline justify-end gap-1">
                    {discountAmt > 0 && (
                      <span className="text-[10px] line-through text-gray-400">
                        {formatCurrency(grossTotal)}
                      </span>
                    )}
                    <span className="text-sm font-extrabold text-primary">
                      {formatCurrency(netTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Item-Level Discount Input Bar */}
              {openDiscountId === item.id && updateItemDiscount && (
                <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded-lg border border-primary/30 flex items-center gap-2 animate-fade-in">
                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 shrink-0">
                    Desconto Item:
                  </span>
                  
                  {/* Type Selector */}
                  <div className="flex rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
                    <button
                      type="button"
                      onClick={() => updateItemDiscount(item.id, descValor, "percentual")}
                      className={`px-2 py-0.5 text-[10px] font-bold ${
                        descTipo === "percentual"
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      onClick={() => updateItemDiscount(item.id, descValor, "valor")}
                      className={`px-2 py-0.5 text-[10px] font-bold ${
                        descTipo === "valor"
                          ? "bg-primary text-white"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {currencySymbol}
                    </button>
                  </div>

                  {/* Value Input */}
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={descValor || ""}
                    onChange={(e) => updateItemDiscount(item.id, Number(e.target.value), descTipo)}
                    className="w-20 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-primary"
                  />

                  {descValor > 0 && (
                    <button
                      type="button"
                      onClick={() => updateItemDiscount(item.id, 0, descTipo)}
                      className="text-[10px] text-red-500 hover:underline font-bold ml-auto"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default CartList;

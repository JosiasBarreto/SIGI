import React, { useState } from "react";
import { ShoppingCart, Trash2, Table } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import PedidoCartTableModal from "./PedidoCartTableModal";

interface PedidoCartSummaryProps {
  cart: any[];
  clientDiscountPercent: number;
  manualDiscount: number;
  setManualDiscount: (val: number) => void;
  onUpdateQty: (uniqueId: string, qty: number) => void;
  onUpdateDiscount: (uniqueId: string, discount: number) => void;
  onRemoveItem: (uniqueId: string) => void;
  onClearCart: () => void;
}

export default function PedidoCartSummary({
  cart,
  clientDiscountPercent,
  manualDiscount,
  setManualDiscount,
  onUpdateQty,
  onUpdateDiscount,
  onRemoveItem,
  onClearCart,
}: PedidoCartSummaryProps) {
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);

  // Calculations
  const grossSubtotalWithIva = cart.reduce(
    (acc, curr) => acc + Number(curr.price || 0) * Number(curr.qty || 1),
    0
  );

  const totalItemDiscounts = cart.reduce(
    (acc, curr) => acc + Number(curr.discount || 0),
    0
  );

  const clientDiscountVal =
    clientDiscountPercent > 0
      ? (grossSubtotalWithIva - totalItemDiscounts) * (clientDiscountPercent / 100)
      : 0;

  const totalFinal = Math.max(
    0,
    grossSubtotalWithIva - totalItemDiscounts - clientDiscountVal - (manualDiscount || 0)
  );

  return (
    <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm h-[620px] flex flex-col justify-between space-y-3">
      {/* 1. Header */}
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 flex-shrink-0">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
          <ShoppingCart size={18} className="text-primary" />
          Itens ({cart.length})
        </h3>

        <div className="flex items-center gap-2">
          {cart.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setIsTableModalOpen(true)}
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg"
                title="Ver carrinho completo em tabela com paginação"
              >
                <Table size={13} />
                <span>Ver Tabela</span>
              </button>

              <button
                type="button"
                onClick={onClearCart}
                className="text-xs font-bold text-error hover:underline"
              >
                Esvaziar
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Scrollable Cart Items Container */}
      {cart.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl space-y-2 my-1">
          <ShoppingCart size={32} className="mx-auto opacity-30" />
          <p className="text-xs font-medium">Nenhum produto no carrinho.</p>
          <p className="text-[11px] text-gray-400">
            Clique nos produtos no catálogo à esquerda para adicionar.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-0">
          {cart.map((item) => {
            const itemGross = Number(item.price || 0) * Number(item.qty || 1);
            const itemNet = Math.max(0, itemGross - Number(item.discount || 0));

            return (
              <div
                key={item.uniqueId}
                className="p-3 bg-gray-50/70 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-800 rounded-xl space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-gray-900 dark:text-white block truncate">
                      {item.name || item.nome}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 uppercase">
                      {item.category || item.categoria || "Produto"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.uniqueId)}
                    className="text-gray-400 hover:text-error transition-colors p-0.5"
                    title="Remover produto"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs items-center">
                  {/* Read-only price badge */}
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-gray-500 font-medium block">
                      Preço
                    </span>
                    <span className="font-bold text-xs text-gray-900 dark:text-white block py-1">
                      {formatCurrency(item.price)}
                    </span>
                  </div>

                  {/* Quantity input */}
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-gray-500 font-medium block">
                      Qtd
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) =>
                        onUpdateQty(item.uniqueId, Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs font-bold text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Line discount input */}
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-gray-500 font-medium block">
                      Desc.
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount || 0}
                      onChange={(e) =>
                        onUpdateDiscount(
                          item.uniqueId,
                          Math.max(0, parseFloat(e.target.value) || 0)
                        )
                      }
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs font-medium text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-gray-200/50 dark:border-gray-700/50 text-xs">
                  <span className="text-[10px] text-gray-500">Subtotal Líquido</span>
                  <span className="font-extrabold text-xs text-primary">
                    {formatCurrency(itemNet)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Compact Footer Bar inside the Card */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2 flex-shrink-0 bg-gray-50/50 dark:bg-gray-800/20 p-3 rounded-xl">
        <div className="flex items-center justify-between gap-2">
          <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
            Desconto Extra Global:
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={manualDiscount || ""}
            onChange={(e) =>
              setManualDiscount(Math.max(0, parseFloat(e.target.value) || 0))
            }
            placeholder="0.00"
            className="w-28 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs font-bold text-right text-gray-900 dark:text-white focus:border-primary outline-none"
          />
        </div>

        {clientDiscountPercent > 0 && (
          <div className="flex justify-between text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Desconto Cliente ({clientDiscountPercent}%):</span>
            <span>- {formatCurrency(clientDiscountVal)}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
          <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300">
            Total do Pedido:
          </span>
          <span className="text-lg font-black text-primary">
            {formatCurrency(totalFinal)}
          </span>
        </div>
      </div>

      {/* Modal Table View */}
      <PedidoCartTableModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        cart={cart}
        clientDiscountPercent={clientDiscountPercent}
        manualDiscount={manualDiscount}
        onUpdateQty={onUpdateQty}
        onUpdateDiscount={onUpdateDiscount}
        onRemoveItem={onRemoveItem}
        onClearCart={onClearCart}
      />
    </div>
  );
}

import React, { useState } from "react";
import Modal from "../../components/Common/Modal";
import { ShoppingCart, Trash2, Plus, Minus, Table, X, ChevronLeft, ChevronRight, Tag } from "lucide-react";

interface CaixaCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: any[];
  formatCurrency: (val: number) => string;
  updateQty: (id: string | number, delta: number) => void;
  updateItemDiscount: (id: string | number, val: number, tipo: "percentual" | "valor") => void;
  removeItem: (id: string | number) => void;
  clearCart: () => void;
  subtotal: number;
  Iva: number;
  descontoTotal: number;
  total: number;
}

export default function CaixaCartModal({
  isOpen,
  onClose,
  cart,
  formatCurrency,
  updateQty,
  updateItemDiscount,
  removeItem,
  clearCart,
  subtotal,
  Iva,
  descontoTotal,
  total,
}: CaixaCartModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  if (!isOpen) return null;

  const totalItems = cart.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedItems = cart.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Produtos no Carrinho de Atendimento"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4 text-left">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              Total de Itens Diferentes: <strong className="text-primary">{totalItems}</strong>
            </span>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 self-end sm:self-auto"
            >
              <Trash2 size={14} /> Esvaziar Carrinho
            </button>
          )}
        </div>

        {/* Cart Table */}
        {cart.length === 0 ? (
          <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl space-y-2">
            <ShoppingCart size={40} className="mx-auto opacity-30" />
            <p className="text-sm font-semibold">O carrinho está vazio.</p>
            <p className="text-xs text-gray-500">Adicione produtos através do catálogo de vendas.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase font-extrabold text-[10px]">
                <tr>
                  <th className="p-3">Item / Produto</th>
                  <th className="p-3 text-right">Preço Unit.</th>
                  <th className="p-3 text-center">Qtd.</th>
                  <th className="p-3 text-center">Desc. (%)</th>
                  <th className="p-3 text-right">Subtotal</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-medium">
                {paginatedItems.map((item) => {
                  const preco = Number(item.preco_venda_com_iva || item.salePrice || item.preco_venda || 0);
                  const qty = Number(item.qty || 1);
                  const desc = Number(item.desconto_valor || 0);
                  const gross = preco * qty;
                  let discountAmt = 0;
                  if (desc > 0) {
                    if (item.desconto_tipo === "valor") {
                      discountAmt = Math.min(gross, desc);
                    } else {
                      discountAmt = gross * (Math.min(100, Math.max(0, desc)) / 100);
                    }
                  }
                  const itemNetTotal = Math.max(0, gross - discountAmt);

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="p-3">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {item.nome || item.name || "Item"}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {item.categoria || item.category || item.tipo || "Produto"}
                        </div>
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {formatCurrency(preco)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, -1)}
                            className="p-1 text-gray-600 dark:text-gray-300 hover:text-red-500 rounded"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center font-bold text-xs">{qty}</span>
                          <button
                            type="button"
                            onClick={() => updateQty(item.id, 1)}
                            className="p-1 text-gray-600 dark:text-gray-300 hover:text-primary rounded"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={desc || ""}
                            onChange={(e) =>
                              updateItemDiscount(item.id, parseFloat(e.target.value) || 0, "percentual")
                            }
                            placeholder="0"
                            className="w-14 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-center text-xs font-bold"
                          />
                          <span className="text-[11px] font-bold text-gray-500">%</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-black text-primary">
                        {formatCurrency(itemNetTotal)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Remover produto"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>
              Página <strong>{safePage}</strong> de <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Summary Footer */}
        <div className="p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">Subtotal</span>
              <span className="font-bold text-gray-700 dark:text-gray-300">{formatCurrency(subtotal)}</span>
            </div>
            {descontoTotal > 0 && (
              <div>
                <span className="text-[10px] text-emerald-500 font-bold block uppercase">Desconto Total</span>
                <span className="font-bold text-emerald-600">-{formatCurrency(descontoTotal)}</span>
              </div>
            )}
            <div>
              <span className="text-[10px] text-gray-400 font-bold block uppercase">IVA (15% Incl.)</span>
              <span className="font-bold text-gray-600 dark:text-gray-400">{formatCurrency(Iva)}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-primary font-black block uppercase">TOTAL DO CARRINHO</span>
            <span className="text-xl font-black text-primary">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Action button */}
        <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md"
          >
            Concluído
          </button>
        </div>
      </div>
    </Modal>
  );
}

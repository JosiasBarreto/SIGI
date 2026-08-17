import React, { useState } from "react";
import Modal from "../../components/Common/Modal";
import { formatCurrency, cn } from "../../lib/utils";
import { ShoppingCart, Trash2, ChevronLeft, ChevronRight, Plus, Minus, Table } from "lucide-react";

interface PedidoCartTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: any[];
  clientDiscountPercent: number;
  manualDiscount: number;
  onUpdateQty: (uniqueId: string, qty: number) => void;
  onUpdateDiscount: (uniqueId: string, discount: number) => void;
  onRemoveItem: (uniqueId: string) => void;
  onClearCart: () => void;
}

export default function PedidoCartTableModal({
  isOpen,
  onClose,
  cart,
  clientDiscountPercent,
  manualDiscount,
  onUpdateQty,
  onUpdateDiscount,
  onRemoveItem,
  onClearCart,
}: PedidoCartTableModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  if (!isOpen) return null;

  // Pagination calculation
  const totalItems = cart.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedItems = cart.slice(startIndex, startIndex + itemsPerPage);

  // Financial totals
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tabela Detalhada dos Itens do Pedido"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* Header & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              Total de Linhas no Carrinho: <strong className="text-primary">{totalItems}</strong>
            </span>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={onClearCart}
              className="text-xs font-bold text-error hover:underline flex items-center gap-1 self-end sm:self-auto"
            >
              <Trash2 size={14} /> Esvaziar Carrinho
            </button>
          )}
        </div>

        {/* Table View */}
        {cart.length === 0 ? (
          <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl space-y-2">
            <Table size={36} className="mx-auto opacity-30" />
            <p className="text-sm font-semibold">O carrinho está vazio.</p>
            <p className="text-xs text-gray-400">Adicione produtos através do catálogo na página de pedidos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="p-3">Produto / Categoria</th>
                  <th className="p-3 text-right">Preço Un.</th>
                  <th className="p-3 text-center">Quantidade</th>
                  <th className="p-3 text-right">Desc. Linha</th>
                  <th className="p-3 text-right">Subtotal Líquido</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {paginatedItems.map((item) => {
                  const itemGross = Number(item.price || 0) * Number(item.qty || 1);
                  const itemNet = Math.max(0, itemGross - Number(item.discount || 0));

                  return (
                    <tr
                      key={item.uniqueId}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      <td className="p-3">
                        <span className="font-bold text-gray-900 dark:text-white block">
                          {item.name || item.nome}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-500 uppercase">
                          {item.category || item.categoria || "Geral"}
                        </span>
                      </td>

                      <td className="p-3 text-right font-semibold text-gray-800 dark:text-gray-200">
                        {formatCurrency(item.price)}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQty(item.uniqueId, Math.max(1, Number(item.qty || 1) - 1))
                            }
                            className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200"
                            title="Diminuir"
                          >
                            <Minus size={12} />
                          </button>

                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) =>
                              onUpdateQty(
                                item.uniqueId,
                                Math.max(1, parseInt(e.target.value) || 1)
                              )
                            }
                            className="w-12 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md py-1 font-bold text-xs"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              onUpdateQty(item.uniqueId, Number(item.qty || 1) + 1)
                            }
                            className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200"
                            title="Aumentar"
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </td>

                      <td className="p-3 text-right">
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
                          className="w-20 text-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md py-1 px-1.5 font-semibold text-xs"
                        />
                      </td>

                      <td className="p-3 text-right font-extrabold text-primary">
                        {formatCurrency(itemNet)}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => onRemoveItem(item.uniqueId)}
                          className="p-1.5 text-gray-400 hover:text-error transition-colors rounded-lg hover:bg-error/10"
                          title="Remover do carrinho"
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

        {/* Pagination Bar */}
        {cart.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500 font-medium">
              Página <strong>{safePage}</strong> de <strong>{totalPages}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold disabled:opacity-40 flex items-center gap-1 hover:border-primary"
              >
                <ChevronLeft size={14} /> Anterior
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold disabled:opacity-40 flex items-center gap-1 hover:border-primary"
              >
                Próximo <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Footer Totals inside Modal */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-primary/5 dark:bg-primary/10 p-3 rounded-xl">
          <div className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
            <div>
              Subtotal Bruto: <strong className="font-bold">{formatCurrency(grossSubtotalWithIva)}</strong>
            </div>
            {totalItemDiscounts > 0 && (
              <div className="text-amber-600 dark:text-amber-400">
                Descontos de Linha: <strong>- {formatCurrency(totalItemDiscounts)}</strong>
              </div>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              TOTAL LÍQUIDO DO CARRINHO
            </span>
            <span className="text-xl font-black text-primary block">
              {formatCurrency(totalFinal)}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

import React from "react";
import Modal from "../Common/Modal";
import { AlertTriangle, Clock, ArrowRight, ShoppingBag } from "lucide-react";

interface StockWarningItem {
  id: string | number;
  name: string;
  stock_atual: number;
  servico?: string;
  unit?: string;
}

interface StockWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: StockWarningItem[];
  onConvertToOrder: () => void;
  onRemoveItems?: () => void;
}

export const StockWarningModal: React.FC<StockWarningModalProps> = ({
  isOpen,
  onClose,
  items,
  onConvertToOrder,
  onRemoveItems,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stock Insuficiente - Pedido de Produção Necessário">
      <div className="space-y-4 py-2">
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={24} />
          <div className="text-sm">
            <h4 className="font-bold text-amber-900 dark:text-amber-200">
              Produto(s) sem stock para Venda Direta Imediata
            </h4>
            <p className="text-amber-700 dark:text-amber-400 text-xs mt-1">
              Os produtos abaixo não possuem quantidade em stock suficiente no balcão. Não é possível efetuar uma Venda Direta imediata sem stock.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Itens Afetados:
          </span>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((item) => (
              <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white">{item.name}</span>
                  {item.servico && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20">
                      {item.servico}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    Stock Atual: {item.stock_atual} {item.unit || "un"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl text-xs text-blue-800 dark:text-blue-300 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Clock size={16} />
            <span>Fluxo Recomendado: Pedido de Produção (Encomenda)</span>
          </div>
          <p>
            O sistema gerará automaticamente uma <strong>Ordem de Produção (OP)</strong> direcionada ao setor responsável (Cozinha ou Pastelaria). Assim que o prato/doce estiver concluído, o stock será alimentado e os seus ingredientes consumidos da ficha técnica.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          {onRemoveItems && (
            <button
              type="button"
              onClick={() => {
                onRemoveItems();
                onClose();
              }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Remover do Carrinho
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              onConvertToOrder();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag size={16} />
            Converter em Pedido de Produção
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StockWarningModal;

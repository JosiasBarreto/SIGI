import React, { useState, useEffect } from "react";
import Modal from "../../components/Common/Modal";
import { FileText, Trash2, ArrowUpRight, Plus, Calendar, User, ShoppingBag } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { toast } from "react-toastify";

export interface PedidoDraft {
  id: string;
  name: string;
  createdAt: string;
  clientName?: string;
  clientId?: string;
  itemsCount: number;
  totalValue: number;
  cart: any[];
  orderType?: "Simples" | "Composto";
  orderNotes?: string;
}

interface PedidoDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCart: any[];
  currentClientName?: string;
  currentClientId?: string;
  currentTotal: number;
  currentOrderType?: "Simples" | "Composto";
  currentOrderNotes?: string;
  onLoadDraft: (draft: PedidoDraft) => void;
}

export default function PedidoDraftsModal({
  isOpen,
  onClose,
  currentCart,
  currentClientName,
  currentClientId,
  currentTotal,
  currentOrderType,
  currentOrderNotes,
  onLoadDraft,
}: PedidoDraftsModalProps) {
  const [drafts, setDrafts] = useState<PedidoDraft[]>([]);
  const [newDraftName, setNewDraftName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDraftsFromStorage();
    }
  }, [isOpen]);

  const loadDraftsFromStorage = () => {
    try {
      const saved = localStorage.getItem("sigi_pedidos_drafts");
      if (saved) {
        setDrafts(JSON.parse(saved));
      } else {
        setDrafts([]);
      }
    } catch {
      setDrafts([]);
    }
  };

  const saveDraftsToStorage = (updatedDrafts: PedidoDraft[]) => {
    localStorage.setItem("sigi_pedidos_drafts", JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
  };

  const handleSaveCurrentDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCart.length === 0) {
      toast.error("O carrinho atual está vazio.");
      return;
    }

    const dName = newDraftName.trim() || `Rascunho ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newDraft: PedidoDraft = {
      id: "draft_" + Date.now(),
      name: dName,
      createdAt: new Date().toISOString(),
      clientName: currentClientName || "Cliente ao Balcão",
      clientId: currentClientId || "",
      itemsCount: currentCart.reduce((acc, i) => acc + Number(i.qty || 1), 0),
      totalValue: currentTotal,
      cart: currentCart,
      orderType: currentOrderType,
      orderNotes: currentOrderNotes,
    };

    const updated = [newDraft, ...drafts];
    saveDraftsToStorage(updated);
    setNewDraftName("");
    setShowSaveForm(false);
    toast.success("Rascunho guardado com sucesso!");
  };

  const handleDeleteDraft = (id: string) => {
    const updated = drafts.filter((d) => d.id !== id);
    saveDraftsToStorage(updated);
    toast.info("Rascunho removido.");
  };

  const handleSelectDraft = (draft: PedidoDraft) => {
    onLoadDraft(draft);
    onClose();
    toast.success(`Rascunho "${draft.name}" carregado.`);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestão de Rascunhos do Pedido" maxWidth="max-w-xl">
      <div className="space-y-4">
        {/* Top Save Current Banner */}
        <div className="p-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-white block">
              Guardar Carrinho Atual como Rascunho
            </span>
            <span className="text-[11px] text-gray-500 block">
              {currentCart.length} item(ns) | {formatCurrency(currentTotal)}
            </span>
          </div>

          {!showSaveForm ? (
            <button
              type="button"
              disabled={currentCart.length === 0}
              onClick={() => setShowSaveForm(true)}
              className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
            >
              <Plus size={14} /> Guardar Atual
            </button>
          ) : (
            <form onSubmit={handleSaveCurrentDraft} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nome do Rascunho"
                value={newDraftName}
                onChange={(e) => setNewDraftName(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 text-xs text-gray-900 dark:text-white"
                autoFocus
              />
              <button
                type="submit"
                className="px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600"
              >
                Cancelar
              </button>
            </form>
          )}
        </div>

        {/* Drafts List */}
        <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {drafts.length === 0 ? (
            <div className="py-10 text-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
              <FileText size={32} className="mx-auto opacity-30 mb-2" />
              <p className="text-xs font-semibold">Nenhum rascunho guardado no navegador.</p>
              <p className="text-[11px]">Guarde o seu pedido em andamento para continuar mais tarde.</p>
            </div>
          ) : (
            drafts.map((d) => {
              const formattedDate = new Date(d.createdAt).toLocaleString("pt-PT", {
                dateStyle: "short",
                timeStyle: "short",
              });

              return (
                <div
                  key={d.id}
                  className="p-3.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-between gap-3 hover:border-primary/50 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        {d.name}
                      </span>
                      <span className="text-[10px] bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-semibold">
                        {d.itemsCount} itens
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={12} /> {d.clientName || "Cliente ao Balcão"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formattedDate}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-extrabold text-sm text-primary">
                      {formatCurrency(d.totalValue)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleSelectDraft(d)}
                      className="p-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg transition-colors"
                      title="Carregar este rascunho"
                    >
                      <ArrowUpRight size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(d.id)}
                      className="p-2 text-gray-400 hover:text-error transition-colors"
                      title="Eliminar rascunho"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}

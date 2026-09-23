import React, { useState, useEffect } from "react";
import Modal from "../../components/Common/Modal";
import { Trash2, Plus, ShoppingBag, Bookmark, ArrowUpRight, Check } from "lucide-react";
import { formatCurrency } from "../../lib/utils";
import { toast } from "react-toastify";

export interface CaixaDraft {
  id: string;
  name: string;
  createdAt: string;
  clientName?: string;
  clientId?: string;
  itemsCount: number;
  totalValue: number;
  cart: any[];
  tipoDocumento?: "FR" | "PROFORMA";
  tipoPedido?: "Imediato" | "Agendado";
  dataEntrega?: string;
}

interface CaixaDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCart: any[];
  currentClientName?: string;
  currentClientId?: string;
  currentTotal: number;
  currentTipoDocumento?: "FR" | "PROFORMA";
  currentTipoPedido?: "Imediato" | "Agendado";
  currentDataEntrega?: string;
  onLoadDraft: (draft: CaixaDraft) => void;
}

export default function CaixaDraftsModal({
  isOpen,
  onClose,
  currentCart,
  currentClientName,
  currentClientId,
  currentTotal,
  currentTipoDocumento,
  currentTipoPedido,
  currentDataEntrega,
  onLoadDraft,
}: CaixaDraftsModalProps) {
  const [drafts, setDrafts] = useState<CaixaDraft[]>([]);
  const [newDraftName, setNewDraftName] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDraftsFromStorage();
    }
  }, [isOpen]);

  const getUserDraftsKey = () => {
    try {
      const userStr = localStorage.getItem("user");
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const userId = currentUser?.id || currentUser?.email || "anonymous";
      return `sigi_caixa_drafts_${userId}`;
    } catch {
      return "sigi_caixa_drafts_anonymous";
    }
  };

  const loadDraftsFromStorage = () => {
    try {
      const key = getUserDraftsKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        setDrafts(JSON.parse(saved));
      } else {
        setDrafts([]);
      }
    } catch {
      setDrafts([]);
    }
  };

  const saveDraftsToStorage = (updatedDrafts: CaixaDraft[]) => {
    const key = getUserDraftsKey();
    localStorage.setItem(key, JSON.stringify(updatedDrafts));
    setDrafts(updatedDrafts);
  };

  const handleSaveCurrentDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCart.length === 0) {
      toast.error("O carrinho atual está vazio.");
      return;
    }

    const dName = newDraftName.trim() || `Rascunho ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const newDraft: CaixaDraft = {
      id: "caixa_draft_" + Date.now(),
      name: dName,
      createdAt: new Date().toISOString(),
      clientName: currentClientName || "Consumidor Final",
      clientId: currentClientId || "",
      itemsCount: currentCart.reduce((acc, i) => acc + Number(i.qty || 1), 0),
      totalValue: currentTotal,
      cart: currentCart,
      tipoDocumento: currentTipoDocumento,
      tipoPedido: currentTipoPedido,
      dataEntrega: currentDataEntrega,
    };

    const updated = [newDraft, ...drafts];
    saveDraftsToStorage(updated);
    setNewDraftName("");
    setShowSaveForm(false);
    toast.success("Rascunho do Caixa guardado com sucesso!");
  };

  const handleDeleteDraft = (id: string) => {
    const updated = drafts.filter((d) => d.id !== id);
    saveDraftsToStorage(updated);
    toast.info("Rascunho removido.");
  };

  const handleSelectDraft = (draft: CaixaDraft) => {
    onLoadDraft(draft);
    onClose();
    toast.success(`Rascunho "${draft.name}" carregado para o carrinho.`);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gestão de Rascunhos de Atendimento" maxWidth="max-w-xl">
      <div className="space-y-4 text-left">
        {/* Top Save Current Banner */}
        <div className="p-3 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-white block">
              Guardar Atendimento Atual como Rascunho
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
              className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 shadow-sm"
            >
              <Plus size={14} /> Guardar Atual
            </button>
          ) : (
            <form onSubmit={handleSaveCurrentDraft} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Nome da Reserva/Rascunho"
                value={newDraftName}
                onChange={(e) => setNewDraftName(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
              <button
                type="submit"
                className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover transition-colors"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                className="text-xs text-gray-400 hover:text-gray-600 px-1"
              >
                Cancelar
              </button>
            </form>
          )}
        </div>

        {/* Drafts List */}
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {drafts.length === 0 ? (
            <div className="py-10 text-center text-gray-400 flex flex-col items-center justify-center">
              <Bookmark size={36} className="mb-2 opacity-30" />
              <p className="text-xs font-medium">Nenhum rascunho guardado</p>
              <p className="text-[11px] mt-0.5">Pode guardar vendas em espera para retomar mais tarde.</p>
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.id}
                className="p-3 bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-between gap-3 hover:border-primary/40 transition-all group"
              >
                <div className="space-y-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {draft.name}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-semibold">
                      {draft.clientName || "Consumidor Final"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1">
                      <ShoppingBag size={12} /> {draft.itemsCount} item(ns)
                    </span>
                    <span>•</span>
                    <span className="font-bold text-primary">
                      {formatCurrency(draft.totalValue)}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(draft.createdAt).toLocaleDateString("pt-PT")} às {new Date(draft.createdAt).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectDraft(draft)}
                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <span>Carregar</span>
                    <ArrowUpRight size={14} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                    title="Remover Rascunho"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}

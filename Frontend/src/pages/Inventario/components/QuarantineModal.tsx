import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { InventoryItem, QuarentenaItem } from '../types';
import { inventoryService } from '../../../services/inventoryService';
import { useAuth } from '../../../components/AuthContext';
import { toast } from 'react-toastify';
import Modal from '../../../components/Common/Modal';

interface QuarantineModalProps {
  item: InventoryItem | null;
  items: InventoryItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuarantineModal: React.FC<QuarantineModalProps> = ({
  item,
  items,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user } = useAuth();
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantidade, setQuantidade] = useState<string>('');
  const [motivo, setMotivo] = useState<QuarentenaItem['motivo']>('Vencido');
  const [lote, setLote] = useState<string>('');
  const [validade, setValidade] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setSelectedItemId(String(item.id));
      setLote(item.lote || '');
      setValidade(item.validade ? item.validade.split('T')[0] : '');
    } else if (items.length > 0) {
      setSelectedItemId(String(items[0].id));
    }
  }, [item, items, isOpen]);

  if (!isOpen) return null;

  const currentItem = items.find(i => String(i.id) === selectedItemId) || item;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentItem) {
      toast.warn('Selecione o artigo a isolar.');
      return;
    }

    const qtdNum = Number(quantidade);
    if (isNaN(qtdNum) || qtdNum <= 0) {
      toast.warn('Indique uma quantidade válida maior que 0.');
      return;
    }

    if (qtdNum > currentItem.stock_atual) {
      toast.error(`Quantidade informada (${qtdNum}) excede o saldo existente em armazém (${currentItem.stock_atual}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryService.isolarParaQuarentena({
        item: currentItem,
        quantidade: qtdNum,
        motivo,
        lote: lote || undefined,
        validade: validade || undefined,
        observacao: observacao || undefined,
        responsavel: user?.name || (user as any)?.nome || 'Fiel de Armazém'
      });

      toast.success(`Artigo isolado com sucesso na Zona de Quarentena.`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao transferir item para quarentena.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Isolar Artigo na Zona de Quarentena"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
          <p className="font-semibold">Aviso de Bloqueio Operacional:</p>
          <p className="mt-0.5">
            Ao isolar o artigo, a respetiva quantidade será deduzida do stock disponível para expedição e ficará bloqueada até conferência para descarte total ou reintegração.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Artigo a Isolar *
          </label>
          <select
            value={selectedItemId}
            onChange={e => {
              setSelectedItemId(e.target.value);
              const found = items.find(i => String(i.id) === e.target.value);
              if (found) {
                setLote(found.lote || '');
                setValidade(found.validade ? found.validade.split('T')[0] : '');
              }
            }}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            {items.map(it => (
              <option key={it.id} value={String(it.id)}>
                {it.codigo} - {it.nome} (Saldo: {it.stock_atual} {it.unidade_medida})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Quantidade a Bloquear *
            </label>
            <input
              type="number"
              step="any"
              min="0.01"
              max={currentItem?.stock_atual || undefined}
              required
              placeholder="0"
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
              className="w-full px-3 py-2 text-sm font-bold bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Motivo do Bloqueio *
            </label>
            <select
              value={motivo}
              onChange={e => setMotivo(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="Vencido">Prazo de Validade Expirado</option>
              <option value="Avariado / Danificado">Avaria / Deformação Estrutural</option>
              <option value="Embalagem Violada">Embalagem Rompida / Violada</option>
              <option value="Descongelamento / Contaminação">Descongelamento / Suspeita de Contaminação</option>
              <option value="Outro">Outro Motivo</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Número de Lote (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: LOT-2026-09"
              value={lote}
              onChange={e => setLote(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Data de Validade (Opcional)
            </label>
            <input
              type="date"
              value={validade}
              onChange={e => setValidade(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Descrição do Dano / Observações
          </label>
          <textarea
            rows={2}
            placeholder="Descreva a avaria, anomalia constatada ou motivo de rejeição..."
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow"
          >
            <ShieldAlert size={15} />
            {isSubmitting ? 'A Isolar...' : 'Confirmar Bloqueio em Quarentena'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

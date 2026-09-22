import React, { useState, useEffect } from 'react';
import { ArrowRightLeft, AlertCircle } from 'lucide-react';
import { InventoryItem } from '../types';
import { warehouseService } from '../../../services';
import { toast } from 'react-toastify';
import Modal from '../../../components/Common/Modal';

interface TransferModalProps {
  item: InventoryItem | null;
  items: InventoryItem[];
  armazens: any[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  item,
  items,
  armazens,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [origemArmazemId, setOrigemArmazemId] = useState<string>('');
  const [destinoArmazemId, setDestinoArmazemId] = useState<string>('');
  const [quantidade, setQuantidade] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setSelectedItemId(String(item.id));
      setOrigemArmazemId(String(item.armazem_id));
      // Escolhe um destino diferente
      const outro = armazens.find(a => String(a.id) !== String(item.armazem_id));
      if (outro) setDestinoArmazemId(String(outro.id));
    } else if (armazens.length >= 2) {
      setOrigemArmazemId(String(armazens[0].id));
      setDestinoArmazemId(String(armazens[1].id));
      if (items.length > 0) setSelectedItemId(String(items[0].id));
    }
  }, [item, armazens, items, isOpen]);

  if (!isOpen) return null;

  const currentItem = items.find(i => String(i.id) === selectedItemId) || item;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!origemArmazemId || !destinoArmazemId) {
      toast.warn('Selecione os armazéns de origem e destino.');
      return;
    }

    if (origemArmazemId === destinoArmazemId) {
      toast.error('O armazém de destino deve ser diferente do armazém de origem.');
      return;
    }

    if (!currentItem) {
      toast.warn('Selecione o artigo a transferir.');
      return;
    }

    const qtdNum = Number(quantidade);
    if (isNaN(qtdNum) || qtdNum <= 0) {
      toast.warn('Indique uma quantidade válida superior a 0.');
      return;
    }

    if (qtdNum > currentItem.stock_atual) {
      toast.error(`Quantidade solicitada (${qtdNum}) excede o saldo disponível em armazém (${currentItem.stock_atual}).`);
      return;
    }

    setIsSubmitting(true);
    try {
      await warehouseService.transfer({
        origem_armazem_id: Number(origemArmazemId),
        destino_armazem_id: Number(destinoArmazemId),
        tipo_item: currentItem.tipo_item,
        item_id: Number(currentItem.original_id),
        quantidade: qtdNum,
        observacao: observacao || `Transferência interna de stock: ${currentItem.nome}`
      });

      toast.success('Transferência de stock efetuada com sucesso!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao processar transferência entre armazéns.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transferência Interna Entre Armazéns"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Artigo a Transferir *
          </label>
          <select
            value={selectedItemId}
            onChange={e => setSelectedItemId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            {items.map(it => (
              <option key={it.id} value={String(it.id)}>
                {it.codigo} - {it.nome} (Saldo: {it.stock_atual} {it.unidade_medida})
              </option>
            ))}
          </select>
        </div>

        {/* Warehouses */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Armazém de Origem *
            </label>
            <select
              value={origemArmazemId}
              onChange={e => setOrigemArmazemId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            >
              {armazens.map(a => (
                <option key={a.id} value={String(a.id)}>{a.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Armazém de Destino *
            </label>
            <select
              value={destinoArmazemId}
              onChange={e => setDestinoArmazemId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            >
              {armazens.map(a => (
                <option key={a.id} value={String(a.id)}>{a.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quantity */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Quantidade a Transferir *
            </label>
            {currentItem && (
              <span className="text-xs text-gray-500">
                Disponível na Origem: <strong>{currentItem.stock_atual} {currentItem.unidade_medida}</strong>
              </span>
            )}
          </div>
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

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Nota da Guia de Transferência / Observações
          </label>
          <textarea
            rows={2}
            placeholder="Ex: Abastecimento para turno da pastelaria / requisição..."
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
            className="flex items-center gap-1.5 px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition shadow"
          >
            <ArrowRightLeft size={14} />
            {isSubmitting ? 'A Processar...' : 'Confirmar Transferência'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

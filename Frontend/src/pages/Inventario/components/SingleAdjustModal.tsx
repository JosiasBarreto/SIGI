import React, { useState } from 'react';
import { SlidersHorizontal, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { InventoryItem } from '../types';
import { inventoryService } from '../../../services/inventoryService';
import { toast } from 'react-toastify';
import Modal from '../../../components/Common/Modal';

interface SingleAdjustModalProps {
  item: InventoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SingleAdjustModal: React.FC<SingleAdjustModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [novaQuantidade, setNovaQuantidade] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('Quebra Operacional / Manuseamento');
  const [observacao, setObservacao] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item || !isOpen) return null;

  const diferenca = novaQuantidade !== '' ? Number(novaQuantidade) - item.stock_atual : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novaQuantidade === '') {
      toast.warn('Por favor, informe a nova quantidade contada fisicamente.');
      return;
    }

    const qtdNum = Number(novaQuantidade);
    if (isNaN(qtdNum) || qtdNum < 0) {
      toast.error('A quantidade física deve ser um número válido igual ou superior a 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await inventoryService.lancarAjusteIndividual({
        item,
        nova_quantidade: qtdNum,
        motivo,
        observacao
      });
      toast.success(`Ajuste de stock do artigo "${item.nome}" gravado com sucesso!`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error('Falha ao registar o ajuste no servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajuste Pontual de Stock Físico"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500">Artigo:</span>
            <span className="font-bold text-gray-900 dark:text-white">{item.nome} ({item.codigo})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Armazém:</span>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{item.armazem_nome}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Saldo Atual no ERP:</span>
            <span className="font-mono font-bold text-gray-900 dark:text-white">{item.stock_atual} {item.unidade_medida}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Nova Quantidade Contada Fisicamente ({item.unidade_medida}) *
          </label>
          <input
            type="number"
            step="any"
            min="0"
            required
            placeholder={`Ex: ${item.stock_atual}`}
            value={novaQuantidade}
            onChange={e => setNovaQuantidade(e.target.value)}
            className="w-full px-3 py-2 text-sm font-bold bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 dark:text-white"
          />
          {novaQuantidade !== '' && (
            <p className="text-xs mt-1.5 font-medium">
              Desvio a registar:{' '}
              <span className={diferenca > 0 ? 'text-blue-600 font-bold' : diferenca < 0 ? 'text-red-600 font-bold' : 'text-emerald-600 font-bold'}>
                {diferenca > 0 ? `+${diferenca}` : diferenca} {item.unidade_medida} ({diferenca > 0 ? 'Sobra' : diferenca < 0 ? 'Quebra' : 'Sem alteração'})
              </span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Motivo Oficial do Ajuste *
          </label>
          <select
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          >
            <option value="Quebra Operacional / Manuseamento">Quebra Operacional / Manuseamento</option>
            <option value="Perda Volátil / Evaporação / Degelo">Perda Volátil / Evaporação / Degelo</option>
            <option value="Vencimento / Deterioração">Vencimento / Deterioração</option>
            <option value="Erro de Registo Inicial / Entrada">Erro de Registo Inicial / Entrada</option>
            <option value="Consumo Interno não Registado">Consumo Interno não Registado</option>
            <option value="Outro Desvio Justificado">Outro Desvio Justificado</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Justificação / Observações da Auditoria
          </label>
          <textarea
            rows={2}
            placeholder="Detalhes adicionais para o histórico de auditoria..."
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
            className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition shadow"
          >
            {isSubmitting ? 'A Gravar...' : 'Gravar Ajuste Oficial'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

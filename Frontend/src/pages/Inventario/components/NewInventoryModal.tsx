import React, { useState } from 'react';
import { X, Calendar, Warehouse, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { InventarioTipo } from '../types';
import { inventoryAuditService } from '../../../services/inventoryAuditService';
import { toast } from 'react-toastify';

interface NewInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  armazens: any[];
  onCreated: (newId: number) => void;
}

export const NewInventoryModal: React.FC<NewInventoryModalProps> = ({
  isOpen,
  onClose,
  armazens,
  onCreated,
}) => {
  const [armazemId, setArmazemId] = useState<number>(armazens[0]?.id || 1);
  const [tipo, setTipo] = useState<InventarioTipo>('COMPLETO');
  const [dataInventario, setDataInventario] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [observacao, setObservacao] = useState<string>('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!armazemId) {
      toast.error('Por favor, selecione o armazém a inventariar.');
      return;
    }

    try {
      setLoading(true);
      const created = await inventoryAuditService.criar({
        armazem_id: Number(armazemId),
        tipo,
        data_inventario: dataInventario,
        observacao: observacao.trim() || undefined,
      });

      toast.success(`Inventário #${created.id} criado com sucesso em estado RASCUNHO.`);
      onCreated(created.id);
      onClose();
    } catch (err: any) {
      console.error('Erro ao criar inventário:', err);
      toast.error(err?.message || 'Falha ao criar sessão de inventário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Warehouse size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Novo Inventário de Stock Oficial
              </h2>
              <p className="text-xs text-gray-500">
                Abre uma nova sessão de auditoria e contagem física (SIGI ERP)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {/* Armazém */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Armazém / Localização <span className="text-red-500">*</span>
            </label>
            <select
              value={armazemId}
              onChange={(e) => setArmazemId(Number(e.target.value))}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            >
              {armazens.map((arm) => (
                <option key={arm.id} value={arm.id}>
                  {arm.nome || `Armazém #${arm.id}`} {arm.localizacao ? `(${arm.localizacao})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Inventário */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Tipo de Inventário <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipo('COMPLETO')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  tipo === 'COMPLETO'
                    ? 'border-primary bg-primary/5 text-primary dark:border-primary'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-xs">Inventário Completo</span>
                  {tipo === 'COMPLETO' && <CheckCircle2 size={14} className="text-primary" />}
                </div>
                <span className="text-[11px] text-gray-500">
                  Congela e audita 100% dos artigos existentes no armazém.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTipo('PARCIAL')}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  tipo === 'PARCIAL'
                    ? 'border-primary bg-primary/5 text-primary dark:border-primary'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-bold text-xs">Inventário Parcial / Rotativo</span>
                  {tipo === 'PARCIAL' && <CheckCircle2 size={14} className="text-primary" />}
                </div>
                <span className="text-[11px] text-gray-500">
                  Auditoria de amostragem por categoria ou itens críticos.
                </span>
              </button>
            </div>
          </div>

          {/* Data do Inventário */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Data de Realização <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={dataInventario}
                onChange={(e) => setDataInventario(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
            </div>
          </div>

          {/* Observação / Motivo */}
          <div>
            <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Observações / Justificação da Auditoria
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Auditoria semestral obrigatória, balanço de fecho de trimestre ou controlo de quebras..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none"
            />
          </div>

          {/* Banner de Princípios do Backend */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl text-[11px] text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Fluxo Rigoroso de Auditoria:</strong>
              O inventário será criado em estado <strong>RASCUNHO</strong>. A contagem física e o snapshot congelado do stock só serão ativados após clicar em <strong>"Iniciar Contagem"</strong>.
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <span>A criar sessão...</span>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Criar Inventário
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

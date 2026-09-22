import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  RotateCcw, 
  Search, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText,
  Filter
} from 'lucide-react';
import { QuarentenaItem, InventoryItem } from '../types';
import { inventoryService } from '../../../services/inventoryService';
import { toast } from 'react-toastify';

interface QuarantineTabProps {
  onOpenQuarantineModal: () => void;
  onStockUpdated: () => void;
}

export const QuarantineTab: React.FC<QuarantineTabProps> = ({
  onOpenQuarantineModal,
  onStockUpdated
}) => {
  const [quarentenaItems, setQuarentenaItems] = useState<QuarentenaItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'Quarentena' | 'Descartado' | 'Reintegrado'>('all');
  const [actionItem, setActionItem] = useState<{ item: QuarentenaItem; type: 'descarte' | 'reintegrar' } | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const carregarQuarentena = async () => {
    const itens = await inventoryService.getQuarentenaItems();
    setQuarentenaItems(itens);
  };

  useEffect(() => {
    carregarQuarentena().catch((error) => toast.error(error.message));
  }, []);

  const stats = useMemo(() => {
    let ativos = 0;
    let unidadesAtivas = 0;
    let descartados = 0;
    let reintegrados = 0;

    quarentenaItems.forEach(i => {
      if (i.status === 'Quarentena') {
        ativos++;
        unidadesAtivas += i.quantidade;
      } else if (i.status === 'Descartado') {
        descartados++;
      } else if (i.status === 'Reintegrado') {
        reintegrados++;
      }
    });

    return { ativos, unidadesAtivas, descartados, reintegrados };
  }, [quarentenaItems]);

  const filteredItems = useMemo(() => {
    return quarentenaItems.filter(it => {
      if (selectedStatus !== 'all' && it.status !== selectedStatus) return false;
      if (searchTerm) {
        const t = searchTerm.toLowerCase();
        return (
          it.nome.toLowerCase().includes(t) ||
          it.codigo.toLowerCase().includes(t) ||
          (it.lote && it.lote.toLowerCase().includes(t)) ||
          it.motivo.toLowerCase().includes(t)
        );
      }
      return true;
    });
  }, [quarentenaItems, selectedStatus, searchTerm]);

  const handleConfirmAction = async () => {
    if (!actionItem) return;
    setIsProcessing(true);

    try {
      if (actionItem.type === 'descarte') {
        if (!justificativa.trim()) {
          toast.warn('Por favor, informe a justificativa do descarte para o relatório de quebras.');
          setIsProcessing(false);
          return;
        }
        await inventoryService.descartarQuebraQuarentena(actionItem.item.id, justificativa);
        toast.success(`Descarte oficial por quebra extraordinária registado com sucesso.`);
      } else {
        await inventoryService.reintegrarStockQuarentena(actionItem.item.id, justificativa);
        toast.success(`Item reintegrado com sucesso ao stock ativo.`);
      }

      setActionItem(null);
      setJustificativa('');
      await carregarQuarentena();
      onStockUpdated();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao processar ação de quarentena.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Information Header */}
      <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-xl border border-amber-200 dark:border-amber-900/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-amber-950 dark:text-amber-100 flex items-center gap-2">
              <ShieldAlert size={18} className="text-amber-600 dark:text-amber-400" />
              Gestão de Itens Vencidos e Avariados — Zona de Quarentena (Manual do Armazém - Secção 4)
            </h3>
            <p className="text-xs text-amber-800/80 dark:text-amber-300 mt-1">
              Itens com validade expirada ou danos estruturais são imediatamente bloqueados do stock de expedição. Posteriormente, podem ser baixados como quebra extraordinária ou reintegrados após inspeção.
            </p>
          </div>

          <button
            onClick={onOpenQuarantineModal}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap"
          >
            <Plus size={15} />
            Isolar Novo Item
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Itens Bloqueados</p>
          <h4 className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-1">{stats.ativos}</h4>
          <p className="text-xs text-gray-500 mt-1">Bloqueados de expedição</p>
        </div>

        <div className="p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Volume em Quarentena</p>
          <h4 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.unidadesAtivas}</h4>
          <p className="text-xs text-gray-500 mt-1">Unidades físicas isoladas</p>
        </div>

        <div className="p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Descartes / Quebras</p>
          <h4 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{stats.descartados}</h4>
          <p className="text-xs text-gray-500 mt-1">Baixas definitivas</p>
        </div>

        <div className="p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Reintegrados</p>
          <h4 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.reintegrados}</h4>
          <p className="text-xs text-gray-500 mt-1">Aprovados após conferência</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-surface-dark p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Pesquisar por designação, código, lote ou motivo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value as any)}
            className="px-3 py-1.5 text-xs font-medium bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200"
          >
            <option value="all">Todos os Estados</option>
            <option value="Quarentena">Ativos em Quarentena</option>
            <option value="Descartado">Descartados (Quebras)</option>
            <option value="Reintegrado">Reintegrados ao Stock</option>
          </select>
        </div>
      </div>

      {/* Quarantine Table */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 text-xs">
              <tr>
                <th className="px-4 py-3">Data Bloqueio</th>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Artigo / Designação</th>
                <th className="px-4 py-3">Armazém</th>
                <th className="px-4 py-3 text-right">Qtd Isolada</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Lote / Validade</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {new Date(item.data_bloqueio).toLocaleDateString('pt-PT')}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-500">
                    {item.codigo}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-gray-900 dark:text-white">{item.nome}</div>
                    {item.observacao && (
                      <p className="text-xs text-gray-500 italic mt-0.5">{item.observacao}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {item.armazem_nome}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                    {item.quantidade} <span className="text-xs font-normal text-gray-500">{item.unidade_medida}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
                      {item.motivo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    <div>Lote: {item.lote || '-'}</div>
                    <div>Val: {item.validade ? new Date(item.validade).toLocaleDateString('pt-PT') : '-'}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {item.responsavel}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.status === 'Quarentena' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                        <Clock size={12} className="mr-1" />
                        Bloqueado
                      </span>
                    )}
                    {item.status === 'Descartado' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                        <Trash2 size={12} className="mr-1" />
                        Descarte (Quebra)
                      </span>
                    )}
                    {item.status === 'Reintegrado' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        <CheckCircle2 size={12} className="mr-1" />
                        Reintegrado
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.status === 'Quarentena' ? (
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setActionItem({ item, type: 'descarte' })}
                          title="Baixar por quebra extraordinária (Descarte Total)"
                          className="px-2 py-1 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded text-xs font-bold transition border border-red-200 dark:border-red-800/50"
                        >
                          Descarte
                        </button>
                        <button
                          onClick={() => setActionItem({ item, type: 'reintegrar' })}
                          title="Reintegrar ao stock ativo após inspeção"
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded text-xs font-bold transition border border-emerald-200 dark:border-emerald-800/50"
                        >
                          Reintegrar
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Concluído</span>
                    )}
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500">
                    <ShieldAlert className="mx-auto text-gray-300 dark:text-gray-600 mb-2" size={36} />
                    <p className="font-semibold">Nenhum artigo registado na zona de quarentena.</p>
                    <p className="text-xs mt-1">Artigos avariados ou vencidos isolados aparecerão aqui.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Dialog Modal */}
      {actionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                actionItem.type === 'descarte' 
                  ? 'bg-red-100 dark:bg-red-950/50 text-red-600' 
                  : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'
              }`}>
                {actionItem.type === 'descarte' ? <Trash2 size={24} /> : <RotateCcw size={24} />}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {actionItem.type === 'descarte' ? 'Confirmar Descarte por Quebra' : 'Reintegrar ao Stock Ativo'}
                </h3>
                <p className="text-xs text-gray-500">
                  {actionItem.item.nome} ({actionItem.item.quantidade} {actionItem.item.unidade_medida})
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {actionItem.type === 'descarte' ? 'Justificativa do Descarte (Obrigatório para Auditoria):' : 'Observação da Inspeção:'}
              </label>
              <textarea
                rows={3}
                required={actionItem.type === 'descarte'}
                placeholder={actionItem.type === 'descarte' ? 'Ex: Lote expirado descartado em conformidade com as normas sanitárias...' : 'Ex: Embalagem íntegra e lote aprovado pelo controlo de qualidade...'}
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionItem(null)}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isProcessing}
                className={`px-5 py-2 text-white rounded-lg text-xs font-bold transition shadow ${
                  actionItem.type === 'descarte' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isProcessing ? 'A Processar...' : actionItem.type === 'descarte' ? 'Confirmar Descarte Definitivo' : 'Reintegrar ao Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

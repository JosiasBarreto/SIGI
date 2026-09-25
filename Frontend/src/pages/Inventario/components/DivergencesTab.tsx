import React, { useState, useMemo } from 'react';
import { 
  AlertOctagon, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  Send, 
  ArrowLeft, 
  FileText, 
  Save, 
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { InventoryItem, ContagemItem } from '../types';
import { formatCurrency } from '../../../lib/utils';
import { inventoryService } from '../../../services/inventoryService';
import { toast } from 'react-toastify';

interface DivergencesTabProps {
  items: InventoryItem[];
  contagens: Record<string, number | null>;
  onBackToContagem: () => void;
  onSuccessAjustes: () => void;
}

export const DivergencesTab: React.FC<DivergencesTabProps> = ({
  items,
  contagens,
  onBackToContagem,
  onSuccessAjustes
}) => {
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
  const [observacaoGeral, setObservacaoGeral] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Lista de itens que foram contados e possuem divergência
  const divergenciasList: ContagemItem[] = useMemo(() => {
    const list: ContagemItem[] = [];

    items.forEach(it => {
      const valorContado = contagens[it.id];
      if (valorContado !== undefined && valorContado !== null) {
        const diferenca = Number(valorContado) - it.stock_atual;
        if (diferenca !== 0) {
          const impactoFinanceiro = diferenca * it.preco_compra;
          list.push({
            key: String(it.id),
            item_id: it.original_id,
            codigo: it.codigo,
            nome: it.nome,
            tipo_item: it.tipo_item,
            tipo: it.tipo,
            categoria: it.categoria,
            armazem_id: it.armazem_id,
            armazem_nome: it.armazem_nome,
            unidade_medida: it.unidade_medida,
            preco_unitario: it.preco_compra,
            saldo_sistema: it.stock_atual,
            quantidade_contada: Number(valorContado),
            diferenca,
            impacto_financeiro: impactoFinanceiro,
            motivo_desvio: motivos[it.id] || 'Quebra Operacional / Manuseamento',
            observacao: observacoes[it.id] || '',
            status_conferencia: diferenca > 0 ? 'Sobra' : 'Quebra'
          });
        }
      }
    });

    return list;
  }, [items, contagens, motivos, observacoes]);

  // Totais e balanço financeiro da conferência
  const balancoFinanceiro = useMemo(() => {
    let valorSobras = 0;
    let valorQuebras = 0;
    let qtdSobras = 0;
    let qtdQuebras = 0;

    divergenciasList.forEach(div => {
      if (div.diferenca > 0) {
        valorSobras += div.impacto_financeiro;
        qtdSobras += div.diferenca;
      } else {
        valorQuebras += Math.abs(div.impacto_financeiro);
        qtdQuebras += Math.abs(div.diferenca);
      }
    });

    const saldoLiquido = valorSobras - valorQuebras;

    return {
      valorSobras,
      valorQuebras,
      saldoLiquido,
      qtdSobras,
      qtdQuebras
    };
  }, [divergenciasList]);

  const handleUpdateMotivo = (key: string, val: string) => {
    setMotivos(prev => ({ ...prev, [key]: val }));
  };

  const handleUpdateObservacao = (key: string, val: string) => {
    setObservacoes(prev => ({ ...prev, [key]: val }));
  };

  const handleConfirmAjustes = async () => {
    if (divergenciasList.length === 0) {
      toast.info('Não existem divergências a ajustar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await inventoryService.lancarAjustesLote(divergenciasList, observacaoGeral);

      if (result.erros.length > 0) {
        toast.warn(`Ajustados ${result.processados} itens. Houve erro em ${result.erros.length} itens.`);
      } else {
        toast.success(`Balanço oficial de inventário gravado com sucesso! ${result.processados} artigos ajustados.`);
      }

      setShowConfirmModal(false);
      onSuccessAjustes();
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao gravar ajustes de inventário no servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with return button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertOctagon className="text-amber-500" size={20} />
            Relatório de Auditoria e Divergências de Stock
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Compare os desvios entre a contagem física do fiel e os saldos teóricos. Todo o ajuste gerará registo de auditoria com justificação.
          </p>
        </div>

        <button
          onClick={onBackToContagem}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-lg transition"
        >
          <ArrowLeft size={14} />
          Voltar à Folha de Contagem
        </button>
      </div>

      {/* Summary Financial Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Sobras Detectadas (+)</p>
              <h4 className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1">
                {formatCurrency(balancoFinanceiro.valorSobras)}
              </h4>
            </div>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{balancoFinanceiro.qtdSobras} unidades excedentes</p>
        </div>

        <div className="p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider">Quebras / Perdas (-)</p>
              <h4 className="text-xl font-black text-red-700 dark:text-red-400 mt-1">
                {formatCurrency(balancoFinanceiro.valorQuebras)}
              </h4>
            </div>
            <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 rounded-lg">
              <TrendingDown size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">{balancoFinanceiro.qtdQuebras} unidades em falta</p>
        </div>

        <div className="p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Impacto Líquido no Balanço</p>
              <h4 className={`text-xl font-black mt-1 ${
                balancoFinanceiro.saldoLiquido >= 0 
                  ? 'text-emerald-700 dark:text-emerald-400' 
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {formatCurrency(balancoFinanceiro.saldoLiquido)}
              </h4>
            </div>
            <div className={`p-2.5 rounded-lg ${
              balancoFinanceiro.saldoLiquido >= 0 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' 
                : 'bg-red-50 dark:bg-red-950/40 text-red-600'
            }`}>
              <FileText size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">Divergências em {divergenciasList.length} artigos</p>
        </div>
      </div>

      {/* Divergences list table */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">
              Lista de Divergências Encontradas ({divergenciasList.length})
            </h4>
            <p className="text-xs text-gray-500">
              Indique obrigatoriamente a justificação para cada diferença antes de aplicar os ajustes no ERP.
            </p>
          </div>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={divergenciasList.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            <Save size={15} />
            Lançar Ajustes Oficiais no ERP ({divergenciasList.length})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-gray-800 text-xs">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Designação</th>
                <th className="px-4 py-3">Armazém</th>
                <th className="px-4 py-3 text-right">Saldo Teórico</th>
                <th className="px-4 py-3 text-right">Qtd Contada</th>
                <th className="px-4 py-3 text-right">Desvio</th>
                <th className="px-4 py-3 text-right">Custo Unit.</th>
                <th className="px-4 py-3 text-right">Impacto Financeiro</th>
                <th className="px-4 py-3">Motivo da Divergência</th>
                <th className="px-4 py-3">Observações / Auditoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {divergenciasList.map(div => (
                <tr key={div.key} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-500">
                    {div.codigo}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                    {div.nome}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-300">
                    {div.armazem_nome}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-gray-700 dark:text-gray-300">
                    {div.saldo_sistema} {div.unidade_medida}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold text-gray-900 dark:text-white">
                    {div.quantidade_contada} {div.unidade_medida}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold">
                    {div.diferenca > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400">+{div.diferenca}</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">{div.diferenca}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-gray-600 dark:text-gray-400">
                    {formatCurrency(div.preco_unitario)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-bold">
                    <span className={div.impacto_financeiro >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}>
                      {formatCurrency(div.impacto_financeiro)}
                    </span>
                  </td>
                  <td className="px-4 py-3 min-w-[200px]">
                    <select
                      value={motivos[div.key] || 'Quebra Operacional / Manuseamento'}
                      onChange={e => handleUpdateMotivo(div.key, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-1 focus:ring-primary"
                    >
                      <option value="Quebra Operacional / Manuseamento">Quebra Operacional / Manuseamento</option>
                      <option value="Perda Volátil / Evaporação / Degelo">Perda Volátil / Evaporação / Degelo</option>
                      <option value="Vencimento / Deterioração">Vencimento / Deterioração</option>
                      <option value="Erro de Registo Inicial / Entrada">Erro de Registo Inicial / Entrada</option>
                      <option value="Consumo Interno não Registado">Consumo Interno não Registado</option>
                      <option value="Outro Desvio Justificado">Outro Desvio Justificado</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Nota da auditoria..."
                      value={observacoes[div.key] || ''}
                      onChange={e => handleUpdateObservacao(div.key, e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-1 focus:ring-primary"
                    />
                  </td>
                </tr>
              ))}

              {divergenciasList.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500">
                    <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={36} />
                    <p className="font-bold text-gray-800 dark:text-gray-200">Inventário Perfeitamente Conforme!</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Nenhuma discrepância encontrada entre os artigos contados e os saldos teóricos.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-surface-dark rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-600 rounded-xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Confirmar Lançamento de Balanço no ERP
                </h3>
                <p className="text-xs text-gray-500">
                  Esta operação gravará os registos de desvio operacional e atualizará o stock oficial.
                </p>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Total de Artigos a Ajustar:</span>
                <span className="font-bold text-gray-900 dark:text-white">{divergenciasList.length} artigos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Impacto Financeiro Líquido:</span>
                <span className={`font-bold ${balancoFinanceiro.saldoLiquido >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(balancoFinanceiro.saldoLiquido)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Documento / Ata:</span>
                <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                  BAL-INV-{new Date().getFullYear()}-{Date.now().toString().slice(-4)}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Observação Geral da Sessão de Inventário (Opcional):
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Balanço físico periódico do final do mês / turno da manhã..."
                value={observacaoGeral}
                onChange={e => setObservacaoGeral(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAjustes}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow"
              >
                {isSubmitting ? 'A Gravar...' : 'Confirmar e Atualizar Stock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { X, Check, FileSpreadsheet, Package } from 'lucide-react';
import { ReferenceData } from '../types';

interface ImportInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  refData: ReferenceData;
}

export const ImportInstructions: React.FC<ImportInstructionsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-surface-dark w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Regras de Importação de Catálogo
              </h2>
              <p className="text-xs text-gray-500">
                Informações para preenchimento correto do ficheiro Excel (.xlsx).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-gray-600 dark:text-gray-300">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 space-y-1">
              <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Check size={14} className="text-emerald-500" />
                Nomes e Resolução Automática
              </span>
              <p className="leading-relaxed text-gray-500 dark:text-gray-400">
                Indique o nome da Categoria e a sigla da Unidade (ex: <strong>KG</strong>, <strong>UN</strong>, <strong>L</strong>). O motor SIGI correlaciona automaticamente com os IDs internos do armazém.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 space-y-1">
              <span className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Check size={14} className="text-emerald-500" />
                Validação em Duas Fases
              </span>
              <p className="leading-relaxed text-gray-500 dark:text-gray-400">
                Fase 1 (Validação Prévia) inspeciona regras sem gravar na base de dados. Fase 2 (Gravação Efetiva) executa a transação atómica no MySQL.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
              Matriz Oficial de Validação por Tipo de Artigo:
            </h4>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-200 font-semibold">
                  <tr>
                    <th className="p-2.5 border-b border-gray-200 dark:border-gray-800">Tipo</th>
                    <th className="p-2.5 border-b border-gray-200 dark:border-gray-800">Destino BD</th>
                    <th className="p-2.5 border-b border-gray-200 dark:border-gray-800">Serviço Permitido</th>
                    <th className="p-2.5 border-b border-gray-200 dark:border-gray-800">Preços Requeridos</th>
                    <th className="p-2.5 border-b border-gray-200 dark:border-gray-800">Tempo Produção</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="p-2.5 font-bold text-gray-900 dark:text-gray-100">Consumível</td>
                    <td className="p-2.5 text-gray-500">produtos</td>
                    <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-mono text-[10px]">ABASTECIMENTO</span></td>
                    <td className="p-2.5"><strong className="text-gray-800 dark:text-gray-200">Compra</strong> obrigatório; Venda = 0</td>
                    <td className="p-2.5 text-gray-400">Não permitido (null)</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="p-2.5 font-bold text-gray-900 dark:text-gray-100">Produto Acabado</td>
                    <td className="p-2.5 text-gray-500">produtos</td>
                    <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-mono text-[10px]">COZINHA</span> ou <span className="px-1.5 py-0.5 rounded bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-mono text-[10px]">PASTELARIA</span></td>
                    <td className="p-2.5"><strong className="text-gray-800 dark:text-gray-200">Venda</strong> obrigatório; Compra = 0</td>
                    <td className="p-2.5"><strong className="text-gray-800 dark:text-gray-200">Obrigatório</strong> (minutos inteiros)</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="p-2.5 font-bold text-gray-900 dark:text-gray-100">Revenda</td>
                    <td className="p-2.5 text-gray-500">produtos</td>
                    <td className="p-2.5"><span className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-mono text-[10px]">BAR</span></td>
                    <td className="p-2.5"><strong className="text-gray-800 dark:text-gray-200">Compra e Venda</strong> obrigatórios</td>
                    <td className="p-2.5 text-gray-400">Não permitido (null)</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className="p-2.5 font-bold text-gray-900 dark:text-gray-100">Material</td>
                    <td className="p-2.5 text-gray-500">materiais</td>
                    <td className="p-2.5 text-gray-400">Não aplicável (null)</td>
                    <td className="p-2.5"><strong className="text-gray-800 dark:text-gray-200">Valor Unitário</strong> patrimonial</td>
                    <td className="p-2.5 text-gray-400">Não permitido (null)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5 text-blue-900 dark:text-blue-200">
            <Package size={15} className="shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <div className="leading-relaxed">
              <span className="font-bold">Regras de Stock e Materiais:</span>
              <ul className="list-disc list-inside mt-1 space-y-0.5 text-[11px]">
                <li>Para <strong>Material</strong>, defina o <strong>Tipo de Material</strong> como <em>Reutilizavel</em> ou <em>Consumivel</em>.</li>
                <li>Ao indicar <strong>Quantidade Inicial</strong> superior a 0, é obrigatório indicar o <strong>Armazém</strong> para lançamento inicial do movimento.</li>
                <li>O campo <strong>Descrição</strong> é opcional e detalha o produto para orçamentos e relatórios técnicos.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

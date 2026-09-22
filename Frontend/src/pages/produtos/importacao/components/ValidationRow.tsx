import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Trash2,
  Clock,
  Percent
} from 'lucide-react';
import { ValidationRowResult, ReferenceData, ImportRowNormalized } from '../types';
import { IMPORT_TYPES, MATERIAL_TYPES, DEFAULT_SERVICOS } from '../constants';

interface ValidationRowProps {
  resultado: ValidationRowResult;
  refData?: Partial<ReferenceData>;
  onUpdateRow?: (linha: number, updatedFields: Partial<ImportRowNormalized>) => void;
  onDeleteRow?: (linha: number) => void;
  onDuplicateRow?: (linha: number) => void;
}

export const ValidationRow: React.FC<ValidationRowProps> = ({
  resultado,
  refData,
  onUpdateRow,
  onDeleteRow,
  onDuplicateRow
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { linha, valido, dados, erros, alertas } = resultado;
  const hasErros = erros.length > 0;
  const hasAlertas = alertas.length > 0;
  const isMaterial = dados.tipo === 'Material';

  const handleFieldChange = (
    field: keyof ImportRowNormalized,
    value: any,
    extraFields?: Partial<ImportRowNormalized>
  ) => {
    if (onUpdateRow) {
      onUpdateRow(linha, {
        [field]: value,
        ...extraFields
      });
    }
  };

  return (
    <>
      <tr
        className={`transition-colors text-xs border-b border-gray-100 dark:border-gray-800/60 hover:bg-gray-50/70 dark:hover:bg-gray-800/40 ${
          hasErros
            ? 'bg-red-50/20 dark:bg-red-950/10'
            : hasAlertas
            ? 'bg-amber-50/15 dark:bg-amber-950/10'
            : 'bg-white dark:bg-surface-dark'
        }`}
      >
        {/* 1. Número da Linha */}
        <td className="py-2.5 px-3 font-mono text-gray-400 w-10 text-center font-medium">
          {linha}
        </td>

        {/* 2. Tipo */}
        <td className="py-2.5 px-2 w-32 min-w-[120px]">
          <div className="relative">
            <select
              value={dados.tipo || 'Consumivel'}
              onChange={e => handleFieldChange('tipo', e.target.value)}
              className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-2.5 py-1.5 pr-6 text-xs font-medium text-gray-900 dark:text-gray-100 cursor-pointer transition-colors"
            >
              {IMPORT_TYPES.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
              <ChevronDown size={13} />
            </div>
          </div>
        </td>

        {/* 3. Artigo / Nome */}
        <td className="py-2.5 px-2 min-w-[200px]">
          <input
            type="text"
            value={dados.nome || ''}
            onChange={e => handleFieldChange('nome', e.target.value)}
            placeholder="Nome do artigo..."
            className={`w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
              !dados.nome || dados.nome.trim() === ''
                ? 'border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20 text-red-900 dark:text-red-200 placeholder-red-400 focus:ring-1 focus:ring-red-400'
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary'
            }`}
          />
        </td>

        {/* 4. Categoria */}
        <td className="py-2.5 px-2 w-44 min-w-[160px]">
          {isMaterial ? (
            <div className="relative">
              <select
                value={dados.tipo_material || ''}
                onChange={e => handleFieldChange('tipo_material', e.target.value)}
                className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-2.5 py-1.5 pr-6 text-xs font-medium text-gray-900 dark:text-gray-100 cursor-pointer transition-colors"
              >
                <option value="">Tipo de Material...</option>
                {MATERIAL_TYPES.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
                <ChevronDown size={13} />
              </div>
            </div>
          ) : (
            <div className="relative">
              <select
                value={dados.categoria || ''}
                onChange={e => {
                  const val = e.target.value;
                  const selCat = refData?.categorias?.find(c => c.nome === val);
                  handleFieldChange('categoria', val, {
                    categoria_id: selCat ? selCat.id : null
                  });
                }}
                className={`w-full appearance-none rounded-lg px-2.5 py-1.5 pr-6 text-xs font-medium cursor-pointer transition-colors border ${
                  !dados.categoria
                    ? 'border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 focus:ring-1 focus:ring-amber-400'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary'
                }`}
              >
                <option value="">Selecionar categoria...</option>
                {refData?.categorias?.map(c => (
                  <option key={c.id} value={c.nome}>
                    {c.nome}
                  </option>
                ))}
                {dados.categoria &&
                  !refData?.categorias?.some(c => c.nome.toLowerCase() === dados.categoria.toLowerCase()) && (
                    <option value={dados.categoria}>
                      {dados.categoria} (Nova)
                    </option>
                  )}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
                <ChevronDown size={13} />
              </div>
            </div>
          )}
        </td>

        {/* 5. Unidade de Medida */}
        <td className="py-2.5 px-2 w-28 min-w-[95px]">
          <div className="relative">
            <select
              value={dados.unidade_medida || ''}
              onChange={e => {
                const val = e.target.value;
                const selUni = refData?.unidades?.find(
                  u => u.sigla === val || u.nome === val
                );
                handleFieldChange('unidade_medida', val, {
                  unidade_medida_id: selUni ? selUni.id : null
                });
              }}
              className={`w-full appearance-none rounded-lg px-2.5 py-1.5 pr-6 text-xs font-medium cursor-pointer transition-colors border ${
                !dados.unidade_medida
                  ? 'border-red-300 dark:border-red-800 bg-red-50/40 dark:bg-red-950/20 text-red-900 dark:text-red-200 focus:ring-1 focus:ring-red-400'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary'
              }`}
            >
              <option value="">Unid.</option>
              {refData?.unidades?.map(u => (
                <option key={u.id} value={u.sigla || u.nome}>
                  {u.sigla || u.nome}
                </option>
              ))}
              {dados.unidade_medida &&
                !refData?.unidades?.some(
                  u => (u.sigla || u.nome).toLowerCase() === dados.unidade_medida.toLowerCase()
                ) && (
                  <option value={dados.unidade_medida}>
                    {dados.unidade_medida}
                  </option>
                )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
              <ChevronDown size={13} />
            </div>
          </div>
        </td>

        {/* 6. Serviço / Afetação */}
        <td className="py-2.5 px-2 w-36 min-w-[130px]">
          <div className="relative">
            <select
              value={dados.servico || ''}
              onChange={e => handleFieldChange('servico', e.target.value)}
              className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-2.5 py-1.5 pr-6 text-xs font-medium text-gray-900 dark:text-gray-100 cursor-pointer transition-colors"
            >
              <option value="">Área / Serviço...</option>
              {(refData?.servicos?.length ? refData.servicos : DEFAULT_SERVICOS).map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
              <ChevronDown size={13} />
            </div>
          </div>
        </td>

        {/* 7. Preço */}
        <td className="py-2.5 px-2 w-28 min-w-[100px]">
          <input
            type="number"
            step="0.01"
            min="0"
            value={dados.preco_venda ?? dados.preco_compra ?? dados.valor_unitario ?? ''}
            onChange={e => {
              const val = e.target.value === '' ? null : Number(e.target.value);
              if (dados.tipo === 'Consumivel') {
                handleFieldChange('preco_compra', val);
              } else if (dados.tipo === 'Material') {
                handleFieldChange('valor_unitario', val);
              } else {
                handleFieldChange('preco_venda', val);
              }
            }}
            placeholder="0.00"
            className="w-full text-right text-xs font-mono font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
            title={dados.tipo === 'Consumivel' ? 'Preço de Compra' : dados.tipo === 'Material' ? 'Valor Unitário' : 'Preço de Venda'}
          />
        </td>

        {/* 8. Stock Inicial */}
        <td className="py-2.5 px-2 w-24 min-w-[80px]">
          <input
            type="number"
            min="0"
            value={dados.quantidade_inicial ?? ''}
            onChange={e => {
              const val = e.target.value === '' ? 0 : Number(e.target.value);
              handleFieldChange('quantidade_inicial', val);
            }}
            placeholder="0"
            className="w-full text-center text-xs font-mono font-medium px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </td>

        {/* 9. Armazém */}
        <td className="py-2.5 px-2 w-36 min-w-[130px]">
          <div className="relative">
            <select
              value={dados.armazem || ''}
              onChange={e => {
                const val = e.target.value;
                const selArm = refData?.armazens?.find(a => a.nome === val);
                handleFieldChange('armazem', val, {
                  armazem_id: selArm ? selArm.id : null
                });
              }}
              className="w-full appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-400 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-2.5 py-1.5 pr-6 text-xs font-medium text-gray-900 dark:text-gray-100 cursor-pointer transition-colors"
            >
              <option value="">Armazém...</option>
              {refData?.armazens?.map(a => (
                <option key={a.id} value={a.nome}>
                  {a.nome}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
              <ChevronDown size={13} />
            </div>
          </div>
        </td>

        {/* 10. Estado */}
        <td className="py-2.5 px-2 whitespace-nowrap text-center w-24">
          {valido && !hasErros ? (
            hasAlertas ? (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800"
                title={alertas.join('; ')}
              >
                <AlertTriangle size={11} />
                Aviso
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800"
                title="Artigo pronto para importar"
              >
                <CheckCircle2 size={11} />
                Pronto
              </span>
            )
          ) : (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/80 dark:border-red-800 cursor-help"
              title={erros.join('; ')}
            >
              <AlertCircle size={11} />
              Pendente
            </span>
          )}
        </td>

        {/* 11. Ações */}
        <td className="py-2.5 px-3 text-right whitespace-nowrap w-24">
          <div className="flex items-center justify-end gap-1">
            {onDuplicateRow && (
              <button
                type="button"
                onClick={() => onDuplicateRow(linha)}
                title="Duplicar linha"
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Copy size={13} />
              </button>
            )}

            {onDeleteRow && (
              <button
                type="button"
                onClick={() => onDeleteRow(linha)}
                title="Remover linha"
                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsExpanded(prev => !prev)}
              title={isExpanded ? 'Recolher detalhes' : 'Mais detalhes (Código, IVA, Stock Mínimo)'}
              className={`p-1 rounded-md transition-colors ${
                isExpanded
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>
        </td>
      </tr>

      {/* Linha expansível para campos complementares */}
      {isExpanded && (
        <tr className="bg-gray-50/80 dark:bg-gray-850/60 border-b border-gray-200 dark:border-gray-800">
          <td colSpan={11} className="py-3 px-6">
            <div className="space-y-2.5">
              {/* Avisos/Erros contextuais */}
              {(hasErros || hasAlertas) && (
                <div className="space-y-1">
                  {hasErros && (
                    <div className="text-[11px] text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <AlertCircle size={12} className="shrink-0" />
                      <span>{erros.join(' • ')}</span>
                    </div>
                  )}
                  {hasAlertas && (
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle size={12} className="shrink-0" />
                      <span>{alertas.join(' • ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Campos avançados em linha */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
                {/* Código / SKU */}
                <div>
                  <label className="text-[11px] text-gray-500 font-medium block mb-1">
                    Código / SKU
                  </label>
                  <input
                    type="text"
                    value={dados.codigo || ''}
                    onChange={e => handleFieldChange('codigo', e.target.value)}
                    placeholder="Auto se vazio"
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Taxa de IVA */}
                <div>
                  <label className="text-[11px] text-gray-500 font-medium block mb-1">
                    Taxa IVA
                  </label>
                  <div className="relative">
                    <select
                      value={dados.taxa_iva !== null && dados.taxa_iva !== undefined ? String(dados.taxa_iva) : ''}
                      onChange={e => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        const selTaxa = refData?.taxasIva?.find(t => Number(t.taxa) === val);
                        handleFieldChange('taxa_iva', val, {
                          taxa_iva_id: selTaxa ? selTaxa.id : null
                        });
                      }}
                      className="w-full appearance-none text-xs px-2 py-1.5 pr-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-pointer"
                    >
                      <option value="">Isento (0%)</option>
                      {refData?.taxasIva?.map(t => (
                        <option key={t.id} value={t.taxa}>
                          {t.taxa}% {t.descricao ? `(${t.descricao})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
                      <ChevronDown size={12} />
                    </div>
                  </div>
                </div>

                {/* Stock Mínimo */}
                <div>
                  <label className="text-[11px] text-gray-500 font-medium block mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dados.stock_minimo ?? ''}
                    onChange={e => handleFieldChange('stock_minimo', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Tempo de Preparação */}
                <div>
                  <label className="text-[11px] text-gray-500 font-medium block mb-1">
                    Tempo Prep. (min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={dados.tempo_producao ?? ''}
                    onChange={e => handleFieldChange('tempo_producao', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="0"
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Preço de Custo (se não for Consumível) */}
                <div>
                  <label className="text-[11px] text-gray-500 font-medium block mb-1">
                    Preço de Compra
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={dados.preco_compra ?? ''}
                    onChange={e => handleFieldChange('preco_compra', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full text-xs font-mono px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>

                {/* Descrição Detalhada */}
                <div className="col-span-2 sm:col-span-4 lg:col-span-5">
                  <label className="text-[11px] text-gray-500 font-medium block mb-1">
                    Descrição do Artigo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={dados.descricao || ''}
                    onChange={e => handleFieldChange('descricao', e.target.value)}
                    placeholder="Descrição complementar para relatórios, orçamentos e fichas técnicas..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  ListFilter
} from 'lucide-react';

import {
  ImportStep,
  ReferenceData,
  ImportRowRaw,
  ImportRowNormalized,
  ValidationRowResult,
  ValidationSummary,
  ImportFinalResult
} from './importacao/types';
import { gerarModeloExcel } from './importacao/excelTemplateGenerator';
import { parseExcelFile } from './importacao/excelParser';
import { normalizeImportRows, renormalizeSingleRow } from './importacao/excelNormalizer';
import {
  carregarDadosReferencia,
  validarLinhasBackend,
  confirmarImportacaoBackend
} from './importacao/importacaoService';

import { ImportHeader } from './importacao/components/ImportHeader';
import { ImportInstructions } from './importacao/components/ImportInstructions';
import { ExcelUpload } from './importacao/components/ExcelUpload';
import { ImportSummaryCards } from './importacao/components/ImportSummaryCards';
import { ValidationTable } from './importacao/components/ValidationTable';
import { ImportConfirmationModal } from './importacao/components/ImportConfirmationModal';
import { ImportResultModal } from './importacao/components/ImportResultModal';

export default function ImportacaoCatalogo() {
  const queryClient = useQueryClient();

  // Estado geral do fluxo
  const [step, setStep] = useState<ImportStep>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [showUploadZone, setShowUploadZone] = useState<boolean>(true);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState<boolean>(false);

  // Dados de referência (Categorias, Unidades, Armazéns, IVA)
  const [refData, setRefData] = useState<ReferenceData>({
    categorias: [],
    unidades: [],
    armazens: [],
    taxasIva: [],
    servicos: [],
    tipos: [],
    tiposMaterial: [],
    isLoading: true,
    error: null
  });

  // Linhas lidas e normalizadas
  const [, setRawRows] = useState<ImportRowRaw[]>([]);
  const [normalizedRows, setNormalizedRows] = useState<ImportRowNormalized[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationRowResult[]>([]);

  // Modais de confirmação e resultado
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [finalResult, setFinalResult] = useState<ImportFinalResult | null>(null);

  // Carregar dados de referência na inicialização
  const carregarReferencias = useCallback(async () => {
    setRefData(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await carregarDadosReferencia();
      setRefData(data);
      return data;
    } catch (err: any) {
      console.warn('Erro ao carregar referências do sistema:', err);
      setRefData(prev => ({
        ...prev,
        isLoading: false,
        error: 'Não foi possível carregar algumas referências do sistema.'
      }));
      return null;
    }
  }, []);

  // Criar linhas de exemplo para preenchimento imediato na grelha
  const gerarLinhasExemplo = useCallback((referencias: Partial<ReferenceData>) => {
    const defaultCat = referencias.categorias?.[0]?.nome || 'Bebidas';
    const defaultCatId = referencias.categorias?.[0]?.id || null;
    const pastelariaCat = referencias.categorias?.find(c => c.nome.toLowerCase().includes('pastel') || c.nome.toLowerCase().includes('merce'))?.nome || defaultCat;
    const pastelariaCatId = referencias.categorias?.find(c => c.nome.toLowerCase().includes('pastel') || c.nome.toLowerCase().includes('merce'))?.id || defaultCatId;
    const defaultArm = referencias.armazens?.[0]?.nome || 'Armazém Central';

    const rawExamples: ImportRowRaw[] = [
      {
        linha: 1,
        tipo: 'Consumivel',
        codigo: 'ALIM-001',
        nome: 'Farinha de Trigo Especial T65',
        descricao: 'Farinha de trigo alimentar para panificação e confeitaria',
        categoria: pastelariaCat,
        categoria_id: defaultCatId ? String(defaultCatId) : '',
        unidade_medida: 'KG',
        servico: 'ABASTECIMENTO',
        taxa_iva: '0',
        preco_compra: '12.50',
        stock_minimo: '50',
        quantidade_inicial: '200',
        armazem: defaultArm
      },
      {
        linha: 2,
        tipo: 'Revenda',
        codigo: 'BEB-002',
        nome: 'Água Mineral das Pedras 25cl',
        descricao: 'Água mineral natural gaseificada garrafa 25cl',
        categoria: defaultCat,
        categoria_id: pastelariaCatId ? String(pastelariaCatId) : '',
        unidade_medida: 'UN',
        servico: 'BAR',
        taxa_iva: '14',
        preco_compra: '0.65',
        preco_venda: '1.80',
        stock_minimo: '24',
        quantidade_inicial: '120',
        armazem: defaultArm
      },
      {
        linha: 3,
        tipo: 'Acabado',
        codigo: 'PROD-003',
        nome: 'Bolo de Chocolate Caseiro com Frutos Silvestres',
        descricao: 'Bolo artesanal confecionado internamente com cobertura de frutos silvestres',
        categoria: pastelariaCat,
        unidade_medida: 'UN',
        servico: 'PASTELARIA',
        taxa_iva: '14',
        preco_venda: '18.50',
        tempo_producao: '45',
        stock_minimo: '5',
        quantidade_inicial: '10',
        armazem: defaultArm
      },
      {
        linha: 4,
        tipo: 'Material',
        codigo: 'MAT-004',
        nome: 'Prato de Porcelana Rasos 26cm',
        descricao: 'Pratos de mesa rasos em porcelana reforçada para serviços e banquetes',
        categoria: 'Reutilizavel',
        tipo_material: 'Reutilizavel',
        unidade_medida: 'UN',
        servico: '',
        taxa_iva: '0',
        valor_unitario: '4.80',
        stock_minimo: '10',
        quantidade_inicial: '60',
        armazem: defaultArm
      }
    ];

    const { normalizedRows: normalized } = normalizeImportRows(rawExamples, referencias);
    setNormalizedRows(normalized);

    const resultadosIniciais: ValidationRowResult[] = normalized.map(r => ({
      linha: r.linha,
      valido: (r._errosLocais?.length || 0) === 0,
      dados: r,
      erros: r._errosLocais || [],
      alertas: r._avisosLocais || []
    }));

    setValidationResults(resultadosIniciais);
  }, []);

  useEffect(() => {
    carregarReferencias();
  }, [carregarReferencias]);

  // Ação: Adicionar uma nova linha na grelha
  const handleAdicionarLinha = () => {
    const novaLinhaNum = normalizedRows.length > 0 ? Math.max(...normalizedRows.map(r => r.linha)) + 1 : 1;
    const defaultCat = refData.categorias?.[0]?.nome || '';
    const defaultCatId = refData.categorias?.[0]?.id || null;
    const defaultUnit = refData.unidades?.[0]?.sigla || 'UN';
    const defaultUnitId = refData.unidades?.[0]?.id || null;
    const defaultArm = refData.armazens?.[0]?.nome || '';
    const defaultArmId = refData.armazens?.[0]?.id || null;
    const defaultServ = refData.servicos?.[0] || 'ABASTECIMENTO';

    const novaLinha: ImportRowNormalized = {
      linha: novaLinhaNum,
      tipo: 'Consumivel',
      codigo: '',
      nome: '',
      categoria: defaultCat,
      categoria_id: defaultCatId,
      unidade_medida: defaultUnit,
      unidade_medida_id: defaultUnitId,
      servico: defaultServ,
      taxa_iva: 15,
      taxa_iva_id: null,
      preco_compra: null,
      preco_venda: null,
      valor_unitario: null,
      tempo_producao: null,
      stock_minimo: 5,
      quantidade_inicial: 0,
      armazem: defaultArm,
      armazem_id: defaultArmId,
      tipo_material: null,
      _errosLocais: ['O nome do artigo é obrigatório.'],
      _avisosLocais: []
    };

    const updatedNormalized = [...normalizedRows, novaLinha];
    setNormalizedRows(updatedNormalized);

    const novoResultado: ValidationRowResult = {
      linha: novaLinhaNum,
      valido: false,
      dados: novaLinha,
      erros: novaLinha._errosLocais || [],
      alertas: []
    };

    setValidationResults(prev => [...prev, novoResultado]);
  };

  // Ação: Apagar linha
  const handleDeleteRow = (linhaParaRemover: number) => {
    const filteredNormalized = normalizedRows.filter(r => r.linha !== linhaParaRemover);
    const filteredValidation = validationResults.filter(r => r.linha !== linhaParaRemover);

    setNormalizedRows(filteredNormalized);
    setValidationResults(filteredValidation);
    toast.info(`Linha #${linhaParaRemover} removida.`);
  };

  // Ação: Duplicar linha
  const handleDuplicateRow = (linhaParaDuplicar: number) => {
    const alvo = normalizedRows.find(r => r.linha === linhaParaDuplicar);
    if (!alvo) return;

    const novaLinhaNum = Math.max(...normalizedRows.map(r => r.linha)) + 1;
    const duplicada: ImportRowNormalized = {
      ...alvo,
      linha: novaLinhaNum,
      codigo: alvo.codigo ? `${alvo.codigo}-COPIA` : '',
      nome: alvo.nome ? `${alvo.nome} (Cópia)` : ''
    };

    const revalidada = renormalizeSingleRow(duplicada, refData);
    setNormalizedRows(prev => [...prev, revalidada]);
    setValidationResults(prev => [
      ...prev,
      {
        linha: novaLinhaNum,
        valido: (revalidada._errosLocais?.length || 0) === 0,
        dados: revalidada,
        erros: revalidada._errosLocais || [],
        alertas: revalidada._avisosLocais || []
      }
    ]);
  };

  // Ação: Baixar modelo Excel dinâmico ou exportar grelha atual
  const handleBaixarModelo = async (usarLinhasAtuais: boolean = false) => {
    try {
      // Atualizar dados de referência do sistema antes de gerar o modelo para garantir
      // que quaisquer novas categorias, unidades de medida e taxas de IVA criadas apareçam imediatamente
      const dadosAtualizados = await carregarReferencias();
      const referenciasFinais = dadosAtualizados || refData;

      const linhasParaExportar = usarLinhasAtuais && normalizedRows.length > 0 ? normalizedRows : undefined;
      await gerarModeloExcel(referenciasFinais, linhasParaExportar);
      toast.success(
        usarLinhasAtuais
          ? 'Ficheiro Excel exportado com sucesso!'
          : 'Modelo oficial Excel (.xlsx) descarregado com dados atualizados.'
      );
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao gerar ficheiro Excel.');
    }
  };

  // Ação: Carregar e processar ficheiro Excel (.xlsx)
  const handleFileSelect = async (selectedFile: File) => {
    setStep('parsing');
    setFile(selectedFile);
    setShowUploadZone(true);
    setValidationResults([]);
    setFinalResult(null);

    try {
      const parsed = await parseExcelFile(selectedFile);
      setRawRows(parsed.rows);

      // Normalizar linhas com auxílio das referências carregadas
      const { normalizedRows: normalized, localErrorsCount, localWarningsCount } =
        normalizeImportRows(parsed.rows, refData);

      setNormalizedRows(normalized);

      // Resultados iniciais com validação local
      const initialResults: ValidationRowResult[] = normalized.map(row => ({
        linha: row.linha,
        valido: (row._errosLocais?.length || 0) === 0,
        dados: row,
        erros: row._errosLocais || [],
        alertas: row._avisosLocais || []
      }));

      setValidationResults(initialResults);
      setStep('ready_to_validate');

      toast.info(
        `${parsed.totalRows} linhas carregadas (${localErrorsCount} com alertas).`,
        { autoClose: 3000 }
      );
    } catch (err: any) {
      setStep('idle');
      setFile(null);
      toast.error(err?.message || 'Erro ao processar ficheiro Excel.');
    }
  };

  // Ação: Remover ficheiro carregado
  const handleRemoverFicheiro = () => {
    setFile(null);
    setShowUploadZone(false);
    setRawRows([]);
    setStep('idle');
    setFinalResult(null);
    toast.info('Ficheiro removido. Pode continuar a editar na grelha.');
  };

  // Ação: Validar linhas
  const handleValidarLinhas = async () => {
    if (normalizedRows.length === 0) {
      toast.warn('Nenhuma linha para validar.');
      return;
    }

    setStep('validating');

    try {
      const results = await validarLinhasBackend(normalizedRows);
      setValidationResults(results);
      setStep('validated');

      const invalidCount = results.filter(r => !r.valido || r.erros.length > 0).length;
      if (invalidCount === 0) {
        toast.success(`Todas as ${results.length} linhas estão prontas para importação.`);
      } else {
        toast.warn(`${invalidCount} artigo(s) possuem campos obrigatórios em falta.`);
      }
    } catch (err: any) {
      setStep('ready_to_validate');
      toast.error(err?.message || 'Falha ao validar os dados com o servidor.');
    }
  };

  // Resumo estatístico
  const summary: ValidationSummary = useMemo(() => {
    const total = validationResults.length;
    const erros = validationResults.filter(r => !r.valido || r.erros.length > 0).length;
    const validas = total - erros;
    const avisos = validationResults.filter(r => r.alertas.length > 0).length;

    const produtos = normalizedRows.filter(r => r.tipo !== 'Material').length;
    const materiais = normalizedRows.filter(r => r.tipo === 'Material').length;

    return { total, validas, erros, avisos, produtos, materiais };
  }, [validationResults, normalizedRows]);

  const entradasStockCount = useMemo(() => {
    return normalizedRows.filter(r => (r.quantidade_inicial || 0) > 0).length;
  }, [normalizedRows]);

  // Ação: Atualizar campos de uma linha específica
  const handleUpdateRow = useCallback(
    (linha: number, updatedFields: Partial<ImportRowNormalized>) => {
      setNormalizedRows(prev =>
        prev.map(row => {
          if (row.linha === linha) {
            const merged = { ...row, ...updatedFields };
            return renormalizeSingleRow(merged, refData);
          }
          return row;
        })
      );

      setValidationResults(prev =>
        prev.map(res => {
          if (res.linha === linha) {
            const mergedDados = { ...res.dados, ...updatedFields };
            const updatedRow = renormalizeSingleRow(mergedDados, refData);
            const erros = updatedRow._errosLocais || [];
            const alertas = updatedRow._avisosLocais || [];
            return {
              ...res,
              valido: erros.length === 0,
              dados: updatedRow,
              erros,
              alertas
            };
          }
          return res;
        })
      );
    },
    [refData]
  );

  // Ação: Abrir modal de confirmação
  const handleAbrirConfirmacao = () => {
    if (validationResults.length === 0) {
      toast.warn('É necessário ter linhas preenchidas antes de confirmar a importação.');
      return;
    }

    if (summary.erros > 0) {
      toast.error('Corrija todas as linhas com pendências antes de gravar.');
      return;
    }

    setIsConfirmModalOpen(true);
  };

  // Ação: Confirmar importação definitiva
  const handleConfirmarImportacao = async () => {
    if (step === 'confirming') return;
    setStep('confirming');

    try {
      const res = await confirmarImportacaoBackend(normalizedRows);
      setFinalResult(res);
      setIsConfirmModalOpen(false);
      setIsResultModalOpen(true);
      setStep('completed');

      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['armazens'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });

      toast.success('Produtos gravados com sucesso no catálogo!');
    } catch (err: any) {
      setStep('validated');
      toast.error(err?.message || 'Ocorreu um erro ao gravar no servidor.');
    }
  };

  // Ação: Fechar modal de resultado e reiniciar com grelha limpa
  const handleFecharResultado = () => {
    setIsResultModalOpen(false);
    handleRemoverFicheiro();
    setNormalizedRows([]);
    setValidationResults([]);
  };

  const hasBlockedRows = summary.erros > 0;
  const canConfirm = validationResults.length > 0 && !hasBlockedRows;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      {/* 1. Cabeçalho Principal */}
      <ImportHeader
        currentStep={step}
        refData={refData}
        onBaixarModelo={() => handleBaixarModelo(false)}
        onRecarregarReferencias={carregarReferencias}
        onOpenAjuda={() => setIsInstructionsOpen(true)}
        onCarregarFicheiroClick={() => setShowUploadZone(prev => !prev)}
      />

      {/* 2. Zona de Ficheiro (Dropzone ou Barra de Ficheiro Carregado) */}
      {(showUploadZone || file) && (
        <ExcelUpload
          step={step}
          file={file}
          totalLinhasLidas={normalizedRows.length}
          onFileSelect={handleFileSelect}
          onRemoverFicheiro={handleRemoverFicheiro}
          onValidarFicheiro={handleValidarLinhas}
        />
      )}

      {/* 3. Barra Resumo de Contadores */}
      <ImportSummaryCards
        summary={summary}
        entradasStockCount={entradasStockCount}
      />

      {/* 4. Tabela Interativa de Linhas */}
      <ValidationTable
        resultados={validationResults}
        refData={refData}
        onUpdateRow={handleUpdateRow}
        onAddRow={handleAdicionarLinha}
        onLoadExamples={() => gerarLinhasExemplo(refData)}
        onDeleteRow={handleDeleteRow}
        onDuplicateRow={handleDuplicateRow}
        onExportExcel={() => handleBaixarModelo(true)}
      />

      {/* 5. Barra Inferior de Ação */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs text-gray-500">
          {canConfirm ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 size={15} />
              {summary.total} artigos validados e prontos para gravação.
            </span>
          ) : hasBlockedRows ? (
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
              <AlertCircle size={15} />
              {summary.erros} artigo(s) possuem campos obrigatórios por preencher.
            </span>
          ) : (
            <span>Adicione ou valide os artigos antes de gravar no catálogo.</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-center">
          <button
            type="button"
            onClick={handleValidarLinhas}
            disabled={step === 'validating' || normalizedRows.length === 0}
            className="px-3.5 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <ListFilter size={13} />
            <span>{step === 'validating' ? 'A validar...' : 'Validar Dados'}</span>
          </button>

          <button
            type="button"
            onClick={handleAbrirConfirmacao}
            disabled={!canConfirm}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Upload size={14} />
            <span>Gravar Catálogo</span>
          </button>
        </div>
      </div>

      {/* 6. Modal de Regras de Importação */}
      <ImportInstructions
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        refData={refData}
      />

      {/* 7. Modal de Confirmação */}
      <ImportConfirmationModal
        isOpen={isConfirmModalOpen}
        isConfirming={step === 'confirming'}
        summary={summary}
        entradasStockCount={entradasStockCount}
        onCancel={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmarImportacao}
      />

      {/* 8. Modal de Resultado Final */}
      <ImportResultModal
        isOpen={isResultModalOpen}
        result={finalResult}
        onClose={handleFecharResultado}
      />
    </div>
  );
}

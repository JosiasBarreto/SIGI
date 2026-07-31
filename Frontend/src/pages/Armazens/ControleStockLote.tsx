import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  PackagePlus, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  FileText, 
  RotateCcw,
  Boxes,
  ArrowRight,
  ArrowLeft,
  ListPlus,
  Check,
  Building2,
  Layers,
  ShoppingBag,
  Utensils,
  Tag,
  Wrench,
  ArrowUpRight,
  ArrowDownLeft,
  Info
} from 'lucide-react';
import { productService, materialService, warehouseService, supplierService } from '../../services';
import { formatCurrency, cn } from '../../lib/utils';
import { toast } from 'react-toastify';
import Modal from '../../components/Common/Modal';

interface Armazem {
  id: string | number;
  nome: string;
  codigo: string;
}

interface ControleStockLoteProps {
  armazens: Armazem[];
  defaultArmazemId?: string | number;
  defaultItemTypeFilter?: 'all' | 'Produto' | 'Material';
}

export interface BatchItem {
  id_key: string; // Unique key for front-end table
  tipo_item: 'Produto' | 'Material' | 'Ingrediente';
  produto_id?: number;
  material_id?: number;
  ingrediente_id?: number;
  codigo: string;
  nome: string;
  tipo_sub?: string; // Consumivel, Acabado, Revenda, Material
  categoria: string;
  unidade_medida: string;
  armazem_id: number | string;
  tipo: 'Entrada' | 'Saida';
  stock_atual: number;
  preco_compra_atual: number;
  preco_compra: number;
  quantidade: number;
  observacao: string;
}

export const ControleStockLote: React.FC<ControleStockLoteProps> = ({ 
  armazens, 
  defaultArmazemId,
  defaultItemTypeFilter = 'all'
}) => {
  const queryClient = useQueryClient();

  // Step state (1: Cabeçalho Fatura, 2: Seleção por Degrau, 3: Tabela & Quantidades/Armazéns)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Etapa 1: Header form states
  const [numeroFatura, setNumeroFatura] = useState('');
  const [fornecedorId, setFornecedorId] = useState<string | number>('');
  const [defaultArmazemHeader, setDefaultArmazemHeader] = useState<string | number>(defaultArmazemId || armazens[0]?.id || '');
  const [observacaoGeral, setObservacaoGeral] = useState('');

  // Etapa 2: Stepped Filters
  const [selectedItemKind, setSelectedItemKind] = useState<'all' | 'Produto' | 'Material'>(defaultItemTypeFilter);
  const [selectedTipoProd, setSelectedTipoProd] = useState<string>('all'); // 'all', 'Consumivel', 'Acabado', 'Revenda'
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination for Step 2 catalog list
  const [catalogPage, setCatalogPage] = useState<number>(1);
  const [catalogPerPage, setCatalogPerPage] = useState<number>(10);

  // Reset pagination when filters change
  useEffect(() => {
    setCatalogPage(1);
  }, [selectedItemKind, selectedTipoProd, selectedCategory, searchTerm]);

  // Selected batch items table state
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  // Response modal state after successful submission
  const [successModalData, setSuccessModalData] = useState<any>(null);

  // Fetch available products
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products-for-stock-entry'],
    queryFn: () => productService.getAll({ per_page: 5000 }).catch(() => ({ items: [] }))
  });

  // Fetch available materials
  const { data: materialsData, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['materials-for-stock-entry'],
    queryFn: () => materialService.getAll({ per_page: 5000 }).catch(() => ({ items: [] }))
  });

  // Fetch suppliers
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-for-stock-entry'],
    queryFn: () => supplierService.getAll({ per_page: 500 }).catch(() => ({ items: [] }))
  });

  // Normalized catalog combining products & materials
  const catalog = useMemo(() => {
    const itemsList: Array<{
      key_id: string;
      item_type: 'Produto' | 'Material';
      real_id: number;
      codigo: string;
      nome: string;
      tipo_sub: string;
      categoria: string;
      unidade_medida: string;
      stock_atual: number;
      preco_compra: number;
    }> = [];

    // Products
    const rawProds = productsData?.items || (Array.isArray(productsData) ? productsData : []);
    rawProds.forEach((p: any) => {
      let tipoNorm = p.tipo || p.tipo_produto || 'Consumivel';
      if (tipoNorm.toLowerCase().includes('acabado')) tipoNorm = 'Acabado';
      else if (tipoNorm.toLowerCase().includes('revenda')) tipoNorm = 'Revenda';
      else if (tipoNorm.toLowerCase().includes('consum') || tipoNorm.toLowerCase().includes('ingrediente')) tipoNorm = 'Consumivel';

      itemsList.push({
        key_id: `prod-${p.id}`,
        item_type: 'Produto',
        real_id: Number(p.id),
        codigo: p.codigo || p.produto_codigo || `PROD-${p.id}`,
        nome: p.nome || p.produto_nome || 'Produto sem nome',
        tipo_sub: tipoNorm,
        categoria: p.categoria || p.categoria_nome || 'Produtos Geral',
        unidade_medida: p.unidade_medida || p.unidade_medida_sigla || 'un',
        stock_atual: Number(p.stock_atual ?? p.quantidade_atual ?? p.quantidade ?? 0),
        preco_compra: Number(p.preco_compra ?? p.preco_custo ?? 0)
      });
    });

    // Materials
    const rawMats = materialsData?.items || (Array.isArray(materialsData) ? materialsData : []);
    rawMats.forEach((m: any) => {
      itemsList.push({
        key_id: `mat-${m.id}`,
        item_type: 'Material',
        real_id: Number(m.id),
        codigo: m.codigo || m.codigo_material || `MAT-${m.id}`,
        nome: m.nome || m.material_nome || 'Material sem nome',
        tipo_sub: 'Material',
        categoria: m.categoria || m.categoria_nome || 'Materiais Geral',
        unidade_medida: m.unidade_medida || m.unidade_medida_sigla || 'un',
        stock_atual: Number(m.stock_atual ?? m.quantidade_atual ?? m.quantidade ?? 0),
        preco_compra: Number(m.preco_compra ?? m.custo_unitario ?? m.preco_custo ?? 0)
      });
    });

    return itemsList;
  }, [productsData, materialsData]);

  const suppliers = useMemo(() => {
    return suppliersData?.items || (Array.isArray(suppliersData) ? suppliersData : []);
  }, [suppliersData]);

  // Dynamic categories based on selected Item Kind & Tipo Sub
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((item) => {
      if (selectedItemKind !== 'all' && item.item_type !== selectedItemKind) return;
      if (selectedItemKind === 'Produto' && selectedTipoProd !== 'all' && item.tipo_sub !== selectedTipoProd) return;
      if (item.categoria) set.add(item.categoria);
    });
    return Array.from(set);
  }, [catalog, selectedItemKind, selectedTipoProd]);

  // Filtered available catalog items for Step 2
  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      // Kind Filter (Produto vs Material)
      if (selectedItemKind !== 'all' && item.item_type !== selectedItemKind) return false;
      // Subtype Filter for Products
      if (selectedItemKind === 'Produto' && selectedTipoProd !== 'all' && item.tipo_sub !== selectedTipoProd) return false;
      // Category Filter
      if (selectedCategory !== 'all' && item.categoria !== selectedCategory) return false;
      // Search Term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = item.nome.toLowerCase().includes(term);
        const matchCode = item.codigo.toLowerCase().includes(term);
        if (!matchName && !matchCode) return false;
      }
      return true;
    });
  }, [catalog, selectedItemKind, selectedTipoProd, selectedCategory, searchTerm]);

  // Total pages & slice of catalog for current page
  const totalCatalogPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredCatalog.length / catalogPerPage));
  }, [filteredCatalog.length, catalogPerPage]);

  const paginatedCatalog = useMemo(() => {
    const start = (catalogPage - 1) * catalogPerPage;
    return filteredCatalog.slice(start, start + catalogPerPage);
  }, [filteredCatalog, catalogPage, catalogPerPage]);

  // Fast map of selected item keys
  const selectedKeyIds = useMemo(() => {
    return new Set(batchItems.map(item => item.id_key));
  }, [batchItems]);

  // Check if all items in current page are selected
  const isAllPageSelected = useMemo(() => {
    if (paginatedCatalog.length === 0) return false;
    return paginatedCatalog.every(item => selectedKeyIds.has(item.key_id));
  }, [paginatedCatalog, selectedKeyIds]);

  // Toggle selection for all visible items on current page
  const handleToggleSelectPage = () => {
    if (isAllPageSelected) {
      const keysInPage = new Set(paginatedCatalog.map(i => i.key_id));
      setBatchItems(prev => prev.filter(b => !keysInPage.has(b.id_key)));
    } else {
      const toAdd: BatchItem[] = [];
      paginatedCatalog.forEach(catItem => {
        if (!selectedKeyIds.has(catItem.key_id)) {
          toAdd.push({
            id_key: catItem.key_id,
            tipo_item: catItem.item_type,
            produto_id: catItem.item_type === 'Produto' ? catItem.real_id : undefined,
            material_id: catItem.item_type === 'Material' ? catItem.real_id : undefined,
            codigo: catItem.codigo,
            nome: catItem.nome,
            tipo_sub: catItem.tipo_sub,
            categoria: catItem.categoria,
            unidade_medida: catItem.unidade_medida,
            armazem_id: defaultArmazemHeader || armazens[0]?.id || 1,
            tipo: 'Entrada',
            stock_atual: catItem.stock_atual,
            preco_compra_atual: catItem.preco_compra,
            preco_compra: catItem.preco_compra || 0,
            quantidade: 1,
            observacao: ''
          });
        }
      });
      setBatchItems(prev => [...prev, ...toAdd]);
    }
  };

  // Toggle single item selection
  const handleToggleCatalogItem = (catItem: typeof catalog[0]) => {
    if (selectedKeyIds.has(catItem.key_id)) {
      setBatchItems(prev => prev.filter(b => b.id_key !== catItem.key_id));
    } else {
      const newItem: BatchItem = {
        id_key: catItem.key_id,
        tipo_item: catItem.item_type,
        produto_id: catItem.item_type === 'Produto' ? catItem.real_id : undefined,
        material_id: catItem.item_type === 'Material' ? catItem.real_id : undefined,
        codigo: catItem.codigo,
        nome: catItem.nome,
        tipo_sub: catItem.tipo_sub,
        categoria: catItem.categoria,
        unidade_medida: catItem.unidade_medida,
        armazem_id: defaultArmazemHeader || armazens[0]?.id || 1,
        tipo: 'Entrada',
        stock_atual: catItem.stock_atual,
        preco_compra_atual: catItem.preco_compra,
        preco_compra: catItem.preco_compra || 0,
        quantidade: 1,
        observacao: ''
      };
      setBatchItems(prev => [...prev, newItem]);
    }
  };

  // Select all filtered items
  const handleAddAllFiltered = () => {
    const toAdd: BatchItem[] = [];
    filteredCatalog.forEach((catItem) => {
      if (!selectedKeyIds.has(catItem.key_id)) {
        toAdd.push({
          id_key: catItem.key_id,
          tipo_item: catItem.item_type,
          produto_id: catItem.item_type === 'Produto' ? catItem.real_id : undefined,
          material_id: catItem.item_type === 'Material' ? catItem.real_id : undefined,
          codigo: catItem.codigo,
          nome: catItem.nome,
          tipo_sub: catItem.tipo_sub,
          categoria: catItem.categoria,
          unidade_medida: catItem.unidade_medida,
          armazem_id: defaultArmazemHeader || armazens[0]?.id || 1,
          tipo: 'Entrada',
          stock_atual: catItem.stock_atual,
          preco_compra_atual: catItem.preco_compra,
          preco_compra: catItem.preco_compra || 0,
          quantidade: 1,
          observacao: ''
        });
      }
    });
    if (toAdd.length > 0) {
      setBatchItems(prev => [...prev, ...toAdd]);
      toast.info(`${toAdd.length} itens adicionados à lista de movimentação.`);
    }
  };

  // Update line item in batch
  const handleUpdateItem = (index: number, field: keyof BatchItem, value: any) => {
    setBatchItems(prev => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        [field]: value
      };
      return next;
    });
  };

  // Remove line item from batch
  const handleRemoveItem = (index: number) => {
    setBatchItems(prev => prev.filter((_, i) => i !== index));
  };

  // Clear batch table
  const handleClearBatch = () => {
    setBatchItems([]);
  };

  // Navigation handlers with validations
  const goToStep2 = () => {
    setCurrentStep(2);
  };

  const goToStep3 = () => {
    if (batchItems.length === 0) {
      toast.error('Selecione pelo menos um produto ou material antes de avançar.');
      return;
    }
    setCurrentStep(3);
  };

  // Mutation for posting batch movement
  const movimentacaoLoteMutation = useMutation({
    mutationFn: (payload: any) => warehouseService.movimentacaoLote(payload),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['armazens'] });
      queryClient.invalidateQueries({ queryKey: ['armazem-stock'] });
      queryClient.invalidateQueries({ queryKey: ['all-products-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products-for-stock-entry'] });
      queryClient.invalidateQueries({ queryKey: ['materials-for-stock-entry'] });
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['products-vendas'] });

      toast.success(data?.msg || 'Movimentação em lote registada com sucesso!');
      setSuccessModalData(data?.dados || data);
      
      // Reset form & wizard
      setBatchItems([]);
      setNumeroFatura('');
      setObservacaoGeral('');
      setCurrentStep(1);
    },
    onError: (err: any) => {
      console.error(err);
      const errorMsg = err?.response?.data?.msg || err?.message || 'Erro ao processar movimentação em lote.';
      toast.error(errorMsg, { autoClose: 7000 });
    }
  });

  const handleSubmitFinal = () => {
    if (batchItems.length === 0) {
      toast.error('A lista de itens a movimentar está vazia.');
      setCurrentStep(2);
      return;
    }

    // Validate armazem_id on each item
    const missingArmazem = batchItems.find(item => !item.armazem_id);
    if (missingArmazem) {
      toast.error(`O item "${missingArmazem.nome}" não tem armazém de destino/origem selecionado.`);
      return;
    }

    // Validate quantities
    const invalidQuantities = batchItems.filter(item => isNaN(item.quantidade) || item.quantidade <= 0);
    if (invalidQuantities.length > 0) {
      toast.error(`Existem ${invalidQuantities.length} item(ns) com quantidade inválida (deve ser maior que 0).`);
      return;
    }

    // Construct Payload according to API spec
    const payload = {
      numero_fatura: numeroFatura.trim() || undefined,
      fornecedor_id: fornecedorId ? Number(fornecedorId) : undefined,
      observacao: observacaoGeral.trim() || undefined,
      itens: batchItems.map(item => {
        const baseItem: any = {
          tipo_item: item.tipo_item,
          armazem_id: Number(item.armazem_id),
          tipo: item.tipo, // 'Entrada' | 'Saida'
          quantidade: Number(item.quantidade),
          preco_compra: item.preco_compra ? Number(item.preco_compra) : undefined,
          observacao: item.observacao.trim() || undefined
        };

        if (item.tipo_item === 'Produto') {
          baseItem.produto_id = item.produto_id;
        } else if (item.tipo_item === 'Material') {
          baseItem.material_id = item.material_id;
        } else if (item.tipo_item === 'Ingrediente') {
          baseItem.ingrediente_id = item.produto_id || item.material_id;
        }

        return baseItem;
      })
    };

    movimentacaoLoteMutation.mutate(payload);
  };

  // Calculated totals
  const totalItemsCount = batchItems.length;
  const totalEntradasCount = batchItems.filter(i => i.tipo === 'Entrada').length;
  const totalSaidasCount = batchItems.filter(i => i.tipo === 'Saida').length;
  const totalValueEntradas = batchItems
    .filter(i => i.tipo === 'Entrada')
    .reduce((acc, curr) => acc + ((Number(curr.quantidade) || 0) * (Number(curr.preco_compra) || 0)), 0);

  const selectedSupplierObj = suppliers.find((s: any) => String(s.id) === String(fornecedorId));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Wizard Header Banner & Step Bar */}
      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <PackagePlus className="text-primary" size={24} />
              <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">
                Movimentação em Lote (Produtos & Materiais)
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-1">
              Entrada (+) e Saída (-) de stock com definição de armazém por item, suporte para Produtos, Materiais e Faturas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">Progresso:</span>
            <span className="px-3 py-1 bg-primary/10 text-primary font-mono font-black text-xs rounded-full uppercase tracking-wider">
              Etapa {currentStep} de 3
            </span>
          </div>
        </div>

        {/* Wizard Steps Breadcrumb */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1 Button */}
          <button
            onClick={() => setCurrentStep(1)}
            className={cn(
              "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all relative overflow-hidden",
              currentStep === 1 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                : currentStep > 1 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" 
                  : "bg-gray-50 dark:bg-gray-900 text-gray-400 border-gray-200 dark:border-gray-800"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0",
              currentStep === 1 ? "bg-white/20 text-white" : currentStep > 1 ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-500"
            )}>
              {currentStep > 1 ? <Check size={16} /> : "1"}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-widest font-extrabold block opacity-80">Etapa 1</span>
              <span className="text-xs font-bold truncate block">Dados Gerais / Fatura</span>
            </div>
          </button>

          {/* Step 2 Button */}
          <button
            onClick={goToStep2}
            className={cn(
              "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all relative overflow-hidden",
              currentStep === 2 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                : currentStep > 2 
                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800" 
                  : "bg-gray-50 dark:bg-gray-900 text-gray-400 border-gray-200 dark:border-gray-800"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0",
              currentStep === 2 ? "bg-white/20 text-white" : currentStep > 2 ? "bg-emerald-500 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-500"
            )}>
              {currentStep > 2 ? <Check size={16} /> : "2"}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-widest font-extrabold block opacity-80">Etapa 2</span>
              <span className="text-xs font-bold truncate block">
                Selecionar Itens ({batchItems.length})
              </span>
            </div>
          </button>

          {/* Step 3 Button */}
          <button
            onClick={goToStep3}
            className={cn(
              "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all relative overflow-hidden",
              currentStep === 3 
                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                : "bg-gray-50 dark:bg-gray-900 text-gray-400 border-gray-200 dark:border-gray-800"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0",
              currentStep === 3 ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-500"
            )}>
              3
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase tracking-widest font-extrabold block opacity-80">Etapa 3</span>
              <span className="text-xs font-bold truncate block">Armazéns, Operação & Finalizar</span>
            </div>
          </button>
        </div>
      </div>

      {/* STEP 1: DADOS GERAIS DO DOCUMENTO / FATURA */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <FileText size={16} className="text-primary" /> 1. Inserir Dados Gerais da Operação / Fatura
            </h3>
            <span className="text-[11px] text-gray-400 font-medium">Opcionais ou Referência de Lote</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Numero da Fatura */}
            <div>
              <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">
                Número da Fatura / Guia de Referência
              </label>
              <input
                type="text"
                placeholder="Ex: FAT-2026/089"
                value={numeroFatura}
                onChange={e => setNumeroFatura(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 focus:border-primary px-4 py-3 rounded-xl outline-none text-xs font-bold font-mono transition-all dark:text-white"
              />
              <p className="text-[10px] text-gray-400 mt-1">Número de documento fiscal ou recibo de transporte.</p>
            </div>

            {/* Armazem Padrao para novos itens */}
            <div>
              <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">
                Armazém Padrão (Pré-preenchimento)
              </label>
              <select
                value={defaultArmazemHeader}
                onChange={e => setDefaultArmazemHeader(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 focus:border-primary px-4 py-3 rounded-xl outline-none text-xs font-bold transition-all dark:text-white"
              >
                {armazens.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.codigo})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">Pode alterar o armazém individualmente por item na Etapa 3.</p>
            </div>

            {/* Fornecedor */}
            <div>
              <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">
                Fornecedor (Opcional)
              </label>
              <select
                value={fornecedorId}
                onChange={e => setFornecedorId(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 focus:border-primary px-4 py-3 rounded-xl outline-none text-xs font-bold transition-all dark:text-white"
              >
                <option value="">Nenhum / Selecione fornecedor...</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.nome || s.empresa || `Fornecedor #${s.id}`}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">Entidade fornecedora da encomenda.</p>
            </div>
          </div>

          {/* Observacao Geral */}
          <div>
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">
              Observações Gerais da Operação
            </label>
            <input
              type="text"
              placeholder="Ex: Receção de mercadorias e acerto semanal de materiais de copa"
              value={observacaoGeral}
              onChange={e => setObservacaoGeral(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 focus:border-primary px-4 py-3 rounded-xl outline-none text-xs font-medium transition-all dark:text-white"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
            <button
              type="button"
              onClick={goToStep2}
              className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/20 flex items-center gap-2 transition-all"
            >
              Próximo: Selecionar Produtos e Materiais <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SELEÇÃO DE ITENS POR FILTROS EM DEGRAU */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <Boxes size={16} className="text-primary" /> 2. Selecionar Produtos e Materiais (Filtros por Degrau)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                Alterne entre Produtos (Consumíveis, Acabados, Revenda) e Materiais, depois filtre por Categoria.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                Itens na lista: <strong className="text-primary font-mono">{batchItems.length}</strong>
              </span>
              {filteredCatalog.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddAllFiltered}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <ListPlus size={14} /> Selecionar Todos Filtrados ({filteredCatalog.length})
                </button>
              )}
            </div>
          </div>

          {/* FILTRO DEGRAU 1: Tipo Principal (Produto vs Material) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Layers size={13} className="text-primary" /> Degrau 1 — Tipo de Item
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => { setSelectedItemKind('all'); setSelectedCategory('all'); }}
                className={cn(
                  "p-3.5 rounded-xl border text-left transition-all flex items-center justify-between",
                  selectedItemKind === 'all'
                    ? "bg-primary text-white border-primary shadow-md shadow-primary/20 font-bold"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <Boxes size={18} />
                  <div>
                    <span className="text-xs font-black block">Todos os Itens</span>
                    <span className="text-[10px] opacity-80 font-normal">Produtos + Materiais</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedItemKind('Produto'); setSelectedCategory('all'); }}
                className={cn(
                  "p-3.5 rounded-xl border text-left transition-all flex items-center justify-between",
                  selectedItemKind === 'Produto'
                    ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 font-bold"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag size={18} />
                  <div>
                    <span className="text-xs font-black block">Produtos</span>
                    <span className="text-[10px] opacity-80 font-normal">Consumíveis, Acabados, Revenda</span>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => { setSelectedItemKind('Material'); setSelectedCategory('all'); }}
                className={cn(
                  "p-3.5 rounded-xl border text-left transition-all flex items-center justify-between",
                  selectedItemKind === 'Material'
                    ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 font-bold"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <Wrench size={18} />
                  <div>
                    <span className="text-xs font-black block">Materiais</span>
                    <span className="text-[10px] opacity-80 font-normal">Utensílios, Fardamentos, Equip.</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* FILTRO DEGRAU 2: Se 'Produto' selecionado, Subtipo (Consumível, Acabado, Revenda) */}
          {selectedItemKind === 'Produto' && (
            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Utensils size={13} className="text-primary" /> Subtipo de Produto
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => { setSelectedTipoProd('all'); setSelectedCategory('all'); }}
                  className={cn(
                    "p-2.5 rounded-xl border text-center text-xs font-bold transition-all",
                    selectedTipoProd === 'all'
                      ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                  )}
                >
                  Todos os Produtos
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedTipoProd('Consumivel'); setSelectedCategory('all'); }}
                  className={cn(
                    "p-2.5 rounded-xl border text-center text-xs font-bold transition-all",
                    selectedTipoProd === 'Consumivel'
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                  )}
                >
                  Consumível / Ingrediente
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedTipoProd('Acabado'); setSelectedCategory('all'); }}
                  className={cn(
                    "p-2.5 rounded-xl border text-center text-xs font-bold transition-all",
                    selectedTipoProd === 'Acabado'
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                  )}
                >
                  Produtos Acabados
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedTipoProd('Revenda'); setSelectedCategory('all'); }}
                  className={cn(
                    "p-2.5 rounded-xl border text-center text-xs font-bold transition-all",
                    selectedTipoProd === 'Revenda'
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                  )}
                >
                  Produtos de Revenda
                </button>
              </div>
            </div>
          )}

          {/* FILTRO DEGRAU 3: Categoria & Pesquisa */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Tag size={13} className="text-primary" /> Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full py-2.5 px-3 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:border-primary transition-all dark:text-white"
              >
                <option value="all">Todas as Categorias ({availableCategories.length})</option>
                {availableCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <Search size={13} className="text-primary" /> Pesquisar por Nome ou Código
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Digitar nome do item ou código (ex: Toalhas, Farinha, PROD-01)..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold outline-none focus:border-primary transition-all dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* TABELA PAGINADA DE RESULTADOS PARA SELEÇÃO */}
          <div className="pt-2 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[11px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                Catálogo de Itens Encontrados ({filteredCatalog.length})
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold">
                  {batchItems.length} Selecionados no Lote
                </span>
              </span>
              <div className="flex items-center gap-2">
                {paginatedCatalog.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleSelectPage}
                    className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    {isAllPageSelected ? 'Desmarcar Página' : 'Selecionar Visíveis na Página'}
                  </button>
                )}
                {batchItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearBatch}
                    className="text-xs text-red-500 hover:text-red-700 font-bold hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={12} /> Limpar Seleção ({batchItems.length})
                  </button>
                )}
              </div>
            </div>

            {isLoadingProducts || isLoadingMaterials ? (
              <div className="py-12 text-center text-xs text-gray-400 font-bold uppercase tracking-wider">
                A carregar catálogo de produtos e materiais...
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="py-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 space-y-2">
                <Boxes className="mx-auto text-gray-400" size={32} />
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  Nenhum item encontrado com os filtros selecionados.
                </p>
                <p className="text-[11px] text-gray-400">
                  Tente alterar o tipo de item, a categoria ou a palavra de pesquisa.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                  <table className="w-full text-left text-xs border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 uppercase text-[10px] font-black tracking-wider border-b border-gray-200 dark:border-gray-700">
                        <th className="py-2.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isAllPageSelected}
                            onChange={handleToggleSelectPage}
                            className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                            title="Selecionar/Desmarcar todos na página"
                          />
                        </th>
                        <th className="py-2.5 px-3 w-24">Tipo</th>
                        <th className="py-2.5 px-3 w-28">Código</th>
                        <th className="py-2.5 px-3">Nome do Item</th>
                        <th className="py-2.5 px-3">Categoria</th>
                        <th className="py-2.5 px-3 text-right">Stock Atual</th>
                        <th className="py-2.5 px-3 text-right">Preço Compra</th>
                        <th className="py-2.5 px-3 text-center w-32">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-surface-dark">
                      {paginatedCatalog.map((catItem) => {
                        const isSelected = selectedKeyIds.has(catItem.key_id);

                        return (
                          <tr
                            key={catItem.key_id}
                            onClick={() => handleToggleCatalogItem(catItem)}
                            className={cn(
                              "cursor-pointer transition-colors",
                              isSelected 
                                ? "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10" 
                                : "hover:bg-gray-50/70 dark:hover:bg-gray-800/50"
                            )}
                          >
                            <td className="py-2 px-3 text-center" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleCatalogItem(catItem)}
                                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider inline-block",
                                catItem.item_type === 'Produto' 
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" 
                                  : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                              )}>
                                {catItem.item_type}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] font-bold text-gray-500 dark:text-gray-400">
                              {catItem.codigo}
                            </td>
                            <td className="py-2 px-3 font-bold text-gray-900 dark:text-white">
                              {catItem.nome}
                              {catItem.tipo_sub && catItem.tipo_sub !== 'Material' && (
                                <span className="ml-2 text-[10px] text-gray-400 font-normal">({catItem.tipo_sub})</span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-gray-600 dark:text-gray-400 text-xs">
                              {catItem.categoria}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-700 dark:text-gray-300">
                              {catItem.stock_atual} <span className="text-[10px] text-gray-400 font-normal">{catItem.unidade_medida}</span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                              {formatCurrency(catItem.preco_compra)}
                            </td>
                            <td className="py-2 px-3 text-center" onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => handleToggleCatalogItem(catItem)}
                                className={cn(
                                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 mx-auto",
                                  isSelected
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                                    : "bg-gray-100 hover:bg-primary hover:text-white text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                )}
                              >
                                {isSelected ? (
                                  <>
                                    <Check size={13} /> Selecionado
                                  </>
                                ) : (
                                  <>
                                    <Plus size={13} /> Selecionar
                                  </>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* CONTROLES DE PAGINAÇÃO DA TABELA */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span>
                      Mostrando <strong className="text-gray-900 dark:text-white">{(catalogPage - 1) * catalogPerPage + 1}</strong> a <strong className="text-gray-900 dark:text-white">{Math.min(catalogPage * catalogPerPage, filteredCatalog.length)}</strong> de <strong className="text-gray-900 dark:text-white">{filteredCatalog.length}</strong> itens
                    </span>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <span className="text-[11px]">Por página:</span>
                    <select
                      value={catalogPerPage}
                      onChange={e => { setCatalogPerPage(Number(e.target.value)); setCatalogPage(1); }}
                      className="py-1 px-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded text-xs font-bold outline-none text-gray-800 dark:text-white"
                    >
                      <option value={10}>10</option>
                      <option value={15}>15</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={catalogPage === 1}
                      onClick={() => setCatalogPage(p => Math.max(1, p - 1))}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs font-bold disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-300"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1.5 text-xs font-bold font-mono text-gray-900 dark:text-white">
                      {catalogPage} / {totalCatalogPages}
                    </span>
                    <button
                      type="button"
                      disabled={catalogPage >= totalCatalogPages}
                      onClick={() => setCatalogPage(p => Math.min(totalCatalogPages, p + 1))}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs font-bold disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all text-gray-700 dark:text-gray-300"
                    >
                      Seguinte
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
            >
              <ArrowLeft size={16} /> Voltar à Etapa 1
            </button>

            <button
              type="button"
              onClick={goToStep3}
              disabled={batchItems.length === 0}
              className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/20 flex items-center gap-2 transition-all"
            >
              Próximo: Configurar Armazéns e Quantidades ({batchItems.length}) <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: TABELA DINÂMICA (ARMAZÉM POR ITEM, ENTRADA/SAÍDA, PREÇO, QTD) */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 animate-fade-in">
          {/* Summary Header of Fatura/Fornecedor */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs">
              {numeroFatura && (
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Nº Fatura / Guia</span>
                  <span className="font-mono font-black text-gray-900 dark:text-white">{numeroFatura}</span>
                </div>
              )}
              {selectedSupplierObj && (
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Fornecedor</span>
                  <span className="font-bold text-gray-900 dark:text-white">{selectedSupplierObj.nome || selectedSupplierObj.empresa}</span>
                </div>
              )}
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Itens no Lote</span>
                <span className="font-mono font-black text-primary">{totalItemsCount} ({totalEntradasCount} Entradas, {totalSaidasCount} Saídas)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="text-xs text-primary font-bold hover:underline"
            >
              Editar Dados Gerais
            </button>
          </div>

          <div className="border-b border-gray-100 dark:border-gray-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Boxes size={16} className="text-primary" /> 3. Configurar Armazém, Operação e Quantidade por Item
            </h3>
            <span className="text-xs font-bold text-gray-500">
              Valor Total Previsto (Entradas): <strong className="text-primary font-mono">{formatCurrency(totalValueEntradas)}</strong>
            </span>
          </div>

          {/* TABLE OF BATCH ITEMS */}
          {batchItems.length === 0 ? (
            <div className="py-12 text-center bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-800 space-y-2">
              <PackagePlus className="mx-auto text-gray-400" size={32} />
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                A lista de movimentação está vazia.
              </p>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold"
              >
                Voltar à Seleção de Itens
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 uppercase text-[10px] font-black tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-3 w-8 text-center">#</th>
                    <th className="py-3 px-3">Tipo Item</th>
                    <th className="py-3 px-3">Item / Código</th>
                    <th className="py-3 px-3 w-48">Armazém de Destino/Origem *</th>
                    <th className="py-3 px-3 text-center w-36">Operação *</th>
                    <th className="py-3 px-3 text-center w-32">Qtd Movimento *</th>
                    <th className="py-3 px-3 text-center">Stock Atual</th>
                    <th className="py-3 px-3 text-center">Novo Stock Est.</th>
                    <th className="py-3 px-3 text-right">Preço Compra (Op.)</th>
                    <th className="py-3 px-3">Observação Item</th>
                    <th className="py-3 px-3 w-8 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {batchItems.map((item, idx) => {
                    const qtd = Number(item.quantidade) || 0;
                    const novoStock = item.tipo === 'Entrada' 
                      ? item.stock_atual + qtd 
                      : Math.max(0, item.stock_atual - qtd);

                    return (
                      <tr key={item.id_key} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="py-3 px-3 text-center font-mono text-gray-400 text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Tipo Item Dropdown / Badge */}
                        <td className="py-3 px-3">
                          <select
                            value={item.tipo_item}
                            onChange={e => handleUpdateItem(idx, 'tipo_item', e.target.value)}
                            className={cn(
                              "px-2 py-1 rounded text-[10px] font-extrabold uppercase outline-none border transition-all",
                              item.tipo_item === 'Produto' 
                                ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40" 
                                : item.tipo_item === 'Material'
                                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/40"
                                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40"
                            )}
                          >
                            <option value="Produto">Produto</option>
                            <option value="Material">Material</option>
                            <option value="Ingrediente">Ingrediente</option>
                          </select>
                        </td>

                        {/* Item Name & Code */}
                        <td className="py-3 px-3">
                          <p className="font-bold text-gray-900 dark:text-white leading-tight">{item.nome}</p>
                          <span className="font-mono text-[10px] text-gray-400">{item.codigo} • {item.categoria}</span>
                        </td>

                        {/* Armazem Select per item */}
                        <td className="py-3 px-3">
                          <select
                            value={item.armazem_id}
                            onChange={e => handleUpdateItem(idx, 'armazem_id', e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-primary px-2.5 py-1.5 rounded-lg text-xs font-bold outline-none dark:text-white"
                          >
                            {armazens.map(a => (
                              <option key={a.id} value={a.id}>
                                {a.nome} ({a.codigo})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Operacao Select per item (Entrada / Saida) */}
                        <td className="py-3 px-3 text-center">
                          <select
                            value={item.tipo}
                            onChange={e => handleUpdateItem(idx, 'tipo', e.target.value as 'Entrada' | 'Saida')}
                            className={cn(
                              "w-full px-2 py-1.5 rounded-lg text-xs font-black uppercase outline-none border transition-all text-center",
                              item.tipo === 'Entrada' 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800" 
                                : "bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                            )}
                          >
                            <option value="Entrada">Entrada (+)</option>
                            <option value="Saida">Saída (-)</option>
                          </select>
                        </td>

                        {/* Qtd Movimento */}
                        <td className="py-3 px-3 text-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.quantidade}
                            onChange={e => handleUpdateItem(idx, 'quantidade', Number(e.target.value))}
                            className={cn(
                              "w-24 text-center border-2 focus:border-primary px-2 py-1 rounded-lg font-mono font-black outline-none text-xs",
                              item.tipo === 'Entrada' ? "bg-emerald-50/50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300" : "bg-rose-50/50 border-rose-300 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300"
                            )}
                          />
                        </td>

                        {/* Stock Atual */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-gray-500">
                          {item.stock_atual} {item.unidade_medida}
                        </td>

                        {/* Novo Stock preview */}
                        <td className="py-3 px-3 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 font-mono font-black text-xs px-2 py-1 rounded border",
                            item.tipo === 'Entrada' 
                              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50" 
                              : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200/50"
                          )}>
                            {item.tipo === 'Entrada' ? '+' : '-'}{qtd} ➔ {novoStock} {item.unidade_medida}
                          </span>
                        </td>

                        {/* Editable Preco Compra */}
                        <td className="py-3 px-3 text-right">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={item.preco_compra || ''}
                            onChange={e => handleUpdateItem(idx, 'preco_compra', Number(e.target.value))}
                            className="w-24 text-right bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 focus:border-primary px-2 py-1 rounded font-mono font-bold outline-none text-xs dark:text-white"
                          />
                        </td>

                        {/* Obs item */}
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            placeholder="Obs item..."
                            value={item.observacao}
                            onChange={e => handleUpdateItem(idx, 'observacao', e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-2 py-1 rounded text-[11px] outline-none focus:border-primary transition-all dark:text-white"
                          />
                        </td>

                        {/* Action delete */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                            title="Remover linha"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer Totals Summary & Submit Button */}
          {batchItems.length > 0 && (
            <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-900/40 p-4 rounded-xl">
              <div className="grid grid-cols-3 gap-6 text-center sm:text-left">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Total Linhas</span>
                  <span className="text-base font-black text-gray-900 dark:text-white font-mono">{totalItemsCount}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Entradas / Saídas</span>
                  <span className="text-base font-black font-mono">
                    <span className="text-emerald-600">{totalEntradasCount} Ent.</span> / <span className="text-rose-600">{totalSaidasCount} Saí.</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Valor Entradas</span>
                  <span className="text-base font-black text-primary font-mono">{formatCurrency(totalValueEntradas)}</span>
                </div>
              </div>

              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-3 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-1.5"
                >
                  <ArrowLeft size={16} /> Voltar à Seleção
                </button>

                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  disabled={movimentacaoLoteMutation.isPending}
                  className="w-full sm:w-auto bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all"
                >
                  {movimentacaoLoteMutation.isPending ? (
                    <>A gravar movimentações em lote...</>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Confirmar & Executar Movimentação
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Success Modal showing Processed Items */}
      {successModalData && (
        <Modal
          isOpen={!!successModalData}
          onClose={() => setSuccessModalData(null)}
          title="Movimentação em Lote Registada"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-start gap-3 text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="shrink-0 text-emerald-500 mt-0.5" size={20} />
              <div>
                <h4 className="font-bold text-sm">Operação Concluída com Sucesso!</h4>
                <p className="text-xs opacity-90 mt-0.5">
                  Todas as movimentações em lote foram gravadas e os stocks dos respetivos armazéns foram recalculados.
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-[11px] font-mono font-bold">
                  {successModalData.numero_fatura && <span>Fatura: {successModalData.numero_fatura}</span>}
                  <span>Total Itens: {successModalData.total_itens || successModalData.itens_processados?.length}</span>
                </div>
              </div>
            </div>

            {/* List of processed items */}
            {successModalData.itens_processados && successModalData.itens_processados.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-black text-gray-400 uppercase tracking-wider">
                  Detalhamento de Itens Processados
                </h5>
                <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Tipo</th>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Armazém</th>
                        <th className="p-2.5 text-center">Operação</th>
                        <th className="p-2.5 text-center">Qtd</th>
                        <th className="p-2.5 text-center">Novo Stock Armazém</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {successModalData.itens_processados.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50">
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded text-[10px]">
                              {item.item_type || item.tipo_item || 'Item'}
                            </span>
                          </td>
                          <td className="p-2.5 font-bold text-gray-900 dark:text-white">
                            {item.nome || `Item #${item.id || item.produto_id || item.material_id}`}
                          </td>
                          <td className="p-2.5 font-semibold text-gray-600 dark:text-gray-300">
                            {item.armazem_nome || `Armazém #${item.armazem_id}`}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-black uppercase",
                              (item.tipo_movimento || item.tipo) === 'Entrada' 
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" 
                                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            )}>
                              {item.tipo_movimento || item.tipo}
                            </span>
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold">
                            {item.quantidade}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold text-gray-900 dark:text-white">
                            {item.novo_stock_armazem ?? item.novo_stock ?? '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setSuccessModalData(null)}
                className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider"
              >
                Fechar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ControleStockLote;

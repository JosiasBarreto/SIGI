import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Save, Trash2, Copy, Clock, FileText, TrendingUp, HelpCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import * as allServices from '../services';
import Modal from '../components/Common/Modal';

export default function Receita() {
  const { id } = useParams(); // This is the produto_acabado_id
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [selectedTargetProduct, setSelectedTargetProduct] = useState<string>('');

  // 1. Fetch Product (Finished Product)
  const { data: produto, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => allServices.productService.getById(id!),
    enabled: !!id,
  });

  // 2. Fetch Recipe by Product ID
  const { data: receitaLista, isLoading: isLoadingReceita } = useQuery({
    queryKey: ['receita_by_produto', id],
    queryFn: () => allServices.receitaService.getByProdutoId(id!),
    enabled: !!id,
  });

  const receitaId = receitaLista?.items?.[0]?.id || receitaLista?.[0]?.id;

  // 3. Fetch Full Recipe Details
  const { data: receita, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['receita_detalhe', receitaId],
    queryFn: () => allServices.receitaService.getById(receitaId),
    enabled: !!receitaId,
  });

  // 4. Fetch Consumable products for adding ingredients dropdown
  const { data: consumiveisResponse } = useQuery({
    queryKey: ['produtos_consumiveis'],
    queryFn: () => allServices.productService.getAll({ tipo: 'Consumivel', per_page: 1000 })
  });
  const consumiveis = consumiveisResponse?.items || [];

  // 5. Fetch Finished Products for Duplication Modal
  const { data: produtosAcabadosResponse } = useQuery({
    queryKey: ['produtos_acabados_list'],
    queryFn: () => allServices.productService.getAll({ tipo: 'Acabado', per_page: 1000 })
  });
  const produtosAcabados = (produtosAcabadosResponse?.items || []).filter(
    (p: any) => String(p.id) !== String(id)
  );

  // --- MUTATIONS ---

  // A. Create Recipe Header (First-time initialization)
  const createReceitaMutation = useMutation({
    mutationFn: (data: any) => allServices.receitaService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receita_by_produto'] });
      toast.success('Ficha técnica iniciada com sucesso.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao iniciar ficha técnica.');
    }
  });

  // B. Update Recipe Header Metadata
  const updateHeaderMutation = useMutation({
    mutationFn: (data: any) => allServices.receitaService.update(receitaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receita_by_produto'] });
      queryClient.invalidateQueries({ queryKey: ['receita_detalhe'] });
      toast.success('Metadados da receita atualizados.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao atualizar cabeçalho da receita.');
    }
  });

  // C. Add Ingredient Item
  const addIngredientMutation = useMutation({
    mutationFn: (data: any) => allServices.receitaService.addIngrediente(receitaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receita_detalhe'] });
      queryClient.invalidateQueries({ queryKey: ['receita_by_produto'] });
      setIsItemModalOpen(false);
      toast.success('Ingrediente adicionado com sucesso.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao adicionar ingrediente.');
    }
  });

  // D. Delete Ingredient Item
  const deleteIngredientMutation = useMutation({
    mutationFn: (itemId: number | string) => allServices.receitaService.removeIngrediente(receitaId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receita_detalhe'] });
      queryClient.invalidateQueries({ queryKey: ['receita_by_produto'] });
      toast.success('Ingrediente removido com sucesso.');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao remover ingrediente.');
    }
  });

  // E. Duplicate Recipe
  const duplicateMutation = useMutation({
    mutationFn: (targetProductId: number) => allServices.receitaService.duplicar(receitaId, { novo_produto_id: targetProductId }),
    onSuccess: (res: any) => {
      setIsDuplicateModalOpen(false);
      setSelectedTargetProduct('');
      toast.success('Ficha técnica duplicada com sucesso!');
      if (res?.id) {
        navigate(`/produtos/${res.id}/receita`);
      }
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao duplicar receita. Verifique se o produto destino já possui uma receita vinculada.');
    }
  });

  // --- ACTIONS ---

  const handleCreateReceita = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const payload = {
      produto_acabado_id: Number(id),
      descricao: formData.get('descricao') || `Receita para ${produto?.nome}`,
      tempo_preparacao: Number(formData.get('tempo_preparacao')) || 45,
      rendimento_unidades: Number(formData.get('rendimento_unidades')) || 10,
    };
    createReceitaMutation.mutate(payload);
  };

  const handleUpdateHeader = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const payload = {
      descricao: formData.get('descricao'),
      tempo_preparacao: Number(formData.get('tempo_preparacao')),
      rendimento_unidades: Number(formData.get('rendimento_unidades')),
    };
    updateHeaderMutation.mutate(payload);
  };

  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const itemData = {
      produto_consumivel_id: Number(formData.get('produto_consumivel_id')),
      quantidade: Number(formData.get('quantidade')),
      observacao: formData.get('observacao') || '',
    };
    addIngredientMutation.mutate(itemData);
  };

  const handleDeleteItem = (itemId: number | string) => {
    if (window.confirm('Tem a certeza que deseja remover este ingrediente?')) {
      deleteIngredientMutation.mutate(itemId);
    }
  };

  const handleDuplicateRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTargetProduct) {
      toast.warning('Selecione um produto de destino.');
      return;
    }
    duplicateMutation.mutate(Number(selectedTargetProduct));
  };

  const isLoading = isLoadingProduct || isLoadingReceita || isLoadingDetail;

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 text-sm font-medium animate-pulse">A carregar detalhes da Ficha Técnica...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <div>
          <button 
            onClick={() => navigate('/produtos')} 
            className="text-sm font-semibold text-gray-500 hover:text-primary dark:hover:text-primary-hover flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para Produtos
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Ficha Técnica / Receita
          </h1>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
            {produto ? `${produto.codigo} — ${produto.nome}` : 'Produto não encontrado'}
          </p>
        </div>

        {receita && (
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setIsDuplicateModalOpen(true)}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors flex items-center gap-2 border border-gray-200/50 dark:border-gray-700/50"
            >
              <Copy className="w-4 h-4" /> Duplicar Ficha
            </button>
            <button 
              onClick={() => setIsItemModalOpen(true)} 
              className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-all flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-5 h-5" /> Adicionar Ingrediente
            </button>
          </div>
        )}
      </div>

      {/* RENDER DYNAMIC STATE */}
      {!receita ? (
        /* EMPTY STATE / INITIALIZE RECIPE FORM */
        <div className="max-w-2xl mx-auto bg-white dark:bg-surface-dark p-8 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-md">
          <div className="text-center space-y-3 mb-6">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
              <FileText className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ficha Técnica Indisponível</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Este produto acabado ainda não possui uma ficha técnica ativa. Inicie uma receita para calcular custos, rendimento e rentabilidade.
            </p>
          </div>

          <form onSubmit={handleCreateReceita} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição / Nome da Receita *</label>
              <input 
                type="text" 
                name="descricao" 
                defaultValue={`Receita padrão de ${produto?.nome}`}
                required 
                placeholder="Ex: Receita industrial padrão, sem glúten..."
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tempo Preparação (Minutos) *</label>
                <div className="relative">
                  <input 
                    type="number" 
                    name="tempo_preparacao" 
                    defaultValue={45}
                    min={1} 
                    required 
                    className="w-full pl-4 pr-12 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white font-medium"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-bold text-gray-400 uppercase">
                    Min
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rendimento (Unidades) *</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.1" 
                    name="rendimento_unidades" 
                    defaultValue={10.0}
                    min={0.1} 
                    required 
                    className="w-full pl-4 pr-12 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white font-medium"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-xs font-bold text-gray-400 uppercase">
                    Un
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={createReceitaMutation.isPending}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-sm disabled:opacity-50"
            >
              {createReceitaMutation.isPending ? 'A inicializar...' : 'Iniciar Ficha Técnica'}
            </button>
          </form>
        </div>
      ) : (
        /* FULLY DETAILED DASHBOARD */
        <div className="space-y-6">
          {/* FINANCIAL KPI SUMMARY ROW */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CUSTO TOTAL */}
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded-xl flex items-center justify-center font-bold">
                €
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Custo Total (Ingredientes)</span>
                <span className="text-2xl font-black text-gray-950 dark:text-white">
                  {receita.custo_total ? `${Number(receita.custo_total).toFixed(2)} €` : '0.00 €'}
                </span>
              </div>
            </div>

            {/* CUSTO UNITARIO */}
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/10 text-blue-500 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Custo Unitário Calculado</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {receita.custo_unitario ? `${Number(receita.custo_unitario).toFixed(2)} €` : '0.00 €'}
                </span>
              </div>
            </div>

            {/* MARGEM LUCRO */}
            <div className="bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-500 dark:text-indigo-400 rounded-xl flex items-center justify-center font-bold text-lg">
                M
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Margem Lucro Unitária</span>
                <span className="text-2xl font-black text-gray-950 dark:text-white">
                  {receita.margem_lucro ? `${Number(receita.margem_lucro).toFixed(2)} €` : '0.00 €'}
                </span>
              </div>
            </div>

            {/* RENTABILIDADE */}
            <div className={`bg-white dark:bg-surface-dark p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-4`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                Number(receita.rentabilidade) >= 50 ? 'bg-green-50 dark:bg-green-900/10 text-green-500' : 'bg-amber-50 dark:bg-amber-900/10 text-amber-500'
              }`}>
                %
              </div>
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Rentabilidade Estimada</span>
                <span className={`text-2xl font-black ${
                  Number(receita.rentabilidade) >= 50 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {receita.rentabilidade ? `${Number(receita.rentabilidade).toFixed(1)}%` : '0.0%'}
                </span>
              </div>
            </div>
          </div>

          {/* TWO COLUMN PANEL: LEFT FOR INGREDIENTS, RIGHT FOR HEADER METADATA */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* INGREDIENTS TABLE (3/5 WIDTH) */}
            <div className="lg:col-span-3 bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Lista de Ingredientes</h3>
                  <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-bold rounded-full">
                    {receita.itens?.length || 0} consumíveis
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50/70 dark:bg-gray-800/40 text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-4 pl-6">Ingrediente</th>
                        <th className="p-4 text-center">Quantidade</th>
                        <th className="p-4 text-right">Custo Estimado</th>
                        <th className="p-4 pr-6 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {(!receita.itens || receita.itens.length === 0) ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-gray-400 dark:text-gray-500">
                            <HelpCircle className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
                            Nenhum ingrediente adicionado. Adicione consumíveis para compor o custo.
                          </td>
                        </tr>
                      ) : (
                        receita.itens.map((item: any) => (
                          <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                            <td className="p-4 pl-6">
                              <span className="font-bold text-gray-900 dark:text-gray-100 block">
                                {item.produto_consumivel_nome || `Consumível #${item.produto_consumivel_id}`}
                              </span>
                              {item.produto_consumivel_codigo && (
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                  {item.produto_consumivel_codigo}
                                </span>
                              )}
                              {item.observacao && (
                                <span className="block text-xs text-gray-400 italic mt-0.5">
                                  Nota: {item.observacao}
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center font-mono text-gray-700 dark:text-gray-300">
                              {Number(item.quantidade).toFixed(3)} <span className="text-xs text-gray-400 font-bold uppercase">{item.produto_consumivel_unidade_sigla || 'Un'}</span>
                            </td>
                            <td className="p-4 text-right font-bold text-gray-900 dark:text-white">
                              {item.custo_calculado ? `${Number(item.custo_calculado).toFixed(2)} €` : '-'}
                            </td>
                            <td className="p-4 pr-6">
                              <div className="flex justify-end">
                                <button 
                                  onClick={() => handleDeleteItem(item.id)} 
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                  title="Remover ingrediente"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* QUICK INLINE FORM IN THE FOOTER OF THE TABLE CARD */}
              <div className="p-5 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Adicionar Ingrediente Rápido</h4>
                <form onSubmit={handleAddIngredient} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select 
                    name="produto_consumivel_id" 
                    required 
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white font-medium focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Ingrediente...</option>
                    {consumiveis.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.codigo} - {c.nome} ({c.unidade_sigla || 'Un'})</option>
                    ))}
                  </select>
                  <input 
                    type="number" 
                    step="0.001" 
                    min="0.001" 
                    name="quantidade" 
                    required 
                    placeholder="Quantidade..."
                    className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white font-medium focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      name="observacao" 
                      placeholder="Obs..."
                      className="flex-1 min-w-0 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white font-medium focus:ring-1 focus:ring-primary"
                    />
                    <button 
                      type="submit" 
                      disabled={addIngredientMutation.isPending}
                      className="px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-bold transition-colors shadow-sm shrink-0"
                    >
                      Adicionar
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* METADATA FORM (2/5 WIDTH) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* METADADOS PRINCIPAIS CARD */}
              <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold">Definições da Ficha</h3>
                </div>

                <form key={receita.id} onSubmit={handleUpdateHeader} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Descrição / Notas</label>
                    <textarea 
                      name="descricao" 
                      defaultValue={receita.descricao || ''}
                      rows={2}
                      placeholder="Descrição da preparação..."
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 text-gray-900 dark:text-white font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preparação (min)</label>
                      <input 
                        type="number" 
                        name="tempo_preparacao" 
                        defaultValue={receita.tempo_preparacao || 45}
                        min={1}
                        required
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 text-gray-900 dark:text-white font-medium"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Rendimento (Un)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        name="rendimento_unidades" 
                        defaultValue={receita.rendimento_unidades || 10}
                        min={0.1}
                        required
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 text-gray-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={updateHeaderMutation.isPending}
                    className="w-full py-2.5 bg-gray-900 hover:bg-gray-850 dark:bg-primary dark:hover:bg-primary-hover text-white font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {updateHeaderMutation.isPending ? 'A guardar...' : 'Guardar Cabeçalho'}
                  </button>
                </form>
              </div>

              {/* TIPS CARD */}
              <div className="bg-gray-50 dark:bg-gray-800/10 p-5 rounded-2xl border border-gray-100/50 dark:border-gray-800/50 space-y-2 text-xs text-gray-500 leading-relaxed">
                <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-1">Cálculos no Backend</span>
                <p>Os valores de custo total, custo unitário e rentabilidade são atualizados automaticamente pelo servidor a cada alteração de ingredientes.</p>
                <p className="mt-1">O custo unitário calculado substitui de imediato o preço de custo padrão (compra) do produto acabado.</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD INGREDIENT IN POPUP */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="Adicionar Ingrediente"
        footer={
          <>
            <button type="button" onClick={() => setIsItemModalOpen(false)} className="px-5 py-2 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" form="item-form" disabled={addIngredientMutation.isPending} className="px-5 py-2 rounded-lg font-bold bg-primary hover:bg-primary-hover text-white transition-colors text-sm shadow-sm">
              Adicionar
            </button>
          </>
        }
      >
        <form id="item-form" onSubmit={handleAddIngredient} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Ingrediente Consumível *</label>
            <select name="produto_consumivel_id" required className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/50 font-medium">
              <option value="">Selecione...</option>
              {consumiveis.map((c: any) => (
                <option key={c.id} value={c.id}>{c.codigo} - {c.nome} ({c.unidade_sigla || 'Un'})</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Quantidade *</label>
            <input type="number" step="0.001" min="0.001" name="quantidade" required className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/50 font-medium" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-400 uppercase">Observações / Notas</label>
            <input type="text" name="observacao" placeholder="Ex: Peneirar bem, moer fino..." className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/50 font-medium" />
          </div>
        </form>
      </Modal>

      {/* MODAL: DUPLICATE RECIPE */}
      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        title="Duplicar Ficha Técnica"
        footer={
          <>
            <button type="button" onClick={() => setIsDuplicateModalOpen(false)} className="px-5 py-2 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" form="duplicate-form" disabled={duplicateMutation.isPending} className="px-5 py-2 rounded-lg font-bold bg-primary hover:bg-primary-hover text-white transition-colors text-sm shadow-sm flex items-center gap-1">
              {duplicateMutation.isPending ? 'A duplicar...' : 'Confirmar Duplicação'}
            </button>
          </>
        }
      >
        <form id="duplicate-form" onSubmit={handleDuplicateRecipe} className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Deseja duplicar toda a estrutura desta Ficha Técnica (metadados e ingredientes) para um novo Produto Acabado? O produto de destino não pode conter nenhuma receita ativa vinculada.
          </p>
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Produto Acabado de Destino *</label>
            <select 
              value={selectedTargetProduct} 
              onChange={(e) => setSelectedTargetProduct(e.target.value)}
              required 
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary/50 font-medium"
            >
              <option value="">Selecione um produto acabado...</option>
              {produtosAcabados.map((p: any) => (
                <option key={p.id} value={p.id}>{p.codigo} - {p.nome}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}

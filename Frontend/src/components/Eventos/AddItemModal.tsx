import React, { useState, useMemo } from 'react';
import Modal from '../Common/Modal';
import { formatCurrency } from '../../lib/utils';
import { 
  Search, Cake, UtensilsCrossed, Wine, Briefcase, Tent, Plus, Minus, Trash2, 
  Sparkles, Layers, ShoppingCart, ArrowLeft, X, Check, DollarSign
} from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  produtos: any[];
  servicosCadastro: any[];
  equipasCadastro: any[];
  espacos: any[];
  materiais: any[];
  itens?: any[];
  onAddItem: (itemData: {
    tipo_item: 'Servico' | 'Espaco' | 'Material' | 'MaoDeObra' | 'Produto' | 'ProdutoCozinha' | 'ProdutoPastelaria' | 'ProdutoRevenda' | 'Outro';
    referencia_id?: number | null;
    produto_id?: number | null;
    descricao: string;
    quantidade: number;
    unidade: string;
    preco_unitario: number;
    taxa_iva?: number;
    observacoes?: string;
  }) => void;
  onRemoveItem?: (index: number) => void;
  onUpdateItemQty?: (index: number, delta: number) => void;
  numeroConvidados?: number;
}

type TabType = 'PASTELARIA' | 'COZINHA' | 'REVENDA' | 'SERVICOS' | 'ESPACOS_MATERIAIS' | 'MANUAL';

export default function AddItemModal({
  isOpen,
  onClose,
  produtos = [],
  servicosCadastro = [],
  equipasCadastro = [],
  espacos = [],
  materiais = [],
  itens = [],
  onAddItem,
  onRemoveItem,
  onUpdateItemQty,
  numeroConvidados = 100
}: AddItemModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('PASTELARIA');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedIds, setAddedIds] = useState<Record<string, number>>({});
  const [isCartViewOpen, setIsCartViewOpen] = useState(false);

  // Manual Item Form State
  const [manualTipo, setManualTipo] = useState<'Servico' | 'Produto' | 'Material' | 'Outro'>('Servico');
  const [manualDescricao, setManualDescricao] = useState('');
  const [manualQuantidade, setManualQuantidade] = useState(1);
  const [manualUnidade, setManualUnidade] = useState('Unidade');
  const [manualPreco, setManualPreco] = useState(0);

  // Compute exact product price details: Preço Sem IVA, Taxa IVA, Preço Com IVA
  const getProductPrices = (p: any) => {
    const taxaIva = Number(p.taxa_iva ?? p.imposto ?? p.percentual_iva ?? 15);
    const precoVenda = Number(p.preco_venda || p.preco || 0);
    const precoComIva = Number(p.preco_venda_com_iva || 0);

    let precoSemIva = 0;
    let precoComIvaVal = 0;

    if (precoVenda > 0) {
      precoSemIva = precoVenda;
      precoComIvaVal = precoComIva > 0 ? precoComIva : (precoSemIva * (1 + taxaIva / 100));
    } else if (precoComIva > 0) {
      precoComIvaVal = precoComIva;
      precoSemIva = precoComIvaVal / (1 + taxaIva / 100);
    }

    const valorIva = Math.max(0, precoComIvaVal - precoSemIva);

    return { precoSemIva, taxaIva, precoComIvaVal, valorIva };
  };

  // Categorization logic for Acabados (Pastelaria & Cozinha) and Revenda
  const categorizedProducts = useMemo(() => {
    const pastelaria: any[] = [];
    const cozinha: any[] = [];
    const revenda: any[] = [];
    const outrosProdutos: any[] = [];

    produtos.forEach((p) => {
      if (!p) return;
      const cat = String(p.categoria_nome || p.categoria || p.category || '').toLowerCase();
      const tipo = String(p.tipo || p.tipo_produto || p.type || '').toLowerCase();
      const servico = String(p.servico || '').toUpperCase();
      const nome = String(p.nome || p.name || '').toLowerCase();

      // 1. Revenda Products
      if (
        tipo.includes('revenda') || 
        servico === 'BAR' || 
        cat.includes('revenda') || cat.includes('bebida') || cat.includes('vinho') || 
        cat.includes('cerveja') || cat.includes('sumo') || cat.includes('refrigerante')
      ) {
        revenda.push(p);
      } 
      // 2. Pastelaria Products
      else if (
        servico === 'PASTELARIA' || 
        cat.includes('pastelaria') || cat.includes('bolo') || cat.includes('doce') || 
        cat.includes('confeitaria') || cat.includes('padaria') || cat.includes('pão') || 
        cat.includes('sobremesa') || cat.includes('torta') ||
        nome.includes('bolo') || nome.includes('doce') || nome.includes('pastel') || 
        nome.includes('torta') || nome.includes('pão') || nome.includes('mousse')
      ) {
        pastelaria.push(p);
      } 
      // 3. Cozinha Products
      else if (
        servico === 'COZINHA' || 
        cat.includes('cozinha') || cat.includes('refeicao') || cat.includes('refeição') || 
        cat.includes('comida') || cat.includes('salgado') || cat.includes('prato') || 
        cat.includes('menu') || cat.includes('buffet') || cat.includes('catering') || 
        cat.includes('almoço') || cat.includes('jantar') || cat.includes('entrada')
      ) {
        cozinha.push(p);
      } 
      // 4. Default for any other Acabado product or general product -> Cozinha so nothing is dropped!
      else if (tipo.includes('acabado') || tipo === '' || tipo === 'produto') {
        cozinha.push(p);
      } 
      else {
        outrosProdutos.push(p);
      }
    });

    return { pastelaria, cozinha, revenda, outrosProdutos };
  }, [produtos]);

  const handleQuickAddProduct = (prod: any, subTipo: 'ProdutoPastelaria' | 'ProdutoCozinha' | 'ProdutoRevenda' | 'Produto') => {
    const key = `prod_${prod.id}`;
    const prices = getProductPrices(prod);

    onAddItem({
      tipo_item: subTipo,
      produto_id: prod.id,
      descricao: prod.nome || prod.name || 'Produto sem nome',
      quantidade: prod.unidade_medida === 'Pessoa' ? numeroConvidados : 1,
      unidade: prod.unidade_medida || 'Unidade',
      preco_unitario: prices.precoSemIva, // Preço Base Sem IVA
      taxa_iva: prices.taxaIva,
    });

    setAddedIds((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const handleQuickAddService = (serv: any) => {
    const key = `serv_${serv.id}`;
    onAddItem({
      tipo_item: 'Servico',
      referencia_id: serv.id,
      descricao: serv.nome,
      quantidade: serv.unidade_padrao === 'Pessoa' ? numeroConvidados : 1,
      unidade: serv.unidade_padrao || 'Pessoa',
      preco_unitario: Number(serv.preco_sugerido || 0),
      taxa_iva: 15,
    });
    setAddedIds((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const handleQuickAddMaoObra = (eq: any) => {
    const key = `eq_${eq.id}`;
    onAddItem({
      tipo_item: 'MaoDeObra',
      referencia_id: eq.id,
      descricao: eq.nome,
      quantidade: 1,
      unidade: 'Serviço',
      preco_unitario: Number(eq.preco_sugerido || 0),
      taxa_iva: 15,
    });
    setAddedIds((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const handleQuickAddEspaco = (esp: any) => {
    const key = `esp_${esp.id}`;
    onAddItem({
      tipo_item: 'Espaco',
      referencia_id: esp.id,
      descricao: `Aluguer de ${esp.nome}`,
      quantidade: 1,
      unidade: 'Dia',
      preco_unitario: Number(esp.preco_aluguer || 0),
      taxa_iva: 15,
    });
    setAddedIds((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const handleQuickAddMaterial = (mat: any) => {
    const key = `mat_${mat.id}`;
    onAddItem({
      tipo_item: 'Material',
      referencia_id: mat.id,
      descricao: `Aluguer de ${mat.nome}`,
      quantidade: numeroConvidados,
      unidade: mat.unidade || 'Unidade',
      preco_unitario: Number(mat.preco_aluguer || mat.preco_custo || 0),
      taxa_iva: 15,
    });
    setAddedIds((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const handleAddManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDescricao.trim()) return;
    onAddItem({
      tipo_item: manualTipo,
      descricao: manualDescricao,
      quantidade: Number(manualQuantidade || 1),
      unidade: manualUnidade,
      preco_unitario: Number(manualPreco || 0),
      taxa_iva: 15,
    });
    setManualDescricao('');
    setManualPreco(0);
  };

  // Search filter
  const filterList = (list: any[]) => {
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) => {
      const name = String(item.nome || item.name || item.descricao || '').toLowerCase();
      const cat = String(item.categoria_nome || item.categoria || '').toLowerCase();
      return name.includes(q) || cat.includes(q);
    });
  };

  // Total cart calculation inside modal
  const cartTotals = useMemo(() => {
    let subtotalSemIva = 0;
    let totalIva = 0;
    itens.forEach((it) => {
      const sub = Number(it.quantidade || 0) * Number(it.preco_unitario || 0);
      const desc = Number(it.valor_desconto || 0) || (sub * (Number(it.percentual_desconto || 0) / 100));
      const liquid = Math.max(0, sub - desc);
      const iva = liquid * (Number(it.taxa_iva || 15) / 100);
      subtotalSemIva += liquid;
      totalIva += iva;
    });
    return { subtotalSemIva, totalIva, totalGeral: subtotalSemIva + totalIva };
  }, [itens]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catálogo de Produtos e Serviços para Evento" maxWidth="max-w-7xl">
      <div className="space-y-5 relative">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/80 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xs">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome do produto acabados (bolo, prato, buffet), bebidas de revenda ou serviços..."
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Cart Toggle Button */}
          <button
            type="button"
            onClick={() => setIsCartViewOpen(!isCartViewOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shrink-0 shadow-md active:scale-95 ${
              isCartViewOpen || itens.length > 0
                ? 'bg-primary text-white hover:bg-primary-hover ring-2 ring-primary/40'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            <ShoppingCart size={18} />
            <span>Ver Carrinho ({itens.length})</span>
            {cartTotals.totalGeral > 0 && (
              <span className="ml-1 pl-2 border-l border-white/30 font-extrabold">
                {formatCurrency(cartTotals.totalGeral)}
              </span>
            )}
          </button>
        </div>

        {/* CART DRAWER / OVERLAY INSIDE MODAL */}
        {isCartViewOpen ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-primary/30 p-5 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-primary" size={20} />
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                  Itens no Carrinho do Evento ({itens.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartViewOpen(false)}
                className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl text-xs font-bold flex items-center gap-1"
              >
                <ArrowLeft size={14} /> Voltar ao Catálogo
              </button>
            </div>

            {itens.length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <ShoppingCart size={40} className="mx-auto opacity-30" />
                <p className="text-xs font-bold">O carrinho do evento está vazio.</p>
                <p className="text-[11px]">Selecione produtos de Pastelaria, Cozinha ou Revenda no catálogo abaixo.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1 scrollbar-thin">
                {itens.map((it, idx) => {
                  const subItem = Number(it.quantidade || 0) * Number(it.preco_unitario || 0);
                  const ivaItem = subItem * (Number(it.taxa_iva || 15) / 100);
                  const totalItem = subItem + ivaItem;

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary/10 text-primary uppercase">
                            {it.tipo_item}
                          </span>
                          <span className="text-xs font-extrabold text-gray-900 dark:text-white line-clamp-1">
                            {it.descricao}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          Sem IVA: {formatCurrency(it.preco_unitario)} | IVA ({it.taxa_iva || 15}%): {formatCurrency(ivaItem / (it.quantidade || 1))}
                        </p>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateItemQty && onUpdateItemQty(idx, -1)}
                          className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded-lg"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-10 text-center text-xs font-black text-gray-900 dark:text-white">
                          {it.quantidade} {it.unidade || ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateItemQty && onUpdateItemQty(idx, 1)}
                          className="p-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 rounded-lg"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[110px]">
                        <span className="text-[10px] text-gray-400 block uppercase">Total c/ IVA</span>
                        <span className="text-xs font-black text-primary">{formatCurrency(totalItem)}</span>
                      </div>

                      {/* Delete */}
                      {onRemoveItem && (
                        <button
                          type="button"
                          onClick={() => onRemoveItem(idx)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                          title="Remover Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Cart Drawer Financial Footer */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">
              <div className="flex items-center gap-4 text-xs font-bold">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Subtotal Sem IVA</span>
                  <span className="text-gray-800 dark:text-gray-200">{formatCurrency(cartTotals.subtotalSemIva)}</span>
                </div>
                <div>
                  <span className="text-amber-600 block text-[10px] uppercase">Imposto IVA (15%)</span>
                  <span className="text-amber-600 font-extrabold">{formatCurrency(cartTotals.totalIva)}</span>
                </div>
                <div>
                  <span className="text-primary block text-[10px] uppercase font-black">Total do Carrinho</span>
                  <span className="text-sm font-black text-primary">{formatCurrency(cartTotals.totalGeral)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCartViewOpen(false)}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl shadow-md"
              >
                Continuar a Adicionar Produtos
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Modal Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-700 scrollbar-thin">
              {[
                { id: 'PASTELARIA', label: 'Pastelaria & Doces (Acabados)', icon: Cake, count: categorizedProducts.pastelaria.length },
                { id: 'COZINHA', label: 'Cozinha & Buffet (Acabados)', icon: UtensilsCrossed, count: categorizedProducts.cozinha.length },
                { id: 'REVENDA', label: 'Revenda & Bebidas', icon: Wine, count: categorizedProducts.revenda.length },
                { id: 'SERVICOS', label: 'Serviços & Equipas', icon: Briefcase, count: servicosCadastro.length + equipasCadastro.length },
                { id: 'ESPACOS_MATERIAIS', label: 'Espaços & Alugueres', icon: Tent, count: espacos.length + materiais.length },
                { id: 'MANUAL', label: 'Item Personalizado', icon: Plus, count: 0 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSel = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                      isSel
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                          isSel ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* TAB CONTENT (LARGE SPACIOUS CARDS) */}
            <div className="max-h-[58vh] overflow-y-auto p-1 pr-2 space-y-4 scrollbar-thin">
              {/* TAB 1: PASTELARIA */}
              {activeTab === 'PASTELARIA' && (
                <div>
                  {filterList(categorizedProducts.pastelaria).length === 0 ? (
                    <div className="py-12 text-center text-gray-500 space-y-2 border-2 border-dashed border-purple-100 dark:border-purple-900/30 rounded-2xl">
                      <Cake size={40} className="mx-auto text-purple-400 opacity-60" />
                      <p className="text-xs font-extrabold text-gray-800 dark:text-gray-200">Nenhum produto de Pastelaria encontrado no catálogo.</p>
                      <p className="text-[11px] text-gray-400">Verifique os filtros de pesquisa ou adicione no separador Cozinha/Item Personalizado.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filterList(categorizedProducts.pastelaria).map((p) => {
                        const key = `prod_${p.id}`;
                        const qtyAdded = addedIds[key] || 0;
                        const { precoSemIva, taxaIva, precoComIvaVal, valorIva } = getProductPrices(p);

                        return (
                          <div
                            key={p.id}
                            className="p-4 bg-white dark:bg-gray-800 border-2 border-purple-100 dark:border-purple-900/30 hover:border-purple-400 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-[10px] font-black rounded-md uppercase">
                                  Pastelaria / Acabado
                                </span>
                                <span className="text-[11px] text-gray-400 font-bold">{p.unidade_medida || 'Unidade'}</span>
                              </div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white line-clamp-2 leading-tight">{p.nome}</h4>

                              {/* Price breakdown card */}
                              <div className="space-y-1 my-2.5 bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-[11px]">
                                <div className="flex justify-between text-gray-500">
                                  <span>Preço sem IVA:</span>
                                  <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(precoSemIva)}</span>
                                </div>
                                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                                  <span>IVA ({taxaIva}%):</span>
                                  <span className="font-bold">{formatCurrency(valorIva)}</span>
                                </div>
                                <div className="flex justify-between text-purple-700 dark:text-purple-300 font-black border-t pt-1 border-gray-200 dark:border-gray-700">
                                  <span>Preço com IVA:</span>
                                  <span className="text-xs">{formatCurrency(precoComIvaVal)}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleQuickAddProduct(p, 'ProdutoPastelaria')}
                              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <Plus size={15} />
                              <span>Adicionar {qtyAdded > 0 ? `(${qtyAdded})` : ''}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COZINHA */}
              {activeTab === 'COZINHA' && (
                <div>
                  {filterList(categorizedProducts.cozinha).length === 0 ? (
                    <div className="py-12 text-center text-gray-500 space-y-2 border-2 border-dashed border-amber-100 dark:border-amber-900/30 rounded-2xl">
                      <UtensilsCrossed size={40} className="mx-auto text-amber-400 opacity-60" />
                      <p className="text-xs font-extrabold text-gray-800 dark:text-gray-200">Nenhum prato ou menu de Cozinha encontrado.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filterList(categorizedProducts.cozinha).map((p) => {
                        const key = `prod_${p.id}`;
                        const qtyAdded = addedIds[key] || 0;
                        const { precoSemIva, taxaIva, precoComIvaVal, valorIva } = getProductPrices(p);

                        return (
                          <div
                            key={p.id}
                            className="p-4 bg-white dark:bg-gray-800 border-2 border-amber-100 dark:border-amber-900/30 hover:border-amber-400 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="px-2.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] font-black rounded-md uppercase">
                                  Cozinha / Acabado
                                </span>
                                <span className="text-[11px] text-gray-400 font-bold">{p.unidade_medida || 'Pessoa'}</span>
                              </div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white line-clamp-2 leading-tight">{p.nome}</h4>

                              {/* Price breakdown card */}
                              <div className="space-y-1 my-2.5 bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-[11px]">
                                <div className="flex justify-between text-gray-500">
                                  <span>Preço sem IVA:</span>
                                  <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(precoSemIva)}</span>
                                </div>
                                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                                  <span>IVA ({taxaIva}%):</span>
                                  <span className="font-bold">{formatCurrency(valorIva)}</span>
                                </div>
                                <div className="flex justify-between text-amber-700 dark:text-amber-300 font-black border-t pt-1 border-gray-200 dark:border-gray-700">
                                  <span>Preço com IVA:</span>
                                  <span className="text-xs">{formatCurrency(precoComIvaVal)}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleQuickAddProduct(p, 'ProdutoCozinha')}
                              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <Plus size={15} />
                              <span>Adicionar {qtyAdded > 0 ? `(${qtyAdded})` : ''}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: REVENDA */}
              {activeTab === 'REVENDA' && (
                <div>
                  {filterList(categorizedProducts.revenda).length === 0 ? (
                    <div className="py-12 text-center text-gray-500 space-y-2 border-2 border-dashed border-blue-100 dark:border-blue-900/30 rounded-2xl">
                      <Wine size={40} className="mx-auto text-blue-400 opacity-60" />
                      <p className="text-xs font-extrabold text-gray-800 dark:text-gray-200">Nenhuma bebida ou item de Revenda encontrado.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filterList(categorizedProducts.revenda).map((p) => {
                        const key = `prod_${p.id}`;
                        const qtyAdded = addedIds[key] || 0;
                        const { precoSemIva, taxaIva, precoComIvaVal, valorIva } = getProductPrices(p);

                        return (
                          <div
                            key={p.id}
                            className="p-4 bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/30 hover:border-blue-400 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-[10px] font-black rounded-md uppercase">
                                  Revenda / Bebida
                                </span>
                                <span className="text-[11px] text-gray-400 font-bold">{p.unidade_medida || 'Garrafa'}</span>
                              </div>
                              <h4 className="text-xs font-black text-gray-900 dark:text-white line-clamp-2 leading-tight">{p.nome}</h4>

                              {/* Price breakdown card */}
                              <div className="space-y-1 my-2.5 bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-[11px]">
                                <div className="flex justify-between text-gray-500">
                                  <span>Preço sem IVA:</span>
                                  <span className="font-bold text-gray-800 dark:text-gray-200">{formatCurrency(precoSemIva)}</span>
                                </div>
                                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                                  <span>IVA ({taxaIva}%):</span>
                                  <span className="font-bold">{formatCurrency(valorIva)}</span>
                                </div>
                                <div className="flex justify-between text-blue-700 dark:text-blue-300 font-black border-t pt-1 border-gray-200 dark:border-gray-700">
                                  <span>Preço com IVA:</span>
                                  <span className="text-xs">{formatCurrency(precoComIvaVal)}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleQuickAddProduct(p, 'ProdutoRevenda')}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                            >
                              <Plus size={15} />
                              <span>Adicionar {qtyAdded > 0 ? `(${qtyAdded})` : ''}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: SERVIÇOS & EQUIPAS */}
              {activeTab === 'SERVICOS' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase mb-3 flex items-center gap-2 tracking-wider">
                      <Briefcase size={16} className="text-primary" /> Serviços de Catering & Produção
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filterList(servicosCadastro).map((serv) => {
                        const key = `serv_${serv.id}`;
                        const qtyAdded = addedIds[key] || 0;
                        const price = Number(serv.preco_sugerido || 0);
                        const ivaVal = price * 0.15;
                        return (
                          <div
                            key={serv.id}
                            className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary rounded-2xl flex flex-col justify-between gap-3 shadow-xs"
                          >
                            <div>
                              <p className="text-xs font-extrabold text-gray-900 dark:text-white">{serv.nome}</p>
                              <div className="space-y-0.5 mt-2 text-[11px]">
                                <div className="flex justify-between text-gray-500">
                                  <span>Sem IVA:</span>
                                  <span className="font-bold">{formatCurrency(price)}</span>
                                </div>
                                <div className="flex justify-between text-amber-600">
                                  <span>IVA (15%):</span>
                                  <span className="font-bold">{formatCurrency(ivaVal)}</span>
                                </div>
                                <div className="flex justify-between text-primary font-black border-t pt-0.5">
                                  <span>Com IVA:</span>
                                  <span>{formatCurrency(price + ivaVal)}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickAddService(serv)}
                              className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <Plus size={15} /> {qtyAdded > 0 ? `(${qtyAdded})` : 'Adicionar'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase mb-3 flex items-center gap-2 tracking-wider">
                      <Layers size={16} className="text-primary" /> Equipas & Mão de Obra
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filterList(equipasCadastro).map((eq) => {
                        const key = `eq_${eq.id}`;
                        const qtyAdded = addedIds[key] || 0;
                        const price = Number(eq.preco_sugerido || 0);
                        const ivaVal = price * 0.15;
                        return (
                          <div
                            key={eq.id}
                            className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary rounded-2xl flex flex-col justify-between gap-3 shadow-xs"
                          >
                            <div>
                              <p className="text-xs font-extrabold text-gray-900 dark:text-white">{eq.nome}</p>
                              <div className="space-y-0.5 mt-2 text-[11px]">
                                <div className="flex justify-between text-gray-500">
                                  <span>Sem IVA:</span>
                                  <span className="font-bold">{formatCurrency(price)}</span>
                                </div>
                                <div className="flex justify-between text-primary font-black border-t pt-0.5">
                                  <span>Com IVA:</span>
                                  <span>{formatCurrency(price + ivaVal)}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickAddMaoObra(eq)}
                              className="w-full py-2 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <Plus size={15} /> {qtyAdded > 0 ? `(${qtyAdded})` : 'Adicionar'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: ESPAÇOS & MATERIAIS */}
              {activeTab === 'ESPACOS_MATERIAIS' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase mb-3 flex items-center gap-2 tracking-wider">
                      <Tent size={16} className="text-amber-600" /> Salões & Espaços para Eventos
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filterList(espacos).map((esp) => {
                        const key = `esp_${esp.id}`;
                        const qtyAdded = addedIds[key] || 0;
                        const price = Number(esp.preco_aluguer || 0);
                        const ivaVal = price * 0.15;
                        return (
                          <div
                            key={esp.id}
                            className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-amber-500 rounded-2xl flex flex-col justify-between gap-3 shadow-xs"
                          >
                            <div>
                              <p className="text-xs font-extrabold text-gray-900 dark:text-white">{esp.nome}</p>
                              <div className="space-y-0.5 mt-2 text-[11px]">
                                <div className="flex justify-between text-gray-500">
                                  <span>Sem IVA:</span>
                                  <span className="font-bold">{formatCurrency(price)}</span>
                                </div>
                                <div className="flex justify-between text-amber-600 font-black border-t pt-0.5">
                                  <span>Com IVA:</span>
                                  <span>{formatCurrency(price + ivaVal)}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickAddEspaco(esp)}
                              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <Plus size={15} /> {qtyAdded > 0 ? `(${qtyAdded})` : 'Adicionar'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase mb-3 flex items-center gap-2 tracking-wider">
                      <Layers size={16} className="text-amber-600" /> Aluguer de Louça, Mesas & Materiais
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {filterList(materiais).map((mat) => {
                        const key = `mat_${mat.id}`;
                        const qtyAdded = addedIds[key] || 0;
                        const price = Number(mat.preco_aluguer || mat.preco_custo || 0);
                        const ivaVal = price * 0.15;
                        return (
                          <div
                            key={mat.id}
                            className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-amber-500 rounded-2xl flex flex-col justify-between gap-3 shadow-xs"
                          >
                            <div>
                              <p className="text-xs font-extrabold text-gray-900 dark:text-white truncate">{mat.nome}</p>
                              <div className="space-y-0.5 mt-2 text-[11px]">
                                <div className="flex justify-between text-gray-500">
                                  <span>Sem IVA:</span>
                                  <span className="font-bold">{formatCurrency(price)}</span>
                                </div>
                                <div className="flex justify-between text-amber-600 font-black border-t pt-0.5">
                                  <span>Com IVA:</span>
                                  <span>{formatCurrency(price + ivaVal)}</span>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickAddMaterial(mat)}
                              className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1"
                            >
                              <Plus size={14} /> {qtyAdded > 0 ? `(${qtyAdded})` : 'Adicionar'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: ITEM PERSONALIZADO / MANUAL */}
              {activeTab === 'MANUAL' && (
                <form onSubmit={handleAddManualSubmit} className="p-5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 block mb-1">
                        Tipo do Item
                      </label>
                      <select
                        value={manualTipo}
                        onChange={(e) => setManualTipo(e.target.value as any)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white"
                      >
                        <option value="Servico">Serviço / Catering</option>
                        <option value="Produto">Produto Geral</option>
                        <option value="Material">Material / Equipamento</option>
                        <option value="Outro">Outro Encargo</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 block mb-1">
                        Unidade de Medida
                      </label>
                      <input
                        type="text"
                        value={manualUnidade}
                        onChange={(e) => setManualUnidade(e.target.value)}
                        placeholder="Ex: Pessoa, Unidade, Hora, Dia"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 block mb-1">
                      Descrição do Item / Serviço Personalizado
                    </label>
                    <input
                      type="text"
                      required
                      value={manualDescricao}
                      onChange={(e) => setManualDescricao(e.target.value)}
                      placeholder="Ex: Serviço Especial de Barman Executivo para Cocktail..."
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 block mb-1">
                        Quantidade
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={manualQuantidade}
                        onChange={(e) => setManualQuantidade(parseFloat(e.target.value) || 1)}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 block mb-1">
                        Preço Unitário Sem IVA (AOA)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={manualPreco}
                        onChange={(e) => setManualPreco(parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-md"
                    >
                      <Plus size={16} /> Adicionar Item Personalizado
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}

        {/* Modal Footer */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsCartViewOpen(!isCartViewOpen)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 text-xs font-black rounded-xl transition-all flex items-center gap-1.5"
            >
              <ShoppingCart size={15} />
              <span>{isCartViewOpen ? 'Voltar ao Catálogo' : `Ver Carrinho (${itens.length})`}</span>
            </button>
            <span className="text-xs text-gray-500 font-semibold hidden sm:inline">
              Selecione e adicione múltiplos itens sem fechar o catálogo.
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-900 dark:bg-white hover:bg-gray-800 text-white dark:text-gray-900 text-xs font-black rounded-xl transition-all shadow-md shrink-0"
          >
            Concluir Seleção ({itens.length} no carrinho)
          </button>
        </div>
      </div>
    </Modal>
  );
}

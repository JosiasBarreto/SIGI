import React from 'react';
import { 
  Package, X, Tag, AlignLeft, Calendar, Info, DollarSign, Activity, Hash, Layers, Scale, Ruler 
} from 'lucide-react';
import { formatCurrency } from '../../lib/utils';
import Modal from './Modal';

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
}

export function ProductDetailsModal({ isOpen, onClose, product }: ProductDetailsModalProps) {
  if (!product) return null;

  const tipoBadgeStyles: Record<string, string> = {
    'Consumivel': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Acabado': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    'Revenda': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const statusStyle = product.ativo 
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes do Produto"
      maxWidth="max-w-4xl"
      footer={
        <button
          onClick={onClose}
          className="px-6 py-2.5 font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 rounded-xl transition-all"
        >
          Fechar
        </button>
      }
    >
      <div className="space-y-6">
        
        {/* Header Summary */}
        <div className="flex items-start justify-between bg-gray-50 dark:bg-gray-800/40 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Package size={32} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">{product.codigo || 'Sem Código'}</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-2">
                {product.nome}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${tipoBadgeStyles[product.tipo] || 'bg-gray-100 text-gray-800'}`}>
                  {product.tipo}
                </span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${statusStyle}`}>
                  {product.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Informações Gerais */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              <Info size={16} /> Informações Gerais
            </h4>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Hash size={14}/> Código</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{product.codigo || '-'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Tag size={14}/> Nome</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{product.nome}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Layers size={14}/> Categoria</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{product.categoria_nome || '-'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Scale size={14}/> Tipo</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{product.tipo}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Activity size={14}/> Estado</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{product.ativo ? 'Ativo' : 'Inativo'}</span>
              </div>
            </div>
          </div>

          {/* Informações Comerciais */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              <DollarSign size={16} /> Informações Comerciais
            </h4>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500">Preço de Compra</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                  {product.preco_compra ? formatCurrency(Number(product.preco_compra)) : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500">Preço de Venda Base</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {product.preco_venda ? formatCurrency(Number(product.preco_venda)) : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500">Taxa de IVA</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {product.taxa_iva ? `${product.taxa_iva}%` : 'Isento'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500">Preço de Venda (C/ IVA)</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {product.preco_venda ? formatCurrency(Number(product.preco_venda) * (1 + (Number(product.taxa_iva || 0) / 100))) : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Margem Bruta Estimada</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {product.preco_venda && product.preco_compra 
                    ? `${(((Number(product.preco_venda) - Number(product.preco_compra)) / Number(product.preco_compra)) * 100).toFixed(1)}%`
                    : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Stock */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              <Package size={16} /> Stock e Inventário
            </h4>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Package size={14}/> Quantidade Atual</span>
                <span className="text-lg font-black text-primary">
                  {Number(product.stock_atual || 0)} <span className="text-xs font-semibold text-gray-400">{product.unidade_medida_sigla || 'un'}</span>
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500">Stock Mínimo (Alerta)</span>
                <span className="text-sm font-bold text-amber-600">
                  {Number(product.stock_minimo || 0)} <span className="text-xs font-semibold">{product.unidade_medida_sigla || 'un'}</span>
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Ruler size={14}/> Unidade de Medida</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {product.unidade_medida_nome ? `${product.unidade_medida_nome} (${product.unidade_medida_sigla})` : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500">Armazém Base</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {product.armazem_nome || 'Principal'}
                </span>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              <AlignLeft size={16} /> Informações Adicionais
            </h4>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3 shadow-sm h-full">
              <div>
                <span className="text-xs font-medium text-gray-500 mb-1 block">Descrição / Observações</span>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg min-h-[60px]">
                  {product.descricao || 'Nenhuma descrição fornecida.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mb-1"><Calendar size={12}/> Data de Criação</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {product.created_at ? new Date(product.created_at).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mb-1"><Calendar size={12}/> Última Atualização</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Modal>
  );
}

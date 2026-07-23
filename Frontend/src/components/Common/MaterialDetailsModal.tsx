import React from 'react';
import { 
  Package, X, Tag, AlignLeft, Calendar, Info, Activity, Hash, Layers, Scale, Ruler 
} from 'lucide-react';
import Modal from './Modal';

interface MaterialDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: any;
}

export function MaterialDetailsModal({ isOpen, onClose, material }: MaterialDetailsModalProps) {
  if (!material) return null;

  const tipoBadgeStyles: Record<string, string> = {
    'Consumivel': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    'Reutilizavel': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  };

  const statusStyle = (() => {
    switch(material.estado) {
      case 'Disponivel': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Manutenção': 
      case 'Manutencao': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Danificado': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'Em Uso': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  })();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalhes do Material"
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
              <p className="text-sm font-bold text-gray-500 mb-1">{material.codigo || 'Sem Código'}</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-2">
                {material.nome}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${tipoBadgeStyles[material.tipo] || 'bg-gray-100 text-gray-800'}`}>
                  {material.tipo || 'Desconhecido'}
                </span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${statusStyle}`}>
                  {material.estado || 'Desconhecido'}
                </span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider ${material.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                  {material.is_active ? 'Ativo' : 'Inativo'}
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
                <span className="text-sm font-bold text-gray-900 dark:text-white">{material.codigo || '-'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Tag size={14}/> Nome</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{material.nome}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Layers size={14}/> Categoria</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{material.categoria || '-'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Scale size={14}/> Tipo</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{material.tipo || '-'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Activity size={14}/> Estado</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{material.estado || '-'}</span>
              </div>
            </div>
          </div>

          {/* Stock e Inventário */}
          <div className="space-y-4">
            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              <Package size={16} /> Inventário e Disponibilidade
            </h4>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Package size={14}/> Quantidade Total</span>
                <span className="text-lg font-black text-gray-900 dark:text-white">
                  {Number(material.quantidade_total || 0)} <span className="text-xs font-semibold text-gray-400">{material.unidade_medida_sigla || ''}</span>
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500">Quantidade Disponível</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {Number(material.quantidade_disponivel || 0)} <span className="text-xs font-semibold">{material.unidade_medida_sigla || ''}</span>
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-gray-50 dark:border-gray-800/50">
                <span className="text-xs font-medium text-gray-500">Quantidade em Uso</span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {Number(material.quantidade_total || 0) - Number(material.quantidade_disponivel || 0)} <span className="text-xs font-semibold">{material.unidade_medida_sigla || ''}</span>
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5"><Ruler size={14}/> Unidade de Medida</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {material.unidade_medida_nome ? `${material.unidade_medida_nome} (${material.unidade_medida_sigla})` : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="space-y-4 md:col-span-2">
            <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-2">
              <AlignLeft size={16} /> Observações Adicionais
            </h4>
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 space-y-3 shadow-sm h-full">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg min-h-[60px]">
                  {material.notas || 'Nenhuma observação registada.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mb-1"><Calendar size={12}/> Data de Criação</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {material.created_at ? new Date(material.created_at).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 flex items-center gap-1 mb-1"><Calendar size={12}/> Última Atualização</span>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {material.updated_at ? new Date(material.updated_at).toLocaleDateString() : '-'}
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

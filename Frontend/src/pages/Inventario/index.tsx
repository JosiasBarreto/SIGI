import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Package, 
  Boxes, 
  ClipboardCheck, 
  AlertOctagon, 
  ShieldAlert, 
  History,
  Layers,
  ArrowRightLeft,
  FileSpreadsheet
} from 'lucide-react';
import { inventoryService } from '../../services/inventoryService';
import { inventoryAuditService } from '../../services/inventoryAuditService';
import { InventoryItem } from './types';
import { StockOverviewTab } from './components/StockOverviewTab';
import { PhysicalCountTab } from './components/PhysicalCountTab';
import { DivergencesTab } from './components/DivergencesTab';
import { QuarantineTab } from './components/QuarantineTab';
import { StockMovementsTab } from './components/StockMovementsTab';
import { SingleAdjustModal } from './components/SingleAdjustModal';
import { TransferModal } from './components/TransferModal';
import { QuarantineModal } from './components/QuarantineModal';
import { OfficialInventoryList } from './components/OfficialInventoryList';
import { OfficialInventoryDetail } from './components/OfficialInventoryDetail';

export const InventarioModule: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'auditoria' | 'overview' | 'contagem_rapida' | 'quarentena' | 'movimentos'>('auditoria');

  // Sessão oficial de inventário selecionada para visualização detalhada
  const [selectedInventoryId, setSelectedInventoryId] = useState<number | null>(null);

  // Estado compartilhado das contagens rápidas ad-hoc
  const [contagens, setContagens] = useState<Record<string, number | null>>({});

  // Modais de ações no stock
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<InventoryItem | null>(null);
  const [isSingleAdjustOpen, setIsSingleAdjustOpen] = useState(false);

  const [selectedItemForTransfer, setSelectedItemForTransfer] = useState<InventoryItem | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const [selectedItemForQuarantine, setSelectedItemForQuarantine] = useState<InventoryItem | null>(null);
  const [isQuarantineOpen, setIsQuarantineOpen] = useState(false);

  // Busca consolidada de stock e armazéns
  const { 
    data: stockData, 
    isLoading, 
    refetch 
  } = useQuery({
    queryKey: ['consolidated-stock-inventory'],
    queryFn: () => inventoryService.fetchConsolidatedStock(),
  });

  // Busca sessões de auditoria ativas para badge no separador
  const { data: auditListData } = useQuery({
    queryKey: ['inventarios-oficiais-list'],
    queryFn: () => inventoryAuditService.listar(),
  });

  const items = stockData?.items || [];
  const armazens = stockData?.armazens || [];
  const activeAuditsCount = (auditListData?.items || []).filter(
    s => s.estado === 'EM_CONTAGEM' || s.estado === 'EM_CONFERENCIA'
  ).length;

  // Handlers de Contagem Ad-hoc
  const handleUpdateContagem = (key: string, qtd: number | null) => {
    setContagens(prev => ({ ...prev, [key]: qtd }));
  };

  const handleResetContagens = () => {
    setContagens({});
  };

  const handleStockUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['consolidated-stock-inventory'] });
    queryClient.invalidateQueries({ queryKey: ['armazem-produtos'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['materiais'] });
    queryClient.invalidateQueries({ queryKey: ['inventarios-oficiais-list'] });
    refetch();
  };

  // Abre modal de ajuste individual
  const handleOpenSingleAdjust = (item: InventoryItem) => {
    setSelectedItemForAdjust(item);
    setIsSingleAdjustOpen(true);
  };

  // Abre modal de transferência
  const handleOpenTransfer = (item?: InventoryItem) => {
    setSelectedItemForTransfer(item || null);
    setIsTransferOpen(true);
  };

  // Abre modal de quarentena
  const handleOpenQuarantine = (item?: InventoryItem) => {
    setSelectedItemForQuarantine(item || null);
    setIsQuarantineOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-primary/10 text-primary rounded-xl">
              <Boxes size={22} />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Gestão de Stock e Inventário
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Módulo de Inventário de Stock, Auditoria Cega e Relatórios Oficiais (SIGI ERP)
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto space-x-1 sm:space-x-2">
        <button
          onClick={() => {
            setActiveTab('auditoria');
            setSelectedInventoryId(null);
          }}
          className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'auditoria'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <ClipboardCheck size={16} />
          Sessões de Inventário & Auditoria
          {activeAuditsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 animate-pulse">
              {activeAuditsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('overview');
            setSelectedInventoryId(null);
          }}
          className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Boxes size={16} />
          Visão Geral do Stock
        </button>

        <button
          onClick={() => {
            setActiveTab('contagem_rapida');
            setSelectedInventoryId(null);
          }}
          className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'contagem_rapida'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <Layers size={16} />
          Contagem Rápida Ad-hoc
        </button>

        <button
          onClick={() => {
            setActiveTab('quarentena');
            setSelectedInventoryId(null);
          }}
          className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'quarentena'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <ShieldAlert size={16} />
          Zona de Quarentena & Avarias
        </button>

        <button
          onClick={() => {
            setActiveTab('movimentos');
            setSelectedInventoryId(null);
          }}
          className={`flex items-center gap-2 py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'movimentos'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          <History size={16} />
          Rastreabilidade de Movimentos
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'auditoria' && (
        selectedInventoryId ? (
          <OfficialInventoryDetail
            inventoryId={selectedInventoryId}
            onBack={() => setSelectedInventoryId(null)}
            onStockUpdated={handleStockUpdated}
          />
        ) : (
          <OfficialInventoryList
            armazens={armazens}
            onSelectInventory={(id) => setSelectedInventoryId(id)}
            onStockUpdated={handleStockUpdated}
          />
        )
      )}

      {activeTab === 'overview' && (
        <StockOverviewTab
          items={items}
          armazens={armazens}
          isLoading={isLoading}
          onRefresh={handleStockUpdated}
          onStartContagem={() => setActiveTab('auditoria')}
          onOpenTransfer={handleOpenTransfer}
          onOpenSingleAdjust={handleOpenSingleAdjust}
          onOpenQuarantine={handleOpenQuarantine}
        />
      )}

      {activeTab === 'contagem_rapida' && (
        <PhysicalCountTab
          items={items}
          armazens={armazens}
          contagens={contagens}
          onUpdateContagem={handleUpdateContagem}
          onResetContagens={handleResetContagens}
          onGoToDivergencias={() => setActiveTab('auditoria')}
        />
      )}

      {activeTab === 'quarentena' && (
        <QuarantineTab
          onOpenQuarantineModal={() => handleOpenQuarantine()}
          onStockUpdated={handleStockUpdated}
        />
      )}

      {activeTab === 'movimentos' && (
        <StockMovementsTab />
      )}

      {/* Modals */}
      <SingleAdjustModal
        item={selectedItemForAdjust}
        isOpen={isSingleAdjustOpen}
        onClose={() => {
          setIsSingleAdjustOpen(false);
          setSelectedItemForAdjust(null);
        }}
        onSuccess={handleStockUpdated}
      />

      <TransferModal
        item={selectedItemForTransfer}
        items={items}
        armazens={armazens}
        isOpen={isTransferOpen}
        onClose={() => {
          setIsTransferOpen(false);
          setSelectedItemForTransfer(null);
        }}
        onSuccess={handleStockUpdated}
      />

      <QuarantineModal
        item={selectedItemForQuarantine}
        items={items}
        isOpen={isQuarantineOpen}
        onClose={() => {
          setIsQuarantineOpen(false);
          setSelectedItemForQuarantine(null);
        }}
        onSuccess={handleStockUpdated}
      />
    </div>
  );
};

export default InventarioModule;

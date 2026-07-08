import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Plus,
  RefreshCw,
  Box,
  MapPin,
  AlertCircle,
  ArrowRightLeft
} from "lucide-react";
import { warehouseService } from "../services";
import { useAuth } from "../components/AuthContext";
import { toast } from "react-toastify";
import Modal from "../components/Common/Modal";

export default function Armazens() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  
  const [selectedArmazem, setSelectedArmazem] = useState<any>(null);
  
  // Create form state
  const [novoArmazem, setNovoArmazem] = useState({
    codigo: "",
    nome: "",
    localizacao: "",
    descricao: "",
    principal: false
  });

  // Transfer form state
  const [transferencia, setTransferencia] = useState({
    origem_armazem_id: "",
    destino_armazem_id: "",
    tipo_item: "Ingrediente",
    item_id: "",
    quantidade: ""
  });

  const { data: armazensResponse, isLoading } = useQuery({
    queryKey: ["armazens"],
    queryFn: () => warehouseService.getAll({ per_page: 1000 })
  });

  const armazens = armazensResponse?.items || [];

  const { data: stockData, isLoading: isLoadingStock } = useQuery({
    queryKey: ["armazem-stock", selectedArmazem?.id],
    queryFn: () => warehouseService.getStock(selectedArmazem?.id),
    enabled: !!selectedArmazem && isStockModalOpen
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => warehouseService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armazens"] });
      setIsCreateModalOpen(false);
      setNovoArmazem({ codigo: "", nome: "", localizacao: "", descricao: "", principal: false });
      toast.success("Armazém criado com sucesso!");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao criar armazém.");
    }
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => warehouseService.transfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["armazens"] });
      queryClient.invalidateQueries({ queryKey: ["armazem-stock"] });
      setIsTransferModalOpen(false);
      setTransferencia({ origem_armazem_id: "", destino_armazem_id: "", tipo_item: "Ingrediente", item_id: "", quantidade: "" });
      toast.success("Transferência realizada com sucesso!");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error("Erro ao transferir stock.");
    }
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(novoArmazem);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferencia.origem_armazem_id === transferencia.destino_armazem_id) {
      toast.error("O armazém de destino deve ser diferente da origem.");
      return;
    }
    transferMutation.mutate({
      ...transferencia,
      origem_armazem_id: Number(transferencia.origem_armazem_id),
      destino_armazem_id: Number(transferencia.destino_armazem_id),
      item_id: Number(transferencia.item_id),
      quantidade: Number(transferencia.quantidade)
    });
  };

  const openStock = (armazem: any) => {
    setSelectedArmazem(armazem);
    setIsStockModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 uppercase tracking-tight flex items-center gap-2">
            <Package className="text-primary" size={28} />
            Gestão de Armazéns
          </h1>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
            Controlo de depósitos físicos, stocks e transferências
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-xs uppercase tracking-wider"
          >
            <ArrowRightLeft size={16} /> Transferir
          </button>
          {user?.role === "Administrador" && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 text-xs uppercase tracking-wider"
            >
              <Plus size={16} /> Novo Armazém
            </button>
          )}
        </div>
      </div>

      {/* Warehouses Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
          A carregar armazéns...
        </div>
      ) : armazens.length === 0 ? (
        <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs bg-white dark:bg-surface-dark rounded-2xl border border-gray-100 dark:border-gray-800">
          Nenhum armazém configurado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {armazens.map((armazem: any) => (
            <div key={armazem.id} className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Box size={24} />
                  </div>
                  {armazem.principal && (
                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider">
                      Principal
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight truncate">
                  {armazem.nome}
                </h3>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mt-1">
                  CÓDIGO: {armazem.codigo}
                </p>
                <div className="flex items-center gap-1.5 mt-3 text-gray-500 dark:text-gray-400 text-xs font-medium">
                  <MapPin size={14} />
                  <span className="truncate">{armazem.localizacao || "Localização não definida"}</span>
                </div>
                {armazem.descricao && (
                  <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                    {armazem.descricao}
                  </p>
                )}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => openStock(armazem)}
                  className="w-full bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 text-gray-900 dark:text-white py-2.5 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-colors"
                >
                  Consultar Stock
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Stock: ${selectedArmazem?.nome}`}
        maxWidth="max-w-4xl"
      >
        {isLoadingStock ? (
          <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            A carregar mapa de stock...
          </div>
        ) : (
          <div className="space-y-6">
            {/* Produtos */}
            <div>
              <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                Produtos Finais
              </h4>
              {(!stockData?.produtos || stockData.produtos.length === 0) ? (
                <p className="text-xs text-gray-400 font-medium italic">Sem stock de produtos.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {stockData.produtos.map((p: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
                      <p className="text-[10px] text-gray-500 uppercase font-black truncate">{p.produto_nome}</p>
                      <p className="text-lg font-mono font-bold text-gray-900 dark:text-white mt-1">{p.stock_atual}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ingredientes */}
            <div>
              <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                Ingredientes & Consumíveis
              </h4>
              {(!stockData?.ingredientes || stockData.ingredientes.length === 0) ? (
                <p className="text-xs text-gray-400 font-medium italic">Sem stock de ingredientes.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {stockData.ingredientes.map((i: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
                      <p className="text-[10px] text-gray-500 uppercase font-black truncate">{i.ingrediente_nome}</p>
                      <p className="text-lg font-mono font-bold text-gray-900 dark:text-white mt-1">{i.stock_atual}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Materiais */}
            <div>
              <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
                Materiais / Utensílios
              </h4>
              {(!stockData?.materiais || stockData.materiais.length === 0) ? (
                <p className="text-xs text-gray-400 font-medium italic">Sem stock de materiais.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {stockData.materiais.map((m: any, idx: number) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800/40 p-3 rounded-lg border border-gray-100 dark:border-gray-700/50">
                      <p className="text-[10px] text-gray-500 uppercase font-black truncate">{m.material_nome}</p>
                      <p className="text-lg font-mono font-bold text-gray-900 dark:text-white mt-1">{m.stock_atual}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create Warehouse Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Novo Armazém"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Código *</label>
            <input
              type="text"
              required
              value={novoArmazem.codigo}
              onChange={e => setNovoArmazem({...novoArmazem, codigo: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-bold uppercase transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nome *</label>
            <input
              type="text"
              required
              value={novoArmazem.nome}
              onChange={e => setNovoArmazem({...novoArmazem, nome: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-bold transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Localização</label>
            <input
              type="text"
              value={novoArmazem.localizacao}
              onChange={e => setNovoArmazem({...novoArmazem, localizacao: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-bold transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Descrição</label>
            <textarea
              rows={3}
              value={novoArmazem.descricao}
              onChange={e => setNovoArmazem({...novoArmazem, descricao: e.target.value})}
              className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-medium transition-all"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="principal"
              checked={novoArmazem.principal}
              onChange={e => setNovoArmazem({...novoArmazem, principal: e.target.checked})}
              className="w-4 h-4 text-primary bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 rounded focus:ring-primary"
            />
            <label htmlFor="principal" className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Definir como Armazém Principal
            </label>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 font-black text-gray-500 uppercase text-[10px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
            >
              Guardar Armazém
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Stock Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transferência Inter-Armazém"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Origem *</label>
              <select
                required
                value={transferencia.origem_armazem_id}
                onChange={e => setTransferencia({...transferencia, origem_armazem_id: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-bold"
              >
                <option value="">Selecione...</option>
                {armazens.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Destino *</label>
              <select
                required
                value={transferencia.destino_armazem_id}
                onChange={e => setTransferencia({...transferencia, destino_armazem_id: e.target.value})}
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-bold"
              >
                <option value="">Selecione...</option>
                {armazens.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tipo de Item *</label>
            <select
              required
              value={transferencia.tipo_item}
              onChange={e => setTransferencia({...transferencia, tipo_item: e.target.value, item_id: ""})}
              className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-bold"
            >
              <option value="Ingrediente">Ingrediente / Consumível</option>
              <option value="Material">Material / Utensílio</option>
              <option value="Produto">Produto Final</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">ID do Item *</label>
              <input
                type="number"
                required
                value={transferencia.item_id}
                onChange={e => setTransferencia({...transferencia, item_id: e.target.value})}
                placeholder="ID (Ex: 5)"
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-bold font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Qtd *</label>
              <input
                type="number"
                step="0.01"
                required
                value={transferencia.quantidade}
                onChange={e => setTransferencia({...transferencia, quantidade: e.target.value})}
                placeholder="0.00"
                className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 focus:border-primary px-3 py-2 rounded-xl outline-none text-xs font-bold font-mono"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsTransferModalOpen(false)}
              className="px-4 py-2 font-black text-gray-500 uppercase text-[10px]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={transferMutation.isPending}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20"
            >
              Confirmar Transferência
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

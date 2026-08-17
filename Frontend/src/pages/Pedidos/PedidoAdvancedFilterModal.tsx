import React, { useState } from "react";
import Modal from "../../components/Common/Modal";
import { SlidersHorizontal, RotateCcw, Check } from "lucide-react";

interface PedidoAdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  onlyInStock: boolean;
  setOnlyInStock: (val: boolean) => void;
  minPrice: string;
  setMinPrice: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
  onReset: () => void;
}

export default function PedidoAdvancedFilterModal({
  isOpen,
  onClose,
  categories,
  selectedCategory,
  setSelectedCategory,
  selectedType,
  setSelectedType,
  onlyInStock,
  setOnlyInStock,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortBy,
  setSortBy,
  onReset,
}: PedidoAdvancedFilterModalProps) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Filtros Avançados do Catálogo" maxWidth="max-w-md">
      <div className="space-y-4">
        {/* Category */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase block">
            Categoria
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
          >
            <option value="">Todas as Categorias</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Produto */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase block">
            Tipo de Produto
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
          >
            <option value="TODOS">Todos (Acabados e Revenda)</option>
            <option value="ACABADO">Produtos Acabados</option>
            <option value="REVENDA">Revenda</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase block">
            Faixa de Preço
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Preço Mínimo"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
            />
            <input
              type="number"
              placeholder="Preço Máximo"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Stock Checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="onlyInStock"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
            className="rounded text-primary focus:ring-primary h-4 w-4"
          />
          <label htmlFor="onlyInStock" className="text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            Apenas produtos com stock disponível
          </label>
        </div>

        {/* Ordering */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase block">
            Ordenar por
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
          >
            <option value="NOME_ASC">Nome (A - Z)</option>
            <option value="NOME_DESC">Nome (Z - A)</option>
            <option value="PRECO_ASC">Menor Preço</option>
            <option value="PRECO_DESC">Maior Preço</option>
            <option value="STOCK_DESC">Maior Stock</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
          >
            <RotateCcw size={14} /> Limpar Filtros
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-md"
          >
            <Check size={14} /> Aplicar Filtros
          </button>
        </div>
      </div>
    </Modal>
  );
}

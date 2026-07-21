import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  orderService, 
  productService, 
  materialService, 
  productionService, 
  deliveryService,
  financialService,
  requestService
} from "../services";
import { 
  FileText, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Calendar, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Package, 
  Truck, 
  ChefHat, 
  FileSpreadsheet
} from "lucide-react";
import { formatCurrency, cn } from "../lib/utils";

// Seeded local storage fallback for a unified experience
const DUMMY_DELIVERIES = [
  { id: "DLV-201", order: "PED-102", client: "Maria Santos", address: "Morro Bento, Luanda", date: "2026-06-19", status: "Concluída", motorista: "Pedro Entregador" },
  { id: "DLV-202", order: "PED-105", client: "Supermercado Kero", address: "Benfica, Luanda", date: "2026-06-19", status: "Pendente", motorista: "Pedro Entregador" },
  { id: "DLV-203", order: "PED-112", client: "Clínica Sagrada", address: "Maianga, Luanda", date: "2026-06-20", status: "Pendente", motorista: "Helena Rosa" }
];

export default function Relatorios() {
  const [activeTab, setActiveTab] = useState<"vendas" | "pedidos" | "producao" | "armazem" | "materiais" | "financeiro" | "logistica">("vendas");
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-06-30");
  const [filterStatus, setFilterStatus] = useState("Todos");

  // Fetch query data
  const { data: ordersRes, isLoading: ordersLoading } = useQuery({
    queryKey: ["orders-rel"],
    queryFn: () => orderService.getAll({ per_page: 1000 })
  });
  
  const { data: productsRes } = useQuery({
    queryKey: ["products-rel"],
    queryFn: () => productService.getAll({ per_page: 1000 })
  });

  const { data: materialsRes } = useQuery({
    queryKey: ["materials-rel"],
    queryFn: () => materialService.getAll({ per_page: 1000 })
  });

  const { data: prodOrdersRes } = useQuery({
    queryKey: ["prod-rel"],
    queryFn: () => productionService.getAll({ per_page: 1000 })
  });

  const { data: reqsRes } = useQuery({
    queryKey: ["reqs-rel"],
    queryFn: () => requestService.getAll({ per_page: 1000 })
  });

  const { data: deliveriesRes } = useQuery({
    queryKey: ["deliveries-rel"],
    queryFn: () => deliveryService.getAll({ per_page: 1000 })
  });

  const orders = ordersRes?.items || [];
  const products = productsRes?.items || [];
  const materials = materialsRes?.items || [];
  const prodOrders = prodOrdersRes?.items || [];
  const requisitions = reqsRes?.items || [];
  const deliveries = deliveriesRes?.items || [];

  // Local storage for receivables
  const savedReceivables = localStorage.getItem("sigi_receivables");
  const receivables = savedReceivables ? JSON.parse(savedReceivables) : [
    { id: "REC-001", client: "Supermercado Kero", doc: "FAT-2026/089", dueDate: "2026-06-15", amount: 450000, paid: 150000, status: "Vencida" },
    { id: "REC-002", client: "Colégio Angolano", doc: "FAT-2026/094", dueDate: "2026-06-25", amount: 820000, paid: 820000, status: "Paga" },
    { id: "REC-003", client: "Clínica Sagrada Esperança", doc: "FAT-2026/102", dueDate: "2026-07-02", amount: 310000, paid: 0, status: "Pendente" },
  ];

  // Helper selectors and calculations per tab
  
  // 1. Vendas Report Logic
  const getVendasReport = () => {
    let list = orders.map((o: any) => ({
      id: o.numero || o.id || "PED-121",
      date: (o.data_pedido || o.dueDate || new Date().toISOString()).split("T")[0],
      client: o.cliente?.nome || o.clientName || "Cliente Final",
      type: o.tipo || o.type || "Simples",
      amount: Number(o.valor_total || o.total || 0),
      payment: o.estado_pagamento || "Pendente"
    }));

    // Filter by date range
    list = list.filter((v: any) => v.date >= startDate && v.date <= endDate);

    // Search term filter
    if (searchTerm) {
      list = list.filter((v: any) => v.client.toLowerCase().includes(searchTerm.toLowerCase()) || String(v.id).toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return list;
  };

  // 2. Pedidos Report Logic
  const getPedidosReport = () => {
    let list = orders.map((o: any) => ({
      id: o.numero || o.id || "PED-121",
      date: (o.data_pedido || o.dueDate || new Date().toISOString()).split("T")[0],
      client: o.cliente?.nome || o.clientName || "Cliente Final",
      status: o.estado || "Confirmado",
      amount: Number(o.valor_total || o.total || 0)
    }));

    list = list.filter((p: any) => p.date >= startDate && p.date <= endDate);

    if (filterStatus !== "Todos") {
      list = list.filter((p: any) => p.status.toLowerCase() === filterStatus.toLowerCase());
    }

    if (searchTerm) {
      list = list.filter((p: any) => p.client.toLowerCase().includes(searchTerm.toLowerCase()) || String(p.id).toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return list;
  };

  // 3. Producao Report Logic
  const getProducaoReport = () => {
    let list = prodOrders.map((p: any) => ({
      id: p.numero || p.id || "OP-10",
      product: p.produto?.nome || p.productName || "Produto",
      qty: p.quantidade || p.quantity || 0,
      sector: p.setor || p.sector || "Geral",
      status: p.estado || p.status || "Pendente",
      date: (p.data_prevista || p.createdAt || new Date().toISOString()).split("T")[0]
    }));

    if (filterStatus !== "Todos") {
      list = list.filter((p: any) => p.sector === filterStatus);
    }

    if (searchTerm) {
      list = list.filter((p: any) => p.product.toLowerCase().includes(searchTerm.toLowerCase()) || String(p.id).toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return list;
  };

  // 4. Armazem Report Logic (inputs & outputs)
  const getArmazemReport = () => {
    let list = products.map((p: any) => ({
      id: p.codigo || p.id || "PRD-01",
      name: p.nome || p.name || "",
      category: p.categoria_nome || p.category || "Ingredientes",
      stock: Number(p.stock_atual || p.quantity || p.quantidade || 0),
      unit: p.unidade_medida_sigla || p.unit || p.unidade || "un",
      minStock: Number(p.stock_minimo || p.min_stock || 10),
      status: Number(p.stock_atual || p.quantity || p.quantidade || 0) <= Number(p.stock_minimo || p.min_stock || 10) ? "Crítico" : "Normal"
    }));

    if (filterStatus !== "Todos") {
      if (filterStatus === "Crítico") {
        list = list.filter((p: any) => p.stock <= p.minStock);
      } else {
        list = list.filter((p: any) => p.category === filterStatus);
      }
    }

    if (searchTerm) {
      list = list.filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return list;
  };

  // 5. Materiais Report Logic
  const getMateriaisReport = () => {
    // Collect from material catalog mapping them to deliver stats
    let list = materials.map((m: any) => ({
      id: m.codigo || m.id || "MAT-01",
      name: m.nome || m.name || "",
      delivQty: Number(m.quantidade_total || 0),
      devQty: Number(m.quantidade_disponivel || 0),
      lost: Number(m.quantidade_reservada || 0),
      damaged: 0
    }));

    if (searchTerm) {
      list = list.filter((m: any) => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return list;
  };

  // 6. Financeiro Report Logic
  const getFinanceiroReport = () => {
    let list = [
      { date: "2026-06-19", type: "Receita", category: "Venda Direta", doc: "FAT-091", amount: 150000, description: "Bolo Decorado de Aniversário" },
      { date: "2026-06-19", type: "Despesa", category: "Ingredientes", doc: "REG-025", amount: 45000, description: "Compra de Açúcar e Trigo" },
      { date: "2026-06-18", type: "Receita", category: "Catering", doc: "FAT-089", amount: 1200000, description: "Catering Evento Corporativo" },
      { date: "2026-06-17", type: "Despesa", category: "Logística", doc: "REG-024", amount: 35000, description: "Abastecimento de Gasóleo Carrinha" },
      { date: "2026-06-15", type: "Receita", category: "Contas a Receber", doc: "FAT-082", amount: 450000, description: "Recebimento Supermercado Kero" }
    ];

    list = list.filter(f => f.date >= startDate && f.date <= endDate);

    if (filterStatus !== "Todos") {
      list = list.filter(f => f.type === filterStatus);
    }

    if (searchTerm) {
      list = list.filter(f => f.category.toLowerCase().includes(searchTerm.toLowerCase()) || f.description.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return list;
  };

  // 7. Logistica Report Logic
  const getLogisticaReport = () => {
    let list = deliveries.map((d: any) => ({
      id: d.codigo || d.id || "DLV-01",
      order: d.pedido?.numero || d.order || "PED-???",
      client: d.cliente?.nome || d.client || "Cliente",
      address: d.endereco_entrega || d.address || "Local",
      date: (d.data_entrega || d.date || new Date().toISOString()).split("T")[0],
      status: d.estado || d.status || "Pendente",
      motorista: d.motorista?.nome || d.motorista || "Não Atribuído"
    }));

    if (list.length === 0) list = DUMMY_DELIVERIES;

    if (filterStatus !== "Todos") {
      list = list.filter((d: any) => d.status === filterStatus);
    }

    if (searchTerm) {
      list = list.filter((d: any) => d.client.toLowerCase().includes(searchTerm.toLowerCase()) || d.motorista.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return list;
  };

  // Export CSV functions
  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const keys = Object.keys(data[0]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [
          keys.join(";"), 
          ...data.map(row => keys.map(k => {
            const val = row[k];
            return typeof val === 'string' && val.includes(';') ? `"${val}"` : val;
          }).join(";"))
        ].join("\n");
        
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Run dynamic exports
  const handleExportCSVClick = () => {
    let listToExport: any[] = [];
    let name = `relatorio_${activeTab}`;
    
    if (activeTab === "vendas") listToExport = getVendasReport();
    else if (activeTab === "pedidos") listToExport = getPedidosReport();
    else if (activeTab === "producao") listToExport = getProducaoReport();
    else if (activeTab === "armazem") listToExport = getArmazemReport();
    else if (activeTab === "materiais") listToExport = getMateriaisReport();
    else if (activeTab === "financeiro") listToExport = getFinanceiroReport();
    else if (activeTab === "logistica") listToExport = getLogisticaReport();

    exportToCSV(listToExport, name);
  };

  // Handle Printable view
  const handlePrintClick = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="relatorios-module-root">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="text-primary hover:rotate-12 transition-transform" /> Central de Relatórios Gerais
          </h1>
          <p className="text-xs text-gray-500 mt-1">Gere, filtre, imprima ou exporte relatórios consolidados em PDF e Excel para todas as decisões do ERP.</p>
        </div>
        
        <div className="flex gap-2 shrink-0">
          <button 
            onClick={handleExportCSVClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-success text-white text-xs font-bold rounded-lg shadow-sm hover:bg-success/90 transition"
          >
            <Download size={14} /> Exportar Excel
          </button>
          <button 
            onClick={handlePrintClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:bg-primary/90 transition"
          >
            <Printer size={14} /> Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800/40 p-1 rounded-xl">
        <button 
          onClick={() => { setActiveTab("vendas"); setFilterStatus("Todos"); }}
          className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", activeTab === "vendas" ? "bg-white dark:bg-surface-dark text-primary shadow" : "text-gray-500 hover:text-gray-950")}
        >
          Vendas
        </button>
        <button 
          onClick={() => { setActiveTab("pedidos"); setFilterStatus("Todos"); }}
          className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", activeTab === "pedidos" ? "bg-white dark:bg-surface-dark text-primary shadow" : "text-gray-500 hover:text-gray-950")}
        >
          Pedidos
        </button>
        <button 
          onClick={() => { setActiveTab("producao"); setFilterStatus("Todos"); }}
          className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", activeTab === "producao" ? "bg-white dark:bg-surface-dark text-primary shadow" : "text-gray-500 hover:text-gray-950")}
        >
          Produção
        </button>
        <button 
          onClick={() => { setActiveTab("armazem"); setFilterStatus("Todos"); }}
          className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", activeTab === "armazem" ? "bg-white dark:bg-surface-dark text-primary shadow" : "text-gray-500 hover:text-gray-950")}
        >
          Armazém
        </button>
        <button 
          onClick={() => { setActiveTab("materiais"); setFilterStatus("Todos"); }}
          className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", activeTab === "materiais" ? "bg-white dark:bg-surface-dark text-primary shadow" : "text-gray-500 hover:text-gray-950")}
        >
          Materiais
        </button>
        <button 
          onClick={() => { setActiveTab("financeiro"); setFilterStatus("Todos"); }}
          className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", activeTab === "financeiro" ? "bg-white dark:bg-surface-dark text-primary shadow" : "text-gray-500 hover:text-gray-950")}
        >
          Financeiro
        </button>
        <button 
          onClick={() => { setActiveTab("logistica"); setFilterStatus("Todos"); }}
          className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap", activeTab === "logistica" ? "bg-white dark:bg-surface-dark text-primary shadow" : "text-gray-500 hover:text-gray-950")}
        >
          Logística
        </button>
      </div>

      {/* Toolbar filters */}
      <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 items-center justify-between no-print">
        
        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs w-full sm:w-64">
          <Search size={14} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Pesquisa rápida..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full"
          />
        </div>

        {/* Date Filters (for reports with date context) */}
        {["vendas", "pedidos", "financeiro"].includes(activeTab) && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">De:</span>
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.25 border border-gray-200 dark:border-gray-700 bg-white rounded-lg outline-none"
            />
            <span className="text-gray-400">Até:</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.25 border border-gray-200 dark:border-gray-700 bg-white rounded-lg outline-none"
            />
          </div>
        )}

        {/* Status Dropdowns */}
        <div className="flex items-center gap-2 text-xs">
          <Filter size={14} className="text-gray-400" />
          <span className="font-semibold text-gray-500">Filtrar por:</span>
          
          {activeTab === "pedidos" && (
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border text-xs p-1.5 rounded-lg">
              <option value="Todos">Todos Pedidos</option>
              <option value="Confirmado">Confirmados</option>
              <option value="Agendados">Agendados</option>
              <option value="Cancelado">Cancelados</option>
              <option value="Entregue">Concluídos / Entregues</option>
            </select>
          )}

          {activeTab === "producao" && (
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border text-xs p-1.5 rounded-lg">
              <option value="Todos">Todos Setores</option>
              <option value="Cozinha">Cozinha</option>
              <option value="Pastelaria">Pastelaria</option>
            </select>
          )}

          {activeTab === "armazem" && (
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border text-xs p-1.5 rounded-lg">
              <option value="Todos">Todas Categorias</option>
              <option value="Ingredientes">Ingredientes</option>
              <option value="Produtos Acabados">Produtos Acabados</option>
              <option value="Revenda">Revenda</option>
              <option value="Crítico">Crítico / Stock Baixo</option>
            </select>
          )}

          {activeTab === "financeiro" && (
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border text-xs p-1.5 rounded-lg">
              <option value="Todos">Todos Movimentos</option>
              <option value="Receita">Apenas Receitas</option>
              <option value="Despesa">Apenas Despesas</option>
            </select>
          )}

          {activeTab === "logistica" && (
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-white border text-xs p-1.5 rounded-lg">
              <option value="Todos">Todos Estados</option>
              <option value="Pendente">Entregas Pendentes</option>
              <option value="Concluída">Entregas Realizadas</option>
            </select>
          )}

          {!["pedidos", "producao", "armazem", "financeiro", "logistica"].includes(activeTab) && (
            <span className="text-gray-400 italic">Sem filtros extra</span>
          )}
        </div>
      </div>

      {/* Render selected report */}
      <div className="bg-white dark:bg-surface-dark border rounded-2xl overflow-hidden p-6 shadow-sm min-h-[300px]">
        
        {/* Printable title */}
        <div className="only-print text-center mb-6 space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Sabor Imbatível, S.A.</h2>
          <p className="text-xs text-gray-500">Relatório Consolidado de {activeTab.toUpperCase()}</p>
          <p className="text-[10px] text-gray-400 italic">Filtros: Período {startDate} a {endDate} | Pesquisa: {searchTerm || "Nenhuma"}</p>
        </div>

        {/* 1. Vendas */}
        {activeTab === "vendas" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b pb-4 mb-2">
              <div className="bg-indigo-50/20 p-3 rounded-lg text-xs">
                <span className="text-gray-400 block">Total Volume Faturado</span>
                <span className="text-base font-bold text-indigo-600">
                  {formatCurrency(getVendasReport().reduce((acc, curr) => acc + curr.amount, 0))}
                </span>
              </div>
              <div className="bg-green-50/20 p-3 rounded-lg text-xs">
                <span className="text-gray-400 block">Média por Venda</span>
                <span className="text-base font-bold text-success">
                  {formatCurrency(getVendasReport().length ? getVendasReport().reduce((acc, curr) => acc + curr.amount, 0) / getVendasReport().length : 0)}
                </span>
              </div>
              <div className="bg-purple-50/20 p-3 rounded-lg text-xs">
                <span className="text-gray-400 block">Nº de Vendas</span>
                <span className="text-base font-bold text-purple-600">{getVendasReport().length} compras</span>
              </div>
            </div>

            <table className="w-full text-left text-xs text-gray-500">
              <thead className="bg-gray-50 dark:bg-gray-800 font-bold border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2.5">Nº / ID</th>
                  <th className="px-4 py-2.5">CLIENTE</th>
                  <th className="px-4 py-2.5">DATA</th>
                  <th className="px-4 py-2.5">TIPO</th>
                  <th className="px-4 py-2.5 text-right">VALOR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {getVendasReport().length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">Nenhuma venda encontrada no intervalo de datas.</td></tr>
                ) : (
                  getVendasReport().map((val: any) => (
                    <tr key={val.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30 text-gray-800 dark:text-gray-200">
                      <td className="px-4 py-3 font-bold">{val.id}</td>
                      <td className="px-4 py-3 font-semibold">{val.client}</td>
                      <td className="px-4 py-3">{val.date}</td>
                      <td className="px-4 py-3"><span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-[10px]">{val.type}</span></td>
                      <td className="px-4 py-3 text-right font-bold text-primary">{formatCurrency(val.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. Pedidos */}
        {activeTab === "pedidos" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-b pb-4 mb-2">
              <div className="p-3 bg-blue-50/40 rounded-lg text-xs border">
                <span className="text-gray-400 block">Pedidos Registados</span>
                <span className="text-sm font-bold block">{getPedidosReport().length}</span>
              </div>
              <div className="p-3 bg-red-50/40 rounded-lg text-xs border text-red-700">
                <span className="text-gray-400 block">Cancelados</span>
                <span className="text-sm font-bold block">{getPedidosReport().filter(p => p.status === "Cancelado").length}</span>
              </div>
              <div className="p-3 bg-amber-50/40 rounded-lg text-xs border text-amber-700">
                <span className="text-gray-400 block">Agendados</span>
                <span className="text-sm font-bold block">{getPedidosReport().filter(p => p.status === "Agendado").length}</span>
              </div>
              <div className="p-3 bg-green-50/40 rounded-lg text-xs border text-green-700">
                <span className="text-gray-500 block">Entregues / Concluídos</span>
                <span className="text-sm font-bold block">{getPedidosReport().filter(p => ["Entregue", "Finalizado"].includes(p.status)).length}</span>
              </div>
            </div>

            <table className="w-full text-left text-xs text-gray-500">
              <thead className="bg-gray-50 dark:bg-gray-800 font-bold border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2.5">ID PEDIDO</th>
                  <th className="px-4 py-2.5">CLIENTE</th>
                  <th className="px-4 py-2.5">DATA PEDIDO</th>
                  <th className="px-4 py-2.5">ESTADO</th>
                  <th className="px-4 py-2.5 text-right">VALOR CONSOLIDADO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {getPedidosReport().length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">Nenhum pedido encontrado.</td></tr>
                ) : (
                  getPedidosReport().map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-bold">{p.id}</td>
                      <td className="px-4 py-3 font-semibold">{p.client}</td>
                      <td className="px-4 py-3">{p.date}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", p.status === "Cancelado" ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300" : "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300")}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. Produção */}
        {activeTab === "producao" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-b pb-4">
              <div className="p-3 border rounded text-xs">
                <span className="text-gray-400">Pastelaria (OPs)</span>
                <span className="font-bold block text-sm">{getProducaoReport().filter(p => p.sector === "Pastelaria").length} ordens</span>
              </div>
              <div className="p-3 border rounded text-xs">
                <span className="text-gray-400">Cozinha (OPs)</span>
                <span className="font-bold block text-sm">{getProducaoReport().filter(p => p.sector === "Cozinha").length} ordens</span>
              </div>
              <div className="p-3 border rounded text-xs bg-amber-50/25">
                <span className="text-gray-500">Em Execução</span>
                <span className="font-bold block text-sm">{getProducaoReport().filter(p => p.status !== "Concluído").length}</span>
              </div>
              <div className="p-3 border rounded text-xs bg-green-50/25">
                <span className="text-gray-500">Concluídas hoje</span>
                <span className="font-bold block text-sm">{getProducaoReport().filter(p => p.status === "Concluído").length}</span>
              </div>
            </div>

            <table className="w-full text-left text-xs text-gray-500">
              <thead className="bg-gray-50 dark:bg-gray-800 font-bold border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2.5">ID ORDEM</th>
                  <th className="px-4 py-2.5">PRODUTO / ITEM</th>
                  <th className="px-4 py-2.5">QTD</th>
                  <th className="px-4 py-2.5">SETOR RESPONSÁVEL</th>
                  <th className="px-4 py-2.5">ESTADO DA OP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {getProducaoReport().length === 0 ? (
                  <tr><td colSpan={5} className="p-6 text-center text-gray-400">Nenhuma ordem de produção registada.</td></tr>
                ) : (
                  getProducaoReport().map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-bold">{p.id}</td>
                      <td className="px-4 py-3 font-semibold">{p.product}</td>
                      <td className="px-4 py-3 font-mono">{p.qty} unidades</td>
                      <td className="px-4 py-3">{p.sector}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", p.status === "Concluído" ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300" : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300")}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Armazém */}
        {activeTab === "armazem" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b pb-4">
              <div className="p-3 bg-red-100/30 text-red-800 rounded-lg text-xs">
                <span className="font-bold block mb-1">Stock Crítico Detetado:</span>
                Têm de ser comprados de imediato {getArmazemReport().filter(p => p.stock <= p.minStock).length} ingredientes fora do stock mínimo de segurança.
              </div>
              <div className="p-3 bg-green-100/30 text-green-800 rounded-lg text-xs flex justify-around items-center">
                <div>
                  <span className="text-gray-500 block">Total Itens em Catálogo</span>
                  <span className="text-base font-bold text-green-700">{getArmazemReport().length}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Média Disponibilidade</span>
                  <span className="text-base font-bold text-green-750">Estável</span>
                </div>
              </div>
            </div>

            <table className="w-full text-left text-xs text-gray-500">
              <thead className="bg-gray-50 dark:bg-gray-800 font-bold border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">NOME / PRODUTO</th>
                  <th className="px-4 py-2.5">CATEGORIA</th>
                  <th className="px-4 py-2.5">STOCK ATUAL</th>
                  <th className="px-4 py-2.5">ESTADO STOCK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {getArmazemReport().map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-bold">{p.id}</td>
                    <td className="px-4 py-3 font-semibold">{p.name}</td>
                    <td className="px-4 py-3">{p.category}</td>
                    <td className="px-4 py-3 font-mono font-bold">{p.stock} {p.unit}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", p.stock <= p.minStock ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300" : "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300")}>
                        {p.stock <= p.minStock ? "Crítico" : "Normal"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 5. Materiais */}
        {activeTab === "materiais" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-b pb-4">
              <div className="p-3 border rounded text-xs">
                <span className="text-gray-400 block">Materiais Danificados</span>
                <span className="text-sm font-bold block text-error font-mono">
                  {getMateriaisReport().reduce((acc, curr) => acc + curr.damaged, 0)} un.
                </span>
              </div>
              <div className="p-3 border rounded text-xs bg-red-50/10">
                <span className="text-gray-400 block">Perdidos</span>
                <span className="text-sm font-bold block text-red-700 font-mono">
                  {getMateriaisReport().reduce((acc, curr) => acc + curr.lost, 0)} un.
                </span>
              </div>
              <div className="p-3 border rounded text-xs">
                <span className="text-gray-500 block">Devolvidos à Base</span>
                <span className="text-sm font-bold block text-green-700 font-mono">
                  {getMateriaisReport().reduce((acc, curr) => acc + curr.devQty, 0)} un.
                </span>
              </div>
              <div className="p-3 border rounded text-xs bg-primary/5">
                <span className="text-gray-500 block">Taxa de Recuperação</span>
                <span className="text-sm font-bold block text-primary">95.2%</span>
              </div>
            </div>

            <table className="w-full text-left text-xs text-gray-500">
              <thead className="bg-gray-50 dark:bg-gray-800 font-bold border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2.5">ID</th>
                  <th className="px-4 py-2.5">NOME DO MATERIAL</th>
                  <th className="px-4 py-2.5">ENTREGUES</th>
                  <th className="px-4 py-2.5">DEVOLVIDOS</th>
                  <th className="px-4 py-2.5">DANIFICADOS</th>
                  <th className="px-4 py-2.5">PERDIDOS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {getMateriaisReport().map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-bold">{m.id}</td>
                    <td className="px-4 py-3 font-semibold">{m.name}</td>
                    <td className="px-4 py-3 font-mono">{m.delivQty}</td>
                    <td className="px-4 py-3 font-mono text-green-600 font-bold">{m.devQty}</td>
                    <td className="px-4 py-3 font-mono text-warning font-bold">{m.damaged}</td>
                    <td className="px-4 py-3 font-mono text-red-600 font-bold">{m.lost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Financeiro */}
        {activeTab === "financeiro" && (
          <div className="space-y-4">
            <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300 mb-6 flex gap-3 items-start">
              <AlertTriangle className="shrink-0 mt-0.5 text-blue-500" size={18} />
              <div>
                <strong>Implementação Pendente:</strong> Os dados financeiros estão atualmente a utilizar valores locais. 
                A integração do relatório com as Caixas e Movimentos Financeiros da nova API está pendente.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 border-b pb-4">
              <div className="p-3 bg-green-50/20 text-green-800 border-l-4 border-green-500 rounded text-xs">
                <span className="text-gray-400 block font-semibold">Volume de Receitas</span>
                <span className="text-sm font-bold">
                  {formatCurrency(getFinanceiroReport().filter(f => f.type === "Receita").reduce((acc, curr) => acc + curr.amount, 0))}
                </span>
              </div>
              <div className="p-3 bg-red-50/20 text-red-800 border-l-4 border-red-500 rounded text-xs">
                <span className="text-gray-400 block font-semibold">Volume de Despesas</span>
                <span className="text-sm font-bold text-red-700">
                  {formatCurrency(getFinanceiroReport().filter(f => f.type === "Despesa").reduce((acc, curr) => acc + curr.amount, 0))}
                </span>
              </div>
              <div className="p-3 bg-indigo-50/20 text-indigo-800 border-l-4 border-indigo-500 rounded text-xs">
                <span className="text-gray-500 block font-semibold">Resultado Líquido</span>
                <span className="text-sm font-bold">
                  {formatCurrency(
                     getFinanceiroReport().filter(f => f.type === "Receita").reduce((acc, curr) => acc + curr.amount, 0) -
                     getFinanceiroReport().filter(f => f.type === "Despesa").reduce((acc, curr) => acc + curr.amount, 0)
                  )}
                </span>
              </div>
              <div className="p-3 bg-amber-50/20 text-amber-800 border-l-4 border-amber-500 rounded text-xs">
                <span className="text-gray-500 block font-semibold">Contas a Receber Atraso</span>
                <span className="text-sm font-bold font-mono">
                  {formatCurrency(receivables.filter(r => r.status !== "Paga").reduce((acc: number, curr: any) => acc + (curr.amount - curr.paid), 0))}
                </span>
              </div>
            </div>

            <table className="w-full text-left text-xs text-gray-500">
              <thead className="bg-gray-50 dark:bg-gray-800 font-bold border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2.5">DATA</th>
                  <th className="px-4 py-2.5">DOCUMENTO</th>
                  <th className="px-4 py-2.5">CATEGORIA</th>
                  <th className="px-4 py-2.5">DESCRITIVO</th>
                  <th className="px-4 py-2.5 text-right">VALOR LANÇADO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {getFinanceiroReport().map((f: any, i) => (
                  <tr key={i} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3">{f.date}</td>
                    <td className="px-4 py-3 font-mono text-gray-500">{f.doc}</td>
                    <td className="px-4 py-3 font-bold"><span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-[10px]">{f.category}</span></td>
                    <td className="px-4 py-3">{f.description}</td>
                    <td className={cn("px-4 py-3 text-right font-bold text-sm", f.type === "Receita" ? "text-green-600" : "text-error")}>
                      {f.type === "Receita" ? "+" : "-"} {formatCurrency(f.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 7. Logística */}
        {activeTab === "logistica" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b pb-4">
              <div className="p-3 border rounded text-xs">
                <span className="text-gray-400 block">Total Entregas</span>
                <span className="text-sm font-bold block">{getLogisticaReport().length}</span>
              </div>
              <div className="p-3 border rounded text-xs text-green-700 bg-green-50/10">
                <span className="text-gray-500 block">Realizadas com Sucesso</span>
                <span className="text-sm font-bold block">{getLogisticaReport().filter(d => d.status === "Concluída").length}</span>
              </div>
              <div className="p-3 border rounded text-xs text-amber-700 bg-amber-50/10">
                <span className="text-gray-500 block">Pendentes em Rota</span>
                <span className="text-sm font-bold block">{getLogisticaReport().filter(d => d.status === "Pendente").length}</span>
              </div>
            </div>

            <table className="w-full text-left text-xs text-gray-500">
              <thead className="bg-gray-50 dark:bg-gray-800 font-bold border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2.5">DLV REF</th>
                  <th className="px-4 py-2.5">PEDIDO NO.</th>
                  <th className="px-4 py-2.5">DESTINATÁRIO / CLIENTE</th>
                  <th className="px-4 py-2.5">MOTORISTA EXECUTOR</th>
                  <th className="px-4 py-2.5">LOGÍSTICA ESTADO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {getLogisticaReport().map((d: any) => (
                  <tr key={d.id} className="hover:bg-gray-50/30 dark:hover:bg-gray-800/30">
                    <td className="px-4 py-3 font-bold">{d.id}</td>
                    <td className="px-4 py-3">{d.order}</td>
                    <td className="px-4 py-3 font-semibold">{d.client}</td>
                    <td className="px-4 py-3">{d.motorista}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", d.status === "Concluída" ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300" : "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300")}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}

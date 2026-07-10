import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService, clientService, productService, materialService } from "../services";
import { useComercial } from '../hooks';
import { TipoProduto } from '../enums';
import { Plus, Search, Calendar, ChevronRight, FileText, Clock, Trash2, X, AlertCircle, ShoppingCart, UserPlus, CreditCard, ChevronLeft } from "lucide-react";
import { formatCurrency, cn } from "../lib/utils";
import { OrderStatus } from "../types";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import OrderDetailsModal from "../components/OrderDetailsModal";
import { useAuth } from "../components/AuthContext";

export default function Orders() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<string>("Agendados");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const queryClient = useQueryClient();
  const { checkoutPedido } = useComercial();

  // Dialog state for order creation assistant
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isQuickClient, setIsQuickClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [orderType, setOrderType] = useState<string>("Simples");
  const [orderDueDate, setOrderDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [orderDueTime, setOrderDueTime] = useState("12:00");
  const [orderNotes, setOrderNotes] = useState("");
  
  // Cart for items
  const [cart, setCart] = useState<any[]>([]);
  const [paymentOption, setPaymentOption] = useState<"Sem Pagamento" | "Pagamento Parcial" | "Pagamento Total">("Sem Pagamento");
  const [valPagoInput, setValPagoInput] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [codigoTransferencia, setCodigoTransferencia] = useState("");
  const [emissor, setEmissor] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ["orders", searchTerm],
    queryFn: () => orderService.getAll({ search: searchTerm }),
  });

  const { data: clientsResponse } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientService.getAll({ per_page: 1000 }),
  });

  const { data: productsResponse } = useQuery({
    queryKey: ["products"],
    queryFn: () => productService.getAll({ per_page: 1000 }),
  });

  const { data: materialsResponse } = useQuery({
    queryKey: ["materials"],
    queryFn: () => materialService.getAll({ per_page: 1000 }),
  });

  const orders = ordersResponse?.items || [];
  const clients = clientsResponse?.items || [];
  const products = (productsResponse?.items || []).filter((p: any) => {
    const pTipo = p.tipo || '';
    return pTipo !== TipoProduto.CONSUMIVEL && pTipo !== 'Consumível' && pTipo !== 'Consumivel';
  });
  const materials = materialsResponse?.items || [];

  // Combine products & materials for selection
  const combinableItems = [
    ...products.map(p => ({ ...p, uniqueId: `p-${p.id}`, isMaterial: false, category: p.categoria || "Produto" })),
    ...materials.map(m => ({ ...m, uniqueId: `m-${m.id}`, isMaterial: true, name: m.nome, salePrice: Number(m.valor_unitario || 1000), category: m.categoria || "Material" }))
  ];

  const updateMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string | number; estado: string }) =>
      orderService.updateEstado(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Estado do pedido atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar estado do pedido.");
    }
  });

  const clientCreateMutation = useMutation({
    mutationFn: (client: any) => clientService.create(client),
  });

  const createMutation = useMutation({
    mutationFn: (order: any) => orderService.create(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido gerado com sucesso!");
      setIsWizardOpen(false);
      resetWizard();
    },
    onError: () => {
      toast.error("Erro ao gerar pedido.");
    }
  });

  const resetWizard = () => {
    setWizardStep(1);
    setIsQuickClient(false);
    setNewClientName("");
    setNewClientPhone("");
    setNewClientAddress("");
    setSelectedClientId("");
    setOrderType("Simples");
    setCart([]);
    setValPagoInput(0);
    setPaymentOption("Sem Pagamento");
    setCodigoTransferencia("");
    setEmissor("");
    setOrderNotes("");
  };

  const handleCreateOrderClick = () => {
    const isAuthorized = user?.role === "Administrador" || user?.role === "Atendimento";
    if (!isAuthorized) {
      toast.error("Apenas utilizadores com perfil Administrador ou Atendimento podem criar pedidos.");
      return;
    }
    resetWizard();
    setIsWizardOpen(true);
  };

  const calculateSubtotal = () => {
    return cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);
  };

  const calculateTotalDisc = () => {
    return cart.reduce((acc, curr) => acc + (curr.discount || 0), 0);
  };

  const calculateTotalFinal = () => {
    return Math.max(0, calculateSubtotal() - calculateTotalDisc());
  };

  const submitWizard = async () => {
    setIsSubmitting(true);
    try {
      let finalClientId = selectedClientId;

      if (isQuickClient) {
        if (!newClientName) {
          toast.error("Insira o nome do novo cliente.");
          setIsSubmitting(false);
          return;
        }
        const createdClient: any = await clientCreateMutation.mutateAsync({
          nome: newClientName,
          telefone: newClientPhone,
          morada: newClientAddress,
        });
        finalClientId = createdClient.id;
        toast.success(`Cliente ${newClientName} criado com sucesso.`);
      }

      if (!finalClientId && clients.length > 0) {
        finalClientId = String(clients[0].id);
      }

      const totalFinal = calculateTotalFinal();
      let vPaid = 0;
      if (paymentOption === "Pagamento Total") vPaid = totalFinal;
      else if (paymentOption === "Pagamento Parcial") vPaid = valPagoInput;

      if (paymentOption !== "Sem Pagamento" && (paymentMethod === "Transferência" || paymentMethod === "TPA / POS")) {
        if (!codigoTransferencia.trim()) {
          toast.error("O código de transferência / transação é obrigatório.");
          setIsSubmitting(false);
          return;
        }
        if (!emissor.trim()) {
          toast.error("O emissor / titular do banco é obrigatório.");
          setIsSubmitting(false);
          return;
        }
      }

      // Build a strictly valid order creation payload
      const orderPayload = {
        cliente_id: finalClientId ? Number(finalClientId) : null,
        tipo: orderType === "Composto" ? "Composto" : "Simples",
        origem: "Balcao",
        data_entrega: orderDueDate,
        hora_entrega: `${orderDueTime}:00`, // Ensure HH:MM:SS format
        estado: "Pendente",
        observacoes: orderNotes,
        itens: cart.map(item => {
          let tipoItem = "PRODUTO";
          const cat = String(item.category || item.categoria || "").toLowerCase();
          if (cat.includes("servi") || cat.includes("servic")) {
            tipoItem = "Servico";
          }

          const produtoId = isNaN(Number(item.id)) ? null : Number(item.id);

          return {
            tipo_item: tipoItem === "PRODUTO" ? "Produto" : tipoItem,
            produto_id: produtoId,
            descricao: item.name || item.nome || "Item de Pedido",
            quantidade: Number(item.qty),
            preco_unitario: Number(item.price)
          };
        })
      };

      // Create the order first
      const createdOrder: any = await orderService.create(orderPayload);
      
      // If payment is registered, checkout immediately
      if (paymentOption !== "Sem Pagamento" && vPaid > 0) {
        const paymentMethodId = paymentMethod === 'Transferência' ? 2 : (paymentMethod === 'TPA / POS' ? 3 : 1);
        await orderService.checkoutPedido(createdOrder.id, {
          forma_pagamento_id: paymentMethodId,
          valor: vPaid,
          codigo_transferencia: paymentMethod !== 'Dinheiro' ? codigoTransferencia : null,
          emissor: paymentMethod !== 'Dinheiro' ? emissor : null,
          observacoes: `Pagamento inicial no registo do pedido (${paymentMethod})`
        });
      }

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Pedido gerado com sucesso!");
      setIsWizardOpen(false);
      resetWizard();
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.response?.data?.msg || err?.message || "Erro desconhecido";
      toast.error(`Erro ao processar criação de pedido: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addToCartIndex = (item: any) => {
    const exists = cart.find(i => i.uniqueId === item.uniqueId);
    if (exists) {
      setCart(cart.map(i => i.uniqueId === item.uniqueId ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setCart([...cart, {
        ...item,
        qty: 1,
        price: item.salePrice || Number(item.preco_venda || 1000),
        discount: 0,
        notes: ""
      }]);
    }
    toast.success(`${item.name || item.nome} adicionado ao pedido.`);
  };

  const removeFromCart = (uniqueId: string) => {
    setCart(cart.filter(i => i.uniqueId !== uniqueId));
  };

  const updateCartItem = (uniqueId: string, fields: any) => {
    setCart(cart.map(item => item.uniqueId === uniqueId ? { ...item, ...fields } : item));
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500">A carregar pedidos...</div>
    );
  }

  const getClientName = (clientId: string | number) => {
    return (
      clients?.find((c: any) => String(c.id) === String(clientId))?.nome ||
      "Cliente ao Balcão"
    );
  };

  const estadoMap: Record<string, string[]> = {
    "Agendados": ["Pendente", "Agendado"],
    "Confirmados": ["Confirmado"],
    "Produção": ["Em Producao", "Em Produção"],
    "Prontos": ["Pronto"],
    "Concluídos": ["Em Entrega", "Entregue", "Concluido", "Concluído"],
    "Cancelados": ["Cancelado"],
  };

  const visibleOrders = orders?.filter((o: any) => {
    const matchesSearch = getClientName(o.clientId || o.cliente_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(o.numero || o.id).toLowerCase().includes(searchTerm.toLowerCase());
    
    const mappedStatuses = estadoMap[activeTab] || [];
    const matchesStatus = mappedStatuses.includes(o.estado || o.status);
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleUpdateStatus = (id: string, currentStatus: string) => {
    updateMutation.mutate({ id, estado: currentStatus }, {
      onSuccess: () => {
        toast.success(`Estado do pedido #${id} atualizado para ${currentStatus}!`);
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12" id="orders-page-root">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Gestão de Pedidos
        </h1>
        <button
          onClick={handleCreateOrderClick}
          className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
          id="btn-novopedido"
        >
          <Plus size={18} />
          Novo Pedido
        </button>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {Object.keys(estadoMap).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all",
              activeTab === tab 
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-md" 
                : "bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 px-4 py-3 rounded-xl flex-1 min-w-[200px] shadow-sm">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar pedido ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none ml-3 w-full text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Grid List for Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleOrders.length === 0 ? (
          <div className="col-span-full py-12 text-center text-gray-500 bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 border-dashed">
            <FileText size={48} className="mx-auto mb-4 opacity-20" />
            Nenhum pedido encontrado na aba {activeTab}.
          </div>
        ) : (
          visibleOrders.map((order: any) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 p-5 rounded-xl text-left hover:border-primary/50 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-lg text-gray-900 dark:text-white uppercase tracking-tight">#{order.numero || order.id}</span>
                  <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", (order.tipo || order.type) === 'Composto' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400')}>
                    {order.tipo || order.type}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">
                  {getClientName(order.clientId || order.cliente_id)}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-2">
                   <Clock size={14} />
                   {new Date(order.dueDate || order.data_entrega || order.data_pedido).toLocaleDateString("pt-ST", { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' })}
                </div>
              </div>
              <div className="mt-5 flex items-end justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Valor Total</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(order.total || order.valor_total)}</p>
                </div>
                <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2 bg-primary/10 rounded-full">
                   <ChevronRight size={18} />
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      <OrderDetailsModal 
        isOpen={!!selectedOrder}
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* ROL / WIZARD ASSISTANCE MODAL FOR ORDER CREATION */}
      {isWizardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in" id="wizard-modal-container">
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/20">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShoppingCart className="text-primary" /> Assistant de Criação de Pedidos
                </h2>
                <p className="text-xs text-gray-500 mt-1">Configure clientes, itens, agendamento e pagamento de forma integrada.</p>
              </div>
              <button onClick={() => setIsWizardOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors p-2 rounded-lg bg-white dark:bg-gray-800 shadow border border-gray-200">
                <X size={18} />
              </button>
            </div>

            {/* Steps bar */}
            <div className="flex border-b border-gray-200 dark:border-gray-800 py-3 bg-gray-50/50 justify-around text-xs font-bold text-gray-500">
              <span className={cn("px-4 py-1.5 rounded-full transition-all", wizardStep === 1 ? "bg-primary text-white shadow shadow-primary/20" : "text-gray-400")}>1. Cliente e Tipo</span>
              <span className={cn("px-4 py-1.5 rounded-full transition-all", wizardStep === 2 ? "bg-primary text-white shadow shadow-primary/20" : "text-gray-400")}>2. Seleção de Itens ({cart.length})</span>
              <span className={cn("px-4 py-1.5 rounded-full transition-all", wizardStep === 3 ? "bg-primary text-white shadow shadow-primary/20" : "text-gray-400")}>3. Pagamento e Conclusão</span>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* STEP 1 */}
              {wizardStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-800/20 p-5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><UserPlus size={16} className="text-primary" /> Dados do Cliente</h3>
                      <button 
                        type="button" 
                        onClick={() => setIsQuickClient(!isQuickClient)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        {isQuickClient ? "Selecionar Cliente Existente" : "+ Criar Cliente Rápido"}
                      </button>
                    </div>

                    {!isQuickClient ? (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium">Pesquisar ou Selecionar Cliente</label>
                        <select 
                          value={selectedClientId} 
                          onChange={(e) => setSelectedClientId(e.target.value)}
                          className="w-full bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
                        >
                          <option value="">-- Escolher Cliente --</option>
                          {clients.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.nome || c.name} {c.telefone ? `(${c.telefone})` : ""}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-500">Nome do Cliente *</label>
                          <input 
                            type="text" 
                            value={newClientName}
                            onChange={(e) => setNewClientName(e.target.value)}
                            placeholder="Ex: Maria Santos"
                            className="w-full bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-500">Telefone / WhatsApp</label>
                          <input 
                            type="text" 
                            value={newClientPhone}
                            onChange={(e) => setNewClientPhone(e.target.value)}
                            placeholder="Ex: 923 000 000"
                            className="w-full bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-500">Endereço de Entrega</label>
                          <input 
                            type="text" 
                            value={newClientAddress}
                            onChange={(e) => setNewClientAddress(e.target.value)}
                            placeholder="Ex: Morro Bento, Luanda"
                            className="w-full bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800/20 p-5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                      <h3 className="font-bold text-gray-900 dark:text-white">Tipo de Pedido</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          type="button" 
                          onClick={() => setOrderType("Simples")}
                          className={cn("p-3 rounded-lg border text-sm font-bold shadow-sm transition-all", orderType === "Simples" ? "bg-primary/10 border-primary text-primary" : "bg-white border-gray-200")}
                        >
                          Pedido Simples
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setOrderType("Composto")}
                          className={cn("p-3 rounded-lg border text-sm font-bold shadow-sm transition-all", orderType === "Composto" ? "bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-400" : "bg-white border-gray-200")}
                        >
                          Pedido Composto
                        </button>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        {orderType === "Simples" ? "Destinado a vendas balcão rápidas de produtos prontos ou takeaway." : "Permite incorporar espaços, materiais de aluguer, serviços, bebidas e logística sincronizados."}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/20 p-5 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4">
                      <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><Calendar size={16} className="text-primary" /> Agendamento e Entrega</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-gray-500">Data de Entrega</label>
                          <input 
                            type="date" 
                            value={orderDueDate}
                            onChange={(e) => setOrderDueDate(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-gray-500">Hora de Entrega</label>
                          <input 
                            type="time" 
                            value={orderDueTime}
                            onChange={(e) => setOrderDueTime(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {wizardStep === 2 && (
                <div className="space-y-6">
                  {/* Selector of products */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 border-r border-gray-200 dark:border-gray-800 pr-0 md:pr-4 h-[400px] overflow-y-auto space-y-3">
                      <h4 className="text-sm font-bold text-gray-500 sticky top-0 bg-white dark:bg-surface-dark pb-2">Pesquisa e Seleção rápida</h4>
                      {combinableItems.map((item: any) => (
                        <button
                          key={item.uniqueId}
                          type="button"
                          onClick={() => addToCartIndex(item)}
                          className="w-full text-left p-3 border border-gray-100 hover:border-primary rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all flex flex-col gap-1 text-xs"
                        >
                          <span className="font-bold text-gray-900 dark:text-white leading-snug">{item.name || item.nome}</span>
                          <div className="flex justify-between items-center text-gray-500 mt-1">
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded dark:bg-gray-800">{item.category}</span>
                            <span className="font-semibold text-primary">{formatCurrency(item.salePrice || Number(item.preco_venda || 0))}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Cart item table list */}
                    <div className="md:col-span-2 space-y-4">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Carrinho do Pedido ({cart.length} itens)</h4>
                      {cart.length === 0 ? (
                        <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl text-center text-gray-400">
                          <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                          Selecione produtos ou materiais ao lado para carregar no pedido composto.
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                          {cart.map((item) => (
                            <div key={item.uniqueId} className="p-4 bg-gray-50 dark:bg-gray-800/10 border border-gray-100 dark:border-gray-800 rounded-xl space-y-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-bold text-sm text-gray-900 dark:text-white">{item.name || item.nome}</span>
                                  <span className="ml-2 text-[10px] uppercase font-bold text-gray-400 tracking-wider">({item.category})</span>
                                </div>
                                <button type="button" onClick={() => removeFromCart(item.uniqueId)} className="text-gray-400 hover:text-error">
                                  <Trash2 size={16} />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                <div className="space-y-1">
                                  <label className="text-gray-400 block font-medium">Preço Unitário</label>
                                  <input 
                                    type="number" 
                                    value={item.price}
                                    onChange={(e) => updateCartItem(item.uniqueId, { price: Number(e.target.value) })}
                                    className="w-full bg-white dark:bg-gray-800 px-2 py-1 border rounded"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-gray-400 block font-medium">Quantidade</label>
                                  <input 
                                    type="number" 
                                    min="1"
                                    value={item.qty}
                                    onChange={(e) => updateCartItem(item.uniqueId, { qty: Number(e.target.value) })}
                                    className="w-full bg-white dark:bg-gray-800 px-2 py-1 border rounded font-semibold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-gray-400 block font-medium">Desconto (STD)</label>
                                  <input 
                                    type="number" 
                                    min="0"
                                    value={item.discount}
                                    onChange={(e) => updateCartItem(item.uniqueId, { discount: Number(e.target.value) })}
                                    className="w-full bg-white dark:bg-gray-800 px-2 py-1 border rounded"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-gray-400 block font-medium">Subtotal</label>
                                  <span className="font-bold text-sm text-primary block mt-1">
                                    {formatCurrency((item.price * item.qty) - (item.discount || 0))}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {wizardStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left stats summary */}
                  <div className="md:col-span-1 bg-gray-50 dark:bg-gray-800/20 p-5 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white mb-4">Resumo Consolidado</h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subtotal de Itens</span>
                          <span className="font-semibold">{formatCurrency(calculateSubtotal())}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Descontos Aplicados</span>
                          <span className="text-error font-semibold">- {formatCurrency(calculateTotalDisc())}</span>
                        </div>
                        <hr className="border-gray-200 dark:border-gray-800 my-2" />
                        <div className="flex justify-between text-base font-bold">
                          <span>Total Geral</span>
                          <span className="text-primary">{formatCurrency(calculateTotalFinal())}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment controls */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5"><CreditCard size={18} className="text-primary" /> Registo de Pagamento</h3>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {["Sem Pagamento", "Pagamento Parcial", "Pagamento Total"].map((opt: any) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setPaymentOption(opt)}
                          className={cn("p-3 rounded-lg border text-xs font-bold shadow-sm transition-all", paymentOption === opt ? "bg-primary/10 border-primary text-primary" : "bg-white border-gray-200")}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>

                    {paymentOption === "Pagamento Parcial" && (
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-500">Valor Pago Adiantado (STD) *</label>
                        <input 
                          type="number" 
                          min="1"
                          max={calculateTotalFinal()}
                          value={valPagoInput}
                          onChange={(e) => setValPagoInput(Number(e.target.value))}
                          className="bg-white border text-sm rounded px-3 py-2 w-full font-bold focus:border-primary outline-none"
                        />
                      </div>
                    )}

                    {paymentOption !== "Sem Pagamento" && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-500">Método de Liquidação</label>
                            <select
                              value={paymentMethod}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="w-full bg-white dark:bg-gray-800 border rounded p-2 text-xs"
                            >
                              <option value="Dinheiro">Dinheiro</option>
                              <option value="TPA / POS">TPA / POS</option>
                              <option value="Transferência">Transferência Bancária</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-400">Saldo Pendente</label>
                            <span className="text-base font-bold block mt-1.5 text-error">
                              {formatCurrency(calculateTotalFinal() - (paymentOption === "Pagamento Total" ? calculateTotalFinal() : (paymentOption === "Pagamento Parcial" ? valPagoInput : 0)))}
                            </span>
                          </div>
                        </div>

                        {(paymentMethod === "Transferência" || paymentMethod === "TPA / POS") && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-800">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase">Comprovativo / Código TRX *</label>
                              <input
                                type="text"
                                value={codigoTransferencia}
                                onChange={(e) => setCodigoTransferencia(e.target.value)}
                                className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1.5 font-medium"
                                placeholder="Ex: TRX123456"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase">Emissor / Titular Banco *</label>
                              <input
                                type="text"
                                value={emissor}
                                onChange={(e) => setEmissor(e.target.value)}
                                className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1.5 font-medium"
                                placeholder="Ex: Manuel Silva (Millennium)"
                                required
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-500">Notas / Observações Gerais do Pedido</label>
                      <textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Ex: Entrega na recepção, necessita de toalhas laranjas..."
                        rows={3}
                        className="w-full bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer buttons */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-surface-dark flex gap-3 justify-between shrink-0">
              
              {/* Back */}
              {wizardStep > 1 ? (
                <button 
                  type="button" 
                  onClick={() => setWizardStep(wizardStep - 1)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold border border-gray-200 bg-white hover:bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <ChevronLeft size={16} /> Voltar
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => setIsWizardOpen(false)}
                  className="px-4 py-2 text-sm font-bold border border-gray-200 bg-white hover:bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  Cancelar
                </button>
              )}

              {/* Next / Submit */}
              {wizardStep < 3 ? (
                <button 
                  type="button" 
                  onClick={() => {
                    if (wizardStep === 1 && !selectedClientId && !isQuickClient) {
                      toast.error("Por favor, selecione um cliente ou crie um.");
                      return;
                    }
                    if (wizardStep === 2 && cart.length === 0) {
                      toast.error("Adicione pelo menos um item ao pedido.");
                      return;
                    }
                    setWizardStep(wizardStep + 1);
                  }}
                  className="flex items-center gap-1.5 px-6 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/15"
                >
                  Avançar <ChevronRight size={16} />
                </button>
              ) : (
                <button 
                  type="button" 
                  disabled={isSubmitting}
                  onClick={submitWizard}
                  className="px-6 py-2 bg-success hover:bg-success/90 text-white text-sm font-bold rounded-xl shadow-lg shadow-success/15 disabled:opacity-50"
                >
                  {isSubmitting ? "A submeter..." : "Confirmar e Gerar Pedido"}
                </button>
              )}

            </div>

          </div>
        </div>
      )}

    </div>
  );
}

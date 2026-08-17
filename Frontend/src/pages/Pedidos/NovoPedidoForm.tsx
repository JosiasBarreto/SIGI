import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  productService,
  clientService,
  orderService,
  vendaService,
  financialService,
  proformaService,
  ProformaCreatePayload,
} from "../../services";
import {
  UserPlus,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  Bookmark,
  CreditCard,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { cn, formatCurrency } from "../../lib/utils";
import { toast } from "react-toastify";
import PedidoProductSelector from "./PedidoProductSelector";
import PedidoCartSummary from "./PedidoCartSummary";
import PedidoPaymentModal from "./PedidoPaymentModal";
import PedidoDraftsModal, { PedidoDraft } from "./PedidoDraftsModal";
import PedidoSuccessModal from "./PedidoSuccessModal";

interface NovoPedidoFormProps {
  onSuccessRedirect?: () => void;
}

export default function NovoPedidoForm({ onSuccessRedirect }: NovoPedidoFormProps) {
  const queryClient = useQueryClient();

  // Active cashier session
  const { data: caixasResponse } = useQuery({
    queryKey: ["caixas"],
    queryFn: () => financialService.getAll(),
  });
  const openCaixa =
    caixasResponse?.items?.find((c: any) => c.estado === "Aberto") || null;

  // Clients
  const { data: clientsResponse } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientService.getAll({ per_page: 5000 }),
  });

  // Products (Acabados e Revenda com ativo=true)
  const { data: productsResponse } = useQuery({
    queryKey: ["products-comerciais"],
    queryFn: () => productService.getProdutosComerciais({ per_page: 5000 }),
  });

  const clients = clientsResponse?.items || [];
  const products = productsResponse?.items || [];

  // Client states
  const [selectedClientId, setSelectedClientId] = useState("");
  const [isQuickClient, setIsQuickClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newClientAddress, setNewClientAddress] = useState("");

  // Order Details
  const [orderType, setOrderType] = useState<"Simples" | "Composto">("Simples");
  const [orderDueDate, setOrderDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [orderDueTime, setOrderDueTime] = useState("12:00");
  const [orderNotes, setOrderNotes] = useState("");

  // Cart
  const [cart, setCart] = useState<any[]>([]);
  const [manualDiscount, setManualDiscount] = useState<number>(0);

  // Payment states
  const [paymentOption, setPaymentOption] = useState<
    "Sem Pagamento" | "Pagamento Parcial" | "Pagamento Total"
  >("Sem Pagamento");
  const [valPagoInput, setValPagoInput] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [codigoTransferencia, setCodigoTransferencia] = useState("");
  const [emissor, setEmissor] = useState("");
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [valorCashMixto, setValorCashMixto] = useState<number>(0);
  const [valorPosMixto, setValorPosMixto] = useState<number>(0);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);

  // Drafts count state
  const [draftsCount, setDraftsCount] = useState(0);

  // Submission state & Result Modal
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);
  const [createdVenda, setCreatedVenda] = useState<any>(null);

  const clientCreateMutation = useMutation({
    mutationFn: (client: any) => clientService.create(client),
  });

  const selectedClientObj = clients.find(
    (c: any) => String(c.id) === String(selectedClientId)
  );
  const clientDiscountPercent = Number(
    selectedClientObj?.percentagem_desconto_padrao || 0
  );

  // Sync draft count on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("sigi_pedidos_drafts");
      if (saved) {
        const parsed = JSON.parse(saved);
        setDraftsCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch {
      setDraftsCount(0);
    }
  }, [isDraftsModalOpen]);

  // Cart helper functions
  const handleAddToCart = (product: any) => {
    const uniqueId = String(product.id);
    const existingIndex = cart.findIndex((i) => i.uniqueId === uniqueId);
    const price = Number(
      product.preco_venda_com_iva || product.salePrice || product.preco_venda || 0
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].qty += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          id: product.id,
          uniqueId,
          name: product.name || product.nome,
          category: product.categoria || product.category || "Produto",
          price,
          qty: 1,
          discount: 0,
          tipo: product.tipo || product.type || "ACABADO",
        },
      ]);
    }
  };

  const handleUpdateQty = (uniqueId: string, qty: number) => {
    setCart(cart.map((i) => (i.uniqueId === uniqueId ? { ...i, qty } : i)));
  };

  const handleUpdatePrice = (uniqueId: string, price: number) => {
    setCart(cart.map((i) => (i.uniqueId === uniqueId ? { ...i, price } : i)));
  };

  const handleUpdateDiscount = (uniqueId: string, discount: number) => {
    setCart(cart.map((i) => (i.uniqueId === uniqueId ? { ...i, discount } : i)));
  };

  const handleRemoveItem = (uniqueId: string) => {
    setCart(cart.filter((i) => i.uniqueId !== uniqueId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  // Calculations
  const grossSubtotalWithIva = cart.reduce(
    (acc, curr) => acc + Number(curr.price || 0) * Number(curr.qty || 1),
    0
  );
  const totalItemDiscounts = cart.reduce(
    (acc, curr) => acc + Number(curr.discount || 0),
    0
  );
  const clientDiscountVal =
    clientDiscountPercent > 0
      ? (grossSubtotalWithIva - totalItemDiscounts) * (clientDiscountPercent / 100)
      : 0;

  const totalDiscountsSum = totalItemDiscounts + clientDiscountVal + (manualDiscount || 0);

  const totalFinal = Math.max(0, grossSubtotalWithIva - totalDiscountsSum);

  const subtotalSemIva = totalFinal / 1.15;
  const totalIva15 = totalFinal - subtotalSemIva;

  // Restore draft handler
  const handleLoadDraft = (draft: PedidoDraft) => {
    if (draft.cart) setCart(draft.cart);
    if (draft.clientId) setSelectedClientId(draft.clientId);
    if (draft.orderType) setOrderType(draft.orderType);
    if (draft.orderNotes) setOrderNotes(draft.orderNotes);
  };

  // Build Payload Helper
  const prepareOrderPayload = async () => {
    let finalClientId = selectedClientId;

    if (isQuickClient) {
      if (!newClientName.trim()) {
        toast.error("Por favor, introduza o nome do novo cliente.");
        return null;
      }
      const createdClient: any = await clientCreateMutation.mutateAsync({
        nome: newClientName.trim(),
        telefone: newClientPhone.trim(),
        morada: newClientAddress.trim(),
      });
      finalClientId = String(createdClient.id);
      toast.success(`Cliente ${newClientName} registado com sucesso.`);
    }

    const cartTotalGross = cart.reduce(
      (acc, it) => acc + Number(it.price || 0) * Number(it.qty || 1),
      0
    );

    const orderPayload: any = {
      cliente_id: finalClientId ? Number(finalClientId) : undefined,
      tipo: orderType,
      origem: "Balcao",
      data_entrega: orderDueDate,
      hora_entrega: `${orderDueTime}:00`.substring(0, 8),
      estado: "Agendado",
      observacoes: orderNotes || undefined,
      valor_pago: 0,
      forma_pagamento: "Dinheiro",
      itens: cart.map((item) => {
        const cat = String(item.category || item.categoria || "").toLowerCase();
        const tipoItem = cat.includes("servi") ? "Servico" : "Produto";
        const itemGross = Number(item.price || 0) * Number(item.qty || 1);
        const itemLineDiscount = Number(item.discount || 0);

        let totalItemDiscount = itemLineDiscount;
        if (clientDiscountPercent > 0) {
          totalItemDiscount +=
            ((itemGross - itemLineDiscount) * clientDiscountPercent) / 100;
        }
        if (manualDiscount > 0 && cartTotalGross > 0) {
          totalItemDiscount += (manualDiscount * itemGross) / cartTotalGross;
        }

        return {
          tipo_item: tipoItem,
          produto_id: isNaN(Number(item.id)) ? undefined : Number(item.id),
          descricao: item.name || item.nome || "Item do Pedido",
          quantidade: Number(item.qty),
          preco_unitario: Number(item.price),
          desconto: Number(totalItemDiscount.toFixed(2)),
        };
      }),
    };

    return orderPayload;
  };

  // Generate Pro Forma Invoice Logic
  const handleGenerateProforma = async () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos ao pedido para emitir a Fatura Pró-Forma.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalClientId: number | null = null;
      if (isQuickClient && newClientName.trim()) {
        try {
          const createdClient = await clientService.create({
            nome: newClientName.trim(),
            telefone: newClientPhone.trim() || undefined,
            nif: newClientNif.trim() || undefined,
          });
          finalClientId = Number(createdClient.id);
        } catch {
          // Proceed if client creation fails
        }
      } else if (selectedClientId) {
        finalClientId = Number(selectedClientId);
      }

      const proformaPayload: ProformaCreatePayload = {
        cliente_id: finalClientId,
        pedido_id: null,
        evento_id: null,
        origem: "Balcao",
        observacoes: orderNotes || "Orçamento Fatura Pró-Forma",
        itens: cart.map((item) => {
          const cat = String(item.category || item.categoria || "").toLowerCase();
          const isServ = cat.includes("servi") || cat.includes("servic");
          return {
            item_tipo: isServ ? "Servico" : "Produto",
            item_id: isNaN(Number(item.id)) ? null : Number(item.id),
            descricao: item.name || item.nome || "Item do Pedido",
            quantidade: Number(item.qty || 1),
            preco_unitario: Number(item.price || 0),
            desconto: Number(item.discount || 0),
            taxa_iva: Number(item.taxa_iva ?? item.iva_taxa ?? item.iva ?? 15),
          };
        }),
      };

      const proformaRes = await proformaService.create(proformaPayload);

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      queryClient.invalidateQueries({ queryKey: ["proformas"] });

      toast.success(proformaRes.msg || "Fatura Pró-Forma criada com sucesso!");
      setCompletedOrder({
        id: proformaRes.id,
        numero: proformaRes.numero_documento || `PROFORMA 2026/${proformaRes.id}`,
        isProforma: true,
        cliente: selectedClientObj || (isQuickClient ? { nome: newClientName, telefone: newClientPhone } : null),
        total: proformaRes.total || totalCalculated,
      });
      setCreatedVenda({ ...proformaRes, isProforma: true });
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        err?.message ||
        "Erro ao emitir Fatura Pró-Forma.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Order & Process Payment Logic
  const handleSubmitOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!openCaixa) {
      toast.error(
        "Atenção: Não existe caixa aberto no momento. Abra o caixa para registar pagamentos."
      );
      return;
    }

    if (cart.length === 0) {
      toast.error("Adicione pelo menos um produto ao pedido antes de submeter.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = await prepareOrderPayload();
      if (!orderPayload) {
        setIsSubmitting(false);
        return;
      }

      // Check payments validation
      let valorEfetivoPago = 0;
      if (paymentOption === "Pagamento Total") valorEfetivoPago = totalFinal;
      else if (paymentOption === "Pagamento Parcial") valorEfetivoPago = valPagoInput;

      if (paymentOption !== "Sem Pagamento" && valorEfetivoPago > 0) {
        if (
          paymentMethod === "Transferência" ||
          paymentMethod === "TPA / POS" ||
          paymentMethod === "Mixto"
        ) {
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
      }

      // 1. Create order
      const createdOrder: any = await orderService.create(orderPayload);

      // 2. Perform checkout if customer paid up front or partially
      let vendaRes: any = null;
      if (paymentOption !== "Sem Pagamento" && valorEfetivoPago > 0) {
        const serverSaldo = Number(
          createdOrder.saldo ?? createdOrder.total ?? createdOrder.valor_total ?? totalFinal
        );

        let finalCheckoutValue =
          paymentOption === "Pagamento Total"
            ? serverSaldo
            : Math.min(valorEfetivoPago, serverSaldo);

        finalCheckoutValue = Number(finalCheckoutValue.toFixed(2));

        if (finalCheckoutValue > 0) {
          const paymentMethodId =
            paymentMethod === "Transferência"
              ? 2
              : paymentMethod === "TPA / POS"
              ? 3
              : 1;

          vendaRes = await orderService.checkoutPedido(createdOrder.id, {
            forma_pagamento_id: paymentMethodId,
            valor: finalCheckoutValue,
            codigo_transferencia:
              paymentMethod !== "Dinheiro" ? codigoTransferencia || null : null,
            emissor: paymentMethod !== "Dinheiro" ? emissor || null : null,
            observacoes: `Checkout no registo do pedido #${createdOrder.numero || createdOrder.id}`,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["caixas"] });

      toast.success("Pedido registado com sucesso!");
      setCompletedOrder({
        ...createdOrder,
        cliente: selectedClientObj || (isQuickClient ? { nome: newClientName } : null),
      });
      setCreatedVenda(vendaRes);
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      console.error(err);
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        err?.message ||
        "Erro ao registar o pedido.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCompletedOrder(null);
    setCreatedVenda(null);
    setCart([]);
    setSelectedClientId("");
    setIsQuickClient(false);
    setNewClientName("");
    setNewClientPhone("");
    setNewClientAddress("");
    setOrderType("Simples");
    setOrderNotes("");
    setPaymentOption("Sem Pagamento");
    setValPagoInput(0);
    setPaymentMethod("Dinheiro");
    setCodigoTransferencia("");
    setEmissor("");
    setAmountReceived(0);
    setManualDiscount(0);
    onSuccessRedirect?.();
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-28">
      {/* Client & Scheduling Top Card */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
            <UserPlus size={18} className="text-primary" />
            Identificação do Cliente e Agendamento
          </h3>
          <button
            type="button"
            onClick={() => setIsQuickClient(!isQuickClient)}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            {isQuickClient ? "Selecionar Existente" : "+ Registar Novo Cliente"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Client picker or creation */}
          <div className="space-y-3">
            {!isQuickClient ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                  Selecione o Cliente (Opcional)
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-900 dark:text-white outline-none focus:border-primary"
                >
                  <option value="">-- Cliente ao Balcão --</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.nome || c.name} {c.telefone ? `(${c.telefone})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Ex: Ana Silva"
                    className="w-full bg-white dark:bg-gray-800 border rounded-lg p-2 text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Telefone / Whats
                  </label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Ex: 923 000 000"
                    className="w-full bg-white dark:bg-gray-800 border rounded-lg p-2 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase">
                    Endereço
                  </label>
                  <input
                    type="text"
                    value={newClientAddress}
                    onChange={(e) => setNewClientAddress(e.target.value)}
                    placeholder="Ex: Talatona"
                    className="w-full bg-white dark:bg-gray-800 border rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Order Type Buttons */}
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                Tipo de Pedido
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("Simples")}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-xs font-bold transition-all",
                    orderType === "Simples"
                      ? "bg-primary text-white border-primary shadow-sm"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200"
                  )}
                >
                  Pedido Simples (Takeaway)
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("Composto")}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-xs font-bold transition-all",
                    orderType === "Composto"
                      ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200"
                  )}
                >
                  Pedido Composto (Espaço)
                </button>
              </div>
            </div>
          </div>

          {/* Right: Date & Delivery Settings */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block flex items-center gap-1">
                  <Calendar size={14} className="text-primary" /> Data de Entrega
                </label>
                <input
                  type="date"
                  value={orderDueDate}
                  onChange={(e) => setOrderDueDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block flex items-center gap-1">
                  <Clock size={14} className="text-primary" /> Hora Prevista
                </label>
                <input
                  type="time"
                  value={orderDueTime}
                  onChange={(e) => setOrderDueTime(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                Observações do Pedido
              </label>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="Ex: Embalagem para presente, entregar com cartão..."
                rows={2}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main 8/12 & 4/12 Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 8/12 - Product Catalog */}
        <div className="col-span-12 lg:col-span-8">
          <PedidoProductSelector
            products={products}
            cart={cart}
            onAddToCart={handleAddToCart}
          />
        </div>

        {/* Right Column: 4/12 - Cart Items & Summary */}
        <div className="col-span-12 lg:col-span-4">
          <PedidoCartSummary
            cart={cart}
            clientDiscountPercent={clientDiscountPercent}
            manualDiscount={manualDiscount}
            setManualDiscount={setManualDiscount}
            onUpdateQty={handleUpdateQty}
            onUpdateDiscount={handleUpdateDiscount}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
          />
        </div>
      </div>

      {/* Fixed Bottom Footer Bar */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 z-30 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 py-3 px-4 sm:px-8 shadow-2xl transition-all">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Financial Totals Breakdown */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center md:justify-start">
            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                Subtotal
              </span>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {formatCurrency(grossSubtotalWithIva)}
              </span>
            </div>

            {totalDiscountsSum > 0 && (
              <div>
                <span className="text-[10px] text-emerald-500 font-semibold uppercase block">
                  Descontos
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  - {formatCurrency(totalDiscountsSum)}
                </span>
              </div>
            )}

            <div>
              <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                IVA (15% Incl.)
              </span>
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                {formatCurrency(totalIva15)}
              </span>
            </div>

            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />

            <div>
              <span className="text-[10px] text-primary font-black uppercase tracking-wider block">
                TOTAL GERAL
              </span>
              <span className="text-xl sm:text-2xl font-black text-primary">
                {formatCurrency(totalFinal)}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={() => setIsDraftsModalOpen(true)}
              className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              title="Gerir rascunhos guardados"
            >
              <Bookmark size={15} className="text-amber-500" />
              <span>Rascunhos</span>
              {draftsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-extrabold rounded-full">
                  {draftsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              disabled={cart.length === 0 || isSubmitting}
              onClick={handleGenerateProforma}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <FileText size={15} />
              <span className="hidden sm:inline">Fatura Pro Forma</span>
              <span className="sm:hidden">Pro Forma</span>
            </button>

            <button
              type="button"
              disabled={cart.length === 0 || isSubmitting}
              onClick={() => setIsPaymentModalOpen(true)}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg shadow-primary/25 disabled:opacity-50"
            >
              <CreditCard size={16} />
              <span>IR PARA PAGAMENTO</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Payment Options Modal */}
      <PedidoPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalFinal={totalFinal}
        paymentOption={paymentOption}
        setPaymentOption={setPaymentOption}
        valPagoInput={valPagoInput}
        setValPagoInput={setValPagoInput}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        codigoTransferencia={codigoTransferencia}
        setCodigoTransferencia={setCodigoTransferencia}
        emissor={emissor}
        setEmissor={setEmissor}
        amountReceived={amountReceived}
        setAmountReceived={setAmountReceived}
        valorCashMixto={valorCashMixto}
        setValorCashMixto={setValorCashMixto}
        valorPosMixto={valorPosMixto}
        setValorPosMixto={setValorPosMixto}
        isSubmitting={isSubmitting}
        onConfirmOrder={() => handleSubmitOrder()}
        onGenerateProforma={handleGenerateProforma}
      />

      {/* Drafts Modal */}
      <PedidoDraftsModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        currentCart={cart}
        currentClientName={selectedClientObj?.nome || newClientName}
        currentClientId={selectedClientId}
        currentTotal={totalFinal}
        currentOrderType={orderType}
        currentOrderNotes={orderNotes}
        onLoadDraft={handleLoadDraft}
      />

      {/* Completion & Document PDF Modal */}
      {completedOrder && (
        <PedidoSuccessModal
          order={completedOrder}
          createdVenda={createdVenda}
          onClose={handleResetForm}
        />
      )}
    </div>
  );
}

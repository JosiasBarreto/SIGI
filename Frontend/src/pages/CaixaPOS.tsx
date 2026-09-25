import React, { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  productService,
  clientService,
  orderService,
  documentService,
  vendaService,
  proformaService,
  ProformaCreatePayload,
} from "../services";
import { useComercial } from "../hooks";
import {
  Search,
  CreditCard,
  Banknote,
  FileText,
  CheckCircle,
  Store,
  Lock,
  Unlock,
  Printer,
  Download,
  SlidersHorizontal,
  Bookmark,
  Trash2,
  ArrowRight,
  ArrowDownRight,
  ArrowUpRight,
  Filter,
  Check,
  Receipt,
  ShoppingCart,
  MessageSquare,
  Smartphone,
  Copy,
  ChefHat,
  ShoppingBag,
  PackageCheck,
  Send
} from "lucide-react";
import { formatCurrency, cn } from "../lib/utils";
import { toast } from "react-toastify";
import { notificationManager, externalNotificationService } from "../services/notifications";
import SearchableClientSelect from "../components/Common/SearchableClientSelect";
import ProductGrid from "./CaixaPOS/ProductGrid";
import CartList from "./CaixaPOS/CartList";
import { useCaixaCart } from "./CaixaPOS/useCaixaCart";
import { useCaixaSession } from "./CaixaPOS/useCaixaSession";
import CaixaSessionModals from "../components/CaixaSessionModals";
import StockWarningModal from "../components/POS/StockWarningModal";
import OrderReceiptModal from "../components/POS/OrderReceiptModal";
import CaixaAdvancedFilterModal from "./CaixaPOS/CaixaAdvancedFilterModal";
import CaixaDraftsModal, { CaixaDraft } from "./CaixaPOS/CaixaDraftsModal";
import CaixaPOSPaymentModal from "./CaixaPOS/CaixaPOSPaymentModal";
import CaixaCartModal from "./CaixaPOS/CaixaCartModal";
import PedidoSuccessModal from "./Pedidos/PedidoSuccessModal";

export default function CaixaPOS() {
  const { createVenda, checkoutPedido, enviarFatura } = useComercial();
  const config = JSON.parse(localStorage.getItem("sigi_config") || "{}");

  // Category Tab Selection
  const [activeCategory, setActiveCategory] = useState<string>("Revenda");

  // Fetch Products
  const { data: productsResponse } = useQuery({
    queryKey: ["products", activeCategory],
    queryFn: () => {
      const params: any = {
        per_page: 5000,
        include_iva: true,
        tipo: activeCategory,
      };
      if (activeCategory === "Revenda") {
        params.have_stock = true;
      }
      return productService.getAll(params);
    },
  });

  // Fetch Clients
  const { data: clientsResponse } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientService.getAll({ per_page: 1000 }),
  });

  // Sales & POS States
  const [selectedClient, setSelectedClient] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [tipoDocumento, setTipoDocumento] = useState<"FR" | "PROFORMA">("FR");
  const isProforma = tipoDocumento === "PROFORMA";
  const [step, setStep] = useState(1);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [showPriceWithIva] = useState(true);

  // Scheduled order options
  const [tipoPedido, setTipoPedido] = useState<"Imediato" | "Agendado">("Imediato");
  const [dataEntrega, setDataEntrega] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [codigoTransferencia, setCodigoTransferencia] = useState("");
  const [emissor, setEmissor] = useState("");
  const [valorCashMixto, setValorCashMixto] = useState(0);
  const [valorPosMixto, setValorPosMixto] = useState(0);

  // Advanced Filter Modal States
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState("");
  const [selectedFilterType, setSelectedFilterType] = useState("TODOS");
  const [onlyInStockFilter, setOnlyInStockFilter] = useState(false);
  const [minPriceFilter, setMinPriceFilter] = useState("");
  const [maxPriceFilter, setMaxPriceFilter] = useState("");
  const [sortByFilter, setSortByFilter] = useState("NOME_ASC");

  // Drafts Modal State
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [draftsCount, setDraftsCount] = useState(0);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Cart Table Modal State
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // Invoice sending & Receipt modal states
  const [createdVenda, setCreatedVenda] = useState<any>(null);
  const [completedOrderData, setCompletedOrderData] = useState<any>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [sendMethod, setSendMethod] = useState<"email" | "whatsapp">("email");
  const [sendContact, setSendContact] = useState("");
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [stockWarningOpen, setStockWarningOpen] = useState(false);
  const [stockWarningItems, setStockWarningItems] = useState<any[]>([]);
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [receiptDocData, setReceiptDocData] = useState<any>(null);

  const products = productsResponse?.items || [];
  const clients = clientsResponse?.items || [];
  const selectedClientObj = clients.find(
    (c: any) => String(c.id) === String(selectedClient)
  );
  const descontoClientePercent = Number(
    selectedClientObj?.percentagem_desconto_padrao || 0
  );

  const {
    cart,
    searchTerm,
    setSearchTerm,
    subtotal,
    Iva,
    descontoAutomatico,
    descontoManual,
    total,
    isOnlyRevendaCart,
    hasZeroStockItem,
    addToCart: handleAddToCart,
    updateQty,
    updateItemDiscount,
    removeItem,
    clearCart,
  } = useCaixaCart(products, descontoClientePercent);

  const {
    openCaixa,
    caixaId,
    isCaixaAberta,
    abrirMutation,
    fecharMutation,
    movimentoMutation,
  } = useCaixaSession();

  const [activeSessionModal, setActiveSessionModal] = useState<
    "abrir" | "fechar" | "sangria" | "reforco" | null
  >(null);

  // Update drafts count
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      const currentUser = userStr ? JSON.parse(userStr) : null;
      const userId = currentUser?.id || currentUser?.email || "anonymous";
      const saved = localStorage.getItem(`sigi_caixa_drafts_${userId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setDraftsCount(Array.isArray(parsed) ? parsed.length : 0);
      } else {
        setDraftsCount(0);
      }
    } catch {
      setDraftsCount(0);
    }
  }, [isDraftsModalOpen, cart]);

  // Extract all available product categories dynamically (excluding Consumivel & Abastecimento)
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p: any) => {
      const cat = p.category || p.categoria;
      const catLower = String(cat || "").toLowerCase();
      const tipoUpper = String(p.tipo || p.type || "").toUpperCase();
      if (
        cat &&
        tipoUpper !== "CONSUMIVEL" &&
        tipoUpper !== "ABASTECIMENTO" &&
        tipoUpper !== "MATERIA_PRIMA" &&
        !catLower.includes("consumivel") &&
        !catLower.includes("consumível") &&
        !catLower.includes("abastecimento") &&
        !catLower.includes("materia-prima") &&
        !catLower.includes("matéria-prima")
      ) {
        set.add(cat);
      }
    });
    return Array.from(set).sort();
  }, [products]);

  // Count active filters for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedFilterCategory) count++;
    if (selectedFilterType !== "TODOS") count++;
    if (onlyInStockFilter) count++;
    if (minPriceFilter) count++;
    if (maxPriceFilter) count++;
    if (sortByFilter !== "NOME_ASC") count++;
    return count;
  }, [
    selectedFilterCategory,
    selectedFilterType,
    onlyInStockFilter,
    minPriceFilter,
    maxPriceFilter,
    sortByFilter,
  ]);

  // Filter products list based on search, category tab, and filter modal criteria
  const filteredProducts = useMemo(() => {
    return products
      .filter((p: any) => {
        // 0. EXCLUDE Consumível, Abastecimento, Matéria-Prima from Caixa POS
        const pCatLower = String(p.category || p.categoria || p.tipo || "").toLowerCase();
        const pTipoUpper = String(p.tipo || p.type || "").toUpperCase();
        if (
          pTipoUpper === "CONSUMIVEL" ||
          pTipoUpper === "ABASTECIMENTO" ||
          pTipoUpper === "MATERIA_PRIMA" ||
          pCatLower.includes("consumivel") ||
          pCatLower.includes("consumível") ||
          pCatLower.includes("abastecimento") ||
          pCatLower.includes("materia-prima") ||
          pCatLower.includes("matéria-prima")
        ) {
          return false;
        }

        // 1. Global Search Term
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const name = String(p.name || p.nome || "").toLowerCase();
          const code = String(p.codigo || p.id || "").toLowerCase();
          const cat = String(p.category || p.categoria || "").toLowerCase();
          if (!name.includes(term) && !code.includes(term) && !cat.includes(term)) {
            return false;
          }
        }

        // 2. Active Sector/Tab Category
        if (activeCategory && activeCategory !== "TODOS") {
          const pCat = String(p.category || p.categoria || p.tipo || "").toLowerCase();
          const pTipo = String(p.tipo || p.type || "").toUpperCase();
          if (
            activeCategory === "Revenda" &&
            !pCat.includes("revenda") &&
            pTipo !== "REVENDA" &&
            !p.is_revenda
          ) {
            return false;
          }
        }

        // 3. Filter Modal Category
        if (selectedFilterCategory) {
          const cat = p.category || p.categoria;
          if (cat !== selectedFilterCategory) return false;
        }

        // 4. Filter Modal Product Type
        if (selectedFilterType && selectedFilterType !== "TODOS") {
          const tipoUpper = String(p.tipo || p.type || "").toUpperCase();
          if (selectedFilterType === "REVENDA" && tipoUpper !== "REVENDA" && !p.is_revenda)
            return false;
          if (selectedFilterType === "ACABADO" && tipoUpper !== "ACABADO") return false;
          if (selectedFilterType === "CONSUMIVEL" && tipoUpper !== "CONSUMIVEL") return false;
          if (selectedFilterType === "SERVICO" && tipoUpper !== "SERVICO") return false;
        }

        // 5. Stock Filter
        const stock = Number(p.stock_atual ?? p.quantity ?? p.stock ?? 0);
        if (onlyInStockFilter && stock <= 0) return false;

        // 6. Price Range Filter
        const price = Number(p.salePrice || p.preco_venda || 0);
        if (minPriceFilter && price < parseFloat(minPriceFilter)) return false;
        if (maxPriceFilter && price > parseFloat(maxPriceFilter)) return false;

        return true;
      })
      .sort((a: any, b: any) => {
        if (sortByFilter === "NOME_ASC") {
          return String(a.name || a.nome || "").localeCompare(String(b.name || b.nome || ""));
        }
        if (sortByFilter === "NOME_DESC") {
          return String(b.name || b.nome || "").localeCompare(String(a.name || a.nome || ""));
        }
        if (sortByFilter === "PRECO_ASC") {
          return Number(a.salePrice || a.preco_venda || 0) - Number(b.salePrice || b.preco_venda || 0);
        }
        if (sortByFilter === "PRECO_DESC") {
          return Number(b.salePrice || b.preco_venda || 0) - Number(a.salePrice || a.preco_venda || 0);
        }
        if (sortByFilter === "STOCK_DESC") {
          return Number(b.stock_atual ?? b.quantity ?? 0) - Number(a.stock_atual ?? a.quantity ?? 0);
        }
        return 0;
      });
  }, [
    products,
    searchTerm,
    activeCategory,
    selectedFilterCategory,
    selectedFilterType,
    onlyInStockFilter,
    minPriceFilter,
    maxPriceFilter,
    sortByFilter,
  ]);

  const handleResetFilters = () => {
    setSelectedFilterCategory("");
    setSelectedFilterType("TODOS");
    setOnlyInStockFilter(false);
    setMinPriceFilter("");
    setMaxPriceFilter("");
    setSortByFilter("NOME_ASC");
  };

  const handleAddToCartWrapper = (product: any) => {
    const stock = Number(product.stock_atual ?? product.stock ?? product.quantidade_atual ?? 0);
    const tipoUpper = String(product.tipo || product.type || "").toUpperCase();
    const isRevenda =
      tipoUpper === "REVENDA" || tipoUpper === "PRODUTO_REVENDA" || product.is_revenda === true;

    if (stock <= 0) {
      if (
        isRevenda &&
        (cart.length === 0 ||
          cart.every((it) => String(it.tipo || it.type || "").toUpperCase() === "REVENDA"))
      ) {
        toast.error(
          `O produto de revenda "${product.name || product.nome}" está sem stock e não pode ser encomendado.`
        );
        return;
      }

      setTipoPedido("Agendado");
      if (!dataEntrega) {
        const future = new Date(Date.now() + 3 * 3600 * 1000);
        const tzOffset = future.getTimezoneOffset() * 60000;
        const localISOTime = new Date(future.getTime() - tzOffset).toISOString().slice(0, 16);
        setDataEntrega(localISOTime);
      }

      if (!selectedClient) {
        toast.warn(
          `Produto "${product.name || product.nome}" sem stock selecionado. É OBRIGATÓRIO selecionar um Cliente no topo do carrinho!`,
          { autoClose: 6000 }
        );
      } else {
        toast.info(
          `Produto "${product.name || product.nome}" sem stock adicionado como Pedido de Produção (Agendado).`
        );
      }
    }

    handleAddToCart(product);
  };

  const handleOpenPaymentModal = () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos para continuar.");
      return;
    }

    if (isOnlyRevendaCart && hasZeroStockItem) {
      toast.error(
        "Produtos de revenda solteiros sem stock não podem ser encomendados. Reduza a quantidade ou adicione um produto de fabrico."
      );
      return;
    }

    if (hasZeroStockItem) {
      if (tipoPedido !== "Agendado") {
        setTipoPedido("Agendado");
        if (!dataEntrega) {
          const future = new Date(Date.now() + 3 * 3600 * 1000);
          const tzOffset = future.getTimezoneOffset() * 60000;
          const localISOTime = new Date(future.getTime() - tzOffset).toISOString().slice(0, 16);
          setDataEntrega(localISOTime);
        }
      }

      if (!selectedClient) {
        toast.error(
          "Para produtos sem stock (Pedido de Produção), é OBRIGATÓRIO selecionar um Cliente antes de avançar!"
        );
        return;
      }
    }

    setIsPaymentModalOpen(true);
  };

  const handleGerarProformaDirect = async () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos ao carrinho para gerar Pró-Forma.");
      return;
    }
    try {
      notificationManager.startOrderSession(undefined, 8000);
      const payload: ProformaCreatePayload = {
        cliente_id: selectedClient ? Number(selectedClient) : null,
        pedido_id: null,
        evento_id: null,
        origem: "POS",
        observacoes: "Orçamento emitido no Caixa POS",
        itens: cart.map((i) => {
          let tipoItem: 'Servico' | 'Produto' = "Produto";
          const cat = String(i.category || i.categoria || "").toLowerCase();
          if (cat.includes("servi") || cat.includes("servic")) {
            tipoItem = "Servico";
          }
          const preco = Number(i.preco_venda_com_iva || i.salePrice || i.preco_venda || 0);
          return {
            item_id: Number(i.id) || null,
            item_tipo: tipoItem,
            descricao: i.name || i.nome || "Item de Venda",
            preco_unitario: preco,
            quantidade: Number(i.qty || 1),
            desconto: Number(i.desconto_valor || 0),
            taxa_iva: Number(i.taxa_iva ?? (i as any).iva_taxa ?? (i as any).iva ?? 15),
          };
        }),
      };
      const res = await proformaService.create(payload);
      const proformaObj = {
        ...res,
        isProforma: true,
        id: res.id,
        numero: res.numero_documento || `PROFORMA/${res.id}`,
        total: res.total || total,
        cliente: selectedClientObj,
        itens: cart,
        forma_pagamento: "Orçamento / Pró-Forma",
      };
      setCreatedVenda(proformaObj);
      setCompletedOrderData(proformaObj);
      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao gerar Fatura Pró-Forma.");
    }
  };

  const confirmPayment = async () => {
    if (!isCaixaAberta || !caixaId) {
      toast.error("É necessário abrir uma caixa antes de realizar esta operação.");
      return;
    }

    const isAgendado = tipoPedido === "Agendado";

    if (isAgendado && !selectedClient) {
      toast.error("Para pedidos agendados, a seleção de um cliente é obrigatória.");
      return;
    }

    if (isAgendado && !dataEntrega) {
      toast.error("Selecione uma data e hora para a entrega.");
      return;
    }

    if (
      !isProforma &&
      (paymentMethod === "Transferência" ||
        paymentMethod === "TPA / POS" ||
        paymentMethod === "Mixto")
    ) {
      if (!codigoTransferencia.trim()) {
        toast.error("Código de transferência / comprovativo é obrigatório.");
        return;
      }
      if (!emissor.trim()) {
        toast.error("Emissor / Titular do banco é obrigatório.");
        return;
      }
    }

    const valorPagoNum = isProforma
      ? 0
      : isAgendado && valorPago !== ""
      ? parseFloat(valorPago)
      : total;

    if (
      !isProforma &&
      paymentMethod === "Mixto" &&
      Math.abs(valorCashMixto + valorPosMixto - valorPagoNum) > 0.01
    ) {
      toast.error("No pagamento misto, a soma de Dinheiro e POS deve ser igual ao valor a liquidar.");
      return;
    }

    const minimoDinheiroRecebido = paymentMethod === "Mixto" ? valorCashMixto : valorPagoNum;
    if (
      !isProforma &&
      (paymentMethod === "Dinheiro" || paymentMethod === "Mixto") &&
      amountReceived < minimoDinheiroRecebido
    ) {
      toast.error("Valor recebido insuficiente.");
      return;
    }

    try {
      notificationManager.startOrderSession(undefined, 8000);
      const paymentMethodId =
        paymentMethod === "Transferência" ? 2 : paymentMethod === "TPA / POS" ? 3 : 1;

      const pagamentos =
        valorPagoNum <= 0
          ? []
          : paymentMethod === "Mixto"
          ? [
              { forma_pagamento_id: 1, valor: valorCashMixto },
              {
                forma_pagamento_id: 3,
                valor: valorPosMixto,
                codigo_transferencia: codigoTransferencia || null,
                emissor: emissor || null,
              },
            ].filter((p) => p.valor > 0)
          : [
              {
                forma_pagamento_id: paymentMethodId,
                valor: valorPagoNum,
                codigo_transferencia:
                  paymentMethod !== "Dinheiro" ? codigoTransferencia || null : null,
                emissor: paymentMethod !== "Dinheiro" ? emissor || null : null,
              },
            ];

      const mapCartToVendaItens = () => {
        const cartTotalValue = cart.reduce(
          (acc, it) =>
            acc +
            Number(it.preco_venda_com_iva || it.salePrice || it.preco_venda || 0) * Number(it.qty),
          0
        );
        return cart.map((i) => {
          let tipoItem = "Produto";
          const cat = String(i.category || i.categoria || "").toLowerCase();
          if (cat.includes("servi") || cat.includes("servic")) {
            tipoItem = "Servico";
          }
          const preco = Number(i.preco_venda_com_iva || i.salePrice || i.preco_venda || 0);
          const itemId = Number(i.id);
          const quantidade = Number(i.qty);
          const grossItemTotal = preco * quantidade;

          const descValor = Number(i.desconto_valor || 0);
          const descTipo = i.desconto_tipo || "percentual";
          let itemSpecificDiscount = 0;
          if (descValor > 0) {
            if (descTipo === "percentual") {
              itemSpecificDiscount = grossItemTotal * (Math.min(100, Math.max(0, descValor)) / 100);
            } else {
              itemSpecificDiscount = Math.min(grossItemTotal, descValor);
            }
          }

          let totalDescontoItem = itemSpecificDiscount;
          if (descontoClientePercent > 0) {
            totalDescontoItem +=
              ((grossItemTotal - itemSpecificDiscount) * descontoClientePercent) / 100;
          }
          if (descontoManual > 0 && cartTotalValue > 0) {
            const proportionalRatio = grossItemTotal / cartTotalValue;
            totalDescontoItem += descontoManual * proportionalRatio;
          }
          return {
            item_id: itemId,
            item_tipo: tipoItem,
            descricao: i.name || i.nome || "Item de Venda",
            preco_unitario: preco,
            quantidade,
            desconto: totalDescontoItem,
          };
        });
      };

      const buildVendaPayload = (valorPagamento = valorPagoNum) => ({
        tipo_documento: tipoDocumento,
        cliente_id: selectedClient ? Number(selectedClient) : null,
        evento_id: null,
        observacoes: "Venda direta via POS",
        itens: mapCartToVendaItens(),
        pagamentos: valorPagamento > 0 ? pagamentos : [],
      });

      const d = new Date();
      const current_date = d.toISOString().split("T")[0];
      const current_time = d.toTimeString().split(" ")[0];

      const isEntregaHoje = !isAgendado || dataEntrega.split("T")[0] <= current_date;

      const orderPayload: any = {
        cliente_id: selectedClient ? Number(selectedClient) : undefined,
        tipo: "Simples",
        origem: "Balcao",
        data_entrega: isAgendado ? dataEntrega.split("T")[0] : current_date,
        hora_entrega: isAgendado
          ? `${dataEntrega.split("T")[1] || "12:00"}:00`.substring(0, 8)
          : current_time,
        estado: isEntregaHoje ? "Em Producao" : "Agendado",
        observacoes: `Pedido ${tipoPedido}. Caixa: #${caixaId}`,
        valor_pago: 0,
        forma_pagamento: "Dinheiro",
        itens: (() => {
          const cartTotalValue = cart.reduce(
            (acc, it) =>
              acc +
              Number(it.preco_venda_com_iva || it.salePrice || it.preco_venda || 0) * Number(it.qty),
            0
          );
          return cart.map((i) => {
            const preco = Number(i.preco_venda_com_iva || i.salePrice || i.preco_venda || 0);
            const quantidade = Number(i.qty);
            const grossItemTotal = preco * quantidade;

            const descValor = Number(i.desconto_valor || 0);
            const descTipo = i.desconto_tipo || "percentual";
            let itemSpecificDiscount = 0;
            if (descValor > 0) {
              if (descTipo === "percentual") {
                itemSpecificDiscount = grossItemTotal * (Math.min(100, Math.max(0, descValor)) / 100);
              } else {
                itemSpecificDiscount = Math.min(grossItemTotal, descValor);
              }
            }

            let totalDescontoItem = itemSpecificDiscount;
            if (descontoClientePercent > 0) {
              totalDescontoItem +=
                ((grossItemTotal - itemSpecificDiscount) * descontoClientePercent) / 100;
            }
            if (descontoManual > 0 && cartTotalValue > 0) {
              const proportionalRatio = grossItemTotal / cartTotalValue;
              totalDescontoItem += descontoManual * proportionalRatio;
            }
            let tipoItem = "Produto";
            const cat = String(i.category || i.categoria || "").toLowerCase();
            if (cat.includes("servi") || cat.includes("servic")) {
              tipoItem = "Servico";
            }
            const produtoId = isNaN(Number(i.id)) ? undefined : Number(i.id);
            return {
              tipo_item: tipoItem,
              produto_id: produtoId,
              descricao: i.name || i.nome || "Item de Venda",
              quantidade: Number(i.qty),
              preco_unitario: preco,
              desconto: totalDescontoItem,
            };
          });
        })(),
      };

      if (isProforma) {
        await handleGerarProformaDirect();
        return;
      } else if (tipoPedido === "Imediato") {
        const vendaPayload = buildVendaPayload(valorPagoNum);
        const vendaRes = await createVenda.mutateAsync(vendaPayload);
        const vendaObj = {
          ...vendaRes,
          cliente: selectedClientObj,
          total: (vendaRes as any)?.total || (vendaRes as any)?.valor_total || total,
          itens: cart,
          forma_pagamento: paymentMethod,
        };
        setCreatedVenda(vendaObj);
        setCompletedOrderData(vendaObj);
      } else {
        const createdOrder: any = await orderService.create(orderPayload);
        if (valorPagoNum > 0) {
          const serverSaldo = Number(
            createdOrder.saldo ?? createdOrder.total ?? createdOrder.valor_total ?? valorPagoNum
          );
          const safePayVal = Number(Math.min(valorPagoNum, serverSaldo).toFixed(2));

          let payloadPagamento: any;
          if (pagamentos.length === 1) {
            payloadPagamento = {
              ...pagamentos[0],
              valor: Number(Math.min(pagamentos[0].valor, safePayVal).toFixed(2)),
              observacoes: "Liquidação em caixa",
            };
          } else {
            payloadPagamento = {
              pagamentos: pagamentos.map((p) => ({
                ...p,
                valor: Number(p.valor.toFixed(2)),
              })),
              observacoes: "Liquidação mista em caixa",
            };
          }

          const vendaRes = await checkoutPedido.mutateAsync({
            pedido_id: createdOrder.id,
            pagamento: payloadPagamento,
          });
          const orderObj = {
            ...createdOrder,
            cliente: selectedClientObj,
            total: createdOrder?.total || total,
            itens: cart,
            forma_pagamento: paymentMethod,
          };
          setCreatedVenda(vendaRes || orderObj);
          setCompletedOrderData(orderObj);
        } else {
          const vendaRes = await vendaService.emitirDocumentoPedido(
            createdOrder.id,
            isProforma ? "PROFORMA" : "FT"
          );
          const orderObj = {
            ...createdOrder,
            cliente: selectedClientObj,
            total: createdOrder?.total || total,
            itens: cart,
            forma_pagamento: paymentMethod,
          };
          setCreatedVenda(vendaRes || orderObj);
          setCompletedOrderData(orderObj);
        }
      }

      if (selectedClient) {
        const client = clients.find((c: any) => String(c.id) === String(selectedClient));
        if (client) {
          setSendContact(client.email || client.telefone || "");
          setSendMethod(client.email ? "email" : "whatsapp");
        }
      }

      setIsPaymentModalOpen(false);
      setIsSuccessModalOpen(true);
    } catch (err: any) {
      console.error("Erro ao concluir venda no caixa:", err);
      const errMsg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.response?.data?.msg ||
        err?.message ||
        "Erro ao concluir a venda no caixa.";
      toast.error(errMsg);
    }
  };

  const finishSale = () => {
    setSearchTerm("");
    setStep(1);
    clearCart();
    setSelectedClient("");
    setAmountReceived(0);
    setPaymentMethod("Dinheiro");
    setTipoDocumento("FR");
    setTipoPedido("Imediato");
    setDataEntrega("");
    setValorPago("");
    setCodigoTransferencia("");
    setEmissor("");
    setCreatedVenda(null);
    setCompletedOrderData(null);
    setIsSuccessModalOpen(false);
    setSendMethod("email");
    setSendContact("");
    setInvoiceSent(false);
    setIsPaymentModalOpen(false);
  };

  const handleLoadDraft = (draft: CaixaDraft) => {
    clearCart();
    if (draft.cart && draft.cart.length > 0) {
      draft.cart.forEach((item: any) => handleAddToCart(item));
    }
    if (draft.clientId) setSelectedClient(draft.clientId);
    if (draft.tipoDocumento) setTipoDocumento(draft.tipoDocumento);
    if (draft.tipoPedido) setTipoPedido(draft.tipoPedido);
    if (draft.dataEntrega) setDataEntrega(draft.dataEntrega);
  };

  const printThermalReceipt = (venda: any) => {
    if (!venda?.id) {
      toast.error("Documento não encontrado para impressão.");
      return;
    }
    documentService.imprimirReciboVenda(venda.id).catch((err) => {
      toast.error(err?.message || "Erro ao gerar recibo térmico.");
    });
  };

  if (!isCaixaAberta) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-sm animate-fade-in-up">
          <Store size={64} className="text-gray-300 dark:text-gray-600 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Nenhuma caixa aberta
          </h2>
          <p className="text-gray-500 mb-8 text-center max-w-md text-sm">
            Não possui nenhuma sessão de caixa aberta. Para começar a realizar vendas e operações ao
            balcão, abra uma sessão de caixa preenchendo o fundo de maneio.
          </p>
          <button
            onClick={() => setActiveSessionModal("abrir")}
            className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2 text-sm cursor-pointer"
          >
            <Unlock size={18} /> Abrir Caixa
          </button>
        </div>

        <CaixaSessionModals
          type={activeSessionModal}
          onClose={() => setActiveSessionModal(null)}
          caixaId={caixaId}
          openCaixa={openCaixa}
          abrirMutation={abrirMutation}
          fecharMutation={fecharMutation}
          movimentoMutation={movimentoMutation}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col flex-1 h-full w-full bg-white dark:bg-background-dark overflow-hidden relative">
        {/* Top Cash Control & Search Header */}
        <div className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Search Bar + Advanced Filters */}
          <div className="flex items-center gap-2 flex-1 min-w-[260px] max-w-xl">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Pesquisar produto por nome, código ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsFilterModalOpen(true)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 transition-all flex items-center gap-1.5 shrink-0"
              title="Filtros avançados do catálogo"
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="px-1.5 py-0.2 bg-primary text-white text-[10px] font-extrabold rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Cash Control Actions Group */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Session Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Caixa Aberto {caixaId ? `(#${caixaId})` : ""}</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveSessionModal("reforco")}
                className="px-2.5 py-1.5 bg-white dark:bg-gray-700 hover:bg-emerald-500 hover:text-white text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                title="Registar Entrada de Dinheiro / Suprimento"
              >
                <ArrowDownRight size={14} className="text-emerald-500" />
                <span className="hidden md:inline">Reforço</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSessionModal("sangria")}
                className="px-2.5 py-1.5 bg-white dark:bg-gray-700 hover:bg-amber-500 hover:text-white text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                title="Registar Retirada de Dinheiro / Sangria"
              >
                <ArrowUpRight size={14} className="text-amber-500" />
                <span className="hidden md:inline">Sangria</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSessionModal("fechar")}
                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm"
                title="Fechar Turno de Caixa"
              >
                <Lock size={14} />
                <span>Fechar Caixa</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content View */}
        {step === 1 && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* Catalog Column */}
            <div className="flex-1 flex flex-col min-w-0 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800">
              {/* Category Sector Pills */}
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
                {["Revenda", "Acabado", "Serviço", "TODOS"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      activeCategory === cat
                        ? "bg-primary text-white shadow-sm"
                        : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {cat === "TODOS" ? "Todos os Setores" : cat}
                  </button>
                ))}
              </div>

              {/* Product Grid */}
              <ProductGrid
                displayProductslist={filteredProducts.map(p => ({
                  ...p,
                  preco_venda: Number(p.preco_venda || 0),
                  stock_atual: Number(p.stock_atual || 0),
                  stock_minimo: Number(p.stock_minimo || 0)
                }))}
                showPriceWithIva={showPriceWithIva}
                handleAddToCart={handleAddToCartWrapper}
                formatCurrency={formatCurrency}
              />
            </div>

            {/* Cart Column */}
            <div className="w-full md:w-[380px] lg:w-[420px] flex flex-col shrink-0 bg-white dark:bg-gray-900">
              {/* Client Selector inside Cart Top Header */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase block">
                    Cliente Atribuído
                  </label>
                  <SearchableClientSelect
                    clients={clients}
                    selectedClientId={selectedClient}
                    onSelectClient={(id) => setSelectedClient(id)}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsCartModalOpen(true)}
                  className="mt-4 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                  title="Ver todos os produtos do carrinho em tabela"
                >
                  <span>Ver Todos</span>
                  {cart.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-primary text-white font-extrabold text-[10px] rounded-full">
                      {cart.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Cart List Items */}
              <CartList
                cart={cart}
                showPriceWithIva={showPriceWithIva}
                currencySymbol={config.moeda}
                formatCurrency={formatCurrency}
                removeItem={removeItem}
                updateQty={updateQty}
                updateItemDiscount={updateItemDiscount}
              />
            </div>
          </div>
        )}

        {/* Step 3 Success View */}
        {step === 3 && (() => {
          const isProformaDoc = Boolean(
            createdVenda?.isProforma ||
              isProforma ||
              (createdVenda?.numero_documento &&
                String(createdVenda.numero_documento).toUpperCase().includes("PROFORMA"))
          );

          const docNumber = createdVenda?.numero_documento || createdVenda?.numero || `#${createdVenda?.id || "NOVO"}`;
          const clientName = selectedClientObj?.nome || (selectedClientObj as any)?.name || "Cliente Final";
          const clientTel = sendContact || selectedClientObj?.telefone || "";
          const docTotal = createdVenda?.total || createdVenda?.valor_total || total;
          const defaultPosSmsText = `Olá ${clientName}, o seu atendimento ${docNumber} no valor de ${formatCurrency(docTotal)} foi registado com sucesso no Sabor Imbatível. Agradecemos a sua preferência!`;

          return (
            <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up">
              <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">
                {isProformaDoc ? "Pró-Forma Emitida com Sucesso!" : "Venda Concluída com Sucesso!"}
              </h2>
              <p className="text-xs text-gray-500 mb-4 max-w-md">
                Todas as operações do atendimento e mensagens foram organizadas e processadas.
              </p>

              {createdVenda && (
                <div className="w-full max-w-xl p-4 sm:p-5 mb-5 border border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark rounded-2xl shadow-sm text-left space-y-4">
                  {/* Info Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-150 dark:border-gray-800 text-xs">
                    <div>
                      <span className="text-gray-400 block font-semibold text-[10px] uppercase">Documento</span>
                      <strong className="text-gray-900 dark:text-white">{docNumber}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-semibold text-[10px] uppercase">Cliente</span>
                      <strong className="text-gray-900 dark:text-white truncate block">{clientName}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-semibold text-[10px] uppercase">Total</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(docTotal)}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-semibold text-[10px] uppercase">Estado</span>
                      <span className="text-emerald-600 font-bold">Liquidado</span>
                    </div>
                  </div>

                  {/* Central de Mensagens e Notificações Estruturadas */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-primary" />
                        Central de Mensagens & Notificações
                      </span>
                    </div>

                    {/* Card SMS & WhatsApp */}
                    <div className="border border-orange-200 dark:border-orange-950/60 bg-orange-50/50 dark:bg-orange-950/20 rounded-xl p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone size={16} className="text-orange-600 dark:text-orange-400" />
                          <strong className="text-xs text-gray-900 dark:text-white">
                            Notificação ao Cliente (SMS / WhatsApp)
                          </strong>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300">
                          Pronta para Envio
                        </span>
                      </div>

                      {/* Contact & Method */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={sendContact}
                          onChange={(e) => setSendContact(e.target.value)}
                          placeholder="Telemóvel do cliente (+244 923 000 000)"
                          className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg outline-none focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!sendContact.trim()) {
                              toast.error("Introduza o contacto.");
                              return;
                            }
                            externalNotificationService.abrirWhatsAppWeb(sendContact.trim(), defaultPosSmsText);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Send size={12} /> WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!sendContact.trim()) {
                              toast.error("Introduza o contacto.");
                              return;
                            }
                            const res = await externalNotificationService.enviarNotificacaoCliente({
                              telefone: sendContact.trim(),
                              mensagem: defaultPosSmsText,
                              destinatario_nome: clientName,
                              canal: "sms",
                              referencia_id: createdVenda?.id,
                              referencia_tipo: "pedido",
                            });
                            if (res.sucesso) {
                              toast.success("SMS enviada ao cliente!");
                            } else {
                              toast.info("SMS registada na fila de envio.");
                            }
                          }}
                          className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare size={12} /> SMS
                        </button>
                      </div>

                      {/* Text preview with copy button */}
                      <div className="relative">
                        <div className="p-2 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-lg text-[11px] text-gray-600 dark:text-gray-300 pr-16 leading-relaxed">
                          "{defaultPosSmsText}"
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(defaultPosSmsText);
                            toast.success("Texto da SMS copiado!");
                          }}
                          className="absolute right-1.5 top-1.5 px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Copy size={11} /> Copiar
                        </button>
                      </div>
                    </div>

                    {/* Status das Operações Organizadinhas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-2">
                        <ShoppingBag size={14} className="text-emerald-500" />
                        <div className="flex-1">
                          <strong className="block text-gray-900 dark:text-white text-[11px]">Venda Comercial Registada</strong>
                          <span className="text-[10px] text-gray-500">Documento {docNumber} emitido.</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold">✓ OK</span>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-2">
                        <CreditCard size={14} className="text-purple-500" />
                        <div className="flex-1">
                          <strong className="block text-gray-900 dark:text-white text-[11px]">Movimento de Caixa</strong>
                          <span className="text-[10px] text-gray-500">Liquidado em {paymentMethod}.</span>
                        </div>
                        <span className="text-[10px] text-purple-600 font-bold">✓ OK</span>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-2">
                        <PackageCheck size={14} className="text-amber-500" />
                        <div className="flex-1">
                          <strong className="block text-gray-900 dark:text-white text-[11px]">Baixa de Inventário</strong>
                          <span className="text-[10px] text-gray-500">Stock atualizado em tempo real.</span>
                        </div>
                        <span className="text-[10px] text-amber-600 font-bold">✓ OK</span>
                      </div>

                      <div className="p-2.5 bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-xl flex items-center gap-2">
                        <ChefHat size={14} className="text-blue-500" />
                        <div className="flex-1">
                          <strong className="block text-gray-900 dark:text-white text-[11px]">Produção & Fabrico</strong>
                          <span className="text-[10px] text-gray-500">
                            {tipoPedido === "Agendado" ? `Agendado (${dataEntrega || "Breve"})` : "Atendimento Imediato"}
                          </span>
                        </div>
                        <span className="text-[10px] text-blue-600 font-bold">✓ OK</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Action Buttons */}
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                      Documentos
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isProformaDoc) {
                            proformaService.openRecibo(createdVenda.id);
                          } else {
                            printThermalReceipt(createdVenda);
                          }
                        }}
                        className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Printer size={14} /> Recibo 80mm
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isProformaDoc) {
                            proformaService.openPdf(createdVenda.id);
                          } else {
                            documentService.vendaPdf(createdVenda.id).catch((err) =>
                              toast.error(err.message || "Erro ao abrir PDF.")
                            );
                          }
                        }}
                        className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <FileText size={14} /> {isProformaDoc ? "Pró-Forma A4" : "Fatura A4"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (isProformaDoc) {
                            proformaService.openPdf(createdVenda.id);
                          } else {
                            documentService.vendaRecibo(createdVenda.id).catch((err) =>
                              toast.error(err.message || "Erro ao descarregar recibo.")
                            );
                          }
                        }}
                        className="p-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Download size={14} /> Descarregar PDF
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={finishSale}
                className="w-full max-w-xl bg-gray-900 hover:bg-black dark:bg-gray-100 dark:hover:bg-white text-white dark:text-gray-900 font-bold py-3.5 rounded-xl transition-all text-sm shadow-md cursor-pointer"
              >
                Novo Atendimento / Próxima Venda
              </button>
            </div>
          );
        })()}

        {/* Fixed Bottom Footer Bar */}
        {step === 1 && (
          <div className="sticky bottom-0 z-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 shrink-0 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Financial Metrics */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full md:w-auto">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                    Subtotal
                  </span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    {formatCurrency(subtotal)}
                  </span>
                </div>

                {(descontoAutomatico > 0 || descontoManual > 0) && (
                  <div>
                    <span className="text-[10px] text-emerald-500 font-semibold uppercase block">
                      Desconto
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      -{formatCurrency(descontoAutomatico + descontoManual)}
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-[10px] text-gray-400 font-semibold uppercase block">
                    IVA (15% Incl.)
                  </span>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    {formatCurrency(Iva)}
                  </span>
                </div>

                <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 hidden sm:block" />

                <div>
                  <span className="text-[10px] text-primary font-black uppercase tracking-wider block">
                    TOTAL A PAGAR
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-primary">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                {/* Ver Produtos do Carrinho */}
                <button
                  type="button"
                  onClick={() => setIsCartModalOpen(true)}
                  className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  title="Ver lista em tabela de todos os produtos do carrinho"
                >
                  <ShoppingCart size={15} className="text-primary" />
                  <span className="hidden sm:inline">Ver Carrinho</span>
                  {cart.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-primary text-white text-[10px] font-extrabold rounded-full">
                      {cart.length}
                    </span>
                  )}
                </button>

                {/* Clear Cart */}
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={clearCart}
                  className="px-3 py-2 bg-gray-100 hover:bg-red-50 dark:bg-gray-800 dark:hover:bg-red-950/30 text-gray-600 dark:text-gray-300 hover:text-red-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 disabled:opacity-40"
                  title="Esvaziar o carrinho"
                >
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">Limpar</span>
                </button>

                {/* Rascunhos */}
                <button
                  type="button"
                  onClick={() => setIsDraftsModalOpen(true)}
                  className="px-3.5 py-2 bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                  title="Gerir rascunhos de atendimento"
                >
                  <Bookmark size={15} className="text-amber-500" />
                  <span>Rascunhos</span>
                  {draftsCount > 0 && (
                    <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-extrabold rounded-full">
                      {draftsCount}
                    </span>
                  )}
                </button>

                {/* Emitir Pró-Forma */}
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleGerarProformaDirect}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  <FileText size={15} />
                  <span className="hidden sm:inline">Emitir Pró-Forma</span>
                  <span className="sm:hidden">Pró-Forma</span>
                </button>

                {/* Finalizar / Pagar */}
                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleOpenPaymentModal}
                  className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 active:scale-95"
                >
                  <CreditCard size={16} />
                  <span>FINALIZAR / PAGAR</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Filters Modal */}
      <CaixaAdvancedFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        categories={allCategories}
        selectedCategory={selectedFilterCategory}
        setSelectedCategory={setSelectedFilterCategory}
        selectedType={selectedFilterType}
        setSelectedType={setSelectedFilterType}
        onlyInStock={onlyInStockFilter}
        setOnlyInStock={setOnlyInStockFilter}
        minPrice={minPriceFilter}
        setMinPrice={setMinPriceFilter}
        maxPrice={maxPriceFilter}
        setMaxPrice={setMaxPriceFilter}
        sortBy={sortByFilter}
        setSortBy={setSortByFilter}
        onReset={handleResetFilters}
      />

      {/* Drafts Modal */}
      <CaixaDraftsModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        currentCart={cart}
        currentClientName={selectedClientObj?.nome}
        currentClientId={selectedClient}
        currentTotal={total}
        currentTipoDocumento={tipoDocumento}
        currentTipoPedido={tipoPedido}
        currentDataEntrega={dataEntrega}
        onLoadDraft={handleLoadDraft}
      />

      {/* Payment / Checkout Modal */}
      <CaixaPOSPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        total={total}
        subtotal={subtotal}
        desconto={descontoAutomatico + descontoManual}
        totalIva={Iva}
        cartCount={cart.reduce((acc, i) => acc + Number(i.qty || 1), 0)}
        clients={clients}
        selectedClient={selectedClient}
        setSelectedClient={setSelectedClient}
        tipoDocumento={tipoDocumento}
        setTipoDocumento={setTipoDocumento}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        amountReceived={amountReceived}
        setAmountReceived={setAmountReceived}
        tipoPedido={tipoPedido}
        setTipoPedido={setTipoPedido}
        dataEntrega={dataEntrega}
        setDataEntrega={setDataEntrega}
        valorPago={valorPago}
        setValorPago={setValorPago}
        codigoTransferencia={codigoTransferencia}
        setCodigoTransferencia={setCodigoTransferencia}
        emissor={emissor}
        setEmissor={setEmissor}
        valorCashMixto={valorCashMixto}
        setValorCashMixto={setValorCashMixto}
        valorPosMixto={valorPosMixto}
        setValorPosMixto={setValorPosMixto}
        isSubmitting={createVenda.isPending || checkoutPedido.isPending}
        onConfirm={confirmPayment}
        onEmitirProforma={handleGerarProformaDirect}
      />

      {/* Cart Items Table Modal */}
      <CaixaCartModal
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        cart={cart}
        formatCurrency={formatCurrency}
        updateQty={updateQty}
        updateItemDiscount={updateItemDiscount}
        removeItem={removeItem}
        clearCart={clearCart}
        subtotal={subtotal}
        Iva={Iva}
        descontoTotal={descontoAutomatico + descontoManual}
        total={total}
      />

      {/* Cash Session Modals (Abrir, Fechar, Sangria, Reforço) */}
      <CaixaSessionModals
        type={activeSessionModal}
        onClose={() => setActiveSessionModal(null)}
        caixaId={caixaId}
        openCaixa={openCaixa}
        abrirMutation={abrirMutation}
        fecharMutation={fecharMutation}
        movimentoMutation={movimentoMutation}
      />

      {/* Order & Sales Receipt Modal */}
      <OrderReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        documentData={receiptDocData}
      />

      {/* Modal de Sucesso idêntico ao Pedidos com todas as informações / SMS do Atendimento */}
      {isSuccessModalOpen && (completedOrderData || createdVenda) && (
        <PedidoSuccessModal
          order={completedOrderData || createdVenda}
          createdVenda={createdVenda}
          onClose={() => {
            setIsSuccessModalOpen(false);
            finishSale();
          }}
          onNewOrder={() => {
            setIsSuccessModalOpen(false);
            finishSale();
          }}
        />
      )}
    </>
  );
}

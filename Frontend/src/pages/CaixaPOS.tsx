import React, { useState } from "react";
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
  Calculator,
  ShoppingCart,
  Search,
  CreditCard,
  Banknote,
  FileText,
  CheckCircle,
  Store,
  Lock,
  Printer,
  Download,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { formatCurrency, cn } from "../lib/utils";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import ProductGrid from "./CaixaPOS/ProductGrid";
import CartList from "./CaixaPOS/CartList";
import { useCaixaCart } from "./CaixaPOS/useCaixaCart";
import { useCaixaSession } from "./CaixaPOS/useCaixaSession";
import CaixaSessionModals from "../components/CaixaSessionModals";
import StockWarningModal from "../components/POS/StockWarningModal";
import FlexiblePaymentForm, { PaymentFormState } from "../components/POS/FlexiblePaymentForm";
import OrderReceiptModal from "../components/POS/OrderReceiptModal";

export default function CaixaPOS() {
  const { createVenda, checkoutPedido, enviarFatura } = useComercial();
  const [activeCategory, setActiveCategory] = useState<string>("Revenda");
  const config = JSON.parse(localStorage.getItem("sigi_config") || "{}");
  const { data: productsResponse } = useQuery({
    queryKey: ["products", activeCategory],
    queryFn: () => {
      const params: any = {
        per_page: 5000,
        include_iva: true,
        tipo :activeCategory,
      };
  
      // Apenas produtos de revenda com stock
      if (activeCategory === "Revenda") {
        params.have_stock = true;
      }
  
      return productService.getAll(params);
    },
  });

  const { data: clientsResponse } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientService.getAll({ per_page: 1000 }),
  });
  const [selectedClient, setSelectedClient] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Dinheiro");
  const [tipoDocumento, setTipoDocumento] = useState<"FR" | "PROFORMA">("FR");
  const isProforma = tipoDocumento === "PROFORMA";
  const [step, setStep] = useState(1);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [showPriceWithIva] = useState(true);

  // Scheduled order options
  const [tipoPedido, setTipoPedido] = useState<"Imediato" | "Agendado">(
    "Imediato"
  );
  // pegar a data de hoje mais 3 horas acima
  const [dataEntrega, setDataEntrega] = useState("");
  const [valorPago, setValorPago] = useState(""); // deposit
  const [codigoTransferencia, setCodigoTransferencia] = useState("");
  const [emissor, setEmissor] = useState("");

  // Invoice sending states
  const [createdVenda, setCreatedVenda] = useState<any>(null);
  const [sendMethod, setSendMethod] = useState<"email" | "whatsapp">("email");
  const [sendContact, setSendContact] = useState("");
  const [invoiceSent, setInvoiceSent] = useState(false);

  // Stock warning & Receipt Modal states
  const [stockWarningOpen, setStockWarningOpen] = useState(false);
  const [stockWarningItems, setStockWarningItems] = useState<any[]>([]);
  const [paymentFormState, setPaymentFormState] = useState<PaymentFormState | null>(null);
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
    selectedServico,
    setSelectedServico,
    displayProducts,
    subtotal,
    totalComIva,
    Iva,
    descontoAutomatico,
    descontoManual,
    setDescontoManual,
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

  const handleAddToCartWrapper = (product: any) => {
    const stock = Number(product.stock_atual ?? product.stock ?? product.quantidade_atual ?? 0);
    const tipoUpper = String(product.tipo || product.type || "").toUpperCase();
    const isRevenda = tipoUpper === "REVENDA" || tipoUpper === "PRODUTO_REVENDA" || product.is_revenda === true;

    if (stock <= 0) {
      if (isRevenda && (cart.length === 0 || cart.every(it => String(it.tipo || it.type || "").toUpperCase() === "REVENDA"))) {
        toast.error(`O produto de revenda "${product.name || product.nome}" está sem stock e não pode ser encomendado.`);
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
        toast.warn(`Produto "${product.name || product.nome}" sem stock selecionado. É OBRIGATÓRIO selecionar um Cliente no topo do carrinho!`, { autoClose: 6000 });
      } else {
        toast.info(`Produto "${product.name || product.nome}" sem stock adicionado como Pedido de Produção (Agendado).`);
      }
    }

    handleAddToCart(product);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos para continuar.");
      return;
    }

    // Rule: Standalone Revenda items cannot be ordered if out of stock
    if (isOnlyRevendaCart && hasZeroStockItem) {
      toast.error("Produtos de revenda solteiros sem stock não podem ser encomendados. Reduza a quantidade ou adicione um produto de fabrico.");
      return;
    }

    // Rule: Zero-stock items convert sale to Pedido de Produção and REQUIRE a client
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
        toast.error("Para produtos sem stock (Pedido de Produção), é OBRIGATÓRIO selecionar um Cliente antes de avançar!");
        return;
      }
    }

    setStep(2);
  };

  const handleConvertToOrderFromModal = () => {
    setTipoPedido("Agendado");
    const future = new Date(Date.now() + 3 * 3600 * 1000);
    const tzOffset = future.getTimezoneOffset() * 60000;
    const localISOTime = new Date(future.getTime() - tzOffset).toISOString().slice(0, 16);
    setDataEntrega(localISOTime);
    setStep(2);
  };

  const handleGerarProformaDirect = async () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos ao carrinho para gerar Pró-Forma.");
      return;
    }
    try {
      const payload: ProformaCreatePayload = {
        cliente_id: selectedClient ? Number(selectedClient) : null,
        pedido_id: null,
        evento_id: null,
        origem: "POS",
        observacoes: "Orçamento emitido no Caixa POS",
        itens: cart.map((i) => {
          let tipoItem = "Produto";
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
            taxa_iva: Number(i.taxa_iva ?? i.iva_taxa ?? i.iva ?? 15),
          };
        }),
      };
      const res = await proformaService.create(payload);
      setCreatedVenda({
        ...res,
        isProforma: true,
        id: res.id,
        numero: res.numero_documento || `PROFORMA/${res.id}`,
        total: res.total || total,
      });
      setStep(3);
      toast.success(res.msg || "Fatura Pró-Forma gerada com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao gerar Fatura Pró-Forma.");
    }
  };

  const confirmPayment = async () => {
    const isAgendado = tipoPedido === "Agendado";

    // 1. Client obligation rule:
    if (isAgendado && !selectedClient) {
      toast.error(
        "Para pedidos agendados, a seleção de um cliente é obrigatória."
      );
      return;
    }

    // 2. Scheduled date validation:
    if (isAgendado && !dataEntrega) {
      toast.error("Selecione uma data e hora para a entrega.");
      return;
    }

    // 3. Payment method mandatory fields:
    if (!isProforma && (paymentMethod === "Transferência" || paymentMethod === "TPA / POS" || paymentMethod === "Mixto")) {
      if (!codigoTransferencia.trim()) {
        toast.error("Código de transferência / comprovativo é obrigatório.");
        return;
      }
      if (!emissor.trim()) {
        toast.error("Emissor / Titular do banco é obrigatório.");
        return;
      }
    }

    const valorPagoNum = isProforma ? 0 : (isAgendado && valorPago !== "" ? parseFloat(valorPago) : total);

    const valorDinheiroMixto = Number(paymentFormState?.valorCashMixto || 0);
    const valorPosMixto = Number(paymentFormState?.valorPosMixto || 0);
    if (!isProforma && paymentMethod === "Mixto" && Math.abs(valorDinheiroMixto + valorPosMixto - valorPagoNum) > 0.01) {
      toast.error("No pagamento misto, a soma de Dinheiro e POS deve ser igual ao valor a liquidar.");
      return;
    }

    const minimoDinheiroRecebido = paymentMethod === "Mixto" ? valorDinheiroMixto : valorPagoNum;
    if (!isProforma && (paymentMethod === "Dinheiro" || paymentMethod === "Mixto") && amountReceived < minimoDinheiroRecebido) {
      toast.error("Valor recebido insuficiente.");
      return;
    }

    try {
      const saldoRestante = Math.max(0, total - valorPagoNum);
      const paymentMethodId =
        paymentMethod === "Transferência"
          ? 2
          : paymentMethod === "TPA / POS"
          ? 3
          : 1;

      const pagamentos = valorPagoNum <= 0 ? [] : paymentMethod === "Mixto"
        ? [
            { forma_pagamento_id: 1, valor: valorDinheiroMixto },
            { forma_pagamento_id: 3, valor: valorPosMixto, codigo_transferencia: codigoTransferencia || null, emissor: emissor || null },
          ].filter((pagamento) => pagamento.valor > 0)
        : [{
            forma_pagamento_id: paymentMethodId,
            valor: valorPagoNum,
            codigo_transferencia: paymentMethod !== "Dinheiro" ? (codigoTransferencia || null) : null,
            emissor: paymentMethod !== "Dinheiro" ? (emissor || null) : null,
          }];

      const mapCartToVendaItens = (
        quantidadesDisponiveis?: Record<number, number>
      ) => {
        const cartTotalValue = cart.reduce((acc, it) => acc + Number(it.preco_venda_com_iva || it.salePrice || it.preco_venda || 0) * Number(quantidadesDisponiveis?.[Number(it.id)] ?? it.qty), 0);
        return cart.map((i) => {
          let tipoItem = "Produto";
          const cat = String(i.category || i.categoria || "").toLowerCase();
          if (cat.includes("servi") || cat.includes("servic")) {
            tipoItem = "Servico";
          }
          const preco = Number(i.preco_venda_com_iva || i.salePrice || i.preco_venda || 0);
          const itemId = Number(i.id);
          const quantidade = quantidadesDisponiveis?.[itemId] ?? Number(i.qty);
          const grossItemTotal = preco * quantidade;

          // Item specific discount
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
            totalDescontoItem += ((grossItemTotal - itemSpecificDiscount) * descontoClientePercent) / 100;
          }
          if (descontoManual > 0 && cartTotalValue > 0) {
             const proportionalRatio = grossItemTotal / cartTotalValue;
             totalDescontoItem += (descontoManual * proportionalRatio);
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

      const buildVendaPayload = (
        converterStockInsuficiente = false,
        valorPagamento = valorPagoNum
      ) => ({
        tipo_documento: tipoDocumento,
        cliente_id: selectedClient ? Number(selectedClient) : undefined,
        observacoes: "Venda direta via POS",
        itens: mapCartToVendaItens(),
        pagamentos: valorPagamento > 0 ? pagamentos : [],
      });

      const d = new Date();
      const current_date = d.toISOString().split("T")[0];
      const current_time = d.toTimeString().split(" ")[0];

      // Build a strictly valid order creation payload
      const strFormaPagamento = paymentMethod === "Transferência" ? "Transferencia" : (paymentMethod === "TPA / POS" ? "POS" : "Dinheiro");

      const orderPayload: any = {
        cliente_id: selectedClient ? Number(selectedClient) : undefined,
        tipo: "Simples",
        origem: "Balcao",
        data_entrega: isAgendado ? dataEntrega.split("T")[0] : current_date,
        hora_entrega: isAgendado
          ? `${dataEntrega.split("T")[1] || "12:00"}:00`.substring(0, 8)
          : current_time,
        estado: "Agendado",
        observacoes: `Pedido ${tipoPedido}. Caixa: #${caixaId}`,
        // O pedido não movimenta caixa. O checkout abaixo regista o pagamento
        // e gera a venda/recibo numa única transação.
        valor_pago: 0,
        forma_pagamento: "Dinheiro",
        itens: (() => {
          const cartTotalValue = cart.reduce((acc, it) => acc + Number(it.preco_venda_com_iva || it.salePrice || it.preco_venda || 0) * Number(it.qty), 0);
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
              totalDescontoItem += ((grossItemTotal - itemSpecificDiscount) * descontoClientePercent) / 100;
            }
            if (descontoManual > 0 && cartTotalValue > 0) {
               const proportionalRatio = grossItemTotal / cartTotalValue;
               totalDescontoItem += (descontoManual * proportionalRatio);
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
        // Direct Pro-Forma Creation (POST /api/v1/proformas/)
        const proformaPayload: ProformaCreatePayload = {
          cliente_id: selectedClient ? Number(selectedClient) : null,
          pedido_id: null,
          evento_id: null,
          origem: "POS",
          observacoes: "Orçamento para cliente balcão",
          itens: cart.map((i) => {
            const cat = String(i.category || i.categoria || "").toLowerCase();
            const isServ = cat.includes("servi") || cat.includes("servic");
            return {
              item_tipo: isServ ? "Servico" : "Produto",
              item_id: isNaN(Number(i.id)) ? null : Number(i.id),
              descricao: i.name || i.nome || "Item de Venda",
              quantidade: Number(i.qty || 1),
              preco_unitario: Number(i.price || 0),
              desconto: Number(i.discount || 0),
              taxa_iva: Number(i.taxa_iva ?? i.iva_taxa ?? i.iva ?? 15),
            };
          }),
        };

        const proformaRes = await proformaService.create(proformaPayload);
        setCreatedVenda({
          ...proformaRes,
          isProforma: true,
          id: proformaRes.id,
          numero: proformaRes.numero_documento || `PROFORMA 2026/${proformaRes.id}`,
          total: proformaRes.total || total,
        });
        toast.success(proformaRes.msg || "Pró-Forma criada com sucesso!");
      } else if (tipoPedido === "Imediato") {
        // Venda Direta (Balcão)
        const vendaPayload = buildVendaPayload(false, valorPagoNum);
        const vendaRes = await createVenda.mutateAsync(vendaPayload);
        setCreatedVenda(vendaRes);
      } else {
        // Create the order first (Passo 1: POST /api/v1/pedidos)
        const createdOrder: any = await orderService.create(orderPayload);
        
        if (valorPagoNum > 0) {
          const serverSaldo = Number(createdOrder.saldo ?? createdOrder.total ?? createdOrder.valor_total ?? valorPagoNum);
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
          setCreatedVenda(vendaRes);
        } else {
          // Pedido and venda identifiers are distinct. Issue the FT first so
          // printing always uses a real commercial-document identifier.
          const vendaRes = await vendaService.emitirDocumentoPedido(createdOrder.id, isProforma ? "PROFORMA" : "FT");
          setCreatedVenda(vendaRes);
        }
      }

      // Pre-fill contact details if client is selected
      if (selectedClient) {
        const client = clients.find(
          (c: any) => String(c.id) === String(selectedClient)
        );
        if (client) {
          setSendContact(client.email || client.telefone || "");
          setSendMethod(client.email ? "email" : "whatsapp");
        }
      }

      setStep(3);
    } catch (err: any) {
      console.error(err);
      // Errors are already handled by the useComercial hook's onError callback
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
    setSendMethod("email");
    setSendContact("");
    setInvoiceSent(false);
    setStep(1);
  };

  const printThermalReceipt = (venda: any) => {
    if (!venda?.id) {
      toast.error("Documento não encontrado para impressão.");
      return;
    }
    // Never fall back to a pedido URL with a venda identifier: matching ids
    // can point to a different historical document.
    documentService.imprimirReciboVenda(venda.id).catch((err) => {
      toast.error(err?.message || "Erro ao gerar recibo térmico.");
    });
    return;
    const targetId = venda.pedido_id || venda.id;
    if (!venda.id) {
      documentService.imprimirReciboPedido(targetId).catch(() => {
        documentService.imprimirReciboVenda(venda.id).catch((err) => {
          toast.error(err?.message || "Erro ao gerar recibo térmico.");
        });
      });
    } else {
      documentService.imprimirReciboVenda(venda.id).catch(() => {
        documentService.imprimirReciboPedido(venda.id).catch((err) => {
          toast.error(err?.message || "Erro ao gerar recibo térmico no backend.");
        });
      });
    }
  };

  if (!isCaixaAberta) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-sm animate-fade-in-up">
          <Store size={64} className="text-gray-300 dark:text-gray-600 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Caixa Fechado
          </h2>
          <p className="text-gray-500 mb-8 text-center max-w-md">
            O caixa encontra-se fechado. Para registar vendas e operações ao
            balcão, inicie o turno preenchendo o fundo de maneio.
          </p>
          <button
            onClick={() => setActiveSessionModal("abrir")}
            className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
          >
            <Lock size={18} /> Abrir Caixa
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
      <div className="min-h-[calc(100vh-8rem)] xl:h-[calc(100vh-8rem)] flex flex-col xl:flex-row gap-4 xl:gap-6 overflow-auto xl:overflow-hidden animate-fade-in">
      <div className="flex-1 min-h-[32rem] bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-border-dark flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-3 bg-white dark:bg-surface-dark z-10 shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calculator size={20} className="text-primary" />
              Produtos
            </h2>
            <div className="relative w-full sm:w-56 sm:ml-2">
              <input
                type="text"
                placeholder="Pesquisar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-primary outline-none"
              />
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-gray-400"
              />
            </div>
            <select
              value={selectedServico}
              onChange={(e) => setSelectedServico(e.target.value)}
              className="bg-gray-50 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg px-3 py-2 text-sm font-semibold focus:border-primary outline-none"
            >
              <option value="all">Todos os Serviços</option>
              <option value="COZINHA">Cozinha (COZINHA)</option>
              <option value="PASTELARIA">Pastelaria (PASTELARIA)</option>
              <option value="BAR">Bar (BAR)</option>
              <option value="ABASTECIMENTO">Abastecimento (ABASTECIMENTO)</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveSessionModal("sangria")}
              className="text-sm font-medium px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 flex items-center gap-2"
            >
              Sangria
            </button>
            <button
              onClick={() => setActiveSessionModal("reforco")}
              className="text-sm font-medium px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 flex items-center gap-2"
            >
              Reforço
            </button>
            <button
              onClick={() => setActiveSessionModal("fechar")}
              className="text-sm font-medium px-4 py-2 bg-error/10 text-error hover:bg-error/20 rounded-lg transition-colors border border-error/20 flex items-center gap-2"
            >
              <Lock size={16} /> Fechar Caixa
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark border-b border-gray-200 dark:border-border-dark px-4 py-2 shrink-0 flex gap-2 overflow-x-auto">
          {[
            "Tudo",
            "Acabado",
            "Revenda",
            "Material",
            "Menu Eventos",
            "Espaço",
          ].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors border",
                activeCategory === cat
                  ? "bg-primary text-white border-primary"
                  : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <ProductGrid
          displayProductslist={displayProducts}
          showPriceWithIva={true}
          handleAddToCart={handleAddToCartWrapper}
          formatCurrency={(val) =>
            new Intl.NumberFormat("pt-PT", {
              style: "currency",
              currency: config.moeda,
            }).format(val)
          }
        />
      </div>

      <div className="w-full xl:w-96 xl:max-w-96 min-h-[28rem] xl:min-h-0 xl:h-full bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl flex flex-col shrink-0 shadow-sm overflow-hidden">
        {step === 1 && (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-border-dark shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart size={20} />
                Carrinho Atendimento
              </h2>
            </div>

            <div className={`p-4 border-b shrink-0 transition-all ${
              (hasZeroStockItem && !selectedClient)
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 ring-2 ring-amber-400/50"
                : "border-gray-200 dark:border-border-dark"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Cliente {hasZeroStockItem ? "(OBRIGATÓRIO p/ Pedido Produção)" : "(Opcional)"}
                </label>
                {hasZeroStockItem && !selectedClient && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 animate-pulse">
                    <AlertTriangle size={12} /> Requerido
                  </span>
                )}
              </div>
              
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className={`w-full bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none font-semibold ${
                  (hasZeroStockItem && !selectedClient)
                    ? "border-2 border-amber-500 text-amber-900 dark:text-amber-200"
                    : "border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:border-primary"
                }`}
              >
                <option value="">-- {hasZeroStockItem ? "Selecionar Cliente (Obrigatório)" : "Cliente ao Balcão"} --</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.nome} {c.nif ? `(${c.nif})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <CartList
              cart={cart}
              showPriceWithIva={true}
              currencySymbol={config.moeda}
              formatCurrency={(val) =>
                new Intl.NumberFormat("pt-PT", {
                  style: "currency",
                  currency: config.moeda,
                }).format(val)
              }
              removeItem={removeItem}
              updateQty={updateQty}
              updateItemDiscount={updateItemDiscount}
            />

            <div className="p-4 border-t border-gray-200 dark:border-border-dark shrink-0 bg-gray-50 dark:bg-gray-800/30">
              {/* Resumo */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{"Subtotal (s/ IVA)"}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>

                {descontoAutomatico > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Desconto Cliente ({descontoClientePercent}%)</span>
                    <span>- {formatCurrency(descontoAutomatico)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">Desconto Extra (Valor)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-24 px-2 py-1 text-right text-sm border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="0.00"
                    value={descontoManual || ""}
                    onChange={(e) => setDescontoManual(Math.max(0, parseFloat(e.target.value) || 0))}
                  />
                </div>
                {descontoManual > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Desconto Extra Aplicado</span>
                    <span>- {formatCurrency(descontoManual)}</span>
                  </div>
                )}
                {/* IVA */}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{"IVA"}</span>
                  <span>{formatCurrency(Iva)}</span>
                </div>

                <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-2 flex justify-between items-center">
                  <span className="font-semibold tracking-wide text-gray-700 dark:text-gray-300">
                    TOTAL A PAGAR
                  </span>

                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 flex justify-center items-center gap-2"
                >
                  PROSSEGUIR PARA PAGAMENTO
                </button>
                <button
                  type="button"
                  onClick={handleGerarProformaDirect}
                  disabled={cart.length === 0}
                  className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl transition-all shadow flex justify-center items-center gap-2 text-sm"
                >
                  📄 GERAR PRÓ-FORMA
                </button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Pagamento / Encomenda
              </h2>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-primary font-bold"
              >
                Voltar
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* Tipo de Pedido: Imediato vs Agendado */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  Tipo de Atendimento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={hasZeroStockItem}
                    onClick={() => !hasZeroStockItem && setTipoPedido("Imediato")}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold border transition-all",
                      hasZeroStockItem
                        ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800"
                        : tipoPedido === "Imediato"
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 hover:bg-gray-50"
                    )}
                  >
                    Levantamento Imediato
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoPedido("Agendado");
                      if (!dataEntrega) {
                        const future = new Date(Date.now() + 3 * 3600 * 1000);
                        const tzOffset = future.getTimezoneOffset() * 60000;
                        const localISOTime = new Date(future.getTime() - tzOffset).toISOString().slice(0, 16);
                        setDataEntrega(localISOTime);
                      }
                    }}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold border transition-all",
                      tipoPedido === "Agendado"
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 hover:bg-gray-50"
                    )}
                  >
                    Pedido de Produção (Agendado)
                  </button>
                </div>
              </div>

              {/* Conditional Scheduled fields */}
              {tipoPedido === "Agendado" && (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900/30 space-y-3">
                  <h3 className="text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                    <Clock size={16} /> Configurações do Pedido de Produção
                  </h3>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Data e Hora da Entrega *
                    </label>
                    <input
                      type="datetime-local"
                      value={dataEntrega}
                      onChange={(e) => setDataEntrega(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-medium text-gray-800 dark:text-gray-100 outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1">
                <label className="block text-[10px] font-bold text-gray-500 uppercase">Documento comercial</label>
                <select
                  value={tipoDocumento}
                  onChange={(e) => setTipoDocumento(e.target.value as "FR" | "PROFORMA")}
                  className="w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2"
                >
                  <option value="FR">FR — Venda direta paga</option>
                  <option value="PROFORMA">Pró-Forma — sem pagamento</option>
                </select>
                {tipoDocumento === "PROFORMA" && <p className="text-[10px] text-amber-600">A Pró-Forma não movimenta caixa nem regista pagamento.</p>}
              </div>

              {/* Flexible Multi-Method Payment Form */}
              <FlexiblePaymentForm
                total={total}
                currencySymbol={config.moeda}
                isAgendado={tipoPedido === "Agendado"}
                disableDeferredAndInstallments={isOnlyRevendaCart}
                onPaymentStateChange={(state) => {
                  setPaymentFormState(state);
                  setPaymentMethod(state.method);
                  setCodigoTransferencia(state.codigoTransferencia);
                  setEmissor(state.emissor);
                  setAmountReceived(state.amountReceived);
                  if (state.settlementMode === "deferido") {
                    setValorPago("0");
                  } else if (state.settlementMode === "parcelas") {
                    setValorPago(String(state.valorPago));
                  } else {
                    setValorPago(String(total));
                  }
                }}
              />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-border-dark shrink-0">
              <button
                onClick={confirmPayment}
                disabled={checkoutPedido.isPending || createVenda.isPending}
                className="w-full bg-success hover:bg-success/90 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-success/20 flex justify-center items-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {checkoutPedido.isPending || createVenda.isPending
                  ? "A PROCESSAR..."
                  : "CONFIRMAR E REGISTAR"}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-success" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              Sucesso!
            </h2>
            <p className="text-xs text-gray-500 mb-6 max-w-[250px]">
              Venda registada com sucesso{" "}
              {createdVenda?.numero ? `(#${createdVenda.numero})` : ""}.
            </p>

            {createdVenda && (
              <div className="w-full p-4 mb-6 border border-gray-150 dark:border-border-dark bg-gray-50 dark:bg-gray-900/40 rounded-xl text-left">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (createdVenda?.isProforma || isProforma) {
                        proformaService.openRecibo(createdVenda.id);
                      } else {
                        printThermalReceipt(createdVenda);
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Printer size={14} /> Recibo Térmico (80mm)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (createdVenda?.isProforma || isProforma) {
                        proformaService.openPdf(createdVenda.id);
                      } else {
                        documentService.vendaPdf(createdVenda.id).catch((err) =>
                          toast.error(err.message || "Erro ao abrir PDF.")
                        );
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <FileText size={14} /> Fatura A4
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (createdVenda?.isProforma || isProforma) {
                        proformaService.openPdf(createdVenda.id);
                      } else {
                        documentService.vendaRecibo(createdVenda.id).catch((err) =>
                          toast.error(err.message || "Erro ao descarregar recibo.")
                        );
                      }
                    }}
                    className="px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Download size={14} /> Descarregar PDF
                  </button>
                </div>
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                  Enviar {createdVenda?.isProforma || isProforma ? "Pró-Forma" : "Fatura"} ao Cliente
                </h3>

                {invoiceSent ? (
                  <div className="text-center py-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    ✓ Documento enviado com sucesso!
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!sendContact) {
                        toast.error("Por favor, introduza o contacto.");
                        return;
                      }
                      if (createdVenda?.isProforma || isProforma) {
                        try {
                          const res = await proformaService.send(createdVenda.id, sendMethod, sendContact);
                          setInvoiceSent(true);
                          toast.success(res.msg || `Pró-Forma enviada com sucesso para ${sendContact} via ${sendMethod}!`);
                        } catch (err: any) {
                          toast.error(err?.message || "Erro ao enviar Pró-Forma.");
                        }
                      } else {
                        enviarFatura.mutate(
                          {
                            id: Number(createdVenda.id),
                            data: {
                              method: sendMethod,
                              contact: sendContact,
                            },
                          },
                          {
                            onSuccess: () => {
                              setInvoiceSent(true);
                              toast.success(
                                `Fatura solicitada para envio via ${
                                  sendMethod === "email" ? "E-mail" : "WhatsApp"
                                }!`
                              );
                            },
                          }
                        );
                      }
                    }}
                    className="space-y-3"
                  >
                    <div className="flex gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600 dark:text-gray-400 font-medium">
                        <input
                          type="radio"
                          name="posSendMethod"
                          value="email"
                          checked={sendMethod === "email"}
                          onChange={() => {
                            setSendMethod("email");
                            const client = clients.find(
                              (c: any) =>
                                String(c.id) === String(selectedClient)
                            );
                            setSendContact(client?.email || "");
                          }}
                          className="accent-indigo-600"
                        />
                        E-mail
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-600 dark:text-gray-400 font-medium">
                        <input
                          type="radio"
                          name="posSendMethod"
                          value="whatsapp"
                          checked={sendMethod === "whatsapp"}
                          onChange={() => {
                            setSendMethod("whatsapp");
                            const client = clients.find(
                              (c: any) =>
                                String(c.id) === String(selectedClient)
                            );
                            setSendContact(client?.telefone || "");
                          }}
                          className="accent-indigo-600"
                        />
                        WhatsApp
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type={sendMethod === "email" ? "email" : "text"}
                        placeholder={
                          sendMethod === "email"
                            ? "exemplo@cliente.com"
                            : "Telemóvel"
                        }
                        value={sendContact}
                        onChange={(e) => setSendContact(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <button
                        type="submit"
                        disabled={enviarFatura.isPending}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-colors disabled:opacity-50"
                      >
                        {enviarFatura.isPending ? "..." : "Enviar"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <button
              onClick={finishSale}
              className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-bold py-3.5 rounded-xl transition-all text-sm"
            >
              Novo Atendimento
            </button>
          </div>
        )}
      </div>
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

    {/* Order & Sales Receipt / PDF Modal */}
    <OrderReceiptModal
      isOpen={receiptModalOpen}
      onClose={() => setReceiptModalOpen(false)}
      documentData={receiptDocData}
    />
  </>
  );
}

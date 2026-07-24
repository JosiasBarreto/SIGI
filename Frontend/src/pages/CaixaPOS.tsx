import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  productService,
  clientService,
  orderService,
  documentService,
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
} from "lucide-react";
import { formatCurrency, cn } from "../lib/utils";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import ProductGrid from "./CaixaPOS/ProductGrid";
import CartList from "./CaixaPOS/CartList";
import { useCaixaCart } from "./CaixaPOS/useCaixaCart";
import { useCaixaSession } from "./CaixaPOS/useCaixaSession";
import CaixaSessionModals from "../components/CaixaSessionModals";

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
    displayProducts,
    subtotal,
    totalComIva,
    Iva,
    descontoAutomatico,
    total,
    addToCart: handleAddToCart,
    updateQty,
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

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error("Adicione produtos para continuar.");
      return;
    }
    setStep(2);
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
    if (paymentMethod === "Transferência" || paymentMethod === "TPA / POS") {
      if (!codigoTransferencia.trim()) {
        toast.error("Código de transferência / comprovativo é obrigatório.");
        return;
      }
      if (!emissor.trim()) {
        toast.error("Emissor / Titular do banco é obrigatório.");
        return;
      }
    }

    const valorPagoNum =
      isAgendado && valorPago !== "" ? parseFloat(valorPago) : total;

    if (paymentMethod === "Dinheiro" && amountReceived < valorPagoNum) {
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

      const mapCartToVendaItens = (
        quantidadesDisponiveis?: Record<number, number>
      ) =>
        cart.map((i) => {
          let tipoItem = "Produto";
          const cat = String(i.category || i.categoria || "").toLowerCase();
          if (cat.includes("servi") || cat.includes("servic")) {
            tipoItem = "Servico";
          }
          const preco = Number(i.salePrice || i.preco_venda || 0);
          const itemId = Number(i.id);
          const quantidade = quantidadesDisponiveis?.[itemId] ?? Number(i.qty);
          const descontoItem =
            descontoClientePercent > 0
              ? (preco * quantidade * descontoClientePercent) / 100
              : 0;
          return {
            item_id: itemId,
            item_tipo: tipoItem,
            descricao: i.name || i.nome || "Item de Venda",
            preco_unitario: preco,
            quantidade,
            desconto: descontoItem,
          };
        });

      const buildVendaPayload = (
        converterStockInsuficiente = false,
        valorPagamento = valorPagoNum
      ) => ({
        tipo_documento: "FR",
        cliente_id: selectedClient ? Number(selectedClient) : undefined,
        observacoes: "Venda direta via POS",
        converter_stock_insuficiente: converterStockInsuficiente,
        itens: mapCartToVendaItens(),
        pagamentos:
          valorPagamento > 0
            ? [
                {
                  forma_pagamento_id: paymentMethodId,
                  valor: valorPagamento,
                  codigo_transferencia:
                    paymentMethod !== "Dinheiro"
                      ? codigoTransferencia
                      : undefined,
                  emissor: paymentMethod !== "Dinheiro" ? emissor : undefined,
                },
              ]
            : [],
      });

      const d = new Date();
      const current_date = d.toISOString().split("T")[0];
      const current_time = d.toTimeString().split(" ")[0];

      // Build a strictly valid order creation payload
      const strFormaPagamento = paymentMethod === "Transferência" ? "Transferencia" : (paymentMethod === "TPA / POS" ? "POS" : "Dinheiro");

      const orderPayload: any = {
        forma_pagamento: strFormaPagamento,
        estado_pagamento: valorPagoNum >= total ? "Pago" : (valorPagoNum > 0 ? "Parcial" : "Pendente"),
        valor_pago: valorPagoNum,

        cliente_id: selectedClient ? Number(selectedClient) : null,
        tipo: "Simples",
        origem: "Balcao",
        data_entrega: isAgendado ? dataEntrega.split("T")[0] : current_date,
        hora_entrega: isAgendado
          ? `${dataEntrega.split("T")[1] || "12:00"}:00`.substring(0, 8)
          : current_time,
        estado: "Pendente",
        observacoes: `Pedido ${tipoPedido}. Caixa: #${caixaId}`,
        itens: cart.map((i) => {
          let tipoItem = "PRODUTO";
          const cat = String(i.category || i.categoria || "").toLowerCase();
          if (cat.includes("servi") || cat.includes("servic")) {
            tipoItem = "Servico";
          }

          const produtoId = isNaN(Number(i.id)) ? null : Number(i.id);

          return {
            tipo_item: tipoItem === "PRODUTO" ? "Produto" : tipoItem,
            produto_id: produtoId,
            descricao: i.name || i.nome || "Item de Venda",
            quantidade: Number(i.qty),
            preco_unitario: Number(i.salePrice || i.preco_venda || 0),
          };
        }),
      };

      if (tipoPedido === "Imediato") {
        // Venda Direta (Balcão)
        const vendaPayload = buildVendaPayload(false, valorPagoNum);
        const vendaRes = await createVenda.mutateAsync(vendaPayload);
        setCreatedVenda(vendaRes);
      } else {
        // Create the order first (Passo 1: POST /api/v1/pedidos)
        const createdOrder: any = await orderService.create(orderPayload);
        
        if (valorPagoNum > 0) {
          const vendaRes = await checkoutPedido.mutateAsync({
            pedido_id: createdOrder.id,
            pagamento: {
              observacoes: `Sinal de pagamento. Pedido Agendado.`,
              valor: valorPagoNum,
              forma_pagamento_id: paymentMethodId,
              codigo_transferencia: paymentMethod !== "Dinheiro" ? codigoTransferencia : undefined,
              emissor: paymentMethod !== "Dinheiro" ? emissor : undefined
            } as any,
          });
          setCreatedVenda(vendaRes);
        } else {
          // Just represent the pending order as a created venda
          setCreatedVenda({
            id: createdOrder.id,
            pedido_id: createdOrder.id,
            numero: createdOrder.numero,
            total: total,
            saldo: total,
            estado_pagamento: "PENDENTE",
            itens: createdOrder.itens
          });
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
    clearCart();
    setSelectedClient("");
    setAmountReceived(0);
    setPaymentMethod("Dinheiro");
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
    const printWindow = window.open("", "_blank", "width=360,height=640");
    if (!printWindow) {
      toast.error("Ative pop-ups para imprimir o recibo.");
      return;
    }
    const empresa = JSON.parse(localStorage.getItem("sigi_config") || "{}");
    const linhas = cart
      .map(
        (item) => `
      <tr>
        <td>${Number(item.qty)}x ${item.name || item.nome}</td>
        <td style="text-align:right">${formatCurrency(
          Number(item.salePrice || item.preco_venda || 0) * Number(item.qty)
        )}</td>
      </tr>
    `
      )
      .join("");
    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo ${
            venda.numero_documento || venda.numero || venda.id
          }</title>
          <style>
            body { width: 280px; font-family: monospace; font-size: 12px; color: #111; margin: 0; padding: 10px; }
            h1 { font-size: 16px; text-align: center; margin: 0 0 4px; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #111; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 0; vertical-align: top; }
            .total { font-size: 15px; font-weight: 700; }
          </style>
        </head>
        <body>
          <h1>${empresa.empresa || empresa.nome || "Sabor Imbatível"}</h1>
          <div class="center">NIF: ${empresa.nif || "N/D"}</div>
          <div class="center">${empresa.telefone || ""}</div>
          <div class="line"></div>
          <div>Doc: ${venda.numero_documento || venda.numero || venda.id}</div>
          <div>Data: ${new Date().toLocaleString("pt-PT")}</div>
          <div>Cliente: ${selectedClientObj?.nome || "Consumidor Final"}</div>
          <div class="line"></div>
          <table>${linhas}</table>
          <div class="line"></div>
          <table>
            <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(
              subtotal
            )}</td></tr>
            <tr><td>Desconto</td><td style="text-align:right">-${formatCurrency(
              descontoAutomatico
            )}</td></tr>
            <tr class="total"><td>Total</td><td style="text-align:right">${formatCurrency(
              total
            )}</td></tr>
          </table>
          <div class="line"></div>
          <div class="center">Obrigado pela preferência!</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
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
      <div className="h-[calc(100vh-8rem)] flex gap-6 overflow-hidden animate-fade-in">
      <div className="flex-1 bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between bg-white dark:bg-surface-dark z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calculator size={20} className="text-primary" />
              Produtos
            </h2>
            <div className="relative w-64 ml-4">
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
          </div>
          <div className="flex gap-2">
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
          handleAddToCart={handleAddToCart}
          formatCurrency={(val) =>
            new Intl.NumberFormat("pt-PT", {
              style: "currency",
              currency: config.moeda,
            }).format(val)
          }
        />
      </div>

      <div className="w-96 bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl flex flex-col shrink-0 shadow-sm overflow-hidden">
        {step === 1 && (
          <>
            <div className="p-4 border-b border-gray-200 dark:border-border-dark shrink-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart size={20} />
                Carrinho Atendimento
              </h2>
            </div>

            <div className="p-4 border-b border-gray-200 dark:border-border-dark shrink-0">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Cliente (Opcional)
              </label>
              
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full bg-white border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">Cliente ao Balcão</option>
                {clients.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.nome}
                  </option>
                ))}
              </select>
            </div>

            <CartList
              cart={cart}
              showPriceWithIva={true}
              formatCurrency={(val) =>
                new Intl.NumberFormat("pt-PT", {
                  style: "currency",
                  currency: config.moeda,
                }).format(val)
              }
              removeItem={removeItem}
              updateQty={updateQty}
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
                    <span>Desconto ({descontoClientePercent}%)</span>
                    <span>- {formatCurrency(descontoAutomatico)}</span>
                  </div>
                )}
                {/* IVA */}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{"IVA"}</span>
                  <span>{formatCurrency(Iva)}</span>
                </div>

                {/* IVA */}
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{showPriceWithIva ? "IVA incluído" : "IVA"}</span>
                  <span>{formatCurrency(totalComIva)}</span>
                </div>

                <div className="border-t border-dashed border-gray-300 dark:border-gray-700 pt-2 flex justify-between items-center">
                  <span className="font-semibold tracking-wide text-gray-700 dark:text-gray-300">
                    TOTAL A PAGAR
                  </span>

                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(totalComIva)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="
    w-full
    bg-primary
    hover:bg-primary-hover
    disabled:opacity-50
    disabled:cursor-not-allowed
    text-white
    font-semibold
    py-3.5
    rounded-xl
    transition-all
    shadow-lg
    shadow-primary/20
    flex
    justify-center
    items-center
    gap-2
  "
              >
                PROSSEGUIR PARA PAGAMENTO
              </button>
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
                    onClick={() => setTipoPedido("Imediato")}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold border transition-all",
                      tipoPedido === "Imediato"
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 hover:bg-gray-50"
                    )}
                  >
                    Levantamento Imediato
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoPedido("Agendado")}
                    className={cn(
                      "py-2 rounded-lg text-xs font-bold border transition-all",
                      tipoPedido === "Agendado"
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 hover:bg-gray-50"
                    )}
                  >
                    Agendar para Futuro
                  </button>
                </div>
              </div>

              {/* Conditional Scheduled fields */}
              {tipoPedido === "Agendado" && (
                <div className="p-3 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                  <h3 className="text-xs font-bold text-primary uppercase">
                    Configurações de Agendamento
                  </h3>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Data e Hora de Entrega *
                    </label>
                    <input
                      type="datetime-local"
                      value={dataEntrega}
                      onChange={(e) => setDataEntrega(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-medium text-gray-800 dark:text-gray-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Valor do Sinal / Depósito ({config.moeda})
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 50000 (Vazio para total)"
                      value={valorPago}
                      onChange={(e) => setValorPago(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-bold text-gray-800 dark:text-gray-100 outline-none"
                    />
                  </div>
                </div>
              )}

              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Resumo de Custo
              </p>
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-gray-500">
                  Valor total a faturar:
                </span>
                <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  {formatCurrency(
                    tipoPedido === "Agendado" && valorPago !== ""
                      ? parseFloat(valorPago)
                      : total
                  )}
                </span>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Método de Cobrança
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod("Dinheiro")}
                    className={cn(
                      "py-2.5 rounded-lg border text-xs flex flex-col items-center gap-1 transition-all font-semibold",
                      paymentMethod === "Dinheiro"
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <Banknote size={18} /> Dinheiro
                  </button>
                  <button
                    onClick={() => setPaymentMethod("TPA / POS")}
                    className={cn(
                      "py-2.5 rounded-lg border text-xs flex flex-col items-center gap-1 transition-all font-semibold",
                      paymentMethod === "TPA / POS"
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <CreditCard size={18} /> TPA / POS
                  </button>
                  <button
                    onClick={() => setPaymentMethod("Transferência")}
                    className={cn(
                      "py-2.5 rounded-lg border text-xs flex flex-col items-center gap-1 transition-all font-semibold col-span-2",
                      paymentMethod === "Transferência"
                        ? "bg-primary/10 border-primary text-primary"
                        : "border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <FileText size={18} /> Transferência Bancária
                  </button>
                </div>
              </div>

              {/* Conditional Transferencia & POS fields */}
              {(paymentMethod === "Transferência" ||
                paymentMethod === "TPA / POS") && (
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/30 space-y-3">
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase">
                    Dados da Transação
                  </h4>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Código de Confirmação / Comprovativo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: TRX12345678"
                      value={codigoTransferencia}
                      onChange={(e) => setCodigoTransferencia(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-medium text-gray-800 dark:text-gray-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Emissor / Titular da Conta / Banco *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Manuel Silva (BCP)"
                      value={emissor}
                      onChange={(e) => setEmissor(e.target.value)}
                      className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-medium text-gray-800 dark:text-gray-100 outline-none"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "Dinheiro" && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Valor Recebido ({config.moeda})
                  </label>
                  <input
                    type="number"
                    value={amountReceived || ""}
                    onChange={(e) => setAmountReceived(Number(e.target.value))}
                    className="w-full text-lg bg-gray-50 border border-gray-300 dark:border-gray-700 dark:bg-gray-800 rounded-xl px-4 py-2.5 outline-none focus:border-primary font-bold text-gray-800 dark:text-white"
                  />
                  {amountReceived >
                    (tipoPedido === "Agendado" && valorPago !== ""
                      ? parseFloat(valorPago)
                      : total) && (
                    <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 rounded-xl flex justify-between items-baseline">
                      <span className="font-bold text-xs text-orange-800 dark:text-orange-400">
                        Troco a devolver:
                      </span>
                      <span className="font-bold text-base text-orange-600 dark:text-orange-300">
                        {formatCurrency(
                          amountReceived -
                            (tipoPedido === "Agendado" && valorPago !== ""
                              ? parseFloat(valorPago)
                              : total)
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}
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
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() =>
                      documentService
                        .vendaPdf(createdVenda.id)
                        .catch((err) =>
                          toast.error(err.message || "Erro ao abrir PDF.")
                        )
                    }
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors"
                  >
                    PDF oficial
                  </button>
                  <button
                    type="button"
                    onClick={() => printThermalReceipt(createdVenda)}
                    className="px-3 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold transition-colors"
                  >
                    Recibo térmico
                  </button>
                </div>
                <h3 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                  Enviar Fatura ao Cliente
                </h3>

                {invoiceSent ? (
                  <div className="text-center py-2 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    ✓ Fatura enviada com sucesso para processamento!
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!sendContact) {
                        toast.error("Por favor, introduza o contacto.");
                        return;
                      }
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
  </>
  );
}

import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Calendar, DollarSign, Plus, Search, 
  Trash2, FileText, Check, X, Lock, Unlock, 
  Printer, Clock, ArrowUpRight, ArrowDownRight, 
  Users, Building2, CreditCard, CheckCircle2, ChevronRight, 
  AlertTriangle, Filter, List, Activity, Layers, Tag
} from 'lucide-react';

const API_URL = '/api/v1';

interface PedidoCaixaEventosProps {
  token: string | null;
  getHeaders: () => any;
  showFeedback: (type: 'success' | 'error', message: string) => void;
}

export default function PedidoCaixaEventos({ token, getHeaders, showFeedback }: PedidoCaixaEventosProps) {
  // Navigation tabs for this single page
  const [activeTab, setActiveTab] = useState<'vendas' | 'eventos' | 'caixa' | 'historico'>('vendas');

  // Shared Core States
  const [produtos, setProdutos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [caixas, setCaixas] = useState<any[]>([]);
  const [activeCaixa, setActiveCaixa] = useState<any | null>(null);
  const [ivas, setIvas] = useState<any[]>([]);
  const [espacos, setEspacos] = useState<any[]>([]);
  const [eventos, setEventos] = useState<any[]>([]);
  const [vendas, setVendas] = useState<any[]>([]);
  const [pedidos, setPedidos] = useState<any[]>([]);
  
  // Loading indicators
  const [loading, setLoading] = useState(false);

  // --- STATE FOR TABS ---
  
  // Tab 1: Vendas & Pedidos (POS Cart)
  const [cart, setCart] = useState<any[]>([]);
  const [searchProduct, setSearchProduct] = useState('');
  const [selectedProductType, setSelectedProductType] = useState<string>('all');
  const [selectedClienteId, setSelectedClienteId] = useState<string>('');
  const [dataEntrega, setDataEntrega] = useState<string>('');
  const [tipoPagamento, setTipoPagamento] = useState<'imediato' | 'parcelas' | 'deferido'>('imediato');
  const [formaPagamentoId, setFormaPagamentoId] = useState<number>(1); // 1 = Dinheiro, 2 = Transferencia, 3 = POS Card
  const [valorPagoInicial, setValorPagoInicial] = useState<string>('');
  const [codigoTransferencia, setCodigoTransferencia] = useState<string>('');
  const [emissor, setEmissor] = useState<string>('');
  const [posTransId, setPosTransId] = useState<string>('');
  const [observacoesVenda, setObservacoesVenda] = useState<string>('');
  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const [novoCliente, setNovoCliente] = useState({ nome: '', telefone: '', email: '', nif: '' });

  // Tab 2: Eventos & Catering
  const [selectedEventClienteId, setSelectedEventClienteId] = useState<string>('');
  const [tipoEvento, setTipoEvento] = useState<string>('Outro');
  const [tituloEvento, setTituloEvento] = useState<string>('');
  const [descricaoEvento, setDescricaoEvento] = useState<string>('');
  const [localEvento, setLocalEvento] = useState<string>('');
  const [dataEvento, setDataEvento] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('');
  const [horaFim, setHoraFim] = useState<string>('');
  const [numeroConvidados, setNumeroConvidados] = useState<number>(10);
  const [observacoesEvento, setObservacoesEvento] = useState<string>('');
  const [eventServices, setEventServices] = useState<any[]>([]);
  const [eventSpaces, setEventSpaces] = useState<any[]>([]);
  const [newServiceType, setNewServiceType] = useState<string>('Cozinha');
  const [newServiceDesc, setNewServiceDesc] = useState<string>('');
  const [newServiceQty, setNewServiceQty] = useState<string>('1');
  const [newServicePrice, setNewServicePrice] = useState<string>('0.00');
  const [newSpaceId, setNewSpaceId] = useState<string>('');
  
  // Tab 3: Gestão de Caixa
  const [fundoAbertura, setFundoAbertura] = useState<string>('');
  const [manualMovType, setManualMovType] = useState<'Entrada' | 'Saida'>('Entrada');
  const [manualMovTipoEnum, setManualMovTipoEnum] = useState<string>('Reforco'); // Reforco, Sangria, Ajuste
  const [manualMovValue, setManualMovValue] = useState<string>('');
  const [manualMovDesc, setManualMovDesc] = useState<string>('');
  const [manualMovFormaPg, setManualMovFormaPg] = useState<string>('Dinheiro');
  // Closing Cash fields
  const [declaredDinheiro, setDeclaredDinheiro] = useState<string>('');
  const [declaredTransferencia, setDeclaredTransferencia] = useState<string>('');
  const [declaredPOS, setDeclaredPOS] = useState<string>('');
  const [divergenceReason, setDivergenceReason] = useState<string>('');

  // Tab 4: Histórico de Vendas & Checkout de Pedidos
  const [searchVendas, setSearchVendas] = useState('');
  const [selectedVendaDetails, setSelectedVendaDetails] = useState<any | null>(null);
  const [paymentRegisterVendaId, setPaymentRegisterVendaId] = useState<number | null>(null);
  const [registerPayValue, setRegisterPayValue] = useState<string>('');
  const [registerPayFormaId, setRegisterPayFormaId] = useState<number>(1);
  const [registerPayCode, setRegisterPayCode] = useState<string>('');
  const [registerPayEmissor, setRegisterPayEmissor] = useState<string>('');

  // Initial Data Loading
  useEffect(() => {
    if (token) {
      loadInitialData();
    }
  }, [token]);

  const loadInitialData = async () => {
    setLoading(true);
    await Promise.all([
      fetchProdutos(),
      fetchClientes(),
      fetchCaixas(),
      fetchIvas(),
      fetchEspacos(),
      fetchEventos(),
      fetchVendas(),
      fetchPedidos()
    ]);
    setLoading(false);
  };

  const fetchProdutos = async () => {
    try {
      const res = await fetch(`${API_URL}/armazem/produtos`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setProdutos(Array.isArray(data) ? data : data.items || []);
      }
    } catch (e) {
      console.error("Erro ao carregar produtos:", e);
    }
  };

  const fetchClientes = async () => {
    try {
      const res = await fetch(`${API_URL}/pedidos/clientes`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setClientes(Array.isArray(data) ? data : data.items || []);
      }
    } catch (e) {
      console.error("Erro ao carregar clientes:", e);
    }
  };

  const fetchCaixas = async () => {
    try {
      const res = await fetch(`${API_URL}/financeiro/caixas`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.items || [];
        setCaixas(list);
        const openSession = list.find((c: any) => c.estado === 'Aberto');
        setActiveCaixa(openSession || null);
      }
    } catch (e) {
      console.error("Erro ao carregar sessões de caixa:", e);
    }
  };

  const fetchIvas = async () => {
    try {
      const res = await fetch(`${API_URL}/vendas/ivas`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setIvas(data);
      }
    } catch (e) {
      console.error("Erro ao carregar taxas de IVA:", e);
    }
  };

  const fetchEspacos = async () => {
    try {
      const res = await fetch(`${API_URL}/eventos/espacos`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEspacos(data);
      }
    } catch (e) {
      console.error("Erro ao carregar espaços de evento:", e);
    }
  };

  const fetchEventos = async () => {
    try {
      const res = await fetch(`${API_URL}/eventos`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setEventos(Array.isArray(data) ? data : data.items || []);
      }
    } catch (e) {
      console.error("Erro ao carregar eventos:", e);
    }
  };

  const fetchVendas = async () => {
    try {
      const res = await fetch(`${API_URL}/vendas`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setVendas(Array.isArray(data) ? data : data.items || []);
      }
    } catch (e) {
      console.error("Erro ao carregar histórico de faturamento:", e);
    }
  };

  const fetchPedidos = async () => {
    try {
      const res = await fetch(`${API_URL}/pedidos`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setPedidos(Array.isArray(data) ? data : data.items || []);
      }
    } catch (e) {
      console.error("Erro ao carregar pedidos:", e);
    }
  };

  // --- ACTIONS FOR TAB 1: CART / POS ---

  const getFilteredProdutos = () => {
    return produtos.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(searchProduct.toLowerCase()) || 
                            p.codigo.toLowerCase().includes(searchProduct.toLowerCase());
      const matchesType = selectedProductType === 'all' || p.tipo === selectedProductType;
      // Exclui consumíveis de venda direta por padrão para respeitar regra de negócio
      const notConsumable = p.tipo !== 'Consumivel'; 
      return matchesSearch && matchesType && notConsumable;
    });
  };

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantidade: item.quantidade + 1 } : item));
    } else {
      setCart([...cart, { 
        id: product.id, 
        nome: product.nome, 
        codigo: product.codigo,
        preco: parseFloat(product.preco_venda || 0), 
        quantidade: 1, 
        desconto: 0,
        taxa_iva_id: product.taxa_iva_id,
        taxa_iva_percent: product.taxas_iva ? parseFloat(product.taxas_iva.percentagem) : 14.0
      }]);
    }
  };

  const updateCartQty = (id: number, qty: number) => {
    if (qty <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item => item.id === id ? { ...item, quantidade: qty } : item));
    }
  };

  const updateCartDiscount = (id: number, discount: number) => {
    setCart(cart.map(item => item.id === id ? { ...item, desconto: Math.max(0, discount) } : item));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const getCartTotals = () => {
    let subtotal = 0;
    let totalIva = 0;
    let discount = 0;

    cart.forEach(item => {
      const itemSubtotal = item.preco * item.quantidade;
      const itemAfterDiscount = Math.max(0, itemSubtotal - item.desconto);
      const itemIva = itemAfterDiscount * (item.taxa_iva_percent / 100);
      
      subtotal += itemSubtotal;
      discount += item.desconto;
      totalIva += itemIva;
    });

    return {
      subtotal,
      discount,
      totalIva,
      total: subtotal - discount + totalIva
    };
  };

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/pedidos/clientes`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(novoCliente)
      });
      if (res.ok) {
        const saved = await res.json();
        showFeedback('success', `Cliente '${saved.nome}' registado com sucesso!`);
        await fetchClientes();
        setSelectedClienteId(saved.id.toString());
        setNovoCliente({ nome: '', telefone: '', email: '', nif: '' });
        setMostrarNovoCliente(false);
      } else {
        const err = await res.json();
        showFeedback('error', err.msg || 'Erro ao registar cliente');
      }
    } catch (e) {
      showFeedback('error', 'Falha na rede ao registar cliente');
    }
  };

  const handleSubmitVendaOuPedido = async () => {
    if (cart.length === 0) {
      showFeedback('error', 'O cesto está vazio!');
      return;
    }

    const { total, totalIva, subtotal, discount } = getCartTotals();

    // Se houver data de entrega, trata-se de um Pedido Agendado. Caso contrário, é uma venda imediata (Venda a Dinheiro / Balcão).
    if (dataEntrega) {
      // 1. Criar o Pedido
      const pedidoPayload = {
        cliente_id: selectedClienteId ? parseInt(selectedClienteId) : null,
        data_entrega: dataEntrega,
        observacoes: observacoesVenda,
        itens: cart.map(item => ({
          produto_id: item.id,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
          desconto: item.desconto
        })),
        tipo_pagamento: tipoPagamento,
        valor_pago: tipoPagamento === 'imediato' ? total : tipoPagamento === 'parcelas' ? parseFloat(valorPagoInicial || '0') : 0.0
      };

      try {
        const res = await fetch(`${API_URL}/pedidos`, {
          method: 'POST',
          headers: { ...getHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(pedidoPayload)
        });

        if (res.ok) {
          const created = await res.json();
          showFeedback('success', `Pedido Nº ${created.numero} registado! Ordens de produção geradas automaticamente.`);
          
          // Se tiver pagamento inicial, registrar pagamento e fluxo de caixa
          if (pedidoPayload.valor_pago > 0 && created.id) {
            const payPayload = {
              valor: pedidoPayload.valor_pago,
              forma_pagamento_id: formaPagamentoId,
              codigo_transferencia: (formaPagamentoId === 2 || formaPagamentoId === 3) ? (codigoTransferencia || posTransId) : null,
              emissor: (formaPagamentoId === 2 || formaPagamentoId === 3) ? emissor : null
            };
            await fetch(`${API_URL}/pedidos/${created.id}/pagamentos`, {
              method: 'POST',
              headers: { ...getHeaders(), 'Content-Type': 'application/json' },
              body: JSON.stringify(payPayload)
            });
          }

          setCart([]);
          setDataEntrega('');
          setObservacoesVenda('');
          setValorPagoInicial('');
          setCodigoTransferencia('');
          setEmissor('');
          setPosTransId('');
          await Promise.all([fetchPedidos(), fetchVendas(), fetchCaixas()]);
        } else {
          const err = await res.json();
          showFeedback('error', err.msg || 'Erro ao criar pedido');
        }
      } catch (e) {
        showFeedback('error', 'Erro na ligação com o servidor');
      }
    } else {
      // É uma Venda Direta Imediata
      if (!activeCaixa) {
        showFeedback('error', 'Sessão de Caixa fechada! Abra o caixa para aceitar vendas.');
        return;
      }

      const vendaPayload = {
        tipo_documento: 'FR', // Factura Recibo por padrão para POS na hora
        cliente_id: selectedClienteId ? parseInt(selectedClienteId) : null,
        observacoes: observacoesVenda,
        itens: cart.map(item => ({
          item_tipo: 'Produto',
          item_id: item.id,
          descricao: item.nome,
          quantidade: item.quantidade,
          preco_unitario: item.preco,
          desconto: item.desconto,
          taxa_iva_id: item.taxa_iva_id
        }))
      };

      try {
        const res = await fetch(`${API_URL}/vendas`, {
          method: 'POST',
          headers: { ...getHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify(vendaPayload)
        });

        if (res.ok) {
          const created = await res.json();
          showFeedback('success', `Venda registada com sucesso! Fatura-Recibo: ${created.numero_documento}`);

          // Se for pagamento imediato na hora, liquidar a venda imediatamente
          const pgPayload = {
            valor: total,
            forma_pagamento_id: formaPagamentoId,
            codigo_transferencia: (formaPagamentoId === 2 || formaPagamentoId === 3) ? (codigoTransferencia || posTransId) : null,
            emissor: (formaPagamentoId === 2 || formaPagamentoId === 3) ? emissor : null
          };

          await fetch(`${API_URL}/vendas/${created.id}/pagamentos`, {
            method: 'POST',
            headers: { ...getHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(pgPayload)
          });

          setCart([]);
          setObservacoesVenda('');
          setCodigoTransferencia('');
          setEmissor('');
          setPosTransId('');
          await Promise.all([fetchVendas(), fetchCaixas()]);
        } else {
          const err = await res.json();
          showFeedback('error', err.error || err.msg || 'Erro ao registar venda');
        }
      } catch (e) {
        showFeedback('error', 'Erro de rede ao registar venda');
      }
    }
  };

  // --- ACTIONS FOR TAB 2: EVENTS ---

  const addServiceToEvent = () => {
    if (!newServiceDesc) {
      showFeedback('error', 'Descreva o serviço para o evento!');
      return;
    }
    setEventServices([...eventServices, {
      tipo: newServiceType,
      descricao: newServiceDesc,
      quantidade: parseFloat(newServiceQty),
      valor_unitario: parseFloat(newServicePrice)
    }]);
    setNewServiceDesc('');
    setNewServiceQty('1');
    setNewServicePrice('0.00');
  };

  const removeServiceFromEvent = (index: number) => {
    setEventServices(eventServices.filter((_, idx) => idx !== index));
  };

  const addSpaceToEvent = () => {
    if (!newSpaceId) return;
    const space = espacos.find(e => e.id === parseInt(newSpaceId));
    if (!space) return;

    if (!dataEvento || !horaInicio || !horaFim) {
      showFeedback('error', 'Defina a data e horário do evento primeiro!');
      return;
    }

    setEventSpaces([...eventSpaces, {
      espaco_id: space.id,
      nome: space.nome,
      data_inicio: `${dataEvento}T${horaInicio}:00`,
      data_fim: `${dataEvento}T${horaFim}:00`
    }]);
    setNewSpaceId('');
  };

  const removeSpaceFromEvent = (index: number) => {
    setEventSpaces(eventSpaces.filter((_, idx) => idx !== index));
  };

  const handleCreateEvento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventClienteId) {
      showFeedback('error', 'Selecione um cliente para o evento!');
      return;
    }

    const payload = {
      cliente_id: parseInt(selectedEventClienteId),
      tipo_evento: tipoEvento,
      titulo: tituloEvento,
      descricao: descricaoEvento,
      local_evento: localEvento,
      data_evento: dataEvento,
      hora_inicio: `${horaInicio}:00`,
      hora_fim: `${horaFim}:00`,
      numero_convidados: numeroConvidados,
      observacoes: observacoesEvento,
      servicos: eventServices,
      reservas_espaco: eventSpaces.map(s => ({
        espaco_id: s.espaco_id,
        data_inicio: s.data_inicio,
        data_fim: s.data_fim
      }))
    };

    try {
      const res = await fetch(`${API_URL}/eventos`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showFeedback('success', 'Evento agendado com sucesso!');
        // Reset form
        setTituloEvento('');
        setDescricaoEvento('');
        setLocalEvento('');
        setDataEvento('');
        setHoraInicio('');
        setHoraFim('');
        setObservacoesEvento('');
        setEventServices([]);
        setEventSpaces([]);
        await fetchEventos();
      } else {
        const err = await res.json();
        showFeedback('error', err.msg || 'Erro ao agendar evento');
      }
    } catch (e) {
      showFeedback('error', 'Ligação ao servidor falhou');
    }
  };

  const handleUpdateEventStatus = async (id: number, state: string) => {
    try {
      const res = await fetch(`${API_URL}/eventos/${id}/estado`, {
        method: 'PUT',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: state })
      });
      if (res.ok) {
        showFeedback('success', 'Estado do evento atualizado!');
        await fetchEventos();
      } else {
        const err = await res.json();
        showFeedback('error', err.msg || 'Erro ao atualizar estado');
      }
    } catch (e) {
      showFeedback('error', 'Falha de ligação ao servidor');
    }
  };

  const handleFaturarEvento = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/eventos/${id}/faturar`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        const data = await res.json();
        showFeedback('success', 'Evento faturado com sucesso! Venda gerada.');
        await Promise.all([fetchEventos(), fetchVendas()]);
      } else {
        const err = await res.json();
        showFeedback('error', err.msg || 'Erro ao faturar evento');
      }
    } catch (e) {
      showFeedback('error', 'Falha de ligação ao servidor');
    }
  };

  // --- ACTIONS FOR TAB 3: CAIXA ---

  const handleAbrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/financeiro/caixas`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_inicial: parseFloat(fundoAbertura || '0') })
      });
      if (res.ok) {
        showFeedback('success', 'Sessão de Caixa aberta com sucesso!');
        setFundoAbertura('');
        await fetchCaixas();
      } else {
        const err = await res.json();
        showFeedback('error', err.msg || 'Erro ao abrir caixa');
      }
    } catch (e) {
      showFeedback('error', 'Falha de ligação');
    }
  };

  const handleRegistrarMovimentoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCaixa) return;

    const payload = {
      caixa_id: activeCaixa.id,
      tipo: manualMovType,
      valor: parseFloat(manualMovValue),
      descricao: `Manual [${manualMovTipoEnum}]: ${manualMovDesc}`,
      forma_pagamento: manualMovFormaPg
    };

    try {
      const res = await fetch(`${API_URL}/financeiro/caixas/${activeCaixa.id}/movimentos`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showFeedback('success', 'Movimento registado!');
        setManualMovValue('');
        setManualMovDesc('');
        await fetchCaixas();
      } else {
        const err = await res.json();
        showFeedback('error', err.msg || 'Erro ao registar movimento');
      }
    } catch (e) {
      showFeedback('error', 'Erro ao registar movimento no servidor');
    }
  };

  const handleFecharCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCaixa) return;

    const payload = {
      valor_declarado_dinheiro: parseFloat(declaredDinheiro || '0'),
      valor_declarado_transferencia: parseFloat(declaredTransferencia || '0'),
      valor_declarado_pos: parseFloat(declaredPOS || '0'),
      explicacao_divergencia: divergenceReason || ''
    };

    try {
      const res = await fetch(`${API_URL}/financeiro/caixas/${activeCaixa.id}/fechar`, {
        method: 'PUT',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showFeedback('success', 'Caixa encerrado com sucesso!');
        setDeclaredDinheiro('');
        setDeclaredTransferencia('');
        setDeclaredPOS('');
        setDivergenceReason('');
        await fetchCaixas();
      } else {
        const err = await res.json();
        showFeedback('error', err.msg || 'Erro ao encerrar caixa');
      }
    } catch (e) {
      showFeedback('error', 'Erro ao fechar caixa no servidor');
    }
  };

  // --- ACTIONS FOR TAB 4: HISTORY & RECEIPTS ---

  const getFilteredVendas = () => {
    return vendas.filter(v => {
      return v.numero_documento.toLowerCase().includes(searchVendas.toLowerCase()) ||
             v.tipo.toLowerCase().includes(searchVendas.toLowerCase()) ||
             v.estado.toLowerCase().includes(searchVendas.toLowerCase());
    });
  };

  const handleLoadVendaDetails = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/vendas/${id}`, { headers: getHeaders() });
      if (res.ok) {
        const details = await res.json();
        setSelectedVendaDetails(details);
      }
    } catch (e) {
      showFeedback('error', 'Erro ao carregar detalhes da venda');
    }
  };

  const handlePrintVenda = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/vendas/${id}/pdf`, { headers: getHeaders() });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Venda_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showFeedback('success', 'PDF descarregado com sucesso!');
      } else {
        showFeedback('error', 'Erro ao exportar PDF');
      }
    } catch (e) {
      showFeedback('error', 'Erro de rede');
    }
  };

  const handleCancelVenda = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/vendas/${id}/cancelar`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      if (res.ok) {
        showFeedback('success', 'Venda cancelada com sucesso!');
        setSelectedVendaDetails(null);
        await fetchVendas();
      } else {
        const err = await res.json();
        showFeedback('error', err.error || 'Erro ao cancelar faturamento');
      }
    } catch (e) {
      showFeedback('error', 'Erro ao conectar ao servidor');
    }
  };

  const handleRegisterPaymentForVenda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentRegisterVendaId) return;

    const payload = {
      valor: parseFloat(registerPayValue),
      forma_pagamento_id: registerPayFormaId,
      codigo_transferencia: (registerPayFormaId === 2 || registerPayFormaId === 3) ? registerPayCode : null,
      emissor: (registerPayFormaId === 2 || registerPayFormaId === 3) ? registerPayEmissor : null
    };

    try {
      const res = await fetch(`${API_URL}/vendas/${paymentRegisterVendaId}/pagamentos`, {
        method: 'POST',
        headers: { ...getHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showFeedback('success', 'Pagamento faturado e liquidado com sucesso!');
        setPaymentRegisterVendaId(null);
        setRegisterPayValue('');
        setRegisterPayCode('');
        setRegisterPayEmissor('');
        await Promise.all([fetchVendas(), fetchCaixas()]);
        if (selectedVendaDetails && selectedVendaDetails.id === paymentRegisterVendaId) {
          await handleLoadVendaDetails(paymentRegisterVendaId);
        }
      } else {
        const err = await res.json();
        showFeedback('error', err.msg || 'Erro ao faturar pagamento');
      }
    } catch (e) {
      showFeedback('error', 'Erro no servidor');
    }
  };

  const getEventTotal = (evt: any) => {
    let tot = 0;
    if (evt.servicos) {
      evt.servicos.forEach((s: any) => {
        tot += parseFloat(s.quantidade) * parseFloat(s.valor_unitario);
      });
    }
    return tot;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Title & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-500 animate-pulse" />
            Terminal de Operações Comerciais
          </h1>
          <p className="text-sm text-slate-400 mt-1">Efetue vendas rápidas, agende pedidos de buffet e catering, configure caixas e audite transações.</p>
        </div>

        {/* Cashier status badge */}
        <div className="flex items-center gap-3">
          {activeCaixa ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Unlock className="w-3.5 h-3.5" />
              Caixa Aberto: {activeCaixa.numero}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              Caixa Fechado
            </div>
          )}
          <button 
            onClick={loadInitialData} 
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white text-xs font-medium transition-all"
          >
            Sincronizar
          </button>
        </div>
      </div>

      {/* Internal Tabs Bar */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('vendas')}
          className={`px-5 py-3 border-b-2 font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'vendas' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          🛍️ Vendas &amp; POS
        </button>

        <button
          onClick={() => setActiveTab('eventos')}
          className={`px-5 py-3 border-b-2 font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'eventos' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          📅 Catering &amp; Eventos
        </button>

        <button
          onClick={() => setActiveTab('caixa')}
          className={`px-5 py-3 border-b-2 font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'caixa' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          💰 Gestão de Caixa
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          className={`px-5 py-3 border-b-2 font-semibold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'historico' 
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          📜 Histórico de Faturação
        </button>
      </div>

      {loading && (
        <div className="py-20 text-center text-slate-400 text-sm">
          A carregar dados do terminal...
        </div>
      )}

      {!loading && (
        <div className="space-y-6">

          {/* TAB 1: VENDAS & POS */}
          {activeTab === 'vendas' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Product Catalog & Client Selector */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Catalog Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-lg font-bold text-white">Catálogo de Venda Direta</h2>
                    
                    {/* Search & Type filter */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-48">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                        <input 
                          type="text" 
                          placeholder="Pesquisar..." 
                          className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                          value={searchProduct}
                          onChange={(e) => setSearchProduct(e.target.value)}
                        />
                      </div>
                      <select 
                        className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                        value={selectedProductType}
                        onChange={(e) => setSelectedProductType(e.target.value)}
                      >
                        <option value="all">Todos Tipos</option>
                        <option value="Acabado">Produzido (Cozinha/Past.)</option>
                        <option value="Revenda">Revenda (Bebidas, etc.)</option>
                      </select>
                    </div>
                  </div>

                  {getFilteredProdutos().length === 0 ? (
                    <p className="text-center text-slate-500 text-xs py-8">Nenhum produto encontrado para venda.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-1">
                      {getFilteredProdutos().map(p => (
                        <div 
                          key={p.id}
                          onClick={() => addToCart(p)}
                          className="bg-slate-950 border border-slate-850 hover:border-indigo-500/40 p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center group"
                        >
                          <div>
                            <span className={`text-[9px] px-1.5 py-0.5 font-bold rounded ${
                              p.tipo === 'Acabado' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-sky-500/10 text-sky-400'
                            }`}>
                              {p.tipo}
                            </span>
                            <h4 className="text-sm font-bold text-white mt-2 group-hover:text-indigo-400 transition-colors">{p.nome}</h4>
                            <span className="text-[10px] text-slate-500 font-mono mt-1 block">{p.codigo}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-emerald-400 font-mono">{(parseFloat(p.preco_venda || 0)).toFixed(2)} €</span>
                            <span className="text-[9px] text-slate-600 block mt-1">IVA: {p.taxas_iva?.percentagem || '14'}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cliente Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-bold text-white">Faturar ao Cliente</h3>
                    <button 
                      onClick={() => setMostrarNovoCliente(!mostrarNovoCliente)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                    >
                      {mostrarNovoCliente ? 'Selecionar Existente' : '+ Registar Novo Cliente'}
                    </button>
                  </div>

                  {mostrarNovoCliente ? (
                    <form onSubmit={handleRegisterClient} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Nome Completo</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 transition-all"
                          value={novoCliente.nome}
                          onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Telefone / Contacto</label>
                        <input 
                          type="text" 
                          required
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 transition-all"
                          value={novoCliente.telefone}
                          onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Endereço de Email</label>
                        <input 
                          type="email" 
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 transition-all"
                          value={novoCliente.email}
                          onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">NIF</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-indigo-500 transition-all"
                          value={novoCliente.nif}
                          onChange={(e) => setNovoCliente({ ...novoCliente, nif: e.target.value })}
                        />
                      </div>
                      <div className="sm:col-span-2 text-right">
                        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-lg transition-colors">
                          Gravar Cliente
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Escolher Cliente</label>
                        <select 
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                          value={selectedClienteId}
                          onChange={(e) => setSelectedClienteId(e.target.value)}
                        >
                          <option value="">-- Cliente de Balcão (Anónimo) --</option>
                          {clientes.map(c => (
                            <option key={c.id} value={c.id}>{c.nome} ({c.telefone})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Agendar Entrega (Deixe vazio para POS na hora)</label>
                        <input 
                          type="date" 
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                          value={dataEntrega}
                          onChange={(e) => setDataEntrega(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* POS Cart Summary Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center justify-between">
                    <span>Cesto de Compras</span>
                    {cart.length > 0 && (
                      <button onClick={() => setCart([])} className="text-rose-500 hover:text-rose-400 text-xs flex items-center gap-1">
                        <Trash2 className="w-3.5 h-3.5" /> Limpar
                      </button>
                    )}
                  </h3>

                  {cart.length === 0 ? (
                    <div className="text-center py-16 bg-slate-950/40 border border-slate-850 rounded-xl mt-4 text-slate-500 space-y-2">
                      <ShoppingBag className="w-8 h-8 mx-auto text-slate-600" />
                      <p className="text-xs">Selecione itens ao lado para faturar.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1 mt-4">
                      {cart.map(item => (
                        <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex justify-between items-center gap-2 text-xs">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-white truncate">{item.nome}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{item.preco.toFixed(2)} € x {item.quantidade}</p>
                            <input 
                              type="number" 
                              placeholder="Desconto €"
                              className="bg-slate-900 border border-slate-800 text-[10px] px-1.5 py-0.5 rounded text-rose-400 w-20 font-mono mt-1 focus:outline-none"
                              value={item.desconto || ''}
                              onChange={(e) => updateCartDiscount(item.id, parseFloat(e.target.value || '0'))}
                            />
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => updateCartQty(item.id, item.quantidade - 1)}
                              className="w-6 h-6 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-400 hover:text-rose-500 flex items-center justify-center text-xs font-bold"
                            >
                              -
                            </button>
                            <span className="font-semibold text-white font-mono min-w-4 text-center">{item.quantidade}</span>
                            <button 
                              onClick={() => updateCartQty(item.id, item.quantidade + 1)}
                              className="w-6 h-6 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-400 hover:text-indigo-400 flex items-center justify-center text-xs font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold uppercase">Subtotal</span>
                      <span className="font-mono text-slate-300">{getCartTotals().subtotal.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold uppercase">Desconto Total</span>
                      <span className="font-mono text-rose-400">-{getCartTotals().discount.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-semibold uppercase">IVA</span>
                      <span className="font-mono text-slate-300">{getCartTotals().totalIva.toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <span className="text-slate-200 font-bold uppercase">Total Geral</span>
                      <span className="text-lg font-bold font-mono text-white">{getCartTotals().total.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>

                {/* Settle Details Form */}
                {cart.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    
                    {/* Se for pedido agendado, habilita tipo de pagamento */}
                    {dataEntrega ? (
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Modalidade do Pedido</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button 
                            type="button"
                            onClick={() => setTipoPagamento('imediato')}
                            className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold text-center transition-all ${
                              tipoPagamento === 'imediato' 
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            Pagar Tudo
                          </button>
                          <button 
                            type="button"
                            onClick={() => setTipoPagamento('parcelas')}
                            className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold text-center transition-all ${
                              tipoPagamento === 'parcelas' 
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            Sinal / Entrada
                          </button>
                          <button 
                            type="button"
                            onClick={() => setTipoPagamento('deferido')}
                            className={`py-1.5 px-2 rounded-xl border text-[10px] font-bold text-center transition-all ${
                              tipoPagamento === 'deferido' 
                                ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' 
                                : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800'
                            }`}
                          >
                            Pagar na Entrega
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-950 p-2 rounded-lg border border-slate-850 text-[10px] text-slate-400 text-center font-semibold">
                        ⚡ Venda Imediata de Balcão (Pagamento Integral na Hora)
                      </div>
                    )}

                    {/* Forma de Pagamento */}
                    {(tipoPagamento !== 'deferido' || !dataEntrega) && (
                      <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Método de Liquidação</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button 
                              type="button" 
                              onClick={() => setFormaPagamentoId(1)}
                              className={`py-2 px-1 rounded-lg border text-center text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                                formaPagamentoId === 1 ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                              }`}
                            >
                              <DollarSign className="w-3.5 h-3.5" /> Dinheiro
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setFormaPagamentoId(2)}
                              className={`py-2 px-1 rounded-lg border text-center text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                                formaPagamentoId === 2 ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                              }`}
                            >
                              <Building2 className="w-3.5 h-3.5" /> Transf.
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setFormaPagamentoId(3)}
                              className={`py-2 px-1 rounded-lg border text-center text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                                formaPagamentoId === 3 ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                              }`}
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Multicaixa
                            </button>
                          </div>
                        </div>

                        {dataEntrega && tipoPagamento === 'parcelas' && (
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Valor de Entrada / Sinal (€)</label>
                            <input 
                              type="number" 
                              required
                              placeholder="0.00"
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-mono focus:outline-none"
                              value={valorPagoInicial}
                              onChange={(e) => setValorPagoInicial(e.target.value)}
                            />
                          </div>
                        )}

                        {/* Electronic inputs */}
                        {(formaPagamentoId === 2 || formaPagamentoId === 3) && (
                          <div className="space-y-2 pt-2 border-t border-slate-900">
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                                {formaPagamentoId === 2 ? 'Código / Comprovativo' : 'ID Transação POS'} *
                              </label>
                              <input 
                                type="text" 
                                required
                                placeholder="ex: TRF19284902"
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                                value={formaPagamentoId === 2 ? codigoTransferencia : posTransId}
                                onChange={(e) => formaPagamentoId === 2 ? setCodigoTransferencia(e.target.value) : setPosTransId(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Banco Emissor / Operador *</label>
                              <input 
                                type="text" 
                                required
                                placeholder="ex: BAI, BFA, EMIS"
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                                value={emissor}
                                onChange={(e) => setEmissor(e.target.value)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Observações do Pedido</label>
                      <textarea 
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                        placeholder="Observações de entrega, fatura, etc."
                        rows={2}
                        value={observacoesVenda}
                        onChange={(e) => setObservacoesVenda(e.target.value)}
                      />
                    </div>

                    <button 
                      onClick={handleSubmitVendaOuPedido}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> 
                      {dataEntrega ? 'Agendar e Submeter Pedido' : 'Submeter e Liquidar Venda'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: EVENTS & CATERING */}
          {activeTab === 'eventos' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Event Booking Form */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                <h2 className="text-lg font-bold text-white">Agendamento de Evento / Buffet / Catering</h2>
                
                <form onSubmit={handleCreateEvento} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Cliente Organizador *</label>
                      <select 
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none"
                        value={selectedEventClienteId}
                        onChange={(e) => setSelectedEventClienteId(e.target.value)}
                      >
                        <option value="">-- Selecione o Cliente --</option>
                        {clientes.map(c => (
                          <option key={c.id} value={c.id}>{c.nome} ({c.telefone})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tipo de Evento *</label>
                      <select 
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none"
                        value={tipoEvento}
                        onChange={(e) => setTipoEvento(e.target.value)}
                      >
                        <option value="Casamento">Casamento</option>
                        <option value="Aniversario">Aniversário</option>
                        <option value="Batizado">Batizado</option>
                        <option value="Empresarial">Corporativo / Empresarial</option>
                        <option value="Catering">Catering Externo</option>
                        <option value="Formatura">Formatura</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Título / Designação do Evento *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="ex: Banquete Aniversário Empresa XPTO"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                        value={tituloEvento}
                        onChange={(e) => setTituloEvento(e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Descrição / Notas do Buffets</label>
                      <input 
                        type="text" 
                        placeholder="ex: Buffet de carnes e sobremesas requintadas"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none focus:border-indigo-500"
                        value={descricaoEvento}
                        onChange={(e) => setDescricaoEvento(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Local / Endereço</label>
                      <input 
                        type="text" 
                        placeholder="ex: Salão Nobre Sabor Imbatível ou Externo"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none"
                        value={localEvento}
                        onChange={(e) => setLocalEvento(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Número de Convidados / Pessoas *</label>
                      <input 
                        type="number" 
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none font-mono"
                        value={numeroConvidados}
                        onChange={(e) => setNumeroConvidados(parseInt(e.target.value || '10'))}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Data do Evento *</label>
                      <input 
                        type="date" 
                        required
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none"
                        value={dataEvento}
                        onChange={(e) => setDataEvento(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Hora Início *</label>
                        <input 
                          type="time" 
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none"
                          value={horaInicio}
                          onChange={(e) => setHoraInicio(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Hora Fim *</label>
                        <input 
                          type="time" 
                          required
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none"
                          value={horaFim}
                          onChange={(e) => setHoraFim(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Spaces Reservation Subsection */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      Reserva de Espaço / Salão
                    </h3>
                    
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Salão / Espaço Disponível</label>
                        <select 
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-white text-xs"
                          value={newSpaceId}
                          onChange={(e) => setNewSpaceId(e.target.value)}
                        >
                          <option value="">-- Selecione um Espaço --</option>
                          {espacos.map(e => (
                            <option key={e.id} value={e.id}>{e.nome} (Capacidade: {e.capacidade} pax)</option>
                          ))}
                        </select>
                      </div>
                      <button 
                        type="button"
                        onClick={addSpaceToEvent}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                      >
                        Vincular Espaço
                      </button>
                    </div>

                    {eventSpaces.length > 0 && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2">
                        {eventSpaces.map((s, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs text-slate-300">
                            <span>🏛️ {s.nome}</span>
                            <button 
                              type="button" 
                              onClick={() => removeSpaceFromEvent(idx)}
                              className="text-rose-500 hover:text-rose-400 font-bold"
                            >
                              Remover
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Services Subsection */}
                  <div className="pt-4 border-t border-slate-800 space-y-3">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-indigo-400" />
                      Serviços Contratados &amp; Taxas
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                      <div>
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Setor</label>
                        <select 
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-white text-xs"
                          value={newServiceType}
                          onChange={(e) => setNewServiceType(e.target.value)}
                        >
                          <option value="Cozinha">Cozinha (Alimentação)</option>
                          <option value="Pastelaria">Pastelaria (Sobremesas)</option>
                          <option value="Bar">Bar (Bebidas &amp; Cocktails)</option>
                          <option value="Aluguer">Aluguer (Espaço / Louça)</option>
                          <option value="Logistica">Logística &amp; Catering</option>
                          <option value="Limpeza">Limpeza pós-evento</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Descrição do Serviço</label>
                        <input 
                          type="text" 
                          placeholder="Buffet de Pratos Quentes, etc."
                          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-white text-xs focus:outline-none"
                          value={newServiceDesc}
                          onChange={(e) => setNewServiceDesc(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Qtd / Pessoas</label>
                          <input 
                            type="number" 
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-white text-xs font-mono focus:outline-none"
                            value={newServiceQty}
                            onChange={(e) => setNewServiceQty(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] uppercase font-bold text-slate-500 mb-1">Preço Un. (€)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-white text-xs font-mono focus:outline-none"
                            value={newServicePrice}
                            onChange={(e) => setNewServicePrice(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      onClick={addServiceToEvent}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Serviço à Tabela
                    </button>

                    {eventServices.length > 0 && (
                      <div className="bg-slate-950 rounded-xl border border-slate-850 overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-slate-850 bg-slate-900/50 text-slate-400 font-bold">
                              <th className="p-2.5">Setor</th>
                              <th className="p-2.5">Descrição</th>
                              <th className="p-2.5 font-mono text-center">Qtd</th>
                              <th className="p-2.5 font-mono text-right">Preço</th>
                              <th className="p-2.5 font-mono text-right">Subtotal</th>
                              <th className="p-2.5 text-center">Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {eventServices.map((srv, idx) => (
                              <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                                <td className="p-2.5 font-semibold text-indigo-400">{srv.tipo}</td>
                                <td className="p-2.5 text-slate-300">{srv.descricao}</td>
                                <td className="p-2.5 text-center font-mono text-slate-400">{srv.quantidade}</td>
                                <td className="p-2.5 text-right font-mono text-slate-400">{srv.valor_unitario.toFixed(2)} €</td>
                                <td className="p-2.5 text-right font-mono text-emerald-400">{(srv.quantidade * srv.valor_unitario).toFixed(2)} €</td>
                                <td className="p-2.5 text-center">
                                  <button 
                                    type="button" 
                                    onClick={() => removeServiceFromEvent(idx)}
                                    className="text-rose-500 hover:text-rose-400 font-bold"
                                  >
                                    Remover
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="p-3 bg-slate-900 text-right text-xs font-bold text-white">
                          Total Orçamento Contratado: {eventServices.reduce((acc, curr) => acc + (curr.quantidade * curr.valor_unitario), 0).toFixed(2)} €
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                    <button 
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Registar e Agendar Evento
                    </button>
                  </div>
                </form>
              </div>

              {/* Scheduled Events List */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">Eventos Agendados</h2>
                
                {eventos.length === 0 ? (
                  <p className="text-slate-500 text-xs py-6 text-center">Sem eventos registados.</p>
                ) : (
                  <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                    {eventos.map((evt: any) => {
                      const totalBudget = getEventTotal(evt);
                      return (
                        <div key={evt.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                                {evt.tipo_evento}
                              </span>
                              <h4 className="font-bold text-white text-sm mt-1.5">{evt.titulo}</h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{evt.numero}</p>
                            </div>
                            
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              evt.estado === 'Confirmado' ? 'bg-emerald-500/10 text-emerald-400' :
                              evt.estado === 'Concluido' ? 'bg-indigo-500/10 text-indigo-400' :
                              evt.estado === 'Agendado' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-rose-500/10 text-rose-400'
                            }`}>
                              {evt.estado}
                            </span>
                          </div>

                          <div className="space-y-1 text-xs text-slate-400 font-medium">
                            <p>📅 Data: {evt.data_evento}</p>
                            <p>🕒 Horário: {evt.hora_inicio?.substring(0,5)} - {evt.hora_fim?.substring(0,5)}</p>
                            <p>👥 Pessoas: {evt.numero_convidados} convidados</p>
                            <p>🏛️ Local: {evt.local_evento || 'Sabor Imbatível'}</p>
                            <p className="pt-1 text-emerald-400 font-bold">💰 Orçamento: {parseFloat(evt.valor_total || totalBudget).toFixed(2)} €</p>
                          </div>

                          {/* Action triggers */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-900">
                            {evt.estado === 'Agendado' && (
                              <button 
                                onClick={() => handleUpdateEventStatus(evt.id, 'Confirmado')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                              >
                                Confirmar
                              </button>
                            )}
                            {evt.estado === 'Confirmado' && (
                              <button 
                                onClick={() => handleUpdateEventStatus(evt.id, 'Concluido')}
                                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold"
                              >
                                Concluir
                              </button>
                            )}
                            {evt.estado !== 'Concluido' && evt.estado !== 'Cancelar' && (
                              <button 
                                onClick={() => handleUpdateEventStatus(evt.id, 'Cancelado')}
                                className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-400 rounded text-[10px] font-bold"
                              >
                                Cancelar
                              </button>
                            )}
                            {evt.estado === 'Concluido' && (
                              <button 
                                onClick={() => handleFaturarEvento(evt.id)}
                                className="px-2 py-1 bg-emerald-950 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-bold hover:bg-emerald-900"
                              >
                                Faturar Evento
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CAIXA & TRANSACTIONS */}
          {activeTab === 'caixa' && (
            <div className="space-y-6">
              
              {/* If caixa is CLOSED */}
              {!activeCaixa && (
                <div className="max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                  <Lock className="w-12 h-12 text-rose-500 mx-auto" />
                  <div>
                    <h2 className="text-lg font-bold text-white">Sessão de Caixa Encerrada</h2>
                    <p className="text-xs text-slate-400 mt-1">Abra uma nova sessão de caixa para registar vendas diretas, trocos e fluxos financeiros.</p>
                  </div>

                  <form onSubmit={handleAbrirCaixa} className="space-y-3 text-left">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Fundo de Maneio / Caixa Inicial (€)</label>
                      <input 
                        type="number" 
                        required
                        placeholder="0.00"
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white font-mono focus:outline-none"
                        value={fundoAbertura}
                        onChange={(e) => setFundoAbertura(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
                    >
                      Abrir Caixa Terminal
                    </button>
                  </form>
                </div>
              )}

              {/* If caixa is OPEN */}
              {activeCaixa && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                  
                  {/* Caixa Status & Movements */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Metrics card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h2 className="text-lg font-bold text-white mb-4">Sessão Ativa: {activeCaixa.numero}</h2>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Fundo Inicial</p>
                          <p className="text-lg font-bold font-mono text-white mt-1">{parseFloat(activeCaixa.valor_inicial || 0).toFixed(2)} €</p>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Entradas (Dinheiro)</p>
                          <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
                            {parseFloat(activeCaixa.valor_esperado_dinheiro || 0).toFixed(2)} €
                          </p>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Transferências</p>
                          <p className="text-lg font-bold font-mono text-indigo-400 mt-1">
                            {parseFloat(activeCaixa.valor_esperado_transferencia || 0).toFixed(2)} €
                          </p>
                        </div>
                        <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Cartão POS</p>
                          <p className="text-lg font-bold font-mono text-sky-400 mt-1">
                            {parseFloat(activeCaixa.valor_esperado_pos || 0).toFixed(2)} €
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Manual movement register */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-md font-bold text-white mb-4">Registrar Movimento Manual (Fundo/Sangria)</h3>
                      
                      <form onSubmit={handleRegistrarMovimentoManual} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Tipo de Fluxo</label>
                          <select 
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs"
                            value={manualMovType}
                            onChange={(e) => {
                              setManualMovType(e.target.value as any);
                              setManualMovTipoEnum(e.target.value === 'Entrada' ? 'Reforco' : 'Sangria');
                            }}
                          >
                            <option value="Entrada">📥 Entrada de Valor (Reforço)</option>
                            <option value="Saida">📤 Saída de Valor (Sangria)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Finalidade</label>
                          <select 
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs"
                            value={manualMovTipoEnum}
                            onChange={(e) => setManualMovTipoEnum(e.target.value)}
                          >
                            {manualMovType === 'Entrada' ? (
                              <>
                                <option value="Reforco">Reforço de Troco</option>
                                <option value="Ajuste">Ajuste Positivo</option>
                              </>
                            ) : (
                              <>
                                <option value="Sangria">Sangria (Depósito Banco)</option>
                                <option value="Devolucao">Devolução Cliente</option>
                                <option value="Ajuste">Ajuste Negativo</option>
                              </>
                            )}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Método de Fluxo</label>
                          <select 
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs"
                            value={manualMovFormaPg}
                            onChange={(e) => setManualMovFormaPg(e.target.value)}
                          >
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Transferencia">Transferência</option>
                            <option value="Multicaixa">Cartão POS</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Descrição Detalhada</label>
                          <input 
                            type="text" 
                            required
                            placeholder="ex: Fundo extra para caixa de troco ou depósito BAI"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none"
                            value={manualMovDesc}
                            onChange={(e) => setManualMovDesc(e.target.value)}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Valor (€) *</label>
                          <input 
                            type="number" 
                            required
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs font-mono focus:outline-none"
                            value={manualMovValue}
                            onChange={(e) => setManualMovValue(e.target.value)}
                          />
                        </div>

                        <div className="sm:col-span-3 text-right">
                          <button 
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            Gravar Fluxo Caixa
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Active Caixa movements timeline */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                      <h3 className="text-md font-bold text-white mb-4">Fluxo Recente de Caixa (Movimentos)</h3>
                      
                      {!activeCaixa.movimentos || activeCaixa.movimentos.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4 text-center">Nenhum movimento registrado na sessão atual.</p>
                      ) : (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {activeCaixa.movimentos.map((mov: any) => (
                            <div key={mov.id} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex justify-between items-center text-xs">
                              <div className="flex items-center gap-2.5">
                                {mov.tipo === 'Sangria' || mov.tipo === 'Devolucao' || mov.tipo === 'Saida' ? (
                                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                                    <ArrowDownRight className="w-4 h-4" />
                                  </div>
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                    <ArrowUpRight className="w-4 h-4" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-bold text-white">{mov.descricao || mov.tipo}</p>
                                  <span className="text-[9px] text-slate-500 font-mono block mt-0.5">{mov.data_movimento || 'Hoje'}</span>
                                </div>
                              </div>
                              <span className={`font-bold font-mono ${
                                mov.tipo === 'Sangria' || mov.tipo === 'Devolucao' || mov.tipo === 'Saida' ? 'text-rose-400' : 'text-emerald-400'
                              }`}>
                                {mov.tipo === 'Sangria' || mov.tipo === 'Devolucao' || mov.tipo === 'Saida' ? '-' : '+'}
                                {parseFloat(mov.valor).toFixed(2)} €
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Closing Cashier Form */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-bold text-white">Fechar Turno / Caixa</h2>
                    <p className="text-xs text-slate-400">Insira os valores contados fisicamente no caixa para auditar divergências de trocos.</p>
                    
                    <form onSubmit={handleFecharCaixa} className="space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Dinheiro em Caixa Físico (€) *</label>
                        <input 
                          type="number" 
                          required
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs font-mono focus:outline-none"
                          value={declaredDinheiro}
                          onChange={(e) => setDeclaredDinheiro(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Comprovativos de Transf. Contados (€)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs font-mono focus:outline-none"
                          value={declaredTransferencia}
                          onChange={(e) => setDeclaredTransferencia(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Talões Multicaixa / POS (€)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          placeholder="0.00"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs font-mono focus:outline-none"
                          value={declaredPOS}
                          onChange={(e) => setDeclaredPOS(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Explicação de Divergência (Quebra)</label>
                        <textarea 
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs focus:outline-none"
                          placeholder="Caso os valores declarados divirjam dos esperados, justifique aqui."
                          rows={3}
                          value={divergenceReason}
                          onChange={(e) => setDivergenceReason(e.target.value)}
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        <Lock className="w-4 h-4" /> Fechar Caixa &amp; Imprimir Resumo
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SALES HISTORY */}
          {activeTab === 'historico' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              
              {/* Sales invoice list */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h2 className="text-lg font-bold text-white">Histórico de Faturação</h2>
                  
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Pesquisar por nº ou estado..." 
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      value={searchVendas}
                      onChange={(e) => setSearchVendas(e.target.value)}
                    />
                  </div>
                </div>

                {getFilteredVendas().length === 0 ? (
                  <p className="text-slate-500 text-xs py-6 text-center">Nenhuma fatura encontrada.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold bg-slate-950/20">
                          <th className="p-3">Documento</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3 font-mono text-right">Total</th>
                          <th className="p-3 text-center">Estado</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredVendas().map(v => (
                          <tr 
                            key={v.id} 
                            onClick={() => handleLoadVendaDetails(v.id)}
                            className="border-b border-slate-850 hover:bg-slate-950/50 cursor-pointer"
                          >
                            <td className="p-3 font-semibold text-white">{v.numero_documento}</td>
                            <td className="p-3">
                              <span className="px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono font-bold text-[10px]">
                                {v.tipo}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-right text-emerald-400 font-bold">{(parseFloat(v.total)).toFixed(2)} €</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                v.estado === 'Pago' ? 'bg-emerald-500/10 text-emerald-400' :
                                v.estado === 'Parcialmente Pago' ? 'bg-amber-500/10 text-amber-400' :
                                v.estado === 'Cancelado' ? 'bg-rose-500/10 text-rose-400' :
                                'bg-slate-950 text-slate-400'
                              }`}>
                                {v.estado}
                              </span>
                            </td>
                            <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handlePrintVenda(v.id)}
                                  className="p-1 hover:text-indigo-400 text-slate-400 transition-colors"
                                  title="Exportar PDF"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                                {v.estado !== 'Pago' && v.estado !== 'Cancelado' && (
                                  <button 
                                    onClick={() => {
                                      setPaymentRegisterVendaId(v.id);
                                      setRegisterPayValue(parseFloat(v.total).toFixed(2));
                                    }}
                                    className="px-2 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded"
                                  >
                                    Faturar Pg.
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Sales detail / Pay registry overlay */}
              <div className="space-y-6">
                
                {paymentRegisterVendaId && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <h3 className="font-bold text-white text-sm">Registrar Recebimento Venda</h3>
                      <button onClick={() => setPaymentRegisterVendaId(null)} className="text-slate-400 hover:text-white">X</button>
                    </div>

                    <form onSubmit={handleRegisterPaymentForVenda} className="space-y-3">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Valor a Liquidar (€) *</label>
                        <input 
                          type="number" 
                          required
                          step="0.01"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs font-mono"
                          value={registerPayValue}
                          onChange={(e) => setRegisterPayValue(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-500 mb-2">Método de Liquidação</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button 
                            type="button" 
                            onClick={() => setRegisterPayFormaId(1)}
                            className={`py-1.5 px-1 rounded-lg border text-center text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                              registerPayFormaId === 1 ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-slate-800 text-slate-400 hover:bg-slate-950'
                            }`}
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Dinheiro
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setRegisterPayFormaId(2)}
                            className={`py-1.5 px-1 rounded-lg border text-center text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                              registerPayFormaId === 2 ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-slate-800 text-slate-400 hover:bg-slate-950'
                            }`}
                          >
                            <Building2 className="w-3.5 h-3.5" /> Transf.
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setRegisterPayFormaId(3)}
                            className={`py-1.5 px-1 rounded-lg border text-center text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                              registerPayFormaId === 3 ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-slate-800 text-slate-400 hover:bg-slate-950'
                            }`}
                          >
                            <CreditCard className="w-3.5 h-3.5" /> POS Card
                          </button>
                        </div>
                      </div>

                      {(registerPayFormaId === 2 || registerPayFormaId === 3) && (
                        <div className="space-y-3 pt-2 border-t border-slate-950/60">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Código Transação</label>
                            <input 
                              type="text" 
                              required
                              placeholder="ex: TRF1928392"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs font-mono"
                              value={registerPayCode}
                              onChange={(e) => setRegisterPayCode(e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Emissor / Banco</label>
                            <input 
                              type="text" 
                              required
                              placeholder="ex: BAI"
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-white text-xs"
                              value={registerPayEmissor}
                              onChange={(e) => setRegisterPayEmissor(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      <button 
                        type="submit"
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
                      >
                        Submeter Pagamento
                      </button>
                    </form>
                  </div>
                )}

                {/* Venda Details side card */}
                {selectedVendaDetails ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                      <h3 className="font-bold text-white text-sm">Detalhes do Faturamento</h3>
                      <button onClick={() => setSelectedVendaDetails(null)} className="text-slate-400 hover:text-white">X</button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nº Documento:</span>
                        <span className="font-bold text-white font-mono">{selectedVendaDetails.numero_documento}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tipo:</span>
                        <span className="font-semibold text-indigo-400">{selectedVendaDetails.tipo_documento}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Subtotal:</span>
                        <span className="font-mono text-slate-300">{parseFloat(selectedVendaDetails.subtotal).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Descontos:</span>
                        <span className="font-mono text-rose-400">-{parseFloat(selectedVendaDetails.desconto_total).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">IVA Aplicado:</span>
                        <span className="font-mono text-slate-300">{parseFloat(selectedVendaDetails.total_iva).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-800/50">
                        <span className="text-white">Total Líquido:</span>
                        <span className="font-mono text-emerald-400">{parseFloat(selectedVendaDetails.total).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between font-semibold pt-1">
                        <span className="text-slate-400">Valor Pago:</span>
                        <span className="font-mono text-slate-200">{parseFloat(selectedVendaDetails.valor_pago || 0).toFixed(2)} €</span>
                      </div>
                      <div className="flex justify-between font-semibold">
                        <span className="text-slate-400">Saldo Restante:</span>
                        <span className="font-mono text-rose-400">{parseFloat(selectedVendaDetails.saldo || 0).toFixed(2)} €</span>
                      </div>
                    </div>

                    {/* Sold Items Table */}
                    <div className="pt-2 border-t border-slate-800/60 space-y-2">
                      <h4 className="text-[10px] uppercase font-bold text-slate-500">Itens Vendidos</h4>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {selectedVendaDetails.itens?.map((it: any, idx: number) => (
                          <div key={idx} className="bg-slate-950 p-2 rounded-lg border border-slate-850 text-[11px] flex justify-between items-center">
                            <div>
                              <p className="font-bold text-white truncate max-w-40">{it.descricao}</p>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Qtd: {parseFloat(it.quantidade)} x {parseFloat(it.preco_unitario).toFixed(2)} €</p>
                            </div>
                            <span className="font-mono font-bold text-emerald-400">{parseFloat(it.total).toFixed(2)} €</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex gap-2">
                      <button 
                        onClick={() => handlePrintVenda(selectedVendaDetails.id)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Printer className="w-4 h-4" /> Imprimir
                      </button>
                      
                      {selectedVendaDetails.estado !== 'Cancelado' && (
                        <button 
                          onClick={() => handleCancelVenda(selectedVendaDetails.id)}
                          className="flex-1 py-2 bg-rose-950 hover:bg-rose-900 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-bold transition-all"
                        >
                          Anular Fatura
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-6 text-center text-slate-500 text-xs">
                    Selecione uma fatura ao lado para auditar detalhes, liquidar saldos ou anular o documento.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

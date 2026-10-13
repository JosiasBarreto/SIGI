import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService, clientService, productService, materialService, proformaService } from '../services';
import { formatCurrency, cn } from '../lib/utils';
import { 
  ArrowLeft, Save, Plus, Trash2, Sparkles, PartyPopper, Calendar, Clock, MapPin, 
  Users, DollarSign, Calculator, CheckCircle2, ShieldAlert, FileText, ChevronRight, 
  Cake, UtensilsCrossed, Wine, Briefcase, Tent, PlusCircle, Minus, ListFilter, AlertCircle,
  CreditCard, Wallet, Landmark, ShoppingCart, Lock, X
} from 'lucide-react';
import { toast } from 'react-toastify';
import SearchableClientSelect from '../components/Common/SearchableClientSelect';
import AddItemModal from '../components/Eventos/AddItemModal';
import Modal from '../components/Common/Modal';

const formatMoeda = (val: number) => formatCurrency(Number(val || 0));

export interface EventoItemForm {
  id?: number;
  tipo_item: 'Servico' | 'Espaco' | 'Material' | 'MaoDeObra' | 'Produto' | 'ProdutoCozinha' | 'ProdutoPastelaria' | 'ProdutoRevenda' | 'Outro';
  referencia_id?: number | null;
  produto_id?: number | null;
  descricao: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  preco_sem_iva?: number;
  percentual_desconto?: number;
  valor_desconto?: number;
  taxa_iva?: number;
  valor_iva?: number;
  subtotal?: number;
  total?: number;
  observacoes?: string;
  sugestao_politica_id?: number | null;
  sugestao_origem?: string | null;
}

// Prices selected from the product catalogue already include IVA.  IVA is
// added separately only to services, venues and rentals.
const isProdutoEvento = (tipo: string) => String(tipo || '').toLowerCase().includes('produto');

export default function EventoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const queryClient = useQueryClient();

  // Basic Form State
  const [titulo, setTitulo] = useState('');
  const [tipoEvento, setTipoEvento] = useState('Casamento');
  const [clienteId, setClienteId] = useState<number | ''>('');
  const [localEvento, setLocalEvento] = useState('');
  const [espacoId, setEspacoId] = useState<number | ''>('');
  const [numeroConvidados, setNumeroConvidados] = useState<number>(100);
  const [dataEvento, setDataEvento] = useState(new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState('12:00');
  const [horaFim, setHoraFim] = useState('22:00');
  const [cobrarIvaServicos, setCobrarIvaServicos] = useState(true);
  const [taxaIvaServicos, setTaxaIvaServicos] = useState<number>(15);
  const [valorDeslocacao, setValorDeslocacao] = useState<number>(0);
  const [outrosEncargos, setOutrosEncargos] = useState<number>(0);
  const [descontoTotal, setDescontoTotal] = useState<number>(0);
  const [observacoes, setObservacoes] = useState('');
  const [estadoForm, setEstadoForm] = useState<string>('ORCAMENTO');

  // Items State & Modal
  const [itens, setItens] = useState<EventoItemForm[]>([]);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [itemFilterTab, setItemFilterTab] = useState<'TODOS' | 'PASTELARIA' | 'COZINHA' | 'REVENDA' | 'SERVICOS'>('TODOS');
  const [isProformaSubmitting, setIsProformaSubmitting] = useState(false);

  // Payment Confirmation Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [metodoPagamento, setMetodoPagamento] = useState<'Dinheiro' | 'TPA / Multicaixa' | 'Transferência Bancária' | 'Pagamento Misto'>('Dinheiro');
  const [condicaoPagamento, setCondicaoPagamento] = useState<'Pronto Pagamento' | '50% Adiantamento' | '30% Adiantamento' | 'Personalizado'>('Pronto Pagamento');
  const [valorPagoInput, setValorPagoInput] = useState<string>('');
  const [codigoComprovativo, setCodigoComprovativo] = useState('');
  const [bancoEmissor, setBancoEmissor] = useState('');
  const [observacoesPagamento, setObservacoesPagamento] = useState('');

  // Queries
  const { data: clientesData } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: async () => {
      const res = await clientService.getAll();
      return res?.items || res || [];
    }
  });
  const clientes: any[] = Array.isArray(clientesData) ? clientesData : (clientesData as any)?.items || [];

  const { data: tiposEventoData } = useQuery({
    queryKey: ['tipos-evento-select'],
    queryFn: async () => {
      const res = await eventService.tiposEvento.listar();
      return res?.items || res || [];
    }
  });
  const tiposEvento: any[] = Array.isArray(tiposEventoData) ? tiposEventoData : (tiposEventoData as any)?.items || [];

  const { data: servicosCadastroData } = useQuery({
    queryKey: ['servicos-cadastro-select'],
    queryFn: async () => {
      const res = await eventService.servicosCadastro.listar();
      return res?.items || res || [];
    }
  });
  const servicosCadastro: any[] = Array.isArray(servicosCadastroData) ? servicosCadastroData : (servicosCadastroData as any)?.items || [];

  const { data: equipasCadastroData } = useQuery({
    queryKey: ['equipas-cadastro-select'],
    queryFn: async () => {
      const res = await eventService.equipasCadastro.listar();
      return res?.items || res || [];
    }
  });
  const equipasCadastro: any[] = Array.isArray(equipasCadastroData) ? equipasCadastroData : (equipasCadastroData as any)?.items || [];

  const { data: espacosData } = useQuery({
    queryKey: ['espacos-select'],
    queryFn: async () => {
      const res = await eventService.espacos.listar();
      return res?.items || res || [];
    }
  });
  const espacos: any[] = Array.isArray(espacosData) ? espacosData : (espacosData as any)?.items || [];

  const { data: produtosData } = useQuery({
    queryKey: ['produtos-select'],
    queryFn: async () => {
      const res = await productService.getProdutosComerciais({ per_page: 5000 });
      return res?.items || res || [];
    }
  });
  const produtos: any[] = Array.isArray(produtosData) ? produtosData : (produtosData as any)?.items || [];

  const { data: materiaisData } = useQuery({
    queryKey: ['materiais-select'],
    queryFn: async () => {
      const res = await materialService.getAll();
      return res?.items || res || [];
    }
  });
  const materiais: any[] = Array.isArray(materiaisData) ? materiaisData : (materiaisData as any)?.items || [];

  // Fetch Event Data if Editing
  const { data: eventoEditData } = useQuery({
    queryKey: ['evento-detail', id],
    queryFn: () => eventService.getById(id!),
    enabled: isEditing
  });

  useEffect(() => {
    if (eventoEditData) {
      setTitulo(eventoEditData.titulo || '');
      setTipoEvento(eventoEditData.tipo_evento || 'Casamento');
      setClienteId(eventoEditData.cliente_id || '');
      setLocalEvento(eventoEditData.local_evento || '');
      setEspacoId(eventoEditData.espaco_id || '');
      setNumeroConvidados(eventoEditData.numero_convidados || 100);
      setDataEvento(eventoEditData.data_evento ? eventoEditData.data_evento.split('T')[0] : new Date().toISOString().split('T')[0]);
      setHoraInicio(eventoEditData.hora_inicio ? eventoEditData.hora_inicio.slice(0, 5) : '12:00');
      setHoraFim(eventoEditData.hora_fim ? eventoEditData.hora_fim.slice(0, 5) : '22:00');
      setCobrarIvaServicos(eventoEditData.cobrar_iva_servicos ?? true);
      setTaxaIvaServicos(eventoEditData.taxa_iva_servicos ?? 15);
      setValorDeslocacao(eventoEditData.valor_deslocacao || 0);
      setOutrosEncargos(eventoEditData.outros_encargos || 0);
      setDescontoTotal(eventoEditData.desconto_total || 0);
      setObservacoes(eventoEditData.observacoes || '');
      setEstadoForm(eventoEditData.estado || 'ORCAMENTO');

      if (Array.isArray(eventoEditData.itens)) {
        setItens(eventoEditData.itens.map((it: any) => ({
          tipo_item: it.tipo_item || 'Servico',
          referencia_id: it.referencia_id || null,
          produto_id: it.produto_id || null,
          descricao: it.descricao || '',
          quantidade: Number(it.quantidade || 1),
          unidade: it.unidade || 'Pessoa',
          preco_unitario: Number(it.preco_unitario || 0),
          percentual_desconto: Number(it.percentual_desconto || 0),
          valor_desconto: Number(it.valor_desconto || 0),
          taxa_iva: it.taxa_iva != null && !isNaN(Number(it.taxa_iva)) ? Number(it.taxa_iva) : 0,
          observacoes: it.observacoes || '',
          sugestao_politica_id: it.sugestao_politica_id || null,
          sugestao_origem: it.sugestao_origem || null
        })));
      }
    }
  }, [eventoEditData]);

  // Handle Add Item from Modal (Acumula quantidade se o produto já existir no evento)
  const handleAddItemFromModal = (newItemData: EventoItemForm) => {
    const existingIndex = itens.findIndex(item => {
      if (newItemData.produto_id && item.produto_id) {
        return Number(item.produto_id) === Number(newItemData.produto_id);
      }
      return String(item.descricao || '').trim().toLowerCase() === String(newItemData.descricao || '').trim().toLowerCase() && item.tipo_item === newItemData.tipo_item;
    });

    if (existingIndex >= 0) {
      const currentQty = Number(itens[existingIndex].quantidade || 1);
      const addQty = Number(newItemData.quantidade || 1);
      const newQty = currentQty + addQty;
      setItens(prev => {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantidade: newQty
        };
        return next;
      });
      // Toast disparado apenas 1 vez (fora do updater de estado para evitar duplicação)
      toast.success(`Quantidade de "${newItemData.descricao}" aumentada para ${newQty}!`);
    } else {
      setItens(prev => [...prev, newItemData]);
      toast.success(`"${newItemData.descricao}" adicionado ao carrinho!`);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItens(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItemQty = (index: number, delta: number) => {
    setItens(prev => {
      const next = [...prev];
      const newQty = Math.max(1, (next[index].quantidade || 1) + delta);
      next[index] = { ...next[index], quantidade: newQty };
      return next;
    });
  };

  const handleItemChange = (index: number, field: keyof EventoItemForm, value: any) => {
    setItens(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // ACCURATE Real-time Financial Calculations (Preços de produtos já contêm IVA embutido ou são isentos)
  const calculatedResumo = useMemo(() => {
    let subtotalProdutos = 0;
    let subtotalCozinhaPastelaria = 0;
    let subtotalRevenda = 0;
    let totalIvaEmbutidoProdutos = 0;
    let totalProdutosIsentos = 0;

    let subtotalServicos = 0;
    let subtotalAlugueres = 0;
    let totalIvaServicos = 0;

    itens.forEach(it => {
      const qty = Number(it.quantidade || 0);
      const precoFinalUnitario = Number(it.preco_unitario || 0);
      const sub = qty * precoFinalUnitario;
      const desc = Number(it.valor_desconto || 0) || (sub * (Number(it.percentual_desconto || 0) / 100));
      const liquid = Math.max(0, sub - desc);

      const produto = isProdutoEvento(it.tipo_item);
      const taxaIva = Number(it.taxa_iva ?? (produto ? 0 : (cobrarIvaServicos ? taxaIvaServicos : 0)));

      if (produto) {
        // Produtos já trazem IVA embutido (ou são isentos). Nunca somar IVA adicional ao total!
        subtotalProdutos += liquid;
        if (['Produto', 'ProdutoCozinha', 'ProdutoPastelaria'].includes(it.tipo_item)) {
          subtotalCozinhaPastelaria += liquid;
        } else if (it.tipo_item === 'ProdutoRevenda') {
          subtotalRevenda += liquid;
        }

        if (taxaIva > 0) {
          const baseUnit = precoFinalUnitario / (1 + taxaIva / 100);
          totalIvaEmbutidoProdutos += (precoFinalUnitario - baseUnit) * qty;
        } else {
          totalProdutosIsentos += liquid;
        }
      } else {
        // Serviços, Espaços e Materiais têm IVA calculado se cobrarIvaServicos estiver ativo
        const iva = cobrarIvaServicos ? (liquid * (taxaIva / 100)) : 0;
        if (it.tipo_item === 'Espaco' || it.tipo_item === 'Material') {
          subtotalAlugueres += liquid;
        } else {
          subtotalServicos += liquid;
        }
        totalIvaServicos += iva;
      }
    });

    const subtotalServicosEAlugueres = subtotalServicos + subtotalAlugueres;
    const encargosLiquidos = Number(valorDeslocacao || 0) + Number(outrosEncargos || 0) - Number(descontoTotal || 0);
    const subtotalGeralSemIva = (subtotalProdutos - totalIvaEmbutidoProdutos) + subtotalServicosEAlugueres + encargosLiquidos;
    const totalGeral = subtotalProdutos + subtotalServicosEAlugueres + encargosLiquidos + totalIvaServicos;

    return {
      subtotalProdutos,
      subtotalCozinhaPastelaria,
      subtotalRevenda,
      totalIvaEmbutidoProdutos,
      totalProdutosIsentos,
      subtotalServicos,
      subtotalAlugueres,
      subtotalServicosEAlugueres,
      subtotalGeralSemIva,
      totalIvaServicos,
      totalIvaGeral: totalIvaServicos,
      totalGeral: Math.max(0, totalGeral)
    };
  }, [itens, valorDeslocacao, outrosEncargos, descontoTotal, cobrarIvaServicos]);

  // Selected client object or fallback to Consumidor Final
  const consumidorFinalClient = useMemo(() => {
    return clientes.find((c: any) => {
      const name = String(c.nome || c.name || '').toLowerCase();
      return name.includes('consumidor') || name.includes('final');
    }) || null;
  }, [clientes]);

  const selectedClientObj = useMemo(() => {
    if (!clienteId) return consumidorFinalClient;
    return clientes.find((c: any) => String(c.id) === String(clienteId)) || consumidorFinalClient;
  }, [clienteId, clientes, consumidorFinalClient]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async ({ payload, paymentInfo }: { payload: any; paymentInfo?: any }) => {
      let result: any;
      if (isEditing) {
        result = await eventService.update(id!, payload);
      } else {
        result = await eventService.create(payload);
      }

      if (paymentInfo && result && result.id) {
        try {
          const formaId = paymentInfo.metodo_pagamento === 'Dinheiro' ? 1 : (paymentInfo.metodo_pagamento === 'Transferência Bancária' ? 2 : 3);
          // The server is the fiscal source of truth.  In particular it may
          // normalise IVA/discounts, so never decide FR versus FT from a
          // stale browser total.
          const totalFiscal = Number(
            result?.resumo_financeiro?.total_geral ?? result?.valor_total ?? calculatedResumo.totalGeral
          );
          const tipoDoc = Math.abs(paymentInfo.valor_pago - totalFiscal) <= 0.005 ? 'FR' : 'FT';
          await eventService.faturar(result.id, {
            tipo_documento: tipoDoc,
            // This is the contract consumed by the backend.  A partial entry
            // emits FT; only a full settlement is eligible for FR.
            pagamento: {
              valor: paymentInfo.valor_pago,
              forma_pagamento_id: formaId,
              codigo_transferencia: paymentInfo.codigo_comprovativo || null,
              emissor: paymentInfo.banco_emissor || null,
              observacoes: paymentInfo.observacoes || null,
            }
          });
        } catch (error) {
          // The event exists, but hiding an invoice/payment failure made the
          // list show a pending balance with no explanation.
          throw error;
        }
      }

      return result;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsPaymentModalOpen(false);
      const estadoMsg = variables.payload.estado === 'RASCUNHO' ? 'Rascunho guardado com sucesso.' : 'Evento confirmado com sucesso!';
      toast.success(estadoMsg);
      navigate('/eventos');
    },
    onError: (err: any) => {
      const serverMsg = err?.response?.data?.message || err?.response?.data?.erro || err?.response?.data?.detail || err?.message;
      toast.error(serverMsg || 'Erro ao guardar evento. Verifique os dados informados.');
    }
  });

  const buildPayload = (overrideEstado?: string) => {
    const formattedHoraInicio = horaInicio && horaInicio.trim() ? horaInicio.slice(0, 5) : '12:00';
    const formattedHoraFim = horaFim && horaFim.trim() ? horaFim.slice(0, 5) : '22:00';

    const finalClienteId = clienteId ? Number(clienteId) : (consumidorFinalClient?.id || null);
    const finalClienteNome = clienteId
      ? (selectedClientObj?.nome || selectedClientObj?.name || 'Cliente')
      : (consumidorFinalClient?.nome || 'Consumidor Final');

    const payload: any = {
      titulo: titulo.trim() || 'Novo Evento',
      tipo_evento: tipoEvento || 'Casamento',
      cliente_id: finalClienteId,
      cliente_nome: finalClienteNome,
      local_evento: localEvento || '',
      numero_convidados: Number(numeroConvidados || 100),
      data_evento: dataEvento ? String(dataEvento).split('T')[0] : new Date().toISOString().split('T')[0],
      hora_inicio: formattedHoraInicio,
      hora_fim: formattedHoraFim,
      cobrar_iva_servicos: Boolean(cobrarIvaServicos),
      taxa_iva_servicos: Number(taxaIvaServicos || 15),
      valor_deslocacao: Number(valorDeslocacao || 0),
      outros_encargos: Number(outrosEncargos || 0),
      desconto_total: Number(descontoTotal || 0),
      observacoes: observacoes || '',
      estado: overrideEstado || estadoForm,
      itens: itens.map(it => {
        const rawId = it.produto_id || it.referencia_id || (it as any).item_id;
        const numericId = Number(rawId);
        const validItemId = !isNaN(numericId) && numericId > 0 ? numericId : null;

        const isProd = isProdutoEvento(it.tipo_item);
        let itemTipoVal = 'Produto';
        if (['Servico', 'Serviço', 'SERVICO'].includes(it.tipo_item)) {
          itemTipoVal = 'Servico';
        }

        const itemObj: any = {
          tipo_item: itemTipoVal,
          descricao: it.descricao || 'Item do Evento',
          quantidade: Math.max(1, Number(it.quantidade || 1)),
          unidade: it.unidade || 'Unidade',
          preco_unitario: Number(it.preco_unitario || 0),
          taxa_iva: isProd ? 0 : (cobrarIvaServicos ? Number(it.taxa_iva ?? taxaIvaServicos ?? 0) : 0),
          observacoes: it.observacoes || ''
        };

        if (validItemId) {
          itemObj.produto_id = validItemId;
          itemObj.referencia_id = validItemId;
        }

        return itemObj;
      })
    };

    if (espacoId && Number(espacoId) > 0) {
      payload.espaco_id = Number(espacoId);
    }

    return payload;
  };

  const handleSaveRascunho = () => {
    if (!titulo.trim()) {
      toast.error('Informe ao menos o título do evento para salvar rascunho.');
      return;
    }
    saveMutation.mutate({ payload: buildPayload('RASCUNHO') });
  };

  // Open Payment Modal (Cliente opcional - Padrão Consumidor Final)
  const handleOpenConfirmModal = () => {
    if (!titulo.trim()) {
      toast.error('O título do evento é obrigatório.');
      return;
    }

    if (itens.length === 0) {
      toast.error('Adicione pelo menos um item ao evento antes de confirmar.');
      return;
    }

    // Set initial payment amount based on condition
    setValorPagoInput(String(calculatedResumo.totalGeral));
    setIsPaymentModalOpen(true);
  };

  // Confirm Payment & Submit Event
  const handleFinalizeWithPayment = () => {
    if (metodoPagamento === 'Transferência Bancária' || metodoPagamento === 'TPA / Multicaixa') {
      if (!codigoComprovativo.trim()) {
        toast.error('Informe o N.º de Comprovativo / Operação para o pagamento.');
        return;
      }
    }

    const valorPagoNum = parseFloat(valorPagoInput) || 0;

    if (valorPagoNum <= 0) {
      toast.error('Informe um valor de pagamento superior a zero.');
      return;
    }

    const paymentInfo = {
      metodo_pagamento: metodoPagamento,
      condicao_pagamento: condicaoPagamento,
      valor_total: calculatedResumo.totalGeral,
      valor_pago: valorPagoNum,
      troco: Math.max(0, valorPagoNum - calculatedResumo.totalGeral),
      codigo_comprovativo: codigoComprovativo,
      banco_emissor: bancoEmissor,
      observacoes: observacoesPagamento
    };

    saveMutation.mutate({ payload: buildPayload('CONFIRMADO'), paymentInfo });
  };

  // Pro-Forma Emission Logic
  const handleEmitirProforma = async () => {
    if (!titulo.trim()) {
      toast.error('Informe o título do evento antes de emitir a Pró-Forma.');
      return;
    }

    if (itens.length === 0) {
      toast.error('Adicione itens ao evento para gerar a Fatura Pró-Forma.');
      return;
    }

    setIsProformaSubmitting(true);
    try {
      const finalClienteId = clienteId ? Number(clienteId) : (consumidorFinalClient?.id || 1);
      const payload: any = {
        cliente_id: Number(finalClienteId),
        origem: 'EVENTO',
        observacoes: `Pró-Forma do Evento: ${titulo}`,
        itens: itens.map((it) => ({
          item_id: it.produto_id || it.referencia_id || null,
          item_tipo: (it.tipo_item === 'Servico' ? 'Servico' : 'Produto') as 'Servico' | 'Produto',
          descricao: it.descricao,
          preco_unitario: Number(it.preco_unitario || 0),
          quantidade: Number(it.quantidade || 1),
          desconto: Number(it.valor_desconto || 0),
          taxa_iva: isProdutoEvento(it.tipo_item) ? 0 : (cobrarIvaServicos ? Number(it.taxa_iva ?? taxaIvaServicos ?? 0) : 0),
        })),
      };

      const res = await proformaService.create(payload);
      toast.success(res?.msg || 'Fatura Pró-Forma emitida com sucesso!');
      if (res?.id) {
        proformaService.openPdf(res.id);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao emitir Fatura Pró-Forma.');
    } finally {
      setIsProformaSubmitting(false);
    }
  };

  // Filtered items view
  const filteredItens = useMemo(() => {
    if (itemFilterTab === 'PASTELARIA') return itens.filter(i => i.tipo_item === 'ProdutoPastelaria');
    if (itemFilterTab === 'COZINHA') return itens.filter(i => i.tipo_item === 'ProdutoCozinha');
    if (itemFilterTab === 'REVENDA') return itens.filter(i => i.tipo_item === 'ProdutoRevenda');
    if (itemFilterTab === 'SERVICOS') return itens.filter(i => !['ProdutoPastelaria', 'ProdutoCozinha', 'ProdutoRevenda'].includes(i.tipo_item));
    return itens;
  }, [itens, itemFilterTab]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-background-dark overflow-hidden relative">
      {/* HEADER BAR */}
      <div className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/eventos')}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary uppercase">
                {isEditing ? `Editar Evento #${id}` : 'Novo Evento Comercial'}
              </span>
              {estadoForm && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                  {estadoForm}
                </span>
              )}
            </div>
            <h1 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight mt-0.5">
              {titulo || 'Nova Orçamentação de Evento'}
            </h1>
          </div>
        </div>

        {/* Quick Actions Header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveRascunho}
            disabled={saveMutation.isPending}
            className="px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-extrabold rounded-xl transition-all border border-gray-200 dark:border-gray-700 flex items-center gap-1.5"
          >
            <Save size={15} />
            <span>Rascunho</span>
          </button>

          <button
            type="button"
            onClick={handleEmitirProforma}
            disabled={isProformaSubmitting}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <FileText size={15} />
            <span>{isProformaSubmitting ? 'Gerando...' : 'Pró-Forma'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenConfirmModal}
            disabled={saveMutation.isPending}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5"
          >
            <CheckCircle2 size={15} />
            <span>Confirmar & Pagamento</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT WORKSPACE (SCROLLABLE FULL-WIDTH) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        <div className="w-full max-w-[1920px] mx-auto grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* LEFT & CENTER COLUMN (EVENT DETAILS & ITEM CATALOG) */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* SECTION 1: IDENTIFICAÇÃO E DADOS DO EVENTO */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
              <h2 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-2.5 border-gray-100 dark:border-gray-800">
                <PartyPopper className="text-primary" size={16} /> 1. Dados Principais e Agendamento
              </h2>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase">
                  Título Comercial do Evento *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  required
                  placeholder="Ex: Banquete de Casamento - Família Silva, Gala Anual de Empresas..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase">
                    Tipo de Evento *
                  </label>
                  <select
                    value={tipoEvento}
                    onChange={e => setTipoEvento(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                  >
                    <option value="Casamento">Casamento</option>
                    <option value="Aniversário">Aniversário</option>
                    <option value="Corporativo / Gala">Corporativo / Gala</option>
                    <option value="Batizado">Batizado</option>
                    <option value="Cocktail">Cocktail</option>
                    {tiposEvento.map((t: any) => (
                      <option key={t.id} value={t.nome}>{t.nome}</option>
                    ))}
                  </select>
                </div>

                {/* CLIENT SELECTION (OPTIONAL - DEFAULT CONSUMIDOR FINAL) */}
                <div id="cliente-select-container" className="space-y-1.5 p-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/40 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase flex items-center gap-1.5">
                      <Users size={13} className="text-primary" />
                      Cliente Atribuído <span className="text-gray-400 font-semibold lowercase text-[10px]">(opcional)</span>
                    </label>
                    {!clienteId ? (
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                        ✓ Padrão: Consumidor Final
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                        Cliente Selecionado
                      </span>
                    )}
                  </div>
                  <SearchableClientSelect
                    clients={clientes}
                    selectedClientId={String(clienteId)}
                    onSelectClient={(idStr) => setClienteId(idStr ? Number(idStr) : '')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase">
                    Nº de Convidados (Pax) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={numeroConvidados}
                      onChange={e => setNumeroConvidados(Number(e.target.value))}
                      required
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-black text-primary"
                    />
                    <Users size={15} className="absolute left-3 top-2.5 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase">
                    Espaço / Recinto
                  </label>
                  <select
                    value={espacoId}
                    onChange={e => {
                      const idVal = e.target.value ? Number(e.target.value) : '';
                      setEspacoId(idVal);
                      const selected = espacos.find((es: any) => es.id === idVal);
                      if (selected) setLocalEvento(selected.nome);
                    }}
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione o recinto...</option>
                    {espacos.map((es: any) => (
                      <option key={es.id} value={es.id}>{es.nome} ({es.capacidade || 100} pax)</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase">
                    Localização Livre
                  </label>
                  <input
                    type="text"
                    value={localEvento}
                    onChange={e => setLocalEvento(e.target.value)}
                    placeholder="Ex: Salão Nobre Principal"
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase">
                    Data do Evento *
                  </label>
                  <input
                    type="date"
                    value={dataEvento}
                    onChange={e => setDataEvento(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase">
                    Hora Início
                  </label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={e => setHoraInicio(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase">
                    Hora Término
                  </label>
                  <input
                    type="time"
                    value={horaFim}
                    onChange={e => setHoraFim(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: ITENS E CATÁLOGO COM TABS */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 border-gray-100 dark:border-gray-800">
                <div>
                  <h2 className="text-xs font-extrabold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                    <Calculator className="text-primary" size={16} /> 2. Itens do Orçamento Comercial ({itens.length})
                  </h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Selecione produtos acabados de Pastelaria, Cozinha, Bebidas de Revenda ou Serviços.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(true)}
                  className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-md shrink-0 active:scale-95"
                >
                  <Plus size={16} />
                  <span>Adicionar Itens / Catálogo (Tabs)</span>
                </button>
              </div>

              {/* Items Filter Bar */}
              {itens.length > 0 && (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-gray-100 dark:border-gray-800 scrollbar-thin">
                  {[
                    { id: 'TODOS', label: 'Todos os Itens', count: itens.length },
                    { id: 'PASTELARIA', label: 'Pastelaria', count: itens.filter(i => i.tipo_item === 'ProdutoPastelaria').length },
                    { id: 'COZINHA', label: 'Cozinha', count: itens.filter(i => i.tipo_item === 'ProdutoCozinha').length },
                    { id: 'REVENDA', label: 'Revenda & Bebidas', count: itens.filter(i => i.tipo_item === 'ProdutoRevenda').length },
                    { id: 'SERVICOS', label: 'Serviços & Outros', count: itens.filter(i => !['ProdutoPastelaria', 'ProdutoCozinha', 'ProdutoRevenda'].includes(i.tipo_item)).length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setItemFilterTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                        itemFilterTab === tab.id
                          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-xs'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-black/10 dark:bg-white/10 font-bold">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Empty State */}
              {itens.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                  <Sparkles className="mx-auto text-primary animate-bounce" size={32} />
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Nenhum item adicionado ao orçamento do evento.
                  </p>
                  <p className="text-[11px] text-gray-400 max-w-md mx-auto">
                    Clique no botão acima para abrir o Catálogo com Tabs (Pastelaria, Cozinha, Revenda, Serviços, Espaços) e adicionar itens rapidamente.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-md transition-all"
                  >
                    + Abrir Catálogo de Itens
                  </button>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {filteredItens.map((item, idx) => {
                    const realIndex = itens.indexOf(item);
                    const isProd = isProdutoEvento(item.tipo_item);
                    const qty = Number(item.quantidade || 1);
                    const precoFinalUnitario = Number(item.preco_unitario || 0);
                    const taxaIva = Number(item.taxa_iva ?? (isProd ? 0 : (cobrarIvaServicos ? taxaIvaServicos : 0)));

                    let precoSemIvaUnit = item.preco_sem_iva;
                    if (precoSemIvaUnit === undefined || precoSemIvaUnit === null) {
                      precoSemIvaUnit = isProd && taxaIva > 0 ? precoFinalUnitario / (1 + taxaIva / 100) : precoFinalUnitario;
                    }

                    const valorIvaUnit = isProd
                      ? (taxaIva > 0 ? precoFinalUnitario - precoSemIvaUnit : 0)
                      : precoFinalUnitario * (taxaIva / 100);

                    // PRODUTOS NUNCA RECEBEM IVA EXTRA (preço já tem IVA ou é isento)
                    const totalLinha = isProd
                      ? qty * precoFinalUnitario
                      : qty * (precoFinalUnitario + (cobrarIvaServicos ? valorIvaUnit : 0));

                    const getDestinationBadge = () => {
                      if (item.tipo_item === 'ProdutoCozinha') return { label: '🍳 Cozinha / Menu', color: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50' };
                      if (item.tipo_item === 'ProdutoPastelaria') return { label: '🥐 Pastelaria / Doces', color: 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/50' };
                      if (item.tipo_item === 'ProdutoRevenda') return { label: '🍾 Revenda / Bebida', color: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/50' };
                      if (item.tipo_item === 'Material') return { label: '🚚 Logística / Aluguer', color: 'bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/50' };
                      if (item.tipo_item === 'Espaco') return { label: '🏛️ Aluguer Espaço', color: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50' };
                      return { label: '💼 Serviço / Equipa', color: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
                    };

                    const badge = getDestinationBadge();

                    return (
                      <div
                        key={realIndex}
                        className="p-4 bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-2xl space-y-3 shadow-xs hover:shadow-md hover:border-primary/40 transition-all"
                      >
                        {/* Header: Categoria, Status Fiscal e Ação */}
                        <div className="flex items-center justify-between gap-2 border-b pb-2.5 border-gray-100 dark:border-gray-700/60">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-lg uppercase border ${badge.color}`}>
                              #{realIndex + 1} • {badge.label}
                            </span>

                            {isProd ? (
                              taxaIva > 0 ? (
                                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
                                  c/ IVA incluído ({taxaIva}%)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center gap-1">
                                  ✓ Isento de IVA
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                {cobrarIvaServicos ? `IVA Tributável (${taxaIva}%)` : 'IVA Não Cobrado'}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(realIndex)}
                            className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Remover Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Corpo: Título e Controles */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                          {/* Nome do Item */}
                          <div className="md:col-span-6 space-y-1">
                            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                              Descrição do Item
                            </span>
                            <h4 className="text-xs font-black text-gray-900 dark:text-white leading-snug">
                              {item.descricao}
                            </h4>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                              Unidade: <strong className="text-gray-700 dark:text-gray-300">{item.unidade || 'Unidade'}</strong>
                            </span>
                          </div>

                          {/* Seletor de Quantidade Premium */}
                          <div className="md:col-span-3 space-y-1">
                            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                              Quantidade
                            </span>
                            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-900/60 p-1 rounded-xl border border-gray-200 dark:border-gray-700 w-fit">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(realIndex, -1)}
                                className="p-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 shadow-xs"
                              >
                                <Minus size={13} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantidade}
                                onChange={(e) => handleItemChange(realIndex, 'quantidade', Math.max(1, parseFloat(e.target.value) || 1))}
                                className="w-14 bg-transparent border-none text-xs font-black text-center text-gray-900 dark:text-white focus:ring-0 p-0"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(realIndex, 1)}
                                className="p-1.5 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-200 shadow-xs"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Preço Unitário */}
                          <div className="md:col-span-3 space-y-1 text-right">
                            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block">
                              {isProd ? 'Preço Final Unit. (c/ IVA)' : 'Preço Unitário Base'}
                            </span>
                            <span className="text-sm font-black text-primary block">
                              {formatMoeda(precoFinalUnitario)}
                            </span>
                          </div>
                        </div>

                        {/* Barra de Especificação de Impostos (Anti-Erros de IVA) */}
                        <div className="bg-gray-50/80 dark:bg-gray-900/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Preço (sem IVA)</span>
                            <strong className="text-gray-800 dark:text-gray-200 font-extrabold">{formatMoeda(precoSemIvaUnit)}</strong>
                          </div>

                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Taxa de IVA</span>
                            {isProd ? (
                              taxaIva > 0 ? (
                                <strong className="text-amber-600 dark:text-amber-400 font-bold">{taxaIva}% ({formatMoeda(valorIvaUnit)})</strong>
                              ) : (
                                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Isento de IVA</strong>
                              )
                            ) : (
                              cobrarIvaServicos ? (
                                <strong className="text-amber-600 dark:text-amber-400 font-bold">{taxaIva}% ({formatMoeda(valorIvaUnit)})</strong>
                              ) : (
                                <span className="text-gray-400 font-medium">Não Aplicado</span>
                              )
                            )}
                          </div>

                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Preço Final (c/ IVA)</span>
                            <strong className="text-gray-900 dark:text-white font-black">{formatMoeda(isProd ? precoFinalUnitario : (precoFinalUnitario + (cobrarIvaServicos ? valorIvaUnit : 0)))}</strong>
                          </div>
                        </div>

                        {/* Rodapé da Linha: Subtotal e Total Definitivo */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                          <span className="text-[11px] text-gray-500">
                            Subtotal Sem IVA: <strong className="text-gray-800 dark:text-gray-200 font-black">{formatMoeda(qty * precoSemIvaUnit)}</strong>
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-gray-500">
                              {isProd ? 'Total Linha (c/ IVA incluído):' : 'Total Linha:'}
                            </span>
                            <span className="text-sm font-black text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg">
                              {formatMoeda(totalLinha)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN (FINANCIAL SUMMARY & TAX SETTINGS) */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
              <h3 className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-2.5 border-gray-100 dark:border-gray-800">
                <DollarSign className="text-emerald-500" size={16} /> Detalhes Financeiros do Evento
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Cozinha & Pastelaria (IVA incluído):</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">{formatMoeda(calculatedResumo.subtotalCozinhaPastelaria)}</span>
                </div>

                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Revenda & Bebidas (IVA incluído):</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{formatMoeda(calculatedResumo.subtotalRevenda)}</span>
                </div>

                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Serviços & Equipas (Sem IVA):</span>
                  <span className="font-bold">{formatMoeda(calculatedResumo.subtotalServicos)}</span>
                </div>

                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Espaços & Materiais (Sem IVA):</span>
                  <span className="font-bold">{formatMoeda(calculatedResumo.subtotalAlugueres)}</span>
                </div>

                {/* Encargos & Descontos */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Valor Deslocação:</span>
                    <input
                      type="number"
                      value={valorDeslocacao}
                      onChange={e => setValorDeslocacao(Number(e.target.value))}
                      className="w-24 px-2 py-1 text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">Outros Encargos:</span>
                    <input
                      type="number"
                      value={outrosEncargos}
                      onChange={e => setOutrosEncargos(Number(e.target.value))}
                      className="w-24 px-2 py-1 text-right bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div className="flex items-center justify-between text-rose-600">
                    <span className="font-medium">Desconto Comercial:</span>
                    <input
                      type="number"
                      value={descontoTotal}
                      onChange={e => setDescontoTotal(Number(e.target.value))}
                      className="w-24 px-2 py-1 text-right bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg text-xs font-bold text-rose-600"
                    />
                  </div>
                </div>

                {/* Impostos */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cobrarIvaServicos}
                      onChange={e => setCobrarIvaServicos(e.target.checked)}
                      className="rounded text-primary focus:ring-primary h-4 w-4"
                    />
                    <span className="font-bold text-gray-800 dark:text-gray-200">Cobrar Imposto IVA</span>
                  </label>

                  <div className="flex justify-between text-gray-600 dark:text-gray-400 pt-1">
                    <span>Imposto IVA (15%):</span>
                    <span className="font-bold text-amber-600">{formatMoeda(calculatedResumo.totalIvaGeral)}</span>
                  </div>
                </div>

                {/* Total Geral Highlight Card */}
                <div className="pt-3 border-t-2 border-gray-200 dark:border-gray-700 flex flex-col gap-1 bg-primary/5 p-3 rounded-xl border border-primary/20">
                  <span className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">
                    Total Geral do Evento (c/ IVA)
                  </span>
                  <span className="text-2xl font-black text-primary tracking-tight">
                    {formatMoeda(calculatedResumo.totalGeral)}
                  </span>
                </div>
              </div>

              {/* Observações */}
              <div className="pt-2 space-y-1">
                <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase">
                  Observações e Termos
                </label>
                <textarea
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  rows={3}
                  placeholder="Instruções de logística, requisitos de sala, horário de montagem..."
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIXED STICKY FOOTER BAR AT BOTTOM */}
      <div className="sticky bottom-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-3 sm:p-4 shrink-0 shadow-xl">
        <div className="w-full max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Financial Totals Preview */}
          <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase block">
                Produtos (c/ IVA)
              </span>
              <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
                {formatMoeda(calculatedResumo.subtotalProdutos)}
              </span>
            </div>

            {calculatedResumo.subtotalServicosEAlugueres > 0 && (
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">
                  Serviços
                </span>
                <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
                  {formatMoeda(calculatedResumo.subtotalServicosEAlugueres)}
                </span>
              </div>
            )}

            {calculatedResumo.totalIvaServicos > 0 && (
              <div>
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase block">
                  IVA Serviços
                </span>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  {formatMoeda(calculatedResumo.totalIvaServicos)}
                </span>
              </div>
            )}

            <div className="pl-3 border-l border-gray-200 dark:border-gray-700">
              <span className="text-[10px] text-primary font-black uppercase block">
                TOTAL DO EVENTO
              </span>
              <span className="text-lg font-black text-primary">
                {formatMoeda(calculatedResumo.totalGeral)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => navigate('/eventos')}
              className="px-3.5 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
            >
              Voltar
            </button>

            <button
              type="button"
              onClick={handleSaveRascunho}
              disabled={saveMutation.isPending}
              className="px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-extrabold rounded-xl transition-all border border-gray-200 dark:border-gray-700 flex items-center gap-1.5"
            >
              <Save size={15} />
              <span>Guardar Rascunho</span>
            </button>

            <button
              type="button"
              onClick={handleEmitirProforma}
              disabled={isProformaSubmitting}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-md flex items-center gap-1.5"
            >
              <FileText size={15} />
              <span>{isProformaSubmitting ? 'Gerando...' : 'Emitir Pró-Forma'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenConfirmModal}
              disabled={saveMutation.isPending}
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 size={16} />
              <span>Confirmar & Pagamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* ADD ITEM MODAL WITH TABS & CART DRAWER */}
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        produtos={produtos}
        servicosCadastro={servicosCadastro}
        equipasCadastro={equipasCadastro}
        espacos={espacos}
        materiais={materiais}
        itens={itens}
        onAddItem={handleAddItemFromModal}
        onRemoveItem={handleRemoveItem}
        onUpdateItemQty={handleUpdateItemQty}
        numeroConvidados={numeroConvidados}
      />

      {/* PAYMENT CONFIRMATION MODAL (MESMA LÓGICA CAIXAPOS) */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Finalizar Evento & Registar Pagamento"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-5">
          {/* Resumo do Evento e Cliente */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-gray-500">Evento</span>
              <span className="text-xs font-extrabold text-gray-900 dark:text-white">{titulo}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-gray-500">Cliente</span>
              <span className="text-xs font-extrabold text-primary">
                {selectedClientObj ? selectedClientObj.nome : 'Cliente Selecionado'}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-primary/20">
              <span className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">Total do Evento (c/ IVA)</span>
              <span className="text-xl font-black text-primary">{formatMoeda(calculatedResumo.totalGeral)}</span>
            </div>
          </div>

          {/* Condição de Pagamento */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase block">
              Condição de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Pronto Pagamento', label: '100% Total', pct: 1.0 },
                { id: '50% Adiantamento', label: '50% Sinal', pct: 0.5 },
                { id: '30% Adiantamento', label: '30% Sinal', pct: 0.3 },
                { id: 'Personalizado', label: 'Livre', pct: 0 },
              ].map((cond) => (
                <button
                  key={cond.id}
                  type="button"
                  onClick={() => {
                    setCondicaoPagamento(cond.id as any);
                    if (cond.pct > 0) {
                      setValorPagoInput(String(calculatedResumo.totalGeral * cond.pct));
                    }
                  }}
                  className={`p-2.5 rounded-xl text-xs font-black transition-all border ${
                    condicaoPagamento === cond.id
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {cond.label}
                </button>
              ))}
            </div>
          </div>

          {/* Método de Pagamento */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase block">
              Método de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'Dinheiro', label: 'Dinheiro', icon: Wallet },
                { id: 'TPA / Multicaixa', label: 'TPA / POS', icon: CreditCard },
                { id: 'Transferência Bancária', label: 'Transferência', icon: Landmark },
                { id: 'Pagamento Misto', label: 'Misto', icon: DollarSign },
              ].map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setMetodoPagamento(method.id as any)}
                    className={`p-3 rounded-xl text-xs font-black flex flex-col items-center justify-center gap-1.5 transition-all border ${
                      metodoPagamento === method.id
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Campos Adicionais para Transferência/TPA */}
          {(metodoPagamento === 'Transferência Bancária' || metodoPagamento === 'TPA / Multicaixa' || metodoPagamento === 'Pagamento Misto') && (
            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
              <div>
                <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase block mb-1">
                  N.º do Comprovativo / Operação *
                </label>
                <input
                  type="text"
                  value={codigoComprovativo}
                  onChange={(e) => setCodigoComprovativo(e.target.value)}
                  placeholder="Ex: TRF-9823410293 ou N.º de Autorização TPA"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-gray-700 dark:text-gray-300 uppercase block mb-1">
                  Titular / Banco Emissor
                </label>
                <input
                  type="text"
                  value={bancoEmissor}
                  onChange={(e) => setBancoEmissor(e.target.value)}
                  placeholder="Ex: BAI, BFA, BIC, Millennium..."
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>
          )}

          {/* Valor Entregue e Troco */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase block mb-1">
                Valor Entregue / A Pagar (STN)
              </label>
              <input
                type="number"
                step="0.01"
                value={valorPagoInput}
                onChange={(e) => setValorPagoInput(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-primary/50 rounded-xl px-3.5 py-2.5 text-base font-black text-primary"
              />
            </div>

            <div>
              <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase block mb-1">
                Troco a Devolver
              </label>
              <div className="w-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl px-3.5 py-2.5 text-base font-black text-emerald-600">
                {formatMoeda(Math.max(0, (parseFloat(valorPagoInput) || 0) - calculatedResumo.totalGeral))}
              </div>
            </div>
          </div>

          {/* Observações do Pagamento */}
          <div>
            <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase block mb-1">
              Observações do Pagamento
            </label>
            <input
              type="text"
              value={observacoesPagamento}
              onChange={(e) => setObservacoesPagamento(e.target.value)}
              placeholder="Ex: Sinal do evento recebido via Multicaixa..."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-medium"
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-extrabold rounded-xl"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleFinalizeWithPayment}
              disabled={saveMutation.isPending}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              <span>{saveMutation.isPending ? 'Concluindo...' : 'Finalizar & Gravar Evento'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

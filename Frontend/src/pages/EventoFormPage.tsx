import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService, clientService, productService, materialService } from '../services';
import { formatCurrency } from '../lib/utils';
import { 
  ArrowLeft, Save, Plus, Trash2, Sparkles, PartyPopper, Calendar, Clock, MapPin, 
  Users, DollarSign, Calculator, CheckCircle2, ShieldAlert, FileText, ChevronRight, Ruler
} from 'lucide-react';
import { toast } from 'react-toastify';

const formatMoeda = (val: number) => formatCurrency(Number(val || 0));

interface EventoItemForm {
  id?: number;
  tipo_item: 'Servico' | 'Espaco' | 'Material' | 'MaoDeObra' | 'Produto' | 'ProdutoCozinha' | 'ProdutoPastelaria' | 'ProdutoRevenda' | 'Outro';
  referencia_id?: number | null;
  produto_id?: number | null;
  descricao: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
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

  // Items State (Agregador Unificado)
  const [itens, setItens] = useState<EventoItemForm[]>([]);

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
      const res = await productService.getAll();
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

  const { data: unidadesMedidaData } = useQuery({
    queryKey: ['unidades-medida-select'],
    queryFn: () => productService.getUnidadesMedida()
  });
  const unidadesMedida: any[] = Array.isArray(unidadesMedidaData) ? unidadesMedidaData : (unidadesMedidaData as any)?.items || [];

  // Fetch Event Data if Editing
  const { data: eventoEditData, isLoading: isLoadingEvento } = useQuery({
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
          taxa_iva: Number(it.taxa_iva || 15),
          observacoes: it.observacoes || '',
          sugestao_politica_id: it.sugestao_politica_id || null,
          sugestao_origem: it.sugestao_origem || null
        })));
      }
    }
  }, [eventoEditData]);

  // Handle Price Suggestions from Backend Motor
  const handleConsultarSugestao = async (index: number, overrideTipoItem?: string, overrideRefId?: number, overrideNome?: string) => {
    const item = itens[index];
    if (!item) return;

    const reqPayload = {
      tipo_evento: tipoEvento,
      numero_convidados: numeroConvidados,
      tipo_item: overrideTipoItem || item.tipo_item,
      referencia_id: overrideRefId !== undefined ? overrideRefId : item.referencia_id,
      nome_item: overrideNome || item.descricao
    };

    try {
      const res = await eventService.sugerirPreco(reqPayload);
      if (res && res.preco_unitario_sugerido !== undefined) {
        setItens(prev => {
          const next = [...prev];
          next[index] = {
            ...next[index],
            preco_unitario: Number(res.preco_unitario_sugerido),
            sugestao_politica_id: res.politica_id || null,
            sugestao_origem: res.origem || 'Sugestão Comercial Automática'
          };
          return next;
        });
        toast.info(`Preço sugerido aplicado: ${formatMoeda(res.preco_unitario_sugerido)} (${res.origem || 'Política'})`);
      }
    } catch (err) {
      // Fallback silent or warning
    }
  };

  // Add Item Line
  const handleAddItem = (tipo: EventoItemForm['tipo_item'] = 'Servico') => {
    let desc = 'Item do Evento';
    let qtd = 1;
    let unid = 'Unidade';

    if (tipo === 'Servico') {
      desc = 'Serviço de Cozinha e Catering';
      qtd = numeroConvidados;
      unid = 'Pessoa';
    } else if (tipo === 'Espaco') {
      desc = 'Aluguer de Salão / Recinto';
    } else if (tipo === 'Material') {
      desc = 'Aluguer de Louças / Equipamentos';
      qtd = numeroConvidados;
    } else if (tipo === 'MaoDeObra') {
      desc = 'Mão de Obra / Garçons';
      unid = 'Hora';
    } else if (tipo === 'ProdutoCozinha') {
      desc = 'Menu Cozinha (Ordem Produção)';
      qtd = numeroConvidados;
      unid = 'Pessoa';
    } else if (tipo === 'ProdutoPastelaria') {
      desc = 'Bolo / Pastelaria (Ordem Produção)';
    } else if (tipo === 'ProdutoRevenda') {
      desc = 'Bebidas / Revenda Direta';
      unid = 'Garrafa';
    }

    const newItem: EventoItemForm = {
      tipo_item: tipo,
      referencia_id: null,
      produto_id: null,
      descricao: desc,
      quantidade: qtd,
      unidade: unid,
      preco_unitario: 0,
      taxa_iva: taxaIvaServicos,
      observacoes: ''
    };
    setItens(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItens(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof EventoItemForm, value: any) => {
    setItens(prev => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      // Auto update description if reference selected
      if (field === 'referencia_id' || field === 'produto_id') {
        if (item.tipo_item === 'Servico') {
          const found = servicosCadastro.find((s: any) => s.id === Number(value));
          if (found) {
            item.descricao = found.nome;
            item.unidade = found.unidade_padrao || 'Pessoa';
            item.preco_unitario = Number(found.preco_sugerido || 0);
          }
        } else if (item.tipo_item === 'MaoDeObra') {
          const found = equipasCadastro.find((e: any) => e.id === Number(value));
          if (found) {
            item.descricao = found.nome;
            item.preco_unitario = Number(found.preco_sugerido || 0);
          }
        } else if (item.tipo_item === 'Espaco') {
          const found = espacos.find((es: any) => es.id === Number(value));
          if (found) {
            item.descricao = `Aluguer ${found.nome}`;
            item.preco_unitario = Number(found.preco_aluguer || 0);
          }
        } else if (['Produto', 'ProdutoCozinha', 'ProdutoPastelaria', 'ProdutoRevenda'].includes(item.tipo_item)) {
          const found = produtos.find((p: any) => p.id === Number(value));
          if (found) {
            item.descricao = found.nome;
            item.produto_id = found.id;
            item.preco_unitario = Number(found.preco || 0);
            if (found.unidade_medida) item.unidade = found.unidade_medida;
          }
        } else if (item.tipo_item === 'Material') {
          const found = materiais.find((m: any) => m.id === Number(value));
          if (found) {
            item.descricao = `Aluguer ${found.nome}`;
            item.preco_unitario = Number(found.preco_aluguer || found.preco_custo || 0);
          }
        }
      }

      next[index] = item;
      return next;
    });
  };

  // Real-time Financial Calculations
  const calculatedResumo = React.useMemo(() => {
    let subtotalProdutos = 0;
    let subtotalCozinhaPastelaria = 0;
    let subtotalRevenda = 0;
    let subtotalServicos = 0;
    let subtotalAlugueres = 0;
    let totalIvaProdutos = 0;
    let totalIvaServicos = 0;

    itens.forEach(it => {
      const sub = Number(it.quantidade || 0) * Number(it.preco_unitario || 0);
      const desc = Number(it.valor_desconto || 0) || (sub * (Number(it.percentual_desconto || 0) / 100));
      const liquid = Math.max(0, sub - desc);
      const iva = cobrarIvaServicos ? (liquid * (Number(it.taxa_iva || 15) / 100)) : 0;

      if (['Produto', 'ProdutoCozinha', 'ProdutoPastelaria'].includes(it.tipo_item)) {
        subtotalProdutos += liquid;
        subtotalCozinhaPastelaria += liquid;
        totalIvaProdutos += iva;
      } else if (it.tipo_item === 'ProdutoRevenda') {
        subtotalProdutos += liquid;
        subtotalRevenda += liquid;
        totalIvaProdutos += iva;
      } else if (it.tipo_item === 'Espaco' || it.tipo_item === 'Material') {
        subtotalAlugueres += liquid;
        totalIvaServicos += iva;
      } else {
        subtotalServicos += liquid;
        totalIvaServicos += iva;
      }
    });

    const subtotalGeral = subtotalProdutos + subtotalServicos + subtotalAlugueres + Number(valorDeslocacao || 0) + Number(outrosEncargos || 0) - Number(descontoTotal || 0);
    const totalIvaGeral = totalIvaProdutos + totalIvaServicos;
    const totalGeral = subtotalGeral + totalIvaGeral;

    return {
      subtotalProdutos,
      subtotalCozinhaPastelaria,
      subtotalRevenda,
      subtotalServicos,
      subtotalAlugueres,
      subtotalGeral,
      totalIvaGeral,
      totalGeral
    };
  }, [itens, valorDeslocacao, outrosEncargos, descontoTotal, cobrarIvaServicos]);

  // Submit Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (isEditing) {
        return eventService.update(id!, payload);
      } else {
        return eventService.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(isEditing ? 'Evento atualizado com sucesso.' : 'Evento criado com sucesso!');
      navigate('/eventos');
    },
    onError: (err: any) => toast.error(err?.message || 'Erro ao guardar evento.')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo) {
      toast.error('O título do evento é obrigatório.');
      return;
    }

    const payload = {
      titulo,
      tipo_evento: tipoEvento,
      cliente_id: clienteId ? Number(clienteId) : null,
      local_evento: localEvento,
      numero_convidados: Number(numeroConvidados || 100),
      data_evento: dataEvento,
      hora_inicio: horaInicio.length === 5 ? `${horaInicio}:00` : horaInicio,
      hora_fim: horaFim.length === 5 ? `${horaFim}:00` : horaFim,
      cobrar_iva_servicos: cobrarIvaServicos,
      taxa_iva_servicos: Number(taxaIvaServicos || 15),
      valor_deslocacao: Number(valorDeslocacao || 0),
      outros_encargos: Number(outrosEncargos || 0),
      desconto_total: Number(descontoTotal || 0),
      observacoes,
      itens: itens.map(it => ({
        tipo_item: it.tipo_item,
        referencia_id: it.referencia_id ? Number(it.referencia_id) : null,
        produto_id: it.produto_id ? Number(it.produto_id) : null,
        descricao: it.descricao,
        quantidade: Number(it.quantidade || 1),
        unidade: it.unidade || 'Pessoa',
        preco_unitario: Number(it.preco_unitario || 0),
        taxa_iva: Number(it.taxa_iva || 15),
        observacoes: it.observacoes || '',
        sugestao_politica_id: it.sugestao_politica_id || null,
        sugestao_origem: it.sugestao_origem || null
      }))
    };

    saveMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-surface-dark p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/eventos')}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {isEditing ? `Editar Evento #${id}` : 'Novo Evento Comercial'}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mt-0.5">
              {titulo || 'Orçamentação e Registo de Evento'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/eventos')}
            className="px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="evento-form"
            disabled={saveMutation.isPending}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Save size={16} />
            {saveMutation.isPending ? 'A Guardar...' : isEditing ? 'Atualizar Evento' : 'Finalizar e Registar Evento'}
          </button>
        </div>
      </div>

      <form id="evento-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT & CENTER COLUMN (FORM SECTIONS) */}
        <div className="lg:col-span-2 space-y-6">
          {/* SECTION 1: IDENTIFICAÇÃO E DADOS PRINCIPAIS */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-3 border-gray-100 dark:border-gray-800">
              <PartyPopper className="text-primary" size={18} /> 1. Dados Principais do Evento
            </h2>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Título Comercial do Evento *</label>
              <input
                type="text"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                required
                placeholder="Ex: Banquete de Casamento - Família Silva, Gala Anual de Empresas..."
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl text-sm font-bold text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Tipo de Evento *</label>
                <select
                  value={tipoEvento}
                  onChange={e => setTipoEvento(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl text-sm"
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Cliente *</label>
                <select
                  value={clienteId}
                  onChange={e => setClienteId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl text-sm"
                >
                  <option value="">Consumidor Final / Cliente Geral</option>
                  {clientes.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nome} ({c.nif || 'Sem NIF'})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Nº de Convidados (Pax) *</label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    value={numeroConvidados}
                    onChange={e => setNumeroConvidados(Number(e.target.value))}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl text-sm font-bold text-primary"
                  />
                  <Users size={16} className="absolute left-3 top-3 text-gray-400" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Espaço / Recinto</label>
                <select
                  value={espacoId}
                  onChange={e => {
                    const idVal = e.target.value ? Number(e.target.value) : '';
                    setEspacoId(idVal);
                    const selected = espacos.find((es: any) => es.id === idVal);
                    if (selected) setLocalEvento(selected.nome);
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl text-sm"
                >
                  <option value="">Selecione o recinto...</option>
                  {espacos.map((es: any) => (
                    <option key={es.id} value={es.id}>{es.nome} (Capacidade: {es.capacidade} pax)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Localização Livre</label>
                <input
                  type="text"
                  value={localEvento}
                  onChange={e => setLocalEvento(e.target.value)}
                  placeholder="Ex: Salão Nobre Principal"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Data do Evento *</label>
                <input
                  type="date"
                  value={dataEvento}
                  onChange={e => setDataEvento(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Hora Início</label>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={e => setHoraInicio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Hora Término</label>
                <input
                  type="time"
                  value={horaFim}
                  onChange={e => setHoraFim(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: ITENS E DOCUMENTO COMERCIAL (`eventos_itens`) */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Calculator className="text-primary" size={18} /> 2. Itens do Orçamento Comercial (`eventos_itens`)
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Adicione menus da cozinha, pastelaria, produtos de revenda, serviços, salões ou equipamentos.
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAddItem('ProdutoCozinha')}
                  className="px-2.5 py-1.5 bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:text-amber-300 text-xs font-bold rounded-lg flex items-center gap-1"
                  title="Gera Ordem de Produção Cozinha"
                >
                  🍳 Cozinha
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('ProdutoPastelaria')}
                  className="px-2.5 py-1.5 bg-pink-500/10 text-pink-700 hover:bg-pink-500/20 dark:text-pink-300 text-xs font-bold rounded-lg flex items-center gap-1"
                  title="Gera Ordem de Produção Pastelaria"
                >
                  🥐 Pastelaria
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('ProdutoRevenda')}
                  className="px-2.5 py-1.5 bg-purple-500/10 text-purple-700 hover:bg-purple-500/20 dark:text-purple-300 text-xs font-bold rounded-lg flex items-center gap-1"
                  title="Produtos de Revenda (Bebidas, Snacks - Sem Produção)"
                >
                  🍾 Revenda
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('Servico')}
                  className="px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Plus size={14} /> Serviço
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('Espaco')}
                  className="px-2.5 py-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Plus size={14} /> Espaço
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('Material')}
                  className="px-2.5 py-1.5 bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20 text-xs font-bold rounded-lg flex items-center gap-1"
                  title="Gera Requisição Interna Logística"
                >
                  🚚 Material
                </button>
                <button
                  type="button"
                  onClick={() => handleAddItem('MaoDeObra')}
                  className="px-2.5 py-1.5 bg-slate-500/10 text-slate-700 hover:bg-slate-500/20 dark:text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1"
                >
                  <Plus size={14} /> Equipa
                </button>
              </div>
            </div>

            {itens.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-gray-50/50 dark:bg-gray-800/30 space-y-3">
                <Sparkles className="mx-auto text-primary animate-bounce" size={32} />
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Nenhum item adicionado ao orçamento do evento.
                </p>
                <p className="text-[11px] text-gray-400 max-w-md mx-auto leading-relaxed">
                  Utilize os botões acima para incluir menus de Cozinha & Pastelaria (geram Ordens de Produção), Produtos de Revenda (bebidas, snacks com stock direto), Serviços ou Equipamentos.
                </p>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddItem('ProdutoCozinha')}
                    className="px-3.5 py-2 bg-amber-500 text-white font-bold text-xs rounded-xl shadow hover:bg-amber-600 transition-all flex items-center gap-1"
                  >
                    🍳 + Menu Cozinha
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddItem('ProdutoRevenda')}
                    className="px-3.5 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow hover:bg-purple-700 transition-all flex items-center gap-1"
                  >
                    🍾 + Bebidas / Revenda
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddItem('Servico')}
                    className="px-3.5 py-2 bg-primary text-white font-bold text-xs rounded-xl shadow hover:bg-primary-hover transition-all flex items-center gap-1"
                  >
                    💼 + Serviço
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {itens.map((item, index) => {
                  const getDestinationBadge = () => {
                    if (item.tipo_item === 'ProdutoCozinha') return { label: '🍳 Setor Cozinha → Ordem de Produção', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
                    if (item.tipo_item === 'ProdutoPastelaria') return { label: '🥐 Setor Pastelaria → Ordem de Produção', color: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300' };
                    if (item.tipo_item === 'ProdutoRevenda') return { label: '🍾 Revenda Direta → Abate Stock & Faturação (Sem Produção)', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
                    if (item.tipo_item === 'Material') return { label: '🚚 Logística → Requisição de Equipamentos', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300' };
                    if (item.tipo_item === 'Espaco') return { label: '🏛️ Reserva Recinto → Agenda Anti-conflito', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
                    if (item.tipo_item === 'MaoDeObra') return { label: '👥 Recursos Humanos → Afetação Equipa', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' };
                    if (item.tipo_item === 'Produto') return { label: '📦 Produto Geral', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };
                    return { label: '💼 Serviço Contratado', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
                  };

                  const badge = getDestinationBadge();

                  return (
                    <div key={index} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40 space-y-3 relative group">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 text-[10px] font-black rounded uppercase tracking-wider ${badge.color}`}>
                            Linha #{index + 1} • {badge.label}
                          </span>

                          {item.sugestao_origem && (
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200/50">
                              <Sparkles size={10} /> {item.sugestao_origem}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="text-gray-400 hover:text-rose-500 p-1 rounded hover:bg-rose-50 transition-colors"
                          title="Remover Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* TIPO E REFERÊNCIA */}
                        <div className="md:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Seleção de Catálogo</label>
                          {item.tipo_item === 'Servico' ? (
                            <select
                              value={item.referencia_id || ''}
                              onChange={e => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                handleItemChange(index, 'referencia_id', val);
                                if (val) handleConsultarSugestao(index, 'Servico', val);
                              }}
                              className="w-full p-2 bg-white dark:bg-gray-900 border rounded-lg text-xs"
                            >
                              <option value="">Serviço Livre...</option>
                              {servicosCadastro.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.nome}</option>
                              ))}
                            </select>
                          ) : item.tipo_item === 'Espaco' ? (
                            <select
                              value={item.referencia_id || ''}
                              onChange={e => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                handleItemChange(index, 'referencia_id', val);
                                if (val) handleConsultarSugestao(index, 'Espaco', val);
                              }}
                              className="w-full p-2 bg-white dark:bg-gray-900 border rounded-lg text-xs"
                            >
                              <option value="">Espaço Livre...</option>
                              {espacos.map((es: any) => (
                                <option key={es.id} value={es.id}>{es.nome}</option>
                              ))}
                            </select>
                          ) : item.tipo_item === 'MaoDeObra' ? (
                            <select
                              value={item.referencia_id || ''}
                              onChange={e => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                handleItemChange(index, 'referencia_id', val);
                                if (val) handleConsultarSugestao(index, 'MaoDeObra', val);
                              }}
                              className="w-full p-2 bg-white dark:bg-gray-900 border rounded-lg text-xs"
                            >
                              <option value="">Cargo Livre...</option>
                              {equipasCadastro.map((eq: any) => (
                                <option key={eq.id} value={eq.id}>{eq.nome}</option>
                              ))}
                            </select>
                          ) : ['Produto', 'ProdutoCozinha', 'ProdutoPastelaria', 'ProdutoRevenda'].includes(item.tipo_item) ? (
                            <select
                              value={item.produto_id || ''}
                              onChange={e => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                handleItemChange(index, 'produto_id', val);
                              }}
                              className="w-full p-2 bg-white dark:bg-gray-900 border rounded-lg text-xs"
                            >
                              <option value="">
                                {item.tipo_item === 'ProdutoRevenda' ? 'Selecione Produto de Revenda...' : 'Selecione Produto...'}
                              </option>
                              {produtos
                                .filter((p: any) => {
                                  if (item.tipo_item === 'ProdutoRevenda') return p.tipo === 'Revenda' || p.servico === 'BAR' || p.categoria === 'Revenda';
                                  if (item.tipo_item === 'ProdutoCozinha') return p.servico === 'COZINHA' || p.tipo === 'Acabado';
                                  if (item.tipo_item === 'ProdutoPastelaria') return p.servico === 'PASTELARIA' || p.tipo === 'Acabado';
                                  return true;
                                })
                                .map((p: any) => (
                                  <option key={p.id} value={p.id}>{p.nome} ({p.tipo || p.servico || 'Produto'})</option>
                                ))}
                            </select>
                          ) : item.tipo_item === 'Material' ? (
                            <select
                              value={item.referencia_id || ''}
                              onChange={e => {
                                const val = e.target.value ? Number(e.target.value) : null;
                                handleItemChange(index, 'referencia_id', val);
                              }}
                              className="w-full p-2 bg-white dark:bg-gray-900 border rounded-lg text-xs"
                            >
                              <option value="">Material / Equipamento...</option>
                              {materiais.map((m: any) => (
                                <option key={m.id} value={m.id}>{m.nome}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              placeholder="Nome / Descrição livre..."
                              value={item.descricao}
                              onChange={e => handleItemChange(index, 'descricao', e.target.value)}
                              className="w-full p-2 bg-white dark:bg-gray-900 border rounded-lg text-xs"
                            />
                          )}
                        </div>

                        {/* DESCRIÇÃO COMPLETA */}
                        <div className="md:col-span-4 space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Descrição da Linha Comercial</label>
                          <input
                            type="text"
                            value={item.descricao}
                            onChange={e => handleItemChange(index, 'descricao', e.target.value)}
                            className="w-full p-2 bg-white dark:bg-gray-900 border rounded-lg text-xs font-semibold"
                          />
                        </div>

                        {/* QTD & UNIDADE */}
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-gray-500 uppercase">Qtd / Unidade</label>
                          <div className="flex gap-1">
                            <input
                              type="number"
                              min={1}
                              value={item.quantidade}
                              onChange={e => handleItemChange(index, 'quantidade', Number(e.target.value))}
                              className="w-16 p-2 bg-white dark:bg-gray-900 border rounded-lg text-xs font-bold text-center"
                            />
                            <select
                              value={item.unidade}
                              onChange={e => handleItemChange(index, 'unidade', e.target.value)}
                              className="flex-1 p-2 bg-white dark:bg-gray-900 border rounded-lg text-[11px]"
                            >
                              <option value="Pessoa">Pessoa</option>
                              <option value="Unidade">Unidade</option>
                              <option value="Garrafa">Garrafa</option>
                              <option value="Caixa">Caixa</option>
                              <option value="Hora">Hora</option>
                              <option value="Dia">Dia</option>
                              {unidadesMedida.map((u: any) => (
                                <option key={u.id} value={u.sigla || u.nome}>{u.nome}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* PREÇO UNITÁRIO & SUGESTÃO */}
                        <div className="md:col-span-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Preço Unitário</label>
                            <button
                              type="button"
                              onClick={() => handleConsultarSugestao(index)}
                              className="text-[10px] text-primary font-bold hover:underline flex items-center gap-0.5"
                            >
                              <Sparkles size={10} /> Sugerir
                            </button>
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            value={item.preco_unitario}
                            onChange={e => handleItemChange(index, 'preco_unitario', Number(e.target.value))}
                            className="w-full p-2 bg-white dark:bg-gray-900 border rounded-lg text-xs font-bold text-primary"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200/50 dark:border-gray-800">
                        <span className="text-[11px] text-gray-400">
                          Subtotal da Linha: <strong className="text-gray-700 dark:text-gray-200">{formatMoeda(item.quantidade * item.preco_unitario)}</strong>
                        </span>

                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <span>Taxa IVA:</span>
                            <input
                              type="number"
                              value={item.taxa_iva || 15}
                              onChange={e => handleItemChange(index, 'taxa_iva', Number(e.target.value))}
                              className="w-12 p-1 text-center bg-white dark:bg-gray-900 border rounded"
                            />
                            %
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN (FINANCIAL RESUMO & FISCAL RULES) */}
        <div className="space-y-6">
          {/* PAINEL FINANCEIRO SINTÉTICO */}
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md space-y-4 sticky top-6">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b pb-3 border-gray-100 dark:border-gray-800">
              <DollarSign className="text-emerald-500" size={18} /> Resumo Financeiro do Orçamento
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal Serviços:</span>
                <span className="font-bold">{formatMoeda(calculatedResumo.subtotalServicos)}</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal Espaços & Alugueres:</span>
                <span className="font-bold">{formatMoeda(calculatedResumo.subtotalAlugueres)}</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal Cozinha & Pastelaria:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{formatMoeda(calculatedResumo.subtotalCozinhaPastelaria)}</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal Produtos Revenda:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400">{formatMoeda(calculatedResumo.subtotalRevenda)}</span>
              </div>

              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal Produtos:</span>
                <span className="font-bold">{formatMoeda(calculatedResumo.subtotalProdutos)}</span>
              </div>

              {/* ENCARGOS / DESLOCAÇÃO */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Valor Deslocação:</span>
                  <input
                    type="number"
                    value={valorDeslocacao}
                    onChange={e => setValorDeslocacao(Number(e.target.value))}
                    className="w-24 p-1 text-right bg-gray-50 dark:bg-gray-800 border rounded text-xs font-bold"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Outros Encargos:</span>
                  <input
                    type="number"
                    value={outrosEncargos}
                    onChange={e => setOutrosEncargos(Number(e.target.value))}
                    className="w-24 p-1 text-right bg-gray-50 dark:bg-gray-800 border rounded text-xs font-bold"
                  />
                </div>

                <div className="flex items-center justify-between text-rose-600">
                  <span>Desconto Comercial:</span>
                  <input
                    type="number"
                    value={descontoTotal}
                    onChange={e => setDescontoTotal(Number(e.target.value))}
                    className="w-24 p-1 text-right bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded text-xs font-bold text-rose-600"
                  />
                </div>
              </div>

              {/* FISCAL RULES */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cobrarIvaServicos}
                    onChange={e => setCobrarIvaServicos(e.target.checked)}
                    className="rounded text-primary focus:ring-primary h-4 w-4"
                  />
                  <span className="font-bold text-gray-800 dark:text-gray-200">Cobrar IVA sobre Serviços</span>
                </label>

                <div className="flex justify-between text-gray-600 dark:text-gray-400 pt-1">
                  <span>Imposto IVA Estimado:</span>
                  <span className="font-bold text-amber-600">{formatMoeda(calculatedResumo.totalIvaGeral)}</span>
                </div>
              </div>

              {/* TOTAL GERAL HIGHLIGHT */}
              <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700 flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Geral do Evento</span>
                <span className="text-2xl font-black text-primary tracking-tight">
                  {formatMoeda(calculatedResumo.totalGeral)}
                </span>
              </div>
            </div>

            {/* OBSERVAÇÕES E CONTRATO */}
            <div className="pt-3 space-y-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase">Observações do Contrato / Notas</label>
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Condições de pagamento, horário de entrega de materiais..."
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-800 border rounded-xl text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Save size={16} />
              {saveMutation.isPending ? 'A Processar...' : isEditing ? 'Guardar Alterações' : 'Confirmar e Registar Evento'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

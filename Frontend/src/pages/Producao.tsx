import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionService, productService, requestService, orderService, clientService } from '../services';
import { useAuth } from '../components/AuthContext';
import {
  ChefHat,
  Filter,
  Search,
  Calendar,
  LayoutGrid,
  Columns3,
  RefreshCw,
  Utensils,
  Cake,
  Wine,
  AlertCircle,
  Clock,
  Play,
  CheckCircle,
  CheckCheck,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'react-toastify';
import { ProductionOrderCard, extractOrderItems } from './Producao/ProductionOrderCard';
import { ProductionOrderModal } from './Producao/ProductionOrderModal';

type SectorType = 'Todos' | 'Cozinha' | 'Pastelaria' | 'Bar';
type StateTabType = 'todos' | 'pendente' | 'producao' | 'pronto' | 'entregue';
type ViewModeType = 'tabs' | 'kanban';

export default function Producao() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [now, setNow] = useState(new Date());

  // Identificar se o utilizador possui setor específico (Cozinha ou Pastelaria)
  const userDedicatedSector = useMemo<SectorType | null>(() => {
    if (!user) {
      try {
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          const r = (u?.role || '').toLowerCase().trim();
          const s = (u?.sector || u?.setor || '').toLowerCase().trim();
          if (r === 'cozinha' || s === 'cozinha') return 'Cozinha';
          if (r === 'pastelaria' || s === 'pastelaria') return 'Pastelaria';
          if (r.includes('bar') || s.includes('bar')) return 'Bar';
        }
      } catch {
        // fallback
      }
      return null;
    }

    const role = (user.role || '').toLowerCase().trim();
    const rawSector = ((user as any).sector || (user as any).setor || '').toLowerCase().trim();

    if (role === 'cozinha' || rawSector === 'cozinha') return 'Cozinha';
    if (role === 'pastelaria' || rawSector === 'pastelaria') return 'Pastelaria';
    if (role === 'bar' || role === 'bar e restaurante' || rawSector.includes('bar')) return 'Bar';
    return null;
  }, [user]);

  // Se o utilizador for Cozinha -> abre Cozinha; se Pastelaria -> abre Pastelaria; outros -> 'Todos'
  const [selectedSector, setSelectedSector] = useState<SectorType>(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        const r = (u?.role || '').toLowerCase().trim();
        const s = (u?.sector || u?.setor || '').toLowerCase().trim();
        if (r === 'cozinha' || s === 'cozinha') return 'Cozinha';
        if (r === 'pastelaria' || s === 'pastelaria') return 'Pastelaria';
        if (r.includes('bar') || s.includes('bar')) return 'Bar';
      }
    } catch {
      // fallback
    }
    return 'Todos';
  });

  // Sincronizar quando os dados de autenticação carregarem
  useEffect(() => {
    if (userDedicatedSector) {
      setSelectedSector(userDedicatedSector);
    }
  }, [userDedicatedSector]);

  const [selectedStateTab, setSelectedStateTab] = useState<StateTabType>('todos');
  const [viewMode, setViewMode] = useState<ViewModeType>('tabs');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  // Atualização periódica do relógio para atualizar tempos de espera e alertas de atraso
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // Redefinir página para 1 quando os filtros mudam
  useEffect(() => {
    setPage(1);
  }, [selectedSector, selectedDate, selectedStateTab, searchTerm, pageSize]);

  // Consulta das Ordens de Produção (limite de busca amplo para permitir filtragem fluida)
  const { data: ordersResponse, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['production-orders', selectedSector, selectedDate],
    queryFn: () =>
      productionService.getAll({
        sector: selectedSector !== 'Todos' ? selectedSector : undefined,
        data: selectedDate,
        per_page: 500
      }),
    refetchInterval: 8000 // Polling resiliente
  });

  // Consulta do Catálogo de Produtos
  const { data: productsResponse } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll({ per_page: 5000 })
  });

  // Consulta das Requisições de Armazém
  const { data: requisitionsResponse } = useQuery({
    queryKey: ['requisitions-all'],
    queryFn: () => requestService.getAll({ per_page: 500 }).catch(() => ({ items: [] })),
    refetchInterval: 12000
  });

  // Consulta dos Pedidos Comerciais (para cruzar com dados de cliente, mesa e entrega)
  const { data: commercialOrdersResponse } = useQuery({
    queryKey: ['commercial-orders-producao'],
    queryFn: () => orderService.getAll({ per_page: 1000 }).catch(() => ({ items: [] })),
    refetchInterval: 10000
  });

  // Consulta dos Clientes
  const { data: clientsResponse } = useQuery({
    queryKey: ['clients-producao'],
    queryFn: () => clientService.getAll({ per_page: 5000 }).catch(() => ({ items: [] }))
  });

  const orders = ordersResponse?.items || [];
  const products = productsResponse?.items || [];
  const requisitionsList = requisitionsResponse?.items || [];
  const commercialOrders = commercialOrdersResponse?.items || [];
  const clientsList = clientsResponse?.items || [];

  const requisitionsMap = useMemo(() => {
    const map: Record<string | number, any> = {};
    requisitionsList.forEach((r: any) => {
      map[r.id] = r;
    });
    return map;
  }, [requisitionsList]);

  const ordersMap = useMemo(() => {
    const map: Record<string | number, any> = {};
    commercialOrders.forEach((o: any) => {
      map[o.id] = o;
      if (o.numero) map[o.numero] = o;
    });
    return map;
  }, [commercialOrders]);

  const clientsMap = useMemo(() => {
    const map: Record<string | number, any> = {};
    clientsList.forEach((c: any) => {
      map[c.id] = c;
    });
    return map;
  }, [clientsList]);

  // Normalizador de estados
  const normalizeEstadoProducao = (estado: any) => {
    const raw = String(estado?.value || estado || '').trim();
    const key = raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[\s-]+/g, '_');

    if (key === 'PENDENTE') return 'Pendente';
    if (key === 'EM_PRODUCAO' || key === 'EM_PREPARACAO') return 'Em Producao';
    if (key === 'PRONTO') return 'Pronto';
    if (key === 'ENTREGUE' || key === 'CONCLUIDO') return 'Entregue';
    return raw;
  };

  // Enriquecer ordens com metadados do pedido pai e cliente
  const enrichedOrders = useMemo(() => {
    return orders.map((o: any) => {
      const parentOrder = o.pedido_id ? ordersMap[o.pedido_id] : null;
      const clientObj =
        o.cliente ||
        (parentOrder?.cliente_id ? clientsMap[parentOrder.cliente_id] : null) ||
        parentOrder?.cliente;
      const clienteNome =
        (typeof o.cliente_nome === 'string' && o.cliente_nome.trim() ? o.cliente_nome : null) ||
        (typeof o.cliente === 'string' && o.cliente.trim() ? o.cliente : null) ||
        clientObj?.nome ||
        clientObj?.name ||
        parentOrder?.cliente_nome ||
        'Balcão';
      const clienteTelefone = clientObj?.telefone || clientObj?.phone || parentOrder?.cliente_telefone || '';
      const mesa = o.mesa || o.local || parentOrder?.mesa || '';
      const pedidoNumero = o.pedido_numero || parentOrder?.numero || (o.pedido_id ? `#${o.pedido_id}` : null);
      const dataEntrega = o.data_entrega || parentOrder?.data_entrega || o.data_producao || '';
      const horaEntrega = o.hora_entrega || parentOrder?.hora_entrega || '';
      const observacoes = o.observacoes || parentOrder?.observacoes || '';

      return {
        ...o,
        parentOrder,
        cliente_nome: clienteNome,
        cliente_telefone: clienteTelefone,
        mesa,
        pedido_numero: pedidoNumero,
        data_entrega: dataEntrega,
        hora_entrega: horaEntrega,
        observacoes,
      };
    });
  }, [orders, ordersMap, clientsMap]);

  // Mutação para Atualizar Estado da Ordem com Agregação Reativa ao Pedido Pai
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string | number; estado: string }) => {
      const res = await productionService.updateEstado(id, estado);

      const currentOrder = orders.find((o: any) => String(o.id) === String(id));
      const pedidoId = currentOrder?.pedido_id || (res as any)?.pedido_id;

      if (pedidoId) {
        // Regra 1: Ao iniciar preparação ('Em Producao'), se o Pedido pai estiver 'Pendente', 'Agendado' ou 'Confirmado', avançar para 'Em Producao'
        if (estado === 'Em Producao') {
          const parent = ordersMap[pedidoId];
          const parentEst = parent?.estado || parent?.status;
          if (['Pendente', 'Agendado', 'Confirmado', 'PENDENTE', 'AGENDADO', 'CONFIRMADO'].includes(parentEst)) {
            try {
              await orderService.updateEstado(pedidoId, 'Em Producao');
            } catch {
              // Ignore if already updated or server handles it
            }
          }
        }

        // Regra 2: Agregação Inteligente quando a ordem fica 'Pronto'
        if (estado === 'Pronto') {
          const siblingOrders = orders.filter((o: any) => String(o.pedido_id) === String(pedidoId));
          const allSiblingsReady = siblingOrders.every((o: any) => {
            if (String(o.id) === String(id)) return true;
            const sEst = normalizeEstadoProducao(o.estado || o.status);
            return sEst === 'Pronto' || sEst === 'Entregue' || sEst === 'Cancelado';
          });

          if (allSiblingsReady) {
            try {
              await orderService.updateEstado(pedidoId, 'Pronto');
              toast.info(`Todas as bancadas concluíram o Pedido #${pedidoId}! Pedido atualizado para PRONTO.`);
            } catch {
              // Server may have already aggregated
            }
          }
        }

        // Regra 3: Se todas as ordens forem entregues, atualizar o pedido para 'Entregue'
        if (estado === 'Entregue') {
          const siblingOrders = orders.filter((o: any) => String(o.pedido_id) === String(pedidoId));
          const allSiblingsDelivered = siblingOrders.every((o: any) => {
            if (String(o.id) === String(id)) return true;
            const sEst = normalizeEstadoProducao(o.estado || o.status);
            return sEst === 'Entregue' || sEst === 'Cancelado';
          });
          if (allSiblingsDelivered) {
            try {
              await orderService.updateEstado(pedidoId, 'Entregue');
            } catch {
              // Ignore
            }
          }
        }
      }

      return res;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['commercial-orders-producao'] });
      const estadoVisivel =
        variables.estado === 'Em Producao'
          ? 'Em Preparação'
          : variables.estado === 'Entregue'
            ? 'Entregue / Concluído'
            : variables.estado;
      toast.success(`Ordem #${variables.id} atualizada para: ${estadoVisivel}`);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao atualizar estado da ordem de produção.');
    }
  });

  const handleUpdateStatus = (id: string | number, novoEstado: string) => {
    updateStatusMutation.mutate({ id, estado: novoEstado });
  };

  // Filtragem por pesquisa de texto
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return enrichedOrders;
    const term = searchTerm.toLowerCase().trim();

    return enrichedOrders.filter((o: any) => {
      const num = String(o.numero || o.codigo || o.id || '').toLowerCase();
      const ped = String(o.pedido_numero || o.pedido_id || '').toLowerCase();
      const cli = String(o.cliente_nome || o.cliente || '').toLowerCase();
      const obs = String(o.observacoes || o.observacoes_pedido || '').toLowerCase();
      const mesa = String(o.mesa || o.local || '').toLowerCase();

      // Busca nos itens da ordem
      const items = extractOrderItems(o, products);
      const itemsMatch = items.some((it: any) => it.nome.toLowerCase().includes(term));

      return (
        num.includes(term) ||
        ped.includes(term) ||
        cli.includes(term) ||
        obs.includes(term) ||
        mesa.includes(term) ||
        itemsMatch
      );
    });
  }, [enrichedOrders, searchTerm, products]);

  // Separação por estados
  const pendentes = useMemo(
    () => filteredOrders.filter((o: any) => normalizeEstadoProducao(o.estado || o.status) === 'Pendente'),
    [filteredOrders]
  );
  const emProducao = useMemo(
    () => filteredOrders.filter((o: any) => normalizeEstadoProducao(o.estado || o.status) === 'Em Producao'),
    [filteredOrders]
  );
  const prontos = useMemo(
    () => filteredOrders.filter((o: any) => normalizeEstadoProducao(o.estado || o.status) === 'Pronto'),
    [filteredOrders]
  );
  const entregues = useMemo(
    () => filteredOrders.filter((o: any) => normalizeEstadoProducao(o.estado || o.status) === 'Entregue'),
    [filteredOrders]
  );

  // Contagem de atrasados (> 15 min em espera)
  const atrasadosCount = useMemo(() => {
    return pendentes.filter((o: any) => {
      const ts = o.created_at;
      if (!ts) return false;
      const diffMs = now.getTime() - new Date(ts).getTime();
      return Math.floor(diffMs / 60000) >= 15;
    }).length;
  }, [pendentes, now]);

  // Lista de ordens para a aba ativa
  const activeTabOrders = useMemo(() => {
    switch (selectedStateTab) {
      case 'pendente':
        return pendentes.map((o: any) => ({ order: o, type: 'pendente' as const }));
      case 'producao':
        return emProducao.map((o: any) => ({ order: o, type: 'producao' as const }));
      case 'pronto':
        return prontos.map((o: any) => ({ order: o, type: 'pronto' as const }));
      case 'entregue':
        return entregues.map((o: any) => ({ order: o, type: 'entregue' as const }));
      case 'todos':
      default:
        return [
          ...pendentes.map((o: any) => ({ order: o, type: 'pendente' as const })),
          ...emProducao.map((o: any) => ({ order: o, type: 'producao' as const })),
          ...prontos.map((o: any) => ({ order: o, type: 'pronto' as const })),
          ...entregues.map((o: any) => ({ order: o, type: 'entregue' as const }))
        ];
    }
  }, [selectedStateTab, pendentes, emProducao, prontos, entregues]);

  // Paginação da listagem
  const totalCount = activeTabOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalCount);
  const paginatedOrders = activeTabOrders.slice(startIndex, endIndex);

  // Quick Date presets
  const setToday = () => {
    setSelectedDate(new Date().toISOString().slice(0, 10));
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const sectorIcons = {
    Cozinha: <Utensils size={14} className="text-amber-600 dark:text-amber-400" />,
    Pastelaria: <Cake size={14} className="text-pink-600 dark:text-pink-400" />,
    Bar: <Wine size={14} className="text-purple-600 dark:text-purple-400" />,
    Todos: <Filter size={14} className="text-gray-500 dark:text-gray-400" />
  };

  return (
    <div className="space-y-5 pb-16 min-h-[calc(100vh-100px)] flex flex-col">
      {/* 1. CABEÇALHO PRINCIPAL DA PÁGINA (Com Cores Consistentes no Modo Dark) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-surface-dark p-4 sm:p-5 rounded-2xl border border-gray-200 dark:border-border-dark shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 dark:bg-primary/20 text-primary rounded-xl shrink-0">
              <ChefHat size={26} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                KDS · Monitor de Produção
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Visão acessível em tempo real por setor e posto de trabalho
              </p>
            </div>
          </div>
        </div>

        {/* Controles de Data e Alternância de Modo */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor Rápido de Data */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200/60 dark:border-gray-800">
            <button
              onClick={setToday}
              className={cn(
                'px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                selectedDate === new Date().toISOString().slice(0, 10)
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              Hoje
            </button>
            <button
              onClick={setYesterday}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Ontem
            </button>
          </div>

          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-primary/20 dark:[color-scheme:dark]"
            />
          </div>

          {/* Botão Atualizar */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Atualizar ordens agora"
            className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl transition-colors border border-gray-200/60 dark:border-gray-800 disabled:opacity-50"
          >
            <RefreshCw size={15} className={cn(isFetching && 'animate-spin text-primary')} />
          </button>

          {/* Alternância de Modo: Abas por Estado vs Kanban */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200/60 dark:border-gray-800">
            <button
              onClick={() => setViewMode('tabs')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                viewMode === 'tabs'
                  ? 'bg-white dark:bg-gray-800 text-primary dark:text-primary shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <LayoutGrid size={14} />
              <span className="hidden sm:inline">Abas por Estado</span>
              <span className="sm:hidden">Abas</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all',
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-gray-800 text-primary dark:text-primary shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Columns3 size={14} />
              <span className="hidden sm:inline">Quadro Geral (Kanban)</span>
              <span className="sm:hidden">Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. FILTROS DE SETOR E PESQUISA RÁPIDA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Filtro de Setor */}
        <div className="flex items-center bg-gray-100 dark:bg-surface-dark p-1 rounded-xl gap-1 overflow-x-auto border border-gray-200/80 dark:border-border-dark">
          {userDedicatedSector && user?.role !== 'Administrador' ? (
            <div className="flex items-center gap-1.5 px-1.5 py-0.5">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Posto:</span>
              <button
                onClick={() => setSelectedSector(userDedicatedSector)}
                className="px-3 py-1.5 rounded-lg text-xs font-black bg-white dark:bg-gray-800 text-primary dark:text-primary shadow-xs flex items-center gap-1.5 border border-primary/30"
              >
                {sectorIcons[userDedicatedSector]}
                <span>{userDedicatedSector}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Bancada Operacional Ativa" />
              </button>
            </div>
          ) : (
            (['Todos', 'Pastelaria', 'Cozinha', 'Bar'] as SectorType[]).map((sec) => (
              <button
                key={sec}
                onClick={() => setSelectedSector(sec)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer',
                  selectedSector === sec
                    ? 'bg-white dark:bg-gray-800 text-primary dark:text-primary shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                )}
              >
                {sectorIcons[sec]}
                <span>{sec === 'Todos' ? 'Todos os Setores' : sec}</span>
              </button>
            ))
          )}
        </div>

        {/* Caixa de Pesquisa Rápida */}
        <div className="relative flex-1 sm:max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar nº ordem, pedido, cliente, produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. BARRA DE ABAS POR ESTADO (COM RENDERIZAÇÃO LIMPA E ALTO CONTRASTE) */}
      <div className="bg-gray-100/90 dark:bg-surface-dark p-1.5 rounded-2xl border border-gray-200 dark:border-border-dark shadow-xs flex items-center gap-1.5  scrollbar-none">
        {/* Aba: Todos */}
        <button
          onClick={() => setSelectedStateTab('todos')}
          className={cn(
            'flex-1 min-w-[120px] sm:min-w-0 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 select-none shrink-0 sm:shrink',
            selectedStateTab === 'todos'
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs border border-gray-200/80 dark:border-gray-700'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/50'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 shrink-0" />
          <span>Todos</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 transition-colors',
              selectedStateTab === 'todos'
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                : 'bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            )}
          >
            {filteredOrders.length}
          </span>
        </button>

        {/* Aba: 1. Fila de Espera */}
        <button
          onClick={() => setSelectedStateTab('pendente')}
          className={cn(
            'flex-1 min-w-[150px] sm:min-w-0 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 relative select-none shrink-0 sm:shrink',
            selectedStateTab === 'pendente'
              ? 'bg-white dark:bg-gray-800 text-slate-900 dark:text-white shadow-xs border border-gray-200/80 dark:border-gray-700'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/50'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-slate-500 shrink-0" />
          <span>1. Fila de Espera</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 transition-colors',
              selectedStateTab === 'pendente'
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                : 'bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            )}
          >
            {pendentes.length}
          </span>
          {atrasadosCount > 0 && (
            <span
              title={`${atrasadosCount} ordens com mais de 15 minutos em espera`}
              className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute top-1.5 right-2"
            />
          )}
        </button>

        {/* Aba: 2. Em Preparação */}
        <button
          onClick={() => setSelectedStateTab('producao')}
          className={cn(
            'flex-1 min-w-[150px] sm:min-w-0 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 select-none shrink-0 sm:shrink',
            selectedStateTab === 'producao'
              ? 'bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 shadow-xs border border-amber-300/80 dark:border-amber-700/80'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/50'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
          <span>2. Em Preparação</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 transition-colors',
              selectedStateTab === 'producao'
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200'
                : 'bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            )}
          >
            {emProducao.length}
          </span>
        </button>

        {/* Aba: 3. Prontos p/ Entrega */}
        <button
          onClick={() => setSelectedStateTab('pronto')}
          className={cn(
            'flex-1 min-w-[160px] sm:min-w-0 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 select-none shrink-0 sm:shrink',
            selectedStateTab === 'pronto'
              ? 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 shadow-xs border border-emerald-300/80 dark:border-emerald-700/80'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/50'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span>3. Prontos p/ Entrega</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 transition-colors',
              selectedStateTab === 'pronto'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            )}
          >
            {prontos.length}
          </span>
        </button>

        {/* Aba: 4. Entregues */}
        <button
          onClick={() => setSelectedStateTab('entregue')}
          className={cn(
            'flex-1 min-w-[130px] sm:min-w-0 py-2 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 select-none shrink-0 sm:shrink',
            selectedStateTab === 'entregue'
              ? 'bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 shadow-xs border border-blue-300/80 dark:border-blue-700/80'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-gray-800/50'
          )}
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span>4. Entregues</span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[11px] font-black shrink-0 transition-colors',
              selectedStateTab === 'entregue'
                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200'
                : 'bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            )}
          >
            {entregues.length}
          </span>
        </button>
      </div>

      {/* 4. RESUMO DE CONTEÚDO E CONTROLES RÁPIDOS NO TOPO */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-400">
        <div>
          <span>
            {totalCount} ordens encontradas em <strong>{selectedStateTab.toUpperCase()}</strong> para{' '}
            <strong className="text-gray-900 dark:text-white">
              {selectedDate.split('-').reverse().join('/')}
            </strong>
          </span>
          {totalCount > 0 && viewMode === 'tabs' && (
            <span className="text-gray-500 dark:text-gray-400 ml-1.5">
              · Página {page} de {totalPages} ({totalCount} no total)
            </span>
          )}
        </div>

        {/* Seletor rápido de Itens por Página */}
        {viewMode === 'tabs' && totalCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400">Exibir por página:</span>
            <div className="flex items-center bg-gray-100 dark:bg-surface-dark p-0.5 rounded-lg border border-gray-200 dark:border-border-dark">
              {[12, 24, 48].map((size) => (
                <button
                  key={size}
                  onClick={() => setPageSize(size)}
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors',
                    pageSize === size
                      ? 'bg-white dark:bg-gray-800 text-primary dark:text-primary shadow-2xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. ÁREA DE EXIBIÇÃO: MODO ABAS (COM CARDS ESPAÇOSOS E ACESSÍVEIS) OU MODO KANBAN */}
      
      {isLoading ? (
        <div className="p-16 text-center text-gray-500 font-bold flex flex-col items-center justify-center gap-3">
          <RefreshCw size={28} className="animate-spin text-primary" />
          <span>A carregar ordens de produção do setor...</span>
        </div>
      ) : viewMode === 'tabs' ? (
        /* ================== MODO 1: VISÃO EM ABAS (PAGINADA E RESPONSIVA) ================== */
        <div className="flex-1 flex flex-col justify-between">
          {totalCount === 0 ? (
            <div className="py-16 px-4 bg-white dark:bg-surface-dark rounded-2xl border border-dashed border-gray-300 dark:border-border-dark text-center flex flex-col items-center justify-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full mb-3">
                <ChefHat size={36} />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Nenhuma ordem encontrada nesta aba
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                Não existem pedidos pendentes ou em confeção com os filtros selecionados para esta data.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5">
              {paginatedOrders.map(({ order, type }) => (
                <ProductionOrderCard
                  key={order.id}
                  order={order}
                  type={type}
                  now={now}
                  products={products}
                  requisitionsMap={requisitionsMap}
                  onUpdateStatus={handleUpdateStatus}
                  isUpdating={updateStatusMutation.isPending}
                  onOpenDetails={setSelectedOrder}
                />
              ))}
            </div>
          )}

          {/* BARRA DE PAGINAÇÃO COMPLETA E DESTACADA NO FUNDO DA TELA */}
          {viewMode === 'tabs' && totalCount > 0 && (
            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              {/* Informação de Contagem */}
              <div className="text-xs text-gray-600 dark:text-gray-400">
                A mostrar <strong className="text-gray-900 dark:text-white">{startIndex + 1}</strong> a{' '}
                <strong className="text-gray-900 dark:text-white">{endIndex}</strong> de{' '}
                <strong className="text-gray-900 dark:text-white">{totalCount}</strong> ordens
              </div>

              {/* Botões de Navegação por Páginas */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {/* Botão Primeira Página */}
                <button
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                  title="Primeira página"
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronsLeft size={16} />
                </button>

                {/* Botão Página Anterior */}
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  title="Página anterior"
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronLeft size={15} />
                  <span>Anterior</span>
                </button>

                {/* Números de Página */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => {
                    const prevP = arr[idx - 1];
                    const showEllipsis = prevP && p - prevP > 1;

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1 text-gray-400 text-xs font-bold">...</span>
                        )}
                        <button
                          onClick={() => setPage(p)}
                          className={cn(
                            'min-w-[36px] h-9 rounded-xl text-xs font-bold transition-all',
                            page === p
                              ? 'bg-primary text-white shadow-xs'
                              : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          )}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}

                {/* Botão Página Seguinte */}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  title="Página seguinte"
                  className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span>Seguinte</span>
                  <ChevronRight size={15} />
                </button>

                {/* Botão Última Página */}
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                  title="Última página"
                  className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ================== MODO 2: QUADRO GERAL KANBAN (4 COLUNAS EM TELA AMPLA) ================== */
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Coluna 1: Pendentes */}
          <div className="flex flex-col bg-slate-50/60 dark:bg-surface-dark/60 rounded-2xl border border-slate-200 dark:border-border-dark overflow-hidden">
            <div className="p-3.5 bg-white/80 dark:bg-surface-dark border-b border-slate-200 dark:border-border-dark flex items-center justify-between">
              <h2 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                Fila de Espera
              </h2>
              <span className="bg-slate-200 dark:bg-gray-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded-md text-[11px] font-black">
                {pendentes.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[72vh]">
              {pendentes.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 font-medium">
                  Sem ordens pendentes
                </div>
              ) : (
                pendentes.map((o: any) => (
                  <ProductionOrderCard
                    key={o.id}
                    order={o}
                    type="pendente"
                    now={now}
                    products={products}
                    requisitionsMap={requisitionsMap}
                    onUpdateStatus={handleUpdateStatus}
                    isUpdating={updateStatusMutation.isPending}
                    onOpenDetails={setSelectedOrder}
                  />
                ))
              )}
            </div>
          </div>

          {/* Coluna 2: Em Preparação */}
          <div className="flex flex-col bg-amber-50/20 dark:bg-surface-dark/60 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 overflow-hidden">
            <div className="p-3.5 bg-amber-100/50 dark:bg-surface-dark border-b border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between">
              <h2 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                Em Preparação
              </h2>
              <span className="bg-amber-500 text-white px-2 py-0.5 rounded-md text-[11px] font-black">
                {emProducao.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[72vh]">
              {emProducao.length === 0 ? (
                <div className="py-12 text-center text-xs text-amber-600/60 dark:text-amber-400/50 font-medium">
                  Nada no fogão / forno
                </div>
              ) : (
                emProducao.map((o: any) => (
                  <ProductionOrderCard
                    key={o.id}
                    order={o}
                    type="producao"
                    now={now}
                    products={products}
                    requisitionsMap={requisitionsMap}
                    onUpdateStatus={handleUpdateStatus}
                    isUpdating={updateStatusMutation.isPending}
                    onOpenDetails={setSelectedOrder}
                  />
                ))
              )}
            </div>
          </div>

          {/* Coluna 3: Prontos (Aguardam Entrega) */}
          <div className="flex flex-col bg-emerald-50/20 dark:bg-surface-dark/60 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 overflow-hidden">
            <div className="p-3.5 bg-emerald-100/50 dark:bg-surface-dark border-b border-emerald-200/80 dark:border-emerald-900/40 flex items-center justify-between">
              <h2 className="font-bold text-xs uppercase tracking-wider text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Prontos (Aguardam Entrega)
              </h2>
              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[11px] font-black">
                {prontos.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[72vh]">
              {prontos.length === 0 ? (
                <div className="py-12 text-center text-xs text-emerald-600/60 dark:text-emerald-400/50 font-medium">
                  Nenhum prato a aguardar
                </div>
              ) : (
                prontos.map((o: any) => (
                  <ProductionOrderCard
                    key={o.id}
                    order={o}
                    type="pronto"
                    now={now}
                    products={products}
                    requisitionsMap={requisitionsMap}
                    onUpdateStatus={handleUpdateStatus}
                    isUpdating={updateStatusMutation.isPending}
                    onOpenDetails={setSelectedOrder}
                  />
                ))
              )}
            </div>
          </div>

          {/* Coluna 4: Entregues / Concluídos */}
          <div className="flex flex-col bg-slate-50/40 dark:bg-surface-dark/60 rounded-2xl border border-slate-200/70 dark:border-border-dark overflow-hidden">
            <div className="p-3.5 bg-white/80 dark:bg-surface-dark border-b border-slate-200/70 dark:border-border-dark flex items-center justify-between">
              <h2 className="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Entregues
              </h2>
              <span className="bg-blue-600 text-white px-2 py-0.5 rounded-md text-[11px] font-black">
                {entregues.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[72vh]">
              {entregues.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 font-medium">
                  Sem ordens entregues hoje
                </div>
              ) : (
                entregues.map((o: any) => (
                  <ProductionOrderCard
                    key={o.id}
                    order={o}
                    type="entregue"
                    now={now}
                    products={products}
                    requisitionsMap={requisitionsMap}
                    onUpdateStatus={handleUpdateStatus}
                    isUpdating={updateStatusMutation.isPending}
                    onOpenDetails={setSelectedOrder}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL DE DETALHES COMPLETA */}
      <ProductionOrderModal
        order={selectedOrder}
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        products={products}
        requisitionsMap={requisitionsMap}
        onUpdateStatus={handleUpdateStatus}
        isUpdating={updateStatusMutation.isPending}
      />
    </div>
  );
}

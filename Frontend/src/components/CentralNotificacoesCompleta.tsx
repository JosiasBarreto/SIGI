import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell,
  CheckCircle2,
  Eye,
  Pin,
  Plus,
  Search,
  Clock,
  RefreshCw,
  X,
  Radio,
  Send,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { notificationAuditService, AuditoriaLeitura } from '../services/notifications';

export interface NotificacaoItem {
  id: number | string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  canal: 'PEDIDO' | 'PRODUCAO' | 'STOCK' | 'FINANCEIRO' | 'SISTEMA' | 'REQUISICAO' | 'EVENTOS';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  persistente: boolean;
  lida: boolean;
  lido_em?: string;
  created_at?: string;
  timestamp?: string;
}

export interface CentralNotificacoesCompletaProps {
  apiUrl?: string;
  token?: string;
}

export const CentralNotificacoesCompleta: React.FC<CentralNotificacoesCompletaProps> = ({
  apiUrl = '/api/v1',
  token = ''
}) => {
  const [notificacoes, setNotificacoes] = useState<NotificacaoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtroCanal, setFiltroCanal] = useState<string>('');
  const [filtroLida, setFiltroLida] = useState<string>('todas');
  const [busca, setBusca] = useState<string>('');

  // Paginação
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  // Relatório / Estatísticas
  const [estatisticas, setEstatisticas] = useState<any>(null);

  // Modal de Auditoria (Quem viu / Quem não viu)
  const [selectedNotif, setSelectedNotif] = useState<NotificacaoItem | null>(null);
  const [auditoria, setAuditoria] = useState<AuditoriaLeitura | null>(null);
  const [loadingAuditoria, setLoadingAuditoria] = useState(false);

  // Modal de Criação de Notificação
  const [showCriarModal, setShowCriarModal] = useState(false);
  const [formNotif, setFormNotif] = useState({
    titulo: '',
    mensagem: '',
    tipo: 'info' as 'info' | 'success' | 'warning' | 'error',
    canal: 'SISTEMA' as 'PEDIDO' | 'PRODUCAO' | 'STOCK' | 'FINANCEIRO' | 'SISTEMA' | 'REQUISICAO' | 'EVENTOS',
    prioridade: 'media' as 'baixa' | 'media' | 'alta' | 'urgente',
    target_type: 'GLOBAL' as 'GLOBAL' | 'SETOR' | 'ROLE',
    target_sector: '',
    persistente: false
  });

  const getHeaders = () => {
    const activeToken = token || localStorage.getItem('access_token') || localStorage.getItem('token') || '';
    return {
      'Content-Type': 'application/json',
      ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {})
    };
  };

  // 1. Carregar Estatísticas / Relatório
  const carregarEstatisticas = async () => {
    try {
      const data = await notificationAuditService.getEstatisticas(notificacoes as any);
      setEstatisticas(data);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Carregar Lista de Histórico
  const carregarNotificacoes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtroCanal) params.append('canal', filtroCanal);
      if (filtroLida === 'lida') params.append('lida', 'true');
      if (filtroLida === 'nao_lida') params.append('lida', 'false');
      if (busca) params.append('busca', busca);
      params.append('per_page', '100');

      const activeToken = token || localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const finalUrl = apiUrl.startsWith('http') ? `${apiUrl}/notificacoes?${params.toString()}` : `/api/v1/notificacoes?${params.toString()}`;

      let fetchedItems: NotificacaoItem[] = [];

      try {
        const res = await fetch(finalUrl, { headers: getHeaders() });
        if (res.ok) {
          const data = await res.json();
          const list = data.data?.items || data.data || data.items || [];
          if (Array.isArray(list) && list.length > 0) {
            fetchedItems = list.map((item: any) => ({
              id: item.id,
              titulo: item.titulo || item.title || 'Notificação',
              mensagem: item.mensagem || item.message || '',
              tipo: item.tipo || item.type || 'info',
              canal: (item.canal || 'SISTEMA').toUpperCase(),
              prioridade: (item.prioridade || item.priority || 'media').toLowerCase(),
              persistente: Boolean(item.persistente || item.persistent),
              lida: Boolean(item.lida || item.read),
              created_at: item.created_at || item.timestamp || new Date().toISOString()
            }));
          }
        }
      } catch {
        // Fallback
      }

      if (fetchedItems.length === 0) {
        // Tentar via notificationAuditService
        const auditItems = await notificationAuditService.getHistorico({
          canal: filtroCanal,
          lida: filtroLida === 'lida' ? true : filtroLida === 'nao_lida' ? false : undefined,
          busca
        });
        if (auditItems && auditItems.length > 0) {
          fetchedItems = auditItems.map((n) => ({
            id: n.id,
            titulo: n.title,
            mensagem: n.message,
            tipo: (n.type as any) || 'info',
            canal: (n.canal || 'SISTEMA').toUpperCase() as any,
            prioridade: (n.priority || 'media').toLowerCase() as any,
            persistente: Boolean(n.persistent),
            lida: Boolean(n.read),
            created_at: n.timestamp || new Date().toISOString()
          }));
        }
      }

      if (fetchedItems.length === 0) {
        const stored = localStorage.getItem('sigi_notifications_history_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          let items = parsed.map((n: any) => ({
            id: n.id,
            titulo: n.title || n.titulo,
            mensagem: n.message || n.mensagem,
            tipo: n.type || 'info',
            canal: (n.canal || 'SISTEMA').toUpperCase(),
            prioridade: (n.priority || 'media').toLowerCase(),
            persistente: Boolean(n.persistent || n.persistente),
            lida: Boolean(n.read || n.lida),
            created_at: n.timestamp || n.created_at || new Date().toISOString()
          }));

          if (filtroCanal) items = items.filter((i: any) => i.canal === filtroCanal);
          if (filtroLida === 'lida') items = items.filter((i: any) => i.lida);
          if (filtroLida === 'nao_lida') items = items.filter((i: any) => !i.lida);
          if (busca) {
            const b = busca.toLowerCase();
            items = items.filter((i: any) => i.titulo.toLowerCase().includes(b) || i.mensagem.toLowerCase().includes(b));
          }
          fetchedItems = items;
        }
      }

      setNotificacoes(fetchedItems);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Recarregar histórico e estatísticas na montagem e sempre que filtro, token ou apiUrl mudarem
  useEffect(() => {
    carregarNotificacoes();
    carregarEstatisticas();
  }, [filtroCanal, filtroLida, busca, token, apiUrl]);

  // Paginação computada
  const totalPages = Math.max(1, Math.ceil(notificacoes.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const paginatedNotificacoes = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return notificacoes.slice(start, start + perPage);
  }, [notificacoes, currentPage, perPage]);

  // 3. Abrir Auditoria de Quem Leu
  const abrirAuditoria = async (notif: NotificacaoItem) => {
    setSelectedNotif(notif);
    setLoadingAuditoria(true);
    try {
      const data = await notificationAuditService.getAuditoriaLeituras(notif.id, notif as any);
      setAuditoria(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAuditoria(false);
    }
  };

  // 4. Marcar como Lida
  const marcarLida = async (id: number | string) => {
    await notificationAuditService.marcarComoLida(id);
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    carregarEstatisticas();
  };

  // 5. Marcar Todas como Lidas
  const marcarTodasLidas = async () => {
    await notificationAuditService.marcarTodasComoLidas();
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    carregarEstatisticas();
  };

  // 6. Criar Notificação
  const handleCriar = async (e: React.FormEvent) => {
    e.preventDefault();
    await notificationAuditService.criarNotificacao(formNotif);
    setShowCriarModal(false);
    setFormNotif({
      titulo: '',
      mensagem: '',
      tipo: 'info',
      canal: 'SISTEMA',
      prioridade: 'media',
      target_type: 'GLOBAL',
      target_sector: '',
      persistente: false
    });
    carregarNotificacoes();
    carregarEstatisticas();
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen text-slate-100 font-sans space-y-6">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 text-white">
            <Radio className="w-6 h-6 text-indigo-400 animate-pulse" />
            Central de Gestão de Notificações
          </h1>
          <p className="text-sm text-slate-400">
            Histórico de eventos, filtros avançados e auditoria de leitura ("Quem Viu vs Quem Não Viu") em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={marcarTodasLidas}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-bold rounded-xl flex items-center gap-2 transition cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Marcar Todas como Lidas
          </button>
          <button
            onClick={() => setShowCriarModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Notificação
          </button>
        </div>
      </div>

      {/* RELATÓRIO / CARDS DE ESTATÍSTICA */}
      {estatisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
              Total no Histórico
              <Bell className="w-4 h-4 text-indigo-400" />
            </span>
            <div className="text-2xl font-black text-white mt-1">{estatisticas.notificacoes.total_ativas}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Eventos registados</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center justify-between">
              Pendentes / Não Lidas
              <Clock className="w-4 h-4 text-amber-400" />
            </span>
            <div className="text-2xl font-black text-amber-400 mt-1">{estatisticas.notificacoes.nao_lidas}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Aguardando confirmação</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider flex items-center justify-between">
              Avisos Fixados
              <Pin className="w-4 h-4 text-indigo-400" />
            </span>
            <div className="text-2xl font-black text-indigo-400 mt-1">{estatisticas.notificacoes.persistentes_ativas}</div>
            <span className="text-[11px] text-slate-500 mt-1 block">Prioridade contínua</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-between">
              Taxa de Leitura SMS
              <MessageSquare className="w-4 h-4 text-emerald-400" />
            </span>
            <div className="text-2xl font-black text-emerald-400 mt-1">{estatisticas.comunicacoes_sms.taxa_leitura_percent}%</div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              {estatisticas.comunicacoes_sms.confirmadas_lidas} entregues
            </span>
          </div>
        </div>
      )}

      {/* BARRA DE FILTROS & BUSCA */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por texto, #PED-..., cliente..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregarNotificacoes()}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filtro Canal */}
        <select
          value={filtroCanal}
          onChange={(e) => setFiltroCanal(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-sm rounded-lg px-3 py-2 text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="">Todos os Canais</option>
          <option value="PEDIDO">Pedidos (Vendas)</option>
          <option value="PRODUCAO">Produção (Cozinha/Past.)</option>
          <option value="STOCK">Stock & Requisições</option>
          <option value="FINANCEIRO">Financeiro & Caixa</option>
          <option value="SISTEMA">Sistema / Comunicados</option>
          <option value="REQUISICAO">Requisições</option>
          <option value="EVENTOS">Eventos</option>
        </select>

        {/* Filtro Leitura */}
        <select
          value={filtroLida}
          onChange={(e) => setFiltroLida(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-sm rounded-lg px-3 py-2 text-slate-300 focus:outline-none cursor-pointer"
        >
          <option value="todas">Todas as Notificações</option>
          <option value="nao_lida">Apenas Não Lidas</option>
          <option value="lida">Apenas Lidas</option>
        </select>

        <button
          onClick={carregarNotificacoes}
          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 cursor-pointer"
          title="Atualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* LISTA DO HISTÓRICO */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-500">A carregar histórico de notificações...</div>
        ) : notificacoes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            Nenhuma notificação encontrada com os filtros selecionados.
          </div>
        ) : (
          paginatedNotificacoes.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                !n.lida
                  ? 'bg-slate-900 border-indigo-500/40 shadow-md shadow-indigo-500/5'
                  : 'bg-slate-900/40 border-slate-800 opacity-80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${!n.lida ? 'bg-indigo-400 animate-ping' : 'bg-slate-700'}`} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm">{n.titulo}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {n.canal}
                    </span>
                    {n.persistente && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center gap-1">
                        <Pin className="w-3 h-3" /> Fixado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1 whitespace-pre-line">{n.mensagem}</p>
                  <span className="text-[10px] text-slate-500 mt-2 block">
                    {n.created_at ? new Date(n.created_at).toLocaleString('pt-PT') : ''}
                  </span>
                </div>
              </div>

              {/* Ações da Linha */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => abrirAuditoria(n)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  Quem Viu?
                </button>

                {!n.lida && (
                  <button
                    onClick={() => marcarLida(n.id)}
                    className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Lida
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* CONTROLO DE PAGINAÇÃO */}
      {notificacoes.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span>Apresentando {paginatedNotificacoes.length} de {notificacoes.length} notificações</span>
            <span>•</span>
            <span>Por página:</span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value));
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-semibold text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 font-bold text-slate-300">
              Página {currentPage} de {totalPages}
            </span>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 disabled:opacity-40 hover:bg-slate-800 transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE AUDITORIA (QUEM VIU / QUEM NÃO VIU) */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Auditoria de Leitura</h3>
                <p className="text-xs text-slate-400">{selectedNotif.titulo}</p>
              </div>
              <button onClick={() => setSelectedNotif(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAuditoria ? (
              <div className="p-8 text-center text-slate-500">A carregar lista de leituras...</div>
            ) : auditoria ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quem Já Leu */}
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/20">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      Quem Já Leu
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-950 rounded-full text-[10px] font-black">
                      {auditoria.lidos.length}
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {auditoria.lidos.length === 0 ? (
                      <p className="text-xs text-slate-600 italic py-3 text-center">Ninguém confirmou leitura ainda.</p>
                    ) : (
                      auditoria.lidos.map((u) => (
                        <div key={u.user_id} className="text-xs p-2 bg-slate-900/60 rounded border border-slate-800">
                          <div className="font-semibold text-slate-200">{u.nome}</div>
                          <div className="text-[10px] text-emerald-400/80">
                            {u.role} • {u.lido_em ? new Date(u.lido_em).toLocaleString('pt-PT') : 'Lido'}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quem Não Leu */}
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/20">
                  <h4 className="text-xs font-bold text-amber-400 uppercase flex items-center justify-between mb-3">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      Quem Não Viu
                    </span>
                    <span className="px-2 py-0.5 bg-amber-950 rounded-full text-[10px] font-black">
                      {auditoria.nao_lidos.length}
                    </span>
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {auditoria.nao_lidos.length === 0 ? (
                      <p className="text-xs text-emerald-400 italic py-3 text-center">Todos os utilizadores já viram!</p>
                    ) : (
                      auditoria.nao_lidos.map((u) => (
                        <div key={u.user_id} className="text-xs p-2 bg-slate-900/60 rounded border border-slate-800">
                          <div className="font-semibold text-slate-200">{u.nome}</div>
                          <div className="text-[10px] text-amber-400/80">{u.role} (Pendente)</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL DE CRIAÇÃO MANUAL */}
      {showCriarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCriar}
            className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Nova Notificação / Comunicado</h3>
              <button
                type="button"
                onClick={() => setShowCriarModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Título</label>
              <input
                required
                type="text"
                value={formNotif.titulo}
                onChange={(e) => setFormNotif({ ...formNotif, titulo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="Ex: Reunião Geral de Cozinha às 17h"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Mensagem</label>
              <textarea
                required
                rows={3}
                value={formNotif.mensagem}
                onChange={(e) => setFormNotif({ ...formNotif, mensagem: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
                placeholder="Detalhes do comunicado..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Canal</label>
                <select
                  value={formNotif.canal}
                  onChange={(e) => setFormNotif({ ...formNotif, canal: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none cursor-pointer"
                >
                  <option value="SISTEMA">Sistema</option>
                  <option value="PEDIDO">Pedidos</option>
                  <option value="PRODUCAO">Produção</option>
                  <option value="STOCK">Stock</option>
                  <option value="FINANCEIRO">Financeiro</option>
                  <option value="REQUISICAO">Requisições</option>
                  <option value="EVENTOS">Eventos</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Prioridade</label>
                <select
                  value={formNotif.prioridade}
                  onChange={(e) => setFormNotif({ ...formNotif, prioridade: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none cursor-pointer"
                >
                  <option value="baixa">Baixa</option>
                  <option value="media">Média</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2 select-none">
              <input
                type="checkbox"
                checked={formNotif.persistente}
                onChange={(e) => setFormNotif({ ...formNotif, persistente: e.target.checked })}
                className="rounded border-slate-800 bg-slate-950 text-indigo-600"
              />
              Fixar no topo como aviso prioritário (Persistente)
            </label>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCriarModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-600/20 transition cursor-pointer"
              >
                Publicar Notificação
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

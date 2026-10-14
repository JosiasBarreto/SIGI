import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Calendar,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  ChefHat,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  FileSpreadsheet,
  AlertOctagon,
  Wallet,
  CreditCard,
  Building,
  Printer
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { relatoriosService, RelatorioGeralResponse } from '../../services/relatoriosService';
import { formatCurrency, cn } from '../../lib/utils';
import { toast } from 'react-toastify';

export interface RelatorioGeralDashboardProps {
  getHeaders?: () => Record<string, string>;
  apiUrl?: string;
}

const CATEGORY_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4'];

export const RelatorioGeralDashboard: React.FC<RelatorioGeralDashboardProps> = ({
  getHeaders,
  apiUrl = '/api/v1'
}) => {
  // Intervalo de datas padrão: últimos 30 dias
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [dados, setDados] = useState<RelatorioGeralResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  // Carregar Relatório Geral
  const carregarRelatorio = async () => {
    setIsLoading(true);
    try {
      const headers = getHeaders ? getHeaders() : undefined;
      const res = await relatoriosService.getRelatorioGeral(
        { data_inicio: dataInicio, data_fim: dataFim },
        headers
      );
      setDados(res);
    } catch (err) {
      console.error('Erro ao carregar relatório geral:', err);
      toast.error('Não foi possível carregar os dados em tempo real.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarRelatorio();
  }, [dataInicio, dataFim]);

  // Função de download de relatórios conforme orientação do guia
  const handleBaixarRelatorio = async (tipo: string, formato: 'pdf' | 'excel' | 'csv') => {
    const exportKey = `${tipo}_${formato}`;
    setIsExporting(exportKey);
    try {
      const headers = getHeaders ? getHeaders() : undefined;
      toast.info(`A preparar download do relatório em formato ${formato.toUpperCase()}...`);
      await relatoriosService.baixarRelatorio(tipo, formato, headers, dados);
      toast.success(`Relatório exportado com sucesso (${formato.toUpperCase()})!`);
    } catch (err) {
      console.error('Erro ao descarregar relatório:', err);
      toast.error(`Falha ao exportar relatório em ${formato.toUpperCase()}.`);
    } finally {
      setIsExporting(null);
    }
  };

  // Presets de Data
  const aplicarPreset = (tipo: 'hoje' | '7dias' | 'mes' | '30dias') => {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];

    if (tipo === 'hoje') {
      setDataInicio(hojeStr);
      setDataFim(hojeStr);
    } else if (tipo === '7dias') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setDataInicio(d.toISOString().split('T')[0]);
      setDataFim(hojeStr);
    } else if (tipo === 'mes') {
      const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      setDataInicio(primeiroDia.toISOString().split('T')[0]);
      setDataFim(hojeStr);
    } else if (tipo === '30dias') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setDataInicio(d.toISOString().split('T')[0]);
      setDataFim(hojeStr);
    }
  };

  // Normalização de dados para gráficos
  const chartDataFaturacao = useMemo(() => {
    if (!dados?.financeiro_faturacao?.valores_diarios_ultimos_30_dias) return [];
    return dados.financeiro_faturacao.valores_diarios_ultimos_30_dias.map(d => ({
      ...d,
      dataFormatada: d.data.slice(5) // MM-DD
    }));
  }, [dados]);

  // Normalização de Categorias de Produtos
  const chartCategorias = useMemo(() => {
    if (!dados?.produtos?.por_categoria) return [];
    if (Array.isArray(dados.produtos.por_categoria)) {
      return dados.produtos.por_categoria;
    }
    // Caso venha como Record<string, number>
    return Object.entries(dados.produtos.por_categoria).map(([categoria, total]) => ({
      categoria,
      total: Number(total)
    }));
  }, [dados]);

  // Normalização de Utilizadores por Função
  const utilizadoresPorFuncao = useMemo(() => {
    if (!dados?.utilizadores?.por_funcao) return [];
    if (Array.isArray(dados.utilizadores.por_funcao)) {
      return dados.utilizadores.por_funcao;
    }
    return Object.entries(dados.utilizadores.por_funcao).map(([role, total]) => ({
      role,
      total: Number(total)
    }));
  }, [dados]);

  const kpis = dados?.kpis_gerais;
  const reconciliacao = dados?.reconciliacao_caixa;
  const pedidosNaoEntregues = dados?.pedidos_estados?.nao_entregues;
  const totalNaoEntregues = typeof pedidosNaoEntregues === 'number'
    ? pedidosNaoEntregues
    : pedidosNaoEntregues?.total || 0;
  const listaNaoEntregues = typeof pedidosNaoEntregues === 'object' && Array.isArray(pedidosNaoEntregues?.itens)
    ? pedidosNaoEntregues.itens
    : [];

  return (
    <div className="space-y-6 text-gray-900 dark:text-slate-100 font-sans">
      {/* CABEÇALHO DO DASHBOARD ESTRATÉGICO */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                Dashboard & Relatório Geral de Gestão
              </h1>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Consolidação unificada de vendas, faturação, stocks, produção, recursos humanos e fecho de caixa.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              Moeda Oficial: STN
            </span>
            <span>•</span>
            <span>Endpoint de Alta Performance: <code className="text-indigo-600 dark:text-indigo-400 font-mono">/api/v1/relatorios/geral</code></span>
          </div>
        </div>

        {/* CONTROLES DE DATA & EXPORTAÇÃO */}
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-3">
          {/* Seletor de Datas */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-950 p-1.5 rounded-xl border border-gray-200 dark:border-slate-800 text-xs">
            <Calendar className="w-4 h-4 text-gray-400 ml-1.5" />
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="bg-transparent text-gray-800 dark:text-slate-200 font-bold outline-none text-xs"
            />
            <span className="text-gray-400">até</span>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="bg-transparent text-gray-800 dark:text-slate-200 font-bold outline-none text-xs"
            />
          </div>

          {/* Presets Rápidos */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-950 p-1 rounded-xl border border-gray-200 dark:border-slate-800 text-[11px] font-bold">
            <button
              onClick={() => aplicarPreset('hoje')}
              className="px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            >
              Hoje
            </button>
            <button
              onClick={() => aplicarPreset('7dias')}
              className="px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            >
              7 Dias
            </button>
            <button
              onClick={() => aplicarPreset('mes')}
              className="px-2 py-1 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            >
              Este Mês
            </button>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center gap-2">
            <button
              onClick={carregarRelatorio}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition cursor-pointer"
              title="Atualizar Dados"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin text-primary")} />
            </button>

            {/* Menu de Exportação */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleBaixarRelatorio('geral', 'pdf')}
                disabled={isExporting !== null}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </button>
              <button
                onClick={() => handleBaixarRelatorio('geral', 'excel')}
                disabled={isExporting !== null}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </button>
              <button
                onClick={() => handleBaixarRelatorio('pedidos', 'csv')}
                disabled={isExporting !== null}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                CSV Pedidos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPIS GERAIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Faturação Hoje */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-slate-400">
            <span>Faturado Hoje</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white mt-2">
            {formatCurrency(kpis?.valor_hoje || 0)}
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            Entradas em tempo real
          </span>
        </div>

        {/* Pedidos Hoje */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-slate-400">
            <span>Pedidos Hoje</span>
            <ChefHat className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white mt-2">
            {kpis?.pedidos_hoje ?? 0}
          </div>
          <span className="text-[11px] text-gray-500 dark:text-slate-400 font-medium mt-1 block">
            Ordens e reservas do dia
          </span>
        </div>

        {/* Faturação do Mês */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-slate-400">
            <span>Mês Atual (STN)</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white mt-2">
            {formatCurrency(kpis?.valor_mes_atual || 0)}
          </div>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1 block">
            Acumulado mensal
          </span>
        </div>

        {/* Variação Mensal */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-slate-400">
            <span>Variação Mensal</span>
            {(kpis?.variacao_mensal_percentagem || 0) >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div className="text-xl font-black text-gray-900 dark:text-white mt-2">
            {(kpis?.variacao_mensal_percentagem || 0) >= 0 ? '+' : ''}
            {kpis?.variacao_mensal_percentagem ?? 0}%
          </div>
          <span className={cn(
            "text-[11px] font-semibold mt-1 block",
            (kpis?.variacao_mensal_percentagem || 0) >= 0 ? "text-emerald-500" : "text-rose-500"
          )}>
            vs. Período anterior
          </span>
        </div>

        {/* Stock Crítico */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-amber-500">
            <span>Stock Baixo</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-2">
            {kpis?.produtos_stock_baixo ?? 0} artigos
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Requer reabastecimento
          </span>
        </div>

        {/* Produtos Expirados */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-rose-500">
            <span>Validade Crítica</span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-2">
            {kpis?.produtos_expirados ?? 0} lote(s)
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Expirados ou a expirar
          </span>
        </div>
      </div>

      {/* GRÁFICO DE FATURAÇÃO DIÁRIA (30 DIAS) */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Evolução da Faturação Diária (Últimos 30 Dias)
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Desempenho diário de vendas e consumo faturado em STN.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Período</span>
            <div className="text-lg font-black text-indigo-600 dark:text-indigo-400">
              {formatCurrency(
                chartDataFaturacao.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0)
              )}
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartDataFaturacao} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
              <XAxis dataKey="dataFormatada" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} 
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
                formatter={(value: any) => [`${formatCurrency(Number(value))}`, 'Faturamento']}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="valor" 
                stroke="#6366f1" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorValor)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SEÇÃO 2 COLUNAS: PRODUTOS MAIS VENDIDOS VS MENOS VENDIDOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mais Vendidos */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
              Artigos Mais Vendidos (Top Giro)
            </h3>
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
              {dados?.produtos?.mais_vendidos?.length || 0} itens
            </span>
          </div>

          <div className="space-y-3">
            {dados?.produtos?.mais_vendidos && dados.produtos.mais_vendidos.length > 0 ? (
              dados.produtos.mais_vendidos.map((prod, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{prod.nome}</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        Qtd Vendida: <b>{prod.quantidade_vendida ?? prod.quantidade ?? 0}</b> unid.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                      {formatCurrency(prod.faturamento || 0)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic py-4 text-center">Nenhum registo disponível.</p>
            )}
          </div>
        </div>

        {/* Menos Vendidos */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-rose-500" />
              Artigos Menos Vendidos (Baixo Giro)
            </h3>
            <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
              {dados?.produtos?.menos_vendidos?.length || 0} itens
            </span>
          </div>

          <div className="space-y-3">
            {dados?.produtos?.menos_vendidos && dados.produtos.menos_vendidos.length > 0 ? (
              dados.produtos.menos_vendidos.map((prod, idx) => (
                <div 
                  key={idx}
                  className="p-3 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{prod.nome}</p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        Qtd Vendida: <b>{prod.quantidade_vendida ?? prod.quantidade ?? 0}</b> unid.
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-600 dark:text-slate-300 font-mono text-sm">
                      {formatCurrency(prod.faturamento || 0)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic py-4 text-center">Nenhum registo disponível.</p>
            )}
          </div>
        </div>
      </div>

      {/* MATERIAIS & INSUMOS MAIS UTILIZADOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-500" />
              Matérias-Primas Mais Utilizadas
            </h3>
            <span className="text-xs font-bold text-gray-500">Cozinha & Pastelaria</span>
          </div>
          <div className="space-y-2">
            {dados?.materiais?.mais_utilizados && dados.materiais.mais_utilizados.length > 0 ? (
              dados.materiais.mais_utilizados.map((mat, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900 dark:text-slate-200">{mat.nome}</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    {mat.quantidade_consumida} {mat.unidade || 'kg'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic py-2">Sem consumos registados.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-500" />
              Matérias-Primas Menos Utilizadas
            </h3>
            <span className="text-xs font-bold text-gray-500">Baixo consumo</span>
          </div>
          <div className="space-y-2">
            {dados?.materiais?.menos_utilizados && dados.materiais.menos_utilizados.length > 0 ? (
              dados.materiais.menos_utilizados.map((mat, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-900 dark:text-slate-200">{mat.nome}</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                    {mat.quantidade_consumida} {mat.unidade || 'kg'}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic py-2">Sem consumos registados.</p>
            )}
          </div>
        </div>
      </div>

      {/* ESTADOS DE PEDIDOS & RECONCILIAÇÃO DE CAIXA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pedidos por Estado & Alerta Não Entregues */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-indigo-500" />
              Estado Operacional dos Pedidos
            </h3>
            {totalNaoEntregues > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-500 font-bold text-xs flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {totalNaoEntregues} Não Entregues / Atrasados
              </span>
            )}
          </div>

          {/* Grid de Estados */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {dados?.pedidos_estados?.por_estado && Object.entries(dados.pedidos_estados.por_estado).map(([estado, count], i) => (
              <div key={i} className="p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800 text-center">
                <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">{estado}</span>
                <span className="text-lg font-black text-gray-900 dark:text-white mt-1 block">{count}</span>
              </div>
            ))}
          </div>

          {/* Lista de Pedidos Não Entregues se houver */}
          {listaNaoEntregues.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Pedidos Pendentes com Prioridade
              </h4>
              <div className="space-y-1.5">
                {listaNaoEntregues.map((it, idx) => (
                  <div key={idx} className="p-2.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 dark:text-white">{it.numero || it.id}</span>
                      <span className="text-gray-500 dark:text-slate-400 ml-2">({it.cliente || 'Cliente'})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-800 dark:text-slate-200">{formatCurrency(it.valor || 0)}</span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                        {it.estado || 'Pendente'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reconciliação & Fecho de Caixa */}
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" />
              Reconciliação e Fecho de Caixa
            </h3>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              Auditado
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-600 dark:text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Total em Dinheiro Físico
              </span>
              <span className="font-mono font-black text-gray-900 dark:text-white text-sm">
                {formatCurrency(reconciliacao?.total_dinheiro || 0)}
              </span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-600 dark:text-slate-400 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                Total Multicaixa / TPA
              </span>
              <span className="font-mono font-black text-gray-900 dark:text-white text-sm">
                {formatCurrency(reconciliacao?.total_multicaixa || 0)}
              </span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-600 dark:text-slate-400 flex items-center gap-2">
                <Building className="w-4 h-4 text-purple-500" />
                Transferências Bancárias
              </span>
              <span className="font-mono font-black text-gray-900 dark:text-white text-sm">
                {formatCurrency(reconciliacao?.total_transferencia || 0)}
              </span>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-600 dark:text-slate-400">
                Fundo de Caixa Inicial
              </span>
              <span className="font-mono font-bold text-gray-700 dark:text-slate-300">
                {formatCurrency(reconciliacao?.fundo_caixa || 0)}
              </span>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between text-xs">
              <span className="font-black text-emerald-800 dark:text-emerald-300">
                Diferença de Caixa Detetada
              </span>
              <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 text-sm">
                {formatCurrency(reconciliacao?.diferenca_total || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* UTILIZADORES ATIVOS & RECURSOS HUMANOS */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800 mb-4">
          <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Recursos Humanos & Colaboradores Ativos ({dados?.utilizadores?.total_ativos || 0})
          </h3>
          <span className="text-xs text-gray-500 dark:text-slate-400">Atividade por Perfil de Acesso</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {utilizadoresPorFuncao.map((uf, i) => (
            <div key={i} className="p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-100 dark:border-slate-800 text-center">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block">{uf.role}</span>
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">{uf.total}</span>
              <span className="text-[10px] text-gray-400 mt-0.5 block">colaboradores</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RelatorioGeralDashboard;

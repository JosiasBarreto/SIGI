import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financialService, financeiroService, clientService } from '../services';
import { TrendingUp, TrendingDown, DollarSign, Wallet, Calendar, User, Search, CreditCard, CheckCircle2, AlertCircle, Clock, Check, X, HandCoins, Receipt, Banknote, ShieldAlert, Activity } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { DataTable } from '../components/Common/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { useAuth } from '../components/AuthContext';

// Sub-Tab 1: Reconciliação & Caixa Ativo
function TabReconciliacao() {
  const { user } = useAuth();
  const canEdit = ["Administrador", "Financeiro"].includes(user?.role || "");
  const queryClient = useQueryClient();
  const { data: caixas } = useQuery({ queryKey: ["caixas"], queryFn: () => financialService.getAll() });
  const caixasData = caixas?.items || (Array.isArray(caixas) ? caixas : []);
  const openCaixa = caixasData.find((c: any) => c.estado === 'Aberto');

  const [abrirVal, setAbrirVal] = useState("");
  
  const [modalType, setModalType] = useState<"sangria" | "reforco" | "fechar" | null>(null);

  const [fecharDinheiro, setFecharDinheiro] = useState("");
  const [fecharTransferencia, setFecharTransferencia] = useState("");
  const [fecharPos, setFecharPos] = useState("");
  const [fecharJustificativa, setFecharJustificativa] = useState("");

  const [movimentoVal, setMovimentoVal] = useState("");
  const [movimentoDesc, setMovimentoDesc] = useState("");

  const abrirMutation = useMutation({
    mutationFn: (val: number) => financialService.abrir(val),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("Caixa aberto com sucesso!");
    },
    onError: () => toast.error("Erro ao abrir caixa")
  });

  const fecharMutation = useMutation({
    mutationFn: (data: any) => financialService.fechar(openCaixa?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      setModalType(null);
      toast.success("Caixa fechado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao fechar caixa");
    }
  });

  const movimentoMutation = useMutation({
    mutationFn: (data: any) => financialService.movimento(openCaixa?.id, data.tipo, data.valor, data.descricao),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      setModalType(null);
      setMovimentoVal("");
      setMovimentoDesc("");
      toast.success("Operação realizada com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao realizar operação");
    }
  });

  if (!openCaixa) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <ShieldAlert size={64} className="text-gray-300 mb-6" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Nenhum Caixa Aberto</h2>
        <p className="text-gray-500 mb-8 max-w-md text-center">Para iniciar as operações do dia e registar movimentos, necessita de abrir o caixa informando o fundo de maneio inicial.</p>
        
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-sm">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Fundo de Maneio em Dinheiro (STD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={abrirVal}
            onChange={(e) => setAbrirVal(e.target.value)}
            placeholder="Ex: 150000"
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl mb-4 font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {canEdit ? (
            <button
              disabled={abrirMutation.isPending || !abrirVal}
              onClick={() => abrirMutation.mutate(parseFloat(abrirVal || "0"))}
              className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/30 active:scale-95 disabled:opacity-50"
            >
              {abrirMutation.isPending ? "A abrir..." : "Abrir Caixa"}
            </button>
          ) : (
            <div className="w-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold py-3 rounded-xl text-center">
              Sem permissão para abrir
            </div>
          )}
        </div>
      </div>
    );
  }

  // Calculating total expected (can be more complex based on real API response)
  const saldoDinheiroEsperado = parseFloat(openCaixa?.valor_esperado_dinheiro || "0") || parseFloat(openCaixa?.valor_inicial || "0");
  const saldoPosEsperado = parseFloat(openCaixa?.valor_esperado_pos || "0");
  const saldoTransferenciaEsperado = parseFloat(openCaixa?.valor_esperado_transferencia || "0");

  const totalEsperado = saldoDinheiroEsperado + saldoPosEsperado + saldoTransferenciaEsperado;
  const totalDeclarado = parseFloat(fecharDinheiro || "0") + parseFloat(fecharTransferencia || "0") + parseFloat(fecharPos || "0");
  const isDivergente = Math.abs(totalEsperado - totalDeclarado) > 0.01;

  const handleFechar = () => {
    if (isDivergente && !fecharJustificativa.trim()) {
      toast.error("Existe uma divergência entre o valor esperado e declarado. Por favor preencha a justificação.");
      return;
    }
    
    fecharMutation.mutate({
      valor_declarado_dinheiro: parseFloat(fecharDinheiro || "0"),
      valor_declarado_transferencia: parseFloat(fecharTransferencia || "0"),
      valor_declarado_pos: parseFloat(fecharPos || "0"),
      explicacao_divergencia: fecharJustificativa
    });
  };

  const handleMovimento = () => {
    if (!movimentoVal) return;
    movimentoMutation.mutate({
      tipo: modalType === "reforco" ? "Reforço" : "Sangria",
      valor: parseFloat(movimentoVal),
      descricao: movimentoDesc
    });
  };

  return (
    <div className="animate-fade-in relative">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success">
                <Banknote size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resumo do Caixa</h2>
                <p className="text-sm text-gray-500">Caixa Atual: #{openCaixa.numero || openCaixa.id}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="font-medium text-gray-600 dark:text-gray-400">Fundo de Maneio</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(openCaixa.valor_inicial)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="font-medium text-gray-600 dark:text-gray-400">Dinheiro (Esperado)</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(saldoDinheiroEsperado)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="font-medium text-gray-600 dark:text-gray-400">TPA/POS (Esperado)</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(saldoPosEsperado)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <span className="font-medium text-gray-600 dark:text-gray-400">Transferências (Esperado)</span>
                <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(saldoTransferenciaEsperado)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border border-primary/20">
                <span className="font-bold text-primary dark:text-primary">Total Esperado</span>
                <span className="text-xl font-bold text-primary dark:text-primary">{formatCurrency(totalEsperado)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Ações de Caixa</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <button
                onClick={() => setModalType("reforco")}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-2xl border border-blue-200 dark:border-blue-800 transition-colors"
              >
                <TrendingUp size={32} />
                <span className="font-semibold">Reforço (Entrada)</span>
              </button>
              
              <button
                onClick={() => setModalType("sangria")}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-2xl border border-orange-200 dark:border-orange-800 transition-colors"
              >
                <TrendingDown size={32} />
                <span className="font-semibold">Sangria (Saída)</span>
              </button>
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => setModalType("fechar")}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95"
              >
                <AlertCircle size={20} />
                Encerrar Caixa
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
            {/* Modal Header */}
            <div className={cn(
              "p-6 text-white flex justify-between items-start",
              modalType === "fechar" ? "bg-gray-900 dark:bg-gray-800" :
              modalType === "reforco" ? "bg-blue-600" : "bg-orange-500"
            )}>
              <div>
                <h3 className="text-2xl font-bold mb-1">
                  {modalType === "fechar" ? "Encerrar Caixa" :
                   modalType === "reforco" ? "Registar Reforço" : "Registar Sangria"}
                </h3>
                <p className="text-white/80 text-sm">
                  {modalType === "fechar" ? "Declare os valores físicos em caixa." :
                   `Insira o valor e justificação para a ${modalType === "reforco" ? "entrada" : "saída"}.`}
                </p>
              </div>
              <button onClick={() => setModalType(null)} className="text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Movimentos */}
            {modalType !== "fechar" && (
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Valor (STD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Db</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={movimentoVal}
                      onChange={(e) => setMovimentoVal(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Justificação (Obrigatório)</label>
                  <textarea
                    value={movimentoDesc}
                    onChange={(e) => setMovimentoDesc(e.target.value)}
                    placeholder={`Motivo do ${modalType}...`}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px]"
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button onClick={() => setModalType(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors">
                    Cancelar
                  </button>
                  <button 
                    disabled={!movimentoVal || !movimentoDesc || movimentoMutation.isPending}
                    onClick={handleMovimento}
                    className={cn(
                      "flex-1 py-3 text-white font-semibold rounded-xl transition-colors shadow-lg active:scale-95 disabled:opacity-50",
                      modalType === "reforco" ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30" : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/30"
                    )}
                  >
                    {movimentoMutation.isPending ? "A processar..." : "Confirmar"}
                  </button>
                </div>
              </div>
            )}

            {/* Modal Body: Fechar Caixa */}
            {modalType === "fechar" && (
              <div className="p-6">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl mb-6 flex justify-between items-center border border-gray-200 dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">Total Esperado:</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalEsperado)}</span>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Dinheiro em Gaveta</label>
                    <input type="number" step="0.01" value={fecharDinheiro} onChange={(e) => setFecharDinheiro(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Total TPA / POS</label>
                    <input type="number" step="0.01" value={fecharPos} onChange={(e) => setFecharPos(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Total Transferências</label>
                    <input type="number" step="0.01" value={fecharTransferencia} onChange={(e) => setFecharTransferencia(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50" />
                  </div>
                  
                  {isDivergente && (
                    <div className="bg-error/10 p-4 rounded-xl border border-error/20">
                      <div className="flex gap-2 text-error text-sm font-medium mb-3">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>Divergência detetada entre valores esperados e declarados!</span>
                      </div>
                      <label className="block text-xs font-bold text-error mb-1">Justificação Obrigatória</label>
                      <textarea value={fecharJustificativa} onChange={(e) => setFecharJustificativa(e.target.value)} placeholder="Indique o motivo da divergência..." className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-error/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-error/50 min-h-[60px] text-sm" />
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-2 flex gap-3">
                  <button onClick={() => setModalType(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors">
                    Cancelar
                  </button>
                  <button 
                    disabled={fecharMutation.isPending || (isDivergente && !fecharJustificativa.trim())}
                    onClick={handleFechar}
                    className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 font-semibold rounded-xl transition-colors shadow-lg active:scale-95 disabled:opacity-50"
                  >
                    {fecharMutation.isPending ? "A processar..." : "Confirmar Fecho"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-Tab 2: Financiamentos & Contas a Receber
function TabContasReceber() {
  const { user } = useAuth();
  const canEdit = ["Administrador", "Financeiro"].includes(user?.role || "");
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("Todas");
  
  const { data: receivables, isLoading } = useQuery({ 
    queryKey: ["contas_receber"], 
    queryFn: () => financeiroService.getContasReceber() 
  });

  const { data: clientsResponse } = useQuery({
    queryKey: ["clients"],
    queryFn: () => clientService.getAll()
  });
  const clients = clientsResponse?.items || [];

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");

  const receberMutation = useMutation({
    mutationFn: (data: any) => financeiroService.receberPagamento(selectedItem.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_receber"] });
      setPayModalOpen(false);
      toast.success("Pagamento registado com sucesso!");
    },
    onError: () => toast.error("Erro ao registar pagamento")
  });

  const handleOpenPay = (item: any) => {
    setSelectedItem(item);
    setPayAmount(String(parseFloat(item.valor_original || item.saldo || 0) - parseFloat(item.valor_pago || 0)));
    setPayModalOpen(true);
  };

  const criarCreditoMutation = useMutation({
    mutationFn: (data: any) => financeiroService.createCreditoDireto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_receber"] });
      setIsAddOpen(false);
      toast.success("Crédito emitido com sucesso!");
    },
    onError: () => toast.error("Erro ao emitir crédito")
  });

  const filtered = (receivables || []).filter((item: any) => {
    if (activeFilter === "Todas") return true;
    if (activeFilter === "Vencidas") return item.estado === "Vencida";
    if (activeFilter === "Pendentes" || activeFilter === "Parcial") return item.estado === "Pendente" || item.estado === "Parcial";
    if (activeFilter === "Pagas") return item.estado === "Paga";
    return true;
  });

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => <span className="font-bold">#{getValue<string>()}</span> },
    { accessorKey: 'cliente_nome', header: 'CLIENTE', cell: ({ getValue }) => <span className="flex items-center gap-1.5 font-medium">{getValue<string>() || 'Cliente Balcão'}</span> },
    { accessorKey: 'vencimento', header: 'VENCIMENTO', cell: ({ getValue }) => <span className="text-gray-500">{getValue<string>() ? new Date(getValue<string>()).toLocaleDateString("pt-ST") : '-'}</span> },
    { accessorKey: 'valor_original', header: 'VALOR TOTAL', cell: ({ getValue }) => <span className="font-semibold">{formatCurrency(parseFloat(getValue<any>() || 0))}</span> },
    { accessorKey: 'valor_pago', header: 'PAGO', cell: ({ getValue }) => <span className="font-semibold text-green-600">{formatCurrency(parseFloat(getValue<any>() || 0))}</span> },
    {
      id: 'saldo',
      header: 'SALDO',
      cell: ({ row }) => {
        const saldoPendente = parseFloat(row.original.valor_original || 0) - parseFloat(row.original.valor_pago || 0);
        return <span className={cn("font-bold", saldoPendente > 0 ? "text-error" : "text-gray-400")}>{formatCurrency(saldoPendente)}</span>;
      }
    },
    {
      accessorKey: 'estado',
      header: () => <div className="text-center">ESTADO</div>,
      cell: ({ getValue }) => {
        const status = getValue<string>();
        return (
          <div className="text-center">
            <span className={cn(
              "px-2 py-0.5 rounded-full font-bold text-[10px]",
              status === 'Paga' ? 'bg-green-100 text-green-800' :
              status === 'Vencida' ? 'bg-red-100 text-red-800' :
              'bg-amber-100 text-amber-800'
            )}>
              {status}
            </span>
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: () => <div className="text-right">AÇÕES</div>,
      cell: ({ row }) => {
        const item = row.original;
        const saldoPendente = parseFloat(item.valor_original || 0) - parseFloat(item.valor_pago || 0);
        return (
          <div className="flex justify-end">
            {saldoPendente > 0 ? (
              canEdit ? (
                <button
                  onClick={() => handleOpenPay(item)}
                  className="bg-primary hover:bg-primary-hover text-white font-bold px-3 py-1.5 rounded-lg text-xs tracking-tight transition-all flex items-center gap-1"
                >
                  <HandCoins size={13} /> Receber
                </button>
              ) : null
            ) : (
              <span className="text-gray-400 flex items-center gap-1 font-semibold text-xs">
                <CheckCircle2 size={14} className="text-success" /> Liquidado
              </span>
            )}
          </div>
        );
      }
    }
  ], [canEdit]);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <HandCoins className="text-primary" /> Contas a Receber
          </h2>
          {canEdit && (
            <button onClick={() => setIsAddOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold px-3 py-1.5 rounded-lg text-xs">
              + Crédito Direto
            </button>
          )}
        </div>
        <div className="flex overflow-x-auto gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-gray-50 dark:bg-gray-800/40">
          {["Todas", "Vencidas", "Pendentes", "Pagas"].map((filter: string) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors",
                activeFilter === filter 
                  ? "bg-white dark:bg-surface-dark text-primary shadow-sm" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <DataTable data={filtered} columns={columns} isLoading={isLoading} searchPlaceholder="Pesquisar contas..." />
      </div>

      {payModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white">Registar Recebimento</h3>
              <button onClick={() => setPayModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg text-sm border border-gray-100 dark:border-gray-700 space-y-1">
                <div className="flex justify-between text-gray-500"><span>Cliente:</span> <span className="font-semibold text-gray-900 dark:text-white">{selectedItem.cliente_nome || 'Balcão'}</span></div>
                <div className="flex justify-between text-gray-500"><span>Saldo:</span> <span className="font-bold text-error">{formatCurrency(parseFloat(selectedItem.valor_original || 0) - parseFloat(selectedItem.valor_pago || 0))}</span></div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Valor a Amortizar (STD)</label>
                <input type="number" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none dark:bg-gray-800 dark:border-gray-700 font-bold" />
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex gap-2 justify-end border-t border-gray-200 dark:border-gray-800">
              <button onClick={() => setPayModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-white border border-gray-200">Cancelar</button>
              <button 
                onClick={() => receberMutation.mutate({ valor: parseFloat(payAmount), metodo_pagamento: 'Dinheiro' })}
                disabled={receberMutation.isPending}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-success hover:bg-success/90"
              >
                {receberMutation.isPending ? 'A registar...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white">Novo Crédito Direto</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const selectedClientId = formData.get("cliente_id");
              const selectedClientObj = clients.find((c: any) => String(c.id) === String(selectedClientId));
              const clienteNome = selectedClientObj ? (selectedClientObj.nome || (selectedClientObj as any).name) : "Cliente de Crédito";

              criarCreditoMutation.mutate({
                cliente_id: selectedClientId ? Number(selectedClientId) : null,
                cliente_nome: clienteNome,
                valor_original: parseFloat(formData.get("valor_original") as string),
                vencimento: formData.get("vencimento")
              });
            }} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Cliente *</label>
                <select name="cliente_id" required className="w-full px-3 py-2 border rounded-lg focus:ring-primary/50 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                  <option value="">Selecione um cliente...</option>
                  {clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nome || (c as any).name || `Cliente #${c.id}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Valor (STD) *</label>
                <input name="valor_original" type="number" step="0.01" min="0" required className="w-full px-3 py-2 border rounded-lg focus:ring-primary/50 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white font-bold" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Data Vencimento *</label>
                <input name="vencimento" type="date" required className="w-full px-3 py-2 border rounded-lg focus:ring-primary/50 outline-none dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={criarCreditoMutation.isPending} className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-2 rounded-lg transition-colors">
                  {criarCreditoMutation.isPending ? 'A emitir...' : 'Emitir Crédito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-Tab 3: Contas a Pagar
function TabContasPagar() {
  const { user } = useAuth();
  const canEdit = ["Administrador", "Financeiro"].includes(user?.role || "");
  const queryClient = useQueryClient();
  const { data: payables, isLoading } = useQuery({ 
    queryKey: ["contas_pagar"], 
    queryFn: () => financeiroService.getContasPagar({ per_page: 100 }) 
  });

  const pagarMutation = useMutation({
    mutationFn: (id: string | number) => financeiroService.liquidarContaPagar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_pagar"] });
      toast.success("Conta liquidada com sucesso!");
    },
    onError: () => toast.error("Erro ao liquidar conta")
  });

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'id', header: 'ID', cell: ({ getValue }) => <span className="font-bold text-gray-500">#{getValue<string>()}</span> },
    { accessorKey: 'descricao', header: 'DESCRIÇÃO', cell: ({ getValue }) => <span className="font-semibold text-gray-900 dark:text-white">{getValue<string>()}</span> },
    { accessorKey: 'vencimento', header: 'VENCIMENTO', cell: ({ getValue }) => {
      const dateStr = getValue<string>();
      if (!dateStr) return '-';
      const isOverdue = new Date(dateStr) < new Date() && new Date(dateStr).toDateString() !== new Date().toDateString();
      return <span className={cn("font-medium", isOverdue ? "text-error" : "text-gray-500")}>{new Date(dateStr).toLocaleDateString("pt-ST")}</span>;
    }},
    { accessorKey: 'valor', header: 'VALOR', cell: ({ getValue }) => <span className="font-bold">{formatCurrency(parseFloat(getValue<any>() || 0))}</span> },
    { accessorKey: 'estado', header: 'ESTADO', cell: ({ getValue }) => {
      const status = getValue<string>();
      return (
        <span className={cn(
          "px-2 py-0.5 rounded-full font-bold text-[10px]",
          status === 'PAGA' || status === 'Pago' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
        )}>
          {status}
        </span>
      );
    }},
    {
      id: 'actions',
      header: () => <div className="text-right">AÇÕES</div>,
      cell: ({ row }) => {
        const item = row.original;
        const isPaid = item.estado === 'PAGA' || item.estado === 'Pago';
        return (
          <div className="flex justify-end">
            {!isPaid ? (
              canEdit ? (
                <button
                  onClick={() => {
                    if (window.confirm(`Tem certeza que deseja liquidar esta conta no valor de ${formatCurrency(parseFloat(item.valor || 0))}?`)) {
                      pagarMutation.mutate(item.id);
                    }
                  }}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs tracking-tight transition-all"
                >
                  Liquidar
                </button>
              ) : null
            ) : (
              <span className="text-gray-400 flex items-center gap-1 font-semibold text-xs">
                <CheckCircle2 size={14} className="text-success" /> Liquidado
              </span>
            )}
          </div>
        );
      }
    }
  ], [canEdit]);

  // Modal para nova conta
  const [isAddOpen, setIsAddOpen] = useState(false);
  const addMutation = useMutation({
    mutationFn: (data: any) => financeiroService.createContaPagar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contas_pagar"] });
      setIsAddOpen(false);
      toast.success("Conta a pagar adicionada!");
    }
  });

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="text-primary" /> Contas a Pagar
          </h2>
        </div>
        {canEdit && (
          <button onClick={() => setIsAddOpen(true)} className="bg-primary hover:bg-primary-hover text-white font-bold px-4 py-2 rounded-lg text-sm">
            + Nova Despesa
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <DataTable data={payables || []} columns={columns} isLoading={isLoading} searchPlaceholder="Pesquisar contas a pagar..." />
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-surface-dark rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white">Nova Conta a Pagar</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addMutation.mutate({
                descricao: formData.get("descricao"),
                valor: parseFloat(formData.get("valor") as string),
                vencimento: formData.get("vencimento")
              });
            }} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Descrição *</label>
                <input name="descricao" required className="w-full px-3 py-2 border rounded-lg focus:ring-primary/50 outline-none dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Valor (STD) *</label>
                <input name="valor" type="number" step="0.01" min="0" required className="w-full px-3 py-2 border rounded-lg focus:ring-primary/50 outline-none dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Data Vencimento *</label>
                <input name="vencimento" type="date" required className="w-full px-3 py-2 border rounded-lg focus:ring-primary/50 outline-none dark:bg-gray-800 dark:border-gray-700" />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={addMutation.isPending} className="w-full bg-primary text-white font-bold py-2 rounded-lg">
                  {addMutation.isPending ? 'A salvar...' : 'Salvar Despesa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-Tab 4: Fluxo de Caixa & Fechos
function TabFluxoCaixa() {
  const { user } = useAuth();
  const canEdit = ["Administrador", "Financeiro"].includes(user?.role || "");
  const queryClient = useQueryClient();

  // Date period for Fluxo de Caixa (default to current month)
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [dateEnd, setDateEnd] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const { data: fluxo, isLoading: loadingFluxo } = useQuery({ 
    queryKey: ["fluxo_caixa", dateStart, dateEnd], 
    queryFn: () => financeiroService.getFluxoCaixa({ inicio: dateStart, fim: dateEnd }) 
  });
  
  const { data: fechos, isLoading: loadingFechos } = useQuery({ 
    queryKey: ["fechos_diarios"], 
    queryFn: () => financeiroService.getFechosDiarios() 
  });

  const consolidarMutation = useMutation({
    mutationFn: (targetDate: string) => financeiroService.gerarFechoDiario({ data: targetDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fechos_diarios"] });
      toast.success("Fecho consolidado com sucesso!");
    },
    onError: () => toast.error("Erro ao consolidar fecho")
  });

  const saldo = parseFloat(fluxo?.saldo || 0);

  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    { accessorKey: 'numero', header: 'FECHO Nº', cell: ({ getValue }) => <span className="font-bold text-gray-600 dark:text-gray-400">{getValue<string>()}</span> },
    { accessorKey: 'data_criacao', header: 'DATA', cell: ({ getValue }) => <span className="font-medium">{new Date(getValue<string>()).toLocaleDateString("pt-ST")}</span> },
    { accessorKey: 'recebimentos_total', header: 'ENTRADAS', cell: ({ getValue }) => <span className="font-semibold text-green-600">{formatCurrency(parseFloat(getValue<any>() || 0))}</span> },
    { accessorKey: 'despesas_total', header: 'SAÍDAS', cell: ({ getValue }) => <span className="font-semibold text-red-600">{formatCurrency(parseFloat(getValue<any>() || 0))}</span> },
    { accessorKey: 'saldo_final', header: 'SALDO LÍQUIDO', cell: ({ getValue }) => {
      const val = parseFloat(getValue<any>() || 0);
      return <span className={cn("font-bold", val >= 0 ? "text-success" : "text-error")}>{formatCurrency(val)}</span>;
    }}
  ], []);

  const handleConsolidate = () => {
    Swal.fire({
      title: 'Consolidação de Dia',
      text: 'Selecione a data a consolidar:',
      input: 'date',
      inputValue: new Date().toISOString().split('T')[0],
      showCancelButton: true,
      confirmButtonText: 'Consolidar Fecho Diário',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: 'var(--color-primary)'
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        consolidarMutation.mutate(result.value);
      }
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="text-primary" /> Saúde Financeira e Fluxo de Caixa
          </h2>
          <p className="text-xs text-gray-500 mt-1">Selecione o período para analisar receitas, despesas e rentabilidade.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold uppercase">De:</span>
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border rounded-lg dark:text-white outline-none focus:border-primary" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold uppercase">Até:</span>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border rounded-lg dark:text-white outline-none focus:border-primary" />
          </div>
          {canEdit && (
            <button 
              onClick={handleConsolidate}
              disabled={consolidarMutation.isPending}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 font-bold px-4 py-2 rounded-lg text-sm shadow-md transition-all active:scale-95 disabled:opacity-50 ml-auto"
            >
              {consolidarMutation.isPending ? "A Consolidar..." : "Consolidar Fecho Diário"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-green-100 dark:border-green-900/30 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 dark:bg-green-900/10 rounded-full -mr-10 -mt-10 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Entradas / Receitas</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{loadingFluxo ? '...' : formatCurrency(parseFloat(fluxo?.entradas || 0))}</p>
          </div>
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-2xl flex items-center justify-center relative z-10 shadow-inner">
            <TrendingUp size={28} />
          </div>
        </div>

        <div className="bg-white dark:bg-surface-dark p-6 rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 dark:bg-red-900/10 rounded-full -mr-10 -mt-10 pointer-events-none" />
          <div className="relative z-10">
            <p className="text-xs font-bold text-red-600 uppercase tracking-widest mb-1">Saídas / Despesas</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white">{loadingFluxo ? '...' : formatCurrency(parseFloat(fluxo?.saidas || 0))}</p>
          </div>
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl flex items-center justify-center relative z-10 shadow-inner">
            <TrendingDown size={28} />
          </div>
        </div>

        <div className={cn(
          "p-6 rounded-2xl border flex items-center justify-between shadow-sm relative overflow-hidden",
          saldo >= 0 
            ? "bg-gray-900 border-gray-800 dark:bg-white dark:border-gray-200" 
            : "bg-error border-red-700"
        )}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 pointer-events-none" />
          <div className="relative z-10">
            <p className={cn("text-xs font-bold uppercase tracking-widest mb-1", saldo >= 0 ? "text-gray-400 dark:text-gray-500" : "text-red-200")}>Saldo Líquido</p>
            <p className={cn("text-3xl font-black", saldo >= 0 ? "text-white dark:text-gray-900" : "text-white")}>
              {loadingFluxo ? '...' : formatCurrency(saldo)}
            </p>
          </div>
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center relative z-10 shadow-inner",
            saldo >= 0 ? "bg-white/10 dark:bg-black/5 text-white dark:text-gray-900" : "bg-black/20 text-white"
          )}>
            <Wallet size={28} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Histórico de Consolidações</h3>
        <DataTable data={fechos || []} columns={columns} isLoading={loadingFechos} searchPlaceholder="Pesquisar fechos..." />
      </div>
    </div>
  );
}


export default function Financeiro() {
  const [activeTab, setActiveTab] = useState(0);

  const TABS = [
    { label: "Reconciliação & Caixa", icon: <Banknote size={18} /> },
    { label: "Contas a Receber", icon: <HandCoins size={18} /> },
    { label: "Contas a Pagar", icon: <Receipt size={18} /> },
    { label: "Fluxo de Caixa", icon: <Activity size={18} /> }
  ];

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestão Financeira</h1>
        <p className="text-sm text-gray-500 mt-1">Controlo integral de receitas, despesas e relatórios de fecho.</p>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex overflow-x-auto gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        {TABS.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-t-lg font-bold text-sm transition-colors whitespace-nowrap",
              activeTab === idx 
                ? "text-primary border-b-2 border-primary bg-primary/5 dark:bg-primary/10" 
                : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="mt-4">
        {activeTab === 0 && <TabReconciliacao />}
        {activeTab === 1 && <TabContasReceber />}
        {activeTab === 2 && <TabContasPagar />}
        {activeTab === 3 && <TabFluxoCaixa />}
      </div>
    </div>
  );
}

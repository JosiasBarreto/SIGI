import React, { useState, useEffect } from "react";
import { 
  X, 
  Lock, 
  Unlock, 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertCircle, 
  HelpCircle, 
  RefreshCw, 
  Coins, 
  CheckCircle,
  Banknote,
  CreditCard
} from "lucide-react";
import { formatCurrency } from "../lib/utils";
import { financialService } from "../services";
import { toast } from "react-toastify";

interface CaixaSessionModalsProps {
  type: "abrir" | "fechar" | "sangria" | "reforco" | null;
  onClose: () => void;
  caixaId: number | string | null;
  openCaixa: any;
  abrirMutation: any;
  fecharMutation: any;
  movimentoMutation: any;
}

export default function CaixaSessionModals({
  type,
  onClose,
  caixaId,
  openCaixa,
  abrirMutation,
  fecharMutation,
  movimentoMutation,
}: CaixaSessionModalsProps) {
  // Opening state
  const [valorInicial, setValorInicial] = useState("");

  // Sangria & Reforço states
  const [valorMovimento, setValorMovimento] = useState("");
  const [descricaoMovimento, setDescricaoMovimento] = useState("");

  // Fechar states
  const [valoresEsperados, setValoresEsperados] = useState({
    dinheiro: 0,
    transferencia: 0,
    pos: 0
  });
  const [isLoadingEsperados, setIsLoadingEsperados] = useState(false);
  const [valorDeclaradoDinheiro, setValorDeclaradoDinheiro] = useState("");
  const [valorDeclaradoTransferencia, setValorDeclaradoTransferencia] = useState("");
  const [valorDeclaradoPOS, setValorDeclaradoPOS] = useState("");
  const [explicacaoDivergencia, setExplicacaoDivergencia] = useState("");

  // Fetch expected values on closing
  const fetchEsperados = async () => {
    if (!caixaId) return;
    setIsLoadingEsperados(true);
    try {
      const data = await financialService.getValoresEsperados(caixaId);
      setValoresEsperados({
        dinheiro: data?.valor_esperado_dinheiro || 0,
        transferencia: data?.valor_esperado_transferencia || 0,
        pos: data?.valor_esperado_pos || 0,
      });
    } catch (error) {
      console.error("Erro ao carregar valores esperados do caixa:", error);
      toast.error("Não foi possível carregar os valores esperados do caixa.");
    } finally {
      setIsLoadingEsperados(false);
    }
  };

  useEffect(() => {
    if (type === "fechar" && caixaId) {
      fetchEsperados();
      setValorDeclaradoDinheiro("");
      setValorDeclaradoTransferencia("");
      setValorDeclaradoPOS("");
      setExplicacaoDivergencia("");
    } else if (type === "abrir") {
      setValorInicial("");
    } else if (type === "sangria" || type === "reforco") {
      setValorMovimento("");
      setDescricaoMovimento("");
    }
  }, [type, caixaId]);

  if (!type) return null;

  // Calculos de fecho
  const esperadoDinheiro = valoresEsperados.dinheiro;
  const esperadoTransferencia = valoresEsperados.transferencia;
  const esperadoPOS = valoresEsperados.pos;

  const declaradoDinheiroNum = parseFloat(valorDeclaradoDinheiro) || 0;
  const declaradoTransferenciaNum = parseFloat(valorDeclaradoTransferencia) || 0;
  const declaradoPOSNum = parseFloat(valorDeclaradoPOS) || 0;

  const totalEsperado = esperadoDinheiro + esperadoTransferencia + esperadoPOS;
  const totalDeclarado = declaradoDinheiroNum + declaradoTransferenciaNum + declaradoPOSNum;
  const totalDivergencia = totalDeclarado - totalEsperado;

  const divergenciaDinheiro = declaradoDinheiroNum - esperadoDinheiro;
  const divergenciaTransferencia = declaradoTransferenciaNum - esperadoTransferencia;
  const divergenciaPOS = declaradoPOSNum - esperadoPOS;

  const temDivergencia = Math.abs(totalDivergencia) > 0.01;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (type === "abrir") {
      const val = parseFloat(valorInicial);
      if (isNaN(val) || val < 0) {
        toast.error("Por favor introduza um valor inicial válido.");
        return;
      }
      abrirMutation.mutate(val, {
        onSuccess: () => onClose()
      });
    } 

    else if (type === "sangria") {
      const val = parseFloat(valorMovimento);
      if (isNaN(val) || val <= 0) {
        toast.error("Por favor introduza um valor válido para sangria.");
        return;
      }
      movimentoMutation.mutate({
        tipo: "Sangria",
        valor: val,
        descricao: descricaoMovimento || "Sangria de caixa"
      }, {
        onSuccess: () => onClose()
      });
    } 

    else if (type === "reforco") {
      const val = parseFloat(valorMovimento);
      if (isNaN(val) || val <= 0) {
        toast.error("Por favor introduza um valor válido para reforço.");
        return;
      }
      movimentoMutation.mutate({
        tipo: "Reforço",
        valor: val,
        descricao: descricaoMovimento || "Reforço de caixa"
      }, {
        onSuccess: () => onClose()
      });
    } 

    else if (type === "fechar") {
      if (temDivergencia && !explicacaoDivergencia.trim()) {
        toast.error("Divergência detetada. Justificação é obrigatória!");
        return;
      }

      fecharMutation.mutate({
        id: caixaId!,
        payload: {
          valor_declarado_dinheiro: declaradoDinheiroNum,
          valor_declarado_transferencia: declaradoTransferenciaNum,
          valor_declarado_pos: declaradoPOSNum,
          explicacao_divergencia: explicacaoDivergencia,
        }
      }, {
        onSuccess: () => onClose()
      });
    }
  };

  const getTitle = () => {
    switch (type) {
      case "abrir": return "Abertura de Turno de Caixa";
      case "fechar": return "Fechar Turno e Reconciliação";
      case "sangria": return "Efetuar Sangria (Retirada)";
      case "reforco": return "Efetuar Reforço (Aporte)";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-border-dark flex items-center justify-between bg-gray-50 dark:bg-gray-850">
          <div className="flex items-center gap-3">
            {type === "abrir" && <Unlock className="text-success h-5 w-5" />}
            {type === "fechar" && <Lock className="text-error h-5 w-5" />}
            {type === "sangria" && <ArrowDownRight className="text-warning h-5 w-5" />}
            {type === "reforco" && <ArrowUpRight className="text-success h-5 w-5" />}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {getTitle()}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* ABRIR MODAL */}
          {type === "abrir" && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                <Coins className="text-primary h-6 w-6 shrink-0 mt-0.5" />
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p className="font-bold mb-1">Fundo de Maneio Inicial</p>
                  <p>Inicie o turno declarando o valor em dinheiro presente na gaveta física antes das vendas.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  Valor Inicial (STD)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    STD
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={valorInicial}
                    onChange={(e) => setValorInicial(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg pl-14 pr-4 py-3 text-lg font-semibold focus:border-primary focus:bg-white outline-none"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          )}

          {/* SANGRIA & REFORÇO MODAL */}
          {(type === "sangria" || type === "reforco") && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                type === "sangria" 
                  ? "bg-warning/5 border-warning/10 text-warning-dark" 
                  : "bg-success/5 border-success/10 text-success-dark"
              }`}>
                {type === "sangria" ? (
                  <ArrowDownRight className="h-6 w-6 shrink-0" />
                ) : (
                  <ArrowUpRight className="h-6 w-6 shrink-0" />
                )}
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  <p className="font-bold mb-1">
                    {type === "sangria" ? "Registar Saída (Sangria)" : "Registar Entrada (Reforço)"}
                  </p>
                  <p>
                    {type === "sangria" 
                      ? "Use para registar retiradas de dinheiro da gaveta física para depósito ou pagamentos rápidos."
                      : "Use para registar trocos adicionais ou aportes monetários de emergência no caixa."
                    }
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Valor (STD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                      STD
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={valorMovimento}
                      onChange={(e) => setValorMovimento(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-gray-50 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg pl-14 pr-4 py-2.5 text-base font-semibold focus:border-primary outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Descrição / Motivo
                  </label>
                  <input
                    type="text"
                    required
                    value={descricaoMovimento}
                    onChange={(e) => setDescricaoMovimento(e.target.value)}
                    placeholder={type === "sangria" ? "Ex: Depósito Bancário" : "Ex: Entrada de Troco"}
                    className="w-full bg-gray-50 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg px-4 py-2.5 text-base focus:border-primary outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* FECHAR / RECONCILIAÇÃO MODAL */}
          {type === "fechar" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase">Caixa Ativo</span>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary font-bold text-xs rounded-full">
                    #{caixaId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={fetchEsperados}
                  disabled={isLoadingEsperados}
                  className="p-1 text-gray-500 hover:text-primary transition-colors disabled:opacity-50 flex items-center gap-1 text-xs font-semibold"
                >
                  <RefreshCw size={14} className={isLoadingEsperados ? "animate-spin" : ""} />
                  Atualizar
                </button>
              </div>

              {isLoadingEsperados ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-medium text-gray-500">A obter totais esperados em tempo real...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Grid de Reconciliação */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-4 bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <div className="col-span-1">Método</div>
                      <div className="col-span-1 text-right">Esperado</div>
                      <div className="col-span-1 text-right">Declarado</div>
                      <div className="col-span-1 text-right">Diferença</div>
                    </div>

                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {/* DINHEIRO ROW */}
                      <div className="grid grid-cols-4 items-center px-4 py-3 text-sm">
                        <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                          <Banknote size={16} className="text-success" />
                          Dinheiro
                        </div>
                        <div className="text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(esperadoDinheiro)}
                        </div>
                        <div className="px-1">
                          <input
                            type="number"
                            step="0.01"
                            value={valorDeclaradoDinheiro}
                            onChange={(e) => setValorDeclaradoDinheiro(e.target.value)}
                            placeholder="0.00"
                            className="w-full text-right bg-gray-50 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded px-2 py-1 text-sm font-semibold focus:border-primary outline-none"
                          />
                        </div>
                        <div className={`text-right font-bold ${
                          divergenciaDinheiro === 0 
                            ? "text-success" 
                            : divergenciaDinheiro < 0 
                            ? "text-error" 
                            : "text-primary"
                        }`}>
                          {divergenciaDinheiro !== 0 ? formatCurrency(divergenciaDinheiro) : "STD 0.00"}
                        </div>
                      </div>

                      {/* POS ROW */}
                      <div className="grid grid-cols-4 items-center px-4 py-3 text-sm">
                        <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                          <CreditCard size={16} className="text-primary" />
                          POS (TPA)
                        </div>
                        <div className="text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(esperadoPOS)}
                        </div>
                        <div className="px-1">
                          <input
                            type="number"
                            step="0.01"
                            value={valorDeclaradoPOS}
                            onChange={(e) => setValorDeclaradoPOS(e.target.value)}
                            placeholder="0.00"
                            className="w-full text-right bg-gray-50 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded px-2 py-1 text-sm font-semibold focus:border-primary outline-none"
                          />
                        </div>
                        <div className={`text-right font-bold ${
                          divergenciaPOS === 0 
                            ? "text-success" 
                            : divergenciaPOS < 0 
                            ? "text-error" 
                            : "text-primary"
                        }`}>
                          {divergenciaPOS !== 0 ? formatCurrency(divergenciaPOS) : "STD 0.00"}
                        </div>
                      </div>

                      {/* TRANSFERENCIA ROW */}
                      <div className="grid grid-cols-4 items-center px-4 py-3 text-sm">
                        <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
                          <HelpCircle size={16} className="text-indigo-500" />
                          Transf.
                        </div>
                        <div className="text-right font-medium text-gray-900 dark:text-white">
                          {formatCurrency(esperadoTransferencia)}
                        </div>
                        <div className="px-1">
                          <input
                            type="number"
                            step="0.01"
                            value={valorDeclaradoTransferencia}
                            onChange={(e) => setValorDeclaradoTransferencia(e.target.value)}
                            placeholder="0.00"
                            className="w-full text-right bg-gray-50 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded px-2 py-1 text-sm font-semibold focus:border-primary outline-none"
                          />
                        </div>
                        <div className={`text-right font-bold ${
                          divergenciaTransferencia === 0 
                            ? "text-success" 
                            : divergenciaTransferencia < 0 
                            ? "text-error" 
                            : "text-primary"
                        }`}>
                          {divergenciaTransferencia !== 0 ? formatCurrency(divergenciaTransferencia) : "STD 0.00"}
                        </div>
                      </div>

                      {/* TOTALS ROW */}
                      <div className="grid grid-cols-4 items-center bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm font-bold border-t-2 border-gray-200 dark:border-gray-700">
                        <div className="text-gray-800 dark:text-gray-200">TOTAL</div>
                        <div className="text-right text-gray-900 dark:text-white">
                          {formatCurrency(totalEsperado)}
                        </div>
                        <div className="text-right text-gray-900 dark:text-white pr-2">
                          {formatCurrency(totalDeclarado)}
                        </div>
                        <div className={`text-right ${
                          Math.abs(totalDivergencia) <= 0.01 
                            ? "text-success" 
                            : totalDivergencia < 0 
                            ? "text-error" 
                            : "text-primary"
                        }`}>
                          {formatCurrency(totalDivergencia)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alerta de Divergência se aplicável */}
                  {temDivergencia && (
                    <div className="p-4 bg-error/5 border border-error/15 rounded-xl space-y-3">
                      <div className="flex items-start gap-2 text-error">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm">Divergência Detetada</p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            O total físico declarado difere em <strong>{formatCurrency(totalDivergencia)}</strong> do total esperado calculado pelo sistema. É obrigatório fornecer uma justificação detalhada.
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                          Explicação / Justificação da Divergência
                        </label>
                        <textarea
                          required
                          value={explicacaoDivergencia}
                          onChange={(e) => setExplicacaoDivergencia(e.target.value)}
                          placeholder="Explicar motivo da diferença (ex: falta de moedas de troco, devolução não registada no sistema, etc.)"
                          className="w-full bg-gray-50 border border-gray-200 dark:border-gray-700 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm focus:border-error outline-none min-h-[80px]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Confirmação sem divergência */}
                  {!temDivergencia && (
                    <div className="p-4 bg-success/5 border border-success/15 rounded-xl flex items-center gap-3 text-success">
                      <CheckCircle className="h-5 w-5 shrink-0" />
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        Os totais declarados coincidem perfeitamente com os valores esperados registados no sistema. Excelente reconciliação!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-gray-850 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              abrirMutation.isPending || 
              fecharMutation.isPending || 
              movimentoMutation.isPending ||
              isLoadingEsperados ||
              (type === "fechar" && temDivergencia && !explicacaoDivergencia.trim())
            }
            className={`px-5 py-2 text-white font-bold text-sm rounded-lg shadow-sm transition-all flex items-center gap-2 ${
              type === "fechar" 
                ? "bg-error hover:bg-error-hover" 
                : "bg-primary hover:bg-primary-hover"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {type === "abrir" && (abrirMutation.isPending ? "A abrir..." : "Abrir Turno")}
            {type === "sangria" && (movimentoMutation.isPending ? "A registar..." : "Registar Sangria")}
            {type === "reforco" && (movimentoMutation.isPending ? "A registar..." : "Registar Reforço")}
            {type === "fechar" && (fecharMutation.isPending ? "A fechar..." : "Encerrar Caixa")}
          </button>
        </div>

      </div>
    </div>
  );
}

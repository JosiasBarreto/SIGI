import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertOctagon, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an untamed exception:", error, errorInfo);
    this.setState({ errorInfo });
    
    // Attempt tracking or dispatching if needed
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div id="error-boundary-root" className="min-h-screen flex flex-col justify-center items-center bg-gray-50 dark:bg-gray-950 p-6 font-sans">
          <div id="error-card" className="w-full max-w-xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-150 dark:border-gray-800 p-8 text-center transition-all">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-50 dark:bg-red-950/45 rounded-full text-red-600 dark:text-red-400">
                <AlertOctagon size={48} />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-950 dark:text-white tracking-tight mb-2">
              Algo não correu bem
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
              O SIGI ERP encontrou uma exceção inesperada ao renderizar este componente. A equipa de engenharia foi notificada para resolver esta ocorrência.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
              <button
                id="btn-retry"
                onClick={this.handleReset}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-all focus:outline-none cursor-pointer"
                style={{ backgroundColor: "var(--color-primary, #ca8a04)" }}
              >
                <RefreshCw size={16} className="animate-spin-hover" />
                Recarregar Aplicação
              </button>
              <button
                id="btn-home"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-250 text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-750 shadow-xs transition-style cursor-pointer"
              >
                <Home size={16} />
                Voltar ao Início
              </button>
            </div>

            {/* Tech details drawer */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 text-left">
              <button
                id="btn-toggle-tech-details"
                onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                className="w-full flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 tracking-wider uppercase"
              >
                <span>Informação Técnica de Depuração</span>
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {this.state.showDetails && (
                <div className="mt-4 bg-gray-50 dark:bg-gray-950/80 rounded-lg p-4 border border-gray-150 dark:border-gray-800/80 overflow-auto max-h-60 text-[11px] font-mono text-gray-600 dark:text-gray-400 leading-normal scrollbar-thin">
                  <p className="font-bold text-red-650 dark:text-red-400 mb-2">
                    Erro: {this.state.error?.toString() || "Não especificado"}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <div className="whitespace-pre-wrap">
                      <span className="font-bold block text-gray-500 dark:text-gray-400 mt-2">Rastreio de Pilha React:</span>
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

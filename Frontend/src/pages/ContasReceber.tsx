import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeiroService } from '../services';
import { Search, DollarSign, Calendar, Eye, CalendarClock, CreditCard, Filter, Save, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-toastify';
import Modal from '../components/Common/Modal';

export default function ContasReceber() {
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('Pendente'); // Default to showing actionable pendings

  // Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedConta, setSelectedConta] = useState<any>(null);
  const [valorRecebido, setValorRecebido] = useState<number>(0);
  const [metodoPagamento, setMetodoPagamento] = useState('Multicaixa');
  const [observacoes, setObservacoes] = useState('');

  // Fetch accounts receivable
  const { data: contas = [], isLoading } = useQuery({
    queryKey: ['contas_receber', estado, search],
    queryFn: () => financeiroService.getContasReceber({ 
      estado: estado === 'Todos' ? undefined : estado, 
      search 
    })
  });

  // Calculate high-level summary cards from loaded data
  const totalPendente = contas
    .filter((c: any) => c.estado !== 'Pago' && c.estado !== 'Cancelado')
    .reduce((sum: number, c: any) => sum + (c.saldo || 0), 0);

  const totalPago = contas
    .filter((c: any) => c.estado === 'Pago')
    .reduce((sum: number, c: any) => sum + (c.valor_pago || 0), 0);

  const totalGeral = contas.reduce((sum: number, c: any) => sum + (c.valor_original || 0), 0);

  // Payments registration mutation
  const payMutation = useMutation({
    mutationFn: ({ id, params }: { id: string | number, params: any }) => 
      financeiroService.receberPagamento(id, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_receber'] });
      // Invalidate sales grid too as it syncs up live
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      
      toast.success('Amortização de dívida registada e integrada nas contas da Sabor Imbatível.');
      setIsPaymentOpen(false);
    },
    onError: () => toast.error('Erro ao registar amortização do débito.')
  });

  const handleOpenPayment = (conta: any) => {
    setSelectedConta(conta);
    setValorRecebido(conta.saldo);
    setMetodoPagamento('Multicaixa');
    setObservacoes('');
    setIsPaymentOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (valorRecebido <= 0) {
      toast.error('O montante a receber deve ser superior a zero.');
      return;
    }
    if (valorRecebido > selectedConta.saldo) {
      toast.error(`O valor inserido excede o montante em dívida (${formatCurrency(selectedConta.saldo)}).`);
      return;
    }

    payMutation.mutate({
      id: selectedConta.id,
      params: {
        valor: valorRecebido,
        metodo_pagamento: metodoPagamento,
        observacao: observacoes
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Contas a Receber (Gestão de Cobranças)
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Acompanhamento e arrecadação de faturas a prazo, amortizações de adjudicação e controlo de saldos pendentes da Sabor Imbatível.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        <div className="p-5 bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
          <div className="text-gray-400 font-bold text-[11px] tracking-wider uppercase">Pendente de Liquidação</div>
          <div className="text-3xl font-black font-mono mt-3 text-red-500">{formatCurrency(totalPendente)}</div>
          <p className="text-xs text-gray-500 mt-2">Valor ativo aguardando cobrança comercial.</p>
        </div>

        <div className="p-5 bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
          <div className="text-gray-400 font-bold text-[11px] tracking-wider uppercase">Amortizado / Cobrado</div>
          <div className="text-3xl font-black font-mono mt-3 text-emerald-500">{formatCurrency(totalPago)}</div>
          <p className="text-xs text-gray-500 mt-2">Total de receitas arrecadadas destas contas.</p>
        </div>

        <div className="p-5 bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
          <div className="text-gray-400 font-bold text-[11px] tracking-wider uppercase">Faturação Comercial Acumulada</div>
          <div className="text-3xl font-black font-mono mt-3 text-primary">{formatCurrency(totalGeral)}</div>
          <p className="text-xs text-gray-500 mt-2">Volume global faturado com pagamentos pendentes ou integrados.</p>
        </div>

      </div>

      {/* Control bar filters */}
      <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        
        {/* States tabs */}
        <div className="flex gap-2.5 overflow-x-auto shrink-0 select-none">
          {['Todos', 'Pendente', 'Parcial', 'Pago', 'Cancelado'].map(st => (
            <button 
              key={st}
              onClick={() => setEstado(st)}
              className={cn(
                "whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
                estado === st 
                  ? "bg-gray-900 border-gray-900 text-white dark:bg-white dark:border-white dark:text-gray-900 shadow-md"
                  : "bg-white dark:bg-surface-dark border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-800 dark:text-gray-400"
              )}
            >
              {st === 'Todos' ? 'Mostrar Todos' : st}
            </button>
          ))}
        </div>

        {/* Input search */}
        <div className="flex items-center bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 w-full sm:w-80">
          <Search size={16} className="text-gray-400 mr-2 shrink-0" />
          <input 
            type="text" 
            placeholder="Pesquisar fatura ou cliente..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none font-medium text-xs w-full text-gray-900 dark:text-gray-100"
          />
        </div>

      </div>

      {/* Table grid */}
      <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">A carregar registos...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-4">Fatura Ref.</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Valor Original</th>
                  <th className="px-6 py-4">Total Amortizado</th>
                  <th className="px-6 py-4 text-red-500">Saldo em Dívida</th>
                  <th className="px-6 py-4">Vencimento</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {contas.length > 0 ? contas.map((conta: any) => {
                  const isOverdue = new Date(conta.vencimento) < new Date() && conta.estado !== 'Pago' && conta.estado !== 'Cancelado';
                  return (
                    <tr key={conta.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors">
                      
                      {/* Document Ref */}
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        {conta.venda_numero}
                      </td>

                      {/* Client */}
                      <td className="px-6 py-4">
                        {conta.cliente_nome || 'Cliente Geral'}
                      </td>

                      {/* Original Cost */}
                      <td className="px-6 py-4 font-mono text-xs">
                        {formatCurrency(conta.valor_original)}
                      </td>

                      {/* Overlooked Pay */}
                      <td className="px-6 py-4 font-mono text-xs text-green-500">
                        {formatCurrency(conta.valor_pago || 0)}
                      </td>

                      {/* Outstanding Debt */}
                      <td className="px-6 py-4 font-mono text-xs font-bold text-red-500">
                        {formatCurrency(conta.saldo)}
                      </td>

                      {/* Due date */}
                      <td className={cn(
                        "px-6 py-4 text-xs font-mono",
                        isOverdue ? "text-red-500 font-bold flex items-center gap-1.5" : "text-gray-500"
                      )}>
                        {isOverdue && <CalendarClock size={14} className="shrink-0" />}
                        {new Date(conta.vencimento).toLocaleDateString('pt-PT')}
                        {isOverdue && <span className="text-[9px] bg-red-100 dark:bg-red-900/40 px-1 py-0.5 rounded leading-none">Atraso</span>}
                      </td>

                      {/* Estado label */}
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "inline-block rounded-full px-2.5 py-1 text-xs font-bold uppercase leading-none",
                          conta.estado === 'Pago' && "bg-green-100 text-green-800 dark:bg-green-905/10 dark:text-green-400",
                          conta.estado === 'Parcial' && "bg-amber-100 text-amber-800 dark:bg-amber-905/10 dark:text-amber-400",
                          conta.estado === 'Pendente' && "bg-red-100 text-red-800 dark:bg-red-905/10 dark:text-red-400",
                          conta.estado === 'Cancelado' && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        )}>
                          {conta.estado}
                        </span>
                      </td>

                      {/* Single payment call to action */}
                      <td className="px-6 py-4 text-right">
                        {conta.saldo > 0 && conta.estado !== 'Cancelado' ? (
                          <button 
                            onClick={() => handleOpenPayment(conta)}
                            className="text-xs bg-emerald-55 bg-primary hover:bg-opacity-90 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 ml-auto transition-all"
                          >
                            <DollarSign size={13} /> Cobrar
                          </button>
                        ) : (
                          <div className="text-gray-400 dark:text-gray-600 text-xs font-bold flex items-center justify-end gap-1">
                            <CheckCircle size={14} className="text-green-500" /> Liquidado
                          </div>
                        )}
                      </td>

                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Nenhuma conta a receber encontrada com o filtro de estado selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Collect Debt Payment Modal Dialogue */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title={selectedConta ? `Cobrança Comercial de Saldo — Ftr Ref $${selectedConta.venda_numero}` : 'Registo de Amortização de Dívida'}
        footer={
          <>
            <button 
              type="button" 
              onClick={() => setIsPaymentOpen(false)} 
              className="px-4 py-2 border rounded-lg text-xs"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              form="financial-direct-pay" 
              className="px-4 py-2 bg-success text-white rounded-lg text-xs font-bold"
            >
              <Save size={14} className="inline mr-1" /> Submeter Amortização
            </button>
          </>
        }
      >
        {selectedConta && (
          <form id="financial-direct-pay" onSubmit={handleSavePayment} className="space-y-4 text-sm">
            
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg text-emerald-900 dark:text-emerald-300 text-xs font-semibold flex items-start gap-2 leading-relaxed">
              <CheckCircle size={18} className="shrink-0 text-emerald-600 mt-0.5" />
              <div>
                Está a registar uma receita de cobrança para o cliente <strong className="text-black dark:text-white">{selectedConta.cliente_nome}</strong> referente ao débito comercial ativo. O balanço do cliente e os rasts comerciais de auditoria serão reconciliados de imediato.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border">
                <span className="text-[10px] text-gray-400 uppercase font-bold block">Valor de Faturação Original</span>
                <span className="font-bold font-mono text-sm dark:text-white">{formatCurrency(selectedConta.valor_original)}</span>
              </div>
              <div className="p-3 bg-red-50/50 dark:bg-red-950/10 rounded border">
                <span className="text-[10px] text-red-500 uppercase font-bold block">Saldo Restante Devedor</span>
                <span className="font-black font-mono text-sm text-red-500">{formatCurrency(selectedConta.saldo)}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Quantia Arrecadada (STD) <span className="text-error">*</span></label>
              <input 
                type="number"
                required
                min={1}
                max={selectedConta.saldo}
                value={valorRecebido || ''}
                onChange={(e) => setValorRecebido(Number(e.target.value))}
                className="w-full text-lg font-black font-mono px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Método Comercial Utilizado</label>
              <select 
                value={metodoPagamento} 
                onChange={(e) => setMetodoPagamento(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="Multicaixa">Multicaixa / TPA</option>
                <option value="Dinheiro">Dinheiro Líquido</option>
                <option value="Transferência">Ref. Transferência Bancária</option>
                <option value="Cheque">Depósito em Banco / Cheque</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Observações do Recibo de Cobrança</label>
              <textarea 
                rows={2}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Exemplo: Cobrança da primeira prestação da encomenda de materiais."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

          </form>
        )}
      </Modal>

    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { financeiroService } from '../services';
import { DollarSign, Printer, Lock, CheckCircle, RefreshCw, Layers, Calendar, ClipboardList } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

export default function FechoDiario() {
  const queryClient = useQueryClient();
  const [selectedFecho, setSelectedFecho] = useState<any>(null);

  // Fetch daily closings
  const { data: fechos = [], isLoading, refetch } = useQuery({
    queryKey: ['fecho_diario'],
    queryFn: () => financeiroService.getFechosDiarios()
  });

  // Create daily closing mutation
  const closeMutation = useMutation({
    mutationFn: () => financeiroService.gerarFechoDiario(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fecho_diario'] });
      setSelectedFecho(data);
      toast.success(`Fecho Diário #${data.numero} compilado e consolidado com sucesso!`);
    },
    onError: () => {
      toast.error('Erro ao gerar fecho diário.');
    }
  });

  const handleGenerateClose = () => {
    Swal.fire({
      title: 'Gerar Fecho Diário Comercial?',
      text: 'Este procedimento consolidará todos os ingressos, faturas e fundos de caixa registados no dia atual. Não poderá registar mais vendas balcão no caixa aberto após este fecho.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Confirmar e Fechar Dia',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        closeMutation.mutate();
      }
    });
  };

  const handlePrintFecho = (fecho: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Por favor, desative o bloqueador de janelas pop-up para imprimir.');
      return;
    }

    const html = `
      <html>
        <head>
          <title>Fecho de Caixa ${fecho.numero}</title>
          <style>
            body { font-family: Courier, monospace; color: #000; padding: 20px; width: 300px; margin: 0 auto; font-size: 12px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; }
            .title { font-size: 14px; font-weight: bold; }
            .row { display: flex; justify-content: space-between; padding: 4px 0; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="title">SABOR IMBATÍVEL, S.A.</span><br/>
            <span>Turno / Fecho Diário</span><br/>
            <span>Ref: ${fecho.numero}</span><br/>
            <span>Data: ${new Date(fecho.data_criacao).toLocaleString('pt-PT')}</span>
          </div>
          
          <div class="row">
            <span>Emitido por:</span>
            <span>Sistema SIGI</span>
          </div>
          <div class="line"></div>
          
          <div class="row">
            <span>(+) VENDAS BRUTO:</span>
            <span>${formatCurrency(fecho.vendas_total)}</span>
          </div>
          <div class="row">
            <span>(+) TOTAL RECEBIMENTOS:</span>
            <span>${formatCurrency(fecho.recebimentos_total)}</span>
          </div>
          <div class="row">
            <span>(-) DESPESAS RESUMIDAS:</span>
            <span>${formatCurrency(fecho.despesas_total)}</span>
          </div>
          
          <div class="line"></div>
          <div class="row bold">
            <span>SALDO FINAL EM CAIXA:</span>
            <span>${formatCurrency(fecho.saldo_final)}</span>
          </div>
          <div class="line"></div>
          
          <div class="bold">Resumo por Operador:</div>
          ${fecho.caixas_detalhes?.map((c: any) => `
            <div class="row" style="margin-top: 5px;">
              <span>${c.operador}</span>
              <span>${formatCurrency(c.saldo_final)}</span>
            </div>
            <div class="row">
              <span style="font-size: 10px; padding-left: 10px;">- Fundo Inicial:</span>
              <span style="font-size: 10px;">${formatCurrency(c.saldo_inicial)}</span>
            </div>
            <div class="row">
              <span style="font-size: 10px; padding-left: 10px;">- Receitas / Caixa:</span>
              <span style="font-size: 10px;">${formatCurrency(c.receitas)}</span>
            </div>
          `).join('')}
          
          <div class="line"></div>
          <div class="footer">
            SIGI ERP • Sabor Imbatível, S.A.<br/>
            Operação Homologada por Auditoria<br/>
            ${new Date().toLocaleString('pt-PT')}
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSelectFecho = (fecho: any) => {
    setSelectedFecho(fecho);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header titles */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Fecho Diário e Turnos
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Controlo fiscal de fechos de caixa diários, conciliação de receitas de atendimento e auditorias de encerramento de turno.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => refetch()} 
            className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-xs font-bold transition-all bg-white dark:bg-surface-dark"
          >
            <RefreshCw size={14} /> Recompor
          </button>
          
          <button
            onClick={handleGenerateClose}
            disabled={closeMutation.isPending}
            className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-primary/20"
          >
            <Lock size={14} /> Gerar Fecho Diário
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left side: History list of closures */}
        <div className="lg:col-span-1 bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white border-b pb-2 flex items-center gap-1.5 uppercase tracking-wide text-gray-400">
            <ClipboardList size={16} className="text-primary" /> Histórico de Fechos
          </h2>
          
          <div className="overflow-y-auto max-h-[500px] space-y-2.5">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400 text-xs">A carregar fechos...</div>
            ) : fechos.length > 0 ? fechos.map((f: any) => (
              <button
                key={f.id}
                onClick={() => handleSelectFecho(f)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-all flex flex-col justify-between hover:border-gray-300 dark:hover:border-gray-700",
                  selectedFecho && selectedFecho.id === f.id
                    ? "bg-primary/5 border-primary"
                    : "bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-800"
                )}
              >
                <div className="flex justify-between w-full">
                  <span className="font-bold text-xs uppercase tracking-wide leading-none py-1 text-gray-900 dark:text-white">
                    {f.numero}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-500 font-mono">
                    {formatCurrency(f.saldo_final)}
                  </span>
                </div>
                
                <div className="flex justify-between w-full mt-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} /> {new Date(f.data_criacao).toLocaleDateString('pt-PT')}
                  </span>
                  <span className="font-mono text-[10px]">vds: {formatCurrency(f.vendas_total)}</span>
                </div>
              </button>
            )) : (
              <div className="text-center py-12 text-gray-400 text-xs">Nenhum fecho diário registado ainda.</div>
            )}
          </div>
        </div>

        {/* Right side: Active details for the selected closure report */}
        <div className="lg:col-span-2 bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          {selectedFecho ? (
            <div className="space-y-6 text-sm animate-fade-in-up">
              
              {/* Report Header */}
              <div className="flex justify-between items-start border-b pb-4 border-gray-150">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    Encerramento Diário Comercial: {selectedFecho.numero}
                  </h3>
                  <div className="text-xs text-gray-400 flex items-center gap-3 mt-1.5">
                    <span>Certificado por: <strong>Controladoria SIGI</strong></span>
                    <span>•</span>
                    <span>Criado em: <strong>{new Date(selectedFecho.data_criacao).toLocaleString('pt-PT')}</strong></span>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePrintFecho(selectedFecho)}
                  className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all"
                >
                  <Printer size={14} /> Imprimir Resumo
                </button>
              </div>

              {/* Ledger Summary grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border text-center">
                  <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Faturação Bruta</div>
                  <div className="text-lg font-black font-mono text-primary mt-2">{formatCurrency(selectedFecho.vendas_total)}</div>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-xl border text-center">
                  <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Recebimentos Caixa</div>
                  <div className="text-lg font-black font-mono text-emerald-600 mt-2">{formatCurrency(selectedFecho.recebimentos_total)}</div>
                </div>

                <div className="p-4 bg-red-50/50 dark:bg-red-950/10 rounded-xl border text-center">
                  <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Despesas / Sangria</div>
                  <div className="text-lg font-black font-mono text-red-500 mt-2">{formatCurrency(selectedFecho.despesas_total)}</div>
                </div>

                <div className="p-4 bg-gray-900 text-white rounded-xl text-center shadow-md">
                  <div className="text-[10px] text-gray-350 font-bold uppercase tracking-wider text-gray-300">Saldo Consolidado</div>
                  <div className="text-lg font-black font-mono text-white mt-2">{formatCurrency(selectedFecho.saldo_final)}</div>
                </div>

              </div>

              {/* Cashiers Operator sections */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Layers size={14} className="text-primary" /> Concessão e Declaração de Operadores de Caixa
                </h4>

                <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
                  {selectedFecho.caixas_detalhes?.map((c: any, idx: number) => (
                    <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-semibold hover:bg-gray-50/50 dark:hover:bg-gray-800/10 transition-colors">
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <CheckCircle size={15} className="text-green-500 shrink-0" /> Operador: {c.operador}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 font-medium select-none">
                          Fundo de Maneio Inicial: <strong className="text-gray-600 dark:text-gray-300">{formatCurrency(c.saldo_inicial)}</strong>
                        </div>
                      </div>

                      <div className="flex gap-4 text-xs font-mono">
                        <div className="text-right">
                          <span className="block text-[10px] text-gray-400 uppercase font-bold">Arrecadado</span>
                          <span className="text-green-500 font-bold">+{formatCurrency(c.receitas)}</span>
                        </div>
                        <div className="text-right border-l pl-4">
                          <span className="block text-[10px] text-gray-400 uppercase font-bold">Saldo de Turno</span>
                          <span className="text-gray-900 dark:text-white font-black">{formatCurrency(c.saldo_final)}</span>
                        </div>
                      </div>
                    </div>
                  )) || <p className="p-4 text-xs text-gray-400 text-center">Nenhum operador associado a este fecho.</p>}
                </div>
              </div>

              {/* Security certification audit text */}
              <div className="p-4 bg-gray-50 dark:bg-gray-800/30 rounded-xl border text-xs leading-relaxed font-semibold text-gray-500">
                ⚠️ <strong>Nota de Reconciliação Bancária e Auditoria Comercial:</strong> Este encerramento de caixa obedece às normas fiscais vigentes da Sabor Imbatível, S.A. Conforme as validações de rasto de auditoria do SIGI, os valores declarados coincidem eletronicamente com os pagamentos liquidados nas faturas-recibo emitidas.
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[350px] text-gray-400">
              <ClipboardList size={48} className="mb-4 opacity-25" />
              <p className="font-bold text-sm">Selecione um Fecho Diário para Visualizar</p>
              <p className="text-xs max-w-xs mt-1">Escolha um fecho diário consolidado na barra lateral ou clique em "Gerar Fecho Diário" para compilar as faturas do dia de hoje.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

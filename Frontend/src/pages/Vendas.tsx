import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendaService, clientService } from '../services';
import { useComercial } from '../hooks';
import { Filter, Eye, Printer, FileText, Ban, DollarSign, RefreshCw, Save, Send } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import Modal from '../components/Common/Modal';
import { DataTable } from '../components/Common/DataTable';
import { ColumnDef, PaginationState } from '@tanstack/react-table';

export default function Vendas() {
  const queryClient = useQueryClient();
  const { adicionarPagamento, enviarFatura } = useComercial();
  
  // Search & Filter State
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  
  // Pagination State
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  
  // Selected Sale for detail view
  const [selectedVenda, setSelectedVenda] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  
  // Register Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payValue, setPayValue] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('Multicaixa');
  const [payNotes, setPayNotes] = useState('');

  // Send Invoice Modal State
  const [isSendInvoiceOpen, setIsSendInvoiceOpen] = useState(false);
  const [vendaToSend, setVendaToSend] = useState<any>(null);
  const [sendMethod, setSendMethod] = useState<'email' | 'whatsapp'>('email');
  const [sendContact, setSendContact] = useState('');

  // Item details Modal State
  const [viewItemDetails, setViewItemDetails] = useState<any>(null);

  // Fetch Sales
  const { data: vendasResponse, isLoading, refetch } = useQuery({
    queryKey: ['vendas', paginationState.pageIndex + 1, paginationState.pageSize, search, estado, tipoDocumento, clienteId, dataInicio, dataFim],
    queryFn: () => vendaService.getAll({ 
      page: paginationState.pageIndex + 1, 
      per_page: paginationState.pageSize, 
      search, 
      estado, 
      cliente_id: clienteId, 
      tipo_documento: tipoDocumento, 
      data_inicio: dataInicio, 
      data_fim: dataFim 
    })
  });

  // Fetch Clients for filter selection
  const { data: clientsResponse } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll({ per_page: 500 })
  });

  const clients = clientsResponse?.items || [];
  const vendas = (vendasResponse as any)?.items || [];
  const paginationInfo = (vendasResponse as any)?.pagination || { page: 1, per_page: 10, total: 0, pages: 0 };

  // Mutations
  const refundMutation = useMutation({
    mutationFn: (id: string | number) => vendaService.cancelar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast.success('Venda cancelada e documento retificado com sucesso.');
      setIsDetailOpen(false);
    },
    onError: () => toast.error('Erro ao cancelar a venda.')
  });

  const paymentMutation = useMutation({
    mutationFn: ({ id, params }: { id: string | number, params: any }) => vendaService.registrarPagamento(id, params),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      toast.success('Pagamento registado e saldo atualizado em tempo real!');
      setIsPaymentOpen(false);
      
      // Update selected detail modal in real-time
      if (selectedVenda && String(selectedVenda.id) === String(data.id)) {
        setSelectedVenda(data);
      }
    },
    onError: () => toast.error('Erro ao registar pagamento.')
  });

  const handleOpenDetail = async (venda: any) => {
    try {
      const freshVenda = await vendaService.getById(venda.id);
      setSelectedVenda(freshVenda || venda);
      setIsDetailOpen(true);
    } catch {
      setSelectedVenda(venda);
      setIsDetailOpen(true);
    }
  };

  const handleCancelVenda = (id: string | number) => {
    Swal.fire({
      title: 'Cancelar Venda?',
      text: 'Será gerada uma nota de crédito (NC) retificativa de valor equivalente. Esta ação é irreversível.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Sim, retificar/cancelar',
      cancelButtonText: 'Manter ativa'
    }).then((result) => {
      if (result.isConfirmed) {
        refundMutation.mutate(id);
      }
    });
  };

  const handleOpenPayment = (venda: any) => {
    setSelectedVenda(venda);
    setPayValue(venda.saldo);
    setPayMethod('Multicaixa');
    setPayNotes('');
    setIsPaymentOpen(true);
  };

  const handleOpenSendInvoice = (venda: any) => {
    setVendaToSend(venda);
    setSendMethod('email');
    
    // Find matching client to pre-fill contact info
    const client = clients.find((c: any) => String(c.id) === String(venda.cliente_id));
    if (client) {
      setSendContact(client.email || client.telefone || '');
    } else {
      setSendContact('');
    }
    
    setIsSendInvoiceOpen(true);
  };

  const handleSendInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendaToSend) return;
    
    enviarFatura.mutate({
      id: Number(vendaToSend.id),
      data: {
        method: sendMethod,
        contact: sendContact
      }
    }, {
      onSuccess: () => {
        setIsSendInvoiceOpen(false);
      }
    });
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payValue <= 0) {
      toast.error('O valor do pagamento deve ser superior a zero.');
      return;
    }
    if (payValue > selectedVenda.saldo) {
      toast.error(`O valor inserido excede o saldo devedor (${formatCurrency(selectedVenda.saldo)}).`);
      return;
    }

    let forma_pagamento_id = 1; // Dinheiro
    if (payMethod === 'Multicaixa' || payMethod === 'TPA / POS') forma_pagamento_id = 3;
    if (payMethod === 'Transferência') forma_pagamento_id = 2;

    try {
      const resp = await adicionarPagamento.mutateAsync({
        id: selectedVenda.id,
        data: {
          forma_pagamento_id,
          valor: payValue,
          observacoes: payNotes
        }
      });
      setIsPaymentOpen(false);
      // Update selected detail modal in real-time
      if (selectedVenda && String(selectedVenda.id) === String(resp.venda_id)) {
        // optimistically fetch fresh detail
        handleOpenDetail({ id: resp.venda_id });
      }
    } catch (err) {
      // handled by hook
    }
  };

  const handlePrint = (venda: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Por favor, desative o bloqueador de janelas pop-up.');
      return;
    }
    
    // Aesthetic Print HTML
    const html = `
      <html>
        <head>
          <title>Fatura/FR ${venda.numero}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; padding: 40px; }
            .header { display: flex; justify-content: space-between; border-b: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #020617; }
            .meta { font-size: 14px; text-align: right; line-height: 1.6; }
            .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; font-size: 14px; }
            .section-title { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            th { text-align: left; background: #f8fafc; color: #475569; padding: 12px; font-weight: bold; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
            .right { text-align: right; }
            .total-panel { width: 300px; margin-left: auto; space-y: 10px; font-size: 14px; }
            .row { display: flex; justify-content: space-between; padding: 6px 0; }
            .final-total { border-top: 2px solid #000; font-weight: bold; font-size: 18px; padding-top: 10px; color: #020617; }
            .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">SABOR IMBATÍVEL, S.A.</div>
              <div style="font-size: 14px; color: #64748b; margin-top: 5px;">SIGI ERP - Sistema Integrado de Gestão Inteligente</div>
            </div>
            <div class="meta">
              <strong>${venda.tipo_documento} #${venda.numero}</strong><br/>
              Data: ${new Date(venda.data_venda).toLocaleString('pt-PT')}<br/>
              Série: ${venda.serie_documental || 'SERIE-2026'}<br/>
              Certificado: CERT-2026-SIB
            </div>
          </div>
          
          <div class="grid">
            <div>
              <div class="section-title">Emitente</div>
              <strong>Sabor Imbatível, S.A.</strong><br/>
              NIF: 500123456<br/>
              Rua Deolinda Rodrigues, Luanda<br/>
              Contacto: +244 923 123 456
            </div>
            <div>
              <div class="section-title">Destinatário / Adquirente</div>
              <strong>${venda.cliente_nome || 'Cliente Geral'}</strong><br/>
              NIF: ${venda.cliente_id ? 'Consulte Ficha' : 'Consumidor Final'}<br/>
              Luanda, Angola
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Descrição / Produto</th>
                <th class="right">Quantidade</th>
                <th class="right">Preço Unit.</th>
                <th class="right">IVA (%)</th>
                <th class="right">Total Líquido</th>
              </tr>
            </thead>
            <tbody>
              ${venda.itens?.map((it: any) => `
                <tr>
                  <td>${it.produto_nome}</td>
                  <td class="right">${it.quantidade}</td>
                  <td class="right">${formatCurrency(it.preco_unitario)}</td>
                  <td class="right">${it.iva_taxa || 14}%</td>
                  <td class="right">${formatCurrency(it.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-panel">
            <div class="row">
              <span>Subtotal:</span>
              <span>${formatCurrency(venda.subtotal)}</span>
            </div>
            <div class="row">
              <span>Total IVA:</span>
              <span>${formatCurrency(venda.iva_valor)}</span>
            </div>
            <div class="row final-total">
              <span>TOTAL (STD):</span>
              <span>${formatCurrency(venda.total)}</span>
            </div>
            <div class="row" style="color: #10b981; font-weight: bold; padding-top: 10px;">
              <span>Total Pago:</span>
              <span>${formatCurrency(venda.valor_pago)}</span>
            </div>
            <div class="row" style="color: #ef4444; font-weight: bold;">
              <span>Saldo Devedor:</span>
              <span>${formatCurrency(venda.saldo)}</span>
            </div>
          </div>
          
          <div style="font-size: 13px; font-weight: bold; margin-top: 40px; padding: 15px; background: #f8fafc; border-radius: 8px;">
            Estado de Liquidação: ${venda.estado.toUpperCase()}<br/>
            Série Comercial certificada pela AGT de Angola. Obrigado pela sua confiança!
          </div>

          <div class="footer">
            SIGI ERP • Processado por Computador • Sabor Imbatível, S.A.
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handleViewPDF = (venda: any) => {
    // Navigate to local view or prompt that it downloads/opens the digital tax duplicate
    Swal.fire({
      title: `Visualizar PDF de ${venda.tipo_documento}`,
      text: `O sistema está a conectar-se à API para buscar a via assinada digitalmente do documento ${venda.numero}.`,
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Abrir no Navegador',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success("A abrir cópia oficial AGT...");
        handlePrint(venda); // Render print helper as official PDF layout inside new tab
      }
    });
  };

  const clearFilters = () => {
    setEstado('');
    setTipoDocumento('');
    setClienteId('');
    setDataInicio('');
    setDataFim('');
    setSearch('');
    setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'numero',
        header: 'Número',
        cell: (info) => <span className="font-bold text-gray-900 dark:text-white">{info.getValue<string>()}</span>
      },
      {
        accessorKey: 'cliente_nome',
        header: 'Cliente',
        cell: (info) => info.getValue<string>() || 'Consumidor Final'
      },
      {
        accessorKey: 'tipo_documento',
        header: 'Documento',
        cell: (info) => {
          const type = info.getValue<string>();
          return (
            <span className={cn(
              "px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide",
              type === 'FR' && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
              type === 'FT' && "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
              type === 'PROFORMA' && "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
              type === 'NC' && "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
              type === 'ND' && "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
            )}>
              {type}
            </span>
          );
        }
      },
      {
        accessorKey: 'subtotal',
        header: 'Subtotal',
        cell: (info) => <span className="font-mono text-xs">{formatCurrency(info.getValue<number>())}</span>
      },
      {
        accessorKey: 'iva_valor',
        header: 'IVA',
        cell: (info) => <span className="font-mono text-xs text-gray-500">{formatCurrency(info.getValue<number>())}</span>
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: (info) => <span className="font-mono text-xs text-primary font-bold">{formatCurrency(info.getValue<number>())}</span>
      },
      {
        accessorKey: 'valor_pago',
        header: 'Pago',
        cell: (info) => <span className="font-mono text-xs text-green-600">{formatCurrency(info.getValue<number>() || 0)}</span>
      },
      {
        accessorKey: 'saldo',
        header: 'Saldo',
        cell: (info) => <span className="font-mono text-xs text-red-500">{formatCurrency(info.getValue<number>() || 0)}</span>
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        cell: (info) => {
          const st = info.getValue<string>();
          return (
            <span className={cn(
              "inline-block rounded-full px-2.5 py-1 text-xs font-bold leading-none uppercase",
              st === 'Pago' && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
              st === 'Parcial' && "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
              st === 'Pendente' && "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
              st === 'Cancelado' && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
            )}>
              {st}
            </span>
          );
        }
      },
      {
        accessorKey: 'data_venda',
        header: 'Data',
        cell: (info) => <span className="text-xs text-gray-500 font-mono">{new Date(info.getValue<string>()).toLocaleString('pt-PT')}</span>
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Ações</div>,
        cell: (info) => {
          const venda = info.row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <button 
                onClick={() => handleOpenDetail(venda)} 
                className="p-1.5 text-gray-500 hover:text-primary dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Detalhes da Venda"
              >
                <Eye size={15} />
              </button>
              <button 
                onClick={() => handlePrint(venda)} 
                className="p-1.5 text-gray-500 hover:text-green-600 rounded hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                title="Imprimir"
              >
                <Printer size={15} />
              </button>
              <button 
                onClick={() => handleViewPDF(venda)} 
                className="p-1.5 text-gray-500 hover:text-blue-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title="Ficha Oficial PDF"
              >
                <FileText size={15} />
              </button>
              {venda.saldo > 0 && venda.estado !== 'Cancelado' && (
                <button 
                  onClick={() => handleOpenPayment(venda)} 
                  className="p-1.5 text-gray-500 hover:text-emerald-500 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors"
                  title="Registar Pagamento"
                >
                  <DollarSign size={15} />
                </button>
              )}
              {venda.estado !== 'Cancelado' && (
                <button 
                  onClick={() => handleOpenSendInvoice(venda)} 
                  className="p-1.5 text-gray-500 hover:text-indigo-500 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors"
                  title="Enviar Fatura (Email/WhatsApp)"
                >
                  <Send size={15} />
                </button>
              )}
              {venda.estado !== 'Cancelado' && (
                <button 
                  onClick={() => handleCancelVenda(venda.id)} 
                  className="p-1.5 text-gray-500 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  title="Cancelar Comercial"
                >
                  <Ban size={15} />
                </button>
              )}
            </div>
          );
        }
      }
    ],
    []
  );

  const itemColumns = React.useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "produto_nome",
      header: "Descrição",
      cell: ({ row }) => <span className="font-semibold">{row.original.produto_nome}</span>
    },
    {
      accessorKey: "quantidade",
      header: () => <div className="text-right">Quantidade</div>,
      cell: ({ row }) => <div className="text-right font-mono">{row.original.quantidade}</div>
    },
    {
      accessorKey: "preco_unitario",
      header: () => <div className="text-right">Preço Unitário</div>,
      cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.original.preco_unitario)}</div>
    },
    {
      accessorKey: "iva_taxa",
      header: () => <div className="text-right">IVA (%)</div>,
      cell: ({ row }) => <div className="text-right font-mono text-gray-500">{row.original.iva_taxa || 14}%</div>
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Total Líquido</div>,
      cell: ({ row }) => <div className="text-right font-mono font-bold text-primary">{formatCurrency(row.original.total)}</div>
    },
    {
      id: "acoes",
      header: () => <div className="text-right">Ações</div>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <button
            onClick={() => setViewItemDetails(row.original)}
            className="text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1 font-bold text-xs"
            title="Ver mais detalhes"
          >
            <Eye size={14} /> Ver mais
          </button>
        </div>
      )
    }
  ], []);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            Módulo Comercial - Vendas e Faturação
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Registo oficial de transações comerciais, emissão de documentos certificados e controlo de liquidação fiscal.
          </p>
        </div>
        <button 
          onClick={() => refetch()} 
          className="p-2 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <RefreshCw size={16} /> Atualizar Grelha
        </button>
      </div>

      <DataTable
        data={vendas}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Pesquisar por número ou cliente..."
        onClearFilters={clearFilters}
        manualPagination={true}
        pageCount={paginationInfo.pages}
        paginationState={paginationState}
        onPaginationChange={setPaginationState}
        searchValue={search}
        onSearchChange={(value) => { setSearch(value); setPaginationState(p => ({...p, pageIndex: 0})); }}
        renderFilters={() => (
          <>
            <select 
              value={estado} 
              onChange={(e) => { setEstado(e.target.value); setPaginationState(p => ({...p, pageIndex: 0})); }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Qualquer Estado</option>
              <option value="Pago">Pago</option>
              <option value="Parcial">Liquidação Parcial</option>
              <option value="Pendente">Pendente de Cobrança</option>
              <option value="Cancelado">Retificado / Cancelado</option>
            </select>

            <select 
              value={tipoDocumento} 
              onChange={(e) => { setTipoDocumento(e.target.value); setPaginationState(p => ({...p, pageIndex: 0})); }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="">Qualquer Documento</option>
              <option value="FR">FR (Fatura-Recibo)</option>
              <option value="FT">FT (Fatura)</option>
              <option value="PROFORMA">Proforma</option>
              <option value="NC">NC (Nota de Crédito)</option>
              <option value="ND">ND (Nota de Débito)</option>
            </select>

            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={dataInicio}
                onChange={(e) => { setDataInicio(e.target.value); setPaginationState(p => ({...p, pageIndex: 0})); }}
                title="Data Início"
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="text-gray-400">até</span>
              <input 
                type="date"
                value={dataFim}
                onChange={(e) => { setDataFim(e.target.value); setPaginationState(p => ({...p, pageIndex: 0})); }}
                title="Data Fim"
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </>
        )}
      />

      {/* Sale Detail slide-over or Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedVenda ? `${selectedVenda.tipo_documento} Comercial: #${selectedVenda.numero}` : 'Detalhes Comerciais'}
        maxWidth="max-w-4xl"
        footer={
          <div className="flex justify-between w-full">
            <div>
              {selectedVenda && selectedVenda.estado !== 'Cancelado' && (
                <button 
                  onClick={() => handleCancelVenda(selectedVenda.id)} 
                  className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 transition-all text-left"
                >
                  <Ban size={14} /> Cancelar / NC
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePrint(selectedVenda)} 
                className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1"
              >
                <Printer size={14} /> Imprimir Doc
              </button>
              {selectedVenda && selectedVenda.estado !== 'Cancelado' && (
                <button 
                  onClick={() => { setIsDetailOpen(false); handleOpenSendInvoice(selectedVenda); }} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1"
                >
                  <Send size={14} /> Enviar Fatura
                </button>
              )}
              {selectedVenda && selectedVenda.saldo > 0 && selectedVenda.estado !== 'Cancelado' && (
                <button 
                  onClick={() => { setIsDetailOpen(false); handleOpenPayment(selectedVenda); }} 
                  className="bg-success text-white px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1 hover:bg-success/90"
                >
                  <DollarSign size={14} /> Receber Saldo
                </button>
              )}
              <button 
                onClick={() => setIsDetailOpen(false)} 
                className="bg-gray-300 dark:bg-gray-700 px-4 py-2 rounded-lg text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        }
      >
        {selectedVenda && (
          <div className="space-y-6 text-sm">
            
            {/* Header Cards Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-150">
                <div className="text-gray-500 font-bold text-xs uppercase tracking-wider">Informação do Emitente</div>
                <div className="font-bold text-gray-900 dark:text-white mt-2">Sabor Imbatível, S.A.</div>
                <div className="text-xs text-gray-500 mt-1">NIF: 500123456 • Luanda, Angola</div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-150">
                <div className="text-gray-500 font-bold text-xs uppercase tracking-wider">Cliente / Adquirente</div>
                <div className="font-bold text-gray-900 dark:text-white mt-2">
                  {selectedVenda.cliente_nome || 'Consumidor Final'}
                </div>
                <div className="text-xs text-gray-500 mt-1">NIF: {selectedVenda.cliente_id ? 'Consulte Ficha' : 'Consumidor Final'}</div>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-150 dark:border-gray-700">
                <div className="text-gray-500 font-bold text-xs uppercase tracking-wider">Resumo do Estado</div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={cn(
                    "px-2.5 py-1 text-xs font-bold rounded-full uppercase leading-none",
                    selectedVenda.estado === 'Pago' && "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
                    selectedVenda.estado === 'Parcial' && "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300",
                    selectedVenda.estado === 'Pendente' && "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
                    selectedVenda.estado === 'Cancelado' && "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                  )}>
                    {selectedVenda.estado}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
                    {selectedVenda.tipo_documento}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1.5 font-mono">
                  Série: {selectedVenda.serie_documental || 'SERIE-2026'}
                </div>
              </div>

            </div>

            {/* Product Lines Grid */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 font-bold text-xs text-gray-500 uppercase tracking-wider">
                Linhas do Documento / Itens da Fatura
              </div>
              <div className="overflow-x-auto">
                <DataTable
                  data={selectedVenda.itens || []}
                  columns={itemColumns}
                  searchPlaceholder="Pesquisar itens..."
                />
              </div>
            </div>

            {/* IVA and Financial Panel Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Payment History Timeline */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1">
                  Histórico de Recebimentos / Pagamentos
                </h4>
                {selectedVenda.pagamentos && selectedVenda.pagamentos.length > 0 ? (
                  <div className="space-y-3 font-medium text-xs">
                    {selectedVenda.pagamentos.map((p: any) => (
                      <div key={p.id} className="flex justify-between items-start pb-2 border-b last:border-none border-gray-100 last:pb-0 dark:border-gray-800">
                        <div>
                          <div className="font-bold text-green-600">+{formatCurrency(p.valor)}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{p.metodo_pagamento} • {p.observacao || 'Adjudicado'}</div>
                        </div>
                        <span className="text-[10px] font-semibold font-mono text-gray-400">
                          {new Date(p.data_pagamento).toLocaleDateString('pt-PT')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 flex py-6 justify-center text-xs">Nenhum pagamento registado nesta fatura.</div>
                )}
              </div>

              {/* Tax rates panel breakdown */}
              <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-5 border shadow-inner text-xs font-semibold space-y-2">
                <div className="flex justify-between text-gray-500 font-bold">
                  <span>Subtotal Isento / Líquido:</span>
                  <span className="font-mono">{formatCurrency(selectedVenda.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-bold">
                  <span>Total IVA Retido (14% S.I.):</span>
                  <span className="font-mono">{formatCurrency(selectedVenda.iva_valor)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-base text-gray-900 dark:text-white font-black">
                  <span>Total da Fatura (STN):</span>
                  <span className="font-mono text-primary">{formatCurrency(selectedVenda.total)}</span>
                </div>
                <div className="flex justify-between text-green-600 pt-1">
                  <span>Montante Pago:</span>
                  <span className="font-mono font-bold">{formatCurrency(selectedVenda.valor_pago || 0)}</span>
                </div>
                <div className="flex justify-between text-red-500 font-bold text-sm border-t border-dashed border-gray-300 pt-2">
                  <span>SALDO EM DÍVIDA:</span>
                  <span className="font-mono font-black">{formatCurrency(selectedVenda.saldo)}</span>
                </div>
              </div>

            </div>

            {/* Audit Logs Trail */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-800/10">
              <h4 className="font-semibold text-xs tracking-wider uppercase text-gray-500 mb-3">
                Rasto de Auditoria e Emissão Comercial
              </h4>
              <div className="space-y-2 font-mono text-[10px] text-gray-500">
                {selectedVenda.auditoria?.map((au: any, index: number) => (
                  <div key={index} className="flex justify-between py-1 border-b border-dashed last:border-none">
                    <span>
                      🚦 <strong className="text-gray-700 dark:text-gray-300">{au.utilizador}</strong> — {au.acao} {au.IP && `[IP: ${au.IP}]`}
                    </span>
                    <span>{new Date(au.data).toLocaleString('pt-PT')}</span>
                  </div>
                )) || <p>Não foi registado histórico nesta venda.</p>}
              </div>
            </div>

          </div>
        )}
      </Modal>

      {/* Register Payment Modal Dialogue */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title={selectedVenda ? `Registar Pagamento para: ${selectedVenda.numero}` : 'Registar Recebimento'}
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
              form="venda-pay-form" 
              className="px-4 py-2 bg-success text-white rounded-lg text-xs font-bold border border-success"
            >
              <Save size={14} className="inline mr-1" /> Gravar Recebimento
            </button>
          </>
        }
      >
        {selectedVenda && (
          <form id="venda-pay-form" onSubmit={handleRegisterPayment} className="space-y-4 text-sm">
            
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 rounded-lg text-xs font-semibold leading-relaxed">
              Está a registar um pagamento. O saldo em dívida desta fatura é de <strong className="text-sm font-mono text-amber-700 dark:text-amber-400">{formatCurrency(selectedVenda.saldo)}</strong>. O saldo do cliente será atualizado de forma automática após a gravação.
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Valor do Recebimento (STD) <span className="text-error">*</span></label>
              <input 
                type="number" 
                required
                min={1}
                max={selectedVenda.saldo}
                value={payValue || ''}
                onChange={(e) => setPayValue(Number(e.target.value))}
                className="w-full text-lg font-black font-mono px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Método de Liquidação</label>
              <select 
                value={payMethod} 
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm outline-none"
              >
                <option value="Multicaixa">Multicaixa / POS</option>
                <option value="Dinheiro">Dinheiro Físico</option>
                <option value="Transferência">Ref. Transferência Bancária</option>
                <option value="Depósito">Depósito Direto</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Observações do Recibo (Opcional)</label>
              <textarea 
                rows={2}
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Exemplo: Amortização parcial de adjudicação..."
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

          </form>
        )}
      </Modal>

      {/* Send Invoice Modal Dialogue */}
      <Modal
        isOpen={isSendInvoiceOpen}
        onClose={() => setIsSendInvoiceOpen(false)}
        title={vendaToSend ? `Enviar Documento Comercial #${vendaToSend.numero}` : 'Enviar Fatura'}
        footer={
          <>
            <button 
              type="button" 
              onClick={() => setIsSendInvoiceOpen(false)} 
              className="px-4 py-2 border rounded-lg text-xs"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              form="send-invoice-form" 
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              disabled={enviarFatura.isPending}
            >
              <Send size={14} /> {enviarFatura.isPending ? 'A enviar...' : 'Enviar Documento'}
            </button>
          </>
        }
      >
        {vendaToSend && (
          <form id="send-invoice-form" onSubmit={handleSendInvoiceSubmit} className="space-y-4 text-sm">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200 rounded-lg text-xs leading-relaxed">
              O documento comercial será enviado de forma assíncrona através do nosso servidor central de comunicações. Escolha o canal de contacto pretendido para o envio do PDF oficial.
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Canal de Envio</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-700 dark:text-gray-300">
                  <input 
                    type="radio" 
                    name="sendMethod" 
                    value="email" 
                    checked={sendMethod === 'email'} 
                    onChange={() => {
                      setSendMethod('email');
                      const client = clients.find((c: any) => String(c.id) === String(vendaToSend.cliente_id));
                      setSendContact(client?.email || '');
                    }}
                    className="accent-indigo-600"
                  />
                  Correio Eletrónico (E-mail)
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-700 dark:text-gray-300">
                  <input 
                    type="radio" 
                    name="sendMethod" 
                    value="whatsapp" 
                    checked={sendMethod === 'whatsapp'} 
                    onChange={() => {
                      setSendMethod('whatsapp');
                      const client = clients.find((c: any) => String(c.id) === String(vendaToSend.cliente_id));
                      setSendContact(client?.telefone || '');
                    }}
                    className="accent-indigo-600"
                  />
                  WhatsApp Directo (Telemóvel)
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                {sendMethod === 'email' ? 'Endereço de E-mail' : 'Número de Telemóvel / WhatsApp'} <span className="text-error">*</span>
              </label>
              <input 
                type={sendMethod === 'email' ? 'email' : 'text'} 
                required
                placeholder={sendMethod === 'email' ? 'exemplo@cliente.com' : '+244 9XX XXX XXX'}
                value={sendContact}
                onChange={(e) => setSendContact(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </form>
        )}
      </Modal>

    </div>
  );
}

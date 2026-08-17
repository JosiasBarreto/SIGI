import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendaService, clientService, documentService, productService, proformaService } from '../services';
import { useComercial } from '../hooks';
import { Filter, Eye, Printer, FileText, Ban, DollarSign, RefreshCw, Save, Send, Download, CheckCircle, Trash2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import Modal from '../components/Common/Modal';
import { DataTable } from '../components/Common/DataTable';
import { ColumnDef, PaginationState } from '@tanstack/react-table';

export default function Vendas() {
  const queryClient = useQueryClient();
  const { adicionarPagamento, enviarFatura } = useComercial();
  
  // Tab State: fiscal vs proforma (não fiscal)
  const [activeTab, setActiveTab] = useState<'fiscal' | 'proforma'>('fiscal');

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

  // Selected Proforma for detail view
  const [selectedProforma, setSelectedProforma] = useState<any>(null);
  const [isProformaDetailOpen, setIsProformaDetailOpen] = useState(false);
  const [isSendProformaOpen, setIsSendProformaOpen] = useState(false);
  const [proformaToSend, setProformaToSend] = useState<any>(null);
  
  // Register Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [payValue, setPayValue] = useState<number>(0);
  const [payMethod, setPayMethod] = useState('Multicaixa');
  const [payCode, setPayCode] = useState('');
  const [payEmitter, setPayEmitter] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Send Invoice Modal State
  const [isSendInvoiceOpen, setIsSendInvoiceOpen] = useState(false);
  const [vendaToSend, setVendaToSend] = useState<any>(null);
  const [sendMethod, setSendMethod] = useState<'email' | 'whatsapp'>('email');
  const [sendContact, setSendContact] = useState('');

  // Item details Modal State
  const [viewItemDetails, setViewItemDetails] = useState<any>(null);

  // Fetch Sales
  const { data: vendasResponse, isLoading, refetch: refetchVendas } = useQuery({
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
    }),
    enabled: activeTab === 'fiscal'
  });

  // Fetch Proformas (Não Fiscal) directly from backend API
  const { data: proformasResponse, isLoading: isLoadingProformas, refetch: refetchProformas } = useQuery({
    queryKey: ['proformas', paginationState.pageIndex + 1, paginationState.pageSize, search, estado, clienteId, dataInicio, dataFim],
    queryFn: () => proformaService.getAll({
      page: paginationState.pageIndex + 1,
      per_page: paginationState.pageSize,
      search,
      estado,
      cliente_id: clienteId,
      data_inicio: dataInicio,
      data_fim: dataFim,
    }),
    enabled: activeTab === 'proforma'
  });

  // Fetch Clients for filter selection
  const { data: clientsResponse } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clientService.getAll({ per_page: 500 })
  });

  // Fetch Products to resolve names in table
  const { data: productsResponse } = useQuery({
    queryKey: ['products-vendas'],
    queryFn: () => productService.getProdutosComerciais({ per_page: 1000 }).catch(() => ({ items: [] }))
  });

  const clients = clientsResponse?.items || [];
  const productsList = productsResponse?.items || [];
  
  const productsMap = useMemo(() => {
    const map: Record<string | number, any> = {};
    productsList.forEach((p: any) => {
      map[p.id] = p;
    });
    return map;
  }, [productsList]);

  const vendasRaw = (vendasResponse as any)?.items || [];
  const normalizeVenda = (venda: any) => ({
    ...venda,
    numero: venda.numero || venda.numero_documento,
    iva_valor: venda.iva_valor ?? venda.total_iva ?? 0,
    data_venda: venda.data_venda || venda.created_at,
    estado: venda.estado === 'Parcialmente Pago' ? 'Parcial' : venda.estado
  });
  const taxaIvaItem = (item: any) => item.taxa_iva ?? item.iva_taxa;
  const resumoIva = (venda: any) => Object.values((venda.itens || []).reduce((grupos: Record<string, { taxa: number; valor: number }>, item: any) => {
    const taxa = Number(taxaIvaItem(item));
    if (!Number.isFinite(taxa)) return grupos;
    const chave = String(taxa);
    grupos[chave] ||= { taxa, valor: 0 };
    grupos[chave].valor += Number(item.valor_iva ?? 0);
    return grupos;
  }, {} as Record<string, { taxa: number; valor: number }>));
  
  const vendas = vendasRaw.map(normalizeVenda);
  const paginationInfo = (vendasResponse as any)?.pagination || vendasResponse || { page: 1, per_page: 10, total: 0, pages: 0 };

  const proformasRaw = (proformasResponse as any)?.items || (Array.isArray(proformasResponse) ? proformasResponse : []);
  const proformaPaginationInfo = (proformasResponse as any)?.pages ? proformasResponse : { page: 1, per_page: 10, total: proformasRaw.length, pages: 1 };

  const clearFilters = () => {
    setSearch('');
    setEstado('');
    setTipoDocumento('');
    setClienteId('');
    setDataInicio('');
    setDataFim('');
    setPaginationState({ pageIndex: 0, pageSize: 10 });
  };

  const handleOpenProformaDetail = async (p: any) => {
    try {
      const fresh = await proformaService.getById(p.id);
      setSelectedProforma(fresh || p);
    } catch {
      setSelectedProforma(p);
    }
    setIsProformaDetailOpen(true);
  };

  const handleOpenSendProforma = (p: any) => {
    setProformaToSend(p);
    setSendMethod('email');
    const client = clients.find((c: any) => String(c.id) === String(p.cliente_id));
    if (client) {
      setSendContact(client.email || client.telefone || '');
    } else {
      setSendContact('');
    }
    setIsSendProformaOpen(true);
  };

  const handleSendProformaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proformaToSend || !sendContact.trim()) {
      toast.error('Informe o contacto do destinatário.');
      return;
    }
    try {
      const res = await proformaService.send(proformaToSend.id, sendMethod, sendContact.trim());
      toast.success(res.msg || `Pró-Forma enviada com sucesso via ${sendMethod}!`);
      setIsSendProformaOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao enviar Pró-Forma.');
    }
  };

  const handleFaturarProforma = async (proforma: any) => {
    const result = await Swal.fire({
      title: 'Converter em Fatura Comercial (FT)?',
      text: `A Pró-Forma ${proforma.numero_documento || `#${proforma.id}`} será convertida numa Fatura Comercial e o stock será abatido.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, Converter e Faturar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#10B981',
    });

    if (result.isConfirmed) {
      try {
        const res = await proformaService.faturar(proforma.id);
        toast.success(res.msg || 'Pró-Forma convertida em Fatura com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['proformas'] });
        queryClient.invalidateQueries({ queryKey: ['vendas'] });
      } catch (err: any) {
        toast.error(err?.response?.data?.error || err?.message || 'Erro ao faturar Pró-Forma.');
      }
    }
  };

  const handleDeleteProforma = async (proforma: any) => {
    const result = await Swal.fire({
      title: 'Eliminar Pró-Forma?',
      text: `A Pró-Forma ${proforma.numero_documento || `#${proforma.id}`} será eliminada permanentemente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      confirmButtonText: 'Sim, Eliminar',
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        const res = await proformaService.delete(proforma.id);
        toast.success(res.msg || 'Pró-Forma eliminada com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['proformas'] });
      } catch (err: any) {
        toast.error(err?.response?.data?.error || err?.message || 'Erro ao eliminar Pró-Forma.');
      }
    }
  };

  const proformaColumns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'numero_documento',
      header: 'Nº Documento',
      cell: (info) => (
        <div className="font-bold text-gray-900 dark:text-gray-100 font-mono text-xs">
          {info.getValue<string>() || `PROFORMA #${info.row.original.id}`}
        </div>
      )
    },
    {
      accessorKey: 'cliente_id',
      header: 'Cliente',
      cell: (info) => {
        const item = info.row.original;
        const client = clients.find((c: any) => String(c.id) === String(item.cliente_id));
        const clientName = client?.nome || client?.name || item.cliente?.nome || item.cliente_nome || 'Consumidor Final';
        return <span className="font-semibold text-xs text-gray-800 dark:text-gray-200">{clientName}</span>;
      }
    },
    {
      accessorKey: 'origem',
      header: 'Origem',
      cell: (info) => (
        <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-[11px] font-bold uppercase">
          {info.getValue<string>() || 'POS'}
        </span>
      )
    },
    {
      accessorKey: 'total',
      header: () => <div className="text-right">Total</div>,
      cell: (info) => (
        <div className="text-right font-bold text-xs text-emerald-600 dark:text-emerald-400 font-mono">
          {formatCurrency(Number(info.getValue<number>() || 0))}
        </div>
      )
    },
    {
      accessorKey: 'estado',
      header: 'Estado',
      cell: (info) => {
        const st = info.getValue<string>() || 'Emitida';
        return (
          <span className={cn(
            "inline-block rounded-full px-2.5 py-1 text-xs font-bold leading-none uppercase",
            st === 'Emitida' && "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400",
            st === 'Faturada' && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
            st === 'Cancelada' && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
          )}>
            {st}
          </span>
        );
      }
    },
    {
      accessorKey: 'created_at',
      header: 'Data de Emissão',
      cell: (info) => <span className="text-xs text-gray-500 font-mono">{info.getValue<string>() ? new Date(info.getValue<string>()).toLocaleString('pt-PT') : '-'}</span>
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Ações</div>,
      cell: (info) => {
        const item = info.row.original;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleOpenProformaDetail(item)}
              className="p-1.5 text-gray-500 hover:text-primary dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Ver Detalhes"
            >
              <Eye size={15} />
            </button>
            <button
              onClick={() => proformaService.openRecibo(item.id)}
              className="p-1.5 text-gray-500 hover:text-emerald-600 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
              title="Recibo Térmico (80mm)"
            >
              <Printer size={15} />
            </button>
            <button
              onClick={() => proformaService.openPdf(item.id)}
              className="p-1.5 text-gray-500 hover:text-blue-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Fatura Pró-Forma A4 (PDF)"
            >
              <FileText size={15} />
            </button>
            <button
              onClick={() => handleOpenSendProforma(item)}
              className="p-1.5 text-gray-500 hover:text-indigo-500 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors"
              title="Enviar por E-mail / WhatsApp"
            >
              <Send size={15} />
            </button>
            {item.estado === 'Emitida' && (
              <button
                onClick={() => handleFaturarProforma(item)}
                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                title="Converter em Fatura Comercial (FT)"
              >
                <RefreshCw size={13} /> Converter p/ FT
              </button>
            )}
            {item.estado === 'Emitida' && (
              <button
                onClick={() => handleDeleteProforma(item)}
                className="p-1.5 text-gray-500 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                title="Eliminar Pró-Forma"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        );
      }
    }
  ], [clients]);

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
    setPayCode('');
    setPayEmitter('');
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
    if ((payMethod === 'Multicaixa' || payMethod === 'TPA / POS' || payMethod === 'Transferência') && (!payCode.trim() || !payEmitter.trim())) {
      toast.error('Código de transação e emissor são obrigatórios para POS/Transferência.');
      return;
    }

    if (payMethod.startsWith('Dep') && (!payCode.trim() || !payEmitter.trim())) {
      toast.error('Código de transação e emissor são obrigatórios para depósito.');
      return;
    }

    let forma_pagamento_id = 1; // Dinheiro
    if (payMethod === 'Multicaixa' || payMethod === 'TPA / POS') forma_pagamento_id = 3;
    if (payMethod.startsWith('Dep')) forma_pagamento_id = 2;
    if (payMethod === 'Transferência') forma_pagamento_id = 2;

    try {
      const resp = await adicionarPagamento.mutateAsync({
        id: selectedVenda.id,
        data: {
          forma_pagamento_id,
          valor: payValue,
          codigo_transferencia: payMethod !== 'Dinheiro' ? payCode : null,
          emissor: payMethod !== 'Dinheiro' ? payEmitter : null,
          observacoes: payNotes || `Recebimento via ${payMethod}`
        }
      });
      setIsPaymentOpen(false);
      const vendaId = resp?.id ?? selectedVenda.id;
      // The payment endpoint returns the updated venda, rather than a wrapper
      // containing the former `venda_id` field.
      if (selectedVenda && String(selectedVenda.id) === String(vendaId)) {
        handleOpenDetail({ id: vendaId });
      }
      const r = resp as any;
      if (r?.tipo_documento === 'FT' && Number(r?.saldo || 0) <= 0 && r?.ultimo_pagamento?.recibo_url) {
        toast.success('FT liquidada. O recibo de liquidação foi aberto.');
        window.open(r.ultimo_pagamento.recibo_url, '_blank', 'noopener,noreferrer');
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
                  <td class="right">${taxaIvaItem(it) ?? '—'}%</td>
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

  const handleOfficialPdf = (venda: any) => {
    documentService.vendaPdf(venda.id).catch((err) => {
      toast.error(err?.message || 'Erro ao abrir o PDF oficial.');
    });
  };

  const handlePrintThermal = (venda: any) => {
    if (!venda?.id) {
      toast.error('Venda não encontrada para impressão.');
      return;
    }
    documentService.imprimirReciboVenda(venda.id).catch((err) => {
      toast.error(err?.message || 'Erro ao gerar recibo térmico no backend.');
    });
  };

  const handleDownloadThermal = (venda: any) => {
    if (!venda?.id) {
      toast.error('Venda não encontrada.');
      return;
    }
    documentService.vendaRecibo(venda.id).catch((err) => {
      toast.error(err?.message || 'Erro ao descarregar recibo do backend.');
    });
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
        id: 'origem',
        header: 'Origem',
        cell: (info) => {
          const row = info.row.original;
          if (row.pedido_id) {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/20 px-2 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/30">
                Pedido #PED-{row.pedido_id}
              </span>
            );
          }
          if (row.evento_id) {
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900/30">
                Evento #{row.evento_id}
              </span>
            );
          }
          return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-150 dark:border-gray-700/50">
              Venda Direta / POS
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
                onClick={() => handlePrintThermal(venda)} 
                className="p-1.5 text-gray-500 hover:text-emerald-600 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                title="Imprimir Recibo Térmico (80mm)"
              >
                <Printer size={15} />
              </button>
              <button 
                onClick={() => handleOfficialPdf(venda)} 
                className="p-1.5 text-gray-500 hover:text-blue-500 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                title="Fatura A4 (PDF)"
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
      cell: ({ row }) => {
        const item = row.original;
        const resolvedName = item.produto_nome || item.nome || item.descricao || productsMap[item.produto_id || item.item_id]?.nome || `Produto #${item.produto_id || item.item_id || 'Desconhecido'}`;
        return <span className="font-semibold text-gray-900 dark:text-gray-100">{resolvedName}</span>;
      }
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
      cell: ({ row }) => <div className="text-right font-mono text-gray-500">{taxaIvaItem(row.original) ?? '—'}%</div>
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
  ], [productsMap]);

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

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-2 text-sm font-bold">
        <button
          type="button"
          onClick={() => { setActiveTab('fiscal'); setPaginationState(p => ({ ...p, pageIndex: 0 })); }}
          className={cn(
            "pb-3 px-4 border-b-2 flex items-center gap-2 transition-all",
            activeTab === 'fiscal'
              ? "border-primary text-primary font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          )}
        >
          <FileText size={16} />
          <span>Vendas & Documentos Fiscais (FT / FR / NC)</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('proforma'); setPaginationState(p => ({ ...p, pageIndex: 0 })); }}
          className={cn(
            "pb-3 px-4 border-b-2 flex items-center gap-2 transition-all",
            activeTab === 'proforma'
              ? "border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          )}
        >
          <FileText size={16} className="text-amber-500" />
          <span>Faturas Pró-Forma / Orçamentos (Não Fiscal)</span>
        </button>
      </div>

      {activeTab === 'fiscal' ? (
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
                <option value="Parcialmente Pago">Liquidação Parcial</option>
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
      ) : (
        <DataTable
          data={proformasRaw}
          columns={proformaColumns}
          isLoading={isLoadingProformas}
          searchPlaceholder="Pesquisar pró-formas por número ou cliente..."
          onClearFilters={clearFilters}
          manualPagination={true}
          pageCount={proformaPaginationInfo.pages || 1}
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
                <option value="Emitida">Emitida</option>
                <option value="Faturada">Faturada</option>
                <option value="Cancelada">Cancelada</option>
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
      )}

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
                onClick={() => handlePrintThermal(selectedVenda)} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <Printer size={14} /> Recibo Térmico (80mm)
              </button>
              <button
                onClick={() => handleDownloadThermal(selectedVenda)}
                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <Download size={14} /> Baixar Recibo
              </button>
              <button
                onClick={() => handleOfficialPdf(selectedVenda)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <FileText size={14} /> Fatura A4
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
                <div className="text-xs text-gray-500 mt-1.5 font-mono flex flex-col gap-0.5">
                  <div>Série: {selectedVenda.serie_documental || 'SERIE-2026'}</div>
                  {selectedVenda.pedido_id && (
                    <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                      Oriunda do Pedido #PED-{selectedVenda.pedido_id}
                    </div>
                  )}
                  {selectedVenda.evento_id && (
                    <div className="text-[11px] text-purple-600 dark:text-purple-400 font-bold mt-1">
                      Oriunda do Evento #{selectedVenda.evento_id}
                    </div>
                  )}
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
                {resumoIva(selectedVenda).map(({ taxa, valor }) => (
                  <div key={taxa} className="flex justify-between text-gray-500 font-bold">
                    <span>IVA {taxa}%:</span>
                    <span className="font-mono">{formatCurrency(valor)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-gray-500 font-bold">
                  <span>Total IVA:</span>
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

            {payMethod !== 'Dinheiro' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Código / Comprovativo <span className="text-error">*</span></label>
                  <input
                    type="text"
                    value={payCode}
                    onChange={(e) => setPayCode(e.target.value)}
                    placeholder="Ex: TRX123456"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Emissor / Titular <span className="text-error">*</span></label>
                  <input
                    type="text"
                    value={payEmitter}
                    onChange={(e) => setPayEmitter(e.target.value)}
                    placeholder="Ex: Cliente ou banco emissor"
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}

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

      {/* Item Details Modal */}
      <Modal
        isOpen={!!viewItemDetails}
        onClose={() => setViewItemDetails(null)}
        title="Detalhes do Item da Fatura"
        footer={
          <button 
            type="button" 
            onClick={() => setViewItemDetails(null)} 
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold transition-all"
          >
            Fechar Detalhes
          </button>
        }
      >
        {viewItemDetails && (
          <div className="space-y-5 text-sm">
            <div className="p-4 bg-gray-50 dark:bg-gray-900/40 border border-gray-150 dark:border-gray-800 rounded-xl">
              <div className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">
                Nome do Produto / Descrição
              </div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white leading-snug">
                {viewItemDetails.produto_nome || viewItemDetails.nome || viewItemDetails.descricao || productsMap[viewItemDetails.produto_id || viewItemDetails.item_id]?.nome || `Produto #${viewItemDetails.produto_id || viewItemDetails.item_id || 'Desconhecido'}`}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-gray-100 dark:border-gray-800/60 rounded-xl bg-white dark:bg-surface-dark/40">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Quantidade</div>
                <div className="text-sm font-black text-gray-800 dark:text-gray-200 mt-1 font-mono">
                  {viewItemDetails.quantidade} {viewItemDetails.unidade || "un"}
                </div>
              </div>
              <div className="p-3 border border-gray-100 dark:border-gray-800/60 rounded-xl bg-white dark:bg-surface-dark/40">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Preço Unitário</div>
                <div className="text-sm font-black text-gray-800 dark:text-gray-200 mt-1 font-mono">
                  {formatCurrency(viewItemDetails.preco_unitario)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border border-gray-100 dark:border-gray-800/60 rounded-xl bg-white dark:bg-surface-dark/40">
                <div className="text-[10px] font-bold text-gray-400 uppercase">Imposto (IVA)</div>
                <div className="text-sm font-black text-gray-800 dark:text-gray-200 mt-1 font-mono">
                  {taxaIvaItem(viewItemDetails) ?? '—'}%
                </div>
              </div>
              <div className="p-3 border border-gray-100 dark:border-gray-800/60 rounded-xl bg-indigo-50/20 dark:bg-indigo-950/10 border-indigo-100/50 dark:border-indigo-900/30">
                <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">Total Líquido</div>
                <div className="text-sm font-black text-indigo-700 dark:text-indigo-300 mt-1 font-mono">
                  {formatCurrency(viewItemDetails.total)}
                </div>
              </div>
            </div>

            <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/40 dark:border-indigo-900/20 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-300 uppercase tracking-wider">
                Fluxo de Rastreabilidade Comercial:
              </h4>
              <p className="text-[11px] text-indigo-900/80 dark:text-indigo-300/80 leading-relaxed">
                Este item faz parte da venda faturada. Na nova arquitetura integrada do SIGI, se este produto for um artigo transformado (Cozinha/Pastelaria/Bar), o seu início de produção gerou automaticamente uma <strong>Requisição de Material ao Armazém</strong>, garantindo o abatimento rigoroso dos stocks apenas na entrega física dos ingredientes.
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Proforma Detail Modal */}
      <Modal
        isOpen={isProformaDetailOpen}
        onClose={() => setIsProformaDetailOpen(false)}
        title={selectedProforma ? `Pró-Forma: ${selectedProforma.numero_documento || `#${selectedProforma.id}`}` : 'Detalhes da Pró-Forma'}
        maxWidth="max-w-3xl"
        footer={
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {selectedProforma?.estado === 'Emitida' && (
                <button
                  type="button"
                  onClick={() => { setIsProformaDetailOpen(false); handleFaturarProforma(selectedProforma); }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={14} /> Converter em Fatura (FT)
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => proformaService.openRecibo(selectedProforma.id)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <Printer size={14} /> Recibo Térmico (80mm)
              </button>
              <button
                type="button"
                onClick={() => proformaService.openPdf(selectedProforma.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
              >
                <FileText size={14} /> Fatura A4 (PDF)
              </button>
              <button
                type="button"
                onClick={() => setIsProformaDetailOpen(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold"
              >
                Fechar
              </button>
            </div>
          </div>
        }
      >
        {selectedProforma && (
          <div className="space-y-4 text-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-gray-400 font-medium block">Nº Documento</span>
                <span className="font-bold text-gray-900 dark:text-white font-mono">{selectedProforma.numero_documento || `#${selectedProforma.id}`}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Cliente</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {clients.find((c: any) => String(c.id) === String(selectedProforma.cliente_id))?.nome || 'Consumidor Final'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Origem</span>
                <span className="font-bold text-gray-900 dark:text-white uppercase">{selectedProforma.origem || 'POS'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Estado</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 uppercase">{selectedProforma.estado || 'Emitida'}</span>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 dark:bg-gray-800 font-bold text-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="p-2.5">Descrição</th>
                    <th className="p-2.5 text-right">Qtd</th>
                    <th className="p-2.5 text-right">Preço Unit.</th>
                    <th className="p-2.5 text-right">Desconto</th>
                    <th className="p-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(selectedProforma.itens || []).map((item: any, idx: number) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-semibold text-gray-900 dark:text-gray-100">{item.descricao || item.nome}</td>
                      <td className="p-2.5 text-right font-mono">{item.quantidade}</td>
                      <td className="p-2.5 text-right font-mono">{formatCurrency(Number(item.preco_unitario || 0))}</td>
                      <td className="p-2.5 text-right font-mono text-red-500">{formatCurrency(Number(item.desconto || 0))}</td>
                      <td className="p-2.5 text-right font-bold text-gray-900 dark:text-white font-mono">{formatCurrency(Number(item.subtotal || (item.quantidade * item.preco_unitario - item.desconto)))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 text-right">
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Subtotal: <span className="font-mono font-semibold">{formatCurrency(Number(selectedProforma.subtotal || selectedProforma.total))}</span></div>
                <div className="text-base font-extrabold text-primary">Total Orçamento: <span className="font-mono">{formatCurrency(Number(selectedProforma.total))}</span></div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Proforma Send Modal */}
      <Modal
        isOpen={isSendProformaOpen}
        onClose={() => setIsSendProformaOpen(false)}
        title="Enviar Fatura Pró-Forma"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSendProformaOpen(false)}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="send-proforma-form"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Send size={14} /> Enviar Pró-Forma
            </button>
          </div>
        }
      >
        <form id="send-proforma-form" onSubmit={handleSendProformaSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Canal de Envio</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="proformaSendMethod"
                  value="email"
                  checked={sendMethod === 'email'}
                  onChange={() => setSendMethod('email')}
                  className="accent-indigo-600"
                />
                Correio Eletrónico (E-mail)
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-xs text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="proformaSendMethod"
                  value="whatsapp"
                  checked={sendMethod === 'whatsapp'}
                  onChange={() => setSendMethod('whatsapp')}
                  className="accent-indigo-600"
                />
                WhatsApp Directo (Telemóvel)
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
              {sendMethod === 'email' ? 'Endereço de E-mail' : 'Número de Telemóvel / WhatsApp'} *
            </label>
            <input
              type={sendMethod === 'email' ? 'email' : 'text'}
              required
              placeholder={sendMethod === 'email' ? 'exemplo@cliente.com' : '+244 9XX XXX XXX'}
              value={sendContact}
              onChange={(e) => setSendContact(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
        </form>
      </Modal>

    </div>
  );
}

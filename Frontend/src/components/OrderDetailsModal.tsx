import React, { useState } from 'react';
import {
  X,
  CheckCircle,
  Clock,
  Play,
  FileText,
  Gift,
  CreditCard,
  ChevronRight,
  User,
  Truck,
  History,
  Printer,
  ChefHat,
  Utensils,
  Cake,
  Wine,
  CheckCheck,
  AlertCircle,
  Package
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService, productService, documentService, productionService } from '../services';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import PedidoCheckoutForm from './PedidoCheckoutForm';

interface OrderDetailsModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: string, justificativa?: string) => void;
}

export default function OrderDetailsModal({ order, isOpen, onClose, onUpdateStatus }: OrderDetailsModalProps) {
  const queryClient = useQueryClient();
  const { data: clientsResponse } = useQuery({ 
    queryKey: ["clients"], 
    queryFn: () => clientService.getAll({ per_page: 5000 }) 
  });
  const { data: productsResponse } = useQuery({ 
    queryKey: ["products-comerciais"], 
    queryFn: () => productService.getProdutosComerciais({ per_page: 5000 }) 
  });

  const clients = clientsResponse?.items || [];
  const products = productsResponse?.items || [];

  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  const orderId = order?.id;

  // Consulta das Ordens de Produção vinculadas a este Pedido Comercial
  const { data: productionOrdersResponse } = useQuery({
    queryKey: ['order-production-orders', orderId],
    queryFn: () => productionService.getAll({ pedido_id: orderId, per_page: 50 }).catch(() => ({ items: [] })),
    enabled: Boolean(orderId),
    refetchInterval: 8000
  });

  const relatedProductionOrders = (productionOrdersResponse?.items || []).filter(
    (o: any) => String(o.pedido_id) === String(orderId) || String(o.pedido?.id) === String(orderId)
  );

  const updateProdStatusMutation = useMutation({
    mutationFn: ({ id, estado }: { id: string | number; estado: string }) =>
      productionService.updateEstado(id, estado),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['order-production-orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['production-orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pedidos'] });
      toast.success(`Comanda de Produção atualizada para: ${variables.estado}`);
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Erro ao atualizar comanda de produção.');
    }
  });

  if (!isOpen || !order) return null;

  const orderNumber = order.numero || order.id;
  const orderStatus = order.estado || order.status;
  const orderType = order.tipo || order.type;
  const orderTotal = Number(order.total || order.valor_total || 0);
  const orderPaid = Number(order.valor_pago || 0);
  const orderBalance = Math.max(0, Number(order.saldo ?? (orderTotal - orderPaid)));
  const orderItems = order.itens || order.items || [];
  const client = clients?.find((c: any) => String(c.id) === String(order.clientId || order.cliente_id));
  
  const orderSteps = [
    { status: 'Agendado', value: 'Agendado', icon: FileText },
    { status: 'Confirmado', value: 'Confirmado', icon: CreditCard },
    { status: 'Em Produção', value: 'Em Producao', icon: Play },
    { status: 'Pronto', value: 'Pronto', icon: Gift },
    { status: 'Entregue', value: 'Entregue', icon: CheckCircle },
    { status: 'Concluído', value: 'Concluido', icon: CheckCircle },
  ];

  // If status is Cancelado, handle it separately.
  const isCanceled = orderStatus === 'Cancelado';
  let currentIndex = isCanceled
    ? -1
    : orderSteps.findIndex((s) => s.status === orderStatus || s.value === orderStatus);
  
  // Map older statuses to new ones if necessary
  if (!isCanceled && currentIndex === -1) {
      if(orderStatus === 'Pendente') currentIndex = 0;
      else if(orderStatus === 'Pago') currentIndex = 1;
      else currentIndex = orderSteps.length - 1; 
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col h-full max-h-[95vh] sm:h-auto sm:max-h-[90vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Pedido #{String(orderNumber).toUpperCase()}
              {isCanceled && (
                  <span className="bg-error/10 text-error text-xs px-2 py-1 rounded-full uppercase tracking-wider">Cancelado</span>
              )}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{client ? client.nome : 'Cliente ao Balcão'}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
          
          {/* Timeline */}
          {!isCanceled && (
            <div className="bg-gray-50 dark:bg-gray-800/10 p-4 sm:p-6 rounded-xl border border-gray-100 dark:border-gray-800 hidden sm:block">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-wider">Estado da Operação</h3>
              <div className="relative pt-2">
                <div className="absolute left-0 top-1/2 -mt-px w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
                <div className="relative flex justify-between">
                  {orderSteps.map((step, idx) => {
                    const isCompleted = currentIndex >= idx;
                    return (
                      <div key={idx} className="flex flex-col items-center gap-2 z-10 w-20">
                        <div 
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300",
                            isCompleted ? "bg-primary border-white dark:border-surface-dark text-white shadow-lg shadow-primary/30" : "bg-white dark:bg-surface-dark border-gray-200 dark:border-gray-700 text-gray-400"
                          )}
                        >
                          <step.icon size={16} />
                        </div>
                        <span className={cn("text-xs font-semibold text-center leading-tight transition-colors duration-300", isCompleted ? "text-primary" : "text-gray-400")}>
                          {step.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Progress bar fill */}
                <div 
                  className="absolute left-0 top-1/2 -mt-px h-1 bg-primary rounded-full transition-all duration-500" 
                  style={{ width: `${currentIndex > 0 ? (currentIndex / (orderSteps.length - 1)) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Grid Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            
            {/* Cliente */}
            <div className="bg-white dark:bg-gray-800/20 p-5 rounded-xl border border-gray-200 dark:border-gray-800">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><User size={16} className="text-primary"/> Dados do Cliente</h4>
              {client ? (
                <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <p><span className="font-semibold text-gray-900 dark:text-gray-200">Nome:</span> {client.nome}</p>
                  <p><span className="font-semibold text-gray-900 dark:text-gray-200">Contacto:</span> {client.telefone}</p>
                  <p><span className="font-semibold text-gray-900 dark:text-gray-200">Endereço:</span> {client.morada || 'Não informado'}</p>
                  <p><span className="font-semibold text-gray-900 dark:text-gray-200">Observações:</span> {client.observacoes || 'Nenhuma'}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Cliente ao Balcão</p>
              )}
            </div>

            {/* Pedido */}
            <div className="bg-white dark:bg-gray-800/20 p-5 rounded-xl border border-gray-200 dark:border-gray-800">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><FileText size={16} className="text-primary"/> Dados do Pedido</h4>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <p><span className="font-semibold text-gray-900 dark:text-gray-200">Tipo:</span> {orderType}</p>
                <p><span className="font-semibold text-gray-900 dark:text-gray-200">Entrega Prevista:</span> {new Date(order.dueDate || order.data_entrega || order.data_pedido).toLocaleString('pt-ST')}</p>
                <p><span className="font-semibold text-gray-900 dark:text-gray-200">Estado Local:</span> <span className="font-bold text-primary">{orderStatus}</span></p>
              </div>
            </div>

            {/* Pagamentos */}
            <div className="bg-white dark:bg-gray-800/20 p-5 rounded-xl border border-gray-200 dark:border-gray-800">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><CreditCard size={16} className="text-primary"/> Pagamentos</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Valor Total:</span>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{formatCurrency(orderTotal)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-semibold text-gray-600 dark:text-gray-400">Valor Pago:</span>
                  <span className="font-bold text-success">{formatCurrency(orderPaid)}</span>
                </div>
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm text-gray-500">
                  <span>Saldo Pendente:</span>
                  <span className={cn("font-bold", orderBalance > 0 ? "text-error" : "text-gray-900 dark:text-white")}>
                    {formatCurrency(orderBalance)}
                  </span>
                </div>

                {orderBalance > 0 && !showCheckoutForm && (
                  <button
                    onClick={() => setShowCheckoutForm(true)}
                    className="w-full mt-4 bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex justify-center items-center gap-2"
                  >
                    Registar Liquidação de Saldo
                  </button>
                )}

                {showCheckoutForm && (
                  <div className="mt-4">
                    <PedidoCheckoutForm
                      orderId={order?.id || order?.numero}
                      defaultAmount={orderBalance}
                      onCancel={() => setShowCheckoutForm(false)}
                      onSuccess={() => {
                        setShowCheckoutForm(false);
                        onClose();
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Transporte (Conditional) */}
            {orderType === 'Composto' && (
              <div className="bg-white dark:bg-gray-800/20 p-5 rounded-xl border border-gray-200 dark:border-gray-800">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Truck size={16} className="text-primary"/> Transporte / Logística</h4>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <p><span className="font-semibold text-gray-900 dark:text-gray-200">Viatura:</span> Viatura Principal (Matrícula LD-00-XX)</p>
                  <p><span className="font-semibold text-gray-900 dark:text-gray-200">Motorista:</span> João Silva</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
             {/* Itens do Pedido */}
             <div className="bg-white dark:bg-gray-800/20 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col">
               <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 rounded-t-xl">
                 <h4 className="text-sm font-bold text-gray-900 dark:text-white">Itens (Cozinha e Pastelaria)</h4>
               </div>
               <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[300px] space-y-3">
                 {orderItems?.map((item: any, idx: number) => {
                   const prod: any = products?.find((p: any) => String(p.id) === String(item.productId || item.produto_id));
                   const quantidade = Number(item.quantity || item.quantidade || 0);
                   return (
                     <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                       <div className="flex flex-col">
                         <span className="text-sm font-bold text-gray-900 dark:text-white">{quantidade}x {item.descricao || (prod ? prod.nome : `Produto (${item.productId || item.produto_id})`)}</span>
                         {prod && <span className="text-xs text-gray-500">{prod.categoria}</span>}
                       </div>
                       <span className="font-semibold text-sm text-primary">{formatCurrency(Number(item.subtotal || item.preco_unitario || prod?.preco_venda_com_iva || prod?.preco_venda || 0) * (item.subtotal ? 1 : quantidade))}</span>
                     </div>
                   );
                 })}
               </div>
             </div>

             {/* Ordens de Produção Fabril Vinculadas (Cozinha, Pastelaria e Bar) */}
             <div className="bg-white dark:bg-gray-800/20 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col">
               <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 rounded-t-xl flex items-center justify-between">
                 <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                   <ChefHat size={16} className="text-primary" />
                   Ordens de Produção ({relatedProductionOrders.length})
                 </h4>
                 <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                   Bancadas & KDS
                 </span>
               </div>
               <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[300px] space-y-3">
                 {relatedProductionOrders.length === 0 ? (
                   <div className="py-6 text-center text-gray-400 text-xs italic">
                     Nenhuma comanda operacional separada para este pedido ou itens de balcão direto.
                   </div>
                 ) : (
                   relatedProductionOrders.map((ord: any) => {
                     const sector = ord.sector || ord.setor || 'Cozinha';
                     const sectorIcon =
                       sector === 'Pastelaria' ? (
                         <Cake size={14} className="text-pink-600 dark:text-pink-400" />
                       ) : sector === 'Bar' ? (
                         <Wine size={14} className="text-purple-600 dark:text-purple-400" />
                       ) : (
                         <Utensils size={14} className="text-amber-600 dark:text-amber-400" />
                       );

                     const rawEst = String(ord.estado || ord.status || '').trim();
                     const isPendente = rawEst.toLowerCase().includes('pendente');
                     const isEmProducao = rawEst.toLowerCase().includes('producao') || rawEst.toLowerCase().includes('preparacao');
                     const isPronto = rawEst.toLowerCase().includes('pronto');
                     const isEntregue = rawEst.toLowerCase().includes('entregue') || rawEst.toLowerCase().includes('concluido');

                     const badgeColor = isPronto
                       ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                       : isEmProducao
                       ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                       : isEntregue
                       ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                       : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

                     return (
                       <div
                         key={ord.id}
                         className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-150 dark:border-gray-800 flex items-center justify-between gap-3 text-xs"
                       >
                         <div className="flex items-center gap-2.5 min-w-0">
                           <div className="p-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                             {sectorIcon}
                           </div>
                           <div className="min-w-0">
                             <div className="font-bold text-gray-900 dark:text-white truncate">
                               {ord.numero || `OP-${sector.slice(0, 3).toUpperCase()}-${ord.id}`}
                             </div>
                             <div className="text-[11px] text-gray-500 dark:text-gray-400">
                               Setor: <strong className="text-gray-700 dark:text-gray-300">{sector}</strong>
                               {ord.hora_inicio ? ` · Início: ${new Date(ord.hora_inicio).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}` : ''}
                             </div>
                           </div>
                         </div>

                         <div className="flex items-center gap-2 shrink-0">
                           <span className={cn('px-2.5 py-1 rounded-md font-bold text-[11px]', badgeColor)}>
                             {isEmProducao ? 'Em Preparação' : ord.estado || 'Pendente'}
                           </span>

                           {/* Botão rápido para avançar estado */}
                           {isPendente && (
                             <button
                               type="button"
                               disabled={updateProdStatusMutation.isPending}
                               onClick={() => updateProdStatusMutation.mutate({ id: ord.id, estado: 'Em Producao' })}
                               className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-[10px] font-bold transition-colors"
                               title="Iniciar Preparação no KDS"
                             >
                               Iniciar
                             </button>
                           )}
                           {isEmProducao && (
                             <button
                               type="button"
                               disabled={updateProdStatusMutation.isPending}
                               onClick={() => updateProdStatusMutation.mutate({ id: ord.id, estado: 'Pronto' })}
                               className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold transition-colors"
                               title="Marcar Comanda como Pronta"
                             >
                               Concluir
                             </button>
                           )}
                         </div>
                       </div>
                     );
                   })
                 )}

                 {/* Se houver materiais ou alugueres reais cadastrados no pedido */}
                 {Array.isArray(order?.materiais) && order.materiais.length > 0 && (
                   <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-1">
                     <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                       Materiais Alugados / Fornecidos
                     </span>
                     {order.materiais.map((m: any, mIdx: number) => (
                       <div key={mIdx} className="flex justify-between items-center text-xs text-gray-700 dark:text-gray-300">
                         <span>{m.quantidade || 1}x {m.nome || m.descricao}</span>
                         <span className="font-semibold text-primary">{formatCurrency(m.valor || 0)}</span>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
             </div>
          </div>

          {/* Histórico Simples */}
          <div className="bg-white dark:bg-gray-800/20 p-5 rounded-xl border border-gray-200 dark:border-gray-800">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><History size={16} className="text-primary"/> Observações do Pedido</h4>
             <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
               {order.observacoes || order.notes || 'Sem observações adicionais.'}
             </p>
          </div>

        </div>

        {/* Footer actions - Mobile friendly large buttons */}
        <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark flex flex-col-reverse sm:flex-row gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-4 sm:py-3 text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Fechar Janela
          </button>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto">
             <button
               type="button"
               onClick={() => documentService.pedidoPdf(orderId).catch((err) => toast.error(err?.message || 'Erro ao gerar PDF do pedido.'))}
               className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors flex justify-center items-center gap-1.5"
             >
               <FileText size={16} /> Fatura/PDF Pedido
             </button>
             <button
               type="button"
               onClick={() => documentService.imprimirReciboPedido(orderId).catch((err) => toast.error(err?.message || 'Erro ao imprimir recibo térmico.'))}
               className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 rounded-xl transition-colors flex justify-center items-center gap-1.5"
             >
               <Printer size={16} /> Recibo Térmico (80mm)
             </button>
             <button
               type="button"
               onClick={() => documentService.pedidoRecibo(orderId).catch((err) => toast.error(err?.message || 'Erro ao gerar recibo do pedido.'))}
               className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors flex justify-center items-center gap-1.5"
             >
               <CreditCard size={16} /> Baixar Recibo PDF
             </button>
             {!isCanceled && (
                 <button 
                 onClick={() => {
                   Swal.fire({
                     title: 'Cancelar Pedido?',
                     text: 'Por favor, indique a justificativa do cancelamento:',
                     input: 'textarea',
                     inputPlaceholder: 'Motivo do cancelamento...',
                     icon: 'warning',
                     showCancelButton: true,
                     confirmButtonColor: '#C62828',
                     cancelButtonColor: '#6B7280',
                     confirmButtonText: 'Sim, cancelar pedido',
                     cancelButtonText: 'Voltar',
                     inputValidator: (value) => {
                       if (!value || !value.trim()) {
                         return 'A justificativa de cancelamento é obrigatória!';
                       }
                     }
                   }).then((result) => {
                     if (result.isConfirmed && result.value) {
                       onUpdateStatus(order.id, 'Cancelado', result.value.trim());
                       onClose();
                     }
                   });
                 }}
                 className="w-full sm:w-auto px-6 py-4 sm:py-3 text-sm font-bold text-error bg-error/10 hover:bg-error/20 rounded-xl transition-colors"
               >
                 Cancelar Pedido
               </button>
             )}
             
             {!isCanceled && currentIndex < orderSteps.length - 1 && (
               <button 
                 onClick={() => {
                   onUpdateStatus(order.id, orderSteps[currentIndex + 1].value);
                   onClose();
                 }}
                 className="w-full sm:w-auto px-6 py-4 sm:py-3 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-xl shadow-xl shadow-primary/20 transition-colors flex justify-center items-center gap-2"
               >
                 MARCAR COMO {orderSteps[currentIndex + 1].status.toUpperCase()} <ChevronRight size={18}/>
               </button>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}

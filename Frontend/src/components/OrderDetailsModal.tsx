import React, { useState } from 'react';
import { X, CheckCircle, Clock, Play, FileText, Gift, CreditCard, ChevronRight, User, Truck, History } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, clientService, productService, documentService } from '../services';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

interface OrderDetailsModalProps {
  order: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: string) => void;
}

export default function OrderDetailsModal({ order, isOpen, onClose, onUpdateStatus }: OrderDetailsModalProps) {
  const queryClient = useQueryClient();
  const { data: clientsResponse } = useQuery({ 
    queryKey: ["clients"], 
    queryFn: () => clientService.getAll({ per_page: 5000 }) 
  });
  const { data: productsResponse } = useQuery({ 
    queryKey: ["products"], 
    queryFn: () => productService.getAll({ per_page: 5000 }) 
  });

  const clients = clientsResponse?.items || [];
  const products = productsResponse?.items || [];

  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [checkoutMetodo, setCheckoutMetodo] = useState('Dinheiro');
  const [checkoutValor, setCheckoutValor] = useState('');
  const [checkoutCodigo, setCheckoutCodigo] = useState('');
  const [checkoutEmissor, setCheckoutEmissor] = useState('');
  const [checkoutObs, setCheckoutObs] = useState('Liquidação do valor restante no levantamento do bolo.');

  const checkoutMutation = useMutation({
    mutationFn: (payload: any) => orderService.checkoutPedido(order?.id || order?.numero, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders-cal"] });
      queryClient.invalidateQueries({ queryKey: ["caixas"] });
      toast.success("Saldo liquidado com sucesso!");
      setShowCheckoutForm(false);
      onClose();
    },
    onError: () => {
      toast.error("Erro ao liquidar o saldo.");
    }
  });

  if (!isOpen || !order) return null;

  const orderId = order.id;
  const orderNumber = order.numero || order.id;
  const orderStatus = order.estado || order.status;
  const orderType = order.tipo || order.type;
  const orderTotal = Number(order.total || order.valor_total || 0);
  const orderPaid = Number(order.valor_pago || 0);
  const orderBalance = Math.max(0, Number(order.saldo ?? (orderTotal - orderPaid)));
  const orderItems = order.itens || order.items || [];
  const client = clients?.find((c: any) => String(c.id) === String(order.clientId || order.cliente_id));
  
  const orderSteps = [
    { status: 'Agendado', icon: FileText },
    { status: 'Confirmado', icon: CreditCard },
    { status: 'Em Produção', icon: Play },
    { status: 'Pronto', icon: Gift },
    { status: 'Entregue', icon: CheckCircle },
    { status: 'Concluído', icon: CheckCircle },
  ];

  // If status is Cancelado, handle it separately.
  const isCanceled = orderStatus === 'Cancelado';
  let currentIndex = isCanceled ? -1 : orderSteps.findIndex(s => s.status === orderStatus);
  
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
                    onClick={() => {
                      setCheckoutValor(String(orderBalance));
                      setShowCheckoutForm(true);
                    }}
                    className="w-full mt-4 bg-primary hover:bg-primary-hover text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex justify-center items-center gap-2"
                  >
                    Registar Liquidação de Saldo
                  </button>
                )}

                {showCheckoutForm && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-850 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
                    <h5 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Checkout de Saldo</h5>
                    
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Método de Pagamento</label>
                      <select
                        value={checkoutMetodo}
                        onChange={(e) => setCheckoutMetodo(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-100"
                      >
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="TPA / POS">TPA / POS</option>
                        <option value="Transferência">Transferência</option>
                      </select>
                    </div>

                    {(checkoutMetodo === 'Transferência' || checkoutMetodo === 'TPA / POS') && (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Comprovativo / Código TRX *</label>
                          <input
                            type="text"
                            value={checkoutCodigo}
                            onChange={(e) => setCheckoutCodigo(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-100 font-medium"
                            placeholder="Ex: TRX123456"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Emissor / Titular Banco *</label>
                          <input
                            type="text"
                            value={checkoutEmissor}
                            onChange={(e) => setCheckoutEmissor(e.target.value)}
                            className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-gray-800 dark:text-gray-100 font-medium"
                            placeholder="Ex: Manuel Silva (Millennium)"
                            required
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Valor a Cobrar (STD) *</label>
                      <input
                        type="number"
                        step="0.01"
                        max={orderBalance}
                        value={checkoutValor}
                        onChange={(e) => setCheckoutValor(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 font-bold text-gray-800 dark:text-gray-100"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Observações / Notas</label>
                      <textarea
                        value={checkoutObs}
                        onChange={(e) => setCheckoutObs(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 h-16 text-gray-800 dark:text-gray-100"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCheckoutForm(false)}
                        className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        disabled={checkoutMutation.isPending}
                        onClick={() => {
                          if ((checkoutMetodo === 'Transferência' || checkoutMetodo === 'TPA / POS') && (!checkoutCodigo.trim() || !checkoutEmissor.trim())) {
                            toast.error("Preencha todos os campos obrigatórios.");
                            return;
                          }
                          const val = parseFloat(checkoutValor);
                          if (isNaN(val) || val <= 0) {
                            toast.error("Introduza um valor válido.");
                            return;
                          }
                          checkoutMutation.mutate({
                            forma_pagamento_id: checkoutMetodo === 'Transferência' ? 2 : (checkoutMetodo === 'TPA / POS' ? 3 : 1),
                            valor: val,
                            codigo_transferencia: (checkoutMetodo === 'Transferência' || checkoutMetodo === 'TPA / POS') ? checkoutCodigo : null,
                            emissor: (checkoutMetodo === 'Transferência' || checkoutMetodo === 'TPA / POS') ? checkoutEmissor : null,
                            observacoes: checkoutObs
                          });
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-success hover:bg-success/90 rounded-lg"
                      >
                        {checkoutMutation.isPending ? "A processar..." : "Confirmar"}
                      </button>
                    </div>
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
                   const prod = products?.find((p: any) => String(p.id) === String(item.productId || item.produto_id));
                   const quantidade = Number(item.quantity || item.quantidade || 0);
                   return (
                     <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                       <div className="flex flex-col">
                         <span className="text-sm font-bold text-gray-900 dark:text-white">{quantidade}x {item.descricao || (prod ? prod.nome : `Produto (${item.productId || item.produto_id})`)}</span>
                         {prod && <span className="text-xs text-gray-500">{prod.categoria}</span>}
                       </div>
                       <span className="font-semibold text-sm text-primary">{formatCurrency(Number(item.subtotal || item.preco_unitario || prod?.preco_venda || 0) * (item.subtotal ? 1 : quantidade))}</span>
                     </div>
                   );
                 })}
               </div>
             </div>

             {/* Alugueres */}
             {orderType === 'Composto' && (
                <div className="bg-white dark:bg-gray-800/20 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col">
                  <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 rounded-t-xl">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Aluguer de Materiais</h4>
                  </div>
                  <div className="p-4 sm:p-5 flex-1 overflow-y-auto max-h-[300px] space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">20x Cadeiras Tiffani</span>
                        <span className="font-semibold text-sm text-primary">{formatCurrency(40000)}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">5x Mesas Redondas</span>
                        <span className="font-semibold text-sm text-primary">{formatCurrency(25000)}</span>
                      </div>
                  </div>
                </div>
             )}
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
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
             <button
               type="button"
               onClick={() => documentService.pedidoPdf(orderId).catch((err) => toast.error(err?.message || 'Erro ao gerar PDF do pedido.'))}
               className="w-full sm:w-auto px-6 py-4 sm:py-3 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors flex justify-center items-center gap-2"
             >
               <FileText size={18} /> PDF Pedido
             </button>
             <button
               type="button"
               onClick={() => documentService.pedidoRecibo(orderId).catch((err) => toast.error(err?.message || 'Erro ao gerar recibo do pedido.'))}
               className="w-full sm:w-auto px-6 py-4 sm:py-3 text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/30 rounded-xl transition-colors flex justify-center items-center gap-2"
             >
               <CreditCard size={18} /> Recibo
             </button>
             {!isCanceled && (
                 <button 
                 onClick={() => {
                   Swal.fire({
                     title: 'Cancelar Pedido?',
                     text: 'Esta ação não pode ser revertida.',
                     icon: 'warning',
                     showCancelButton: true,
                     confirmButtonColor: '#C62828',
                     confirmButtonText: 'Sim, cancelar'
                   }).then((result) => {
                     if (result.isConfirmed) {
                       onUpdateStatus(order.id, 'Cancelado');
                       onClose();
                     }
                   })
                 }}
                 className="w-full sm:w-auto px-6 py-4 sm:py-3 text-sm font-bold text-error bg-error/10 hover:bg-error/20 rounded-xl transition-colors"
               >
                 Cancelar Pedido
               </button>
             )}
             
             {!isCanceled && currentIndex < orderSteps.length - 1 && (
               <button 
                 onClick={() => {
                   onUpdateStatus(order.id, orderSteps[currentIndex + 1].status);
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

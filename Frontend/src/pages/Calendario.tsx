import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  eventService, 
  orderService, 
  productionService, 
  deliveryService, 
  shiftService, 
  calendarioService, 
  financialService 
} from "../services";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { pt } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Swal from "sweetalert2";
import { Filter, Calendar as CalendarIcon, Plus, CheckCircle2, AlertCircle, RefreshCw, ShoppingBag, Truck, Users } from "lucide-react";
import { formatCurrency, cn } from "../lib/utils";
import { toast } from "react-toastify";

const locales = {
  "pt-BR": pt,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function Calendario() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  
  // Track selected day details (defaults to today's date formatted as YYYY-MM-DD)
  const [selectedDayStr, setSelectedDayStr] = useState(() => format(new Date(), "yyyy-MM-dd"));

  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;

  // Monthly stats
  const { data: statsData } = useQuery({
    queryKey: ["calendario-stats", currentYear, currentMonth],
    queryFn: () => calendarioService.getMesStats(currentYear, currentMonth),
  });

  // Selected day details
  const { data: dayDetails, isLoading: isLoadingDayDetails } = useQuery({
    queryKey: ["calendario-dia", selectedDayStr],
    queryFn: () => calendarioService.getDiaDetalhes(selectedDayStr),
    enabled: !!selectedDayStr,
  });

  // Main operational entities for react-big-calendar mapping
  const { data: eventsResp, isLoading: isLoadingEvents } = useQuery({ queryKey: ["events"], queryFn: () => eventService.getAll({ per_page: 1000 }) });
  const { data: ordersResp, isLoading: isLoadingOrders } = useQuery({ queryKey: ["orders-cal"], queryFn: () => orderService.getAll({ per_page: 1000 }) });
  const { data: productionResp, isLoading: isLoadingProd } = useQuery({ queryKey: ["prod-cal"], queryFn: () => productionService.getAll({ per_page: 1000 }) });
  const { data: deliveriesResp, isLoading: isLoadingDeliv } = useQuery({ queryKey: ["deliv-cal"], queryFn: () => deliveryService.getAll({ per_page: 1000 }) });
  const { data: shiftsResp, isLoading: isLoadingShifts } = useQuery({ queryKey: ["shifts-cal"], queryFn: () => shiftService.getAll({ per_page: 1000 }) });

  // Cash Register State check to allow receiving payments
  const { data: caixasResp } = useQuery({
    queryKey: ["caixas"],
    queryFn: () => financialService.getAll()
  });

  const caixas = caixasResp?.items || caixasResp || [];
  const openCaixa = Array.isArray(caixas) ? caixas.find((c: any) => c.estado === 'Aberto') : null;

  const isLoading = isLoadingEvents || isLoadingOrders || isLoadingProd || isLoadingDeliv || isLoadingShifts;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        A carregar calendário operativo...
      </div>
    );
  }

  const events = eventsResp?.items || [];
  const orders = ordersResp?.items || [];
  const production = productionResp?.items || [];
  const deliveries = deliveriesResp?.items || [];
  const shifts = shiftsResp?.items || [];

  // Helper to map and colorize calendar events
  const calendarEvents = [
    ...events.map((e: any) => ({
      id: `e-${e.id}`,
      title: `EVENTO: ${e.name} @ ${e.location}`,
      start: new Date(e.date + 'T' + (e.startTime || '09:00')),
      end: new Date(e.date + 'T' + (e.endTime || '13:00')),
      color: '#FF6B00', // primary orange
      type: 'EVENTO',
      resource: e
    })),
    ...orders.map((o: any) => ({
      id: `o-${o.id}`,
      title: `PEDIDO: #${o.id} - ${o.type}`,
      start: new Date(o.dueDate || o.data_entrega || o.data_pedido),
      end: new Date(new Date(o.dueDate || o.data_entrega || o.data_pedido).getTime() + 3600000), // 1h duration
      color: '#3B82F6', // blue
      type: 'PEDIDO',
      resource: o
    })),
    ...production.filter((p: any) => p.status === 'Em Produção').map((p: any) => ({
      id: `p-${p.id}`,
      title: `PROD: #${p.id} em curso`,
      start: new Date(p.dueDate || new Date()),
      end: new Date(new Date(p.dueDate || new Date()).getTime() + 7200000), // 2h duration
      color: '#F59E0B', // warning amber
      type: 'PRODUÇÃO',
      resource: p
    })),
    ...deliveries.map((d: any) => ({
      id: `d-${d.id}`,
      title: `ENTREGA: #${d.orderId || d.pedido_id}`,
      start: new Date(d.scheduledDate || d.data_entrega || new Date()),
      end: new Date(new Date(d.scheduledDate || d.data_entrega || new Date()).getTime() + 3600000),
      color: '#10B981', // success green
      type: 'ENTREGA',
      resource: d
    })),
    ...shifts
      .filter((s: any) => s.startTime || s.hora_inicio || s.nome)
      .map((s: any) => {
        const title = s.userRole ? `TURNO: ${s.userRole}` : `Turno: ${s.nome || 'Configurado'}`;
        
        let startDate = new Date();
        if (s.startTime) {
          startDate = new Date(s.startTime);
        } else if (s.hora_inicio) {
          const parts = s.hora_inicio.split(":");
          startDate.setHours(Number(parts[0] || 0), Number(parts[1] || 0), Number(parts[2] || 0), 0);
        }

        let endDate = new Date(startDate.getTime() + 28800000); // 8h default
        if (s.endTime) {
          endDate = new Date(s.endTime);
        } else if (s.hora_fim) {
          const parts = s.hora_fim.split(":");
          endDate = new Date(startDate);
          endDate.setHours(Number(parts[0] || 0), Number(parts[1] || 0), Number(parts[2] || 0), 0);
          if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
          }
        }

        return {
          id: `s-${s.id}`,
          title,
          start: startDate,
          end: endDate,
          color: '#8B5CF6', // purple
          type: 'TURNO',
          resource: s
        };
      })
  ];

  const handleSelectEvent = (event: any) => {
    const raw = event.resource;
    if (event.type === 'EVENTO') {
      Swal.fire({
        title: raw.name,
        html: `
          <div class="text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-2">
             <p><strong>Ação:</strong> ${raw.name}</p>
             <p><strong>Local:</strong> ${raw.location || 'Sem local'}</p>
             <p><strong>Pax:</strong> ${raw.guests || 0}</p>
             <p><strong>Estado:</strong> <span class="px-2 py-0.5 rounded text-xs bg-primary/20 text-primary font-bold">${raw.status}</span></p>
             <hr class="my-2 border-gray-200 dark:border-gray-700"/>
             <p class="text-xs text-gray-500">${raw.notes || "Sem observações adicionais."}</p>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Fechar",
        cancelButtonText: "Ver Agenda",
        confirmButtonColor: "var(--color-primary)"
      });
    } else if (event.type === 'PEDIDO') {
      setSelectedDayStr(format(new Date(event.start), "yyyy-MM-dd"));
      toast.info(`Selecionou o pedido #${raw.id} no painel de dia.`);
    } else {
      Swal.fire({
        title: event.title,
        text: `Agendamento operativo do tipo ${event.type}.`,
        icon: 'info',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleSelectSlot = (slotInfo: any) => {
    const formatted = format(slotInfo.start, "yyyy-MM-dd");
    setSelectedDayStr(formatted);
    toast.info(`Selecionou o dia ${format(slotInfo.start, "dd/MM/yyyy")}`);
  };

  const handleLiquidateBalance = async (order: any) => {
    if (!openCaixa) {
      toast.error('O caixa está fechado! Abra o caixa no ecrã de POS ou Financeiro antes de processar recebimentos.');
      return;
    }

    const valorTotal = Number(order.valor_total || order.total || 0);
    const valorPago = Number(order.valor_pago || 0);
    const balance = Math.max(0, valorTotal - valorPago);

    if (balance <= 0) {
      toast.info('Este pedido já se encontra totalmente pago!');
      return;
    }

    Swal.fire({
      title: `Faturar Restante: Pedido #${order.id}`,
      html: `
        <div class="text-left space-y-3">
          <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex justify-between text-xs">
              <span class="text-gray-500">Valor Total:</span>
              <span class="font-bold">${formatCurrency(valorTotal)}</span>
            </div>
            <div class="flex justify-between text-xs mt-1">
              <span class="text-gray-500">Valor Já Sinalizado:</span>
              <span class="font-bold text-success">${formatCurrency(valorPago)}</span>
            </div>
            <div class="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 font-extrabold text-primary">
              <span>Restante em Falta:</span>
              <span>${formatCurrency(balance)}</span>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Valor a Liquidar (STD)</label>
            <input id="liq-amount" type="number" class="swal2-input w-full m-0" value="${balance}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">Forma de Pagamento</label>
            <select id="liq-method" class="swal2-input w-full m-0 text-sm">
              <option value="Dinheiro">Dinheiro</option>
              <option value="TPA / POS">TPA / POS</option>
              <option value="Transferência">Transferência Bancária</option>
            </select>
          </div>
          <div id="liq-extra-fields" style="display: none;" class="space-y-2">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Código de Transação / TRX *</label>
              <input id="liq-code" type="text" class="swal2-input w-full m-0" placeholder="Ex: TRX123456">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">Emissor / Titular do Banco *</label>
              <input id="liq-emissor" type="text" class="swal2-input w-full m-0" placeholder="Ex: Banco de Poupança">
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Recebimento',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: "var(--color-primary)",
      didOpen: () => {
        const methodSelect = document.getElementById('liq-method') as HTMLSelectElement;
        const extraFields = document.getElementById('liq-extra-fields') as HTMLDivElement;
        methodSelect.addEventListener('change', () => {
          if (methodSelect.value !== 'Dinheiro') {
            extraFields.style.display = 'block';
          } else {
            extraFields.style.display = 'none';
          }
        });
      },
      preConfirm: () => {
        const amount = parseFloat((document.getElementById('liq-amount') as HTMLInputElement).value || '0');
        const method = (document.getElementById('liq-method') as HTMLSelectElement).value;
        const code = (document.getElementById('liq-code') as HTMLInputElement).value;
        const emissor = (document.getElementById('liq-emissor') as HTMLInputElement).value;

        if (amount <= 0) {
          Swal.showValidationMessage('Insira um valor válido para liquidar.');
          return false;
        }
        if (amount > balance) {
          Swal.showValidationMessage(`O valor inserido excede o saldo restante (${formatCurrency(balance)}).`);
          return false;
        }

        if (method !== 'Dinheiro') {
          if (!code.trim()) {
            Swal.showValidationMessage('O Código de Transação / TRX é obrigatório para esta forma de pagamento.');
            return false;
          }
          if (!emissor.trim()) {
            Swal.showValidationMessage('O Emissor / Titular do Banco é obrigatório para esta forma de pagamento.');
            return false;
          }
        }

        return { amount, method, code, emissor };
      }
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          // Trigger checkout/payment balance logic
          await orderService.adicionarPagamento(order.id, {
            forma_pagamento_id: result.value.method === 'Transferência' ? 2 : (result.value.method === 'TPA / POS' ? 3 : 1),
            valor: result.value.amount,
            codigo_transferencia: result.value.method !== 'Dinheiro' ? result.value.code : null,
            emissor: result.value.method !== 'Dinheiro' ? result.value.emissor : null,
            observacoes: `Liquidação de saldo via calendário (${result.value.method})`
          });
          
          toast.success(`Recebido com sucesso: ${formatCurrency(result.value.amount)} via ${result.value.method}`);
          
          queryClient.invalidateQueries({ queryKey: ["orders-cal"] });
          queryClient.invalidateQueries({ queryKey: ["calendario-dia"] });
          queryClient.invalidateQueries({ queryKey: ["calendario-stats"] });
          queryClient.invalidateQueries({ queryKey: ["caixas"] });
        } catch (error) {
          toast.error('Ocorreu um erro ao processar o pagamento.');
        }
      }
    });
  };

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => { toolbar.onNavigate('PREV'); };
    const goToNext = () => { toolbar.onNavigate('NEXT'); };
    const goToCurrent = () => { toolbar.onNavigate('TODAY'); };

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center bg-surface dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark mb-4 shadow-sm gap-4">
          <div className="flex items-center gap-2">
             <CalendarIcon className="text-primary hidden sm:block" size={24} />
             <h2 className="text-xl font-bold tracking-tight capitalize text-gray-900 dark:text-gray-100">
               {toolbar.label}
             </h2>
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button onClick={goToBack} className="px-3 py-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300 transition-colors shadow-sm font-medium">Anterior</button>
                  <button onClick={goToCurrent} className="px-3 py-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 transition-colors shadow-sm font-semibold">Hoje</button>
                  <button onClick={goToNext} className="px-3 py-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300 transition-colors shadow-sm font-medium">Próximo</button>
              </div>

              <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                {[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA].map(v => (
                    <button 
                       key={v}
                       onClick={() => {
                         toolbar.onView(v);
                         setView(v);
                       }}
                       className={cn(
                           "px-3 py-1.5 rounded text-sm font-medium transition-colors shadow-sm capitalize", 
                           toolbar.view === v ? "bg-white dark:bg-gray-700 text-primary" : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                       )}
                    >
                       {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : v === 'day' ? 'Dia' : 'Agenda'}
                    </button>
                ))}
              </div>
          </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      {/* Top statistics panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Pedidos no Mês</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {Object.values(statsData?.dias || {}).reduce((sum: number, d: any) => sum + (d.pedidos || 0), 0) as number}
            </span>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-blue-600">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Taxa de Eventos</span>
            <span className="text-2xl font-black text-gray-900 dark:text-white">
              {Object.values(statsData?.dias || {}).reduce((sum: number, d: any) => sum + (d.eventos || 0), 0) as number} Eventos
            </span>
          </div>
          <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl text-primary">
            <CalendarIcon size={24} />
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Estado do Caixa Ativo</span>
            <span className={cn("text-sm font-bold block", openCaixa ? "text-success" : "text-error")}>
              {openCaixa ? `SESSÃO ATIVA (Operador: ${(openCaixa as any).operador || 'Balcão'})` : 'NÃO INICIADO'}
            </span>
          </div>
          <div className={cn("p-3 rounded-xl", openCaixa ? "bg-success/10 text-success" : "bg-error/10 text-error")}>
            {openCaixa ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Main Calendar Body */}
        <div className="flex-1 bg-surface dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark flex flex-col overflow-hidden shadow-sm p-4 relative">
          <style>{`
            .rbc-calendar { font-family: var(--font-sans); border: none !important;}
            .rbc-header { padding: 10px; font-weight: 600; text-transform: uppercase; font-size: 11px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
            .dark .rbc-header { color: #9ca3af; border-bottom-color: #374151; }
            .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; }
            .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-agenda-view { border-color: #1f2937; background: #111827; }
            .rbc-day-bg { border-left: 1px solid #e5e7eb; cursor: pointer; }
            .dark .rbc-day-bg { border-left: 1px solid #1f2937; }
            .rbc-month-row { border-top: 1px solid #e5e7eb; }
            .dark .rbc-month-row { border-top: 1px solid #1f2937; }
            .rbc-event { background-color: var(--color-primary); border-radius: 4px; padding: 2px 6px; font-size: 12px; font-weight: 500; border: hidden; }
            .rbc-today { background-color: rgba(198, 40, 40, 0.03); }
            .dark .rbc-today { background-color: rgba(198, 40, 40, 0.1); }
            .rbc-off-range-bg { background-color: #f9fafb; }
            .dark .rbc-off-range-bg { background-color: #030712; }
            .rbc-timeslot-group { border-bottom: 1px solid #e5e7eb; }
            .dark .rbc-timeslot-group { border-bottom: 1px solid #1f2937; }
          `}</style>
          
          <Calendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            view={view}
            onView={(newView) => {
              setView(newView);
            }}
            date={date}
            onNavigate={(newDate) => {
              setDate(newDate);
            }}
            culture="pt-BR"
            components={{ toolbar: CustomToolbar }}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={(event: any) => ({
              style: {
                backgroundColor: event.color,
                border: 'none',
              }
            })}
            selectable
          />
        </div>

        {/* Selected Day Right Panel Drawer */}
        <div className="w-80 bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl flex flex-col shrink-0 shadow-sm overflow-hidden p-4 space-y-4">
          <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider">
              <CalendarIcon size={16} className="text-primary" />
              Dia: {format(parse(selectedDayStr, "yyyy-MM-dd", new Date()), "dd 'de' MMMM", { locale: pt })}
            </h3>
            <span className="text-[10px] text-gray-400 font-semibold uppercase">Planeamento do Dia</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {isLoadingDayDetails ? (
              <div className="text-center py-8 text-gray-500 text-xs">A carregar planeamento...</div>
            ) : (
              <>
                {/* 1. Pedidos Agendados a levantar/faturar */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <ShoppingBag size={12} className="text-blue-500" />
                    Pedidos Agendados
                  </h4>
                  {(!dayDetails?.pedidos || dayDetails.pedidos.length === 0) ? (
                    <p className="text-[10px] text-gray-400 italic">Sem pedidos para este dia.</p>
                  ) : (
                    <div className="space-y-2">
                      {dayDetails.pedidos.map((o: any) => {
                        const total = Number(o.valor_total || 0);
                        const pago = Number(o.valor_pago || 0);
                        const diff = Math.max(0, total - pago);
                        const isPaid = diff <= 0;

                        return (
                          <div key={o.id} className="p-2.5 rounded-lg border border-gray-150 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 text-xs">
                            <div className="flex justify-between font-bold text-gray-800 dark:text-gray-100 mb-1">
                              <span>#{o.id} - {o.cliente || "Balcão"}</span>
                              <span className={isPaid ? "text-success" : "text-amber-600"}>
                                {isPaid ? "Pago" : "Sinalizado"}
                              </span>
                            </div>
                            <div className="flex justify-between text-[10px] text-gray-500 mb-2">
                              <span>Total: {formatCurrency(total)}</span>
                              <span>Sinal: {formatCurrency(pago)}</span>
                            </div>
                            {!isPaid && (
                              <button
                                onClick={() => handleLiquidateBalance(o)}
                                className="w-full bg-primary hover:bg-primary-hover text-white text-[10px] font-bold py-1 px-2 rounded-md transition-colors flex justify-center items-center gap-1"
                              >
                                Faturar Restante ({formatCurrency(diff)})
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Ordens de Produção */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <RefreshCw size={12} className="text-orange-500" />
                    Produção do Dia
                  </h4>
                  {(!dayDetails?.producoes || dayDetails.producoes.length === 0) ? (
                    <p className="text-[10px] text-gray-400 italic">Sem ordens de produção.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {dayDetails.producoes.map((p: any) => (
                        <div key={p.id} className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/10 text-[11px] flex justify-between items-center">
                          <div>
                            <span className="font-bold text-gray-800 dark:text-gray-200">OP #{p.id}</span>
                            <span className="text-[9px] text-gray-500 block">Sector: {p.sector || 'Geral'}</span>
                          </div>
                          <span className={cn(
                            "text-[9px] font-bold px-1.5 py-0.5 rounded",
                            p.estado === 'Completado' || p.estado === 'Concluido' ? "bg-success/10 text-success" : "bg-amber-500/15 text-amber-600"
                          )}>
                            {p.estado}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Entregas Programadas */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Truck size={12} className="text-success" />
                    Entregas Programadas
                  </h4>
                  {(!dayDetails?.entregas || dayDetails.entregas.length === 0) ? (
                    <p className="text-[10px] text-gray-400 italic">Sem entregas agendadas.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {dayDetails.entregas.map((d: any) => (
                        <div key={d.id} className="p-2 rounded-lg bg-success/5 border border-success/15 text-[11px]">
                          <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200">
                            <span>Entrega #{d.id}</span>
                            <span className="text-[9px] uppercase font-semibold text-gray-400">{d.estado}</span>
                          </div>
                          <p className="text-[9px] text-gray-500 mt-1">Local: {d.local || 'Não especificado'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Turnos do Pessoal */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <Users size={12} className="text-purple-500" />
                    Turnos / Equipa
                  </h4>
                  {(!dayDetails?.turnos || dayDetails.turnos.length === 0) ? (
                    <p className="text-[10px] text-gray-400 italic">Sem equipa escalada.</p>
                  ) : (
                    <div className="space-y-1 bg-purple-500/5 p-2 rounded-lg border border-purple-500/15">
                      {dayDetails.turnos.map((t: any, idx: number) => (
                        <div key={idx} className="text-[10px] flex justify-between py-0.5 font-medium text-gray-700 dark:text-gray-300">
                          <span>{t.operador || t.nome || 'Operador'}</span>
                          <span className="text-purple-600 font-bold">{t.estado || 'Activo'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from "react";
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
import { Filter, Calendar as CalendarIcon, Plus, CheckCircle2, AlertCircle, RefreshCw, ShoppingBag, Truck, Users, Clock } from "lucide-react";
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

// Helper to get printable string from client object or string
function getClientDisplayName(clientVal: any): string {
  if (!clientVal) return "";
  if (typeof clientVal === "string") return clientVal;
  if (typeof clientVal === "object") {
    return clientVal.nome || clientVal.empresa || clientVal.name || clientVal.email || "";
  }
  return String(clientVal);
}

// Helper to parse Pedido delivery date & time
function parsePedidoDateTime(o: any) {
  const rawDate = o.data_entrega || o.dueDate || o.data_pedido || o.created_at;
  if (!rawDate) return { start: new Date(), timeStr: "12:00", dateStr: format(new Date(), "yyyy-MM-dd") };

  let onlyDate = "";
  let timeStr = o.hora_entrega || o.hora || "12:00";

  if (String(rawDate).includes("T")) {
    const parts = String(rawDate).split("T");
    onlyDate = parts[0];
    if (parts[1] && parts[1].length >= 5 && (!o.hora_entrega || o.hora_entrega === "12:00")) {
      timeStr = parts[1].slice(0, 5);
    }
  } else {
    onlyDate = String(rawDate).split(" ")[0];
  }

  const cleanTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const isoCandidate = `${onlyDate}T${cleanTime}`;
  const startDate = new Date(isoCandidate);

  if (!isNaN(startDate.getTime())) {
    return { start: startDate, timeStr, dateStr: onlyDate };
  }

  const fallback = new Date(rawDate);
  const validFallback = !isNaN(fallback.getTime()) ? fallback : new Date();
  return {
    start: validFallback,
    timeStr: timeStr || "12:00",
    dateStr: format(validFallback, "yyyy-MM-dd")
  };
}

// Helper to parse Evento start & end date & time
function parseEventoDateTime(e: any) {
  const rawDate = e.data_evento || e.date || e.created_at;
  if (!rawDate) {
    const now = new Date();
    return { 
      start: now, 
      end: new Date(now.getTime() + 4 * 3600000), 
      startTimeStr: "09:00", 
      endTimeStr: "13:00",
      dateStr: format(now, "yyyy-MM-dd")
    };
  }

  let onlyDate = "";
  let startTimeStr = e.hora_inicio || e.startTime || "09:00";
  let endTimeStr = e.hora_fim || e.endTime || "13:00";

  if (String(rawDate).includes("T")) {
    const parts = String(rawDate).split("T");
    onlyDate = parts[0];
    if (parts[1] && parts[1].length >= 5 && (!e.hora_inicio || e.hora_inicio === "09:00")) {
      startTimeStr = parts[1].slice(0, 5);
    }
  } else {
    onlyDate = String(rawDate).split(" ")[0];
  }

  const cleanStartTime = startTimeStr.length === 5 ? `${startTimeStr}:00` : startTimeStr;
  const startDate = new Date(`${onlyDate}T${cleanStartTime}`);

  const cleanEndTime = endTimeStr.length === 5 ? `${endTimeStr}:00` : endTimeStr;
  const endDateCandidate = new Date(`${onlyDate}T${cleanEndTime}`);

  const start = !isNaN(startDate.getTime()) ? startDate : new Date(rawDate);
  const end = !isNaN(endDateCandidate.getTime()) && endDateCandidate > start 
    ? endDateCandidate 
    : new Date(start.getTime() + 4 * 3600000);

  return { start, end, startTimeStr, endTimeStr, dateStr: onlyDate };
}

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

  const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const userId = currentUser?.id || currentUser?.email || "anonymous";

  // Cash Register State check for current user to allow receiving payments
  const { data: openCaixa = null } = useQuery({
    queryKey: ["minha-sessao-caixa", userId],
    queryFn: () => financialService.getMinhaSessao()
  });

  const isLoading = isLoadingEvents || isLoadingOrders || isLoadingProd || isLoadingDeliv || isLoadingShifts;

  const events = eventsResp?.items || [];
  const orders = ordersResp?.items || [];
  const production = productionResp?.items || [];
  const deliveries = deliveriesResp?.items || [];
  const shifts = shiftsResp?.items || [];
  const shiftDates = useMemo(() => Array.from(
    { length: new Date(currentYear, currentMonth, 0).getDate() },
    (_, index) => new Date(currentYear, currentMonth - 1, index + 1)
  ), [currentYear, currentMonth]);

  // Memoized day orders & events for the right drawer (Called before any return)
  const selectedDayOrders = useMemo(() => {
    const fromApi = dayDetails?.pedidos || [];
    const fromList = orders.filter((o: any) => {
      const { dateStr } = parsePedidoDateTime(o);
      return dateStr === selectedDayStr;
    });

    const map = new Map<string | number, any>();
    [...fromApi, ...fromList].forEach((o) => {
      if (o && (o.id != null)) map.set(o.id, o);
    });
    return Array.from(map.values());
  }, [dayDetails?.pedidos, orders, selectedDayStr]);

  const selectedDayEventos = useMemo(() => {
    const fromApi = dayDetails?.eventos || [];
    const fromList = events.filter((e: any) => {
      const { dateStr } = parseEventoDateTime(e);
      return dateStr === selectedDayStr;
    });

    const map = new Map<string | number, any>();
    [...fromApi, ...fromList].forEach((e) => {
      if (e && (e.id != null)) map.set(e.id, e);
    });
    return Array.from(map.values());
  }, [dayDetails?.eventos, events, selectedDayStr]);

  // Helper to map and colorize calendar events
  const calendarEvents = useMemo(() => [
    ...events.map((e: any) => {
      const { start, end, startTimeStr, endTimeStr } = parseEventoDateTime(e);
      const eventName = e.name || e.nome || e.titulo || `Evento #${e.id}`;
      const localStr = e.location || e.local || "";

      return {
        id: `e-${e.id}`,
        title: `🎉 EVENTO: ${eventName} | 🕒 ${startTimeStr}${endTimeStr ? `-${endTimeStr}` : ""}${localStr ? ` @ ${localStr}` : ""}`,
        start,
        end,
        color: '#FF6B00', // primary orange
        type: 'EVENTO',
        resource: { ...e, startTimeStr, endTimeStr, formattedDate: format(start, "dd/MM/yyyy") }
      };
    }),
    ...orders.map((o: any) => {
      const { start, timeStr } = parsePedidoDateTime(o);
      const end = new Date(start.getTime() + 3600000); // 1h duration
      const clientName = getClientDisplayName(o.cliente) || getClientDisplayName(o.cliente_nome) || getClientDisplayName(o.client?.nome) || "";

      return {
        id: `o-${o.id}`,
        title: `📦 PEDIDO #${o.id}${clientName ? ` - ${clientName}` : ""} | 🕒 ${timeStr}`,
        start,
        end,
        color: '#2563EB', // blue
        type: 'PEDIDO',
        resource: { ...o, formattedTime: timeStr, formattedDate: format(start, "dd/MM/yyyy") }
      };
    }),
    ...production.map((p: any) => ({
      id: `p-${p.id}`,
      title: `PROD: ${p.numero || `#${p.id}`} — ${p.estado || p.status || 'Pendente'}`,
      start: new Date(p.data_producao || p.dueDate || p.data_entrega || new Date()),
      end: new Date(new Date(p.data_producao || p.dueDate || p.data_entrega || new Date()).getTime() + 7200000),
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
      .flatMap((s: any) => shiftDates.map((shiftDate) => {
        const title = s.userRole ? `TURNO: ${s.userRole}` : `Turno: ${s.nome || 'Configurado'}`;
        
        let startDate = new Date(shiftDate);
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
      }))
  ], [events, orders, production, deliveries, shifts, shiftDates]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        A carregar calendário operativo...
      </div>
    );
  }

  const handleSelectEvent = (event: any) => {
    const raw = event.resource;
    setSelectedDayStr(format(new Date(event.start), "yyyy-MM-dd"));

    if (event.type === 'EVENTO') {
      Swal.fire({
        title: `🎉 ${raw.name || raw.nome || raw.titulo || 'Evento'}`,
        html: `
          <div class="text-left p-3.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl text-sm space-y-2 border border-gray-200 dark:border-gray-700">
             <p><strong>Cliente / Organizador:</strong> ${getClientDisplayName(raw.cliente_nome) || getClientDisplayName(raw.cliente) || 'Não especificado'}</p>
             <p><strong>Data:</strong> ${raw.formattedDate || format(event.start, 'dd/MM/yyyy')}</p>
             <p><strong>Horário do Evento:</strong> <span class="font-bold text-orange-600 dark:text-orange-400">${raw.startTimeStr || format(event.start, 'HH:mm')}${raw.endTimeStr ? ` - ${raw.endTimeStr}` : ''}</span></p>
             <p><strong>Localização:</strong> ${raw.location || raw.local || 'Não especificado'}</p>
             <p><strong>N.º de Convidados (Pax):</strong> ${raw.guests || raw.num_pessoas || 0} pessoas</p>
             <p><strong>Estado:</strong> <span class="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800 font-bold">${raw.status || raw.estado || 'Confirmado'}</span></p>
             ${raw.notes || raw.observacoes ? `<hr class="my-2 border-gray-200 dark:border-gray-700"/><p class="text-xs text-gray-500"><strong>Notas:</strong> ${raw.notes || raw.observacoes}</p>` : ''}
          </div>
        `,
        confirmButtonText: "Ver no Painel do Dia",
        confirmButtonColor: "var(--color-primary)"
      });
    } else if (event.type === 'PEDIDO') {
      const total = Number(raw.valor_total || raw.total || 0);
      const pago = Number(raw.valor_pago || 0);
      const restante = Math.max(0, total - pago);
      const isPaid = restante <= 0;

      Swal.fire({
        title: `📦 Pedido #${raw.id}`,
        html: `
          <div class="text-left p-3.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl text-sm space-y-2 border border-gray-200 dark:border-gray-700">
            <p><strong>Cliente:</strong> ${getClientDisplayName(raw.cliente) || getClientDisplayName(raw.cliente_nome) || "Consumidor Final"}</p>
            <p><strong>Data & Hora de Entrega:</strong> <span class="font-bold text-blue-600 dark:text-blue-400">${raw.formattedDate || format(event.start, 'dd/MM/yyyy')} às ${raw.formattedTime || format(event.start, 'HH:mm')}</span></p>
            <p><strong>Modalidade:</strong> ${raw.type || raw.tipo_pedido || "Agendado"}</p>
            <p><strong>Estado:</strong> <span class="px-2 py-0.5 rounded text-xs ${isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"} font-bold">${raw.estado || raw.status || "Pendente"}</span></p>
            <hr class="my-2 border-gray-200 dark:border-gray-700"/>
            <div class="flex justify-between text-xs">
              <span>Total do Pedido:</span>
              <strong>${formatCurrency(total)}</strong>
            </div>
            <div class="flex justify-between text-xs">
              <span>Sinal / Valor Pago:</span>
              <strong class="text-emerald-600">${formatCurrency(pago)}</strong>
            </div>
            <div class="flex justify-between text-xs pt-1 border-t border-gray-200 dark:border-gray-700 font-bold">
              <span>Saldo Restante:</span>
              <strong class="${restante > 0 ? "text-red-600" : "text-emerald-600"}">${formatCurrency(restante)}</strong>
            </div>
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: restante > 0 ? `Faturar Restante (${formatCurrency(restante)})` : "Ver no Painel do Dia",
        cancelButtonText: "Fechar",
        confirmButtonColor: restante > 0 ? "var(--color-primary)" : "#2563EB"
      }).then((res) => {
        if (res.isConfirmed && restante > 0) {
          handleLiquidateBalance(raw);
        }
      });
    } else {
      Swal.fire({
        title: event.title,
        html: `<div class="text-left text-sm space-y-2"><p><strong>Tipo:</strong> ${event.type}</p><p><strong>Estado:</strong> ${raw.estado || raw.status || '—'}</p><p><strong>Número:</strong> ${raw.numero || raw.id || '—'}</p><p><strong>Início:</strong> ${format(event.start, 'dd/MM/yyyy HH:mm')}</p>${raw.observacoes ? `<p><strong>Observações:</strong> ${raw.observacoes}</p>` : ''}</div>`,
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
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <CalendarIcon size={12} className="text-orange-500" /> Eventos do Dia
                  </h4>
                  {selectedDayEventos.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">Sem eventos para este dia.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedDayEventos.map((e: any) => {
                        const { startTimeStr, endTimeStr } = parseEventoDateTime(e);
                        return (
                          <div key={e.id} className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 text-xs space-y-1">
                            <div className="flex justify-between items-start font-bold text-gray-900 dark:text-white">
                              <span>{e.name || e.nome || e.titulo || `Evento #${e.id}`}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-200 dark:bg-orange-900 text-orange-800 dark:text-orange-200 font-extrabold">
                                {e.status || e.estado || 'Confirmado'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-orange-700 dark:text-orange-300 font-semibold">
                              <span className="flex items-center gap-1">
                                <Clock size={11} /> {startTimeStr}{endTimeStr ? ` - ${endTimeStr}` : ''}
                              </span>
                              {(e.guests || e.num_pessoas) && (
                                <span>{e.guests || e.num_pessoas} pax</span>
                              )}
                            </div>
                            {(e.location || e.local) && (
                              <p className="text-[10px] text-gray-500 truncate">📍 {e.location || e.local}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 1. Pedidos Agendados a levantar/faturar */}
                <div>
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <ShoppingBag size={12} className="text-blue-500" />
                    Pedidos Agendados
                  </h4>
                  {selectedDayOrders.length === 0 ? (
                    <p className="text-[10px] text-gray-400 italic">Sem pedidos para este dia.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDayOrders.map((o: any) => {
                        const { timeStr } = parsePedidoDateTime(o);
                        const total = Number(o.valor_total || o.total || 0);
                        const pago = Number(o.valor_pago || 0);
                        const diff = Math.max(0, total - pago);
                        const isPaid = diff <= 0;

                        return (
                          <div key={o.id} className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-xs space-y-1.5">
                            <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100">
                              <span>#{o.id} - {getClientDisplayName(o.cliente) || getClientDisplayName(o.cliente_nome) || "Balcão"}</span>
                              <span className={isPaid ? "text-emerald-600 font-extrabold" : "text-amber-600 font-extrabold"}>
                                {isPaid ? "Pago" : "Sinalizado"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-300">
                              <span className="flex items-center gap-1">
                                <Clock size={11} /> Hora Entrega: {timeStr}
                              </span>
                              <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 rounded text-blue-800 dark:text-blue-200 font-semibold">
                                {o.type || o.tipo_pedido || "Agendado"}
                              </span>
                            </div>

                            <div className="flex justify-between text-[10px] text-gray-500 pt-0.5">
                              <span>Total: {formatCurrency(total)}</span>
                              <span>Sinal: {formatCurrency(pago)}</span>
                            </div>

                            {!isPaid && (
                              <button
                                onClick={() => handleLiquidateBalance(o)}
                                className="w-full mt-1 bg-primary hover:bg-primary-hover text-white text-[10px] font-extrabold py-1.5 px-2 rounded-lg transition-colors flex justify-center items-center gap-1 shadow-sm"
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
                          <span>{getClientDisplayName(t.operador) || getClientDisplayName(t.nome) || 'Operador'}</span>
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

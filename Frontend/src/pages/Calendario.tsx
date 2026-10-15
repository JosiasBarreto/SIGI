import React, { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { notificationAuditService, AppNotification } from "../services/notifications";
import { Calendar, dateFnsLocalizer, Views, View } from "react-big-calendar";
import { 
  format, 
  parse, 
  startOfWeek, 
  getDay, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  isSameDay 
} from "date-fns";
import { pt } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Swal from "sweetalert2";
import { 
  Filter, 
  Calendar as CalendarIcon, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ShoppingBag, 
  Truck, 
  Users, 
  Clock, 
  Bell, 
  ExternalLink, 
  Search, 
  Sparkles, 
  Building2, 
  ArrowRight, 
  X, 
  AlertTriangle,
  BadgeAlert,
  ChevronRight,
  TrendingUp,
  CalendarRange
} from "lucide-react";
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

function parseValidDate(value: unknown): Date | null {
  if (value == null || value === '') return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function setTimeOnDate(date: Date, value: unknown): Date {
  const match = String(value ?? '').match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) return date;
  const result = new Date(date);
  result.setHours(Number(match[1]), Number(match[2]), Number(match[3] || 0), 0);
  return result;
}

// Helper to parse Pedido delivery date & time
function parsePedidoDateTime(o: any) {
  const rawDate = o.data_entrega || o.dueDate || o.data_pedido || o.created_at;
  if (!rawDate) {
    const now = new Date();
    return { start: now, timeStr: "12:00", dateStr: format(now, "yyyy-MM-dd") };
  }

  let onlyDate = "";
  let timeStr = String(o.hora_entrega || o.hora || "12:00");

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
  const startDate = parseValidDate(isoCandidate);

  if (startDate) {
    return { start: startDate, timeStr, dateStr: onlyDate };
  }

  const fallback = parseValidDate(rawDate);
  if (!fallback) return null;
  return { start: fallback, timeStr: timeStr || "12:00", dateStr: format(fallback, "yyyy-MM-dd") };
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
  let startTimeStr = String(e.hora_inicio || e.startTime || "09:00");
  let endTimeStr = String(e.hora_fim || e.endTime || "13:00");

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
  const startDate = parseValidDate(`${onlyDate}T${cleanStartTime}`);

  const cleanEndTime = endTimeStr.length === 5 ? `${endTimeStr}:00` : endTimeStr;
  const endDateCandidate = parseValidDate(`${onlyDate}T${cleanEndTime}`);

  const start = startDate || parseValidDate(rawDate);
  if (!start) return null;
  const end = endDateCandidate && endDateCandidate > start
    ? endDateCandidate 
    : new Date(start.getTime() + 4 * 3600000);

  return { start, end, startTimeStr, endTimeStr, dateStr: format(start, "yyyy-MM-dd") };
}

// Color palette mapping consistent with the restaurant theme
const THEME_COLORS = {
  EVENTO: {
    bg: '#EA580C', // Orange 600
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800/60',
    border: 'border-orange-500'
  },
  PEDIDO: {
    bg: '#2563EB', // Blue 600
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    border: 'border-blue-500'
  },
  PRODUCAO: {
    bg: '#D97706', // Amber 600
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    border: 'border-amber-500'
  },
  ENTREGA: {
    bg: '#059669', // Emerald 600
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    border: 'border-emerald-500'
  },
  TURNO: {
    bg: '#7C3AED', // Purple 600
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
    border: 'border-purple-500'
  },
  ALERTA: {
    bg: '#E11D48', // Rose 600
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    border: 'border-rose-500'
  }
};

export default function Calendario() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  
  // Track selected day details (defaults to today's date formatted as YYYY-MM-DD)
  const [selectedDayStr, setSelectedDayStr] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // Interactive filters
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("ALL"); // 'ALL' | 'PENDING_PAYMENT' | 'PAID'
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [rightDrawerTab, setRightDrawerTab] = useState<"DAY_OPS" | "NOTIFICACOES">("DAY_OPS");

  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;

  // Monthly stats
  const { data: statsData } = useQuery({
    queryKey: ["calendario-stats", currentYear, currentMonth],
    queryFn: () => calendarioService.getMesStats(currentYear, currentMonth),
  });

  // Selected day details from backend
  const { data: dayDetails, isLoading: isLoadingDayDetails } = useQuery({
    queryKey: ["calendario-dia", selectedDayStr],
    queryFn: () => calendarioService.getDiaDetalhes(selectedDayStr),
    enabled: !!selectedDayStr,
  });

  // Main operational entities for react-big-calendar mapping
  const { data: eventsResp, isLoading: isLoadingEvents } = useQuery({ 
    queryKey: ["events"], 
    queryFn: () => eventService.getAll({ per_page: 1000 }) 
  });
  
  const { data: ordersResp, isLoading: isLoadingOrders } = useQuery({ 
    queryKey: ["orders-cal"], 
    queryFn: () => orderService.getAll({ per_page: 1000 }) 
  });
  
  const { data: productionResp, isLoading: isLoadingProd } = useQuery({ 
    queryKey: ["prod-cal"], 
    queryFn: () => productionService.getAll({ per_page: 1000 }) 
  });
  
  const { data: deliveriesResp, isLoading: isLoadingDeliv } = useQuery({ 
    queryKey: ["deliv-cal"], 
    queryFn: () => deliveryService.getAll({ per_page: 1000 }) 
  });
  
  const { data: shiftsResp, isLoading: isLoadingShifts } = useQuery({ 
    queryKey: ["shifts-cal"], 
    queryFn: () => shiftService.getAll({ per_page: 1000 }) 
  });

  // Notifications query for operational awareness
  const { data: rawNotificacoes = [], isLoading: isLoadingNotifs } = useQuery<AppNotification[]>({
    queryKey: ["notificacoes-cal"],
    queryFn: () => notificationAuditService.getHistorico({ per_page: 50 }),
    refetchInterval: 30000 // refresh every 30s
  });

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

  // Derived Smart Operational Notifications (combining real-time events, orders, payments and audit notifications)
  const operationalAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      title: string;
      description: string;
      type: 'URGENTE' | 'PAGAMENTO' | 'EVENTO' | 'PEDIDO' | 'SISTEMA';
      dateStr: string;
      timeStr?: string;
      actionLink?: string;
      actionText?: string;
      raw?: any;
    }> = [];

    const todayStr = format(new Date(), "yyyy-MM-dd");

    // 1. Check orders with pending balance
    orders.forEach((o: any) => {
      const total = Number(o.valor_total || o.total || 0);
      const pago = Number(o.valor_pago || 0);
      const diff = Math.max(0, total - pago);
      const parsedDate = parsePedidoDateTime(o);
      if (!parsedDate) return;
      const { dateStr, timeStr } = parsedDate;

      if (diff > 0) {
        alerts.push({
          id: `alert-order-unpaid-${o.id}`,
          title: `Saldo Pendente: Pedido #${o.id}`,
          description: `Falta liquidar ${formatCurrency(diff)} (Cliente: ${getClientDisplayName(o.cliente) || getClientDisplayName(o.cliente_nome) || 'Balcão'})`,
          type: 'PAGAMENTO',
          dateStr,
          timeStr,
          actionLink: `/pedidos`,
          actionText: 'Liquidar Saldo',
          raw: o
        });
      }

      // Check deliveries scheduled for today
      if (dateStr === todayStr) {
        alerts.push({
          id: `alert-order-today-${o.id}`,
          title: `Entrega Hoje: Pedido #${o.id} às ${timeStr}`,
          description: `Modalidade: ${o.tipo_pedido || o.type || 'Agendado'} | Total: ${formatCurrency(total)}`,
          type: 'PEDIDO',
          dateStr,
          timeStr,
          actionLink: `/pedidos`,
          actionText: 'Ver Pedido',
          raw: o
        });
      }
    });

    // 2. Check events scheduled for today or this week
    events.forEach((e: any) => {
      const parsedDate = parseEventoDateTime(e);
      if (!parsedDate) return;
      const { dateStr, startTimeStr, endTimeStr } = parsedDate;
      if (dateStr === todayStr) {
        alerts.push({
          id: `alert-event-today-${e.id}`,
          title: `🎉 Evento Hoje: ${e.name || e.nome || e.titulo || `Evento #${e.id}`}`,
          description: `Horário: ${startTimeStr} - ${endTimeStr} | Espaço: ${e.location || e.local || 'Salão'} | ${e.guests || e.num_pessoas || 0} pax`,
          type: 'EVENTO',
          dateStr,
          timeStr: startTimeStr,
          actionLink: `/eventos`,
          actionText: 'Aceder Evento',
          raw: e
        });
      }
    });

    // 3. Add system notifications from notificationAuditService
    rawNotificacoes.slice(0, 15).forEach((n: AppNotification) => {
      const isUrgent = n.priority === 'CRITICAL' || n.priority === 'critical' || n.priority === 'HIGH' || n.priority === 'high';
      const parsedNotificationDate = parseValidDate(n.timestamp);
      const notificationDate = parsedNotificationDate || new Date();
      alerts.push({
        id: `alert-notif-${n.id}`,
        title: n.title || 'Notificação Operativa',
        description: n.message || '',
        type: isUrgent ? 'URGENTE' : 'SISTEMA',
        dateStr: format(notificationDate, "yyyy-MM-dd"),
        timeStr: parsedNotificationDate ? format(notificationDate, "HH:mm") : undefined,
        actionLink: n.actionUrl || '/notificacoes',
        actionText: 'Ver Detalhe',
        raw: n
      });
    });

    return alerts;
  }, [orders, events, rawNotificacoes]);

  // Memoized day orders & events for the right drawer
  const selectedDayOrders = useMemo(() => {
    const fromApi = dayDetails?.pedidos || [];
    const fromList = orders.filter((o: any) => {
      const parsedDate = parsePedidoDateTime(o);
      return parsedDate?.dateStr === selectedDayStr;
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
      const parsedDate = parseEventoDateTime(e);
      return parsedDate?.dateStr === selectedDayStr;
    });

    const map = new Map<string | number, any>();
    [...fromApi, ...fromList].forEach((e) => {
      if (e && (e.id != null)) map.set(e.id, e);
    });
    return Array.from(map.values());
  }, [dayDetails?.eventos, events, selectedDayStr]);

  // Total monthly revenue estimate in STN
  const totalFaturadoMes = useMemo(() => {
    const ordersThisMonth = orders.filter((o: any) => {
      const parsedDate = parsePedidoDateTime(o);
      return parsedDate !== null &&
        parsedDate.start.getFullYear() === currentYear &&
        (parsedDate.start.getMonth() + 1) === currentMonth;
    });
    return ordersThisMonth.reduce((acc: number, curr: any) => acc + Number(curr.valor_total || curr.total || 0), 0);
  }, [orders, currentYear, currentMonth]);

  // Helper to map and colorize calendar events with filtering support
  const calendarEvents = useMemo(() => {
    const list: any[] = [];

    // 1. Events
    if (filterType === "ALL" || filterType === "EVENTO") {
      events.forEach((e: any) => {
        const parsedDate = parseEventoDateTime(e);
        if (!parsedDate) return;
        const { start, end, startTimeStr, endTimeStr } = parsedDate;
        const eventName = e.name || e.nome || e.titulo || `Evento #${e.id}`;
        const localStr = e.location || e.local || "";
        const client = getClientDisplayName(e.cliente_nome) || getClientDisplayName(e.cliente) || "";

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match = eventName.toLowerCase().includes(q) || localStr.toLowerCase().includes(q) || client.toLowerCase().includes(q);
          if (!match) return;
        }

        list.push({
          id: `e-${e.id}`,
          title: `🎉 EVENTO: ${eventName} | 🕒 ${startTimeStr}${endTimeStr ? `-${endTimeStr}` : ""}${localStr ? ` @ ${localStr}` : ""}`,
          start,
          end,
          color: THEME_COLORS.EVENTO.bg,
          type: 'EVENTO',
          resource: { ...e, startTimeStr, endTimeStr, formattedDate: format(start, "dd/MM/yyyy") }
        });
      });
    }

    // 2. Orders
    if (filterType === "ALL" || filterType === "PEDIDO") {
      orders.forEach((o: any) => {
        const parsedDate = parsePedidoDateTime(o);
        if (!parsedDate) return;
        const { start, timeStr } = parsedDate;
        const end = new Date(start.getTime() + 3600000); // 1h duration
        const clientName = getClientDisplayName(o.cliente) || getClientDisplayName(o.cliente_nome) || getClientDisplayName(o.client?.nome) || "";
        const total = Number(o.valor_total || o.total || 0);
        const pago = Number(o.valor_pago || 0);
        const restante = Math.max(0, total - pago);

        if (filterStatus === "PENDING_PAYMENT" && restante <= 0) return;
        if (filterStatus === "PAID" && restante > 0) return;

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match = String(o.id).includes(q) || clientName.toLowerCase().includes(q);
          if (!match) return;
        }

        list.push({
          id: `o-${o.id}`,
          title: `📦 PEDIDO #${o.id}${clientName ? ` - ${clientName}` : ""} | 🕒 ${timeStr}${restante > 0 ? ` (Falta ${formatCurrency(restante)})` : ""}`,
          start,
          end,
          color: restante > 0 ? '#E11D48' : THEME_COLORS.PEDIDO.bg, // Rose if unpaid, Blue if paid
          type: 'PEDIDO',
          resource: { ...o, formattedTime: timeStr, formattedDate: format(start, "dd/MM/yyyy") }
        });
      });
    }

    // 3. Production Orders
    if (filterType === "ALL" || filterType === "PRODUCAO") {
      production.forEach((p: any) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match = String(p.numero || p.id).toLowerCase().includes(q) || String(p.sector || '').toLowerCase().includes(q);
          if (!match) return;
        }

        const start = parseValidDate(p.data_producao || p.dueDate || p.data_entrega) || (!p.data_producao && !p.dueDate && !p.data_entrega ? new Date() : null);
        if (!start) return;
        list.push({
          id: `p-${p.id}`,
          title: `PROD: ${p.numero || `#${p.id}`} — ${p.estado || p.status || 'Pendente'}`,
          start,
          end: new Date(start.getTime() + 7200000),
          color: THEME_COLORS.PRODUCAO.bg,
          type: 'PRODUÇÃO',
          resource: p
        });
      });
    }

    // 4. Deliveries
    if (filterType === "ALL" || filterType === "ENTREGA") {
      deliveries.forEach((d: any) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match = String(d.orderId || d.pedido_id || d.id).toLowerCase().includes(q) || String(d.local || '').toLowerCase().includes(q);
          if (!match) return;
        }

        const start = parseValidDate(d.scheduledDate || d.data_entrega);
        if (!start) return;
        list.push({
          id: `d-${d.id}`,
          title: `ENTREGA: #${d.orderId || d.pedido_id}`,
          start,
          end: new Date(start.getTime() + 3600000),
          color: THEME_COLORS.ENTREGA.bg,
          type: 'ENTREGA',
          resource: d
        });
      });
    }

    // 5. Shifts
    if (filterType === "ALL" || filterType === "TURNO") {
      shifts
        .filter((s: any) => s.startTime || s.hora_inicio || s.nome)
        .forEach((s: any) => {
          shiftDates.forEach((shiftDate) => {
            const title = s.userRole ? `TURNO: ${s.userRole}` : `Turno: ${s.nome || 'Configurado'}`;
            
            let startDate = new Date(shiftDate);
            if (s.startTime) {
              startDate = parseValidDate(s.startTime) || startDate;
            } else if (s.hora_inicio) {
              startDate = setTimeOnDate(startDate, s.hora_inicio);
            }

            let endDate = new Date(startDate.getTime() + 28800000); // 8h default
            if (s.endTime) {
              endDate = parseValidDate(s.endTime) || endDate;
            } else if (s.hora_fim) {
              endDate = new Date(startDate);
              endDate = setTimeOnDate(endDate, s.hora_fim);
              if (endDate < startDate) {
                endDate.setDate(endDate.getDate() + 1);
              }
            }

            list.push({
              id: `s-${s.id}-${startDate.getTime()}`,
              title,
              start: startDate,
              end: endDate,
              color: THEME_COLORS.TURNO.bg,
              type: 'TURNO',
              resource: s
            });
          });
        });
    }

    return list;
  }, [events, orders, production, deliveries, shifts, shiftDates, filterType, filterStatus, searchQuery]);

  // Counts for filter badges
  const filterCounts = useMemo(() => ({
    ALL: events.length + orders.length + production.length + deliveries.length,
    EVENTO: events.length,
    PEDIDO: orders.length,
    PRODUCAO: production.length,
    ENTREGA: deliveries.length,
    TURNO: shifts.length,
    NOTIFICACAO: operationalAlerts.length,
    PENDING_PAYMENT: orders.filter((o: any) => {
      const diff = Math.max(0, Number(o.valor_total || o.total || 0) - Number(o.valor_pago || 0));
      return diff > 0;
    }).length
  }), [events, orders, production, deliveries, shifts, operationalAlerts]);

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
             <p><strong>Localização / Espaço:</strong> ${raw.location || raw.local || 'Salão Principal'}</p>
             <p><strong>N.º de Convidados (Pax):</strong> ${raw.guests || raw.num_pessoas || 0} pessoas</p>
             <p><strong>Estado:</strong> <span class="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-800 font-bold">${raw.status || raw.estado || 'Confirmado'}</span></p>
             ${raw.notes || raw.observacoes ? `<hr class="my-2 border-gray-200 dark:border-gray-700"/><p class="text-xs text-gray-500"><strong>Notas:</strong> ${raw.notes || raw.observacoes}</p>` : ''}
          </div>
        `,
        showCancelButton: true,
        confirmButtonText: "Ver no Módulo de Eventos",
        cancelButtonText: "Fechar",
        confirmButtonColor: "#EA580C"
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/eventos');
        }
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
        confirmButtonText: restante > 0 ? `Faturar Restante (${formatCurrency(restante)})` : "Ver Pedidos",
        cancelButtonText: "Fechar",
        confirmButtonColor: restante > 0 ? "#EA580C" : "#2563EB"
      }).then((res) => {
        if (res.isConfirmed) {
          if (restante > 0) {
            handleLiquidateBalance(raw);
          } else {
            navigate('/pedidos');
          }
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
            <div class="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 font-extrabold text-orange-600">
              <span>Restante em Falta (STN):</span>
              <span>${formatCurrency(balance)}</span>
            </div>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Valor a Liquidar em STN</label>
            <input id="liq-amount" type="number" class="swal2-input w-full m-0" value="${balance}">
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Forma de Pagamento</label>
            <select id="liq-method" class="swal2-input w-full m-0 text-sm">
              <option value="Dinheiro">Dinheiro</option>
              <option value="TPA / POS">TPA / POS</option>
              <option value="Transferência">Transferência Bancária</option>
            </select>
          </div>
          <div id="liq-extra-fields" style="display: none;" class="space-y-2">
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Código de Transação / TRX *</label>
              <input id="liq-code" type="text" class="swal2-input w-full m-0" placeholder="Ex: TRX123456">
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Emissor / Titular do Banco *</label>
              <input id="liq-emissor" type="text" class="swal2-input w-full m-0" placeholder="Ex: Banco de Poupança">
            </div>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Confirmar Recebimento',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: "#EA580C",
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

  // Quick navigation preset handlers
  const handleQuickJumpToday = () => {
    const today = new Date();
    setDate(today);
    setSelectedDayStr(format(today, "yyyy-MM-dd"));
  };

  const handleDateChangeFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const parsedDate = parse(val, "yyyy-MM-dd", new Date());
      if (!isNaN(parsedDate.getTime())) {
        setDate(parsedDate);
        setSelectedDayStr(val);
      }
    }
  };

  const CustomToolbar = (toolbar: any) => {
    const goToBack = () => { toolbar.onNavigate('PREV'); };
    const goToNext = () => { toolbar.onNavigate('NEXT'); };
    const goToCurrent = () => { 
      toolbar.onNavigate('TODAY'); 
      handleQuickJumpToday();
    };

    return (
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center bg-surface dark:bg-surface-dark p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-border-dark mb-4 shadow-sm gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-lg">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight capitalize text-gray-900 dark:text-gray-100">
              {toolbar.label}
            </h2>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {calendarEvents.length} operações visíveis • Moeda Base: <strong className="text-orange-600 dark:text-orange-400">STN</strong>
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Navigation controls */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button 
              type="button"
              onClick={goToBack} 
              className="px-2.5 py-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 transition-colors shadow-sm font-semibold"
            >
              Anterior
            </button>
            <button 
              type="button"
              onClick={goToCurrent} 
              className="px-2.5 py-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-xs text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 transition-colors shadow-sm font-bold"
            >
              Hoje
            </button>
            <button 
              type="button"
              onClick={goToNext} 
              className="px-2.5 py-1.5 hover:bg-white dark:hover:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300 transition-colors shadow-sm font-semibold"
            >
              Próximo
            </button>
          </div>

          {/* Quick Date Picker */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">
            <label htmlFor="jump-date-input" className="text-[10px] font-bold text-gray-500 uppercase mr-1.5 hidden sm:inline">Data:</label>
            <input 
              id="jump-date-input"
              type="date"
              value={selectedDayStr}
              onChange={handleDateChangeFromInput}
              className="bg-transparent text-xs text-gray-800 dark:text-gray-200 font-semibold focus:outline-none"
            />
          </div>

          {/* View switcher */}
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA].map(v => (
              <button 
                key={v}
                type="button"
                onClick={() => {
                  toolbar.onView(v);
                  setView(v);
                }}
                className={cn(
                  "px-2.5 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm capitalize", 
                  toolbar.view === v 
                    ? "bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
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

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-sm">A carregar calendário operativo do restaurante...</p>
        <span className="text-xs text-gray-400 mt-1">Sincronizando eventos, pedidos, espaços e alertas</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in flex flex-col min-h-[calc(100vh-6rem)]">
      {/* Top action header: Professional Navigation & Quick Links */}
      <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarRange className="text-orange-500" size={22} />
              Calendário &amp; Operações do Restaurante
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200">
              STN Dobra
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Gestão integrada de reservas de salões, pedidos de catering, entregas, turnos e alertas operacionais.
          </p>
        </div>

        {/* Quick Action Buttons including requested link to services */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/eventos/servicos-diversos"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all hover:shadow"
            title="Aceder à gestão de Espaços, Equipas, Serviços e Políticas Comerciais"
          >
            <Sparkles size={15} />
            <span>Gerir Serviços &amp; Espaços</span>
            <ArrowRight size={13} />
          </Link>

          <Link
            to="/eventos/novo"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg text-xs font-bold shadow-sm transition-all"
            title="Criar nova reserva de evento"
          >
            <Plus size={15} className="text-orange-400" />
            <span>Novo Evento</span>
          </Link>

          <Link
            to="/pedidos"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
            title="Ver pedidos agendados e balcão"
          >
            <ShoppingBag size={15} />
            <span>Pedidos / POS</span>
          </Link>

          <Link
            to="/notificacoes"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-bold shadow-sm transition-all relative"
            title="Central de Notificações"
          >
            <Bell size={15} className="text-rose-500" />
            <span>Notificações</span>
            {filterCounts.NOTIFICACAO > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-extrabold bg-rose-500 text-white rounded-full">
                {filterCounts.NOTIFICACAO}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Top statistics summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-3.5 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Pedidos no Mês</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                {orders.length}
              </span>
              <span className="text-[10px] text-blue-600 font-bold">pedidos</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              Previsão: <strong className="text-gray-700 dark:text-gray-300">{formatCurrency(totalFaturadoMes)}</strong>
            </span>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl text-blue-600">
            <ShoppingBag size={22} />
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-3.5 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Eventos &amp; Espaços</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                {events.length}
              </span>
              <span className="text-[10px] text-orange-600 font-bold">agendados</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              Salões ativos no sistema
            </span>
          </div>
          <div className="p-2.5 bg-orange-50 dark:bg-orange-950/30 rounded-xl text-orange-500">
            <Sparkles size={22} />
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-3.5 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Saldos a Liquidar</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-rose-600">
                {filterCounts.PENDING_PAYMENT}
              </span>
              <span className="text-[10px] text-rose-500 font-bold">com saldo</span>
            </div>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              Pagamentos em falta (STN)
            </span>
          </div>
          <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-rose-500">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-3.5 flex justify-between items-center shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Sessão de Caixa</span>
            <span className={cn("text-xs sm:text-sm font-bold block truncate", openCaixa ? "text-emerald-600" : "text-rose-500")}>
              {openCaixa ? `ABERTO (${(openCaixa as any).operador || 'Balcão'})` : 'CAIXA FECHADO'}
            </span>
            <span className="text-[10px] text-gray-400 block mt-0.5">
              {openCaixa ? 'Apto a receber STN' : 'Abra o caixa para cobrar'}
            </span>
          </div>
          <div className={cn("p-2.5 rounded-xl", openCaixa ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30" : "bg-rose-50 text-rose-500 dark:bg-rose-950/30")}>
            {openCaixa ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar with Category Badges */}
      <div className="bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-3 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Category filter pills with badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1 mr-1">
              <Filter size={13} /> Filtrar:
            </span>

            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 border",
                filterType === "ALL"
                  ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-gray-900 dark:border-white shadow-sm"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-transparent hover:bg-gray-200"
              )}
            >
              <span>Todos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 dark:bg-black/20 font-mono">
                {filterCounts.ALL}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("EVENTO")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 border",
                filterType === "EVENTO"
                  ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                  : "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200/60 dark:border-orange-900/40 hover:bg-orange-100"
              )}
            >
              <span>🎉 Eventos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 dark:bg-black/30 font-mono font-bold">
                {filterCounts.EVENTO}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("PEDIDO")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 border",
                filterType === "PEDIDO"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/40 hover:bg-blue-100"
              )}
            >
              <span>📦 Pedidos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 dark:bg-black/30 font-mono font-bold">
                {filterCounts.PEDIDO}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("PRODUCAO")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 border",
                filterType === "PRODUCAO"
                  ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/40 hover:bg-amber-100"
              )}
            >
              <span>🍳 Produção</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 dark:bg-black/30 font-mono font-bold">
                {filterCounts.PRODUCAO}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("ENTREGA")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 border",
                filterType === "ENTREGA"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/40 hover:bg-emerald-100"
              )}
            >
              <span>🚚 Entregas</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 dark:bg-black/30 font-mono font-bold">
                {filterCounts.ENTREGA}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType("TURNO")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1.5 border",
                filterType === "TURNO"
                  ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                  : "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200/60 dark:border-purple-900/40 hover:bg-purple-100"
              )}
            >
              <span>👥 Turnos</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/30 dark:bg-black/30 font-mono font-bold">
                {filterCounts.TURNO}
              </span>
            </button>
          </div>

          {/* Quick Payment Status Filter & Search */}
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-100 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 px-2.5 py-1.5 rounded-lg border border-transparent font-medium focus:outline-none focus:border-orange-500"
            >
              <option value="ALL">Todos os Estados de Pagamento</option>
              <option value="PENDING_PAYMENT">⚠️ Com Saldo Pendente (Falta Pagar)</option>
              <option value="PAID">✅ Totalmente Pagos</option>
            </select>

            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar cliente, evento, #..."
                className="bg-gray-100 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 pl-8 pr-3 py-1.5 rounded-lg border border-transparent w-44 sm:w-56 focus:outline-none focus:border-orange-500"
              />
              {searchQuery && (
                <button 
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Body and Right Panel Drawer */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden min-h-[580px]">
        {/* Calendar Area */}
        <div className="flex-1 bg-surface dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark flex flex-col overflow-hidden shadow-sm p-4 relative min-h-[550px]">
          <style>{`
            .rbc-calendar { font-family: var(--font-sans); border: none !important;}
            .rbc-header { padding: 10px; font-weight: 700; text-transform: uppercase; font-size: 11px; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
            .dark .rbc-header { color: #9ca3af; border-bottom-color: #374151; }
            .rbc-month-view, .rbc-time-view, .rbc-agenda-view { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #fff; }
            .dark .rbc-month-view, .dark .rbc-time-view, .dark .rbc-agenda-view { border-color: #1f2937; background: #111827; }
            .rbc-day-bg { border-left: 1px solid #e5e7eb; cursor: pointer; transition: background-color 0.15s ease; }
            .rbc-day-bg:hover { background-color: rgba(234, 88, 12, 0.05); }
            .dark .rbc-day-bg { border-left: 1px solid #1f2937; }
            .dark .rbc-day-bg:hover { background-color: rgba(234, 88, 12, 0.12); }
            .rbc-month-row { border-top: 1px solid #e5e7eb; }
            .dark .rbc-month-row { border-top: 1px solid #1f2937; }
            .rbc-event { border-radius: 6px; padding: 2.5px 6px; font-size: 11px; font-weight: 600; border: none; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }
            .rbc-today { background-color: rgba(234, 88, 12, 0.06) !important; }
            .dark .rbc-today { background-color: rgba(234, 88, 12, 0.12) !important; }
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
            style={{ height: '100%', minHeight: 520 }}
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
                color: '#ffffff',
                border: 'none',
              }
            })}
            selectable
          />
        </div>

        {/* Selected Day / Operational Alerts Right Panel Drawer */}
        <div className="w-full lg:w-96 bg-surface dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl flex flex-col shrink-0 shadow-sm overflow-hidden p-4 space-y-3">
          {/* Drawer tab switcher */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setRightDrawerTab("DAY_OPS")}
                className={cn(
                  "px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5",
                  rightDrawerTab === "DAY_OPS"
                    ? "bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                <CalendarIcon size={13} />
                <span>Dia {format(parse(selectedDayStr, "yyyy-MM-dd", new Date()), "dd/MM")}</span>
              </button>

              <button
                type="button"
                onClick={() => setRightDrawerTab("NOTIFICACOES")}
                className={cn(
                  "px-3 py-1 rounded text-xs font-bold transition-all flex items-center gap-1.5 relative",
                  rightDrawerTab === "NOTIFICACOES"
                    ? "bg-white dark:bg-gray-700 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                )}
              >
                <Bell size={13} />
                <span>Alertas</span>
                {operationalAlerts.length > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-black rounded-full bg-rose-500 text-white">
                    {operationalAlerts.length}
                  </span>
                )}
              </button>
            </div>

            <span className="text-[10px] text-gray-400 uppercase font-semibold">
              Restaurante SIGI
            </span>
          </div>

          {/* TAB 1: Day Operations */}
          {rightDrawerTab === "DAY_OPS" && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800">
                <div>
                  <span className="text-[10px] font-bold uppercase text-gray-400 block">Data Selecionada</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                    {format(parse(selectedDayStr, "yyyy-MM-dd", new Date()), "EEEE, dd 'de' MMMM", { locale: pt })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleQuickJumpToday}
                  className="px-2 py-1 text-[11px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/40 rounded hover:bg-orange-100 transition-colors"
                >
                  Ir para Hoje
                </button>
              </div>

              {isLoadingDayDetails ? (
                <div className="text-center py-8 text-gray-500 text-xs flex flex-col items-center">
                  <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                  A carregar planeamento do dia...
                </div>
              ) : (
                <>
                  {/* Eventos do Dia */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles size={12} className="text-orange-500" /> 
                        Eventos &amp; Salões ({selectedDayEventos.length})
                      </h4>
                      <Link 
                        to="/eventos" 
                        className="text-[10px] font-bold text-orange-600 hover:text-orange-500 flex items-center gap-0.5"
                      >
                        Ver todos <ChevronRight size={10} />
                      </Link>
                    </div>

                    {selectedDayEventos.length === 0 ? (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
                        <p className="text-[11px] text-gray-400 italic">Nenhum evento agendado para esta data.</p>
                        <Link 
                          to="/eventos/novo" 
                          className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-orange-600 hover:underline"
                        >
                          <Plus size={11} /> Criar Evento
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedDayEventos.map((e: any) => {
                          const parsedDate = parseEventoDateTime(e);
                          if (!parsedDate) return null;
                          const { startTimeStr, endTimeStr } = parsedDate;
                          return (
                            <div 
                              key={e.id} 
                              className="p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 text-xs space-y-1.5 shadow-sm"
                            >
                              <div className="flex justify-between items-start font-bold text-gray-900 dark:text-white">
                                <span className="line-clamp-1">{e.name || e.nome || e.titulo || `Evento #${e.id}`}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-200 dark:bg-orange-900/60 text-orange-800 dark:text-orange-200 font-extrabold shrink-0 ml-1">
                                  {e.status || e.estado || 'Confirmado'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-orange-800 dark:text-orange-300 font-semibold">
                                <span className="flex items-center gap-1">
                                  <Clock size={11} /> {startTimeStr}{endTimeStr ? ` - ${endTimeStr}` : ''}
                                </span>
                                {(e.guests || e.num_pessoas) && (
                                  <span className="font-bold">{e.guests || e.num_pessoas} pax</span>
                                )}
                              </div>
                              {(e.location || e.local) && (
                                <p className="text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                  🏛️ <span className="truncate">{e.location || e.local}</span>
                                </p>
                              )}
                              <div className="pt-1.5 flex justify-between items-center border-t border-orange-200/50 dark:border-orange-900/40">
                                <span className="text-[10px] text-gray-500">{getClientDisplayName(e.cliente_nome) || getClientDisplayName(e.cliente) || 'Cliente Geral'}</span>
                                <Link 
                                  to="/eventos" 
                                  className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-0.5"
                                >
                                  Detalhes <ExternalLink size={9} />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Pedidos Agendados a levantar/faturar */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                        <ShoppingBag size={12} className="text-blue-500" />
                        Pedidos Agendados ({selectedDayOrders.length})
                      </h4>
                      <Link 
                        to="/pedidos" 
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-500 flex items-center gap-0.5"
                      >
                        Ver todos <ChevronRight size={10} />
                      </Link>
                    </div>

                    {selectedDayOrders.length === 0 ? (
                      <div className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-200 dark:border-gray-800 text-center">
                        <p className="text-[11px] text-gray-400 italic">Sem pedidos de catering/balcão para este dia.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedDayOrders.map((o: any) => {
                          const { timeStr } = parsePedidoDateTime(o);
                          const total = Number(o.valor_total || o.total || 0);
                          const pago = Number(o.valor_pago || 0);
                          const diff = Math.max(0, total - pago);
                          const isPaid = diff <= 0;

                          return (
                            <div 
                              key={o.id} 
                              className={cn(
                                "p-3 rounded-xl border text-xs space-y-1.5 shadow-sm transition-all",
                                isPaid 
                                  ? "border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20"
                                  : "border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20"
                              )}
                            >
                              <div className="flex justify-between items-start font-bold text-gray-900 dark:text-gray-100">
                                <span className="line-clamp-1">#{o.id} - {getClientDisplayName(o.cliente) || getClientDisplayName(o.cliente_nome) || "Balcão"}</span>
                                <span className={cn(
                                  "text-[10px] px-2 py-0.5 rounded-full font-extrabold shrink-0 ml-1",
                                  isPaid 
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                                )}>
                                  {isPaid ? "Totalmente Pago" : `Falta ${formatCurrency(diff)}`}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold">
                                  <Clock size={11} /> Entrega: {timeStr}
                                </span>
                                <span className="text-[10px] bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded font-medium">
                                  {o.type || o.tipo_pedido || "Agendado"}
                                </span>
                              </div>

                              <div className="flex justify-between text-[10px] text-gray-500 pt-1 border-t border-gray-100 dark:border-gray-800">
                                <span>Total: <strong>{formatCurrency(total)}</strong></span>
                                <span>Sinal: <strong className="text-emerald-600">{formatCurrency(pago)}</strong></span>
                              </div>

                              {!isPaid && (
                                <button
                                  type="button"
                                  onClick={() => handleLiquidateBalance(o)}
                                  className="w-full mt-1.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white text-[11px] font-bold py-1.5 px-2 rounded-lg transition-all flex justify-center items-center gap-1 shadow-sm"
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

                  {/* Ordens de Produção & Cozinha */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <RefreshCw size={12} className="text-amber-500" />
                      Produção do Dia ({dayDetails?.producoes?.length || 0})
                    </h4>
                    {(!dayDetails?.producoes || dayDetails.producoes.length === 0) ? (
                      <p className="text-[11px] text-gray-400 italic">Sem ordens de produção para a cozinha.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {dayDetails.producoes.map((p: any) => (
                          <div key={p.id} className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15 text-[11px] flex justify-between items-center">
                            <div>
                              <span className="font-bold text-gray-800 dark:text-gray-200">OP #{p.numero || p.id}</span>
                              <span className="text-[10px] text-gray-500 block">Sector: {p.sector || 'Cozinha'}</span>
                            </div>
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              p.estado === 'Completado' || p.estado === 'Concluido' 
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" 
                                : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                            )}>
                              {p.estado || 'Em Preparo'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Entregas Programadas */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Truck size={12} className="text-emerald-500" />
                      Entregas &amp; Logística ({dayDetails?.entregas?.length || 0})
                    </h4>
                    {(!dayDetails?.entregas || dayDetails.entregas.length === 0) ? (
                      <p className="text-[11px] text-gray-400 italic">Sem entregas agendadas.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {dayDetails.entregas.map((d: any) => (
                          <div key={d.id} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 text-[11px]">
                            <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200">
                              <span>Entrega #{d.id}</span>
                              <span className="text-[9px] uppercase font-bold text-emerald-600">{d.estado}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-0.5">Destino: {d.local || 'Local do Cliente'}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Turnos da Equipa */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Users size={12} className="text-purple-500" />
                      Turnos &amp; Equipa Escalada ({dayDetails?.turnos?.length || 0})
                    </h4>
                    {(!dayDetails?.turnos || dayDetails.turnos.length === 0) ? (
                      <p className="text-[11px] text-gray-400 italic">Sem escala de turnos definida.</p>
                    ) : (
                      <div className="space-y-1 bg-purple-500/5 p-2 rounded-lg border border-purple-500/15">
                        {dayDetails.turnos.map((t: any, idx: number) => (
                          <div key={idx} className="text-[10px] flex justify-between py-1 font-medium text-gray-700 dark:text-gray-300 border-b border-purple-500/10 last:border-b-0">
                            <span>{getClientDisplayName(t.operador) || getClientDisplayName(t.nome) || 'Colaborador'}</span>
                            <span className="text-purple-600 font-bold">{t.estado || 'Ativo'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 2: Operational Notifications & Badges */}
          {rightDrawerTab === "NOTIFICACOES" && (
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <BadgeAlert size={14} className="text-rose-500" />
                  Notificações Operacionais
                </span>
                <Link
                  to="/notificacoes"
                  className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-0.5"
                >
                  Central Geral <ChevronRight size={10} />
                </Link>
              </div>

              {operationalAlerts.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs italic">
                  Tudo em dia! Sem alertas operacionais pendentes.
                </div>
              ) : (
                <div className="space-y-2">
                  {operationalAlerts.map((alert) => (
                    <div 
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-xl border text-xs space-y-1.5 shadow-sm transition-all",
                        alert.type === 'PAGAMENTO' 
                          ? "bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50" 
                          : alert.type === 'EVENTO'
                          ? "bg-orange-50/60 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/50"
                          : alert.type === 'PEDIDO'
                          ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50"
                          : "bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <div className="flex justify-between items-start gap-1 font-bold text-gray-900 dark:text-white">
                        <span className="line-clamp-1">{alert.title}</span>
                        <span className={cn(
                          "text-[9px] uppercase font-black px-1.5 py-0.2 rounded-full shrink-0",
                          alert.type === 'PAGAMENTO' ? "bg-rose-200 text-rose-800 dark:bg-rose-900 dark:text-rose-200" :
                          alert.type === 'EVENTO' ? "bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200" :
                          alert.type === 'PEDIDO' ? "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                          "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                        )}>
                          {alert.type}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed">
                        {alert.description}
                      </p>

                      <div className="flex justify-between items-center pt-1.5 border-t border-gray-200/50 dark:border-gray-700/50 text-[10px]">
                        <span className="text-gray-400 flex items-center gap-1 font-mono">
                          <Clock size={10} /> {alert.dateStr}{alert.timeStr ? ` ${alert.timeStr}` : ''}
                        </span>
                        
                        {alert.actionLink && (
                          <Link
                            to={alert.actionLink}
                            className="font-bold text-orange-600 hover:text-orange-500 hover:underline flex items-center gap-0.5"
                          >
                            {alert.actionText || 'Ver'} <ArrowRight size={10} />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

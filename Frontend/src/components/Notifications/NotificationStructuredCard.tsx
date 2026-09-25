import React, { useState } from 'react';
import {
  AppNotification,
  NotificationMetadata
} from '../../services/notifications';
import { NotificationIcon } from './NotificationIcon';
import { cn } from '../../lib/utils';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Trash2,
  Check,
  ArrowRight,
  Box,
  User,
  Tag,
  ChefHat
} from 'lucide-react';

export interface NotificationStructuredCardProps {
  notification: AppNotification;
  compact?: boolean;
  defaultExpanded?: boolean;
  onOpen?: (item: AppNotification) => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onSelectDetail?: (item: AppNotification) => void;
}

interface ParsedStructuredData {
  referencia?: string;
  cliente?: string;
  produtos?: string;
  transicao?: string;
  antigoEstado?: string;
  novoEstado?: string;
  setor?: string;
  pedidoRef?: string;
  introText?: string;
}

export function parseNotificationStructure(notification: AppNotification): ParsedStructuredData {
  const meta: NotificationMetadata = notification.data || notification.metadados || {};
  const msg = notification.message || '';

  const parsed: ParsedStructuredData = {};

  // 1. Tentar extrair do objeto de metadata
  if (meta.numero) parsed.referencia = meta.numero.startsWith('#') ? meta.numero : `#${meta.numero}`;
  if (meta.ordem_numero) parsed.referencia = meta.ordem_numero.startsWith('#') ? meta.ordem_numero : `#${meta.ordem_numero}`;
  if (meta.pedido_numero) parsed.pedidoRef = meta.pedido_numero.startsWith('#') ? meta.pedido_numero : `#${meta.pedido_numero}`;
  if (meta.cliente || meta.cliente_nome) parsed.cliente = meta.cliente || meta.cliente_nome;
  if (meta.produtos || meta.artigos) parsed.produtos = meta.produtos || meta.artigos;
  if (meta.sector) parsed.setor = meta.sector;
  if (meta.antigo_estado || meta.estado_anterior) parsed.antigoEstado = meta.antigo_estado || meta.estado_anterior;
  if (meta.novo_estado || meta.estado_novo) parsed.novoEstado = meta.novo_estado || meta.estado_novo;

  // 2. Extrair das linhas com marcadores da mensagem
  const lines = msg.split('\n');
  const nonBulletLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('• Cliente:') || trimmed.startsWith('- Cliente:')) {
      if (!parsed.cliente) parsed.cliente = trimmed.replace(/^[•-]\s*Cliente:\s*/i, '').trim();
    } else if (trimmed.startsWith('• Produtos:') || trimmed.startsWith('- Produtos:')) {
      if (!parsed.produtos) parsed.produtos = trimmed.replace(/^[•-]\s*Produtos:\s*/i, '').trim();
    } else if (trimmed.startsWith('• Artigos:') || trimmed.startsWith('- Artigos:')) {
      if (!parsed.produtos) parsed.produtos = trimmed.replace(/^[•-]\s*Artigos:\s*/i, '').trim();
    } else if (trimmed.startsWith('• Transição:') || trimmed.startsWith('- Transição:')) {
      parsed.transicao = trimmed.replace(/^[•-]\s*Transição:\s*/i, '').trim();
      const parts = parsed.transicao.split(/➔|->|→/);
      if (parts.length === 2) {
        if (!parsed.antigoEstado) parsed.antigoEstado = parts[0].trim();
        if (!parsed.novoEstado) parsed.novoEstado = parts[1].trim();
      }
    } else if (trimmed.startsWith('• Pedido:') || trimmed.startsWith('- Pedido:')) {
      if (!parsed.pedidoRef) parsed.pedidoRef = trimmed.replace(/^[•-]\s*Pedido:\s*/i, '').trim();
    } else if (trimmed.startsWith('• Total:') || trimmed.startsWith('- Total:')) {
      // Valor financeiro intencionalmente omitido da notificação a pedido do utilizador
    } else if (trimmed.length > 0) {
      nonBulletLines.push(trimmed);
    }
  }

  parsed.introText = nonBulletLines.join(' ');

  // Se não temos transição explícita mas temos antigo e novo estado
  if (!parsed.transicao && parsed.antigoEstado && parsed.novoEstado) {
    parsed.transicao = `${parsed.antigoEstado} ➔ ${parsed.novoEstado}`;
  }

  // Fallback para referência extraída do título
  if (!parsed.referencia) {
    const match = notification.title.match(/#(PED-[A-Za-z0-9-]+|OP-[A-Za-z0-9-]+|\d+)/i);
    if (match) {
      parsed.referencia = match[0];
    }
  }

  return parsed;
}

export function NotificationStructuredCard({
  notification,
  compact = false,
  defaultExpanded = false,
  onOpen,
  onMarkAsRead,
  onDelete,
  onSelectDetail,
}: NotificationStructuredCardProps) {
  const structured = parseNotificationStructure(notification);
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const formatTimeAgo = (isoDate: string) => {
    try {
      return formatDistanceToNow(parseISO(isoDate), { addSuffix: true, locale: pt });
    } catch {
      return 'recentemente';
    }
  };

  const canal = notification.canal || (
    notification.type.includes('pedido') ? 'PEDIDO' :
    notification.type.includes('producao') ? 'PRODUCAO' :
    notification.type.includes('stock') ? 'STOCK' :
    notification.type.includes('caixa') ? 'CAIXA' :
    'SISTEMA'
  );

  const canalBadgeColors: Record<string, string> = {
    PEDIDO: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    PRODUCAO: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    STOCK: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    CAIXA: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    REQUISICAO: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    EVENTOS: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    SISTEMA: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  };

  const hasStructuredDetails = Boolean(
    structured.referencia ||
    structured.cliente ||
    structured.produtos ||
    structured.transicao ||
    structured.setor
  );

  return (
    <div
      onClick={() => {
        if (onSelectDetail) onSelectDetail(notification);
        else if (onOpen) onOpen(notification);
      }}
      className={cn(
        "transition-all duration-150 relative group cursor-pointer",
        compact ? "p-3 sm:p-3.5" : "p-4 sm:p-5",
        !notification.read
          ? "bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary hover:bg-primary/10"
          : "hover:bg-gray-50/80 dark:hover:bg-gray-800/50 opacity-90 hover:opacity-100"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Ícone contextual */}
        <div className="shrink-0 pt-0.5">
          <NotificationIcon
            type={notification.type}
            priority={notification.priority}
            size={compact ? 18 : 20}
          />
        </div>

        {/* Conteúdo Principal */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Cabeçalho: Canal, Título, Prioridade e Tempo */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {/* Badge do Canal */}
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border",
                  canalBadgeColors[canal] || canalBadgeColors.SISTEMA
                )}
              >
                [{canal}]
              </span>

              {/* Título Padronizado */}
              <h4
                className={cn(
                  "font-bold truncate",
                  compact ? "text-xs" : "text-sm",
                  !notification.read ? "text-gray-900 dark:text-white" : "text-gray-800 dark:text-gray-200"
                )}
              >
                {notification.title}
              </h4>

              {/* Badges de Prioridade */}
              {notification.priority === 'critical' && (
                <span className="px-1.5 py-0.2 bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 text-[9px] font-black rounded uppercase">
                  Crítico
                </span>
              )}
              {notification.priority === 'high' && (
                <span className="px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 text-[9px] font-black rounded uppercase">
                  Alta
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 text-[10px] text-gray-400">
              <span>{formatTimeAgo(notification.timestamp)}</span>
              {!notification.read && (
                <span className="w-2 h-2 rounded-full bg-primary inline-block ml-1 animate-pulse" title="Nova notificação" />
              )}
            </div>
          </div>

          {/* Texto introdutório */}
          {structured.introText && (
            <p className={cn("text-gray-600 dark:text-gray-300 leading-relaxed", compact ? "text-xs line-clamp-2" : "text-xs sm:text-sm")}>
              {structured.introText}
            </p>
          )}

          {/* Botão de Extender / Recolher Detalhes */}
          {hasStructuredDetails && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title={isExpanded ? "Ocultar detalhes adicionais" : "Ver todos os detalhes da notificação"}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={13} />
                    <span>Recolher Detalhes</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={13} />
                    <span>Expandir Detalhes</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Bloco Estruturado Rico (Visível ao Extender) */}
          {hasStructuredDetails && isExpanded && (
            <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-200/80 dark:border-gray-800 rounded-xl p-2.5 sm:p-3 space-y-2 mt-1 shadow-2xs animate-in fade-in slide-in-from-top-1 duration-150">
              {/* Linha 1: Referência, Cliente e Setor (sem valores monetários) */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  {structured.referencia && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 font-mono font-bold text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-[11px]">
                      <Tag size={11} className="text-primary" />
                      Ref: {structured.referencia}
                    </span>
                  )}
                  {structured.pedidoRef && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-gray-800 font-mono font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 text-[11px]">
                      Pedido: {structured.pedidoRef}
                    </span>
                  )}
                  {structured.cliente && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 font-semibold text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 text-[11px]">
                      <User size={11} />
                      Cliente: {structured.cliente}
                    </span>
                  )}
                  {structured.setor && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 font-semibold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900 text-[11px]">
                      <ChefHat size={11} />
                      Setor: {structured.setor}
                    </span>
                  )}
                </div>
              </div>

              {/* Linha 2: Produtos / Artigos */}
              {structured.produtos && (
                <div className="text-xs text-gray-700 dark:text-gray-300 flex items-start gap-1.5 pt-0.5">
                  <Box size={13} className="text-primary mt-0.5 shrink-0" />
                  <span className="leading-snug">
                    <strong className="text-gray-900 dark:text-white font-semibold">Artigos:</strong> {structured.produtos}
                  </span>
                </div>
              )}

              {/* Linha 3: Transição de Estado */}
              {structured.transicao && (
                <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-gray-200/50 dark:border-gray-800/60">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Transição:</span>
                  {structured.antigoEstado && structured.novoEstado ? (
                    <div className="inline-flex items-center gap-1.5 font-bold">
                      <span className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px]">
                        {structured.antigoEstado}
                      </span>
                      <ArrowRight size={13} className="text-primary font-black" />
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[11px]">
                        {structured.novoEstado}
                      </span>
                    </div>
                  ) : (
                    <span className="font-semibold text-primary text-[11px]">{structured.transicao}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Rodapé com Ações */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100/60 dark:border-gray-800/40 text-xs">
            {notification.actionUrl ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpen) onOpen(notification);
                }}
                className="font-bold text-primary hover:text-primary-hover flex items-center gap-1 text-[11px] hover:underline"
              >
                <span>Ver no Sistema</span>
                <ChevronRight size={13} />
              </button>
            ) : (
              <span />
            )}

            <div className="flex items-center gap-1.5">
              {onMarkAsRead && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  className="p-1 text-gray-400 hover:text-primary rounded transition"
                  title={notification.read ? "Lida" : "Marcar como lida"}
                >
                  <Check size={14} className={notification.read ? "text-green-500" : ""} />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(notification.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 rounded transition opacity-0 group-hover:opacity-100"
                  title="Eliminar notificação"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

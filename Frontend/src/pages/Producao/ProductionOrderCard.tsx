import React from 'react';
import {
  Play,
  CheckCircle,
  Clock,
  ChefHat,
  AlertCircle,
  Undo2,
  Utensils,
  Cake,
  Wine,
  CheckCheck,
  User,
  Printer,
  FileText,
  Package,
  Layers,
  MapPin
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { printKitchenTicket } from './ProductionPrintTicket';

export interface ProductionOrderCardProps {
  order: any;
  type: 'pendente' | 'producao' | 'pronto' | 'entregue';
  now: Date;
  products: any[];
  requisitionsMap: Record<string | number, any>;
  onUpdateStatus: (id: string | number, novoEstado: string) => void;
  isUpdating: boolean;
  onOpenDetails: (order: any) => void;
}

export function extractOrderItems(order: any, productsList: any[] = []) {
  // 1. Caso haja lista explícita de itens / items
  const rawList = Array.isArray(order?.itens) && order.itens.length > 0
    ? order.itens
    : Array.isArray(order?.items) && order.items.length > 0
      ? order.items
      : null;

  if (rawList) {
    return rawList.map((item: any, idx: number) => {
      const pid = item.produto_id || item.productId || item.item_id;
      const matchedProd = productsList?.find((p: any) => String(p.id) === String(pid));
      const nome =
        item.produto_nome ||
        item.nome_produto ||
        item.nome ||
        item.descricao ||
        matchedProd?.nome ||
        `Produto #${pid || idx + 1}`;

      const quantidade = Number(item.quantidade ?? item.quantity ?? 1);
      const unidade = item.unidade || matchedProd?.unidade || '';
      const observacoes = item.observacoes || item.observacao || item.notas || '';

      return {
        id: item.id || `item-${idx}-${pid || Math.random()}`,
        produto_id: pid,
        nome,
        quantidade: isNaN(quantidade) || quantidade <= 0 ? 1 : quantidade,
        unidade,
        observacoes,
        categoria: matchedProd?.categoria || matchedProd?.categoria_nome || item.categoria || ''
      };
    });
  }

  // 1.5. Fallback para itens do Pedido Comercial pai (parentOrder)
  const parentList = Array.isArray(order?.parentOrder?.itens) && order.parentOrder.itens.length > 0
    ? order.parentOrder.itens
    : Array.isArray(order?.parentOrder?.items) && order.parentOrder.items.length > 0
      ? order.parentOrder.items
      : null;

  if (parentList) {
    const sectorLower = String(order.sector || order.setor || '').toLowerCase();
    const relevantItems = parentList.filter((item: any) => {
      if (!sectorLower || sectorLower === 'todos') return true;
      const pid = item.produto_id || item.productId || item.item_id;
      const matchedProd = productsList?.find((p: any) => String(p.id) === String(pid));
      const cat = String(matchedProd?.categoria || matchedProd?.categoria_nome || item.tipo_item || '').toLowerCase();
      if (sectorLower.includes('cozinh') && (cat.includes('cozinh') || cat.includes('prato') || cat.includes('refeic') || cat.includes('comida') || cat.includes('quente'))) return true;
      if (sectorLower.includes('pastel') && (cat.includes('pastel') || cat.includes('bolo') || cat.includes('doce') || cat.includes('sobremesa') || cat.includes('salgado'))) return true;
      if (sectorLower.includes('bar') && (cat.includes('bar') || cat.includes('bebid') || cat.includes('vinho') || cat.includes('sumo') || cat.includes('cocktail') || cat.includes('cerveja'))) return true;
      return true;
    });

    if (relevantItems.length > 0) {
      return relevantItems.map((item: any, idx: number) => {
        const pid = item.produto_id || item.productId || item.item_id;
        const matchedProd = productsList?.find((p: any) => String(p.id) === String(pid));
        const nome =
          item.descricao ||
          item.produto_nome ||
          item.nome_produto ||
          item.nome ||
          matchedProd?.nome ||
          `Produto #${pid || idx + 1}`;
        const quantidade = Number(item.quantidade ?? item.quantity ?? 1);
        const unidade = item.unidade || matchedProd?.unidade || '';
        const observacoes = item.observacoes || item.observacao || '';
        return {
          id: item.id || `parent-item-${idx}-${pid || Math.random()}`,
          produto_id: pid,
          nome,
          quantidade: isNaN(quantidade) || quantidade <= 0 ? 1 : quantidade,
          unidade,
          observacoes,
          categoria: matchedProd?.categoria || matchedProd?.categoria_nome || item.tipo_item || ''
        };
      });
    }
  }

  // 2. Se a ordem foi gerada para 1 produto principal (lote direto)
  if (order?.produto_nome || order?.produto_id || order?.nome_produto) {
    const pid = order.produto_id;
    const matchedProd = productsList?.find((p: any) => String(p.id) === String(pid));
    const nome = order.produto_nome || order.nome_produto || matchedProd?.nome || `Produto #${pid}`;
    const quantidade = Number(order.quantidade || order.quantidade_planeada || order.quantidade_prevista || 1);
    const unidade = order.unidade || matchedProd?.unidade || '';

    return [{
      id: order.id || 'single-item',
      produto_id: pid,
      nome,
      quantidade: isNaN(quantidade) || quantidade <= 0 ? 1 : quantidade,
      unidade,
      observacoes: order.observacoes || '',
      categoria: matchedProd?.categoria || matchedProd?.categoria_nome || ''
    }];
  }

  // 3. Fallback: Se não houver itens cadastrados, mas houver consumos
  if (Array.isArray(order?.consumos) && order.consumos.length > 0) {
    return [{
      id: 'fallback-prep',
      produto_id: null,
      nome: order.descricao || order.titulo || `Ordem de Preparo #${order.numero || order.id}`,
      quantidade: 1,
      unidade: 'lote',
      observacoes: order.observacoes || '',
      categoria: order.sector || ''
    }];
  }

  return [];
}

export function extractOrderConsumos(order: any) {
  if (!Array.isArray(order?.consumos) || order.consumos.length === 0) {
    return [];
  }

  return order.consumos.map((c: any, idx: number) => ({
    id: c.id || `consumo-${idx}`,
    nome: c.ingrediente_nome || c.nome_ingrediente || c.nome || c.material_nome || 'Ingrediente',
    quantidade_prevista: Number(c.quantidade_prevista ?? c.quantidade ?? 0),
    quantidade_real: c.quantidade_real !== undefined ? Number(c.quantidade_real) : null,
    unidade: c.ingrediente_unidade || c.unidade || ''
  }));
}

export const ProductionOrderCard: React.FC<ProductionOrderCardProps> = ({
  order,
  type,
  now,
  products,
  requisitionsMap,
  onUpdateStatus,
  isUpdating,
  onOpenDetails
}) => {
  const items = extractOrderItems(order, products);
  const consumos = extractOrderConsumos(order);

  // Setor e ícones
  const sector = order.sector || order.setor || 'Cozinha';
  const renderSectorIcon = () => {
    switch (sector) {
      case 'Pastelaria':
        return <Cake size={14} className="text-pink-600 dark:text-pink-400" />;
      case 'Bar':
        return <Wine size={14} className="text-purple-600 dark:text-purple-400" />;
      case 'Cozinha':
      default:
        return <Utensils size={14} className="text-amber-600 dark:text-amber-400" />;
    }
  };

  // Cálculo do tempo decorrido
  const timestamp = type === 'producao'
    ? (order.hora_inicio || order.data_inicio || order.created_at)
    : order.created_at;

  const getTempo = () => {
    if (!timestamp) {
      return { mins: 0, text: type === 'pendente' ? 'Aguardando' : 'Sem registo' };
    }
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 0) return { mins: 0, text: 'Agendada' };
    if (diffMins < 1) return { mins: 0, text: 'Agora mesmo' };
    return { mins: diffMins, text: `${diffMins} min` };
  };

  const tempo = getTempo();
  const isAtrasado = type === 'pendente' && tempo.mins >= 15;
  const isMuitoAtrasado = type === 'pendente' && tempo.mins >= 30;

  // Requisição de Armazém
  const reqId = order.requisicao_id || order.requisicaoId;
  const matchedReq = reqId ? requisitionsMap[reqId] : null;
  const reqStatus = (
    matchedReq?.estado ||
    order.requisicao_status ||
    order.requisicao_estado ||
    ''
  ).toString().trim();

  const reqStatusLower = reqStatus.toLowerCase();
  const hasPendingRequisition =
    reqId &&
    reqStatus &&
    !['em uso', 'entregue', 'devolvido', 'finalizado', 'concluido', 'fechado'].includes(reqStatusLower);

  // Cliente / Pedido de Origem
  const orderNumber = order.numero || order.codigo || `#${order.id}`;
  const pedidoNumero = order.pedido_numero || order.parentOrder?.numero || (order.pedido_id ? `#${order.pedido_id}` : null);
  const clienteNome =
    (typeof order.cliente_nome === 'string' && order.cliente_nome.trim() ? order.cliente_nome : null) ||
    (typeof order.cliente === 'string' && order.cliente.trim() ? order.cliente : null) ||
    order.cliente?.nome ||
    order.parentOrder?.cliente?.nome ||
    order.parentOrder?.cliente_nome ||
    null;
  const mesaInfo = order.mesa || order.local || order.mesa_numero || order.parentOrder?.mesa || null;
  const dataEntrega = order.data_entrega || order.parentOrder?.data_entrega || null;
  const horaEntrega = order.hora_entrega || order.parentOrder?.hora_entrega || null;

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    printKitchenTicket({ order, items, consumos });
  };

  return (
    <div
      className={cn(
        'group bg-white dark:bg-surface-dark rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md',
        type === 'pendente' && 'border-gray-200 dark:border-border-dark hover:border-gray-300 dark:hover:border-gray-700',
        type === 'producao' && 'border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-400/20 bg-amber-50/20 dark:bg-amber-950/20',
        type === 'pronto' && 'border-emerald-300 dark:border-emerald-700/60 ring-1 ring-emerald-400/20 bg-emerald-50/20 dark:bg-emerald-950/20',
        type === 'entregue' && 'border-gray-200 dark:border-border-dark opacity-85 hover:opacity-100',
        isAtrasado && 'border-rose-400 dark:border-rose-700 ring-2 ring-rose-500/20'
      )}
    >
      {/* Top Banner de Alerta se Atrasado */}
      {isAtrasado && (
        <div className="bg-rose-600 text-white text-[11px] font-bold px-3 py-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertCircle size={13} className="animate-pulse" />
            {isMuitoAtrasado ? 'ATENÇÃO: ATRASO CRÍTICO (+30 min)' : 'PEDIDO EM ATRASO NA FILA'}
          </span>
          <span>{tempo.text}</span>
        </div>
      )}

      {/* Conteúdo Principal do Card */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Cabeçalho do Card */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                {orderNumber}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/80 px-2 py-0.5 rounded-md border border-gray-200/50 dark:border-gray-700/50">
                {renderSectorIcon()}
                <span>{sector}</span>
              </span>
            </div>

            {/* Metadados: Pedido, Cliente, Mesa, Horário */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-1 flex-wrap">
              {pedidoNumero && (
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  Pedido {pedidoNumero}
                </span>
              )}
              {pedidoNumero && (clienteNome || mesaInfo) && <span aria-hidden="true">·</span>}
              {mesaInfo && (
                <span className="flex items-center gap-1 text-primary font-semibold">
                  <MapPin size={11} /> Mesa {mesaInfo}
                </span>
              )}
              {mesaInfo && clienteNome && <span aria-hidden="true">·</span>}
              {clienteNome && (
                <span className="truncate max-w-[160px] text-gray-600 dark:text-gray-300 font-medium">
                  {clienteNome}
                </span>
              )}
              {(horaEntrega || dataEntrega) && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">
                    <Clock size={11} /> {horaEntrega ? horaEntrega.slice(0, 5) : dataEntrega}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Botão de Impressão Rápida da Comanda */}
          <button
            onClick={handlePrint}
            title="Imprimir comanda térmica (80mm)"
            className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0"
          >
            <Printer size={16} />
          </button>
        </div>

        {/* Linha de Tempo / Responsável */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800/80 px-3 py-2 rounded-xl mb-3">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock size={13} className={isAtrasado ? 'text-rose-600' : 'text-primary'} />
            <span>
              {type === 'pendente' && `Em espera: ${tempo.text}`}
              {type === 'producao' && `Em preparo há ${tempo.text}`}
              {type === 'pronto' && `Pronto há ${tempo.text}`}
              {type === 'entregue' && `Finalizado`}
            </span>
          </div>

          {order.responsavel_nome && (
            <div className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300">
              <User size={11} />
              <span className="truncate max-w-[120px]">{order.responsavel_nome}</span>
            </div>
          )}
        </div>

        {/* Observações da Ordem ou do Pedido */}
        {(order.observacoes || order.observacoes_pedido) && (
          <div className="mb-3 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-xs text-amber-950 dark:text-amber-200">
            <span className="font-bold text-[10px] uppercase tracking-wider block text-amber-800 dark:text-amber-400 mb-0.5">
              Observação / Instrução:
            </span>
            <p className="font-medium leading-relaxed">
              {order.observacoes || order.observacoes_pedido}
            </p>
          </div>
        )}

        {/* LISTA DE PRODUTOS A PREPARAR */}
        <div className="flex-1 bg-gray-50/80 dark:bg-gray-900/70 rounded-xl p-3.5 border border-gray-200/80 dark:border-gray-800 mb-3">
          <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5">
            <span className="flex items-center gap-1.5">
              <Package size={13} className="text-primary" />
              Produtos do Pedido ({items.length})
            </span>
            {consumos.length > 0 && (
              <span className="text-[10px] font-normal text-gray-400 dark:text-gray-400">
                {consumos.length} matérias-primas
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-400 italic py-2">
              Nenhum item discriminado nesta ordem.
            </p>
          ) : (
            <div className="space-y-2.5">
              {items.map((it: any, idx: number) => (
                <div
                  key={it.id || idx}
                  className="flex items-start justify-between gap-2 pb-2.5 border-b border-gray-200/60 dark:border-gray-800 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="inline-flex items-center justify-center font-black text-sm text-primary dark:text-white bg-primary/10 dark:bg-primary/30 px-2 py-0.5 rounded-md shrink-0">
                      {it.quantidade}x
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                        {it.nome}
                      </p>
                      {it.observacoes && (
                        <p className="text-xs text-amber-700 dark:text-amber-300 italic mt-0.5">
                          Nota: {it.observacoes}
                        </p>
                      )}
                    </div>
                  </div>
                  {it.unidade && (
                    <span className="text-xs text-gray-400 dark:text-gray-400 shrink-0 font-medium">
                      {it.unidade}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Informação sobre Requisição de Ingredientes */}
        {reqId && (
          <div
            className={cn(
              'mb-3 p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2',
              hasPendingRequisition
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300'
            )}
          >
            <div className="flex items-center gap-1.5 font-medium truncate">
              <Layers size={13} className="shrink-0" />
              <span>Requisição REQ-{reqId}:</span>
              <span className="font-bold">{reqStatus || 'Pendente'}</span>
            </div>
            {hasPendingRequisition && (
              <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">
                Aguardando
              </span>
            )}
          </div>
        )}

        {/* Link / Botão para Abrir Modal Completa */}
        <button
          onClick={() => onOpenDetails(order)}
          className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 self-start transition-colors py-1"
        >
          <FileText size={13} />
          Ver ficha técnica, receita e consumos
        </button>
      </div>

      {/* AÇÕES DE MUDANÇA DE ESTADO NO RODAPÉ DO CARD */}
      <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-100 dark:border-gray-800">
        {type === 'pendente' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'Em Producao')}
            disabled={isUpdating}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white dark:bg-primary dark:hover:bg-primary-hover dark:text-white min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-bold shadow-xs active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Play size={16} />
            <span>Iniciar Preparação</span>
          </button>
        )}

        {type === 'producao' && (
          <div>
            {hasPendingRequisition ? (
              <div className="space-y-2">
                <div className="flex items-start gap-1.5 p-2 bg-amber-100/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-medium">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>Aguardando entrega de materiais pelo armazém (REQ-{reqId}).</span>
                </div>
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-400 min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-bold cursor-not-allowed border border-dashed border-gray-300 dark:border-gray-700"
                >
                  <CheckCircle size={16} />
                  <span>Marcar como Pronto (Bloqueado)</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onUpdateStatus(order.id, 'Pronto')}
                disabled={isUpdating}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <CheckCircle size={16} />
                <span>Marcar como Pronto</span>
              </button>
            )}
          </div>
        )}

        {type === 'pronto' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => onUpdateStatus(order.id, 'Entregue')}
              disabled={isUpdating}
              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold shadow-xs active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <CheckCheck size={16} />
              <span>Entregar ao Garçom</span>
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'Em Producao')}
              disabled={isUpdating}
              className="flex items-center justify-center gap-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 min-h-[44px] py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Undo2 size={15} />
              <span>Voltar a Preparar</span>
            </button>
          </div>
        )}

        {type === 'entregue' && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCheck size={16} />
              <span>Entregue e Finalizado</span>
            </div>
            <button
              onClick={() => onUpdateStatus(order.id, 'Pronto')}
              disabled={isUpdating}
              className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white underline font-medium"
            >
              Reabrir ordem
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import {
  X,
  Printer,
  ChefHat,
  Utensils,
  Cake,
  Wine,
  Clock,
  User,
  MapPin,
  Calendar,
  Layers,
  Package,
  AlertCircle,
  CheckCircle,
  Play,
  CheckCheck,
  Undo2,
  FileText
} from 'lucide-react';
import Modal from '../../components/Common/Modal';
import { extractOrderItems, extractOrderConsumos } from './ProductionOrderCard';
import { printKitchenTicket } from './ProductionPrintTicket';
import { cn } from '../../lib/utils';

export interface ProductionOrderModalProps {
  order: any | null;
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  requisitionsMap: Record<string | number, any>;
  onUpdateStatus: (id: string | number, novoEstado: string) => void;
  isUpdating: boolean;
}

export const ProductionOrderModal: React.FC<ProductionOrderModalProps> = ({
  order,
  isOpen,
  onClose,
  products,
  requisitionsMap,
  onUpdateStatus,
  isUpdating
}) => {
  if (!order) return null;

  const items = extractOrderItems(order, products);
  const consumos = extractOrderConsumos(order);

  const sector = order.sector || order.setor || 'Cozinha';
  const renderSectorIcon = () => {
    switch (sector) {
      case 'Pastelaria':
        return <Cake size={16} className="text-pink-600 dark:text-pink-400" />;
      case 'Bar':
        return <Wine size={16} className="text-purple-600 dark:text-purple-400" />;
      case 'Cozinha':
      default:
        return <Utensils size={16} className="text-amber-600 dark:text-amber-400" />;
    }
  };

  const normalizeEstado = (st: any) => {
    const raw = String(st?.value || st || '').trim().toUpperCase();
    if (raw.includes('PRODUCAO') || raw.includes('PREPARACAO')) return 'Em Producao';
    if (raw.includes('PRONTO')) return 'Pronto';
    if (raw.includes('ENTREGUE') || raw.includes('CONCLUIDO')) return 'Entregue';
    return 'Pendente';
  };

  const estado = normalizeEstado(order.estado || order.status);
  const orderNumber = order.numero || order.codigo || `#${order.id}`;
  const pedidoNumero = order.pedido_numero || order.parentOrder?.numero || (order.pedido_id ? `#${order.pedido_id}` : 'Avulso');
  const clienteNome =
    (typeof order.cliente_nome === 'string' && order.cliente_nome.trim() ? order.cliente_nome : null) ||
    (typeof order.cliente === 'string' && order.cliente.trim() ? order.cliente : null) ||
    order.cliente?.nome ||
    order.parentOrder?.cliente?.nome ||
    order.parentOrder?.cliente_nome ||
    'Balcão';
  const mesaInfo = order.mesa || order.local || order.mesa_numero || order.parentOrder?.mesa || null;
  const dataEntrega = order.data_entrega || order.parentOrder?.data_entrega || order.data_producao || '';
  const horaEntrega = order.hora_entrega || order.parentOrder?.hora_entrega || '';

  // Requisição de Armazém
  const reqId = order.requisicao_id || order.requisicaoId;
  const matchedReq = reqId ? requisitionsMap[reqId] : null;
  const reqStatus = (matchedReq?.estado || order.requisicao_status || order.requisicao_estado || '').toString().trim();
  const reqStatusLower = reqStatus.toLowerCase();
  const hasPendingRequisition =
    reqId &&
    reqStatus &&
    !['em uso', 'entregue', 'devolvido', 'finalizado', 'concluido', 'fechado'].includes(reqStatusLower);

  const handlePrint = () => {
    printKitchenTicket({ order, items, consumos });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Cabeçalho Customizado Rico */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Ordem {orderNumber}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                {renderSectorIcon()}
                <span>{sector}</span>
              </span>
              <span
                className={cn(
                  'text-xs font-bold px-2.5 py-1 rounded-md',
                  estado === 'Pendente' && 'bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300',
                  estado === 'Em Producao' && 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300',
                  estado === 'Pronto' && 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300',
                  estado === 'Entregue' && 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                )}
              >
                {estado === 'Em Producao' ? 'Em Preparação' : estado}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Origem: Pedido {pedidoNumero} {mesaInfo ? `· Mesa ${mesaInfo}` : ''} · Cliente: {clienteNome}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl transition-colors"
            >
              <Printer size={15} />
              <span>Imprimir Comanda</span>
            </button>
          </div>
        </div>

        {/* Grade de Metadados / Informações Operacionais */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
              Pedido de Origem
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {pedidoNumero}
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
              Cliente / Local
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate block">
              {clienteNome} {mesaInfo ? `(Mesa ${mesaInfo})` : ''}
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
              Início / Registo
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {order.hora_inicio || order.created_at ? new Date(order.hora_inicio || order.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-100 dark:border-gray-800">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
              Entrega Prevista
            </span>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 truncate block">
              {horaEntrega ? `${horaEntrega.slice(0, 5)} (${dataEntrega || 'Hoje'})` : (dataEntrega || 'Imediata')}
            </span>
          </div>
        </div>

        {/* SEÇÃO 1: PRODUTOS A PREPARAR */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Package size={16} className="text-primary" />
              Produtos da Ordem ({items.length})
            </h3>
            <span className="text-xs text-gray-400 font-medium">
              Itens a confecionar na cozinha / posto
            </span>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="py-2.5 px-4 w-24">Qtd.</th>
                  <th className="py-2.5 px-4">Produto / Descrição</th>
                  <th className="py-2.5 px-4">Categoria / Unidade</th>
                  <th className="py-2.5 px-4">Instruções de Preparo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400 text-xs italic">
                      Nenhum produto individual discriminado nesta ordem.
                    </td>
                  </tr>
                ) : (
                  items.map((it: any, idx: number) => (
                    <tr key={it.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                      <td className="py-3 px-4 font-black text-base text-primary">
                        {it.quantidade}x
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">
                        {it.nome}
                      </td>
                      <td className="py-3 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {it.categoria || 'Geral'} {it.unidade ? `· ${it.unidade}` : ''}
                      </td>
                      <td className="py-3 px-4 text-xs text-amber-700 dark:text-amber-400 font-medium">
                        {it.observacoes ? `➥ ${it.observacoes}` : <span className="text-gray-400 font-normal">Padrão</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SEÇÃO 2: FICHA TÉCNICA E CONSUMOS PREVISTOS (MATÉRIAS-PRIMAS) */}
        {consumos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-indigo-600 dark:text-indigo-400" />
                Ficha Técnica / Matérias-Primas ({consumos.length})
              </h3>
              {reqId && (
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  Requisição de Armazém: REQ-{reqId} ({reqStatus || 'Pendente'})
                </span>
              )}
            </div>

            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 text-xs uppercase font-semibold border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="py-2 px-4">Ingrediente / Material</th>
                    <th className="py-2 px-4 w-32 text-right">Qtd. Prevista</th>
                    <th className="py-2 px-4 w-28">Unidade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                  {consumos.map((c: any, idx: number) => (
                    <tr key={c.id || idx}>
                      <td className="py-2.5 px-4 font-semibold text-gray-800 dark:text-gray-200">
                        {c.nome}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-right text-gray-900 dark:text-white">
                        {c.quantidade_prevista}
                      </td>
                      <td className="py-2.5 px-4 text-gray-400 font-medium">
                        {c.unidade || 'un'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEÇÃO 3: OBSERVAÇÕES E NOTAS */}
        {(order.observacoes || order.observacoes_pedido) && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-xl">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertCircle size={14} /> Observações Especiais
            </h4>
            <p className="text-sm font-medium text-amber-900 dark:text-amber-200 leading-relaxed">
              {order.observacoes || order.observacoes_pedido}
            </p>
          </div>
        )}

        {/* BARRA DE AÇÃO RÁPIDA NO RODAPÉ */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-semibold transition-colors"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            {estado === 'Pendente' && (
              <button
                onClick={() => {
                  onUpdateStatus(order.id, 'Em Producao');
                  onClose();
                }}
                disabled={isUpdating}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
              >
                <Play size={16} />
                <span>Iniciar Preparação</span>
              </button>
            )}

            {estado === 'Em Producao' && (
              <button
                onClick={() => {
                  onUpdateStatus(order.id, 'Pronto');
                  onClose();
                }}
                disabled={isUpdating || Boolean(hasPendingRequisition)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <CheckCircle size={16} />
                <span>Marcar como Pronto</span>
              </button>
            )}

            {estado === 'Pronto' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    onUpdateStatus(order.id, 'Entregue');
                    onClose();
                  }}
                  disabled={isUpdating}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50"
                >
                  <CheckCheck size={16} />
                  <span>Entregar ao Garçom</span>
                </button>
                <button
                  onClick={() => {
                    onUpdateStatus(order.id, 'Em Producao');
                    onClose();
                  }}
                  disabled={isUpdating}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-semibold transition-colors"
                >
                  <Undo2 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

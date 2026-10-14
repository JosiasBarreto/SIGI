// src/utils/notificationUtils.ts
// Lógica de Consolidação (Upsert) no Frontend conforme a Secção 4 do Relatório de Notificações

import { AppNotification, NotificationHistoryEntry, UpsertNotificationPayload } from '../types/notifications';

/**
 * Consolida ou insere uma notificação na lista sem criar duplicados.
 * Identifica a entidade pela chave composta `${entityType}_${entityId}`.
 * Se já existir:
 *  - Atualiza o estado atual, mensagem atual, tipo e prioridade.
 *  - Anexa uma nova entrada ao histórico de transições de estado.
 *  - Marca como não lida (`lida: false`) para chamar a atenção do operador.
 *  - Move para o topo da lista.
 * Se não existir:
 *  - Cria a notificação inicial com o histórico inicial e coloca no topo.
 */
export function upsertNotification(
  listaAtual: AppNotification[],
  novaOuAtualizada: UpsertNotificationPayload
): AppNotification[] {
  const chave = String(novaOuAtualizada.notificationId || `${novaOuAtualizada.entityType}_${novaOuAtualizada.entityId}`);
  const agora = new Date().toISOString();
  const index = listaAtual.findIndex((n) => n.id === chave);

  if (index !== -1) {
    // ATUALIZAÇÃO DA NOTIFICAÇÃO EXISTENTE (SEM DUPLICAR)
    const existente = listaAtual[index];
    const historicoAtualizado: NotificationHistoryEntry[] = [
      ...(existente.historico || []),
      {
        estado: novaOuAtualizada.novoEstado,
        timestamp: agora,
        mensagem: novaOuAtualizada.mensagem,
        autor: novaOuAtualizada.autor,
      },
    ];

    const atualizada: AppNotification = {
      ...existente,
      estadoAtual: novaOuAtualizada.novoEstado,
      mensagemAtual: novaOuAtualizada.mensagem,
      tipo: novaOuAtualizada.tipo || existente.tipo || 'info',
      prioridade: novaOuAtualizada.prioridade || existente.prioridade || 'media',
      atualizadaEm: agora,
      lida: false, // Torna não lida para chamar a atenção
      historico: historicoAtualizado,
      actionUrl: novaOuAtualizada.actionUrl || existente.actionUrl,
      data: novaOuAtualizada.data || existente.data,

      // Campos retrocompatíveis
      title: existente.titulo,
      message: novaOuAtualizada.mensagem,
      read: false,
      priority: novaOuAtualizada.prioridade === 'alta' ? 'high' : novaOuAtualizada.prioridade === 'baixa' ? 'low' : 'normal',
      type: existente.type || `${novaOuAtualizada.entityType}_${novaOuAtualizada.novoEstado}`.toLowerCase(),
      timestamp: agora,
    };

    // Remove do ponto atual e move para o topo da lista
    const novaLista = [...listaAtual];
    novaLista.splice(index, 1);
    return [atualizada, ...novaLista];
  } else {
    // NOVA NOTIFICAÇÃO INICIAL
    const titulo = `${novaOuAtualizada.entityType.toUpperCase()}: ${novaOuAtualizada.referencia}`;
    const nova: AppNotification = {
      id: chave,
      entityType: novaOuAtualizada.entityType,
      entityId: novaOuAtualizada.entityId,
      referencia: novaOuAtualizada.referencia,
      titulo,
      mensagemAtual: novaOuAtualizada.mensagem,
      estadoAtual: novaOuAtualizada.novoEstado,
      tipo: novaOuAtualizada.tipo || 'info',
      prioridade: novaOuAtualizada.prioridade || 'media',
      lida: false,
      criadaEm: agora,
      atualizadaEm: agora,
      historico: [
        {
          estado: novaOuAtualizada.novoEstado,
          timestamp: agora,
          mensagem: novaOuAtualizada.mensagem,
          autor: novaOuAtualizada.autor,
        },
      ],
      actionUrl: novaOuAtualizada.actionUrl,
      data: novaOuAtualizada.data,

      // Campos retrocompatíveis
      title: titulo,
      message: novaOuAtualizada.mensagem,
      read: false,
      priority: novaOuAtualizada.prioridade === 'alta' ? 'high' : novaOuAtualizada.prioridade === 'baixa' ? 'low' : 'normal',
      type: `${novaOuAtualizada.entityType}_${novaOuAtualizada.novoEstado}`.toLowerCase(),
      timestamp: agora,
    };
    return [nova, ...listaAtual];
  }
}

/**
 * Emite som discreto de alerta ou sino (usado especialmente no estado "Pronto")
 */
export function playNotificationSound(soundType: 'bell' | 'chime' | 'default' = 'default') {
  if (typeof window === 'undefined') return;

  // 1. Tentar áudio MP3
  try {
    const audio = new Audio('/sounds/bell-ring.mp3');
    audio.volume = 0.7;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        playSynthBeep(soundType);
      });
    }
  } catch {
    playSynthBeep(soundType);
  }
}

/**
 * Fallback de sintetizador Web Audio se o arquivo MP3 não estiver presente ou bloqueado
 */
function playSynthBeep(type: 'bell' | 'chime' | 'default') {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;

    if (type === 'bell') {
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.6);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.1); // A5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {}
}

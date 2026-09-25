export class NotificationDeduplicator {
  // Mapa de chaves para timestamp em milissegundos
  private processedKeys: Map<string, number> = new Map();
  // Janela de retenção para deduplicação (30 segundos)
  private readonly TTL_MS = 30000;
  // Limite máximo de entradas em memória
  private readonly MAX_ENTRIES = 1000;

  /**
   * Verifica se o evento já foi processado recentemente
   */
  public isDuplicate(eventId?: string, fallbackKey?: string): boolean {
    const now = Date.now();
    this.cleanup(now);

    // 1. Verificação primária por event_id determinístico
    if (eventId && this.hasValidKey(`evt:${eventId}`, now)) {
      return true;
    }

    // 2. Verificação secundária por chave de fallback semântica
    if (fallbackKey && this.hasValidKey(`fb:${fallbackKey}`, now)) {
      return true;
    }

    return false;
  }

  /**
   * Marca o evento como processado
   */
  public markProcessed(eventId?: string, fallbackKey?: string): void {
    const now = Date.now();

    if (eventId) {
      this.processedKeys.set(`evt:${eventId}`, now);
    }

    if (fallbackKey) {
      this.processedKeys.set(`fb:${fallbackKey}`, now);
    }

    if (this.processedKeys.size > this.MAX_ENTRIES) {
      this.cleanup(now, true);
    }
  }

  /**
   * Constrói uma chave semântica de fallback baseada nos atributos da entidade
   */
  public buildSemanticFallbackKey(
    eventType?: string,
    entityType?: string,
    entityId?: string | number,
    status?: string,
    title?: string,
    message?: string
  ): string {
    if (entityType && entityId) {
      const st = status ? `:${status}` : '';
      const et = eventType ? `${eventType}:` : '';
      return `${et}${entityType}:${entityId}${st}`;
    }

    return `${eventType || 'notif'}:${title || ''}:${message || ''}`;
  }

  private hasValidKey(key: string, now: number): boolean {
    const timestamp = this.processedKeys.get(key);
    if (!timestamp) return false;
    if (now - timestamp > this.TTL_MS) {
      this.processedKeys.delete(key);
      return false;
    }
    return true;
  }

  private cleanup(now: number, force: boolean = false): void {
    if (force || this.processedKeys.size > 200) {
      for (const [k, timestamp] of this.processedKeys.entries()) {
        if (now - timestamp > this.TTL_MS) {
          this.processedKeys.delete(k);
        }
      }
    }
  }

  public clear(): void {
    this.processedKeys.clear();
  }
}

export const notificationDeduplicator = new NotificationDeduplicator();

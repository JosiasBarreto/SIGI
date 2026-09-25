import time
import threading
from typing import Dict, Optional, Tuple


class DeduplicationManager:
    """
    Gerenciador de Idempotência e Desduplicação de Eventos e Notificações.
    Mantém uma janela deslizante em memória com expiração (TTL) para evitar
    processamento duplicado concorrente ou em loops imediatos.
    """

    def __init__(self, default_ttl_seconds: int = 45):
        self.default_ttl = default_ttl_seconds
        self._lock = threading.Lock()
        # Chave -> (timestamp_de_registro, payload_hash/event_id)
        self._processed_keys: Dict[str, Tuple[float, str]] = {}

    def _cleanup_expired(self, now: float) -> None:
        """Remove chaves cuja janela temporal já expirou"""
        expired = [k for k, (ts, _) in self._processed_keys.items() if now - ts > self.default_ttl]
        for k in expired:
            self._processed_keys.pop(k, None)

    def generate_idempotency_key(
        self,
        event_type: str,
        aggregate_id: str,
        extra_discriminator: Optional[str] = None
    ) -> str:
        """
        Gera uma chave lógica previsível para o evento de negócio.
        Ex: ORDER_CREATED:PEDIDO:145 ou ORDER_STATUS_CHANGED:PEDIDO:145:EM_PRODUCAO
        """
        base = f"{event_type}:{aggregate_id}"
        if extra_discriminator:
            base = f"{base}:{extra_discriminator}"
        return base

    def is_duplicate(
        self,
        key: str,
        event_id: str,
        ttl_seconds: Optional[int] = None
    ) -> bool:
        """
        Verifica se a chave já foi processada recentemente.
        Se não foi, registra a chave e retorna False (não é duplicado).
        Se já foi, retorna True (é duplicado).
        """
        now = time.time()
        ttl = ttl_seconds or self.default_ttl

        with self._lock:
            self._cleanup_expired(now)

            if key in self._processed_keys:
                last_time, existing_event_id = self._processed_keys[key]
                if now - last_time < ttl:
                    # É duplicado
                    return True

            # Registrar chave
            self._processed_keys[key] = (now, event_id)
            return False

    def clear(self) -> None:
        """Limpa todo o histórico em memória (útil para testes)"""
        with self._lock:
            self._processed_keys.clear()


# Instância singleton global para uso pela aplicação
deduplicator = DeduplicationManager()

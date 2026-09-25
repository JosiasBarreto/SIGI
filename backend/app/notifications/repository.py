import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.core.database import db
from app.models.notificacao import Notificacao, NotificacaoLeitura

logger = logging.getLogger(__name__)


class NotificationRepository:
    """
    Camada de persistência para Notificações com integridade referencial,
    rastreio de eventos (event_id, aggregate_id) e proteção contra inserções duplicadas.
    """

    @staticmethod
    def exists_by_event_and_recipient(
        event_id: str,
        recipient_user_id: Optional[int] = None
    ) -> bool:
        """Verifica se já existe registo persistido para este event_id e destinatário"""
        try:
            query = Notificacao.query.filter_by(event_id=event_id)
            if recipient_user_id:
                query = query.filter_by(recipient_user_id=recipient_user_id)
            return query.first() is not None
        except Exception as e:
            logger.debug(f"Verificação de existência de notificação: {e}")
            return False

    @staticmethod
    def exists_by_aggregate_and_type(
        aggregate_id: str,
        event_type: str,
        recipient_user_id: Optional[int] = None
    ) -> bool:
        """Verifica se já existe notificação para este agregado e tipo de evento"""
        try:
            query = Notificacao.query.filter_by(aggregate_id=aggregate_id, event_type=event_type)
            if recipient_user_id:
                query = query.filter_by(recipient_user_id=recipient_user_id)
            return query.first() is not None
        except Exception as e:
            logger.debug(f"Verificação de existência por aggregate: {e}")
            return False

    @staticmethod
    def create_notification(
        event_id: str,
        event_type: str,
        entity_type: str,
        entity_id: Optional[int],
        aggregate_id: str,
        titulo: str,
        mensagem: str,
        tipo: str = "info",
        canal: str = "SISTEMA",
        prioridade: str = "media",
        persistente: bool = False,
        target_type: str = "GLOBAL",
        target_role: Optional[str] = None,
        target_sector: Optional[str] = None,
        target_user_id: Optional[int] = None,
        actor_user_id: Optional[int] = None,
        recipient_user_id: Optional[int] = None,
        recipient_role: Optional[str] = None,
        metadados: Optional[Dict[str, Any]] = None,
        created_by: Optional[int] = None
    ) -> Optional[Notificacao]:
        """
        Cria e persiste uma notificação na base de dados de forma segura.
        """
        for attempt in range(2):
            try:
                notif = Notificacao(
                    event_id=event_id,
                    event_type=event_type,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    aggregate_id=aggregate_id,
                    titulo=titulo,
                    mensagem=mensagem,
                    tipo=tipo,
                    canal=canal,
                    prioridade=prioridade,
                    persistente=persistente,
                    ativa=True,
                    target_type=target_type,
                    target_role=target_role or recipient_role,
                    target_sector=target_sector,
                    target_user_id=target_user_id or recipient_user_id,
                    actor_user_id=actor_user_id,
                    recipient_user_id=recipient_user_id,
                    recipient_role=recipient_role or target_role,
                    metadados=metadados or {},
                    created_by=created_by or actor_user_id,
                    created_at=datetime.utcnow()
                )
                db.session.add(notif)
                db.session.commit()
                return notif
            except Exception as e:
                db.session.rollback()
                err_str = str(e)
                if ("1054" in err_str or "Unknown column" in err_str or "event_id" in err_str) and attempt == 0:
                    logger.warning("Coluna em falta detetada na tabela notificacoes. A aplicar migração automática...")
                    from sqlalchemy import text
                    migration_queries = [
                        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS event_id VARCHAR(64) NULL;",
                        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS event_type VARCHAR(64) NULL;",
                        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS entity_type VARCHAR(64) NULL;",
                        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS entity_id INT NULL;",
                        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS aggregate_id VARCHAR(128) NULL;",
                        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS actor_user_id INT NULL;",
                        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS recipient_user_id INT NULL;",
                        "ALTER TABLE notificacoes ADD COLUMN IF NOT EXISTS recipient_role VARCHAR(50) NULL;"
                    ]
                    for mq in migration_queries:
                        try:
                            db.session.execute(text(mq))
                            db.session.commit()
                        except Exception:
                            db.session.rollback()
                            try:
                                db.session.execute(text(mq.replace(" IF NOT EXISTS", "")))
                                db.session.commit()
                            except Exception:
                                db.session.rollback()
                    continue
                
                logger.error(f"Erro ao persistir notificação na BD: {e}")
                return None
        return None

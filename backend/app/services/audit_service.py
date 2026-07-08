from flask import request
from app.models.auditoria import Auditoria, LogAcesso, LogErro
from app.core.database import db
import traceback

class AuditService:
    @staticmethod
    def log_action(user_id, action, entidade=None, record_id=None, old_values=None, new_values=None, modulo=None, justificativa=None):
        try:
            ip_address = request.remote_addr if request else None
            
            # Map old table_name to entidade, ensure action is string in case it's passed as such
            audit = Auditoria(
                utilizador_id=user_id,
                operacao=action.upper() if isinstance(action, str) else action.name,
                entidade=entidade,
                registo_id=record_id,
                valor_anterior=old_values,
                valor_novo=new_values,
                justificativa=justificativa,
                ip=ip_address,
                modulo=modulo
            )
            db.session.add(audit)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Failed to create audit log: {e}")

    @staticmethod
    def log_acesso(user_id, sucesso=True):
        try:
            ip_address = request.remote_addr if request else None
            user_agent = request.headers.get("User-Agent") if request else None
            
            log = LogAcesso(
                utilizador_id=user_id,
                ip=ip_address,
                user_agent=user_agent,
                sucesso=sucesso
            )
            db.session.add(log)
            db.session.commit()
            return log
        except Exception as e:
            db.session.rollback()
            print(f"Failed to log acesso: {e}")
            
    @staticmethod
    def log_erro(tipo, mensagem, user_id=None, rota=None):
        try:
            stack = traceback.format_exc()
            log = LogErro(
                tipo=tipo,
                mensagem=mensagem,
                stacktrace=stack,
                rota=rota or (request.path if request else None),
                utilizador_id=user_id
            )
            db.session.add(log)
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Failed to log erro: {e}")

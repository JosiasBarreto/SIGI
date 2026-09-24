import logging
from datetime import datetime, date
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy import or_, and_, desc

from app.core.database import db
from app.models.notificacao import Notificacao, NotificacaoLeitura, HistoricoSMS
from app.models.user import User, RoleEnum
from app.websocket.socket_manager import (
    send_notification,
    emit_notification_read,
    emit_notification_deactivated,
    emit_sms_dispatched
)
from app.services.notification_service import NotificationService

logger = logging.getLogger(__name__)


class GestaoNotificacaoService:
    """
    Serviço corporativo para Gestão de Notificações, Leitura Individual e Histórico de SMS.
    Oferece rastreamento de quem leu / quem não leu, notificações persistentes,
    desativação de lidas, envio manual de SMS/WhatsApp e métricas em tempo real.
    """

    # -------------------------------------------------------------------------
    # GESTÃO DE NOTIFICAÇÕES (CRIAÇÃO, LISTAGEM, LEITURA, STATUS)
    # -------------------------------------------------------------------------

    @staticmethod
    def criar_notificacao(
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
        metadados: Optional[dict] = None,
        expira_em: Optional[datetime] = None,
        created_by: Optional[int] = None
    ) -> Notificacao:
        """
        Persiste uma nova notificação na base de dados e a despacha instantaneamente
        via WebSocket para a sala correspondente.
        """
        notificacao = Notificacao(
            titulo=titulo,
            mensagem=mensagem,
            tipo=tipo,
            canal=canal,
            prioridade=prioridade,
            persistente=persistente,
            ativa=True,
            target_type=target_type,
            target_role=target_role,
            target_sector=target_sector,
            target_user_id=target_user_id,
            metadados=metadados or {},
            expira_em=expira_em,
            created_by=created_by
        )
        db.session.add(notificacao)
        db.session.commit()

        # Despacho em tempo real via WebSocket
        try:
            send_notification(
                utilizador_id=target_user_id if target_type == "USER" else None,
                role=target_role if target_type == "ROLE" else None,
                sector=target_sector if target_type == "SECTOR" else None,
                mensagem=mensagem,
                titulo=titulo,
                tipo=tipo,
                dados_extra={
                    "notificacao_id": notificacao.id,
                    **(metadados or {})
                },
                canal=canal,
                prioridade=prioridade,
                persistente=persistente
            )
        except Exception as e:
            logger.warning(f"Falha ao emitir WebSocket para notificação #{notificacao.id}: {e}")

        return notificacao

    @staticmethod
    def listar_notificacoes(
        current_user: Optional[User],
        filtros: Optional[Dict[str, Any]] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Dict[str, Any]], int, Dict[str, Any]]:
        """
        Lista notificações visíveis para o utilizador atual, aplicando filtros avançados:
        - apenas_ativas (padrão: True)
        - lida (True / False / None)
        - persistente (True / False / None)
        - canal (ex: SISTEMA, PRODUCAO, PEDIDO, SMS, etc.)
        - tipo (ex: info, warning, error, alerta, success)
        - prioridade (ex: baixa, media, alta, urgente)
        - busca (texto em título ou mensagem)
        """
        filtros = filtros or {}
        query = Notificacao.query

        # 1. Filtro de Destinatário (Isolamento por utilizador e perfil)
        if current_user:
            user_id = current_user.id
            user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
            is_admin = user_role.lower() in ("administrador", "admin")
            ver_todas = filtros.get("todas", False) and is_admin

            if not ver_todas:
                query = query.filter(
                    or_(
                        Notificacao.target_type == "GLOBAL",
                        and_(Notificacao.target_type == "USER", Notificacao.target_user_id == user_id),
                        and_(Notificacao.target_type == "ROLE", Notificacao.target_role == user_role)
                    )
                )

        # 2. Filtro Ativa / Desativada
        incluir_desativadas = filtros.get("incluir_desativadas", False)
        apenas_desativadas = filtros.get("apenas_desativadas", False)
        if apenas_desativadas:
            query = query.filter(Notificacao.ativa == False)
        elif not incluir_desativadas:
            query = query.filter(Notificacao.ativa == True)

        # 3. Filtro Persistente
        if filtros.get("persistente") is not None:
            query = query.filter(Notificacao.persistente == bool(filtros["persistente"]))

        # 4. Filtro Canal
        if filtros.get("canal"):
            query = query.filter(Notificacao.canal == filtros["canal"])

        # 5. Filtro Tipo
        if filtros.get("tipo"):
            query = query.filter(Notificacao.tipo == filtros["tipo"])

        # 6. Filtro Prioridade
        if filtros.get("prioridade"):
            query = query.filter(Notificacao.prioridade == filtros["prioridade"])

        # 7. Filtro de Busca Textual
        if filtros.get("busca"):
            termo = f"%{filtros['busca'].strip()}%"
            query = query.filter(
                or_(
                    Notificacao.titulo.ilike(termo),
                    Notificacao.mensagem.ilike(termo)
                )
            )

        # 8. Filtro Lido / Não Lido para o utilizador atual
        if current_user and filtros.get("lida") is not None:
            filtro_lida = bool(filtros["lida"])
            leituras_subq = db.session.query(NotificacaoLeitura.notificacao_id).filter(
                NotificacaoLeitura.user_id == current_user.id
            ).subquery()

            if filtro_lida:
                query = query.filter(Notificacao.id.in_(leituras_subq))
            else:
                query = query.filter(~Notificacao.id.in_(leituras_subq))

        # Total antes da paginação
        total = query.count()

        # Ordenação: Persistentes primeiro, seguidas de mais recentes
        query = query.order_by(
            desc(Notificacao.persistente),
            desc(Notificacao.created_at)
        )

        paginated = query.paginate(page=page, per_page=per_page, error_out=False)
        items_serialized = [
            item.to_dict(current_user_id=current_user.id if current_user else None)
            for item in paginated.items
        ]

        # Contadores auxiliares
        meta = {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": paginated.pages
        }

        return items_serialized, total, meta

    @staticmethod
    def obter_detalhes_notificacao(notificacao_id: int, current_user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """
        Retorna informações completas de uma notificação específica, incluindo:
        - QUEM LEU: Lista com utilizadores, horários de leitura e endereços IP
        - QUEM NÃO LEU: Lista de utilizadores elegíveis que ainda não visualizaram a mensagem
        """
        notificacao = Notificacao.query.get(notificacao_id)
        if not notificacao:
            return None

        data = notificacao.to_dict(current_user_id=current_user_id)

        # 1. Utilizadores que já leram
        leituras_info = [l.to_dict() for l in notificacao.leituras]
        data["quem_leu"] = leituras_info
        users_que_leram_ids = {l.user_id for l in notificacao.leituras}

        # 2. Utilizadores que ainda NÃO leram (apenas calculável para target específico ou restrito)
        quem_nao_leu = []
        if notificacao.target_type == "USER" and notificacao.target_user_id:
            if notificacao.target_user_id not in users_que_leram_ids:
                u = User.query.get(notificacao.target_user_id)
                if u and u.is_active:
                    quem_nao_leu.append({
                        "user_id": u.id,
                        "name": u.name,
                        "email": u.email,
                        "role": u.role.value if hasattr(u.role, 'value') else str(u.role)
                    })
        elif notificacao.target_type == "ROLE" and notificacao.target_role:
            target_users = User.query.filter_by(role=notificacao.target_role, is_active=True).all()
            for u in target_users:
                if u.id not in users_que_leram_ids:
                    quem_nao_leu.append({
                        "user_id": u.id,
                        "name": u.name,
                        "email": u.email,
                        "role": u.role.value if hasattr(u.role, 'value') else str(u.role)
                    })
        elif notificacao.target_type == "GLOBAL":
            # Para globais, lista os colaboradores ativos que ainda não marcaram leitura
            active_users = User.query.filter_by(is_active=True).all()
            for u in active_users:
                if u.id not in users_que_leram_ids:
                    quem_nao_leu.append({
                        "user_id": u.id,
                        "name": u.name,
                        "email": u.email,
                        "role": u.role.value if hasattr(u.role, 'value') else str(u.role)
                    })

        data["quem_nao_leu"] = quem_nao_leu
        data["total_quem_leu"] = len(leituras_info)
        data["total_quem_nao_leu"] = len(quem_nao_leu)

        return data

    @staticmethod
    def marcar_como_lida(
        notificacao_id: int,
        user_id: int,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[bool, Optional[str]]:
        """
        Marca a notificação como lida para o utilizador indicado.
        Garante idempotência (não duplica se já estiver lida).
        Emite evento WebSocket em tempo real.
        """
        notificacao = Notificacao.query.get(notificacao_id)
        if not notificacao:
            return False, "Notificação não encontrada"

        existente = NotificacaoLeitura.query.filter_by(
            notificacao_id=notificacao_id,
            user_id=user_id
        ).first()

        agora = datetime.utcnow()
        if not existente:
            leitura = NotificacaoLeitura(
                notificacao_id=notificacao_id,
                user_id=user_id,
                lido_em=agora,
                ip_address=ip_address,
                user_agent=user_agent
            )
            db.session.add(leitura)
            db.session.commit()

        # Emitir via WebSocket para atualização imediata nas abas do cliente
        emit_notification_read(notificacao_id, user_id, agora.isoformat())
        return True, None

    @staticmethod
    def marcar_todas_como_lidas(current_user: User) -> int:
        """
        Marca todas as notificações não lidas visíveis para o utilizador atual como lidas.
        """
        user_id = current_user.id
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)

        # Subquery das que ele já leu
        ja_lidas_subq = db.session.query(NotificacaoLeitura.notificacao_id).filter_by(user_id=user_id).subquery()

        # Notificações visíveis e ativas que ele ainda não leu
        pendentes = Notificacao.query.filter(
            Notificacao.ativa == True,
            ~Notificacao.id.in_(ja_lidas_subq),
            or_(
                Notificacao.target_type == "GLOBAL",
                and_(Notificacao.target_type == "USER", Notificacao.target_user_id == user_id),
                and_(Notificacao.target_type == "ROLE", Notificacao.target_role == user_role)
            )
        ).all()

        agora = datetime.utcnow()
        count = 0
        for notif in pendentes:
            leitura = NotificacaoLeitura(
                notificacao_id=notif.id,
                user_id=user_id,
                lido_em=agora
            )
            db.session.add(leitura)
            count += 1
            emit_notification_read(notif.id, user_id, agora.isoformat())

        if count > 0:
            db.session.commit()

        return count

    @staticmethod
    def desativar_notificacao(notificacao_id: int, user_id: Optional[int] = None) -> Tuple[bool, Optional[str]]:
        """
        Desativa/arquiva uma notificação específica.
        Ela deixará de aparecer na lista de notificações ativas.
        """
        notificacao = Notificacao.query.get(notificacao_id)
        if not notificacao:
            return False, "Notificação não encontrada"

        notificacao.ativa = False
        notificacao.desativada_em = datetime.utcnow()
        notificacao.desativada_por = user_id
        db.session.commit()

        emit_notification_deactivated(notificacao_id)
        return True, None

    @staticmethod
    def desativar_notificacoes_lidas(current_user: User, todas: bool = False) -> int:
        """
        Desativa em lote as notificações que já foram lidas.
        - Se todas=False (padrão): desativa as notificações direcionadas ao utilizador que já foram lidas por ele.
        - Se todas=True (apenas Admin): desativa todas as notificações do sistema que já possuem pelo menos uma leitura.
        """
        user_id = current_user.id
        agora = datetime.utcnow()

        if todas:
            # Notificações ativas com pelo menos uma leitura
            notifs_com_leitura = db.session.query(Notificacao).join(NotificacaoLeitura).filter(
                Notificacao.ativa == True
            ).all()
        else:
            # Notificações ativas que o utilizador atual leu
            notifs_com_leitura = db.session.query(Notificacao).join(NotificacaoLeitura).filter(
                Notificacao.ativa == True,
                NotificacaoLeitura.user_id == user_id
            ).all()

        count = 0
        for notif in notifs_com_leitura:
            notif.ativa = False
            notif.desativada_em = agora
            notif.desativada_por = user_id
            count += 1
            emit_notification_deactivated(notif.id)

        if count > 0:
            db.session.commit()

        return count

    @staticmethod
    def alternar_persistente(notificacao_id: int, persistente: bool) -> Tuple[bool, Optional[str]]:
        """
        Fixa ou desafixa uma notificação (modalidade persistente).
        Notificações persistentes mantêm-se destacadas até intervenção explícita.
        """
        notificacao = Notificacao.query.get(notificacao_id)
        if not notificacao:
            return False, "Notificação não encontrada"

        notificacao.persistente = persistente
        db.session.commit()
        return True, None

    @staticmethod
    def excluir_notificacao(notificacao_id: int) -> Tuple[bool, Optional[str]]:
        """
        Exclui permanentemente uma notificação e todas as suas leituras.
        """
        notificacao = Notificacao.query.get(notificacao_id)
        if not notificacao:
            return False, "Notificação não encontrada"

        db.session.delete(notificacao)
        db.session.commit()
        emit_notification_deactivated(notificacao_id)
        return True, None

    # -------------------------------------------------------------------------
    # GESTÃO PROFISSIONAL DE SMS / WHATSAPP (HISTÓRICO, QUEM LEU, ENVIO MANUAL)
    # -------------------------------------------------------------------------

    @staticmethod
    def listar_historico_sms(
        filtros: Optional[Dict[str, Any]] = None,
        page: int = 1,
        per_page: int = 20
    ) -> Tuple[List[Dict[str, Any]], int, Dict[str, Any]]:
        """
        Lista todas as mensagens SMS e WhatsApp enviadas pelo sistema.
        Filtros disponíveis:
        - telefone
        - canal ('sms', 'whatsapp')
        - status ('enviado', 'entregue', 'lido', 'falha')
        - tipo_mensagem ('boas_vindas', 'pedido', 'fatura', 'manual', etc.)
        - busca (texto contido na mensagem ou nome do destinatário)
        - apenas_lidas (True / False)
        """
        filtros = filtros or {}
        query = HistoricoSMS.query

        if filtros.get("telefone"):
            query = query.filter(HistoricoSMS.telefone.ilike(f"%{filtros['telefone'].strip()}%"))

        if filtros.get("canal"):
            query = query.filter(HistoricoSMS.canal == filtros["canal"])

        if filtros.get("status"):
            query = query.filter(HistoricoSMS.status == filtros["status"])

        if filtros.get("tipo_mensagem"):
            query = query.filter(HistoricoSMS.tipo_mensagem == filtros["tipo_mensagem"])

        if filtros.get("apenas_lidas") is not None:
            if bool(filtros["apenas_lidas"]):
                query = query.filter(HistoricoSMS.lido_em.isnot(None))
            else:
                query = query.filter(HistoricoSMS.lido_em.is_(None))

        if filtros.get("busca"):
            termo = f"%{filtros['busca'].strip()}%"
            query = query.filter(
                or_(
                    HistoricoSMS.mensagem.ilike(termo),
                    HistoricoSMS.destinatario_nome.ilike(termo),
                    HistoricoSMS.telefone.ilike(termo)
                )
            )

        total = query.count()
        query = query.order_by(desc(HistoricoSMS.created_at))
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)

        items_serialized = [item.to_dict() for item in paginated.items]
        meta = {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": paginated.pages
        }

        return items_serialized, total, meta

    @staticmethod
    def registrar_envio_sms(
        telefone: str,
        mensagem: str,
        destinatario_nome: Optional[str] = None,
        canal: str = "sms",
        tipo_mensagem: str = "aviso_geral",
        cliente_id: Optional[int] = None,
        user_id: Optional[int] = None,
        status: str = "enviado",
        erro: Optional[str] = None,
        metadados: Optional[dict] = None
    ) -> HistoricoSMS:
        """
        Registra uma comunicação SMS/WhatsApp enviada no histórico permanente do sistema.
        """
        sms = HistoricoSMS(
            telefone=telefone,
            destinatario_nome=destinatario_nome,
            cliente_id=cliente_id,
            user_id=user_id,
            canal=canal,
            tipo_mensagem=tipo_mensagem,
            mensagem=mensagem,
            status=status,
            erro=erro,
            metadados=metadados or {}
        )
        db.session.add(sms)
        db.session.commit()

        # Emitir via WebSocket para painel de comunicações
        emit_sms_dispatched(sms.to_dict())
        return sms

    @staticmethod
    def enviar_sms_manual(
        telefone: str,
        mensagem: str,
        destinatario_nome: Optional[str] = None,
        canal: str = "sms",
        tipo_mensagem: str = "manual",
        cliente_id: Optional[int] = None,
        created_by: Optional[int] = None
    ) -> Tuple[bool, Any]:
        """
        Dispara um SMS ou WhatsApp manual a partir do painel de administração e registra no histórico.
        """
        if not telefone or not mensagem:
            return False, "Telefone e mensagem são obrigatórios."

        sucesso, erro = NotificationService.send_sms_whatsapp(
            phone=telefone,
            message=mensagem,
            channel=canal
        )

        status = "enviado" if sucesso else "falha"
        registro = GestaoNotificacaoService.registrar_envio_sms(
            telefone=telefone,
            mensagem=mensagem,
            destinatario_nome=destinatario_nome,
            canal=canal,
            tipo_mensagem=tipo_mensagem,
            cliente_id=cliente_id,
            status=status,
            erro=erro,
            user_id=created_by
        )

        return sucesso, registro.to_dict()

    @staticmethod
    def atualizar_status_sms(
        sms_id: int,
        status: str,
        marcar_lido: bool = False
    ) -> Tuple[bool, Optional[str]]:
        """
        Atualiza o status de entrega / leitura de um SMS ou WhatsApp.
        Permite que webhooks de gateways externos ou confirmações manuais
        marquem 'lido', 'entregue' ou 'falha'.
        """
        sms = HistoricoSMS.query.get(sms_id)
        if not sms:
            return False, "Registro de SMS não encontrado"

        sms.status = status
        if marcar_lido or status == "lido":
            sms.lido_em = datetime.utcnow()
        db.session.commit()

        emit_sms_dispatched(sms.to_dict())
        return True, None

    # -------------------------------------------------------------------------
    # ESTATÍSTICAS E DASHBOARD DE NOTIFICAÇÕES
    # -------------------------------------------------------------------------

    @staticmethod
    def obter_estatisticas(current_user: Optional[User] = None) -> Dict[str, Any]:
        """
        Retorna indicadores executivos em tempo real para a barra superior e dashboard:
        - total_ativas
        - nao_lidas (específico do utilizador)
        - persistentes_ativas
        - total_sms_enviadas
        - sms_lidas_confirmadas
        - sms_falhas
        """
        user_id = current_user.id if current_user else None
        user_role = (
            current_user.role.value if (current_user and hasattr(current_user.role, 'value'))
            else str(current_user.role) if current_user else None
        )

        # 1. Total ativas visíveis
        query_ativas = Notificacao.query.filter_by(ativa=True)
        if current_user and user_role and user_role.lower() not in ("administrador", "admin"):
            query_ativas = query_ativas.filter(
                or_(
                    Notificacao.target_type == "GLOBAL",
                    and_(Notificacao.target_type == "USER", Notificacao.target_user_id == user_id),
                    and_(Notificacao.target_type == "ROLE", Notificacao.target_role == user_role)
                )
            )
        total_ativas = query_ativas.count()

        # 2. Persistentes ativas
        persistentes_ativas = query_ativas.filter_by(persistente=True).count()

        # 3. Não lidas para o utilizador
        nao_lidas = 0
        if current_user:
            ja_lidas_subq = db.session.query(NotificacaoLeitura.notificacao_id).filter_by(user_id=user_id).subquery()
            nao_lidas = query_ativas.filter(~Notificacao.id.in_(ja_lidas_subq)).count()

        # 4. Estatísticas de SMS
        total_sms = HistoricoSMS.query.count()
        sms_lidas = HistoricoSMS.query.filter(HistoricoSMS.lido_em.isnot(None)).count()
        sms_falhas = HistoricoSMS.query.filter_by(status="falha").count()

        hoje = date.today()
        sms_hoje = HistoricoSMS.query.filter(
            HistoricoSMS.created_at >= datetime(hoje.year, hoje.month, hoje.day)
        ).count()

        return {
            "notificacoes": {
                "total_ativas": total_ativas,
                "nao_lidas": nao_lidas,
                "persistentes_ativas": persistentes_ativas
            },
            "comunicacoes_sms": {
                "total_enviadas": total_sms,
                "confirmadas_lidas": sms_lidas,
                "falhas": sms_falhas,
                "enviadas_hoje": sms_hoje,
                "taxa_leitura_percent": round((sms_lidas / total_sms * 100), 1) if total_sms > 0 else 0.0
            }
        }

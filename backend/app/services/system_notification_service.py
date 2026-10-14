from datetime import datetime, date, timedelta
from app.core.database import db
from app.models.notificacao import Notificacao, NotificacaoLeitura
from app.models.produto import Produto
from app.models.pedido import Pedido, EstadoPedido
from app.models.caixa import Caixa, EstadoCaixa
from app.models.user import User

class SystemNotificationService:
    @staticmethod
    def sync_system_alerts():
        """
        Gera e sincroniza dinamicamente alertas para:
        1. Produtos expirados (data_validade < hoje)
        2. Produtos a expirar em 5 dias
        3. Produtos com stock baixo (stock_atual <= stock_minimo)
        4. Pedidos não entregues / atrasados
        5. Caixas com divergências
        """
        hoje = date.today()
        em_5_dias = hoje + timedelta(days=5)

        # 1. PRODUTOS EXPIRADOS
        produtos_expirados = Produto.query.filter(
            Produto.ativo == True,
            Produto.data_validade != None,
            Produto.data_validade < hoje
        ).all()

        for p in produtos_expirados:
            notif = Notificacao.query.filter_by(
                tipo='VALIDADE_EXPIRADA',
                entidade_tipo='produto',
                entidade_id=p.id,
                ativo=True
            ).first()
            msg = f"O produto '{p.nome}' (cód: {p.codigo or 'S/C'}) expirou em {p.data_validade.strftime('%d/%m/%Y')}. Stock em armazém: {float(p.stock_atual or 0):.2f}."
            if not notif:
                notif = Notificacao(
                    tipo='VALIDADE_EXPIRADA',
                    titulo=f"Produto Expirado: {p.nome}",
                    mensagem=msg,
                    prioridade='alta',
                    entidade_tipo='produto',
                    entidade_id=p.id,
                    dados_extra={"codigo": p.codigo, "data_validade": str(p.data_validade), "stock": float(p.stock_atual or 0)}
                )
                db.session.add(notif)
            else:
                notif.mensagem = msg

        # 2. PRODUTOS A EXPIRAR (PRÓXIMOS 5 DIAS)
        produtos_a_expirar = Produto.query.filter(
            Produto.ativo == True,
            Produto.data_validade != None,
            Produto.data_validade >= hoje,
            Produto.data_validade <= em_5_dias
        ).all()

        for p in produtos_a_expirar:
            notif = Notificacao.query.filter_by(
                tipo='VALIDADE_PROXIMA',
                entidade_tipo='produto',
                entidade_id=p.id,
                ativo=True
            ).first()
            dias_restantes = (p.data_validade - hoje).days
            dias_txt = "hoje" if dias_restantes == 0 else f"em {dias_restantes} dia(s)"
            msg = f"O produto '{p.nome}' expira {dias_txt} ({p.data_validade.strftime('%d/%m/%Y')}). Stock atual: {float(p.stock_atual or 0):.2f}."
            if not notif:
                notif = Notificacao(
                    tipo='VALIDADE_PROXIMA',
                    titulo=f"Validade Próxima: {p.nome}",
                    mensagem=msg,
                    prioridade='media',
                    entidade_tipo='produto',
                    entidade_id=p.id,
                    dados_extra={"codigo": p.codigo, "data_validade": str(p.data_validade), "dias": dias_restantes}
                )
                db.session.add(notif)
            else:
                notif.mensagem = msg

        # 3. STOCK BAIXO
        produtos_stock_baixo = Produto.query.filter(
            Produto.ativo == True,
            Produto.stock_atual <= Produto.stock_minimo
        ).all()

        for p in produtos_stock_baixo:
            notif = Notificacao.query.filter_by(
                tipo='STOCK_BAIXO',
                entidade_tipo='produto',
                entidade_id=p.id,
                ativo=True
            ).first()
            prioridade = 'alta' if (float(p.stock_atual or 0) <= 0) else 'media'
            msg = f"Stock em alerta para '{p.nome}'. Atual: {float(p.stock_atual or 0):.2f} | Mínimo definido: {float(p.stock_minimo or 0):.2f}."
            if not notif:
                notif = Notificacao(
                    tipo='STOCK_BAIXO',
                    titulo=f"Stock Crítico: {p.nome}",
                    mensagem=msg,
                    prioridade=prioridade,
                    entidade_tipo='produto',
                    entidade_id=p.id,
                    dados_extra={"codigo": p.codigo, "stock_atual": float(p.stock_atual or 0), "stock_minimo": float(p.stock_minimo or 0)}
                )
                db.session.add(notif)
            else:
                notif.mensagem = msg
                notif.prioridade = prioridade

        # 4. PEDIDOS NÃO ENTREGUES / ATRASADOS
        # Pedidos com data de entrega passada ou hoje que não estão Entregue, Concluido nem Cancelado
        pedidos_atrasados = Pedido.query.filter(
            Pedido.data_entrega != None,
            Pedido.data_entrega <= hoje,
            ~Pedido.estado.in_([EstadoPedido.ENTREGUE.value, EstadoPedido.CONCLUIDO.value, EstadoPedido.CANCELADO.value, 'Entregue', 'Concluido', 'Cancelado'])
        ).all()

        for ped in pedidos_atrasados:
            notif = Notificacao.query.filter_by(
                tipo='PEDIDO_NAO_ENTREGUE',
                entidade_tipo='pedido',
                entidade_id=ped.id,
                ativo=True
            ).first()
            data_str = ped.data_entrega.strftime('%d/%m/%Y') if ped.data_entrega else 'S/D'
            msg = f"O pedido #{ped.numero} com entrega prevista para {data_str} ainda não foi entregue (Estado: '{ped.estado}'). Valor: {float(ped.valor_total or 0):.2f}€."
            if not notif:
                notif = Notificacao(
                    tipo='PEDIDO_NAO_ENTREGUE',
                    titulo=f"Pedido Pendente de Entrega: #{ped.numero}",
                    mensagem=msg,
                    prioridade='alta',
                    entidade_tipo='pedido',
                    entidade_id=ped.id,
                    dados_extra={"numero": ped.numero, "data_entrega": str(ped.data_entrega), "estado": str(ped.estado), "valor": float(ped.valor_total or 0)}
                )
                db.session.add(notif)
            else:
                notif.mensagem = msg

        # 5. CAIXAS COM DIVERGÊNCIA
        caixas_divergentes = Caixa.query.filter(
            Caixa.estado == EstadoCaixa.FECHADO.value
        ).filter(
            (Caixa.diferenca_dinheiro != 0) | 
            (Caixa.diferenca_transferencia != 0) | 
            (Caixa.diferenca_pos != 0)
        ).order_by(Caixa.id.desc()).limit(10).all()

        for cx in caixas_divergentes:
            notif = Notificacao.query.filter_by(
                tipo='CAIXA_DIVERGENCIA',
                entidade_tipo='caixa',
                entidade_id=cx.id,
                ativo=True
            ).first()
            dif_tot = float(cx.diferenca_dinheiro or 0) + float(cx.diferenca_transferencia or 0) + float(cx.diferenca_pos or 0)
            msg = f"Fecho do Caixa #{cx.numero} registou divergência total de {dif_tot:.2f}€. Motivo: {cx.explicacao_divergencia or 'Não detalhado'}."
            if not notif:
                notif = Notificacao(
                    tipo='CAIXA_DIVERGENCIA',
                    titulo=f"Divergência de Caixa: #{cx.numero}",
                    mensagem=msg,
                    prioridade='alta',
                    entidade_tipo='caixa',
                    entidade_id=cx.id,
                    dados_extra={"numero": cx.numero, "diferenca_total": dif_tot, "explicacao": cx.explicacao_divergencia}
                )
                db.session.add(notif)

        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()

    @staticmethod
    def get_notificacoes(user_id=None, tipo=None, apenas_nao_lidas=False):
        # Primeiro sincroniza
        SystemNotificationService.sync_system_alerts()

        query = Notificacao.query.filter_by(ativo=True)
        if tipo:
            query = query.filter_by(tipo=tipo)

        notificacoes = query.order_by(Notificacao.id.desc()).all()
        
        # Buscar todos os utilizadores ativos para o rastreio de "quem viu quem não viu"
        utilizadores_ativos = User.query.filter_by(is_active=True).all()
        users_map = {u.id: {"id": u.id, "name": u.name, "email": u.email, "role": str(u.role.value if hasattr(u.role, 'value') else u.role)} for u in utilizadores_ativos}

        result = []
        for n in notificacoes:
            leituras = n.leituras or []
            leitores_ids = set()
            quem_viu = []

            for l in leituras:
                leitores_ids.add(l.user_id)
                u_info = users_map.get(l.user_id)
                quem_viu.append({
                    "user_id": l.user_id,
                    "user_name": u_info["name"] if u_info else (l.user.name if l.user else f"Utilizador #{l.user_id}"),
                    "user_email": u_info["email"] if u_info else (l.user.email if l.user else ""),
                    "user_role": u_info["role"] if u_info else "",
                    "data_leitura": l.data_leitura.strftime("%d/%m/%Y %H:%M") if l.data_leitura else None
                })

            quem_nao_viu = [
                u_info for uid, u_info in users_map.items() if uid not in leitores_ids
            ]

            lida_por_mim = (user_id in leitores_ids) if user_id else False

            if apenas_nao_lidas and lida_por_mim:
                continue

            result.append({
                "id": n.id,
                "tipo": n.tipo,
                "titulo": n.titulo,
                "mensagem": n.mensagem,
                "prioridade": n.prioridade,
                "entidade_tipo": n.entidade_tipo,
                "entidade_id": n.entidade_id,
                "dados_extra": n.dados_extra or {},
                "created_at": n.created_at.strftime("%d/%m/%Y %H:%M") if n.created_at else None,
                "lida_por_mim": lida_por_mim,
                "quem_viu": quem_viu,
                "quem_nao_viu": quem_nao_viu,
                "total_visto": len(quem_viu),
                "total_nao_visto": len(quem_nao_viu)
            })

        return result

    @staticmethod
    def marcar_como_lida(notificacao_id, user_id):
        if not user_id:
            return False, "Utilizador não identificado"

        notif = Notificacao.query.get(notificacao_id)
        if not notif:
            return False, "Notificação não encontrada"

        existente = NotificacaoLeitura.query.filter_by(
            notificacao_id=notificacao_id,
            user_id=user_id
        ).first()

        if not existente:
            leitura = NotificacaoLeitura(
                notificacao_id=notificacao_id,
                user_id=user_id,
                data_leitura=datetime.utcnow()
            )
            db.session.add(leitura)
            db.session.commit()

        return True, None

    @staticmethod
    def marcar_todas_lidas(user_id):
        if not user_id:
            return False, "Utilizador não identificado"

        todas = Notificacao.query.filter_by(ativo=True).all()
        agora = datetime.utcnow()

        for n in todas:
            existente = NotificacaoLeitura.query.filter_by(
                notificacao_id=n.id,
                user_id=user_id
            ).first()
            if not existente:
                db.session.add(NotificacaoLeitura(
                    notificacao_id=n.id,
                    user_id=user_id,
                    data_leitura=agora
                ))

        db.session.commit()
        return True, None

    @staticmethod
    def get_resumo(user_id=None):
        notificacoes = SystemNotificationService.get_notificacoes(user_id=user_id)
        
        total = len(notificacoes)
        nao_lidas = sum(1 for n in notificacoes if not n.get("lida_por_mim", False))
        
        por_tipo = {
            "expirados": sum(1 for n in notificacoes if n["tipo"] == 'VALIDADE_EXPIRADA'),
            "validade_proxima": sum(1 for n in notificacoes if n["tipo"] == 'VALIDADE_PROXIMA'),
            "stock_baixo": sum(1 for n in notificacoes if n["tipo"] == 'STOCK_BAIXO'),
            "pedidos_nao_entregues": sum(1 for n in notificacoes if n["tipo"] == 'PEDIDO_NAO_ENTREGUE'),
            "caixa_divergencia": sum(1 for n in notificacoes if n["tipo"] == 'CAIXA_DIVERGENCIA'),
            "cozinha": sum(1 for n in notificacoes if n["tipo"] == 'NOVO_PEDIDO_COZINHA'),
            "pastelaria": sum(1 for n in notificacoes if n["tipo"] == 'NOVO_PEDIDO_PASTELARIA'),
            "bar": sum(1 for n in notificacoes if n["tipo"] == 'NOVO_PEDIDO_BAR'),
            "pedidos": sum(1 for n in notificacoes if 'PEDIDO' in n["tipo"])
        }

        return {
            "total": total,
            "nao_lidas": nao_lidas,
            "por_tipo": por_tipo
        }

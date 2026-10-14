import uuid
from datetime import datetime, timedelta
from app.models.ficha_tecnica import FichaTecnica, FichaTecnicaItem, TipoFicha
from app.models.ordem_producao import OrdemProducao, OrdemProducaoItem, SectorProducao, PrioridadeProducao, EstadoProducao, ConsumoIngrediente
from app.models.reserva import ReservaIngrediente, EstadoReserva
from app.models.pedido import Pedido, EstadoPedido
from app.models.item_pedido import ItemPedido, TipoItem
from app.models.produto import Produto
from app.models.ingrediente import Ingrediente
from app.models.movimento_stock import MovimentoStock, TipoMovimento, OrigemMovimento, EntidadeMovimento
from app.repositories.producao_repos import FichaTecnicaRepository, OrdemProducaoRepository
from app.services.audit_service import AuditService
from app.core.database import db
from app.websocket.socket_manager import socketio
from sqlalchemy import func
import logging

logger = logging.getLogger(__name__)

class ProducaoService:
    def __init__(self):
        self.ficha_repo = FichaTecnicaRepository()
        self.ordem_repo = OrdemProducaoRepository()

    # --- Fichas Técnicas ---
    def create_ficha(self, data, user_id):
        itens_data = data.pop('itens', [])
        ficha = FichaTecnica(**data, created_by=user_id)
        
        for item in itens_data:
            i = FichaTecnicaItem(
                ingrediente_id=item['ingrediente_id'],
                quantidade=item['quantidade'],
                unidade=item['unidade'],
                observacao=item.get('observacao')
            )
            ficha.itens.append(i)
            
        self.ficha_repo.create(ficha)
        AuditService.log_action(user_id, "CREATE", "fichas_tecnicas", ficha.id)
        return ficha, None

    # --- Criação Automática de Ordem ---
    def gerar_ordens_por_pedido(self, pedido_id, user_id=None, emit_visual_notification=True):
        pedido = db.session.query(Pedido).filter_by(id=pedido_id).first()
        if not pedido: return False, "Pedido não encontrado"
        
        # Verificar se já existem ordens de produção para este pedido
        ordens_existentes = db.session.query(OrdemProducao).filter_by(pedido_id=pedido.id).all()
        if ordens_existentes:
            return True, None

        hoje = datetime.utcnow().date()
        producao_futura = bool(pedido.data_entrega and pedido.data_entrega > hoje)
        
        itens_por_setor = {
            SectorProducao.COZINHA: [],
            SectorProducao.PASTELARIA: [],
            SectorProducao.BAR: []
        }
        ordens_criadas = []
        
        for item in pedido.itens:
            if not item.produto_id:
                continue

            produto = db.session.query(Produto).filter_by(id=item.produto_id).first()
            if not produto:
                continue

            setor = None
            if produto.servico:
                servico_str = produto.servico.value if hasattr(produto.servico, 'value') else str(produto.servico)
                if servico_str == 'COZINHA':
                    setor = SectorProducao.COZINHA
                elif servico_str == 'PASTELARIA':
                    setor = SectorProducao.PASTELARIA
                elif servico_str == 'BAR':
                    setor = SectorProducao.BAR
            
            if not setor:
                ficha = db.session.query(FichaTecnica).filter_by(produto_acabado_id=item.produto_id, ativo=True).first()
                if ficha:
                    setor = SectorProducao.COZINHA if (ficha.tipo.value if hasattr(ficha.tipo, 'value') else str(ficha.tipo)) == TipoFicha.COZINHA.value else SectorProducao.PASTELARIA
                else:
                    cat_or_name = f"{produto.categoria or ''} {produto.nome or ''}".lower()
                    pastelaria_keywords = ['bolo', 'doce', 'pastel', 'pão', 'pao', 'tarte', 'croissant', 'queque', 'pastelaria', 'sobremesa', 'mousse', 'torta']
                    bar_keywords = ['bebida', 'sumo', 'cerveja', 'água', 'agua', 'refrigerante', 'café', 'cafe', 'chá', 'cha', 'cocktail', 'licor', 'vinho']
                    if any(kw in cat_or_name for kw in bar_keywords):
                        setor = SectorProducao.BAR
                    elif any(kw in cat_or_name for kw in pastelaria_keywords):
                        setor = SectorProducao.PASTELARIA
                    else:
                        setor = SectorProducao.COZINHA
            else:
                ficha = db.session.query(FichaTecnica).filter_by(produto_acabado_id=item.produto_id, ativo=True).first()
            
            if setor in itens_por_setor:
                itens_por_setor[setor].append((item, ficha))
            
        for setor, items in itens_por_setor.items():
            if not items:
                continue
                
            numero = f"OP-{setor.value[:3].upper()}-{datetime.utcnow().strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}"
            ordem = OrdemProducao(
                numero=numero,
                pedido_id=pedido.id,
                sector=setor,
                prioridade=PrioridadeProducao.MEDIA,
                data_producao=pedido.data_entrega if producao_futura else hoje,
                estado=EstadoProducao.PENDENTE if producao_futura else EstadoProducao.EM_PRODUCAO,
                created_by=user_id
            )
            if not producao_futura:
                ordem.hora_inicio = datetime.utcnow()

            db.session.add(ordem)
            db.session.flush() # Para gerar o ID da ordem
            ordens_criadas.append(ordem)
            
            for item, ficha in items:
                op_item = OrdemProducaoItem(
                    ordem_producao_id=ordem.id,
                    produto_id=item.produto_id,
                    quantidade=item.quantidade,
                    observacoes=getattr(item, 'observacoes', None)
                )
                db.session.add(op_item)
                
                if ficha:
                    for req in ficha.itens:
                        qtd_total_prevista = float(req.quantidade) * float(item.quantidade)
                        
                        consumo = ConsumoIngrediente(
                            ordem_producao_id=ordem.id,
                            ingrediente_id=req.ingrediente_id,
                            quantidade_prevista=qtd_total_prevista
                        )
                        db.session.add(consumo)
                        
                        if producao_futura:
                            reserva = ReservaIngrediente(
                                ingrediente_id=req.ingrediente_id,
                                pedido_id=pedido.id,
                                quantidade=qtd_total_prevista
                            )
                            db.session.add(reserva)
        
        db.session.commit()

        # Publica o evento estruturado, que mantém sincronização de ecrãs e a
        # notificação visual persistida. Os eventos específicos abaixo são
        # preservados para os KDS/consumidores legados.
        if ordens_criadas:
            try:
                from app.notifications.service import NotificationService
                from app.websocket.socket_manager import format_products_summary

                sectores = [ordem.sector for ordem in ordens_criadas]
                cliente_nome = pedido.cliente.nome if pedido.cliente else 'Consumidor Final'
                NotificationService.publish_production_orders(
                    pedido_id=pedido.id,
                    pedido_numero=pedido.numero,
                    sectores=sectores,
                    cliente_nome=cliente_nome,
                    produtos_resumo=format_products_summary(pedido.itens),
                    actor_user_id=user_id,
                    emit_visual_notification=emit_visual_notification,
                )
            except Exception:
                # A OP já foi confirmada; uma falha de entrega não pode
                # invalidar a criação do pedido/produção.
                logger.exception('Erro ao publicar notificação de ordens de produção.')

        for ordem in ordens_criadas:
            if user_id:
                AuditService.log_action(user_id, "CREATE", "ordens_producao", ordem.id)
            sec_name = str(ordem.sector.value if hasattr(ordem.sector, 'value') else ordem.sector or 'Cozinha')
            sec_lower = sec_name.lower()
            socketio.emit('nova_ordem_producao', {
                'id': ordem.id,
                'numero': ordem.numero,
                'pedido_id': pedido.id,
                'pedido_numero': pedido.numero,
                'sector': sec_name,
                'estado': str(ordem.estado.value if hasattr(ordem.estado, 'value') else ordem.estado or 'Pendente')
            })
            socketio.emit(f'alerta_{sec_lower}', {
                'ordem_id': ordem.id,
                'numero': ordem.numero,
                'pedido_id': pedido.id,
                'pedido_numero': pedido.numero,
                'sector': sec_name,
                'msg': f"Nova Ordem de Produção #{ordem.numero} ({sec_name})!"
            })
            socketio.emit(f'alerta_{sec_lower}', {
                'ordem_id': ordem.id,
                'numero': ordem.numero,
                'pedido_id': pedido.id,
                'pedido_numero': pedido.numero,
                'sector': sec_name,
                'msg': f"Nova Ordem de Produção #{ordem.numero} ({sec_name})!"
            }, room=f"role_{sec_lower}")
        return True, None

    # --- Processamento Automático de Pedidos Agendados ---
    def processar_pedidos_agendados(self):
        """
        Verifica pedidos agendados para a data atual (ou anteriores) e os coloca
        automaticamente em produção, notificando o pessoal da cozinha e pastelaria.
        """
        hoje = datetime.utcnow().date()
        
        pedidos_agendados = db.session.query(Pedido).filter(
            Pedido.estado.in_([
                EstadoPedido.AGENDADO.value, EstadoPedido.AGENDADO,
                EstadoPedido.CONFIRMADO.value, EstadoPedido.CONFIRMADO,
                EstadoPedido.PENDENTE.value, EstadoPedido.PENDENTE
            ]),
            (Pedido.data_entrega <= hoje) | (Pedido.data_entrega.is_(None))
        ).all()
        
        processados = []
        for pedido in pedidos_agendados:
            estado_str = pedido.estado.value if hasattr(pedido.estado, 'value') else str(pedido.estado)
            # Se estiver Pendente e sem data de entrega definida nem sinal pago, ignora
            if estado_str in ['Pendente', 'PENDENTE'] and not (pedido.valor_pago and float(pedido.valor_pago) > 0) and pedido.data_entrega != hoje:
                continue

            ordens_existentes = db.session.query(OrdemProducao).filter_by(pedido_id=pedido.id).all()
            if not ordens_existentes:
                self.gerar_ordens_por_pedido(pedido.id)
                ordens_existentes = db.session.query(OrdemProducao).filter_by(pedido_id=pedido.id).all()

            if estado_str in ['Agendado', 'AGENDADO', 'Confirmado', 'CONFIRMADO', 'Pendente', 'PENDENTE']:
                pedido.estado = EstadoPedido.EM_PRODUCAO
            
            for ordem in ordens_existentes:
                ordem_est = ordem.estado.value if hasattr(ordem.estado, 'value') else str(ordem.estado)
                if ordem_est in ['Pendente', 'PENDENTE']:
                    ordem.estado = EstadoProducao.EM_PRODUCAO
                    if not ordem.hora_inicio:
                        ordem.hora_inicio = datetime.utcnow()
            
            processados.append(pedido)

        if processados:
            db.session.commit()
            for p in processados:
                socketio.emit('pedido_atualizado', {
                    'numero': p.numero,
                    'antigo_estado': 'Agendado',
                    'novo_estado': EstadoPedido.EM_PRODUCAO.value
                })
                socketio.emit('nova_ordem_producao', {'pedido_id': p.id, 'numero': p.numero})
                socketio.emit('alerta_producao', {
                    'msg': f'O Pedido #{p.numero} agendado para hoje entrou automaticamente em produção!'
                })

        return len(processados)

    # --- Controle de Ordem ---
    def alterar_estado_ordem(self, ordem_id, estado_novo, user_id):
        ordem = self.ordem_repo.get_by_id(ordem_id)
        if not ordem: return None, "Ordem não encontrada"
        
        estado_antigo = ordem.estado
        ordem.estado = estado_novo
        
        estado_novo_str = estado_novo.value if hasattr(estado_novo, 'value') else str(estado_novo)

        if estado_novo_str in [EstadoProducao.EM_PRODUCAO.value, 'Em Producao', 'EM_PRODUCAO']:
            ordem.hora_inicio = datetime.utcnow()
            
            # Atualizar estado do Pedido associado se necessário
            if ordem.pedido_id:
                pedido = db.session.query(Pedido).get(ordem.pedido_id)
                if pedido:
                    ped_est = pedido.estado.value if hasattr(pedido.estado, 'value') else str(pedido.estado)
                    if ped_est in ['Pendente', 'PENDENTE', 'Agendado', 'AGENDADO', 'Confirmado', 'CONFIRMADO']:
                        pedido.estado = EstadoPedido.EM_PRODUCAO.value if hasattr(EstadoPedido.EM_PRODUCAO, 'value') else 'Em Producao'
                        socketio.emit('pedido_atualizado', {
                            'numero': pedido.numero,
                            'antigo_estado': ped_est,
                            'novo_estado': 'Em Producao'
                        })

            socketio.emit('producao_iniciada', {'ordem_numero': ordem.numero})
            
        elif estado_novo_str in [EstadoProducao.PRONTO.value, 'Pronto', 'PRONTO']:
            ordem.hora_fim = datetime.utcnow()
            
            # Marcar todos os itens desta ordem de produção como 'Pronto'
            for item_op in (ordem.itens or []):
                item_op.estado = 'Pronto'

            # Consumir ingredientes na ordem (stock é descontado via Entrega de Requisição no armazém)
            for consumo in ordem.consumos:
                consumo.quantidade_consumida = consumo.quantidade_prevista
                consumo.data_consumo = datetime.utcnow()
                
            # Check if reservations exist for this, mark utilized
            reservas = db.session.query(ReservaIngrediente).filter_by(pedido_id=ordem.pedido_id, estado=EstadoReserva.ATIVA.value).all()
            for r in reservas:
                r.estado = EstadoReserva.UTILIZADA.value

            # Atualizar estado do Pedido se TODAS as Ordens de Produção do Pedido estiverem PRONTO
            if ordem.pedido_id:
                # Sincronizar itens_pedido correspondentes
                for it_op in (ordem.itens or []):
                    it_peds = db.session.query(ItemPedido).filter_by(pedido_id=ordem.pedido_id, produto_id=it_op.produto_id).all()
                    for ip in it_peds:
                        ip.estado = 'Pronto'

                todas_ordens = db.session.query(OrdemProducao).filter_by(pedido_id=ordem.pedido_id).all()
                todas_prontas = True
                for o in todas_ordens:
                    o_est = o.estado.value if hasattr(o.estado, 'value') else str(o.estado)
                    if o.id == ordem.id:
                        o_est = 'Pronto'
                    if o_est not in ['Pronto', 'PRONTO', 'Concluido', 'CONCLUIDO', 'Cancelado', 'CANCELADO']:
                        todas_prontas = False
                        break
                
                pedido = db.session.query(Pedido).get(ordem.pedido_id)
                if pedido:
                    ped_est = pedido.estado.value if hasattr(pedido.estado, 'value') else str(pedido.estado)
                    if todas_prontas:
                        # Quando TODOS os itens e ordens estiverem prontos -> O pedido fica Pronto!
                        if ped_est != 'Pronto':
                            pedido.estado = EstadoPedido.PRONTO.value if hasattr(EstadoPedido.PRONTO, 'value') else 'Pronto'
                            for it_ped in (pedido.itens or []):
                                it_ped.estado = 'Pronto'
                            db.session.flush()

                            # Notificação interna persistida com histórico atualizado
                            try:
                                from app.websocket.socket_manager import notify_order_status_updated, format_products_summary
                                cliente_nome = pedido.cliente.nome if pedido.cliente else "Consumidor Final"
                                produtos_resumo = format_products_summary(pedido.itens)
                                notify_order_status_updated(
                                    pedido_id=pedido.id,
                                    pedido_numero=pedido.numero,
                                    antigo_estado=ped_est,
                                    novo_estado='Pronto',
                                    cliente_nome=cliente_nome,
                                    produtos_resumo=produtos_resumo,
                                    total=float(pedido.valor_total or 0),
                                    actor_user_id=user_id
                                )
                            except Exception as notif_err:
                                logger.error(f"Erro ao emitir atualização de estado do pedido na produção: {notif_err}")

                            # Notificação ao cliente (Email / WhatsApp) APENAS quando o pedido estiver 100% pronto!
                            try:
                                from app.services.notification_service import NotificationService
                                if pedido.cliente and (pedido.cliente.email or pedido.cliente.telefone):
                                    contact = pedido.cliente.email if pedido.cliente.email else pedido.cliente.telefone
                                    method = "email" if pedido.cliente.email else "whatsapp"
                                    NotificationService.send_pedido_async(pedido.id, contact, method=method, trigger="pronto")
                            except Exception as e:
                                print("⚠ Erro ao notificar cliente que o pedido está pronto:", e)

                            socketio.emit('pedido_atualizado', {
                                'numero': pedido.numero,
                                'antigo_estado': ped_est,
                                'novo_estado': 'Pronto'
                            })
                    else:
                        # Nem todos os itens/setores estão prontos: NÃO NOTIFICAR COMO PRONTO (não existe pedido meio pronto)
                        if ped_est in ['Pendente', 'Confirmado', 'Agendado']:
                            pedido.estado = EstadoPedido.EM_PRODUCAO.value if hasattr(EstadoPedido.EM_PRODUCAO, 'value') else 'Em Producao'
                            socketio.emit('pedido_atualizado', {
                                'numero': pedido.numero,
                                'antigo_estado': ped_est,
                                'novo_estado': 'Em Producao'
                            })
            
            socketio.emit('producao_concluida', {'ordem_numero': ordem.numero})
            
        db.session.commit()
        AuditService.log_action(user_id, "UPDATE_ESTADO_OP", "ordens_producao", ordem.id)
        return ordem, None

    def alterar_estado_item_ordem(self, ordem_id, item_id, estado_novo, user_id):
        """
        Permite marcar itens individuais de uma ordem de produção como 'Pronto' ou 'Pendente'.
        Um pedido só fica pronto se todos os itens de todas as ordens estiverem prontos.
        """
        ordem = self.ordem_repo.get_by_id(ordem_id)
        if not ordem:
            return None, "Ordem não encontrada"
        
        item = db.session.query(OrdemProducaoItem).filter_by(id=item_id, ordem_producao_id=ordem.id).first()
        if not item:
            return None, "Item da ordem não encontrado"
        
        item.estado = estado_novo
        
        # Sincronizar item correspondente em itens_pedido se houver pedido
        if ordem.pedido_id and item.produto_id:
            it_peds = db.session.query(ItemPedido).filter_by(pedido_id=ordem.pedido_id, produto_id=item.produto_id).all()
            for ip in it_peds:
                ip.estado = estado_novo
        
        db.session.flush()
        
        # Verificar se todos os itens desta ordem de produção estão prontos
        todos_itens_ordem_prontos = all(
            (it.estado or '').lower() in ['pronto', 'concluido'] 
            for it in (ordem.itens or [])
        )
        
        if todos_itens_ordem_prontos and estado_novo.lower() in ['pronto', 'concluido']:
            # Se todos os itens desta ordem de produção foram concluídos, avança a ordem inteira para Pronto
            return self.alterar_estado_ordem(ordem_id, EstadoProducao.PRONTO, user_id)
        else:
            # Se a ordem ainda estava pendente mas começou a ter itens trabalhados, move para Em Produção
            ord_est = ordem.estado.value if hasattr(ordem.estado, 'value') else str(ordem.estado)
            if ord_est in ['Pendente', 'PENDENTE']:
                ordem.estado = EstadoProducao.EM_PRODUCAO
                if not ordem.hora_inicio:
                    ordem.hora_inicio = datetime.utcnow()
                if ordem.pedido_id:
                    pedido = db.session.query(Pedido).get(ordem.pedido_id)
                    if pedido:
                        p_est = pedido.estado.value if hasattr(pedido.estado, 'value') else str(pedido.estado)
                        if p_est in ['Pendente', 'PENDENTE', 'Confirmado', 'CONFIRMADO', 'Agendado', 'AGENDADO']:
                            pedido.estado = EstadoPedido.EM_PRODUCAO.value if hasattr(EstadoPedido.EM_PRODUCAO, 'value') else 'Em Producao'
                            socketio.emit('pedido_atualizado', {
                                'numero': pedido.numero,
                                'antigo_estado': p_est,
                                'novo_estado': 'Em Producao'
                            })
            
            db.session.commit()
            socketio.emit('ordem_item_atualizado', {
                'ordem_id': ordem.id,
                'item_id': item.id,
                'estado': item.estado
            })
            AuditService.log_action(user_id, "UPDATE_ESTADO_ITEM_OP", "ordens_producao", ordem.id, 
                                    new_values={'item_id': item.id, 'estado': item.estado})
            return ordem, None

    def update_ordem(self, ordem_id, data, user_id):
        ordem = self.ordem_repo.get_by_id(ordem_id)
        if not ordem: return None, "Ordem não encontrada"
        
        if 'turno' in data:
            ordem.turno = data['turno']
            
        if 'data_producao' in data:
            ordem.data_producao = data['data_producao']

        db.session.commit()
        AuditService.log_action(user_id, "UPDATE_OP", "ordens_producao", ordem.id)
        return ordem, None

    # --- Planeamento ---
    def prever_consumo(self, dias=7):
        hoje = datetime.utcnow().date()
        data_limite = hoje + timedelta(days=dias)
        
        consumos = db.session.query(
            ConsumoIngrediente.ingrediente_id,
            Ingrediente.nome,
            func.sum(ConsumoIngrediente.quantidade_prevista).label('total_previsto')
        ).join(OrdemProducao).join(Ingrediente).filter(
            OrdemProducao.data_producao >= hoje,
            OrdemProducao.data_producao <= data_limite,
            OrdemProducao.estado.in_([EstadoProducao.PENDENTE.value, EstadoProducao.EM_PRODUCAO.value])
        ).group_by(ConsumoIngrediente.ingrediente_id, Ingrediente.nome).all()
        
        return [{"ingrediente_id": c[0], "nome": c[1], "quantidade_necessaria": float(c[2])} for c in consumos]

import uuid
from datetime import datetime
from app.core.database import db
from app.models.evento import (
    Evento, EventoItem, ReservaEspaco, ReservaMaterial, EventoEquipa,
    EstadoEvento, EstadoReservaEspaco, TipoItemEvento, Espaco
)
from app.models.material import Material
from app.models.produto import Produto
from app.models.pedido import Pedido, ItemPedido
from app.models.requisicao import Requisicao, RequisicaoItem, TipoRequisicao, SectorRequisicao, EstadoRequisicao, TipoItemRequisicao
from app.services.producao_service import ProducaoService
from app.services.audit_service import AuditService
from app.websocket.socket_manager import emit_sync_event

class PlanningEngine:
    """
    Motor de Planeamento e Orquestrador Operacional do Módulo de Eventos.
    Converte o contrato comercial do Evento em ordens operacionais nos módulos responsáveis:
    - Reserva de Espaços (bloqueio de disponibilidade e gestão de conflitos)
    - Reserva de Materiais (bloqueio de quantidade sem movimento direto de stock)
    - Afetação de Equipas (gestão de recursos humanos e disponibilidade)
    - Pedidos e Ordem de Produção (Integração automática com Cozinha, Pastelaria, Bar e Produção)
    - Requisições Operacionais (Saída física, entrega, devolução e ocorrências via módulo de Requisições)
    """

    def processar_planeamento_evento(self, evento_id, user_id):
        evento = Evento.query.get(evento_id)
        if not evento:
            return None, "Evento não encontrado"

        resumo_operacional = {
            "evento_id": evento.id,
            "numero_evento": evento.numero,
            "espacos_reservados": [],
            "materiais_reservados": [],
            "equipas_afetadas": [],
            "pedido_id": evento.pedido_id,
            "ordens_producao_geradas": 0,
            "requisicao_id": None,
            "alertas": []
        }

        # 1. ORQUESTRAR RESERVAS DE ESPAÇOS
        espacos_itens = [it for it in (evento.itens or []) if 'espaco' in str(it.tipo_item.value if hasattr(it.tipo_item, 'value') else it.tipo_item).lower()]
        
        # Sincronizar itens do tipo Espaço para a coleção ReservaEspaco se não existirem
        for it in espacos_itens:
            esp_id = it.referencia_id
            if esp_id:
                res_existente = next((r for r in (evento.reservas_espaco or []) if r.espaco_id == esp_id and r.estado != EstadoReservaEspaco.CANCELADO.value), None)
                if not res_existente:
                    d_inicio = datetime.combine(evento.data_evento, evento.hora_inicio) if hasattr(evento.data_evento, 'strftime') else evento.data_evento
                    d_fim = datetime.combine(evento.data_evento, evento.hora_fim) if hasattr(evento.data_evento, 'strftime') else evento.data_evento
                    re = ReservaEspaco(
                        evento_id=evento.id,
                        espaco_id=esp_id,
                        data_inicio=d_inicio,
                        data_fim=d_fim,
                        valor_aluguer=float(it.subtotal or 0),
                        estado=EstadoReservaEspaco.RESERVADO
                    )
                    evento.reservas_espaco.append(re)

        for re in (evento.reservas_espaco or []):
            if re.estado != EstadoReservaEspaco.CANCELADO.value:
                # Verificar conflito com outros eventos
                conflito = db.session.query(ReservaEspaco).filter(
                    ReservaEspaco.espaco_id == re.espaco_id,
                    ReservaEspaco.id != re.id,
                    ReservaEspaco.estado != EstadoReservaEspaco.CANCELADO.value,
                    ReservaEspaco.data_inicio < re.data_fim,
                    ReservaEspaco.data_fim > re.data_inicio
                ).first()
                if conflito:
                    resumo_operacional["alertas"].append(f"Conflito detetado no Espaço ID {re.espaco_id} para o horário especificado.")
                else:
                    re.estado = EstadoReservaEspaco.RESERVADO
                    resumo_operacional["espacos_reservados"].append({"espaco_id": re.espaco_id, "estado": re.estado.value if hasattr(re.estado, 'value') else str(re.estado)})

        # 2. ORQUESTRAR RESERVAS DE MATERIAIS
        materiais_itens = [it for it in (evento.itens or []) if any(k in str(it.tipo_item.value if hasattr(it.tipo_item, 'value') else it.tipo_item).lower() for k in ['material', 'aluguer'])]
        
        for it in materiais_itens:
            mat_id = it.referencia_id
            if mat_id:
                res_existente = next((r for r in (evento.reservas_material or []) if r.material_id == mat_id and r.estado != 'CANCELADO'), None)
                if not res_existente:
                    d_inicio = datetime.combine(evento.data_evento, evento.hora_inicio) if hasattr(evento.data_evento, 'strftime') else evento.data_evento
                    d_fim = datetime.combine(evento.data_evento, evento.hora_fim) if hasattr(evento.data_evento, 'strftime') else evento.data_evento
                    q = float(it.quantidade or 1)
                    pu = float(it.preco_unitario or 0)
                    rm = ReservaMaterial(
                        evento_id=evento.id,
                        material_id=mat_id,
                        quantidade=q,
                        valor_unitario=pu,
                        subtotal=q * pu,
                        data_inicio=d_inicio,
                        data_fim=d_fim,
                        estado='Reservado'
                    )
                    evento.reservas_material.append(rm)

        for rm in (evento.reservas_material or []):
            if rm.estado != 'CANCELADO':
                mat = db.session.query(Material).get(rm.material_id)
                if mat:
                    qtd_disp = float(mat.quantidade_disponivel or 0)
                    if float(rm.quantidade) > qtd_disp:
                        resumo_operacional["alertas"].append(f"Material '{mat.nome}' (ID {mat.id}) com quantidade solicitada ({rm.quantidade}) maior que disponível ({qtd_disp}).")
                rm.estado = 'Reservado'
                resumo_operacional["materiais_reservados"].append({"material_id": rm.material_id, "quantidade": float(rm.quantidade), "estado": rm.estado})

        # 3. ORQUESTRAR EQUIPAS
        for eq in (evento.equipas or []):
            if eq.estado != 'Cancelado':
                eq.estado = 'Confirmada'
                resumo_operacional["equipas_afetadas"].append({"utilizador_id": eq.utilizador_id, "funcao": str(eq.funcao), "estado": eq.estado})

        # 4. ORQUESTRAR PRODUTOS (PEDIDO & PRODUÇÃO)
        produtos_itens = [it for it in (evento.itens or []) if 'produto' in str(it.tipo_item.value if hasattr(it.tipo_item, 'value') else it.tipo_item).lower() and it.produto_id]
        
        if produtos_itens:
            # Garantir existência de Pedido vinculado
            if not evento.pedido_id:
                itens_pedido_data = []
                for p_it in produtos_itens:
                    itens_pedido_data.append(ItemPedido(
                        tipo_item=p_it.tipo_item.value if hasattr(p_it.tipo_item, 'value') else str(p_it.tipo_item),
                        produto_id=p_it.produto_id,
                        quantidade=float(p_it.quantidade or 1),
                        preco_unitario=float(p_it.preco_unitario or 0),
                        desconto=float(p_it.valor_desconto or 0),
                        subtotal=float(p_it.subtotal or 0),
                        descricao=p_it.descricao
                    ))
                
                num_pedido = f"PED-EVT-{datetime.utcnow().strftime('%Y%m%d%H%M')}-{evento.id}"
                novo_pedido = Pedido(
                    numero=num_pedido,
                    cliente_id=evento.cliente_id,
                    tipo_pedido='Agendado',
                    estado='Confirmado',
                    observacoes=f"Pedido de Produção/Cozinha gerado para o Evento {evento.numero}",
                    created_by=user_id
                )
                novo_pedido.itens.extend(itens_pedido_data)
                db.session.add(novo_pedido)
                db.session.flush()
                evento.pedido_id = novo_pedido.id
                resumo_operacional["pedido_id"] = novo_pedido.id

            # Acionar Ordem de Produção no módulo de Produção para itens que necessitem
            prod_service = ProducaoService()
            ordens, p_err = prod_service.gerar_ordens_por_pedido(evento.pedido_id, user_id)
            if ordens:
                resumo_operacional["ordens_producao_geradas"] = len(ordens)

        # 5. ORQUESTRAR REQUIÇÃO OPERACIONAL DE MATERIAIS
        reservas_ativas = [rm for rm in (evento.reservas_material or []) if rm.estado != 'CANCELADO']
        if reservas_ativas:
            # Verificar se já existe requisição criada para o evento
            req_existente = db.session.query(Requisicao).filter(Requisicao.evento_id == evento.id, Requisicao.estado != EstadoRequisicao.CANCELADA).first()
            if not req_existente:
                num_req = f"REQ-EVT-{datetime.utcnow().strftime('%Y%m%d')}-{evento.id}"
                req_itens = []
                for rm in reservas_ativas:
                    req_itens.append(RequisicaoItem(
                        tipo_item=TipoItemRequisicao.MATERIAL,
                        item_id=rm.material_id,
                        quantidade_solicitada=float(rm.quantidade)
                    ))

                nova_req = Requisicao(
                    numero=num_req,
                    tipo=TipoRequisicao.INICIAL,
                    sector=SectorRequisicao.EVENTOS,
                    responsavel_id=user_id or (evento.responsavel_id or 1),
                    evento_id=evento.id,
                    estado=EstadoRequisicao.PENDENTE,
                    motivo=f"Requisição operacional de materiais para o Evento {evento.numero}",
                    observacoes=f"Logística de entregas e devoluções vinculada ao Evento {evento.numero}"
                )
                nova_req.itens.extend(req_itens)
                db.session.add(nova_req)
                db.session.flush()
                resumo_operacional["requisicao_id"] = nova_req.id
            else:
                resumo_operacional["requisicao_id"] = req_existente.id

        # 6. ATUALIZAR ESTADO DO EVENTO
        if evento.estado in [EstadoEvento.CONFIRMADO.value, EstadoEvento.AGENDADO.value, 'Confirmado', 'Agendado']:
            evento.estado = EstadoEvento.PLANEAMENTO_GERADO.value

        db.session.commit()

        # 7. REGISTAR AUDITORIA CENTRALIZADA
        AuditService.log_action(
            user_id=user_id,
            action="MOTOR_PLANEAMENTO",
            table_name="eventos",
            record_id=evento.id,
            new_values={
                "estado": evento.estado,
                "resumo_operacional": resumo_operacional
            }
        )

        emit_sync_event('planeamento_concluido', {'evento_id': evento.id, 'numero': evento.numero})

        return resumo_operacional, None

import uuid
from datetime import datetime
from app.models.evento import (
    Evento, EventoServico, Espaco, ReservaEspaco, ReservaMaterial, EventoEquipa, 
    EstadoEvento, EstadoReservaEspaco, HistoricoReservaMaterial
)
from app.models.logistica import ReservaViatura
from app.models.material import Material
from app.repositories.evento_repos import EventoRepository, EspacoRepository
from app.services.audit_service import AuditService
from app.core.database import db
from app.websocket.socket_manager import socketio

class EventoService:
    def __init__(self):
        self.evento_repo = EventoRepository()
        self.espaco_repo = EspacoRepository()

    def create_espaco(self, data, user_id):
        espaco = Espaco(**data, created_by=user_id)
        self.espaco_repo.create(espaco)
        AuditService.log_action(user_id, "CREATE", "espacos", espaco.id)
        return espaco, None

    def _validar_conflitos(self, data, evento_id=None):
        # Reservas Espaço
        for r in data.get('reservas_espaco', []):
            d_inicio = r['data_inicio']
            d_fim = r['data_fim']
            
            query = db.session.query(ReservaEspaco).filter(
                ReservaEspaco.espaco_id == r['espaco_id'],
                ReservaEspaco.estado != EstadoReservaEspaco.CANCELADO.value,
                ReservaEspaco.data_inicio < d_fim,
                ReservaEspaco.data_fim > d_inicio
            )
            if evento_id:
                query = query.filter(ReservaEspaco.evento_id != evento_id)
            if query.first():
                return f"Conflito de reserva no espaço ID {r['espaco_id']}"

        # Reservas Equipa
        for e in data.get('equipas', []):
            query = db.session.query(EventoEquipa).join(Evento).filter(
                EventoEquipa.utilizador_id == e['utilizador_id'],
                Evento.estado != EstadoEvento.CANCELADO.value,
                Evento.data_evento == data.get('data_evento')
            )
            if evento_id:
                query = query.filter(EventoEquipa.evento_id != evento_id)
            if query.first():
                return f"Colaborador ID {e['utilizador_id']} já alocado para outro evento no mesmo dia."

        # Reservas Materiais
        for m in data.get('reservas_material', []):
            d_inicio = m['data_inicio']
            d_fim = m['data_fim']
            
            query = db.session.query(ReservaMaterial).filter(
                ReservaMaterial.material_id == m['material_id'],
                ReservaMaterial.estado != EstadoReservaEspaco.CANCELADO.value,
                ReservaMaterial.data_inicio < d_fim,
                ReservaMaterial.data_fim > d_inicio
            )
            if evento_id:
                query = query.filter(ReservaMaterial.evento_id != evento_id)
            
            reservas_existentes = query.all()
            quantidade_reservada = sum(float(r.quantidade) for r in reservas_existentes)
            
            material = db.session.query(Material).get(m['material_id'])
            if material and (quantidade_reservada + float(m['quantidade'])) > float(material.quantidade_disponivel):
                return f"Conflito: Material ID {m['material_id']} não tem quantidade suficiente disponível para o período."
        
        return None

    def _reservar_material(self, reserva, user_id):
        material = db.session.query(Material).with_for_update().get(reserva.material_id)
        if not material:
            return f"Material ID {reserva.material_id} nÃ£o encontrado."

        quantidade = float(reserva.quantidade)
        if float(material.quantidade_disponivel or 0) < quantidade:
            return f"Material '{material.nome}' sem quantidade disponÃ­vel para reserva."

        material.quantidade_disponivel = float(material.quantidade_disponivel or 0) - quantidade
        material.quantidade_reservada = float(material.quantidade_reservada or 0) + quantidade
        if float(material.quantidade_disponivel or 0) <= 0:
            material.estado = 'Reservado'

        db.session.add(HistoricoReservaMaterial(
            reserva_material_id=reserva.id,
            estado_anterior=None,
            estado_novo=reserva.estado,
            quantidade=quantidade,
            observacoes='Reserva criada para evento',
            created_by=user_id
        ))
        return None

    def alterar_estado_reserva_material(self, reserva_id, novo_estado, user_id, observacoes=None, danificado=False):
        reserva = db.session.query(ReservaMaterial).with_for_update().get(reserva_id)
        if not reserva:
            return None, "Reserva de material nÃ£o encontrada."

        material = db.session.query(Material).with_for_update().get(reserva.material_id)
        if not material:
            return None, "Material nÃ£o encontrado."

        estado_anterior = reserva.estado
        quantidade = float(reserva.quantidade)
        novo_estado_normalizado = str(novo_estado)

        if novo_estado_normalizado == 'Em Uso' and estado_anterior == 'Reservado':
            material.quantidade_reservada = max(0, float(material.quantidade_reservada or 0) - quantidade)
        elif novo_estado_normalizado == 'Devolvido' and estado_anterior in ['Reservado', 'Em Uso', 'Utilizado']:
            if estado_anterior == 'Reservado':
                material.quantidade_reservada = max(0, float(material.quantidade_reservada or 0) - quantidade)
            if danificado:
                material.quantidade_total = max(0, float(material.quantidade_total or 0) - quantidade)
                material.estado = 'Danificado'
            else:
                material.quantidade_disponivel = float(material.quantidade_disponivel or 0) + quantidade
                material.estado = 'Disponivel'
        elif novo_estado_normalizado == 'Cancelado' and estado_anterior == 'Reservado':
            material.quantidade_reservada = max(0, float(material.quantidade_reservada or 0) - quantidade)
            material.quantidade_disponivel = float(material.quantidade_disponivel or 0) + quantidade
            material.estado = 'Disponivel'

        reserva.estado = novo_estado_normalizado
        db.session.add(HistoricoReservaMaterial(
            reserva_material_id=reserva.id,
            estado_anterior=estado_anterior,
            estado_novo=novo_estado_normalizado,
            quantidade=quantidade,
            observacoes=observacoes,
            created_by=user_id
        ))
        db.session.commit()
        AuditService.log_action(user_id, "UPDATE_ESTADO_MATERIAL_EVENTO", "reservas_materiais", reserva.id,
                                old_values={"estado": estado_anterior},
                                new_values={"estado": novo_estado_normalizado, "danificado": danificado})
        return reserva, None

    def create_evento(self, data, user_id, auto_commit=True):
        error = self._validar_conflitos(data)
        if error: return None, error
        
        servicos_data = data.pop('servicos', [])
        espacos_data = data.pop('reservas_espaco', [])
        materiais_data = data.pop('reservas_material', [])
        equipas_data = data.pop('equipas', [])
        
        numero = f"EVT-{datetime.utcnow().strftime('%Y%M')}-{str(uuid.uuid4())[:6].upper()}"
        data['numero'] = numero
        valor_pago = float(data.get('valor_pago', 0))
        
        evento = Evento(**data, created_by=user_id)
        
        total = 0
        for s in servicos_data:
            subtotal = float(s['quantidade']) * float(s['valor_unitario'])
            total += subtotal
            es = EventoServico(**s, subtotal=subtotal)
            evento.servicos.append(es)
            
        for e in espacos_data:
            total += float(e.get('valor') or 0)
            re = ReservaEspaco(**e)
            evento.reservas_espaco.append(re)
            
        for m in materiais_data:
            material = db.session.query(Material).get(m['material_id'])
            valor_unitario = float(m.get('valor_unitario') or (material.valor_unitario if material else 0) or 0)
            subtotal = float(m['quantidade']) * valor_unitario
            total += subtotal
            reserva_payload = dict(m)
            reserva_payload.pop('valor_unitario', None)
            reserva_payload.pop('subtotal', None)
            rm = ReservaMaterial(**reserva_payload, valor_unitario=valor_unitario, subtotal=subtotal)
            evento.reservas_material.append(rm)
            
        for eq in equipas_data:
            eeq = EventoEquipa(**eq)
            evento.equipas.append(eeq)
            
        evento.valor_total = total
        evento.saldo = total - valor_pago
        
        db.session.add(evento)
        db.session.flush()

        if data.get('pedido_id'):
            from app.models.pedido import Pedido
            pedido = db.session.query(Pedido).with_for_update().get(data['pedido_id'])
            if pedido:
                pedido.evento_id = evento.id

        for reserva in evento.reservas_material:
            error = self._reservar_material(reserva, user_id)
            if error:
                db.session.rollback()
                return None, error

        if auto_commit:
            db.session.commit()
            AuditService.log_action(user_id, "CREATE", "eventos", evento.id)
        
        socketio.emit('novo_evento', {'numero': evento.numero})
        
        return evento, None

    def update_evento(self, evento_id, data, user_id):
        evento = self.evento_repo.get_by_id(evento_id)
        if not evento:
            return None, "Evento não encontrado"

        servicos_data = data.pop('servicos', None)
        data.pop('reservas_espaco', None)
        data.pop('reservas_material', None)
        data.pop('equipas', None)

        error = self._validar_conflitos(data, evento_id=evento.id)
        if error:
            return None, error

        campos_editaveis = [
            'cliente_id', 'pedido_id', 'tipo_evento', 'titulo', 'descricao',
            'local_evento', 'data_evento', 'hora_inicio', 'hora_fim',
            'numero_convidados', 'responsavel_id', 'cronograma', 'checklist',
            'equipamentos', 'observacoes', 'valor_pago'
        ]
        for campo in campos_editaveis:
            if campo in data:
                setattr(evento, campo, data[campo])

        if servicos_data is not None:
            evento.servicos.clear()
            db.session.flush()
            for servico in servicos_data:
                subtotal = float(servico['quantidade']) * float(servico['valor_unitario'])
                evento.servicos.append(EventoServico(**servico, subtotal=subtotal))

        total_servicos = sum(float(s.subtotal or 0) for s in evento.servicos)
        total_espacos = sum(float(r.valor or 0) for r in evento.reservas_espaco)
        total_materiais = sum(float(r.subtotal or 0) for r in evento.reservas_material)
        valor_pago = float(evento.valor_pago or 0)
        evento.valor_total = total_servicos + total_espacos + total_materiais
        evento.saldo = max(0, float(evento.valor_total or 0) - valor_pago)

        db.session.commit()
        AuditService.log_action(user_id, "UPDATE", "eventos", evento.id, new_values=data)
        socketio.emit('evento_atualizado', {'numero': evento.numero})
        return evento, None

    def delete_evento(self, evento_id, user_id):
        evento = self.evento_repo.get_by_id(evento_id)
        if not evento:
            return None, "Evento não encontrado"

        if hasattr(evento, 'soft_delete'):
            evento.soft_delete()
        else:
            evento.is_active = False
        db.session.commit()
        AuditService.log_action(user_id, "DELETE", "eventos", evento.id)
        socketio.emit('evento_removido', {'numero': evento.numero})
        return evento, None

    def alterar_estado(self, evento_id, estado, user_id):
        evento = self.evento_repo.get_by_id(evento_id)
        if not evento: return None, "Evento não encontrado"
        
        evento.estado = estado
        db.session.commit()
        
        AuditService.log_action(user_id, "UPDATE_ESTADO", "eventos", evento.id, new_values={"estado": estado})
        return evento, None

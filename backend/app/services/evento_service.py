import uuid
from datetime import datetime
from app.models.evento import (
    Evento, EventoServico, Espaco, ReservaEspaco, ReservaMaterial, EventoEquipa, 
    EstadoEvento, EstadoReservaEspaco
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

    def create_evento(self, data, user_id):
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
            re = ReservaEspaco(**e)
            evento.reservas_espaco.append(re)
            
        for m in materiais_data:
            # Check availability could be added here
            rm = ReservaMaterial(**m)
            evento.reservas_material.append(rm)
            
        for eq in equipas_data:
            eeq = EventoEquipa(**eq)
            evento.equipas.append(eeq)
            
        evento.valor_total = total
        evento.saldo = total - valor_pago
        
        self.evento_repo.create(evento)
        AuditService.log_action(user_id, "CREATE", "eventos", evento.id)
        
        socketio.emit('novo_evento', {'numero': evento.numero})
        
        return evento, None

    def alterar_estado(self, evento_id, estado, user_id):
        evento = self.evento_repo.get_by_id(evento_id)
        if not evento: return None, "Evento não encontrado"
        
        evento.estado = estado
        db.session.commit()
        
        AuditService.log_action(user_id, "UPDATE_ESTADO", "eventos", evento.id, new_values={"estado": estado})
        return evento, None

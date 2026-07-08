import uuid
from datetime import datetime
from app.models.logistica import (
    Motorista, Viatura, Entrega, ChecklistEntrega, OcorrenciaLogistica, EstadoEntrega
)
from app.repositories.logistica_repos import MotoristaRepository, ViaturaRepository, EntregaRepository
from app.services.audit_service import AuditService
from app.core.database import db
from app.websocket.socket_manager import socketio

class LogisticaService:
    def __init__(self):
        self.motorista_repo = MotoristaRepository()
        self.viatura_repo = ViaturaRepository()
        self.entrega_repo = EntregaRepository()

    def create_motorista(self, data, user_id):
        m = Motorista(**data, created_by=user_id)
        self.motorista_repo.create(m)
        AuditService.log_action(user_id, "CREATE", "motoristas", m.id)
        return m, None

    def create_viatura(self, data, user_id):
        v = Viatura(**data, created_by=user_id)
        self.viatura_repo.create(v)
        AuditService.log_action(user_id, "CREATE", "viaturas", v.id)
        return v, None

    def _validar_conflitos(self, data):
        # Valida motorista
        if data.get('motorista_id'):
            query = db.session.query(Entrega).filter(
                Entrega.motorista_id == data['motorista_id'],
                Entrega.data_prevista == data.get('data_prevista'),
                Entrega.estado.in_([EstadoEntrega.PENDENTE.value, EstadoEntrega.EM_TRANSITO.value])
            )
            if query.first():
                return f"Motorista ID {data['motorista_id']} já tem uma entrega pendente para a mesma data prevista."
                
        # Valida viatura
        if data.get('viatura_id'):
            query = db.session.query(Entrega).filter(
                Entrega.viatura_id == data['viatura_id'],
                Entrega.data_prevista == data.get('data_prevista'),
                Entrega.estado.in_([EstadoEntrega.PENDENTE.value, EstadoEntrega.EM_TRANSITO.value])
            )
            if query.first():
                return f"Viatura ID {data['viatura_id']} já está alocada para uma entrega pendente para a mesma data."
                
        return None

    def create_entrega(self, data, user_id):
        error = self._validar_conflitos(data)
        if error: return None, error
        
        checklists_data = data.pop('checklists', [])
        numero = f"ENT-{datetime.utcnow().strftime('%Y%M')}-{str(uuid.uuid4())[:6].upper()}"
        data['numero'] = numero
        
        entrega = Entrega(**data, created_by=user_id)
        
        for c in checklists_data:
            chk = ChecklistEntrega(**c)
            entrega.checklists.append(chk)
            
        self.entrega_repo.create(entrega)
        AuditService.log_action(user_id, "CREATE", "entregas", entrega.id)
        return entrega, None

    def alterar_estado_entrega(self, entrega_id, estado, user_id):
        entrega = self.entrega_repo.get_by_id(entrega_id)
        if not entrega: return None, "Entrega não encontrada"
        
        entrega.estado = estado
        
        if estado == EstadoEntrega.EM_TRANSITO.value:
            socketio.emit('entrega_iniciada', {'numero': entrega.numero})
        elif estado == EstadoEntrega.ENTREGUE.value:
            socketio.emit('entrega_concluida', {'numero': entrega.numero})
            
        db.session.commit()
        AuditService.log_action(user_id, "UPDATE_ESTADO", "entregas", entrega.id)
        return entrega, None

    def registrar_ocorrencia(self, entrega_id, data, user_id):
        entrega = self.entrega_repo.get_by_id(entrega_id)
        if not entrega: return None, "Entrega não encontrada"
        
        data['entrega_id'] = entrega.id
        ocorrencia = OcorrenciaLogistica(**data)
        db.session.add(ocorrencia)
        db.session.commit()
        
        AuditService.log_action(user_id, "REGISTO_OCORRENCIA", "ocorrencias_logisticas", ocorrencia.id)
        socketio.emit('logistica_ocorrencia', {'entrega': entrega.numero, 'tipo': ocorrencia.tipo})
        return ocorrencia, None

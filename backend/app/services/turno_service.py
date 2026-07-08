from app.models.turno import Turno
from app.core.database import db
from app.services.audit_service import AuditService
from datetime import datetime

class TurnoService:
    def list_turnos(self, active_only=False):
        try:
            query = Turno.query
            if active_only:
                query = query.filter_by(ativo=True)
            turnos = query.all()
            
            result = []
            for t in turnos:
                result.append({
                    "id": t.id,
                    "nome": t.nome,
                    "hora_inicio": t.hora_inicio.strftime("%H:%M:%S") if t.hora_inicio else None,
                    "hora_fim": t.hora_fim.strftime("%H:%M:%S") if t.hora_fim else None,
                    "ativo": t.ativo
                })
            return result, None
        except Exception as e:
            return None, str(e)

    def create_turno(self, data, user_id=None):
        try:
            nome = data.get('nome')
            if not nome:
                return None, "O nome do turno é obrigatório"
            
            # Check duplicate name
            existing = Turno.query.filter_by(nome=nome).first()
            if existing:
                return None, f"Já existe um turno com o nome '{nome}'"
            
            hora_inicio_str = data.get('hora_inicio')
            hora_fim_str = data.get('hora_fim')
            
            hora_inicio = datetime.strptime(hora_inicio_str, "%H:%M").time() if hora_inicio_str else None
            hora_fim = datetime.strptime(hora_fim_str, "%H:%M").time() if hora_fim_str else None
            
            turno = Turno(
                nome=nome,
                hora_inicio=hora_inicio,
                hora_fim=hora_fim,
                ativo=True
            )
            
            db.session.add(turno)
            db.session.commit()
            
            if user_id:
                AuditService.log_action(user_id, "CREATE", "turnos", turno.id, new_values=data)
                
            return {
                "id": turno.id,
                "nome": turno.nome,
                "hora_inicio": turno.hora_inicio.strftime("%H:%M:%S") if turno.hora_inicio else None,
                "hora_fim": turno.hora_fim.strftime("%H:%M:%S") if turno.hora_fim else None,
                "ativo": turno.ativo
            }, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)

    def update_turno(self, turno_id, data, user_id=None):
        try:
            turno = Turno.query.get(turno_id)
            if not turno:
                return None, "Turno não encontrado"
            
            nome = data.get('nome')
            if nome:
                # Check duplicate name
                existing = Turno.query.filter_by(nome=nome).first()
                if existing and existing.id != turno_id:
                    return None, f"Já existe outro turno com o nome '{nome}'"
                turno.nome = nome
            
            if 'hora_inicio' in data:
                hora_inicio_str = data.get('hora_inicio')
                turno.hora_inicio = datetime.strptime(hora_inicio_str, "%H:%M").time() if hora_inicio_str else None
                
            if 'hora_fim' in data:
                hora_fim_str = data.get('hora_fim')
                turno.hora_fim = datetime.strptime(hora_fim_str, "%H:%M").time() if hora_fim_str else None
                
            if 'ativo' in data:
                turno.ativo = bool(data.get('ativo'))
                
            db.session.commit()
            
            if user_id:
                AuditService.log_action(user_id, "UPDATE", "turnos", turno.id, new_values=data)
                
            return {
                "id": turno.id,
                "nome": turno.nome,
                "hora_inicio": turno.hora_inicio.strftime("%H:%M:%S") if turno.hora_inicio else None,
                "hora_fim": turno.hora_fim.strftime("%H:%M:%S") if turno.hora_fim else None,
                "ativo": turno.ativo
            }, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)

    def toggle_turno_status(self, turno_id, user_id=None):
        try:
            turno = Turno.query.get(turno_id)
            if not turno:
                return None, "Turno não encontrado"
            
            turno.ativo = not turno.ativo
            db.session.commit()
            
            if user_id:
                AuditService.log_action(user_id, "TOGGLE_STATUS", "turnos", turno.id, new_values={"ativo": turno.ativo})
                
            return {
                "id": turno.id,
                "nome": turno.nome,
                "ativo": turno.ativo
            }, None
        except Exception as e:
            db.session.rollback()
            return None, str(e)

turno_service = TurnoService()

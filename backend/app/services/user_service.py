from werkzeug.security import generate_password_hash
from app.models.user import User, RoleEnum
from app.repositories.user_repository import UserRepository
from app.services.audit_service import AuditService

class UserService:
    def __init__(self):
        self.user_repo = UserRepository()

    def create_user(self, data, current_user_id):
        existing_user = self.user_repo.get_by_email(data.get('email'))
        if existing_user:
            return None, "Email já cadastrado"

        hashed_password = generate_password_hash(data.get('password'))
        new_user = User(
            name=data.get('name'),
            email=data.get('email'),
            password_hash=hashed_password,
            role=data.get('role', RoleEnum.ATENDIMENTO),
            created_by=current_user_id
        )
        
        created_user = self.user_repo.create(new_user)
        
        AuditService.log_action(
            user_id=current_user_id,
            action="CREATE",
            entidade="users",
            record_id=created_user.id,
            new_values={"name": created_user.name, "email": created_user.email, "role": created_user.role}
        )
        return created_user, None

    def get_all_users(self):
        return self.user_repo.get_all()
        
    def get_user_by_id(self, id):
        return self.user_repo.get_by_id(id)

    def update_user(self, user_id, data, current_user_id):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return None, "Utilizador não encontrado"
            
        if 'email' in data and data['email'] != user.email:
            existing = self.user_repo.get_by_email(data['email'])
            if existing:
                return None, "Email já cadastrado"
            user.email = data['email']
            
        if 'name' in data:
            user.name = data['name']
        if 'role' in data:
            user.role = data['role']
        if 'password' in data and data['password']:
            user.password_hash = generate_password_hash(data['password'])
            
        user.updated_by = current_user_id
        from app.core.database import db
        db.session.commit()
        
        AuditService.log_action(
            user_id=current_user_id,
            action="UPDATE",
            entidade="users",
            record_id=user.id,
            new_values={"name": user.name, "email": user.email, "role": user.role}
        )
        return user, None

    def toggle_status(self, user_id, current_user_id):
        user = self.user_repo.get_by_id(user_id)
        if not user:
            return None, "Utilizador não encontrado"
            
        if user.id == current_user_id:
            return None, "Não pode desativar o próprio utilizador"
            
        user.is_active = not user.is_active
        user.updated_by = current_user_id
        from app.core.database import db
        db.session.commit()
        
        AuditService.log_action(
            user_id=current_user_id,
            action="TOGGLE_STATUS",
            entidade="users",
            record_id=user.id,
            new_values={"is_active": user.is_active}
        )
        return user, None

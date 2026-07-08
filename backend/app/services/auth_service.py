from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, create_refresh_token
from app.repositories.user_repository import UserRepository
from app.services.audit_service import AuditService
from app.models.token_blocklist import TokenBlocklist
from app.core.database import db

class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()

    def authenticate(self, email, password):
        user = self.user_repo.get_by_email(email)
        
        if not user or not check_password_hash(user.password_hash, password):
            if user:
                AuditService.log_action(user.id, "LOGIN_FAILED", "users", user.id)
            return None, "Login ou senha incorretos"
            
        if not user.is_active:
            AuditService.log_action(user.id, "LOGIN_BLOCKED", "users", user.id)
            return None, "Utilizador encontra-se inativo"
            
        access_token = create_access_token(identity=str(user.id), additional_claims={"role": user.role})
        refresh_token = create_refresh_token(identity=str(user.id))
        
        AuditService.log_action(user.id, "LOGIN", "users", user.id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role
            }
        }, None

    def logout(self, jti, user_id):
        try:
            db.session.add(TokenBlocklist(jti=jti))
            db.session.commit()
            AuditService.log_action(user_id, "LOGOUT", "users", user_id)
            return True, None
        except Exception as e:
            db.session.rollback()
            return False, "Erro ao fazer logout"

    def refresh(self, user_id, role):
        access_token = create_access_token(identity=str(user_id), additional_claims={"role": role})
        return {"access_token": access_token}, None

    def change_password(self, user_id, old_password, new_password):
        user = self.user_repo.get_by_id(user_id)
        if not user or not check_password_hash(user.password_hash, old_password):
            return False, "Senha antiga incorreta"
            
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        AuditService.log_action(user.id, "UPDATE_PASSWORD", "users", user.id)
        return True, None

    def recover_password(self, email):
        import string
        import random
        user = self.user_repo.get_by_email(email)
        if not user:
            # Prevent email enumeration by returning success anyway
            return True, None, None
            
        # Generate temporary password
        chars = string.ascii_letters + string.digits
        temp_pwd = ''.join(random.choice(chars) for _ in range(8))
        
        user.password_hash = generate_password_hash(temp_pwd)
        db.session.commit()
        
        AuditService.log_action(user.id, "PASSWORD_RECOVERY", "users", user.id)
        return True, None, temp_pwd


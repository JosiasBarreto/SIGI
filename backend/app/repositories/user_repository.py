from typing import Optional
from app.models.user import User
from app.repositories.base_repository import BaseRepository
from app.core.database import db

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User)

    def get_by_email(self, email: str) -> Optional[User]:
        return db.session.query(User).filter_by(email=email).first()

    def get_by_id(self, id: int) -> Optional[User]:
        return db.session.query(User).filter_by(id=id).first()

    def get_all(self):
        return db.session.query(User).all()

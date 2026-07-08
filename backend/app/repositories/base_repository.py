from typing import TypeVar, Generic, Type, List, Optional
from app.core.database import db

T = TypeVar('T')

class BaseRepository(Generic[T]):
    def __init__(self, model_class: Type[T]):
        self.model_class = model_class

    def get_by_id(self, id: int) -> Optional[T]:
        return db.session.query(self.model_class).filter_by(id=id, is_active=True).first()

    def get_all(self) -> List[T]:
        return db.session.query(self.model_class).filter_by(is_active=True).all()

    def create(self, obj: T) -> T:
        db.session.add(obj)
        db.session.commit()
        return obj

    def update(self, obj: T) -> T:
        db.session.commit()
        return obj

    def get_paginated(self, page=1, per_page=10, filters=None, search=None, search_fields=None, include_inactive=False):
        from sqlalchemy import or_
        query = db.session.query(self.model_class)
        if not include_inactive:
            query = query.filter_by(is_active=True)
        
        if filters:
            for k, v in filters.items():
                if hasattr(self.model_class, k) and v is not None and v != "":
                    query = query.filter(getattr(self.model_class, k) == v)
                    
        if search and search_fields:
            search_filters = [getattr(self.model_class, field).ilike(f"%{search}%") for field in search_fields if hasattr(self.model_class, field)]
            if search_filters:
                query = query.filter(or_(*search_filters))
                
        return query.paginate(page=page, per_page=per_page, error_out=False)

    def delete(self, obj: T) -> None:
        if hasattr(obj, 'soft_delete'):
            obj.soft_delete()
        else:
            db.session.delete(obj)
            db.session.commit()

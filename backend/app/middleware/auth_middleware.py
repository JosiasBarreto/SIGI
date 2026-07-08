from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def requires_roles(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in roles and claims.get("role") != 'Administrador':
                return jsonify(msg="Acesso negado: Perfil insuficiente para esta operação"), 403
            return fn(*args, **kwargs)
        return decorator
    return wrapper

from flask_jwt_extended import JWTManager
from app.models.token_blocklist import TokenBlocklist

jwt = JWTManager()

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload: dict) -> bool:
    jti = jwt_payload["jti"]
    token = TokenBlocklist.query.filter_by(jti=jti).one_or_none()
    return token is not None

@jwt.user_lookup_loader
def user_lookup_callback(_jwt_header, jwt_data):
    identity = jwt_data["sub"]
    from app.models.user import User
    return User.query.filter_by(id=identity, is_active=True).one_or_none()

import os

from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_jwt_extended import decode_token
from app.models.user import User

socketio = SocketIO(
    cors_allowed_origins=os.environ.get('SOCKETIO_CORS_ALLOWED_ORIGINS', '*'),
    message_queue=os.environ.get('SOCKETIO_MESSAGE_QUEUE') or None,
)


def production_room(role):
    """Return the canonical Socket.IO room for a production role."""
    return str(role).strip().lower().replace(' ', '_')

def send_notification(user_id, message, module="geral"):
    """
    Utility to emit notifications to a specific user's room
    """
    socketio.emit('notification', {'message': message, 'module': module}, room=f"user_{user_id}")

def broadcast_production_update(op_numero, estado):
    """
    Utility to broadcast a production update internally
    """
    socketio.emit('production_update', {'numero': op_numero, 'estado': estado}, room="producao")


def notify_production_orders(pedido_id, numero, sectors):
    """Notify only the departments which received production orders."""
    for sector in {str(sector.value if hasattr(sector, 'value') else sector) for sector in sectors}:
        socketio.emit(
            'nova_ordem_producao',
            {'pedido_id': pedido_id, 'numero': numero, 'sector': sector},
            room=production_room(sector),
        )

@socketio.on('connect')
def handle_connect():
    # Ideally should authenticate, but for now we accept connections
    pass

@socketio.on('join')
def on_join(data):
    # Rooms are derived from the signed-in user; clients cannot subscribe to
    # arbitrary operational departments by supplying a room name.
    token = (data or {}).get('token')
    if not token:
        emit('error', {'msg': 'Autenticação Socket.IO obrigatória.'})
        return
    try:
        user_id = decode_token(token)['sub']
        user = User.query.get(user_id)
    except Exception:
        emit('error', {'msg': 'Token Socket.IO inválido.'})
        return
    if not user:
        emit('error', {'msg': 'Utilizador não encontrado.'})
        return
    if user_id:
        room = f"user_{user_id}"
        join_room(room)
        emit('status', {'msg': f'Joined {room}'}, room=room)
    role_room = production_room(user.role.value if hasattr(user.role, 'value') else user.role)
    join_room(role_room)
    emit('status', {'msg': f'Joined {role_room}'}, room=room)

@socketio.on('leave')
def on_leave(data):
    user_id = data.get('user_id')
    if user_id:
        room = f"user_{user_id}"
        leave_room(room)
    rooms = data.get('rooms', [])
    for r in rooms:
        leave_room(r)

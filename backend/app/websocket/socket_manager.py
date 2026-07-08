from flask_socketio import SocketIO, emit, join_room, leave_room
from flask import request

socketio = SocketIO(cors_allowed_origins="*")

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

@socketio.on('connect')
def handle_connect():
    # Ideally should authenticate, but for now we accept connections
    pass

@socketio.on('join')
def on_join(data):
    # Data is expected to be dict with user_id and roles/rooms
    user_id = data.get('user_id')
    if user_id:
        room = f"user_{user_id}"
        join_room(room)
        emit('status', {'msg': f'Joined {room}'}, room=room)
    
    rooms = data.get('rooms', [])
    for r in rooms:
        join_room(r)
        emit('status', {'msg': f'Joined {r}'}, room=r)

@socketio.on('leave')
def on_leave(data):
    user_id = data.get('user_id')
    if user_id:
        room = f"user_{user_id}"
        leave_room(room)
    rooms = data.get('rooms', [])
    for r in rooms:
        leave_room(r)

"""SIGI application entry point.

Database schema installation is an explicit deployment step (`db/schema.sql`).
Starting the API must never mutate a production database.
"""
import os

from app import create_app
from app.websocket.socket_manager import socketio


app = create_app()


if __name__ == '__main__':
    socketio.run(
        app,
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', '8000')),
        debug=os.environ.get('FLASK_DEBUG', '').lower() in ('1', 'true'),
    )

"""SIGI ERP application entry point.
Inicialização do servidor com verificação automática da base de dados.
"""
import os
import sys
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env na pasta backend se existir
current_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(current_dir, '.env'))

# Patch preventivo para Werkzeug 3.0+ em modo desenvolvimento (evita AssertionError: write() before start_response em upgrades WebSocket)
try:
    import werkzeug.serving
    _orig_run_wsgi = werkzeug.serving.WSGIRequestHandler.run_wsgi
    def _safe_run_wsgi(self):
        try:
            return _orig_run_wsgi(self)
        except AssertionError as e:
            if "write() before start_response" in str(e):
                return
            raise
    werkzeug.serving.WSGIRequestHandler.run_wsgi = _safe_run_wsgi
except Exception:
    pass

from app import create_app
from app.websocket.socket_manager import socketio

app = create_app()

if __name__ == '__main__':
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', '8000'))
    debug = os.environ.get('FLASK_DEBUG', '').lower() in ('1', 'true')
    
    print("\n" + "=" * 65)
    print(f"🚀 [SIGI ERP] Servidor Backend ativo em http://{host}:{port}")
    print(f"📄 Documentação Swagger em: http://{host}:{port}/swagger/")
    print("=" * 65 + "\n")

    socketio.run(
        app,
        host=host,
        port=port,
        debug=debug,
        allow_unsafe_werkzeug=True
    )

"""SIGI ERP application entry point.
Inicialização do servidor com verificação automática da base de dados e Socket.IO.
"""
import os
import sys
import logging
from dotenv import load_dotenv

# Carregar variáveis de ambiente do .env na pasta backend se existir
current_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(current_dir, '.env'))

# Configurar logging básico
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("SIGI-RUN")

# Patch preventivo e resiliente para Werkzeug em modo desenvolvimento (evita AssertionError: write() before start_response)
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
        except Exception as e:
            if "write() before start_response" in str(e):
                return
            raise
    werkzeug.serving.WSGIRequestHandler.run_wsgi = _safe_run_wsgi

    _orig_log_error = werkzeug.serving.WSGIRequestHandler.log_error
    def _safe_log_error(self, format, *args):
        if args and any("write() before start_response" in str(a) for a in args):
            return
        return _orig_log_error(self, format, *args)
    werkzeug.serving.WSGIRequestHandler.log_error = _safe_log_error
except Exception:
    pass

from app import create_app
from app.websocket.socket_manager import socketio
from app.core.database import db
from sqlalchemy import text

app = create_app()

def verify_database_connection(flask_app):
    """Verifica se a base de dados está acessível no arranque."""
    with flask_app.app_context():
        try:
            db.session.execute(text("SELECT 1"))
            logger.info("✅ Conexão com a Base de Dados estabelecida com sucesso.")
        except Exception as e:
            logger.warning(f"⚠️ Aviso: Não foi possível conectar à base de dados no arranque: {e}")
            logger.warning("O servidor irá iniciar, mas certifique-se de que o MySQL/MariaDB está a correr e configurado.")

if __name__ == '__main__':
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', '8000'))
    debug = os.environ.get('FLASK_DEBUG', '').lower() in ('1', 'true', 'yes')

    verify_database_connection(app)
    
    print("\n" + "=" * 65)
    print(f"🚀 [SIGI ERP] Servidor Backend ativo em http://{host}:{port}")
    print(f"📄 Documentação Swagger em: http://{host}:{port}/swagger/")
    print(f"🔌 WebSocket e Notificações em Tempo Real ativos")
    print("=" * 65 + "\n")

    socketio.run(
        app,
        host=host,
        port=port,
        debug=debug,
        allow_unsafe_werkzeug=True
    )

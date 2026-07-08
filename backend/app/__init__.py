import os
from flask import Flask, redirect
from flask_cors import CORS
from flasgger import Swagger

from app.core.database import db
from app.core.jwt import jwt
from app.websocket.socket_manager import socketio
from app.config.settings import Config
from app.core.errors import register_error_handlers
from app.swagger import build_swagger_template
from flask_migrate import Migrate

migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    migrate.init_app(app, db)
    
    swagger_config = {
        "headers": [],
        "specs": [
            {
                "endpoint": "apispec",
                "route": "/apispec.json",
                "rule_filter": lambda rule: True,
                "model_filter": lambda tag: True,
            }
        ],
        "static_url_path": "/flasgger_static",
        "swagger_ui": True,
        "specs_route": "/swagger/"
    }

    register_error_handlers(app)

    @app.route('/api/health', methods=['GET'])
    def health():
        return {"status": "healthy"}, 200

    @app.route('/api/version', methods=['GET'])
    def version():
        return {"version": "1.0.0"}, 200

    @app.route('/swagger', methods=['GET'])
    @app.route('/swugger', methods=['GET'])
    @app.route('/docs', methods=['GET'])
    @app.route('/api/docs', methods=['GET'])
    def swagger_redirect():
        return redirect('/swagger/', code=302)

    # Register blueprints safely
   # Register blueprints safely
    from app.models.comercial import Venda, VendaItem, TaxaIVA, SerieDocumento, FechoDiario
    from app.api.v1.auth_controller import auth_bp
    from app.api.v1.user_controller import user_bp
    from app.api.v1.armazem_controller import armazem_bp
    from app.api.v1.pedido_controller import pedido_bp
    from app.api.v1.producao_controller import producao_bp
    from app.api.v1.requisicao_controller import requisicao_bp
    from app.api.v1.evento_controller import evento_bp
    from app.api.v1.logistica_controller import logistica_bp
    from app.api.v1.calendario_controller import calendario_bp
    from app.api.v1.financeiro_controller import financeiro_bp
    from app.api.v1.relatorios_controller import relatorios_bp
    from app.api.v1.inventario_controller import inventario_bp
    from app.api.v1.auditoria_controller import auditoria_bp
    
    from app.api.v1.comercial_controller import comercial_bp, fiscal_bp
    from app.api.v1.producao_nova_controller import producao_lote_bp
    from app.api.v1.turno_controller import turno_bp
    from app.api.v1.receita_controller import receita_bp
    from app.api.v1.setup_controller import setup_bp
    
    app.register_blueprint(setup_bp, url_prefix='/api/v1/setup')
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(user_bp, url_prefix='/api/v1/users')
    app.register_blueprint(comercial_bp, url_prefix='/api/v1/vendas')
    app.register_blueprint(fiscal_bp, url_prefix='/api/v1/fiscal')
    app.register_blueprint(armazem_bp, url_prefix='/api/v1/armazem')
    app.register_blueprint(pedido_bp, url_prefix='/api/v1/pedidos')
    app.register_blueprint(producao_bp, url_prefix='/api/v1/producao')
    app.register_blueprint(requisicao_bp, url_prefix='/api/v1/requisicoes')
    app.register_blueprint(evento_bp, url_prefix='/api/v1/eventos')
    app.register_blueprint(logistica_bp, url_prefix='/api/v1/logistica')
    app.register_blueprint(calendario_bp, url_prefix='/api/v1/calendario')
    app.register_blueprint(financeiro_bp, url_prefix='/api/v1/financeiro')
    app.register_blueprint(relatorios_bp, url_prefix='/api/v1/relatorios')
    app.register_blueprint(inventario_bp, url_prefix='/api/v1/inventario')
    app.register_blueprint(auditoria_bp, url_prefix='/api/v1/auditoria')
    app.register_blueprint(producao_lote_bp, url_prefix='/api/v1/producao_nova')
    app.register_blueprint(receita_bp, url_prefix='/api/v1/receitas')
    app.register_blueprint(turno_bp, url_prefix='/api/v1/turnos')

    Swagger(app, config=swagger_config, template=build_swagger_template(app))
    

    return app

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
from sqlalchemy import inspect, text
import logging

migrate = Migrate()
logger = logging.getLogger(__name__)


def _ensure_notification_schema():
    """Completa, sem apagar dados, colunas introduzidas nas notificações.

    Algumas instalações SIGI foram criadas antes de ``entidade_tipo`` e outras
    antes do barramento estruturado. Não usamos ``ADD COLUMN IF NOT EXISTS``:
    essa sintaxe não existe em diversas versões MariaDB/MySQL e anteriormente o
    erro era engolido, deixando a aplicação a consultar colunas inexistentes.
    """
    try:
        inspector = inspect(db.engine)
        if not inspector.has_table('notificacoes'):
            return
        existing = {column['name'] for column in inspector.get_columns('notificacoes')}
    except Exception:
        # A aplicação pode arrancar antes da BD estar disponível (por exemplo,
        # durante testes ou no primeiro arranque de um serviço). Mantém o
        # comportamento resiliente anterior e tenta de novo no próximo boot.
        logger.warning('Não foi possível inspecionar a tabela notificacoes durante o arranque.', exc_info=True)
        return
    columns = {
        'entidade_tipo': 'VARCHAR(50) NULL',
        'entidade_id': 'INTEGER NULL',
        'event_id': 'VARCHAR(64) NULL',
        'event_type': 'VARCHAR(64) NULL',
        'entity_type': 'VARCHAR(64) NULL',
        'entity_id': 'INTEGER NULL',
        'aggregate_id': 'VARCHAR(128) NULL',
        'actor_user_id': 'INTEGER NULL',
        'recipient_user_id': 'INTEGER NULL',
        'recipient_role': 'VARCHAR(50) NULL',
        'canal': 'VARCHAR(30) NULL',
        'persistente': 'BOOLEAN NOT NULL DEFAULT FALSE',
        'desativada_em': 'DATETIME NULL',
        'desativada_por': 'INTEGER NULL',
        'expira_em': 'DATETIME NULL',
        'target_type': 'VARCHAR(20) NULL',
        'target_role': 'VARCHAR(50) NULL',
        'target_sector': 'VARCHAR(50) NULL',
        'target_user_id': 'INTEGER NULL',
        'metadados': 'JSON NULL',
    }

    for name, definition in columns.items():
        if name in existing:
            continue
        try:
            db.session.execute(text(f'ALTER TABLE notificacoes ADD COLUMN {name} {definition}'))
            db.session.commit()
            logger.info('Coluna notificacoes.%s criada com sucesso.', name)
        except Exception:
            db.session.rollback()
            logger.exception('Não foi possível criar a coluna notificacoes.%s.', name)

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
    from app.api.v1.notificacao_controller import notificacao_bp
    
    app.register_blueprint(setup_bp, url_prefix='/api/v1/setup')
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(user_bp, url_prefix='/api/v1/users')
    app.register_blueprint(comercial_bp, url_prefix='/api/v1/vendas')
    app.register_blueprint(comercial_bp, url_prefix='/api/v1/comercial', name='comercial_alt')
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
    app.register_blueprint(notificacao_bp, url_prefix='/api/v1/notificacoes')
    app.register_blueprint(notificacao_bp, url_prefix='/api/notificacoes', name='notificacoes_alt')
    app.register_blueprint(inventario_bp, url_prefix='/api/v1/inventario')
    app.register_blueprint(auditoria_bp, url_prefix='/api/v1/auditoria')
    app.register_blueprint(producao_lote_bp, url_prefix='/api/v1/producao_nova')
    app.register_blueprint(receita_bp, url_prefix='/api/v1/receitas')
    app.register_blueprint(turno_bp, url_prefix='/api/v1/turnos')

    with app.app_context():
        _ensure_notification_schema()

    Swagger(app, config=swagger_config, template=build_swagger_template(app))
    

    return app

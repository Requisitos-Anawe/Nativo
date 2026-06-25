import os

from flask import Flask
from flasgger import Swagger

from app.routes.UsuarioRoute import bp as usuarios_bp
from app.routes.DiscursoRoute import bp as discurso_bp
from app.routes.AuthRoute import bp as auth_bp
from app.routes.TraducaoRoute import bp as traducao_bp
from app.routes.IdiomaRoute import bp as idioma_bp
from app.routes.CategoriaRoute import bp as categoria_bp
from app.routes.PerfilRoute import bp as perfil_bp
from app.routes.AtividadeRoute import bp as atividade_bp
from app.routes.PraticaAtividadeRoute import bp as pratica_atividade_bp
from app.routes.FavoritoRoute import bp as favorito_bp
from app.routes.HistoricoRoute import bp as historico_bp
from app.routes.UploadRoute import bp as upload_bp
from app.routes.SyncRoute import sync_bp

def create_app():
    app = Flask(__name__)
    if os.getenv('FLASK_ENV') == 'development':
        Swagger(app, template={
            'swagger': '2.0',
            'info': {
                'title': 'Nativo API',
                'version': '1.0'
            },
            'securityDefinitions': {
                'Bearer': {
                    'type': 'apiKey',
                    'name': 'Authorization',
                    'in': 'header',
                    'description': 'Digite: Bearer <seu_token>'
                }
            }
        })

    app.register_blueprint(usuarios_bp, url_prefix='/api')
    app.register_blueprint(discurso_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(traducao_bp, url_prefix='/api')
    app.register_blueprint(idioma_bp, url_prefix='/api')
    app.register_blueprint(categoria_bp, url_prefix='/api')
    app.register_blueprint(perfil_bp, url_prefix='/api')
    app.register_blueprint(atividade_bp, url_prefix='/api')
    app.register_blueprint(pratica_atividade_bp, url_prefix='/api')
    app.register_blueprint(favorito_bp, url_prefix='/api')
    app.register_blueprint(historico_bp, url_prefix='/api')
    app.register_blueprint(upload_bp, url_prefix='/api')
    app.register_blueprint(sync_bp, url_prefix="/api")

    return app

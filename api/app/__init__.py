from flask import Flask
from app.routes.UsuarioRoute import bp as usuarios_bp
from app.routes.DiscursoRoute import bp as discurso_bp
from app.routes.AuthRoute import bp as auth_bp
from app.routes.TraducaoRoute import bp as traducao_bp
from app.routes.IdiomaRoute import bp as idioma_bp
from app.routes.CategoriaRoute import bp as categoria_bp
from app.routes.PerfilRoute import bp as perfil_bp
from app.routes.UploadRoute import bp as upload_bp

def create_app():
    app = Flask(__name__)

    # Registra rotas
    app.register_blueprint(usuarios_bp, url_prefix="/api")
    app.register_blueprint(discurso_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(traducao_bp, url_prefix="/api")
    app.register_blueprint(idioma_bp, url_prefix="/api")
    app.register_blueprint(categoria_bp, url_prefix="/api")
    app.register_blueprint(perfil_bp, url_prefix="/api")
    app.register_blueprint(upload_bp, url_prefix="/api")
    return app

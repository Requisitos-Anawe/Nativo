from flask import Flask
from app.routes.UsuarioRoute import bp as usuarios_bp
from app.routes.DiscursoRoute import bp as discurso_bp
from app.routes.AuthRoute import bp as auth_bp

def create_app():
    app = Flask(__name__)

    # Registra rotas
    app.register_blueprint(usuarios_bp, url_prefix="/api")
    app.register_blueprint(discurso_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api")

    return app

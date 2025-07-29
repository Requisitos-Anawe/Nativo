from flask import Flask
from app.routes.UsuarioRoute import bp as usuarios_bp

def create_app():
    app = Flask(__name__)

    # Registra rotas
    app.register_blueprint(usuarios_bp, url_prefix="/api")

    return app

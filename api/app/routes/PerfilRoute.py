
from flask import Blueprint, jsonify
from app.services.firestore_utils import listar_documentos
from app.middlewares.autenticar_jwt import autenticar_jwt

bp = Blueprint('perfis', __name__)

COLLECTION = 'perfil'

@bp.route('/perfis', methods=['GET'])
@autenticar_jwt
def listar():
    """
    Listar perfis
    ---
    security:
      - Bearer: []
    tags:
        - Perfis
    responses:
        200:
            description: Retorna lista de perfis
    """
    perfis = listar_documentos(COLLECTION, "descricao")
    return jsonify(perfis)

from flask import Blueprint, jsonify
from app.services.firestore_utils import listar_documentos
from app.middlewares.autenticar_jwt import autenticar_jwt

bp = Blueprint('idiomas', __name__)

COLLECTION = 'idioma'

@bp.route('/idiomas', methods=['GET'])
@autenticar_jwt
def listar():
    """
    Listar idiomas
    ---
    security:
      - Bearer: []
    tags:
        - Idiomas
    responses:
        200:
            description: Retorna lista de idiomas
    """
    idiomas = listar_documentos(COLLECTION, "descricao")
    return jsonify(idiomas)
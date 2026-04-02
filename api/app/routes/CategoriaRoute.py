
from flask import Blueprint, jsonify
from app.services.firestore_utils import listar_documentos
from app.middlewares.autenticar_jwt import autenticar_jwt

bp = Blueprint('categorias', __name__)

COLLECTION = 'discurso_categoria'

@bp.route('/categorias', methods=['GET'])
@autenticar_jwt
def listar():
    """
    Listar categorias
    ---
    security:
      - Bearer: []
    tags:
        - Categorias
    responses:
        200:
            description: Retorna lista de categorias
    """
    categorias = listar_documentos(COLLECTION, "descricao")
    return jsonify(categorias)
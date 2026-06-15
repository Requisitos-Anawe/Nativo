from app.middlewares.verificar_professor import verificar_professor
from app.middlewares.autenticar_jwt import autenticar_jwt
from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from app.services.DiscursoService import DiscursoService

bp = Blueprint('discurso', __name__)
db = firestore.client()

@bp.route('/discurso/buscar', methods=['POST'])
def buscar_discurso():
    """
    Buscar discurso por texto
    ---
    tags:
      - Discurso
    parameters:
      - name: body
        in: body
        required: true
        schema:
          type: object
          properties:
            texto:
              type: string
              example: "Texto do discurso a ser buscado"
            idioma:
              type: string
              example: "português"
    responses:
      200:
        description: Discurso encontrado
      400:
        description: Requisição inválida
      404:
        description: Discurso não encontrado
    """
    body = request.get_json()
    if body:
        texto = body.get("texto")
        idioma = body.get("idioma")
    if not texto:
        return jsonify({"erro": "Campo 'texto' é obrigatório no corpo da requisição."}), 400

    resultado, erro = DiscursoService.buscar_discurso_e_traducao_por_texto(texto.lower(),idioma)

    if not resultado:
        return jsonify({"erro": erro}), 404

    return jsonify(resultado), 200
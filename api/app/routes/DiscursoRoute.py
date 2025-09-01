from app.middlewares.autenticar_jwt import autenticar_jwt
from flask import Blueprint, request, jsonify, g
from firebase_admin import firestore
from datetime import datetime
import pytz
from app.services.DiscursoService import DiscursoService

bp = Blueprint('discurso', __name__)
db = firestore.client()

@bp.route('/discurso/buscar', methods=['POST'])
def buscar_discurso():
    body = request.get_json()
    if body:
        texto = body.get("texto")
        idioma = body.get("idioma")
    if not texto:
        return jsonify({"erro": "Campo 'texto' é obrigatório no corpo da requisição."}), 400

    resultado, erro = DiscursoService.buscar_discurso_e_traducao_por_texto(texto.lower(),idioma)

    if not resultado:
        return jsonify({"erro": erro}), 404

    return resultado, 200

from flask import Blueprint, request, jsonify
from app.services.DiscursoService import DiscursoService

bp = Blueprint('discurso', __name__)

@bp.route('/discurso/buscar', methods=['POST'])
def buscar_discurso():
    body = request.get_json()

    texto = body.get("texto") if body else None
    if not texto:
        return jsonify({"erro": "Campo 'texto' é obrigatório no corpo da requisição."}), 400

    resultado, erro = DiscursoService.buscar_discurso_e_traducao_por_texto(texto)

    if not resultado:
        return erro, 404

    return resultado, 200


from flask import Blueprint, jsonify
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.firebase import db

bp = Blueprint('idiomas', __name__)

COLLECTION = 'idioma'

@bp.route('/idiomas', methods=['GET'])
@autenticar_jwt
def listar():
    idiomas_ref = db.collection(COLLECTION).order_by("nome")
    docs = idiomas_ref.stream()

    idiomas = []
    for doc in docs:
        idioma = doc.to_dict()
        idioma['id'] = doc.id
        idiomas.append(idioma)
     
    return jsonify(idiomas)

from flask import Blueprint, jsonify
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.firebase import db

bp = Blueprint('categorias', __name__)

COLLECTION = 'discurso_categoria'

@bp.route('/categorias', methods=['GET'])
@autenticar_jwt
def listar():
    categorias_ref = db.collection(COLLECTION).order_by("descricao")
    docs = categorias_ref.stream()

    categorias = []
    for doc in docs:
        categoria = doc.to_dict()
        categoria['id'] = doc.id
        categorias.append(categoria)
     
    return jsonify(categorias)
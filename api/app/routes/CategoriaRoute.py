
from flask import Blueprint, jsonify
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.firebase import db

bp = Blueprint('categorias', __name__)

COLLECTION = 'discurso_categoria'

@bp.route('/categorias', methods=['GET'])
@autenticar_jwt
def listar():
    docs = (
        db.collection(COLLECTION)
        .order_by("descricao")
        .stream()
    )

    categorias = [
        {**doc.to_dict(), "id": doc.id}
        for doc in docs
    ]
    
    return jsonify(categorias)
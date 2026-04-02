
from flask import Blueprint, jsonify
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.firebase import db

bp = Blueprint('idiomas', __name__)

COLLECTION = 'idioma'

@bp.route('/idiomas', methods=['GET'])
@autenticar_jwt
def listar():
    docs = (
        db.collection(COLLECTION)
        .order_by("descricao")
        .stream()
    )

    idiomas = [
        {**doc.to_dict(), "id": doc.id}
        for doc in docs
    ]
    
    return jsonify(idiomas)
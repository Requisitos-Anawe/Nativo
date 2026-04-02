
from flask import Blueprint, jsonify
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.firebase import db

bp = Blueprint('perfis', __name__)

COLLECTION = 'perfil'

@bp.route('/perfis', methods=['GET'])
@autenticar_jwt
def listar():
    docs = (
        db.collection(COLLECTION)
        .order_by("descricao")
        .stream()
    )

    perfis = [
        {**doc.to_dict(), "id": doc.id}
        for doc in docs
    ]
    
    return jsonify(perfis)
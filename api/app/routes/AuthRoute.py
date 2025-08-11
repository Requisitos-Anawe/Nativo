from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from flask_bcrypt import check_password_hash
import jwt
import os
from datetime import datetime, timedelta
import pytz

from app.schemas.UsuarioSchema import UsuarioSchema

db = firestore.client()
bp = Blueprint('auth', __name__)
usuario_schema = UsuarioSchema()

@bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    senha = data.get("senha")

    if not email or not senha:
        return jsonify({"erro": "Email e senha obrigatórios"}), 400

    usuarios_ref = db.collection("usuario").where("email", "==", email).limit(1)
    results = list(usuarios_ref.stream())

    if not results:
        return jsonify({"erro": "Email ou senha incorretos"}), 404

    usuario_doc = results[0]
    usuario_data = usuario_doc.to_dict()
    
    if not check_password_hash(usuario_data["senha"], senha):
        return jsonify({"erro": "Email ou senha incorretos"}), 401

    token = jwt.encode({
        "usuario_id": usuario_doc.id,
        "exp": datetime.now(pytz.timezone("America/Sao_Paulo")) + timedelta(hours=12)
    }, os.getenv("JWT_SECRET"), algorithm="HS256")

    return jsonify({
        "token": token,
        "usuario": {
            "id": usuario_doc.id,
            "nome": usuario_data.get("nome"),
            "email": usuario_data.get("email"),
            "perfil": usuario_data.get("perfil").path 
        }
    }), 200

from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from flask_bcrypt import check_password_hash
import re, jwt, os, pytz, bcrypt
from app.helpers.senha_validator import validar_senha
from datetime import datetime, timedelta

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
            "data_nascimento": usuario_data.get('data_nascimento'),
            "perfil": usuario_data.get('perfil'),
        }
    }), 200

@bp.route("/auth/cadastro", methods=["POST"])
def cadastro():
    data = request.get_json()

    email = data.get("email")
    senha = data.get("senha")
    nome = data.get("nome")
    
    data_nascimento = data.get("data_nascimento")
    data_dt = datetime.fromisoformat(data_nascimento)

    perfil_ref = db.collection("perfil").document("1")

    # VALIDACOES
    if not all([email, senha, nome, data_nascimento]):
        return jsonify({"erro": "Todos os campos são obrigatórios"}), 400
    
    if not isinstance(data_dt, datetime):
        return jsonify({"erro": "Campo 'data_nascimento' deve ser um datetime válido."}), 400
    
    def is_email(value):
        pattern = r"^[^@]+@[^@]+\.[^@]+$"
        return re.match(pattern, value) is not None
    
    if not is_email(email):
        return jsonify({"erro": "E-mail inválido."}), 400
    
    valida, erros_senha = validar_senha(senha)
    if not valida:
        return jsonify({"erro": "Senha inválida", "detalhes": erros_senha}), 400

    usuarios_ref = db.collection("usuario").where("email", "==", email).stream()
    if any(usuarios_ref):
        return jsonify({"erro": "Email já cadastrado"}), 400
    
    # CADASTRO
    senha_hash = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    novo_usuario = {
        "email": email,
        "senha": senha_hash,
        "nome": nome,
        "data_nascimento": data_dt,
        "perfil": "padrão",
        "perfil_id": perfil_ref,
        "data_criacao": firestore.SERVER_TIMESTAMP
    }

    db.collection("usuario").add(novo_usuario)

    return jsonify({"mensagem": "Usuário cadastrado com sucesso"}), 201

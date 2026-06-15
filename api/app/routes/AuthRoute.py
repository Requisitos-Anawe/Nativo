from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from flask_bcrypt import check_password_hash
import re, jwt, os, pytz, bcrypt
from app.helpers.senha_validator import validar_senha
from app.helpers.cpf_validator import validar_cpf, limpar_cpf
from datetime import datetime, timedelta

from app.schemas.UsuarioSchema import UsuarioSchema

db = firestore.client()
bp = Blueprint('auth', __name__)
usuario_schema = UsuarioSchema()

@bp.route("/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    cpf = data.get("cpf")
    senha = data.get("senha")

    if not cpf or not senha:
        return jsonify({"erro": "CPF e senha obrigatórios"}), 400

    cpf_limpo = limpar_cpf(cpf)

    usuarios_ref = db.collection("usuario").where("cpf", "==", cpf_limpo).limit(1)
    results = list(usuarios_ref.stream())

    if not results:
        return jsonify({"erro": "CPF ou senha incorretos"}), 404

    usuario_doc = results[0]
    usuario_data = usuario_doc.to_dict()
    
    if not check_password_hash(usuario_data["senha"], senha):
        return jsonify({"erro": "CPF ou senha incorretos"}), 401

    token = jwt.encode({
        "usuario_id": usuario_doc.id,
        "exp": datetime.now(pytz.timezone("America/Sao_Paulo")) + timedelta(hours=12)
    }, os.getenv("JWT_SECRET"), algorithm="HS256")

    perfil_ref = usuario_data.get("perfil")
    perfil_doc = perfil_ref.get()
    perfil_data = perfil_doc.to_dict() if perfil_doc.exists else {}

    return jsonify({
        "token": token,
        "usuario": {
            "id": usuario_doc.id,
            "nome": usuario_data.get("nome"),
            "email": usuario_data.get("email"),
            "data_nascimento": usuario_data.get('data_nascimento'),
            "perfil": perfil_data.get('descricao'),
        }
    }), 200

@bp.route("/auth/cadastro", methods=["POST"])
def cadastro():
    data = request.get_json()

    email = data.get("email")
    senha = data.get("senha")
    nome = data.get("nome")
    cpf = data.get("cpf")
    
    data_nascimento = data.get("data_nascimento")
    data_dt = datetime.fromisoformat(data_nascimento)

    perfil_ref = db.collection("perfil").document("1")

    # VALIDACOES
    if not all([email, senha, nome, data_nascimento, cpf]):
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

    if not validar_cpf(cpf):
        return jsonify({"erro": "CPF inválido."}), 400

    cpf_limpo = limpar_cpf(cpf)

    usuarios_ref = db.collection("usuario").where("email", "==", email).stream()
    if any(usuarios_ref):
        return jsonify({"erro": "Email já cadastrado"}), 400
        
    usuarios_cpf_ref = db.collection("usuario").where("cpf", "==", cpf_limpo).stream()
    if any(usuarios_cpf_ref):
        return jsonify({"erro": "CPF já cadastrado"}), 400
    
    # CADASTRO
    senha_hash = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    novo_usuario = {
        "email": email,
        "senha": senha_hash,
        "nome": nome,
        "cpf": cpf_limpo,
        "data_nascimento": data_dt,
        "perfil": perfil_ref,
        "criado_em": firestore.SERVER_TIMESTAMP
    }

    db.collection("usuario").add(novo_usuario)

    return jsonify({"mensagem": "Usuário cadastrado com sucesso"}), 201

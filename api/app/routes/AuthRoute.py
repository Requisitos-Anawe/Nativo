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
    """
    Fazer login
    ---
    tags:
        - Auth
    responses:
        200:
            description: Login bem-sucedido, retorna token JWT e informações do usuário
        400:
            description: Requisição malformada, campos obrigatórios ausentes
        401:
            description: Credenciais inválidas
    """
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
    
    if usuario_data.get("status") == "banido":
        return jsonify({"erro": "Esta conta foi banida e não tem mais acesso à plataforma."}), 403
    
    senha_db = usuario_data.get("senha")
    if not senha_db:
        return jsonify({"erro": "Usuário sem senha configurada"}), 401

    try:
        if not check_password_hash(senha_db, senha):
            return jsonify({"erro": "CPF ou senha incorretos"}), 401
    except Exception:
        return jsonify({"erro": "CPF ou senha incorretos"}), 401

    token = jwt.encode({
        "usuario_id": usuario_doc.id,
        "exp": datetime.now(pytz.timezone("America/Sao_Paulo")) + timedelta(hours=12)
    }, os.getenv("JWT_SECRET"), algorithm="HS256")

    perfil_val = usuario_data.get('perfil')
    if hasattr(perfil_val, 'id'):
        perfil_val = perfil_val.id

    data_nasc_val = usuario_data.get('data_nascimento')
    if hasattr(data_nasc_val, 'isoformat'):
        data_nasc_val = data_nasc_val.isoformat()

    return jsonify({
        "token": token,
        "usuario": {
            "id": usuario_doc.id,
            "nome": usuario_data.get("nome"),
            "email": usuario_data.get("email"),
            "data_nascimento": data_nasc_val,
            "perfil": perfil_val,
        }
    }), 200

@bp.route("/auth/cadastro", methods=["POST"])
def cadastro():
    """
    Fazer cadastro
    ---
    tags:
        - Auth
    responses:
        200:
            description: Cadastro bem-sucedido, retorna mensagem de sucesso
        400:
            description: Requisição malformada, campos obrigatórios ausentes ou dados inválidos
        409:
            description: Email já cadastrado
    """
    data = request.get_json()

    email = data.get("email")
    senha = data.get("senha")
    nome = data.get("nome")
    cpf = data.get("cpf")
    
    data_nascimento = data.get("data_nascimento")
    data_dt = datetime.fromisoformat(data_nascimento)

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
        return jsonify({"erro": "Email já cadastrado"}), 409
        
    usuarios_cpf_ref = db.collection("usuario").where("cpf", "==", cpf_limpo).stream()
    if any(usuarios_cpf_ref):
        return jsonify({"erro": "CPF já cadastrado"}), 409
    
    # CADASTRO
    senha_hash = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    novo_usuario = {
        "email": email,
        "senha": senha_hash,
        "nome": nome,
        "cpf": cpf_limpo,
        "data_nascimento": data_dt,
        "perfil": "padrão",
        "status": "ativo",
        "data_criacao": firestore.SERVER_TIMESTAMP
    }

    db.collection("usuario").add(novo_usuario)

    return jsonify({"mensagem": "Usuário cadastrado com sucesso"}), 201

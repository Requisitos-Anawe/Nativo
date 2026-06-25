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
        "data_criacao": firestore.SERVER_TIMESTAMP
    }

    db.collection("usuario").add(novo_usuario)

    return jsonify({"mensagem": "Usuário cadastrado com sucesso"}), 201

# --- SISTEMA DE ESQUECEU SUA SENHA ---
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def enviar_email_codigo(destinatario, codigo):
    remetente = "tradutor.linguas.indigenas@gmail.com"
    senha = "cfrt sjkm wgjj nqvn"
    
    msg = MIMEMultipart()
    msg['From'] = remetente
    msg['To'] = destinatario
    msg['Subject'] = "Nativo - Codigo de Recuperacao de Senha"
    
    corpo = f"""
Olá,

Você solicitou a recuperação de senha da sua conta no aplicativo Nativo.
Seu código de verificação é:

{codigo}

Este código é válido por 15 minutos. Se você não solicitou esta alteração, por favor ignore este e-mail.

Atenciosamente,
Equipe Nativo.
"""
    msg.attach(MIMEText(corpo, 'plain', 'utf-8'))
    
    try:
        server = smtplib.SMTP_SSL('smtp.gmail.com', 465)
        server.login(remetente, senha)
        server.sendmail(remetente, destinatario, msg.as_string())
        server.close()
        return True
    except Exception as e:
        print(f"Erro ao enviar e-mail: {e}")
        return False

@bp.route("/auth/recuperar-senha", methods=["POST"])
def recuperar_senha():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"erro": "E-mail é obrigatório"}), 400

    usuarios_ref = db.collection("usuario").where("email", "==", email).limit(1).stream()
    if not any(usuarios_ref):
        return jsonify({"erro": "E-mail não cadastrado"}), 404

    codigo = f"{random.randint(100000, 999999)}"
    expira_em = datetime.now(pytz.timezone("America/Sao_Paulo")) + timedelta(minutes=15)

    db.collection("codigo_verificacao").document(email).set({
        "email": email,
        "codigo": codigo,
        "expira_em": expira_em
    })

    if enviar_email_codigo(email, codigo):
        return jsonify({"mensagem": "Código de verificação enviado por e-mail"}), 200
    else:
        return jsonify({"erro": "Falha ao enviar e-mail de recuperação"}), 500

@bp.route("/auth/validar-codigo", methods=["POST"])
def validar_codigo():
    data = request.get_json()
    email = data.get("email")
    codigo = data.get("codigo")

    if not email or not codigo:
        return jsonify({"erro": "E-mail e código são obrigatórios"}), 400

    codigo_doc = db.collection("codigo_verificacao").document(email).get()
    if not codigo_doc.exists:
        return jsonify({"erro": "Código inválido ou não solicitado"}), 400

    codigo_data = codigo_doc.to_dict()
    expira_em = codigo_data.get("expira_em")
    now = datetime.now(pytz.timezone("America/Sao_Paulo"))

    if expira_em.tzinfo is None:
        expira_em = pytz.timezone("America/Sao_Paulo").localize(expira_em)

    if now > expira_em:
        return jsonify({"erro": "Código expirado"}), 400

    if codigo_data.get("codigo") != codigo:
        return jsonify({"erro": "Código incorreto"}), 400

    return jsonify({"mensagem": "Código validado com sucesso"}), 200

@bp.route("/auth/redefinir-senha", methods=["POST"])
def redefinir_senha():
    data = request.get_json()
    email = data.get("email")
    codigo = data.get("codigo")
    nova_senha = data.get("nova_senha")

    if not all([email, codigo, nova_senha]):
        return jsonify({"erro": "Todos os campos são obrigatórios"}), 400

    codigo_doc = db.collection("codigo_verificacao").document(email).get()
    if not codigo_doc.exists:
        return jsonify({"erro": "Código inválido ou não solicitado"}), 400

    codigo_data = codigo_doc.to_dict()
    expira_em = codigo_data.get("expira_em")
    now = datetime.now(pytz.timezone("America/Sao_Paulo"))

    if expira_em.tzinfo is None:
        expira_em = pytz.timezone("America/Sao_Paulo").localize(expira_em)

    if now > expira_em:
        return jsonify({"erro": "Código expirado"}), 400

    if codigo_data.get("codigo") != codigo:
        return jsonify({"erro": "Código incorreto"}), 400

    valida, erros_senha = validar_senha(nova_senha)
    if not valida:
        return jsonify({"erro": "Senha inválida", "detalhes": erros_senha}), 400

    usuarios_ref = db.collection("usuario").where("email", "==", email).limit(1).stream()
    results = list(usuarios_ref)
    if not results:
        return jsonify({"erro": "Usuário não encontrado"}), 404

    usuario_doc = results[0]
    senha_hash = bcrypt.hashpw(nova_senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    db.collection("usuario").document(usuario_doc.id).update({
        "senha": senha_hash
    })

    db.collection("codigo_verificacao").document(email).delete()

    return jsonify({"mensagem": "Senha redefinida com sucesso"}), 200


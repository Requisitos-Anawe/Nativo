import re
from datetime import datetime

import bcrypt
import pytz
from firebase_admin import firestore
from flask import jsonify

from app.firebase import db
from app.helpers.senha_validator import validar_senha

COLLECTION = 'usuario'
TZ = pytz.timezone('America/Sao_Paulo')


def _agora():
    return datetime.now(pytz.utc).astimezone(TZ)


def _serializar_data(valor):
    if hasattr(valor, 'isoformat'):
        return valor.isoformat()
    return valor


def _mascarar_cpf(cpf):
    if not cpf:
        return None

    cpf_limpo = ''.join(ch for ch in str(cpf) if ch.isdigit())
    if len(cpf_limpo) != 11:
        return None

    return f'***.***.***-{cpf_limpo[-2:]}'


def _serializar_perfil(perfil):
    if perfil is None:
        return None

    if hasattr(perfil, 'get') and hasattr(perfil, 'id'):
        perfil_doc = perfil.get()
        if perfil_doc.exists:
            dados = perfil_doc.to_dict() or {}
            return dados.get('descricao') or perfil.id
        return perfil.id

    return str(perfil)


def _serializar_usuario(doc):
    usuario = doc.to_dict() or {}
    usuario['id'] = doc.id
    usuario.pop('senha', None)

    cpf = usuario.pop('cpf', None)
    cpf_mascarado = _mascarar_cpf(cpf)
    if cpf_mascarado:
        usuario['cpf_mascarado'] = cpf_mascarado

    usuario['perfil'] = _serializar_perfil(usuario.get('perfil'))
    usuario['data_nascimento'] = _serializar_data(usuario.get('data_nascimento'))
    usuario['data_criacao'] = _serializar_data(usuario.get('data_criacao'))
    usuario['data_atualizacao'] = _serializar_data(usuario.get('data_atualizacao'))

    return usuario


def _email_valido(email):
    return re.match(r'^[^@]+@[^@]+\.[^@]+$', email or '') is not None


def _email_ja_usado_por_outro_usuario(email, usuario_id):
    docs = db.collection(COLLECTION).where('email', '==', email).stream()
    return any(doc.id != usuario_id for doc in docs)


def _normalizar_data_nascimento(valor):
    if hasattr(valor, 'isoformat'):
        return valor

    if not isinstance(valor, str):
        return None

    try:
        return datetime.fromisoformat(valor.replace('Z', '+00:00'))
    except ValueError:
        return None


def criar_usuario(data):
    doc_ref = db.collection(COLLECTION).document()

    usuario = {
        'email': data.get('email'),
        'senha': data.get('senha'),
        'data_nascimento': data.get('data_nascimento'),
        'nome': data.get('nome'),
        'data_criacao': _agora(),
        'perfil': firestore.client().document(data.get('perfil'))
    }

    doc_ref.set(usuario)
    usuario['id'] = doc_ref.id
    usuario.pop('senha', None)
    return usuario


def listar_usuarios(limit=10, start_after=None):
    query = (
        db.collection(COLLECTION)
        .order_by('nome')
        .limit(limit)
    )

    if start_after:
        last_doc = db.collection(COLLECTION).document(start_after).get()
        query = query.start_after(last_doc)

    docs = query.stream()

    usuarios = []
    last_id = None

    for doc in docs:
        usuarios.append(_serializar_usuario(doc))
        last_id = doc.id

    return {
        'data': usuarios,
        'limit': limit,
        'start_after': last_id
    }


def buscar_usuario_por_id(usuario_id):
    doc = db.collection(COLLECTION).document(usuario_id).get()
    if doc.exists:
        return _serializar_usuario(doc)
    return None


def buscar_usuario_bruto_por_id(usuario_id):
    doc = db.collection(COLLECTION).document(usuario_id).get()
    if not doc.exists:
        return None

    dados = doc.to_dict() or {}
    dados['id'] = doc.id
    return dados


def obter_descricao_perfil_por_id(usuario_id):
    usuario = buscar_usuario_bruto_por_id(usuario_id)
    if not usuario:
        return None

    perfil = _serializar_perfil(usuario.get('perfil'))
    return perfil.lower() if perfil else None


def atualizar_usuario(usuario_id, novo_perfil):
    usuario_ref = db.collection(COLLECTION).document(usuario_id)

    if novo_perfil not in ['admin', 'padrão', 'professor', 'moderador']:
        return jsonify({'erro': 'Perfil inválido'}), 400

    usuario_ref.update({
        'perfil': novo_perfil,
        'data_atualizacao': _agora()
    })


def deletar_usuario(usuario_id):
    db.collection(COLLECTION).document(usuario_id).delete()


def atualizar_dados_usuario(usuario_id, novos_dados, campos_permitidos=None):
    usuario_ref = db.collection(COLLECTION).document(usuario_id)
    usuario_doc = usuario_ref.get()

    if not usuario_doc.exists:
        return 'Usuário não encontrado'

    campos_permitidos = set(campos_permitidos or ['nome', 'data_nascimento', 'email', 'senha', 'imagem_url', 'foto'])
    update_usuario = {}

    if 'nome' in campos_permitidos and 'nome' in novos_dados:
        nome = str(novos_dados.get('nome', '')).strip()
        if not nome:
            return 'Nome não pode ser vazio'
        update_usuario['nome'] = nome

    if 'data_nascimento' in campos_permitidos and 'data_nascimento' in novos_dados:
        data_nascimento = _normalizar_data_nascimento(novos_dados.get('data_nascimento'))
        if not data_nascimento:
            return 'Data de nascimento inválida'
        update_usuario['data_nascimento'] = data_nascimento

    if 'email' in campos_permitidos and 'email' in novos_dados:
        email = str(novos_dados.get('email', '')).strip().lower()
        if not _email_valido(email):
            return 'E-mail inválido'
        if _email_ja_usado_por_outro_usuario(email, usuario_id):
            return 'Email já cadastrado'
        update_usuario['email'] = email

    if 'senha' in campos_permitidos and 'senha' in novos_dados:
        senha = str(novos_dados.get('senha', ''))
        valida, erros_senha = validar_senha(senha)
        if not valida:
            return {'erro': 'Senha inválida', 'detalhes': erros_senha}
        update_usuario['senha'] = bcrypt.hashpw(
            senha.encode('utf-8'), bcrypt.gensalt()
        ).decode('utf-8')

    if 'imagem_url' in campos_permitidos and 'imagem_url' in novos_dados:
        update_usuario['imagem_url'] = novos_dados.get('imagem_url')

    if 'foto' in campos_permitidos and 'foto' in novos_dados:
        update_usuario['foto'] = novos_dados.get('foto')

    if not update_usuario:
        return 'Nenhum campo permitido foi informado para atualização'

    update_usuario['data_atualizacao'] = _agora()
    usuario_ref.update(update_usuario)
    return buscar_usuario_por_id(usuario_id)

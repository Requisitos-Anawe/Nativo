from functools import wraps

from firebase_admin import firestore
from flask import g, jsonify


def _descricao_perfil(usuario_doc):
    perfil = usuario_doc.get('perfil')

    if hasattr(perfil, 'get') and hasattr(perfil, 'id'):
        perfil_doc = perfil.get()
        if perfil_doc.exists:
            dados = perfil_doc.to_dict() or {}
            return str(dados.get('descricao') or perfil.id).lower()
        return str(perfil.id).lower()

    return str(perfil or '').lower()


def verificar_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        db = firestore.client()
        usuario_ref = db.collection('usuario').document(g.usuario_id)
        usuario_doc = usuario_ref.get()
        if not usuario_doc.exists:
            return jsonify({'erro': 'Usuário não encontrado'}), 404

        descricao = _descricao_perfil(usuario_doc)

        if descricao not in ['admin', 'administrador']:
            return jsonify({'erro': 'Acesso negado: apenas administradores'}), 403

        return f(*args, **kwargs)
    return wrapper

from functools import wraps
from flask import jsonify, g
from firebase_admin import firestore

def verificar_admin(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        db = firestore.client()
        usuario_ref = db.collection('usuario').document(g.usuario_id)
        usuario_doc = usuario_ref.get()
        if not usuario_doc.exists:
            return jsonify({'erro': 'Usuário não encontrado'}), 404

        usuario = usuario_doc.to_dict()
        perfil_ref = usuario.get('perfil')
        if not perfil_ref:
            return jsonify({'erro': 'Perfil do usuário não encontrado'}), 403

        perfil_doc = perfil_ref.get()
        perfil = perfil_doc.to_dict()
        descricao = perfil.get('descricao', '').lower()

        if descricao not in ['admin', 'administrador']:
            return jsonify({'erro': 'Acesso negado: apenas administradores'}), 403

        return f(*args, **kwargs)
    return wrapper

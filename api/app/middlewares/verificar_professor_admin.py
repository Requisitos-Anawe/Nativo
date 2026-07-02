from functools import wraps
from flask import jsonify, g
from firebase_admin import firestore

db = firestore.client()

def verificar_professor_admin(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        usuario_id = g.get('usuario_id')
        if not usuario_id:
            return jsonify({'erro': 'Usuário não autenticado'}), 401

        usuario_ref = db.collection('usuario').document(usuario_id)
        usuario_doc = usuario_ref.get()

        if not usuario_doc.exists:
            return jsonify({'erro': 'Usuário não encontrado'}), 404

        usuario = usuario_doc.to_dict()
        perfil = usuario.get('perfil', '').lower()
        if perfil not in ['professor', 'admin']:
            return jsonify({'erro': 'Acesso negado: apenas professores ou administradores'}), 403

        return f(*args, **kwargs)
    return decorated_function
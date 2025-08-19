from functools import wraps
from flask import jsonify, g
from firebase_admin import firestore

db = firestore.client()

def verificar_professor(f):
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
        perfil_ref = usuario.get('perfil')

        if not perfil_ref:
            return jsonify({'erro': 'Perfil não atribuído ao usuário'}), 400

        perfil_doc = perfil_ref.get()
        if not perfil_doc.exists:
            return jsonify({'erro': 'Perfil não encontrado'}), 404

        if perfil_doc.to_dict().get('descricao', '').lower() != 'professor':
            return jsonify({'erro': 'Apenas usuários com perfil professor podem acessar'}), 403

        return f(*args, **kwargs)
    return decorated_function

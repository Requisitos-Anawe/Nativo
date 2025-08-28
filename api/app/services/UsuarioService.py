from datetime import datetime
from app.firebase import db
import pytz
from firebase_admin import firestore
from flask import jsonify

COLLECTION = 'usuario'

def criar_usuario(data):
    doc_ref = db.collection(COLLECTION).document()
    
    usuario = {
        'email': data.get('email'),
        'senha': data.get('senha'), 
        'data_nascimento': data.get('data_nascimento'),
        'nome': data.get('nome'),
        'data_criacao': datetime.now(pytz.utc).astimezone(pytz.timezone('America/Sao_Paulo')),
        'perfil': firestore.client().document(data.get('perfil'))
    }
    
    doc_ref.set(usuario)
    usuario['id'] = doc_ref.id
    return usuario

def listar_usuarios():
    usuarios_ref = db.collection(COLLECTION)
    docs = usuarios_ref.stream()

    usuarios = []
    for doc in docs:
        usuario = doc.to_dict()
        usuario['id'] = doc.id
        usuario.pop('senha', None)

        perfil_ref = usuario.get('perfil')
        if isinstance(perfil_ref, firestore.DocumentReference):
            perfil_doc = perfil_ref.get()
            if perfil_doc.exists:
                usuario['perfil'] = perfil_doc.to_dict()
                usuario['perfil']['id'] = perfil_doc.id
            else:
                usuario['perfil'] = 'Perfil não encontrado'
        else:
            usuario['perfil'] = 'Perfil indefinido'

        usuarios.append(usuario)

    usuarios.sort(key=lambda u: (u.get('nome') or '').strip().lower())
    return usuarios

def buscar_usuario_por_id(usuario_id):
    doc = db.collection(COLLECTION).document(usuario_id).get()
    if doc.exists:
        usuario = doc.to_dict()
        usuario['id'] = doc.id
        usuario.pop('senha', None)
        return usuario
    return None

def atualizar_usuario(usuario_id, novo_perfil_id):
    usuario_ref = db.collection('usuario').document(usuario_id)
    usuario_doc = usuario_ref.get()
    if not usuario_doc.exists:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    usuario_alvo = usuario_doc.to_dict()
    perfil_ref_alvo = usuario_alvo.get('perfil')
    if isinstance(perfil_ref_alvo, firestore.DocumentReference):
        perfil_doc_alvo = perfil_ref_alvo.get()
        if perfil_doc_alvo.exists:
            descricao_alvo = perfil_doc_alvo.to_dict().get('descricao', '').lower()
            if descricao_alvo == 'admin':
                return jsonify({'erro': 'Não é permitido alterar o perfil de um administrador'}), 403
    
    novo_perfil_ref = db.collection('perfil').document(novo_perfil_id)
    perfil_doc = novo_perfil_ref.get()
    if not perfil_doc.exists:
        return jsonify({'erro': 'Perfil não encontrado'}), 404

    usuario_ref.update({
        'perfil': novo_perfil_ref,
        'data_atualizacao': datetime.now(pytz.timezone("America/Sao_Paulo"))
    })

def deletar_usuario(usuario_id):
    db.collection(COLLECTION).document(usuario_id).delete()
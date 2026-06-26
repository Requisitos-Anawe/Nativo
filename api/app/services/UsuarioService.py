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

def listar_usuarios(limit=10, start_after=None):
    query = (
        db.collection(COLLECTION)
        .order_by("nome")
        .limit(limit)
    )

    if start_after:
        last_doc = (
            db.collection(COLLECTION)
            .document(start_after)
            .get()
        )
        query = query.start_after(last_doc)

    docs = query.stream()

    usuarios = []
    last_id = None

    for doc in docs:
        usuario = doc.to_dict()
        usuario["id"] = doc.id
        usuario["status"] = usuario.get("status", "ativo")
        usuario.pop('senha', None)
        
        perfil = usuario.get('perfil')
        if hasattr(perfil, 'id'):
            usuario['perfil'] = perfil.id

        usuarios.append(usuario)
        last_id = doc.id

    return {
        "data": usuarios,
        "limit": limit,
        "start_after": last_id
    }

def buscar_usuario_por_id(usuario_id):
    doc = db.collection(COLLECTION).document(usuario_id).get()
    if doc.exists:
        usuario = doc.to_dict()
        usuario['id'] = doc.id
        usuario.pop('senha', None)
        return usuario
    return None

def atualizar_usuario(usuario_id, novo_perfil):
    usuario_ref = db.collection('usuario').document(usuario_id)

    if novo_perfil not in ['admin', 'padrão', 'professor', 'moderador']:
        return jsonify({'erro': 'Perfil inválido'}), 400

    usuario_ref.update({
        'perfil': novo_perfil,
        'data_atualizacao': datetime.now(pytz.timezone("America/Sao_Paulo"))
    })

def deletar_usuario(usuario_id):
    db.collection(COLLECTION).document(usuario_id).delete()

def atualizar_status_usuario(usuario_id, novo_status, motivo=None):
    usuario_ref = db.collection(COLLECTION).document(usuario_id)

    if novo_status not in ['ativo', 'banido']:
        return jsonify({'erro': 'Status inválido'}), 400

    dados_update = {
        'status': novo_status,
        'data_atualizacao': datetime.now(pytz.timezone("America/Sao_Paulo"))
    }
    
    if motivo:
        dados_update['motivo_banimento'] = motivo

    usuario_ref.update(dados_update)
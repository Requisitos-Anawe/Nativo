from datetime import datetime
from app.firebase import db
import pytz
from firebase_admin import firestore

COLLECTION = 'usuario'

def criar_usuario(data):
    doc_ref = db.collection(COLLECTION).document()
    
    usuario = {
        'cpf': data.get('cpf'),
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
                perfil_data = perfil_doc.to_dict()
                usuario['perfil'] = perfil_data.get('descricao', 'Perfil sem descrição')
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

def atualizar_usuario(usuario_id, dados_atualizados):
    doc_ref = db.collection(COLLECTION).document(usuario_id)
    doc_ref.update(dados_atualizados)

def deletar_usuario(usuario_id):
    db.collection(COLLECTION).document(usuario_id).delete()

# TODO: verificar viabilidade
def get_perfil(usuario_id):
    doc_ref = db.collection(COLLECTION).document(usuario_id)
    doc = doc_ref.get()

    if doc.exists:
        data = doc.to_dict()
        return data.get('perfil') 
    else:
        return None
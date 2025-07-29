from datetime import datetime
from app.firebase import db
import pytz

COLLECTION = 'usuario'

def criar_usuario(data):
    doc_ref = db.collection(COLLECTION).document()
    
    usuario = {
        'cpf': data.get('cpf'),
        'email': data.get('email'),
        'senha': data.get('senha'), 
        'data_nascimento': data.get('data_nascimento'),
        'nome': data.get('nome'),
        'data_criacao': datetime.now(pytz.utc).astimezone(pytz.timezone('America/Sao_Paulo'))
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
        usuarios.append(usuario)
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
from dataTime import datetime
import pytz
from firebase_admin import firestore
from app.firebase import db

COLLECTION = 'favorito'

def alternar_favorito(usuario_id, traducao_id): # UC12 (parte mais difícil)
    # Adiciona ou remove uma tradução da lista de favoritos do usuário
    # Antes disso, verifica se a tradução já está na lista de favoritos do usuário
    favoritos_ref = db.collection(COLLECTION)
    query = favoritos_ref.where('usuario_id', '==', 'usuario_id')\ 
        .where('traducao_id', '==', traducao_id)\
        .stream()
    # linguagem de mutante slk
    favorito_encontrado = next(query, None)

    if favorito_encontrado:
        # Se já estiver favoritado, remove o favorito
        db.collection(COLLECTION).document(favorito_encontrado.id).delete()
        return {'message': 'Tradução removida dos favoritos'}
    else:
        # Se não estiver favoritado, adiciona o favorito
        doc_ref = db.collection(COLLECTION).document()
        favorito = {
            'usuario_id': usuario_id,
            'traducao_id': traducao_id,
            'data_favorito': datetime.now(pytz.utc).astimezone(pytz.timezone('America/Sao_Paulo'))
        }
        doc_ref.set(favorito)
        favorito['id'] = doc_ref.id
        return {'Status': 'Tradução adicionada aos favoritos', 'id': favorito['id']}
from datetime import datetime

import pytz

from app.firebase import db

COLLECTION = 'favorito'
TRADUCAO_COLLECTION = 'traducao'
TZ = pytz.timezone('America/Sao_Paulo')


def _agora():
    return datetime.now(pytz.utc).astimezone(TZ)


def _favorito_id(usuario_id, traducao_id):
    return f'{usuario_id}__{traducao_id}'


def _serializar_data(valor):
    if hasattr(valor, 'isoformat'):
        return valor.isoformat()
    return valor


def _serializar_traducao(doc):
    dados = doc.to_dict() or {}
    dados['id'] = doc.id

    for campo in ['data_criacao', 'data_atualizacao']:
        if campo in dados:
            dados[campo] = _serializar_data(dados.get(campo))

    return dados


def buscar_traducao(traducao_id):
    doc = db.collection(TRADUCAO_COLLECTION).document(traducao_id).get()
    if not doc.exists:
        return None
    return doc


def alternar_favorito(usuario_id, traducao_id):
    traducao_doc = buscar_traducao(traducao_id)
    if not traducao_doc:
        return {'erro': 'Tradução não encontrada'}, 404

    favorito_id = _favorito_id(usuario_id, traducao_id)
    favorito_ref = db.collection(COLLECTION).document(favorito_id)
    favorito_doc = favorito_ref.get()

    if favorito_doc.exists:
        favorito_ref.delete()
        return {
            'mensagem': 'Tradução removida dos favoritos',
            'favoritado': False,
            'id': favorito_id,
            'traducao_id': traducao_id,
        }, 200

    favorito = {
        'usuario_id': usuario_id,
        'traducao_id': traducao_id,
        'tipo': 'traducao',
        'data_favorito': _agora(),
    }
    favorito_ref.set(favorito)

    return {
        'mensagem': 'Tradução adicionada aos favoritos',
        'favoritado': True,
        'id': favorito_id,
        'traducao_id': traducao_id,
    }, 201


def remover_favorito(usuario_id, traducao_id):
    favorito_id = _favorito_id(usuario_id, traducao_id)
    favorito_ref = db.collection(COLLECTION).document(favorito_id)

    if not favorito_ref.get().exists:
        return {'erro': 'Favorito não encontrado'}, 404

    favorito_ref.delete()
    return {
        'mensagem': 'Tradução removida dos favoritos',
        'favoritado': False,
        'id': favorito_id,
        'traducao_id': traducao_id,
    }, 200


def status_favorito(usuario_id, traducao_id):
    if not buscar_traducao(traducao_id):
        return {'erro': 'Tradução não encontrada'}, 404

    favorito_id = _favorito_id(usuario_id, traducao_id)
    favorito_doc = db.collection(COLLECTION).document(favorito_id).get()

    return {
        'id': favorito_id,
        'traducao_id': traducao_id,
        'favoritado': favorito_doc.exists,
    }, 200


def listar_favoritos_usuario(usuario_id, limit=50):
    docs = db.collection(COLLECTION).where('usuario_id', '==', usuario_id).stream()

    favoritos = []
    for doc in docs:
        favorito = doc.to_dict() or {}
        favorito['id'] = doc.id
        favorito['data_favorito'] = _serializar_data(favorito.get('data_favorito'))

        traducao_id = favorito.get('traducao_id')
        traducao_doc = buscar_traducao(traducao_id) if traducao_id else None
        favorito['traducao'] = _serializar_traducao(traducao_doc) if traducao_doc else None
        favoritos.append(favorito)

    favoritos.sort(key=lambda item: item.get('data_favorito') or '', reverse=True)

    return {
        'data': favoritos[:limit],
        'limit': limit,
        'total': len(favoritos),
    }, 200

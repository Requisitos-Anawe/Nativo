from dataTime import datetime
from app.firebase import db
import pytz
from firebase_admin import firestore
from flask import jsonify

COLLECTION = 'historico'
# Histórico de traduções que o usuário pesquisou
class HistoricoService:
    # Serviço que gerencia o histórico de consultas do usuário
    @staticmethod
    def registrar_consulta(usuario_id, termo_pesquisado, traducao_resultado):

        doc_ref = db.collection(COLLECTION).document()
        # Melhorar método para evitar duplicatas do mesmo item para o mesmo usuário!!!
        historico = {
            'usuario_id': usuario_id,
            'termo_pesquisado': termo_pesquisado,
            'traducao_resultado': traducao_resultado,
            'data_consulta': datetime.now(pytz.utc).astimezone(pytz.timezone('America/Sao_Paulo'))
        }
        doc_ref = historico_ref.add(historico)
        return {'Status': 'Registrado', 'id': doc_ref[1].id}

    @staticmethod
    def listar_historico_usuario(usuario_id, limit=10, start_after=None):
        # Exibir uma lista cronológica das últimas palavras  ou expressões pesquisadas
        docs = db.collection(COLLECTION)\
        .where('usuario_id', '==', usuario_id)\
        .order_by('data_consulta', direction=firestore.Query.DESCENDING)\
        .limit(limit)\
        .stream()
        # Essa deve ser a função mais FEIA que a humanidade já viu.
        lista_historico = []
        for doc in docs:
            historicoItem = doc.to_dict()
            historicoItem['id'] = doc.id
            lista_historico.append(historicoItem)
        return lista_historico
    
    @staticmethod
    def deletar_historico_usuario(usuario_id):
        # Permitir que o usuário limpe seu histórico de consultas
        docs = db.collection(COLLECTION).where('usuario_id', '==', usuario_id).stream()
        count = 0
        for doc in docs:
            db.collection(COLLECTION).document(doc.id).delete()
            count += 1 # Frufru msm
        return {'Status': f'{count} itens deletados do histórico'}
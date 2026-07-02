# api/app/services/SyncService.py
from app.firebase import db
from datetime import datetime
from google.cloud.firestore_v1.document import DocumentReference

class SyncService:
    @staticmethod
    def limpar_dados_firestore(dados):
        """Varre o dicionário e converte tipos complexos do Firebase para texto simples"""
        if not dados:
            return {}
            
        for chave, valor in dados.items():
            if isinstance(valor, datetime):
                try:
                    dados[chave] = valor.strftime("%d/%m/%Y %H:%M")
                except AttributeError:
                    dados[chave] = str(valor)
                    
            elif isinstance(valor, DocumentReference):
                dados[chave] = valor.path
                
        return dados

    @staticmethod
    def gerar_banco_traducoes_sync():
        discursos_docs = db.collection("discurso").stream()
        discursos = []
        for doc in discursos_docs:
            dados_brutos = doc.to_dict()
            dados_limpos = SyncService.limpar_dados_firestore(dados_brutos)
            discursos.append({"id": doc.id, **dados_limpos})

        traducoes_docs = db.collection("traducao").stream()
        traducoes = []
        for doc in traducoes_docs:
            dados_brutos = doc.to_dict()
            dados_limpos = SyncService.limpar_dados_firestore(dados_brutos)
            traducoes.append({"id": doc.id, **dados_limpos})
        
        return {
            "discursos": discursos,
            "traducoes": traducoes
        }
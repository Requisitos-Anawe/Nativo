from app.firebase import db

class TraducaoService:

    @staticmethod
    def buscar(traducao_id):
        traducao_doc = db.collection("traducao").document(traducao_id).get()
        if not traducao_doc.exists:
            return None
        return {"id": traducao_doc.id, **traducao_doc.to_dict()}

    @staticmethod
    def atualizar(traducao_id, dados_traducao):
        try:
            traducao_ref = db.collection("traducao").document(traducao_id)
            traducao_ref.update(dados_traducao)
            return {"id": traducao_id, **dados_traducao}, None
        except Exception as e:
            return None, f"Erro ao atualizar tradução: {str(e)}"
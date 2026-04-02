from app.firebase import db
from google.cloud.firestore_v1.base_query import FieldFilter

class DiscursoService:

    @staticmethod
    def buscar_por_id(discurso_id):
        doc = db.collection("discurso").document(discurso_id).get()
        if doc.exists:
            return {"id": doc.id, **doc.to_dict()}
        return None

    @staticmethod
    def atualizar(discurso_id, dados_discurso):
        try:
            discurso_ref = db.collection("discurso").document(discurso_id)
            discurso_ref.update(dados_discurso)
            return {"id": discurso_id, **dados_discurso}, None
        except Exception as e:
            return None, f"Erro ao atualizar discurso: {str(e)}"

    @staticmethod
    def buscar_discurso_e_traducao_por_texto(texto_busca, idioma_discurso=None):
        collection = db.collection("discurso")

        if idioma_discurso:
            collection = collection.where("idioma", "==", idioma_discurso)

        discursos_query = collection.where(filter=FieldFilter("texto", "==", texto_busca)).stream()
        discurso_doc = next(discursos_query, None)

        if not discurso_doc:
            outras_traducoes = DiscursoService.busca_discurso_nas_traducoes(texto_busca,idioma_discurso)
            if not outras_traducoes:
                return None, "Discurso não encontrado."
            else:
                return outras_traducoes, None

        traducoes = DiscursoService.busca_traducoes(discurso_doc.id)

        if not traducoes:
            return None, "Tradução não encontrada"

        resultados = {
            "discurso": discurso_doc.get("texto"),
            "categoria": discurso_doc.get("discurso_categoria"),
            "traducao": traducoes
        }

        return resultados, None

    # busca alternativa do texto nas traducoes
    @staticmethod
    def busca_discurso_nas_traducoes(texto_busca,idioma):
        query = db.collection("traducao")
        if idioma:
            query = query.where("idioma", "==", idioma)
        traducao_query = query.where(filter=FieldFilter("texto", "==", texto_busca)).stream()
        traducao_doc = next(traducao_query, None)
        if not traducao_doc:
            return None
        
        traducao_data = traducao_doc.to_dict()

        # retorna o discurso correspondente + categoria
        discurso_doc = db.collection("discurso").document(traducao_data.get("discurso_id")).get()
        if discurso_doc.exists:
            discurso_data = discurso_doc.to_dict()
            
        resumo = {
            "discurso": traducao_data.get("texto"),
            "categoria": discurso_doc.get("discurso_categoria"),
            "traducao": [ {"texto": discurso_data.get("texto")} ]
        }

        return resumo

    @staticmethod
    def busca_traducoes(discurso_id):
        traducao_query = db.collection("traducao").where("discurso_id", "==", discurso_id).stream()

        # para cada traducao retorna texto
        traducoes = []
        for trad_doc in traducao_query:
            trad_data = trad_doc.to_dict()
            
            traducoes.append({
                "texto": trad_data.get("texto")
            })

        return traducoes
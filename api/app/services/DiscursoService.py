from app.firebase import db
from google.cloud.firestore_v1.base_query import FieldFilter

class DiscursoService:

    @staticmethod
    def buscar_discurso_e_traducao_por_texto(texto_busca):
        discursos_query = db.collection("discurso").where(filter=FieldFilter("texto", "==", texto_busca)).stream()
        discurso_doc = next(discursos_query, None)

        if not discurso_doc:
            outras_traducoes = DiscursoService.busca_discurso_nas_traducoes(texto_busca)
            if not outras_traducoes:
                return None, "Discurso não encontrado."
            else:
                return outras_traducoes, None

        # se achar o discurso busca a categoria do mesmo
        discurso_data = discurso_doc.to_dict()
        categoria_nome = DiscursoService.get_categoria(discurso_data.get("discurso_categoria"))

        # acha traducao do discurso
        traducoes = DiscursoService.busca_traducoes(discurso_doc.id)

        if not traducoes:
            return None, "Tradução não encontrada"

        resultados = {
            "discurso": discurso_data.get("texto"),
            "categoria": categoria_nome,
            "traducao": traducoes
        }

        return resultados, None
    
    @staticmethod
    def get_categoria(categoria_ref):
        if categoria_ref:
            categoria_doc = categoria_ref.get()
            if categoria_doc.exists:
                return categoria_doc.to_dict().get("descricao")
        else:
            return "Não foi possível encontrar a categoria"

    # busca alternativa do texto nas traducoes
    @staticmethod
    def busca_discurso_nas_traducoes(texto_busca):
        traducao_query = db.collection("traducao").where(filter=FieldFilter("texto", "==", texto_busca)).stream()
        traducao_doc = next(traducao_query, None)

        if not traducao_doc:
            return None
        
        traducao_data = traducao_doc.to_dict()

        # retorna o discurso correspondente + categoria
        discurso_ref = traducao_data.get("discurso")
        discurso_doc = discurso_ref.get()
        if discurso_doc.exists:
            discurso_data = discurso_doc.to_dict()
            categoria_nome = DiscursoService.get_categoria(discurso_data.get("discurso_categoria"))
            
        resumo = {
            "discurso": traducao_data.get("texto"),
            "categoria": categoria_nome,
            "traducao": [ {"texto": discurso_data.get("texto")} ]
        }

        return resumo

    
    @staticmethod
    def busca_traducoes(discurso_id):
        traducao_query = db.collection("traducao").where(filter=FieldFilter(
            "discurso", "==", db.document(f"discurso/{discurso_id}")
        )).stream()

        # para cada traducao retorna texto
        traducoes = []
        for trad_doc in traducao_query:
            trad_data = trad_doc.to_dict()
            
            traducoes.append({
                "texto": trad_data.get("texto")
            })

        return traducoes
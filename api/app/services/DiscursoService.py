from app.firebase import db

class DiscursoService:

    @staticmethod
    def buscar_discurso_e_traducao_por_texto(texto_busca):
        discursos_query = db.collection("discurso").where("texto", "==", texto_busca).stream()

        resultados = []

        for discurso_doc in discursos_query:
            discurso_data = discurso_doc.to_dict()

            discurso_resumo = {
                "texto": discurso_data.get("texto"),
                "idioma": None,
                "categoria": None,
            }

            idioma_ref = discurso_data.get("idioma")
            categoria_ref = discurso_data.get("discurso_categoria")

            if idioma_ref:
                idioma_doc = idioma_ref.get()
                if idioma_doc.exists:
                    discurso_resumo["idioma"] = idioma_doc.to_dict().get("nome")

            if categoria_ref:
                categoria_doc = categoria_ref.get()
                if categoria_doc.exists:
                    discurso_resumo["categoria"] = categoria_doc.to_dict().get("descricao")

            traducao_query = db.collection("traducao").where(
                "discurso", "==", db.document("discurso/sFVFIZgqWfMalyHKyONh")
            ).stream()

            traducoes = []
            for trad_doc in traducao_query:
                trad_data = trad_doc.to_dict()
                idioma_trad_nome = None
                idioma_trad_ref = trad_data.get("idioma")
                if idioma_trad_ref:
                    idioma_trad_doc = idioma_trad_ref.get()
                    if idioma_trad_doc.exists:
                        idioma_trad_nome = idioma_trad_doc.to_dict().get("nome")

                traducoes.append({
                    "texto": trad_data.get("texto"),
                    "idioma": idioma_trad_nome,
                })
            if not traducoes:
                traducoes = ["Tradução não encontrada"]

            resultados.append({
                "discurso": discurso_resumo,
                "traducoes": traducoes,
            })

        if not resultados:
            return None, "Discurso com esse texto não encontrado."

        return resultados, None
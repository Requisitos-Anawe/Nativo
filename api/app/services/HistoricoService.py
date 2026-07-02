from datetime import datetime
import pytz

from app.firebase import db

COLLECTION = "historico"


class HistoricoService:
    @staticmethod
    def registrar_consulta(usuario_id, termo_pesquisado, traducao_resultado=None):
        try:
            doc_ref = db.collection(COLLECTION).document()

            historico = {
                "usuario_id": usuario_id,
                "termo_pesquisado": termo_pesquisado,
                "traducao_resultado": traducao_resultado,
                "data_consulta": datetime.now(pytz.utc).astimezone(
                    pytz.timezone("America/Sao_Paulo")
                ),
            }

            doc_ref.set(historico)

            return {
                "mensagem": "Consulta registrada no histórico",
                "id": doc_ref.id,
            }, 201

        except Exception as e:
            return {
                "erro": f"Erro ao registrar histórico: {str(e)}"
            }, 500

    @staticmethod
    def listar_historico_usuario(usuario_id, limit=10):
        try:
            docs = (
                db.collection(COLLECTION)
                .where("usuario_id", "==", usuario_id)
                .stream()
            )

            historico = []

            for doc in docs:
                item = doc.to_dict()
                item["id"] = doc.id

                data_consulta = item.get("data_consulta")

                if hasattr(data_consulta, "isoformat"):
                    item["_ordenacao"] = data_consulta.isoformat()
                    item["data_consulta"] = data_consulta.isoformat()
                else:
                    item["_ordenacao"] = str(data_consulta or "")

                historico.append(item)

            historico.sort(
                key=lambda item: item.get("_ordenacao", ""),
                reverse=True,
            )

            for item in historico:
                item.pop("_ordenacao", None)

            return {
                "mensagem": "Histórico listado com sucesso",
                "dados": historico[:limit],
            }, 200

        except Exception as e:
            return {
                "erro": f"Erro ao listar histórico: {str(e)}"
            }, 500

    @staticmethod
    def deletar_historico_usuario(usuario_id):
        try:
            docs = (
                db.collection(COLLECTION)
                .where("usuario_id", "==", usuario_id)
                .stream()
            )

            count = 0

            for doc in docs:
                db.collection(COLLECTION).document(doc.id).delete()
                count += 1

            return {
                "mensagem": f"{count} itens deletados do histórico"
            }, 200

        except Exception as e:
            return {
                "erro": f"Erro ao deletar histórico: {str(e)}"
            }, 500

    @staticmethod
    def deletar_item_historico_usuario(usuario_id, historico_id):
        try:
            historico_ref = db.collection(COLLECTION).document(historico_id)
            historico_doc = historico_ref.get()

            if not historico_doc.exists:
                return {"erro": "Item de histórico não encontrado"}, 404

            historico = historico_doc.to_dict() or {}
            if historico.get("usuario_id") != usuario_id:
                return {"erro": "Usuário não autorizado a remover este item de histórico"}, 403

            historico_ref.delete()

            return {"mensagem": "Item de histórico removido com sucesso"}, 200

        except Exception as e:
            return {"erro": f"Erro ao deletar item do histórico: {str(e)}"}, 500

from app.middlewares.autenticar_jwt import autenticar_jwt
from flask import Blueprint, request, jsonify, g
from firebase_admin import firestore
from datetime import datetime
import pytz

bp = Blueprint("traducao", __name__)
db = firestore.client()

@bp.route("/traducao/cadastrar", methods=["POST"])
@autenticar_jwt
def cadastrar_traducao():
    usuario_doc = db.collection("usuario").document(g.usuario_id).get()
    if not usuario_doc.exists:
        return jsonify({"erro": "Usuário não encontrado"}), 404

    usuario_data = usuario_doc.to_dict()
    perfil_ref = usuario_data.get("perfil")
    perfil_doc = perfil_ref.get()

    if perfil_doc.to_dict().get("descricao") != "professor":
        return jsonify({"erro": "Apenas usuários com perfil professor podem cadastrar"}), 403

    # Dados da requisição
    data = request.get_json()
    texto_discurso = data.get("discurso_texto")
    texto_traducao = data.get("traducao_texto")
    idioma_discurso_id = data.get("idioma_discurso_id")
    idioma_traducao_id = data.get("idioma_traducao_id")
    categoria_id = data.get("discurso_categoria_id")

    if not all([texto_discurso, texto_traducao, idioma_discurso_id, idioma_traducao_id, categoria_id]):
        return jsonify({"erro": "Todos os campos são obrigatórios"}), 400
    
    if (idioma_discurso_id == idioma_traducao_id):
        return jsonify({"erro": "Os idiomas devem ser diferentes."}), 400

    try:
        # Extrair apenas o ID do documento (depois da barra)
        idioma_discurso_doc_id = idioma_discurso_id.split("/")[-1]
        idioma_traducao_doc_id = idioma_traducao_id.split("/")[-1]
        categoria_doc_id = categoria_id.split("/")[-1]

        # Referências
        idioma_discurso_ref = db.collection("idioma").document(idioma_discurso_doc_id)
        idioma_traducao_ref = db.collection("idioma").document(idioma_traducao_doc_id)
        categoria_ref = db.collection("discurso_categoria").document(categoria_doc_id)
        usuario_ref = db.collection("usuario").document(g.usuario_id)

        # Verifica se já existe um discurso com mesmo texto e mesmo idioma
        discursos_duplicados = db.collection("discurso") \
            .where("texto", "==", texto_discurso) \
            .where("idioma", "==", idioma_discurso_ref) \
            .stream()
        discurso_existente = next(discursos_duplicados, None)

        if discurso_existente:
            discurso_ref = db.collection("discurso").document(discurso_existente.id)
        else:
            # Criar novo discurso
            discurso_ref = db.collection("discurso").document()
            discurso_data = {
                "texto": texto_discurso,
                "data_criacao": datetime.now(pytz.timezone("America/Sao_Paulo")),
                "idioma": idioma_discurso_ref,
                "discurso_categoria": categoria_ref,
                "usuario": usuario_ref
            }
            discurso_ref.set(discurso_data)

        # Criar tradução
        traducao_data = {
            "texto": texto_traducao,
            "data_criacao": datetime.now(pytz.timezone("America/Sao_Paulo")),
            "idioma": idioma_traducao_ref,
            "discurso": discurso_ref,
            "usuario": usuario_ref
        }
        db.collection("traducao").document().set(traducao_data)

        return jsonify({"mensagem": "Tradução cadastrada com sucesso"}), 201

    except Exception as e:
        return jsonify({"erro": f"Erro ao cadastrar: {str(e)}"}), 500

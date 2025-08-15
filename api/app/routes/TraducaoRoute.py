from app.middlewares.autenticar_jwt import autenticar_jwt
from flask import Blueprint, request, jsonify, g
from firebase_admin import firestore
from datetime import datetime
import pytz

bp = Blueprint("traducao", __name__)
db = firestore.client()

@bp.route('/traducao/usuario/<usuario_id>', methods=['POST'])
@autenticar_jwt
def buscar_tracudao_usuario(usuario_id):
    filtros = request.get_json()
    texto_discurso = filtros.get('textoDiscurso')
    idioma_discurso = filtros.get('idiomaDiscurso')

    print(texto_discurso, " ", idioma_discurso)

    # Buscar usuário
    usuario_ref = db.collection('usuario').document(usuario_id)
    usuario_doc = usuario_ref.get()

    if not usuario_doc.exists:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
    usuario = usuario_doc.to_dict()

    perfil_ref = usuario.get('perfil')
    perfil_doc = perfil_ref.get()
    if perfil_doc.to_dict().get("descricao").lower() != 'professor':
        return jsonify({'erro': 'Apenas usuários com perfil professor podem acessar'}), 403

    # Busca traduções vinculadas ao usuário
    query = db.collection('traducao').where('usuario', '==', usuario_ref)

    if idioma_discurso:
        idioma_ref = db.collection('idioma').document(idioma_discurso)
        query = query.where('idioma', '==', idioma_ref)

    if texto_discurso and texto_discurso.strip():
        query = query.where('texto', '>=', texto_discurso).where('texto', '<=', texto_discurso + '\uf8ff')

    query = query.order_by('data_criacao', direction=firestore.Query.DESCENDING)

    traducoes_docs = query.stream()

    traducoes = []
    for doc in traducoes_docs:
        dados = doc.to_dict()
        dados['id'] = doc.id

        # Busca texto do discurso
        discurso_ref = dados.get('discurso')
        if discurso_ref:
            discurso_doc = discurso_ref.get()
            if discurso_doc.exists:
                dados['discurso'] = discurso_doc.to_dict().get('texto')

        # Busca nome do idioma
        idioma_ref = dados.get('idioma')
        if idioma_ref:
            idioma_doc = idioma_ref.get()
            if idioma_doc.exists:
                dados['idioma'] = idioma_doc.to_dict().get('nome')

        if 'usuario' in dados and hasattr(dados['usuario'], 'id'):
            dados['usuario'] = dados['usuario'].id

        dados['data_criacao'] = dados.get('data_criacao').strftime("%d/%m/%Y %H:%M")

        traducoes.append(dados)

    return jsonify(traducoes), 200

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

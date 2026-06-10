import math
import pytz
import uuid
from app.services.DiscursoService import DiscursoService
from app.services.TraducaoService import TraducaoService
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.middlewares.verificar_professor import verificar_professor
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from firebase_admin import firestore, storage

bp = Blueprint("traducao", __name__)
db = firestore.client()
transaction = db.transaction()

@bp.route('/traducao/<traducao_id>/com-discurso', methods=['PUT'])
@autenticar_jwt
@verificar_professor
def editar_traducao_discurso(traducao_id):
    """
    Atualizar tradução e discurso com suporte a multimídia
    ---
    tags:
      - Tradução
    summary: Atualiza uma tradução, seu discurso associado e arquivos de mídia
    security:
      - Bearer: []
    responses:
      200:
        description: Atualizado com sucesso
      400:
        description: Erro de validação
      401:
        description: Não autorizado
      500:
        description: Erro interno
    """
    # Usando request.form para suportar o FormData do React Native
    dados = request.form
    
    texto_discurso = dados.get("discurso")
    texto_traducao = dados.get("traducao")
    idioma_discurso = dados.get("idioma_discurso")
    idioma_traducao = dados.get("idioma_traducao")
    categoria = dados.get("categoria")

    # Formatando strings se existirem
    if texto_discurso: texto_discurso = texto_discurso.lower().strip()
    if texto_traducao: texto_traducao = texto_traducao.lower().strip()
    if idioma_discurso: idioma_discurso = idioma_discurso.lower().strip()
    if idioma_traducao: idioma_traducao = idioma_traducao.lower().strip()
    if categoria: categoria = categoria.lower().strip()

    if idioma_discurso and idioma_traducao and idioma_discurso == idioma_traducao:
        return {"erro": "Os idiomas do discurso e da tradução devem ser diferentes."}, 400

    traducao = TraducaoService.buscar(traducao_id)
    if not traducao:
        return {"erro": "Tradução não encontrada"}, 404

    discurso_id = traducao.get("discurso_id")
    if not discurso_id:
        return {"erro": "Discurso vinculado não encontrado"}, 404

    dados_traducao = {}
    if texto_traducao: dados_traducao["texto"] = texto_traducao
    if idioma_traducao: dados_traducao["idioma"] = idioma_traducao
    if texto_discurso: dados_traducao["discurso"] = texto_discurso

    dados_discurso = {}
    if texto_discurso: dados_discurso["texto"] = texto_discurso
    if idioma_discurso: dados_discurso["idioma"] = idioma_discurso
    if categoria: dados_discurso["discurso_categoria"] = categoria

    # Recuperando arquivos de multimídia
    foto = request.files.get('foto')
    video = request.files.get('video')
    audio = request.files.get('audio')

    try:
        bucket = storage.bucket()
        if foto and foto.filename != "":
            blob_foto = bucket.blob(f"fotos/{uuid.uuid4()}_{foto.filename}")
            blob_foto.upload_from_file(foto, content_type=foto.content_type)
            blob_foto.make_public()
            dados_traducao['imagem_url'] = blob_foto.public_url 

        if video and video.filename != "":
            blob_video = bucket.blob(f"traducoes/videos/{uuid.uuid4()}_{video.filename}")
            blob_video.upload_from_file(video, content_type=video.content_type)
            blob_video.make_public()
            dados_traducao['video_url'] = blob_video.public_url

        if audio and audio.filename != "":
            blob_audio = bucket.blob(f"traducoes/audios/{uuid.uuid4()}_{audio.filename}")
            blob_audio.upload_from_file(audio, content_type=audio.content_type)
            blob_audio.make_public()
            dados_traducao['audio_url'] = blob_audio.public_url
    except Exception as e:
        return jsonify({"erro": f"Erro no upload de arquivos: {str(e)}"}), 500

    erros = []
    
    if dados_traducao:
        try:
            TraducaoService.atualizar(traducao_id, dados_traducao)
        except Exception as e:
            erros.append(f"Erro na tradução: {str(e)}")

    if dados_discurso:
        try:
            DiscursoService.atualizar(discurso_id, dados_discurso)
        except Exception as e:
            erros.append(f"Erro no discurso: {str(e)}")

    if erros:
        return jsonify({"erros": erros}), 400

    return jsonify({"mensagem": "Atualizado com sucesso"}), 200

@bp.route('/traducao/<traducao_id>', methods=['GET'])
@autenticar_jwt
@verificar_professor
def buscar_traducao(traducao_id):
    """
    Buscar tradução por ID
    ---
    security:
        - Bearer: []
    tags:
        - Tradução
    parameters:
        - name: traducao_id
          in: path
          type: string
          required: true
    responses:
        200:
            description: Retorna tradução encontrada
        404:
            description: Tradução não encontrada
        500:
            description: Erro interno
    """
    traducao_doc = db.collection('traducao').document(traducao_id).get()
    if not traducao_doc.exists:
        return jsonify({'erro': 'Tradução não encontrada'}), 404

    discurso_ref = db.collection('discurso').document(traducao_doc.to_dict().get('discurso_id'))
    discurso_doc = discurso_ref.get()
    
    categoria = None
    idiomaDiscurso = None
    if discurso_doc.exists:
        categoria = discurso_doc.to_dict().get('discurso_categoria')
        idiomaDiscurso = discurso_doc.to_dict().get('idioma')

    traducao_data = traducao_doc.to_dict()
    if categoria:
        traducao_data['categoria'] = categoria
    if idiomaDiscurso:
        traducao_data['idiomaDiscurso'] = idiomaDiscurso
    traducao_data['id'] = traducao_doc.id

    return jsonify(traducao_data), 200

@bp.route('/traducao/usuario/<usuario_id>', methods=['POST'])
@autenticar_jwt
@verificar_professor
def listar_traducao_usuario(usuario_id):
    """
    Listar traduções de um usuário específico
    ---
    security:
        - Bearer: []
    tags:
        - Tradução
    parameters:
        - name: usuario_id
          in: path
          type: string
          required: true
        - name: body
          in: body          
          required: false
          schema:
              type: object
              properties:
                textoTraducao:
                    type: string
                    example: "ajo"
                idiomaTraducao:
                    type: string
                    example: "munduruku"
                limite:
                    type: integer
                    example: 5
                pagina:
                    type: integer
                    example: 1
    responses:
        200:
            description: Retorna lista de traduções do usuário com paginação
        400:
            description: Requisição malformada ou dados inválidos
        404:
            description: Usuário não encontrado
        500:
            description: Erro interno
    """
    filtros = request.get_json() or {}
    texto_traducao = filtros.get('textoTraducao')
    idioma_traducao = filtros.get('idiomaTraducao')
    limite = int(filtros.get('limite', 5))  
    pagina = int(filtros.get('pagina', 1))

    if pagina < 1:
        pagina = 1
    if limite < 1:
        limite = 5

    offset = (pagina - 1) * limite

    usuario_ref = db.collection('usuario').document(usuario_id)
    usuario_doc = usuario_ref.get()

    if not usuario_doc.exists:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    base_query = db.collection('traducao').where('usuario_id', '==', usuario_id)

    if idioma_traducao:
        base_query = base_query.where('idioma', '==', idioma_traducao)

    if texto_traducao and texto_traducao.strip():
        base_query = base_query.where('texto', '>=', texto_traducao).where('texto', '<=', texto_traducao + '\uf8ff')

    try:
        count_result = base_query.count().get()
        total_traducoes = count_result[0][0].value if count_result else 0
    except Exception:
        total_traducoes = 0

    total_paginas = math.ceil(total_traducoes / limite) if limite else 1

    query = base_query.order_by('data_criacao', direction=firestore.Query.DESCENDING).offset(offset).limit(limite)
    traducoes_docs = query.stream()

    traducoes = []
    for doc in traducoes_docs:
        dados = doc.to_dict()
        dados['id'] = doc.id
        data_criacao = dados.get('data_criacao')
        dados['data_criacao'] = data_criacao.strftime("%d/%m/%Y %H:%M") if isinstance(data_criacao, datetime) else None
        traducoes.append(dados)

    return jsonify({
        'pagina': pagina,
        'limite': limite,
        'total_paginas': total_paginas,
        'total_registros': total_traducoes,
        'traducoes': traducoes
    }), 200

@bp.route("/traducao/cadastrar", methods=["POST"])
@autenticar_jwt
@verificar_professor
def cadastrar_traducao():
    """
    Cadastrar nova tradução com multimídia
    ---
    security:
        - Bearer: []    
    tags:
        - Tradução
    responses:
        201:
            description: Tradução cadastrada com sucesso    
        400:
            description: Requisição malformada, campos obrigatórios ausentes ou dados inválidos
        500:    
            description: Erro interno
    """
    usuario_id = g.get('usuario_id')

    # Voltando a usar request.form para permitir os arquivos do frontend
    data = request.form
    discurso = data.get("discurso")
    traducao = data.get("traducao")
    idioma_discurso = data.get("idioma_discurso")
    idioma_traducao = data.get("idioma_traducao")
    categoria = data.get("categoria")
    discurso = data.get("discurso")
    traducao = data.get("traducao")
    idioma_discurso = data.get("idioma_discurso")
    idioma_traducao = data.get("idioma_traducao")
    categoria = data.get("categoria")

    # --- ADICIONE ESTES PRINTS AQUI ---
    print("=== DADOS RECEBIDOS DO APP ===")
    print("FORM:", request.form)
    print("FILES:", request.files)
    print(f"Campos -> discurso: '{discurso}', traducao: '{traducao}', idiomaD: '{idioma_discurso}', idiomaT: '{idioma_traducao}', categoria: '{categoria}'")
    print("==============================")
    if not all([discurso, traducao, idioma_discurso, idioma_traducao, categoria]):
        return jsonify({"erro": "Todos os campos de texto são obrigatórios"}), 400
    
    discurso = discurso.lower().strip()
    traducao = traducao.lower().strip()
    idioma_discurso = idioma_discurso.lower().strip()
    idioma_traducao = idioma_traducao.lower().strip()
    categoria = categoria.lower().strip()

    if (idioma_discurso == idioma_traducao):
        return jsonify({"erro": "Os idiomas devem ser diferentes."}), 400

    # Recupera os arquivos
    foto = request.files.get('foto')
    video = request.files.get('video')
    audio = request.files.get('audio')

    try:
        bucket = storage.bucket()
        foto_url = None
        video_url = None
        audio_url = None

        if foto and foto.filename != "":
            blob_foto = bucket.blob(f"fotos/{uuid.uuid4()}_{foto.filename}")
            blob_foto.upload_from_file(foto, content_type=foto.content_type)
            blob_foto.make_public()
            foto_url = blob_foto.public_url 

        if video and video.filename != "":
            blob_video = bucket.blob(f"traducoes/videos/{uuid.uuid4()}_{video.filename}")
            blob_video.upload_from_file(video, content_type=video.content_type)
            blob_video.make_public()
            video_url = blob_video.public_url

        if audio and audio.filename != "":
            blob_audio = bucket.blob(f"traducoes/audios/{uuid.uuid4()}_{audio.filename}")
            blob_audio.upload_from_file(audio, content_type=audio.content_type)
            blob_audio.make_public()
            audio_url = blob_audio.public_url

        # Processamento do Discurso (Achatado como na develop)
        discursos_duplicados = db.collection("discurso") \
            .where("texto", "==", discurso) \
            .where("idioma", "==", idioma_discurso) \
            .stream()
        discurso_existente = next(discursos_duplicados, None)

        if discurso_existente:
            discurso_ref = db.collection("discurso").document(discurso_existente.id)
        else:
            discurso_ref = db.collection("discurso").document()
            discurso_data = {
                "texto": discurso,
                "data_criacao": datetime.now(pytz.timezone("America/Sao_Paulo")),
                "idioma": idioma_discurso,
                "discurso_categoria": categoria,
            }
            discurso_ref.set(discurso_data)

        # Criar tradução com as URLs de mídia inseridas
        traducao_data = {
            "texto": traducao,
            "data_criacao": datetime.now(pytz.timezone("America/Sao_Paulo")),
            "idioma": idioma_traducao,
            "discurso": discurso,
            "usuario_id": usuario_id,
            "discurso_id": discurso_ref.id,
            "imagem_url": foto_url,  
            "video_url": video_url,   
            "audio_url": audio_url
        }
        db.collection("traducao").document().set(traducao_data)

        return jsonify({"mensagem": "Tradução cadastrada com sucesso"}), 201

    except Exception as e:
        print("====== ERRO CRÍTICO NO CADASTRO ======")
        import traceback
        traceback.print_exc() 
        print("======================================")
        return jsonify({"erro": f"Erro ao cadastrar: {str(e)}"}), 500

@bp.route("/traducao", methods=["GET"])
@autenticar_jwt
def listar_traducoes():
    """
    Listar traduções
    ---
    security:
        - Bearer: []
    tags:
        - Tradução
    parameters:
        - name: pagina
          in: query
          type: integer
          required: false
        - name: limite
          in: query
          type: integer
          required: false
    responses:
        200: 
            description: Retorna lista de traduções com paginação
        500:
            description: Erro interno
    """
    try:
        pagina = int(request.args.get('pagina', 1))
        limite = int(request.args.get('limite', 10))
        if not pagina: 
            pagina = 1
        if not limite:
            limite = 10
        offset = (pagina - 1) * limite

        count_result = db.collection("traducao").count().get()
        total_traducoes = count_result[0][0].value
        total_paginas = math.ceil(total_traducoes / limite)

        traducoes_query = db.collection('traducao') \
            .order_by('data_criacao', direction=firestore.Query.DESCENDING) \
            .offset(offset).limit(limite)

        traducoes_docs = traducoes_query.stream()

        resultados = []

        for doc in traducoes_docs:
            traducao_data = doc.to_dict()
            data_criacao = traducao_data.get('data_criacao')
            data_criacao_formatada = data_criacao.strftime("%d/%m/%Y %H:%M") if isinstance(data_criacao, datetime) else None
            usuario_id = traducao_data.get('usuario_id')
            usuario = db.collection('usuario').document(usuario_id).get() if usuario_id else None

            # Garantindo que as mídias da sua branch também retornem
            resultados.append({
                "id": doc.id,
                "texto": traducao_data.get('texto'),
                "data_criacao": data_criacao_formatada,
                "idioma": traducao_data.get('idioma'),
                "discurso": traducao_data.get('discurso'),
                "discurso_id": traducao_data.get('discurso_id'),
                'usuario': usuario.get('nome') if usuario and usuario.exists else None,
                'imagem_url': traducao_data.get('imagem_url'),
                'video_url': traducao_data.get('video_url'),
                'audio_url': traducao_data.get('audio_url')
            })

        return jsonify({
            "total_paginas": total_paginas,
            "total_registros": total_traducoes,
            'pagina': pagina,
            'limite': limite,
            'traducoes': resultados
        })

    except Exception as e:
        return jsonify({'erro': str(e)}), 500
    
@bp.route("/traducao/<traducao_id>", methods=["DELETE"])
@autenticar_jwt
def apagar_traducao(traducao_id):
    """
    Excluir tradução
    ---
    security:
        - Bearer: []
    tags:
        - Tradução
    parameters:
        - name: traducao_id
          in: path
          type: string
          required: true
    responses:
        200:
            description: Tradução excluída com sucesso
        404:
            description: Tradução não encontrada
        500:
            description: Erro interno
    """
    try:
        traducao_ref = db.collection("traducao").document(traducao_id)
        doc = traducao_ref.get()

        if not doc.exists:
            return jsonify({"erro": "Tradução não encontrada"}), 404

        traducao_ref.delete()

        return jsonify({"mensagem": "Tradução excluída com sucesso"}), 200

    except Exception as e:
        return jsonify({"erro": f"Erro ao excluir tradução: {str(e)}"}), 500
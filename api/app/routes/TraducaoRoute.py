import math
import pytz
from app.services.DiscursoService import DiscursoService
from app.services.TraducaoService import TraducaoService
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.middlewares.verificar_professor import verificar_professor
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from firebase_admin import firestore
from datetime import datetime

bp = Blueprint("traducao", __name__)
db = firestore.client()
transaction = db.transaction()

@bp.route('/traducao/<traducao_id>/com-discurso', methods=['PUT'])
@autenticar_jwt
@verificar_professor
def editar_traducao_discurso(traducao_id):
    """
    Atualizar tradução e discurso
    ---
    tags:
      - Tradução
    summary: Atualiza uma tradução e seu discurso associado
    security:
      - Bearer: []
    parameters:
      - name: traducao_id
        in: path
        type: string
        required: true
        description: ID da tradução
      - in: body
        name: body
        required: true
        schema:
          type: object
          required:
            - traducao
            - discurso_id
          properties:
            traducao:
              type: object
              required:
                - discurso
                - texto
              properties:
                discurso:
                  type: string
                  example: olá
                texto:
                  type: string
                  example: hello
            discurso_id:
              type: string
              example: Tujsjda823jndsa
            discurso:
              type: object
              properties:
                texto:
                  type: string
                  example: saudação informal
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
    dados = request.get_json()

    dados_traducao = dados.get("traducao")
    dados_discurso = dados.get("discurso")
    discurso_id = dados.get("discurso_id")

    erros = []

    if dados_discurso['idioma'] == dados_traducao['idioma']:
        return {"erro": "Os idiomas do discurso e da tradução devem ser diferentes."}, 400

    traducao = TraducaoService.buscar(traducao_id)
    if not traducao:
        return {"erro": "Tradução não encontrada"}, 404

    discurso = DiscursoService.buscar_por_id(discurso_id)
    if not discurso:
        return {"erro": "Discurso não encontrado"}, 404
    
    if traducao["discurso_id"] != discurso_id:
        return {"erro": "Discurso não pertence à tradução"}, 400

    if dados_traducao:
        try:
            TraducaoService.atualizar(traducao_id, dados_traducao)
        except Exception as e:
            erros.append(f"Erro na tradução: {str(e)}")

    if dados_discurso and discurso_id:
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
    Cadastrar nova tradução
    ---
    security:
        - Bearer: []    
    tags:
        - Tradução
    parameters:
        - name: body          
          in: body
          schema:
            type: object
            required:
              - discurso
              - traducao
              - idioma_discurso
              - idioma_traducao
              - categoria
            properties:
              discurso:
                type: string
                example: "Olá, como vai você?"
              traducao:
                type: string
                example: "Hello, how are you?"
              idioma_discurso:
                type: string
                example: "português"
              idioma_traducao:
                type: string
                example: "inglês"
              categoria:
                type: string
                example: "saudações"
    responses:
        201:
            description: Tradução cadastrada com sucesso    
        400:
            description: Requisição malformada, campos obrigatórios ausentes ou dados inválidos
        500:    
            description: Erro interno
    """
    usuario_id = g.get('usuario_id')

    data = request.get_json()
    discurso = data.get("discurso").lower()
    traducao = data.get("traducao").lower()
    idioma_discurso = data.get("idioma_discurso").lower()
    idioma_traducao = data.get("idioma_traducao").lower()
    categoria = data.get("categoria").lower()

    if not all([discurso, traducao, idioma_discurso, idioma_traducao, categoria]):
        return jsonify({"erro": "Todos os campos são obrigatórios"}), 400
    
    if (idioma_discurso == idioma_traducao):
        return jsonify({"erro": "Os idiomas devem ser diferentes."}), 400

    try:
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

        # Criar tradução
        traducao_data = {
            "texto": traducao,
            "data_criacao": datetime.now(pytz.timezone("America/Sao_Paulo")),
            "idioma": idioma_traducao,
            "discurso": discurso,
            "usuario_id": usuario_id,
            "discurso_id": discurso_ref.id
        }
        db.collection("traducao").document().set(traducao_data)

        return jsonify({"mensagem": "Tradução cadastrada com sucesso"}), 201

    except Exception as e:
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

            resultados.append({
                "id": doc.id,
                "texto": traducao_data.get('texto'),
                "data_criacao": data_criacao_formatada,
                "idioma": traducao_data.get('idioma'),
                "discurso": traducao_data.get('discurso'),
                "discurso_id": traducao_data.get('discurso_id'),
                'usuario': usuario.get('nome') if usuario and usuario.exists else None
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
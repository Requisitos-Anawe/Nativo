import math
import pytz
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.middlewares.verificar_professor import verificar_professor
from datetime import datetime
from flask import Blueprint, request, jsonify, g
from firebase_admin import firestore
from datetime import datetime

bp = Blueprint("traducao", __name__)
db = firestore.client()
transaction = db.transaction()

@bp.route('/traducao/<traducao_id>', methods=['GET'])
@autenticar_jwt
@verificar_professor
def buscar_traducao(traducao_id):
    traducao_doc = db.collection('traducao').document(traducao_id).get()
    if not traducao_doc.exists:
        return jsonify({'erro': 'Tradução não encontrada'}), 404

    traducao_data = traducao_doc.to_dict()
    traducao_data['id'] = traducao_doc.id

    # Substituir campos DocumentReference por IDs
    traducao_data['usuario'] = traducao_data['usuario'].id if traducao_data.get('usuario') else None

    # Buscar idioma associado (traducao)
    idioma_traducao_ref = db.collection('idioma').document(traducao_data['idioma'].id)
    idioma_traducao_doc = idioma_traducao_ref.get()
    if(idioma_traducao_doc):
        traducao_data['idioma'] = idioma_traducao_doc.to_dict()
        traducao_data['idioma']['id'] = idioma_traducao_doc.id
    else:
        return jsonify({'erro': 'Não foi possível encontrar o idioma da tradução'}), 404

    # Buscar discurso associado
    discurso_ref = traducao_data.get('discurso')
    if discurso_ref:
        discurso_doc = discurso_ref.get()
        if discurso_doc.exists:
            discurso_data = discurso_doc.to_dict()
            discurso_data['id'] = discurso_doc.id

            # Substituir DocumentReference em discurso
            discurso_data['usuario'] = discurso_data['usuario'].id if discurso_data.get('usuario') else None

            # Buscar categoria associada
            categoria_ref = discurso_data.get('discurso_categoria')
            if categoria_ref:
                categoria_doc = categoria_ref.get()
                if categoria_doc.exists:
                    categoria_data = categoria_doc.to_dict()
                    categoria_data['id'] = categoria_doc.id
                    discurso_data['discurso_categoria'] = categoria_data
                else:
                    discurso_data['discurso_categoria'] = None
            
            # Buscar idioma associado (discurso)
            idioma_discurso_ref = discurso_data.get('idioma')
            if idioma_discurso_ref:
                idioma_discurso_doc = idioma_discurso_ref.get()
                if idioma_discurso_doc.exists:
                    idioma_discurso_data = idioma_discurso_doc.to_dict()
                    idioma_discurso_data['id'] = idioma_discurso_doc.id
                    discurso_data['idioma'] = idioma_discurso_data
                else:
                    discurso_data['idioma'] = None

            traducao_data['discurso'] = discurso_data
        else:
            traducao_data['discurso'] = None
    else:
        traducao_data['discurso'] = None

    return jsonify(traducao_data), 200
    
# TODO: Apenas o autor da traducao ou moderador pode alterar
@bp.route('/traducao/discurso/edit-completo/<traducao_id>', methods=['PUT'])
@autenticar_jwt
@verificar_professor
def editar_traducao_discurso(traducao_id):
    dados = request.get_json()

    novo_texto_traducao = dados.get('texto_traducao')
    novo_idioma_traducao_id = dados.get('idioma_traducao_id')
    novo_texto_discurso = dados.get('texto_discurso')
    novo_idioma_discurso_id = dados.get('idioma_discurso_id')
    nova_categoria_id = dados.get('discurso_categoria_id')

    if not (novo_texto_traducao or 
            novo_idioma_traducao_id or 
            novo_texto_discurso or 
            novo_idioma_discurso_id or 
            nova_categoria_id):
        return jsonify({'erro': 'Nenhum dado fornecido para atualização'}), 400

    db = firestore.client()
    transaction = db.transaction()

    @firestore.transactional
    def atualizar_in_transaction(transaction, traducao_ref):
        # Todas as leituras devem acontecer antes de qualquer escrita
        traducao_doc = traducao_ref.get(transaction=transaction)
        if not traducao_doc.exists:
            raise ValueError("Tradução não encontrada")

        traducao_data = traducao_doc.to_dict()
        discurso_ref = traducao_data.get('discurso')
        discurso_doc = discurso_ref.get(transaction=transaction)

        if not discurso_doc.exists:
            raise ValueError("Discurso vinculado não encontrado")

        update_traducao = {}
        update_discurso = {}

        # Leituras adicionais de idioma/categoria
        novo_idioma_traducao_ref = None
        if novo_idioma_traducao_id:
            novo_idioma_traducao_ref = db.collection('idioma').document(novo_idioma_traducao_id)
            idioma_doc = novo_idioma_traducao_ref.get(transaction=transaction)
            if not idioma_doc.exists:
                raise ValueError("Idioma de tradução não encontrado")

            idioma_discurso_ref = discurso_doc.to_dict().get('idioma')
            if idioma_discurso_ref.id == novo_idioma_traducao_ref.id:
                raise ValueError("Idioma da tradução não pode ser igual ao do discurso")

        novo_idioma_discurso_ref = None
        if novo_idioma_discurso_id:
            novo_idioma_discurso_ref = db.collection('idioma').document(novo_idioma_discurso_id)
            idioma_doc = novo_idioma_discurso_ref.get(transaction=transaction)
            if not idioma_doc.exists:
                raise ValueError("Idioma do discurso não encontrado")

        categoria_ref = None
        if nova_categoria_id:
            categoria_ref = db.collection('discurso_categoria').document(nova_categoria_id)
            categoria_doc = categoria_ref.get(transaction=transaction)
            if not categoria_doc.exists:
                raise ValueError("Categoria do discurso não encontrada")

        # Só agora podemos fazer updates
        if novo_texto_traducao:
            update_traducao['texto'] = novo_texto_traducao
        if novo_idioma_traducao_ref:
            update_traducao['idioma'] = novo_idioma_traducao_ref
        if update_traducao:
            update_traducao['data_atualizacao'] = datetime.now(pytz.timezone("America/Sao_Paulo"))
            transaction.update(traducao_ref, update_traducao)

        if novo_texto_discurso:
            update_discurso['texto'] = novo_texto_discurso
        if novo_idioma_discurso_ref:
            update_discurso['idioma'] = novo_idioma_discurso_ref
        if categoria_ref:
            update_discurso['discurso_categoria'] = categoria_ref
        if update_discurso:
            update_discurso['data_atualizacao'] = datetime.now(pytz.timezone("America/Sao_Paulo"))
            transaction.update(discurso_ref, update_discurso)


    traducao_ref = db.collection('traducao').document(traducao_id)

    try:
        atualizar_in_transaction(transaction, traducao_ref)
    except ValueError as e:
        return jsonify({'erro': str(e)}), 400
    except Exception as e:
        return jsonify({'erro': f'Erro inesperado: {str(e)}'}), 500

    return jsonify({'mensagem': 'Tradução e discurso atualizados com sucesso'}), 200

# Busca traducoes cadastradas por um usuario especifico
@bp.route('/traducao/usuario/<usuario_id>', methods=['POST'])
@autenticar_jwt
@verificar_professor
def listar_tracudao_usuario(usuario_id):
    filtros = request.get_json()
    texto_discurso = filtros.get('textoDiscurso')
    idioma_discurso = filtros.get('idiomaDiscurso')

    # Buscar usuário
    usuario_ref = db.collection('usuario').document(usuario_id)
    usuario_doc = usuario_ref.get()

    if not usuario_doc.exists:
        return jsonify({'erro': 'Usuário não encontrado'}), 404
    
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
@verificar_professor
def cadastrar_traducao():
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

@bp.route("/traducao", methods=["GET"])
@autenticar_jwt
def listar_traducoes():
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
            discurso_ref = traducao_data.get('discurso')
            idioma_ref = traducao_data.get('idioma')
            usuario_ref = traducao_data.get('usuario')

            data_criacao = traducao_data.get('data_criacao')
            data_criacao_formatada = data_criacao.strftime("%d/%m/%Y %H:%M") if isinstance(data_criacao, datetime) else None

            discurso_doc = discurso_ref.get() if discurso_ref else None
            idioma_doc = idioma_ref.get() if idioma_ref else None
            usuario_doc = usuario_ref.get() if usuario_ref else None

            discurso_data = discurso_doc.to_dict() if discurso_doc and discurso_doc.exists else {}
            idioma_data_discurso = discurso_data.get('idioma').get().to_dict() if discurso_data.get('idioma') else {}
            categoria_data = discurso_data.get('discurso_categoria').get().to_dict() if discurso_data.get('discurso_categoria') else {}

            resultados.append({
                'id': doc.id,
                'texto': traducao_data.get('texto'),
                'data_criacao': data_criacao_formatada,
                'usuario': usuario_doc.to_dict().get('nome') if usuario_doc and usuario_doc.exists else None,
                'idioma': {
                    'id': idioma_ref.id,
                    **idioma_doc.to_dict()
                } if idioma_doc else None,
                'discurso': {
                    'id': discurso_ref.id,
                    'data_criacao': discurso_data.get('data_criacao'),
                    'texto': discurso_data.get('texto'),
                    'idioma': {
                        'id': discurso_data.get('idioma').id,
                        **idioma_data_discurso
                    } if idioma_data_discurso else None,
                    'discurso_categoria': {
                        'id': discurso_data.get('discurso_categoria').id,
                        **categoria_data
                    } if categoria_data else None,
                }
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
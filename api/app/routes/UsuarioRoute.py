from app.firebase import bucket
from flask import Blueprint, g, request, jsonify
from app.services import UsuarioService
from app.schemas.UsuarioSchema import UsuarioSchema
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.middlewares.verificar_admin import verificar_admin

schema = UsuarioSchema()

bp = Blueprint('usuarios', __name__)

CAMPOS_USUARIO_COMPLETO = ['nome', 'data_nascimento', 'email', 'senha']
CAMPOS_MODERADOR = ['nome', 'data_nascimento']
PERFIS_ADMIN = {'admin', 'administrador'}
PERFIS_MODERADOR = {'moderador'}
PERFIS_PROTEGIDOS_MODERADOR = {'admin', 'administrador', 'moderador'}


def _perfil(usuario_id):
    perfil = UsuarioService.obter_descricao_perfil_por_id(usuario_id)
    return perfil.lower() if perfil else None


def _campos_permitidos_para_atualizacao(usuario_logado_id, usuario_alvo_id):
    if usuario_logado_id == usuario_alvo_id:
        return CAMPOS_USUARIO_COMPLETO, None

    perfil_logado = _perfil(usuario_logado_id)
    perfil_alvo = _perfil(usuario_alvo_id)

    if perfil_logado in PERFIS_ADMIN:
        return CAMPOS_USUARIO_COMPLETO, None

    if perfil_logado in PERFIS_MODERADOR:
        if perfil_alvo in PERFIS_PROTEGIDOS_MODERADOR:
            return None, ({'erro': 'Moderadores não podem editar administradores ou outros moderadores'}, 403)
        return CAMPOS_MODERADOR, None

    return None, ({'erro': 'Usuário não autorizado a editar este perfil'}, 403)


@bp.route('/usuarios', methods=['GET'])
@autenticar_jwt
def listar():
    """
    Listar Usuarios
    ---
    security:
      - Bearer: []
    tags:
      - Usuários
    parameters:
        - name: limit
          in: query
          type: integer
          required: false
        - name: start_after
          in: query
          type: string
          required: false
    responses:
      200:
        description: Retorna lista de usuarios
    """
    limit = request.args.get("limit", default=10, type=int)
    start_after = request.args.get("start_after")
    return jsonify(UsuarioService.listar_usuarios(limit, start_after))

@bp.route('/usuarios/<usuario_id>', methods=['GET'])
@autenticar_jwt
def buscar(usuario_id):
    """
    Buscar usuário por ID
    ---
    security:
      - Bearer: []
    tags:
      - Usuários
    summary: Retorna um usuário específico
    parameters:
      - name: usuario_id
        in: path
        type: string
        required: true
        description: ID do usuário
    responses:
      200:
        description: Usuário encontrado
      404:
        description: Usuário não encontrado
    """
    usuario = UsuarioService.buscar_usuario_por_id(usuario_id)
    if usuario:
        return jsonify(usuario)
    return jsonify({"erro": "Usuário não encontrado"}), 404

@bp.route('/usuarios/<usuario_id>/perfil', methods=['PUT'])
@autenticar_jwt
@verificar_admin
def editar_perfil_usuario(usuario_id):
    """
    Atualizar perfil do usuário
    ---
    security:
      - Bearer: []
    tags:
      - Usuários
    summary: Atualiza o perfil de um usuário
    parameters:
      - name: usuario_id
        in: path
        type: string
        required: true
        description: ID do usuário
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            perfil:
              type: string
              example: admin
    responses:
      200:
        description: Perfil atualizado com sucesso
      400:
        description: Perfil não fornecido
      500:
        description: Erro interno ao atualizar perfil
    """
    dados = request.get_json()
    perfil = dados.get('perfil')
    print(perfil)

    if not perfil:
        return jsonify({'erro': 'Novo perfil não fornecido'}), 400
    
    if usuario_id == g.usuario_id:
        return jsonify({'erro': 'Usuário não pode editar seu próprio perfil'}), 400
    
    usuario_atual = UsuarioService.buscar_usuario_por_id(usuario_id)
    if not usuario_atual:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    if usuario_atual['perfil'] == 'admin' and perfil != 'admin':
        return jsonify({'erro': 'Usuário não pode remover o perfil de admin'}), 400

    try:
        erro = UsuarioService.atualizar_usuario(usuario_id, perfil)
        if(erro):
            return erro
        return jsonify({'mensagem': 'Perfil do usuário atualizado com sucesso'}), 200

    except Exception as e:
        return jsonify({'erro': f'Erro ao atualizar perfil: {str(e)}'}), 500

@bp.route('/upload', methods=['POST'])
@autenticar_jwt
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['file']
    blob = bucket.blob(file.filename)
    blob.upload_from_file(file)
    
    blob.make_public()
    url = blob.public_url
    
    return jsonify({'message': 'Arquivo enviado com sucesso', 'url': url})

@bp.route('/usuarios/<usuario_id>', methods=['PUT'])
@autenticar_jwt
def atualizar_dados_usuario(usuario_id):
    """Atualiza dados cadastrais de um usuário.

    Regras:
    - o próprio usuário pode atualizar nome, data de nascimento, email e senha;
    - administradores podem atualizar esses mesmos campos para qualquer usuário;
    - moderadores podem atualizar apenas nome e data de nascimento de usuários não protegidos;
    - perfil não é aceito neste endpoint.
    """
    dados = request.get_json(silent=True)
    if not isinstance(dados, dict) or not dados:
        return jsonify({'erro': 'Dados não fornecidos'}), 400

    usuario_atual = UsuarioService.buscar_usuario_por_id(usuario_id)
    if not usuario_atual:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    campos_permitidos, erro_permissao = _campos_permitidos_para_atualizacao(g.usuario_id, usuario_id)
    if erro_permissao:
        corpo, status = erro_permissao
        return jsonify(corpo), status

    if 'perfil' in dados:
        return jsonify({'erro': 'O campo perfil deve ser alterado apenas pelo endpoint específico de perfil'}), 400

    try:
        resultado = UsuarioService.atualizar_dados_usuario(
            usuario_id,
            dados,
            campos_permitidos=campos_permitidos,
        )

        if isinstance(resultado, str):
            return jsonify({'erro': resultado}), 400

        if isinstance(resultado, dict) and resultado.get('erro'):
            status = 400 if resultado.get('erro') != 'Usuário não encontrado' else 404
            return jsonify(resultado), status

        return jsonify(resultado), 200

    except Exception as e:
        return jsonify({'erro': f'Erro ao atualizar dados do usuário: {str(e)}'}), 500


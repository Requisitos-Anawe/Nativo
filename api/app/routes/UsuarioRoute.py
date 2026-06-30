from xml.dom import ValidationErr
from app.firebase import bucket, db
from flask import Blueprint, g, request, jsonify
from app.services import UsuarioService
from app.schemas.UsuarioSchema import UsuarioSchema
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.middlewares.verificar_admin import verificar_admin

schema = UsuarioSchema()

bp = Blueprint('usuarios', __name__)

CAMPOS_USUARIO_COMPLETO = ['nome', 'data_nascimento', 'email', 'senha', 'imagem_url', 'foto']
CAMPOS_MODERADOR = ['nome', 'data_nascimento', 'imagem_url', 'foto']
PERFIS_ADMIN = {'admin', 'administrador'}
PERFIS_MODERADOR = {'moderador'}
PERFIS_PROTEGIDOS_MODERADOR = {'admin', 'administrador', 'moderador', 'professor'}


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
            return None, ({'erro': 'Moderadores não podem editar administradores, professores ou outros moderadores'}, 403)
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


@bp.route('/usuarios/me', methods=['GET'])
@autenticar_jwt
def buscar_usuario_logado():
    """Retorna os dados seguros do usuário autenticado."""
    usuario = UsuarioService.buscar_usuario_por_id(g.usuario_id)
    if usuario:
        return jsonify({
            'mensagem': 'Usuário encontrado',
            'dados': usuario,
        }), 200
    return jsonify({'erro': 'Usuário não encontrado'}), 404

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
    solicitante = UsuarioService.buscar_usuario_por_id(g.usuario_id)
    if not solicitante:
        return jsonify({'erro': 'Usuário solicitante não encontrado'}), 404
        
    perfil_solicitante = solicitante.get('perfil')
    if hasattr(perfil_solicitante, 'id'):
        perfil_solicitante = perfil_solicitante.id
        
    if str(perfil_solicitante) not in ['admin', 'administrador']:
     return jsonify({'erro': 'Acesso negado. Apenas administradores podem atribuir cargos.'}), 403
    # -------------------------------------------------------------

    dados = request.get_json()
    perfil = dados.get('perfil')

    if not perfil:
        return jsonify({'erro': 'Novo perfil não fornecido'}), 400
    
    usuario_content = UsuarioService.buscar_usuario_por_id(usuario_id)
    if not usuario_content:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    # Normalizar o perfil atual do usuário alvo
    perfil_atual = usuario_content.get('perfil')
    if hasattr(perfil_atual, 'id'):
        perfil_atual = perfil_atual.id
    perfil_atual = str(perfil_atual)

    # FE01: Se o usuário alvo era admin e está deixando de ser
    if perfil_atual in ['admin', 'administrador'] and perfil not in ['admin', 'administrador']:
        usuarios_stream = db.collection('usuario').stream()
        admins_ativos = []
        
        for doc in usuarios_stream:
            u_data = doc.to_dict()
            p = u_data.get('perfil')
            p_id = p.id if hasattr(p, 'id') else str(p)
            status_u = u_data.get('status', 'ativo')
            
            if p_id in ['admin', 'administrador'] and status_u == 'ativo':
                admins_ativos.append(doc.id)
        
        if usuario_id in admins_ativos and len(admins_ativos) <= 1:
            return jsonify({
                'erro': 'Operação bloqueada (FE01). A plataforma não pode ficar sem supervisão administrativa.'
            }), 400

    try:
        erro = UsuarioService.atualizar_usuario(usuario_id, perfil)
        if erro:
            return erro
        return jsonify({'mensagem': 'Perfil do usuário atualizado com sucesso'}), 200

    except Exception as e:
        return jsonify({'erro': f'Erro ao atualizar perfil: {str(e)}'}), 500


@bp.route('/usuarios/<usuario_id>/status', methods=['PUT'])
@autenticar_jwt
@verificar_admin
def editar_status_usuario(usuario_id):
    
    solicitante = UsuarioService.buscar_usuario_por_id(g.usuario_id)
    if not solicitante:
        return jsonify({'erro': 'Usuário solicitante não encontrado'}), 404
        
    perfil_solicitante = solicitante.get('perfil')
    if hasattr(perfil_solicitante, 'id'):
        perfil_solicitante = perfil_solicitante.id
        
    if str(perfil_solicitante) not in ['admin', 'administrador']:
       return jsonify({'erro': 'Acesso negado. Apenas administradores podem alterar status.'}), 403
    # -------------------------------------------------------------

    dados = request.get_json()
    status = dados.get('status')
    motivo = dados.get('motivo')

    if not status:
        return jsonify({'erro': 'Novo status não fornecido'}), 400
    
    usuario_content = UsuarioService.buscar_usuario_por_id(usuario_id)
    if not usuario_content:
        return jsonify({'erro': 'Usuário não encontrado'}), 404

    # Normalizar o perfil atual do usuário alvo
    perfil_atual = usuario_content.get('perfil')
    if hasattr(perfil_atual, 'id'):
        perfil_atual = perfil_atual.id
    perfil_atual = str(perfil_atual)

    # FE01: Se o comando for banir e o alvo for um administrador
    if status == 'banido' and perfil_atual in ['admin', 'administrador']:
        usuarios_stream = db.collection('usuario').stream()
        admins_ativos = []
        
        for doc in usuarios_stream:
            u_data = doc.to_dict()
            p = u_data.get('perfil')
            p_id = p.id if hasattr(p, 'id') else str(p)
            status_u = u_data.get('status', 'ativo')
            
            if p_id in ['admin', 'administrador'] and status_u == 'ativo':
                admins_ativos.append(doc.id)
        
        if usuario_id in admins_ativos and len(admins_ativos) <= 1:
            return jsonify({
                'erro': 'Operação bloqueada (FE01). A plataforma não pode ficar sem supervisão administrativa.'
            }), 400

    try:
        erro = UsuarioService.atualizar_status_usuario(usuario_id, status, motivo)
        if erro:
            return erro
        return jsonify({'mensagem': f'Status do usuário atualizado para {status}'}), 200

    except Exception as e:
        return jsonify({'erro': f'Erro ao atualizar status: {str(e)}'}), 500

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


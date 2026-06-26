from xml.dom import ValidationErr
from app.firebase import bucket, db
from flask import Blueprint, g, request, jsonify
from app.services import UsuarioService
from app.schemas.UsuarioSchema import UsuarioSchema
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.middlewares.verificar_admin import verificar_admin

schema = UsuarioSchema()

bp = Blueprint('usuarios', __name__)

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
# @verificar_admin (Removido para evitar o conflito de DocumentReference)
def editar_perfil_usuario(usuario_id):
    """
    Atualizar perfil do usuário (Com validação FE01 expandida)
    """
    # 1. NOVA TRAVA DE SEGURANÇA MANUAL (Ignora o conflito de tipos)
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
# @verificar_admin (Removido para evitar o conflito de DocumentReference)
def editar_status_usuario(usuario_id):
    """
    Atualizar o status do usuário (Banir/Desbanir com validação FE01 expandida)
    """
    # 1. NOVA TRAVA DE SEGURANÇA MANUAL (Ignora o conflito de tipos)
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
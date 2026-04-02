from xml.dom import ValidationErr
from app.firebase import bucket
from flask import Blueprint, request, jsonify
from app.services import UsuarioService
from app.schemas.UsuarioSchema import UsuarioSchema
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.middlewares.verificar_admin import verificar_admin

schema = UsuarioSchema()

bp = Blueprint('usuarios', __name__)

@bp.route('/usuarios', methods=['GET'])
@autenticar_jwt
def listar():
    limit = request.args.get("limit", default=10, type=int)
    start_after = request.args.get("start_after")
    return jsonify(UsuarioService.listar_usuarios(limit, start_after))

@bp.route('/usuarios/<usuario_id>', methods=['GET'])
@autenticar_jwt
def buscar(usuario_id):
    usuario = UsuarioService.buscar_usuario_por_id(usuario_id)
    if usuario:
        return jsonify(usuario)
    return jsonify({"erro": "Usuário não encontrado"}), 404

@bp.route('/usuarios/<usuario_id>/perfil', methods=['PUT'])
@autenticar_jwt
@verificar_admin
def editar_perfil_usuario(usuario_id):
    dados = request.get_json()
    perfil = dados.get('perfil')
    print(perfil)

    if not perfil:
        return jsonify({'erro': 'Novo perfil não fornecido'}), 400

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
from xml.dom import ValidationErr
from app.firebase import bucket
from flask import Blueprint, request, jsonify
from app.services import UsuarioService
from app.schemas.UsuarioSchema import UsuarioSchema
from app.middlewares.autenticar_jwt import autenticar_jwt
from app.middlewares.verificar_admin import verificar_admin

schema = UsuarioSchema()

bp = Blueprint('usuarios', __name__)

@bp.route('/usuarios', methods=['POST'])
@autenticar_jwt
def criar():
    try:
        dados = schema.load(request.json)
    except ValidationErr as err:
        return jsonify(err.messages), 400
    
    usuario = UsuarioService.criar_usuario(dados)
    resultado = schema.dump(usuario) 
    return jsonify(resultado), 201

@bp.route('/usuarios', methods=['GET'])
@autenticar_jwt
def listar():
    return jsonify(UsuarioService.listar_usuarios())

@bp.route('/usuarios/<usuario_id>', methods=['GET'])
@autenticar_jwt
def buscar(usuario_id):
    usuario = UsuarioService.buscar_usuario_por_id(usuario_id)
    if usuario:
        return jsonify(usuario)
    return jsonify({"erro": "Usuário não encontrado"}), 404

@bp.route('/usuario/<usuario_id>/perfil', methods=['PUT'])
@autenticar_jwt
@verificar_admin
def editar_perfil_usuario(usuario_id):
    dados = request.get_json()
    novo_perfil_id = dados.get('perfil_id')

    if not novo_perfil_id:
        return jsonify({'erro': 'ID do novo perfil não fornecido'}), 400

    try:
        erro = UsuarioService.atualizar_usuario(usuario_id, novo_perfil_id)
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
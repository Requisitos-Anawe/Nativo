from xml.dom import ValidationErr
from app.firebase import bucket
from flask import Blueprint, request, jsonify
from app.models import UsuarioModel
from app.schemas.UsuarioSchema import UsuarioSchema

schema = UsuarioSchema()

bp = Blueprint('usuarios', __name__)

@bp.route('/usuarios', methods=['POST'])
def criar():
    try:
        dados = schema.load(request.json)
    except ValidationErr as err:
        return jsonify(err.messages), 400
    
    usuario = UsuarioModel.criar_usuario(dados)
    resultado = schema.dump(usuario) 
    return jsonify(resultado), 201

@bp.route('/usuarios', methods=['GET'])
def listar():
    return jsonify(UsuarioModel.listar_usuarios())

@bp.route('/usuarios/<usuario_id>', methods=['GET'])
def buscar(usuario_id):
    usuario = UsuarioModel.buscar_usuario_por_id(usuario_id)
    if usuario:
        return jsonify(usuario)
    return jsonify({"erro": "Usuário não encontrado"}), 404

@bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'Nenhum arquivo enviado'}), 400
    
    file = request.files['file']
    blob = bucket.blob(file.filename)
    blob.upload_from_file(file)
    
    blob.make_public()
    url = blob.public_url
    
    return jsonify({'message': 'Arquivo enviado com sucesso', 'url': url})
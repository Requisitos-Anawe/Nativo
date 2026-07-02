from flask import Blueprint, jsonify, g
from app.services import InsigniaService
from app.middlewares.autenticar_jwt import autenticar_jwt

bp = Blueprint('insignias', __name__)

@bp.route('/usuarios/<usuario_id>/insignias', methods=['GET'])
@autenticar_jwt
def obter_insignias(usuario_id):
    """
    Obter insígnias do usuário
    ---
    security:
      - Bearer: []
    tags:
      - Insígnias
    parameters:
      - name: usuario_id
        in: path
        type: string
        required: true
        description: ID do usuário
    responses:
      200:
        description: Retorna as insígnias do usuário e o total de atividades concluídas
    """
    try:
        resultado = InsigniaService.obter_insignias_usuario(usuario_id)
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"erro": f"Erro ao obter insígnias: {str(e)}"}), 500

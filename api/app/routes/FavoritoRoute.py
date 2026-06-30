from flask import Blueprint, g, jsonify, request

from app.middlewares.autenticar_jwt import autenticar_jwt
from app.services.FavoritoService import (
    alternar_favorito,
    listar_favoritos_usuario,
    remover_favorito,
    status_favorito,
)

bp = Blueprint('favoritos', __name__)


@bp.route('/traducao/<traducao_id>/favorito', methods=['POST'])
@autenticar_jwt
def alternar_favorito_traducao(traducao_id):
    """Alterna o estado de favorito de uma tradução para o usuário autenticado."""
    resultado, status = alternar_favorito(g.usuario_id, traducao_id)
    return jsonify(resultado), status


@bp.route('/traducao/<traducao_id>/favorito', methods=['GET'])
@autenticar_jwt
def consultar_status_favorito_traducao(traducao_id):
    """Consulta se a tradução está favoritada pelo usuário autenticado."""
    resultado, status = status_favorito(g.usuario_id, traducao_id)
    return jsonify(resultado), status


@bp.route('/traducao/<traducao_id>/favorito', methods=['DELETE'])
@autenticar_jwt
def remover_favorito_traducao(traducao_id):
    """Remove uma tradução dos favoritos do usuário autenticado."""
    resultado, status = remover_favorito(g.usuario_id, traducao_id)
    return jsonify(resultado), status


@bp.route('/usuarios/me/favoritos', methods=['GET'])
@autenticar_jwt
def listar_favoritos_usuario_logado():
    """Lista as traduções favoritas do usuário autenticado."""
    limit = request.args.get('limit', default=50, type=int)

    if limit < 1:
        return jsonify({'erro': 'O parâmetro limit deve ser maior que zero'}), 400

    if limit > 100:
        limit = 100

    resultado, status = listar_favoritos_usuario(g.usuario_id, limit=limit)
    return jsonify(resultado), status

from flask import Blueprint, jsonify, request, g

from app.middlewares.autenticar_jwt import autenticar_jwt
from app.services.HistoricoService import HistoricoService

bp = Blueprint("historico", __name__)


@bp.route("/usuarios/me/historico", methods=["POST"])
@autenticar_jwt
def registrar_historico_usuario_logado():
    usuario_id = g.get("usuario_id")

    dados = request.get_json(silent=True) or {}

    termo_pesquisado = dados.get("termo_pesquisado")
    traducao_resultado = dados.get("traducao_resultado")

    if not termo_pesquisado:
        return jsonify({"erro": "Campo termo_pesquisado é obrigatório"}), 400

    resultado, status = HistoricoService.registrar_consulta(
        usuario_id=usuario_id,
        termo_pesquisado=termo_pesquisado,
        traducao_resultado=traducao_resultado,
    )

    return jsonify(resultado), status


@bp.route("/usuarios/me/historico", methods=["GET"])
@autenticar_jwt
def listar_historico_usuario_logado():
    usuario_id = g.get("usuario_id")

    try:
        limit = int(request.args.get("limit", 10))
    except ValueError:
        return jsonify({"erro": "Parâmetro limit inválido"}), 400

    resultado, status = HistoricoService.listar_historico_usuario(
        usuario_id=usuario_id,
        limit=limit,
    )

    return jsonify(resultado), status


@bp.route("/usuarios/me/historico", methods=["DELETE"])
@autenticar_jwt
def deletar_historico_usuario_logado():
    usuario_id = g.get("usuario_id")

    resultado, status = HistoricoService.deletar_historico_usuario(usuario_id)

    return jsonify(resultado), status
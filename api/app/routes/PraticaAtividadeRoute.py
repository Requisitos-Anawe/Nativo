import logging

from flask import Blueprint, g, jsonify, request

from app.middlewares.autenticar_jwt import autenticar_jwt
from app.services.PraticaAtividadeService import (
    RegraNegocioError,
    buscar_atividade_para_pratica,
    buscar_resultado_atividade,
    listar_atividades_disponiveis,
    reiniciar_atividade,
    submeter_respostas,
)

bp = Blueprint("pratica_atividades", __name__)
logger = logging.getLogger(__name__)



def _erro_regra(err):
    resposta = {"erro": err.mensagem}

    if err.detalhes:
        resposta["detalhes"] = err.detalhes

    return jsonify(resposta), err.status_code


def _json_body():
    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        raise RegraNegocioError(
            "Corpo da requisição inválido",
            400,
            {"json": ["Envie um objeto JSON válido."]},
        )

    return dados

@bp.route("/pratica/atividades/<atividade_id>/reiniciar", methods=["POST"])
@autenticar_jwt
def rota_reiniciar_atividade(atividade_id):
    try:
        resultado = reiniciar_atividade(
            usuario_id=g.usuario_id,
            atividade_id=atividade_id,
        )
        return jsonify(resultado), 200

    except RegraNegocioError as err:
        return _erro_regra(err)

    except Exception:
        logger.exception(
            "erro_reiniciar_atividade usuario_id=%s atividade_id=%s",
            getattr(g, "usuario_id", None),
            atividade_id,
        )
        return jsonify({"erro": "Erro interno ao reiniciar atividade"}), 500
    
    
@bp.route("/pratica/atividades", methods=["GET"])
@autenticar_jwt
def rota_listar_atividades_pratica():
    try:
        resultado = listar_atividades_disponiveis(usuario_id=g.usuario_id)
        return jsonify(resultado), 200

    except RegraNegocioError as err:
        return _erro_regra(err)

    except Exception:
        logger.exception(
            "erro_listar_atividades_pratica usuario_id=%s",
            getattr(g, "usuario_id", None),
        )
        return jsonify({"erro": "Erro interno ao listar atividades"}), 500


@bp.route("/pratica/atividades/<atividade_id>", methods=["GET"])
@autenticar_jwt
def rota_buscar_atividade_pratica(atividade_id):
    try:
        resultado = buscar_atividade_para_pratica(
            usuario_id=g.usuario_id,
            atividade_id=atividade_id,
        )
        return jsonify(resultado), 200

    except RegraNegocioError as err:
        return _erro_regra(err)

    except Exception:
        logger.exception(
            "erro_buscar_atividade_pratica usuario_id=%s atividade_id=%s",
            getattr(g, "usuario_id", None),
            atividade_id,
        )
        return jsonify({"erro": "Erro interno ao carregar atividade"}), 500


@bp.route("/pratica/atividades/<atividade_id>/responder", methods=["POST"])
@autenticar_jwt
def rota_responder_atividade(atividade_id):
    try:
        resultado = submeter_respostas(
            usuario_id=g.usuario_id,
            atividade_id=atividade_id,
            payload=_json_body(),
        )
        return jsonify(resultado), 201

    except RegraNegocioError as err:
        return _erro_regra(err)

    except Exception:
        logger.exception(
            "erro_responder_atividade usuario_id=%s atividade_id=%s",
            getattr(g, "usuario_id", None),
            atividade_id,
        )
        return jsonify({"erro": "Erro interno ao submeter respostas"}), 500


@bp.route("/pratica/atividades/<atividade_id>/resultado", methods=["GET"])
@autenticar_jwt
def rota_resultado_atividade(atividade_id):
    try:
        resultado = buscar_resultado_atividade(
            usuario_id=g.usuario_id,
            atividade_id=atividade_id,
        )
        return jsonify(resultado), 200

    except RegraNegocioError as err:
        return _erro_regra(err)

    except Exception:
        logger.exception(
            "erro_resultado_atividade usuario_id=%s atividade_id=%s",
            getattr(g, "usuario_id", None),
            atividade_id,
        )
        return jsonify({"erro": "Erro interno ao buscar resultado"}), 500
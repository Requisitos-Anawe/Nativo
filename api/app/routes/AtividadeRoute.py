import logging

from flask import Blueprint, g, jsonify, request
from marshmallow import ValidationError

from app.middlewares.autenticar_jwt import autenticar_jwt
from app.middlewares.verificar_professor import verificar_professor
from app.services.AtividadeService import (
    RegraNegocioError,
    buscar_atividade,
    criar_atividade,
    editar_atividade_patch,
    editar_atividade_put,
    excluir_atividade,
    listar_atividades,
)

bp = Blueprint("atividades", __name__)
logger = logging.getLogger(__name__)

MAX_PAYLOAD_BYTES = 32 * 1024


def _json_body():
    """Valida JSON e bloqueia payload excessivo."""
    if request.content_length and request.content_length > MAX_PAYLOAD_BYTES:
        raise RegraNegocioError(
            "Payload muito grande",
            413,
            {"payload": [f"O corpo da requisição não pode ultrapassar {MAX_PAYLOAD_BYTES} bytes."]},
        )

    dados = request.get_json(silent=True)

    if not isinstance(dados, dict):
        raise RegraNegocioError(
            "Corpo da requisição inválido",
            400,
            {"json": ["Envie um objeto JSON válido."]},
        )

    return dados


def _limit():
    """Valida paginação para evitar resposta pesada."""
    try:
        valor = int(request.args.get("limit", 20))
    except ValueError:
        raise RegraNegocioError(
            "Parâmetro limit inválido",
            400,
            {"limit": ["O parâmetro limit deve ser inteiro."]},
        )

    if valor < 1 or valor > 50:
        raise RegraNegocioError(
            "Parâmetro limit fora do intervalo permitido",
            400,
            {"limit": ["O parâmetro limit deve estar entre 1 e 50."]},
        )

    return valor


def _erro_regra(err):
    resposta = {"erro": err.mensagem}

    if err.detalhes:
        resposta["detalhes"] = err.detalhes

    return jsonify(resposta), err.status_code


def _erro_validacao(err):
    return jsonify({
        "erro": "Dados incompletos ou inválidos",
        "detalhes": err.messages,
    }), 400


@bp.route("/atividades", methods=["GET"])
@autenticar_jwt
@verificar_professor
def rota_listar():
    try:
        resultado = listar_atividades(
            professor_id=g.usuario_id,
            limit=_limit(),
            cursor=request.args.get("cursor"),
        )

        return jsonify(resultado), 200

    except RegraNegocioError as err:
        return _erro_regra(err)

    except Exception:
        logger.exception("erro_listar_atividades professor_id=%s", getattr(g, "usuario_id", None))
        return jsonify({"erro": "Erro interno ao listar atividades"}), 500


@bp.route("/atividades/<atividade_id>", methods=["GET"])
@autenticar_jwt
@verificar_professor
def rota_buscar(atividade_id):
    try:
        resultado = buscar_atividade(
            atividade_id=atividade_id,
            professor_id=g.usuario_id,
        )

        return jsonify(resultado), 200

    except RegraNegocioError as err:
        return _erro_regra(err)

    except Exception:
        logger.exception("erro_buscar_atividade atividade_id=%s", atividade_id)
        return jsonify({"erro": "Erro interno ao buscar atividade"}), 500


@bp.route("/atividades", methods=["POST"])
@autenticar_jwt
@verificar_professor
def rota_criar():
    try:
        resultado = criar_atividade(
            payload=_json_body(),
            professor_id=g.usuario_id,
        )

        return jsonify(resultado), 201

    except ValidationError as err:
        return _erro_validacao(err)

    except RegraNegocioError as err:
        return _erro_regra(err)

    except Exception:
        logger.exception("erro_criar_atividade professor_id=%s", getattr(g, "usuario_id", None))
        return jsonify({"erro": "Erro interno ao criar atividade"}), 500


@bp.route("/atividades/<atividade_id>", methods=["PUT"])
@autenticar_jwt
@verificar_professor
def rota_put(atividade_id):
    try:
        resultado = editar_atividade_put(
            atividade_id=atividade_id,
            payload=_json_body(),
            professor_id=g.usuario_id,
        )

        return jsonify(resultado), 200

    except ValidationError as err:
        return _erro_validacao(err)

    except RegraNegocioError as err:
        return _erro_regra(err)

    except Exception:
        logger.exception("erro_put_atividade atividade_id=%s", atividade_id)
        return jsonify({"erro": "Erro interno ao editar atividade"}), 500


@bp.route("/atividades/<atividade_id>", methods=["PATCH"])
@autenticar_jwt
@verificar_professor
def rota_patch(atividade_id):
    try:
        resultado = editar_atividade_patch(
            atividade_id=atividade_id,
            payload=_json_body(),
            professor_id=g.usuario_id,
        )

        return jsonify(resultado), 200

    except ValidationError as err:
        return _erro_validacao(err)

    except RegraNegocioError as err:
        return _erro_regra(err)

    except Exception:
        logger.exception("erro_patch_atividade atividade_id=%s", atividade_id)
        return jsonify({"erro": "Erro interno ao editar atividade"}), 500


@bp.route("/atividades/<atividade_id>", methods=["DELETE"])
@autenticar_jwt
@verificar_professor
def rota_delete(atividade_id):
    try:
        resultado = excluir_atividade(
            atividade_id=atividade_id,
            professor_id=g.usuario_id,
        )

        return jsonify(resultado), 200

    except RegraNegocioError as err:
        return _erro_regra(err)

    except Exception:
        logger.exception("erro_delete_atividade atividade_id=%s", atividade_id)
        return jsonify({"erro": "Erro interno ao excluir atividade"}), 500
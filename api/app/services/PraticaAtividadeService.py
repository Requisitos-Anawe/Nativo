from datetime import datetime

import pytz
from firebase_admin import firestore

from app.firebase import db


COLLECTION_ATIVIDADE = "atividade"
COLLECTION_RESULTADO = "atividade_resultado"


class RegraNegocioError(Exception):
    def __init__(self, mensagem, status_code=400, detalhes=None):
        super().__init__(mensagem)
        self.mensagem = mensagem
        self.status_code = status_code
        self.detalhes = detalhes


def _agora():
    return datetime.now(pytz.timezone("America/Sao_Paulo"))


def _usuario_ref(usuario_id):
    return db.collection("usuario").document(usuario_id)


def _atividade_ref(atividade_id):
    return db.collection(COLLECTION_ATIVIDADE).document(atividade_id)


def _resultado_id(usuario_id, atividade_id):
    return f"{usuario_id}_{atividade_id}"


def _resultado_ref(usuario_id, atividade_id):
    return db.collection(COLLECTION_RESULTADO).document(
        _resultado_id(usuario_id, atividade_id)
    )


def _serializar_data(valor):
    if isinstance(valor, datetime):
        return valor.isoformat()
    return valor


def _atividade_liberada(dados):
    return dados.get("liberada") is True


def _normalizar_questoes(questoes):
    if not isinstance(questoes, list):
        return []

    normalizadas = []

    for questao in questoes:
        if not isinstance(questao, dict):
            continue

        enunciado = questao.get("enunciado")
        alternativas = questao.get("alternativas")
        alternativa_correta = questao.get("alternativa_correta")

        if not isinstance(enunciado, str):
            continue

        if not isinstance(alternativas, list):
            continue

        alternativas_validas = [
            alternativa
            for alternativa in alternativas
            if isinstance(alternativa, str) and alternativa.strip()
        ]

        if len(alternativas_validas) < 2:
            continue

        if not isinstance(alternativa_correta, int):
            continue

        if alternativa_correta < 0 or alternativa_correta >= len(alternativas_validas):
            continue

        normalizadas.append(
            {
                "enunciado": enunciado.strip(),
                "alternativas": [alternativa.strip() for alternativa in alternativas_validas],
                "alternativa_correta": alternativa_correta,
            }
        )

    return normalizadas


def _sanitizar_atividade(atividade_id, dados, resultado=None):
    questoes = _normalizar_questoes(dados.get("questoes", []))

    return {
        "id": atividade_id,
        "titulo": dados.get("titulo", ""),
        "descricao": dados.get("descricao"),
        "total_questoes": len(questoes),
        "concluida": resultado is not None,
        "resultado": resultado,
        "data_criacao": _serializar_data(dados.get("data_criacao")),
        "data_atualizacao": _serializar_data(dados.get("data_atualizacao")),
    }


def _sanitizar_exercicio(atividade_id, dados):
    questoes = _normalizar_questoes(dados.get("questoes", []))

    return {
        "id": atividade_id,
        "titulo": dados.get("titulo", ""),
        "descricao": dados.get("descricao"),
        "questoes": [
            {
                "enunciado": questao["enunciado"],
                "alternativas": questao["alternativas"],
            }
            for questao in questoes
        ],
        "total_questoes": len(questoes),
    }


def _serializar_resultado(resultado_id, dados):
    return {
        "id": resultado_id,
        "atividade_id": dados.get("atividade_id"),
        "atividade_titulo": dados.get("atividade_titulo"),
        "acertos": dados.get("acertos", 0),
        "erros": dados.get("erros", 0),
        "total": dados.get("total", 0),
        "percentual": dados.get("percentual", 0),
        "respostas": dados.get("respostas", []),
        "concluida": dados.get("concluida", False),
        "data_criacao": _serializar_data(dados.get("data_criacao")),
        "data_atualizacao": _serializar_data(dados.get("data_atualizacao")),
    }


def listar_atividades_disponiveis(usuario_id, limit=50):
    query = (
        db.collection(COLLECTION_ATIVIDADE)
        .order_by("data_criacao", direction=firestore.Query.DESCENDING)
        .limit(limit)
    )

    atividades = []

    for doc in query.stream():
        dados = doc.to_dict() or {}

        if not _atividade_liberada(dados):
            continue

        questoes = _normalizar_questoes(dados.get("questoes", []))

        if len(questoes) == 0:
            continue

        resultado_doc = _resultado_ref(usuario_id, doc.id).get()
        resultado = None

        if resultado_doc.exists:
            resultado = _serializar_resultado(
                resultado_doc.id,
                resultado_doc.to_dict() or {},
            )

        atividades.append(_sanitizar_atividade(doc.id, dados, resultado))

    return {
        "mensagem": "Atividades disponíveis listadas com sucesso",
        "dados": atividades,
    }


def reiniciar_atividade(usuario_id, atividade_id):
    atividade_doc = _atividade_ref(atividade_id).get()

    if not atividade_doc.exists:
        raise RegraNegocioError("Atividade não encontrada", 404)

    atividade = atividade_doc.to_dict() or {}

    if not _atividade_liberada(atividade):
        raise RegraNegocioError("Atividade não está liberada", 403)

    exercicio = _sanitizar_exercicio(atividade_id, atividade)

    if exercicio["total_questoes"] == 0:
        raise RegraNegocioError(
            "Atividade sem questões válidas",
            400,
            {"questoes": ["A atividade não possui questões válidas para prática."]},
        )

    resultado_ref = _resultado_ref(usuario_id, atividade_id)
    resultado_ref.delete()

    return {
        "mensagem": "Atividade reiniciada com sucesso",
        "status": "pendente",
        "dados": exercicio,
    }


def buscar_atividade_para_pratica(usuario_id, atividade_id):
    atividade_doc = _atividade_ref(atividade_id).get()

    if not atividade_doc.exists:
        raise RegraNegocioError("Atividade não encontrada", 404)

    atividade = atividade_doc.to_dict() or {}

    if not _atividade_liberada(atividade):
        raise RegraNegocioError("Atividade não está liberada", 403)

    resultado_doc = _resultado_ref(usuario_id, atividade_id).get()

    if resultado_doc.exists:
        return {
            "mensagem": "Atividade já concluída",
            "status": "concluida",
            "dados": _serializar_resultado(
                resultado_doc.id,
                resultado_doc.to_dict() or {},
            ),
        }

    exercicio = _sanitizar_exercicio(atividade_id, atividade)

    if exercicio["total_questoes"] == 0:
        raise RegraNegocioError(
            "Atividade sem questões válidas",
            400,
            {"questoes": ["A atividade não possui questões válidas para prática."]},
        )

    return {
        "mensagem": "Atividade carregada com sucesso",
        "status": "pendente",
        "dados": exercicio,
    }


def buscar_resultado_atividade(usuario_id, atividade_id):
    resultado_doc = _resultado_ref(usuario_id, atividade_id).get()

    if not resultado_doc.exists:
        raise RegraNegocioError("Resultado não encontrado", 404)

    return {
        "mensagem": "Resultado encontrado com sucesso",
        "dados": _serializar_resultado(
            resultado_doc.id,
            resultado_doc.to_dict() or {},
        ),
    }


def submeter_respostas(usuario_id, atividade_id, payload):
    respostas = payload.get("respostas")

    if not isinstance(respostas, list):
        raise RegraNegocioError(
            "Payload inválido",
            400,
            {"respostas": ["Envie uma lista de respostas."]},
        )

    atividade_doc = _atividade_ref(atividade_id).get()

    if not atividade_doc.exists:
        raise RegraNegocioError("Atividade não encontrada", 404)

    atividade = atividade_doc.to_dict() or {}

    if not _atividade_liberada(atividade):
        raise RegraNegocioError("Atividade não está liberada", 403)

    questoes = _normalizar_questoes(atividade.get("questoes", []))

    if not questoes:
        raise RegraNegocioError("Atividade sem questões válidas", 400)

    if len(respostas) != len(questoes):
        raise RegraNegocioError(
            "Quantidade de respostas inválida",
            400,
            {
                "respostas": [
                    f"Esperado {len(questoes)} respostas, recebido {len(respostas)}."
                ]
            },
        )

    acertos = 0
    respostas_processadas = []

    for indice, resposta in enumerate(respostas):
        if not isinstance(resposta, int):
            raise RegraNegocioError(
                "Resposta inválida",
                400,
                {"respostas": [f"A resposta da questão {indice + 1} deve ser inteiro."]},
            )

        questao = questoes[indice]
        correta = questao["alternativa_correta"]
        acertou = resposta == correta

        if acertou:
            acertos += 1

        respostas_processadas.append(
            {
                "questao_index": indice,
                "resposta": resposta,
                "correta": correta,
                "acertou": acertou,
            }
        )

    total = len(questoes)
    erros = total - acertos
    percentual = round((acertos / total) * 100)

    agora = _agora()

    resultado = {
        "usuario": _usuario_ref(usuario_id),
        "usuario_id": usuario_id,
        "atividade": _atividade_ref(atividade_id),
        "atividade_id": atividade_id,
        "atividade_titulo": atividade.get("titulo", ""),
        "respostas": respostas_processadas,
        "acertos": acertos,
        "erros": erros,
        "total": total,
        "percentual": percentual,
        "concluida": True,
        "data_criacao": agora,
        "data_atualizacao": agora,
    }

    resultado_ref = _resultado_ref(usuario_id, atividade_id)
    resultado_ref.set(resultado)

    return {
        "mensagem": "Respostas submetidas com sucesso",
        "dados": _serializar_resultado(resultado_ref.id, resultado),
    }
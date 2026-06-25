import logging
from datetime import datetime

import pytz
from firebase_admin import firestore
from google.api_core.exceptions import FailedPrecondition

from app.firebase import db
from app.schemas.AtividadeSchema import (
    AtividadePatchSchema,
    AtividadeSchema,
    CAMPOS_PROTEGIDOS,
)

COLLECTION = "atividade"

# PENDÊNCIA DE PR:
# Definir este valor depois de teste de carga com usuários simultâneos,
# latência alvo de 300ms e conectividade de 100kbps.
# Quando definido, o backend passará a persistir max_alunos automaticamente.
MAX_ALUNOS_SIMULTANEOS = None

logger = logging.getLogger(__name__)
audit_logger = logging.getLogger("audit.atividades")

schema_put = AtividadeSchema()
schema_patch = AtividadePatchSchema()


class RegraNegocioError(Exception):
    """Erro esperado de regra de negócio, convertido em HTTP pela rota."""

    def __init__(self, mensagem, status_code=400, detalhes=None):
        super().__init__(mensagem)
        self.mensagem = mensagem
        self.status_code = status_code
        self.detalhes = detalhes


def _agora():
    return datetime.now(pytz.timezone("America/Sao_Paulo"))


def _usuario_ref(usuario_id):
    return db.collection("usuario").document(usuario_id)


def _serializar(valor):
    if isinstance(valor, datetime):
        return valor.isoformat()

    if isinstance(valor, firestore.DocumentReference):
        return valor.id

    if isinstance(valor, list):
        return [_serializar(item) for item in valor]

    if isinstance(valor, dict):
        return {chave: _serializar(item) for chave, item in valor.items()}

    return valor


def _resposta(atividade_id, dados):
    convertido = {chave: _serializar(valor) for chave, valor in dados.items()}
    convertido["id"] = atividade_id
    return convertido


def _bloquear_campos_protegidos(payload):
    enviados = sorted(CAMPOS_PROTEGIDOS.intersection(payload.keys()))

    if enviados:
        raise RegraNegocioError(
            "Payload contém campos controlados pelo backend",
            400,
            {campo: ["Este campo não pode ser enviado pelo cliente."] for campo in enviados},
        )


def _validar_put(payload):
    _bloquear_campos_protegidos(payload)
    return schema_put.load(payload)


def _validar_patch(payload):
    _bloquear_campos_protegidos(payload)

    if not payload:
        raise RegraNegocioError(
            "Nenhum campo enviado para atualização",
            400,
            {"atividade": ["Envie ao menos um campo para atualizar."]},
        )

    return schema_patch.load(payload)


def _aplicar_max_alunos_constante(dados):
    """
    max_alunos não é informado pelo professor.

    Enquanto o valor oficial estiver pendente, o campo não é persistido.
    Quando MAX_ALUNOS_SIMULTANEOS for definido pela equipe técnica, ele será salvo automaticamente.
    """
    dados.pop("max_alunos", None)

    if MAX_ALUNOS_SIMULTANEOS is not None:
        dados["max_alunos"] = MAX_ALUNOS_SIMULTANEOS

    return dados


def _validar_usuario_professor(usuario_id):
    usuario_ref = _usuario_ref(usuario_id)
    usuario_doc = usuario_ref.get()

    if not usuario_doc.exists:
        raise RegraNegocioError(
            "Professor associado não encontrado",
            404,
            {"professores_ids": [f"Usuário '{usuario_id}' não encontrado."]},
        )

    usuario = usuario_doc.to_dict() or {}
    perfil_valor = usuario.get("perfil")

    if isinstance(perfil_valor, firestore.DocumentReference):
        perfil_doc = perfil_valor.get()
        if not perfil_doc.exists:
            raise RegraNegocioError(
                "Perfil do usuário associado não encontrado",
                400,
                {"professores_ids": [f"Perfil do usuário '{usuario_id}' não encontrado."]},
            )
        descricao = (perfil_doc.to_dict() or {}).get("descricao", "").strip().lower()
    else:
        descricao = str(perfil_valor).strip().lower() if perfil_valor else ""

    if descricao != "professor":
        raise RegraNegocioError(
            "Somente usuários com perfil professor podem ser associados à atividade",
            400,
            {"professores_ids": [f"Usuário '{usuario_id}' não possui perfil professor."]},
        )

    return usuario_ref


def _deduplicar_refs(refs):
    unicos = []
    vistos = set()

    for ref in refs:
        if not isinstance(ref, firestore.DocumentReference):
            continue

        if ref.id in vistos:
            continue

        vistos.add(ref.id)
        unicos.append(ref)

    return unicos


def _montar_professores_refs(professor_id, professores_ids=None, refs_obrigatorias=None):
    """
    Monta a lista de professores associados.

    Regras:
    - o professor autenticado sempre entra;
    - professores_ids representa professores adicionais enviados pelo cliente;
    - refs_obrigatorias preserva criador/professor legado em updates;
    - todos precisam existir e possuir perfil professor.
    """
    ids = [professor_id]

    if professores_ids:
        ids.extend(professores_ids)

    refs = [_validar_usuario_professor(usuario_id) for usuario_id in ids]

    if refs_obrigatorias:
        refs.extend(refs_obrigatorias)

    return _deduplicar_refs(refs)


def _professores_atuais_ou_atual(dados_atuais, professor_id):
    professores = dados_atuais.get("professores_associados")

    if isinstance(professores, list):
        refs = [
            professor
            for professor in professores
            if isinstance(professor, firestore.DocumentReference)
        ]

        if refs:
            return _deduplicar_refs(refs)

    professor_legado = dados_atuais.get("professor_associado")

    if isinstance(professor_legado, firestore.DocumentReference):
        return [professor_legado]

    return [_usuario_ref(professor_id)]


def _criador_ou_legado(dados_atuais):
    criador = dados_atuais.get("usuario_criador")

    if isinstance(criador, firestore.DocumentReference):
        return criador

    professor_legado = dados_atuais.get("professor_associado")

    if isinstance(professor_legado, firestore.DocumentReference):
        return professor_legado

    return None


def _atividade_tem_professor(dados, professor_id):
    professores = dados.get("professores_associados")

    if isinstance(professores, list):
        for professor in professores:
            if isinstance(professor, firestore.DocumentReference) and professor.id == professor_id:
                return True

    professor_legado = dados.get("professor_associado")

    if isinstance(professor_legado, firestore.DocumentReference) and professor_legado.id == professor_id:
        return True

    return False


def _validar_acesso(snapshot, atividade_id, professor_id):
    if not snapshot.exists:
        raise RegraNegocioError("Atividade não encontrada", 404)

    dados = snapshot.to_dict() or {}

    if not _atividade_tem_professor(dados, professor_id):
        audit_logger.warning(
            "tentativa_idor_atividade professor_id=%s atividade_id=%s",
            professor_id,
            atividade_id,
        )
        raise RegraNegocioError(
            "Acesso negado: a atividade não está associada a este professor",
            403,
        )

    return dados


def listar_atividades(professor_id, limit=20, cursor=None):
    professor = _usuario_ref(professor_id)

    query = (
        db.collection(COLLECTION)
        .where("professores_associados", "array_contains", professor)
        .order_by("data_criacao", direction=firestore.Query.DESCENDING)
    )

    if cursor:
        cursor_ref = db.collection(COLLECTION).document(cursor)
        cursor_doc = cursor_ref.get()
        _validar_acesso(cursor_doc, cursor, professor_id)
        query = query.start_after(cursor_doc)

    try:
        docs = list(query.limit(limit + 1).stream())
    except FailedPrecondition as err:
        logger.exception("erro_indice_firestore_atividades: %s", err)
        raise RegraNegocioError(
            "Índice do Firestore ausente para listar atividades",
            500,
            {
                "firestore": [
                    "Crie índice composto: professores_associados ARRAY_CONTAINS + data_criacao DESC."
                ]
            },
        )

    pagina = docs[:limit]
    proximo_cursor = pagina[-1].id if len(docs) > limit else None

    return {
        "mensagem": "Atividades listadas com sucesso",
        "dados": [_resposta(doc.id, doc.to_dict() or {}) for doc in pagina],
        "paginacao": {
            "limit": limit,
            "proximo_cursor": proximo_cursor,
        },
    }


def buscar_atividade(atividade_id, professor_id):
    doc_ref = db.collection(COLLECTION).document(atividade_id)
    snapshot = doc_ref.get()
    dados = _validar_acesso(snapshot, atividade_id, professor_id)

    return {
        "mensagem": "Atividade encontrada com sucesso",
        "dados": _resposta(atividade_id, dados),
    }


def criar_atividade(payload, professor_id):
    dados = _validar_put(payload)
    professores_ids = dados.pop("professores_ids", None)
    dados = _aplicar_max_alunos_constante(dados)

    agora = _agora()
    doc_ref = db.collection(COLLECTION).document()
    professor_ref = _usuario_ref(professor_id)
    professores_refs = _montar_professores_refs(professor_id, professores_ids)

    dados_firestore = {
        **dados,
        "liberada": True,
        "professor_associado": professor_ref,
        "professores_associados": professores_refs,
        "usuario_criador": professor_ref,
        "data_criacao": agora,
        "data_atualizacao": agora,
    }

    doc_ref.set(dados_firestore)

    audit_logger.info(
        "atividade_criada professor_id=%s atividade_id=%s professores=%s questoes=%s",
        professor_id,
        doc_ref.id,
        [professor.id for professor in professores_refs],
        len(dados_firestore.get("questoes", [])),
    )

    return {
        "mensagem": "Atividade criada com sucesso",
        "dados": _resposta(doc_ref.id, dados_firestore),
    }


def editar_atividade_put(atividade_id, payload, professor_id):
    dados_validados = _validar_put(payload)
    professores_ids = dados_validados.pop("professores_ids", None)
    dados_validados = _aplicar_max_alunos_constante(dados_validados)

    doc_ref = db.collection(COLLECTION).document(atividade_id)
    transaction = db.transaction()

    @firestore.transactional
    def transacao(transaction):
        snapshot = doc_ref.get(transaction=transaction)
        dados_atuais = _validar_acesso(snapshot, atividade_id, professor_id)

        agora = _agora()
        criador_ref = _criador_ou_legado(dados_atuais)

        if professores_ids is None:
            professores_refs = _professores_atuais_ou_atual(dados_atuais, professor_id)
        else:
            obrigatorias = [criador_ref] if criador_ref else None
            professores_refs = _montar_professores_refs(
                professor_id,
                professores_ids,
                refs_obrigatorias=obrigatorias,
            )

        dados_novos = {
            **dados_validados,
            "professor_associado": criador_ref or _usuario_ref(professor_id),
            "professores_associados": professores_refs,
            "usuario_criador": criador_ref or _usuario_ref(professor_id),
            "data_criacao": dados_atuais.get("data_criacao") or agora,
            "data_atualizacao": agora,
        }

        transaction.set(doc_ref, dados_novos, merge=False)
        return dados_novos

    dados_resultado = transacao(transaction)

    audit_logger.info(
        "atividade_substituida_put professor_id=%s atividade_id=%s",
        professor_id,
        atividade_id,
    )

    return {
        "mensagem": "Atividade atualizada com sucesso",
        "dados": _resposta(atividade_id, dados_resultado),
    }


def editar_atividade_patch(atividade_id, payload, professor_id):
    dados_validados = _validar_patch(payload)
    professores_ids_enviados = "professores_ids" in dados_validados
    professores_ids = dados_validados.pop("professores_ids", None)
    dados_validados = _aplicar_max_alunos_constante(dados_validados)

    doc_ref = db.collection(COLLECTION).document(atividade_id)
    transaction = db.transaction()

    @firestore.transactional
    def transacao(transaction):
        snapshot = doc_ref.get(transaction=transaction)
        dados_atuais = _validar_acesso(snapshot, atividade_id, professor_id)

        dados_update = {
            **dados_validados,
            "data_atualizacao": _agora(),
        }

        if professores_ids_enviados:
            criador_ref = _criador_ou_legado(dados_atuais)
            obrigatorias = [criador_ref] if criador_ref else None
            dados_update["professores_associados"] = _montar_professores_refs(
                professor_id,
                professores_ids,
                refs_obrigatorias=obrigatorias,
            )

        transaction.update(doc_ref, dados_update)

        return {
            **dados_atuais,
            **dados_update,
        }

    dados_resultado = transacao(transaction)

    audit_logger.info(
        "atividade_atualizada_patch professor_id=%s atividade_id=%s campos=%s",
        professor_id,
        atividade_id,
        list(dados_validados.keys()) + (["professores_ids"] if professores_ids_enviados else []),
    )

    return {
        "mensagem": "Atividade atualizada com sucesso",
        "dados": _resposta(atividade_id, dados_resultado),
    }


def excluir_atividade(atividade_id, professor_id):
    doc_ref = db.collection(COLLECTION).document(atividade_id)
    transaction = db.transaction()

    @firestore.transactional
    def transacao(transaction):
        snapshot = doc_ref.get(transaction=transaction)
        _validar_acesso(snapshot, atividade_id, professor_id)
        transaction.delete(doc_ref)

    transacao(transaction)

    audit_logger.info(
        "atividade_excluida professor_id=%s atividade_id=%s",
        professor_id,
        atividade_id,
    )

    return {
        "mensagem": "Atividade excluída com sucesso",
        "dados": {
            "id": atividade_id,
        },
    }
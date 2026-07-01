import sys
import types
from datetime import datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest


APP_DIR = Path(__file__).resolve().parents[1] / "app"


def _fake_app_imports():
    app_pkg = types.ModuleType("app")
    app_pkg.__path__ = [str(APP_DIR)]
    sys.modules.setdefault("app", app_pkg)

    services_pkg = types.ModuleType("app.services")
    services_pkg.__path__ = [str(APP_DIR / "services")]
    sys.modules.setdefault("app.services", services_pkg)

    fake_firebase = types.ModuleType("app.firebase")
    fake_firebase.db = MagicMock(name="db")
    fake_firebase.bucket = MagicMock(name="bucket")
    sys.modules.setdefault("app.firebase", fake_firebase)


_fake_app_imports()

from app.services import PraticaAtividadeService as service  # noqa: E402


class FakeRef:
    def __init__(self, id_, doc=None):
        self.id = id_
        self.doc = doc or FakeDoc(id_, False, {})
        self.set_payload = None
        self.deleted = False

    def get(self):
        return self.doc

    def set(self, payload):
        self.set_payload = payload
        self.doc = FakeDoc(self.id, True, payload)

    def delete(self):
        self.deleted = True
        self.doc = FakeDoc(self.id, False, {})


class FakeDoc:
    def __init__(self, id_, exists=True, dados=None):
        self.id = id_
        self.exists = exists
        self._dados = dados or {}

    def to_dict(self):
        return dict(self._dados)


class FakeQueryCollection:
    def __init__(self, docs=None, refs=None):
        self._stream_docs = docs or []
        self.refs = refs or {}
        self.last_limit = None

    def document(self, id_):
        return self.refs.setdefault(id_, FakeRef(id_))

    def order_by(self, *args, **kwargs):
        return self

    def limit(self, value):
        self.last_limit = value
        return self

    def stream(self):
        return list(self._stream_docs)


class FakeDB:
    def __init__(self, collections):
        self.collections = collections

    def collection(self, name):
        return self.collections[name]


def atividade_valida(**overrides):
    dados = {
        "titulo": "Atividade de prática",
        "descricao": "Descrição",
        "liberada": True,
        "questoes": [
            {
                "enunciado": "Como se diz água?",
                "alternativas": ["Ipa", "Tato"],
                "alternativa_correta": 0,
            },
            {
                "enunciado": "Como se diz sol?",
                "alternativas": ["Kaxi", "Ipa"],
                "alternativa_correta": 1,
            },
        ],
        "data_criacao": datetime(2026, 6, 27, 10, 0, 0),
    }
    dados.update(overrides)
    return dados


def configurar_firestore(monkeypatch):
    monkeypatch.setattr(service.firestore, "Query", SimpleNamespace(DESCENDING="DESC"), raising=False)


def test_normalizar_questoes_remove_invalidas_e_limpa_textos():
    questoes = [
        {
            "enunciado": " Pergunta válida ",
            "alternativas": [" A ", "B"],
            "alternativa_correta": 0,
        },
        {"enunciado": "Sem alternativas", "alternativas": ["A"], "alternativa_correta": 0},
        {"enunciado": "Índice inválido", "alternativas": ["A", "B"], "alternativa_correta": 3},
        "ignorado",
    ]

    resultado = service._normalizar_questoes(questoes)

    assert resultado == [
        {
            "enunciado": "Pergunta válida",
            "alternativas": ["A", "B"],
            "alternativa_correta": 0,
        }
    ]


def test_sanitizar_exercicio_nao_expoe_alternativa_correta():
    resultado = service._sanitizar_exercicio("atv-1", atividade_valida())

    assert resultado["id"] == "atv-1"
    assert resultado["total_questoes"] == 2
    assert "alternativa_correta" not in resultado["questoes"][0]
    assert resultado["questoes"][0] == {
        "enunciado": "Como se diz água?",
        "alternativas": ["Ipa", "Tato"],
    }


def test_listar_atividades_disponiveis_lista_apenas_liberadas_validas(monkeypatch):
    configurar_firestore(monkeypatch)
    atividade_doc = FakeDoc("atv-valida", True, atividade_valida())
    bloqueada_doc = FakeDoc("atv-bloqueada", True, atividade_valida(liberada=False))
    invalida_doc = FakeDoc("atv-invalida", True, atividade_valida(questoes=[]))

    resultado_ref = FakeRef("user-1_atv-valida", FakeDoc("user-1_atv-valida", False, {}))
    fake_db = FakeDB({
        "atividade": FakeQueryCollection(docs=[atividade_doc, bloqueada_doc, invalida_doc]),
        "atividade_resultado": FakeQueryCollection(refs={"user-1_atv-valida": resultado_ref}),
    })
    monkeypatch.setattr(service, "db", fake_db)

    resultado = service.listar_atividades_disponiveis("user-1", limit=50)

    assert resultado["mensagem"] == "Atividades disponíveis listadas com sucesso"
    assert len(resultado["dados"]) == 1
    assert resultado["dados"][0]["id"] == "atv-valida"
    assert resultado["dados"][0]["concluida"] is False
    assert resultado["dados"][0]["total_questoes"] == 2


def test_buscar_atividade_para_pratica_retorna_resultado_quando_ja_concluida(monkeypatch):
    atividade_ref = FakeRef("atv-1", FakeDoc("atv-1", True, atividade_valida()))
    resultado_ref = FakeRef(
        "user-1_atv-1",
        FakeDoc(
            "user-1_atv-1",
            True,
            {
                "atividade_id": "atv-1",
                "atividade_titulo": "Atividade de prática",
                "acertos": 2,
                "erros": 0,
                "total": 2,
                "percentual": 100,
                "respostas": [],
                "concluida": True,
            },
        ),
    )
    fake_db = FakeDB({
        "atividade": FakeQueryCollection(refs={"atv-1": atividade_ref}),
        "atividade_resultado": FakeQueryCollection(refs={"user-1_atv-1": resultado_ref}),
    })
    monkeypatch.setattr(service, "db", fake_db)

    resultado = service.buscar_atividade_para_pratica("user-1", "atv-1")

    assert resultado["status"] == "concluida"
    assert resultado["dados"]["percentual"] == 100
    assert resultado["dados"]["concluida"] is True


def test_submeter_respostas_calcula_resultado_e_persiste(monkeypatch):
    agora = datetime(2026, 6, 27, 10, 0, 0)
    monkeypatch.setattr(service, "_agora", lambda: agora)

    atividade_ref = FakeRef("atv-1", FakeDoc("atv-1", True, atividade_valida()))
    resultado_ref = FakeRef("user-1_atv-1")
    usuario_ref = FakeRef("user-1")
    fake_db = FakeDB({
        "atividade": FakeQueryCollection(refs={"atv-1": atividade_ref}),
        "atividade_resultado": FakeQueryCollection(refs={"user-1_atv-1": resultado_ref}),
        "usuario": FakeQueryCollection(refs={"user-1": usuario_ref}),
    })
    monkeypatch.setattr(service, "db", fake_db)

    resultado = service.submeter_respostas("user-1", "atv-1", {"respostas": [0, 0]})

    dados = resultado["dados"]
    assert resultado["mensagem"] == "Respostas submetidas com sucesso"
    assert dados["acertos"] == 1
    assert dados["erros"] == 1
    assert dados["total"] == 2
    assert dados["percentual"] == 50
    assert dados["respostas"] == [
        {"questao_index": 0, "resposta": 0, "correta": 0, "acertou": True},
        {"questao_index": 1, "resposta": 0, "correta": 1, "acertou": False},
    ]
    assert resultado_ref.set_payload["concluida"] is True
    assert resultado_ref.set_payload["usuario_id"] == "user-1"
    assert resultado_ref.set_payload["atividade_id"] == "atv-1"


def test_submeter_respostas_rejeita_quantidade_invalida(monkeypatch):
    atividade_ref = FakeRef("atv-1", FakeDoc("atv-1", True, atividade_valida()))
    fake_db = FakeDB({"atividade": FakeQueryCollection(refs={"atv-1": atividade_ref})})
    monkeypatch.setattr(service, "db", fake_db)

    with pytest.raises(service.RegraNegocioError) as exc:
        service.submeter_respostas("user-1", "atv-1", {"respostas": [0]})

    assert exc.value.status_code == 400
    assert exc.value.mensagem == "Quantidade de respostas inválida"
    assert "Esperado 2 respostas" in exc.value.detalhes["respostas"][0]


def test_submeter_respostas_rejeita_resposta_nao_inteira(monkeypatch):
    atividade_ref = FakeRef("atv-1", FakeDoc("atv-1", True, atividade_valida()))
    fake_db = FakeDB({"atividade": FakeQueryCollection(refs={"atv-1": atividade_ref})})
    monkeypatch.setattr(service, "db", fake_db)

    with pytest.raises(service.RegraNegocioError) as exc:
        service.submeter_respostas("user-1", "atv-1", {"respostas": [0, "B"]})

    assert exc.value.status_code == 400
    assert exc.value.mensagem == "Resposta inválida"


def test_reiniciar_atividade_apaga_resultado_e_retorna_exercicio(monkeypatch):
    atividade_ref = FakeRef("atv-1", FakeDoc("atv-1", True, atividade_valida()))
    resultado_ref = FakeRef("user-1_atv-1", FakeDoc("user-1_atv-1", True, {"concluida": True}))
    fake_db = FakeDB({
        "atividade": FakeQueryCollection(refs={"atv-1": atividade_ref}),
        "atividade_resultado": FakeQueryCollection(refs={"user-1_atv-1": resultado_ref}),
    })
    monkeypatch.setattr(service, "db", fake_db)

    resultado = service.reiniciar_atividade("user-1", "atv-1")

    assert resultado["mensagem"] == "Atividade reiniciada com sucesso"
    assert resultado["status"] == "pendente"
    assert resultado["dados"]["total_questoes"] == 2
    assert resultado_ref.deleted is True

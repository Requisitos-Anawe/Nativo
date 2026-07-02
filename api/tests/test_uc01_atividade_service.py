import sys
import types
from datetime import datetime
from pathlib import Path
from unittest.mock import MagicMock

import pytest


APP_DIR = Path(__file__).resolve().parents[1] / "app"


def _fake_app_imports():
    app_pkg = types.ModuleType("app")
    app_pkg.__path__ = [str(APP_DIR)]
    sys.modules.setdefault("app", app_pkg)

    for package in ["app.schemas", "app.services"]:
        mod = types.ModuleType(package)
        mod.__path__ = [str(APP_DIR / package.split(".")[-1])]
        sys.modules.setdefault(package, mod)

    fake_firebase = types.ModuleType("app.firebase")
    fake_firebase.db = MagicMock(name="db")
    fake_firebase.bucket = MagicMock(name="bucket")
    sys.modules.setdefault("app.firebase", fake_firebase)


_fake_app_imports()

from app.services import AtividadeService as service  # noqa: E402


class FakeRef:
    def __init__(self, id_):
        self.id = id_
        self.set_payload = None
        self.deleted = False
        self.snapshot = None

    def set(self, payload):
        self.set_payload = payload

    def get(self, transaction=None):
        return self.snapshot or FakeDoc(self.id, False, {})

    def delete(self):
        self.deleted = True


class FakeDoc:
    def __init__(self, id_, exists=True, dados=None):
        self.id = id_
        self.exists = exists
        self._dados = dados or {}

    def to_dict(self):
        return dict(self._dados)


class FakeCollection:
    def __init__(self, name, docs=None, new_ref=None):
        self.name = name
        self.docs = docs or {}
        self.new_ref = new_ref or FakeRef(f"new-{name}")

    def document(self, id_=None):
        if id_ is None:
            return self.new_ref
        return self.docs.setdefault(id_, FakeRef(id_))


class FakeTransaction:
    def __init__(self):
        self.set_calls = []
        self.update_calls = []
        self.delete_calls = []

    def set(self, ref, payload, merge=False):
        self.set_calls.append((ref, payload, merge))

    def update(self, ref, payload):
        self.update_calls.append((ref, payload))

    def delete(self, ref):
        self.delete_calls.append(ref)
        ref.deleted = True


class FakeDB:
    def __init__(self, collections):
        self.collections = collections
        self.last_transaction = FakeTransaction()

    def collection(self, name):
        return self.collections[name]

    def transaction(self):
        return self.last_transaction


def configurar_document_reference(monkeypatch):
    monkeypatch.setattr(service.firestore, "DocumentReference", FakeRef, raising=False)


def test_bloquear_campos_protegidos_rejeita_campos_controlados_pelo_backend():
    with pytest.raises(service.RegraNegocioError) as exc:
        service._bloquear_campos_protegidos({"titulo": "X", "data_criacao": "indevido"})

    assert exc.value.status_code == 400
    assert exc.value.mensagem == "Payload contém campos controlados pelo backend"
    assert "data_criacao" in exc.value.detalhes


def test_aplicar_max_alunos_remove_valor_enviado_pelo_cliente(monkeypatch):
    monkeypatch.setattr(service, "MAX_ALUNOS_SIMULTANEOS", None)

    dados = service._aplicar_max_alunos_constante({"titulo": "A", "max_alunos": 99})

    assert dados == {"titulo": "A"}


def test_aplicar_max_alunos_define_constante_quando_configurada(monkeypatch):
    monkeypatch.setattr(service, "MAX_ALUNOS_SIMULTANEOS", 30)

    dados = service._aplicar_max_alunos_constante({"titulo": "A", "max_alunos": 99})

    assert dados["max_alunos"] == 30


def test_deduplicar_refs_mantem_primeira_ocorrencia(monkeypatch):
    configurar_document_reference(monkeypatch)
    prof_1_a = FakeRef("prof-1")
    prof_1_b = FakeRef("prof-1")
    prof_2 = FakeRef("prof-2")

    resultado = service._deduplicar_refs([prof_1_a, prof_1_b, "ignorado", prof_2])

    assert resultado == [prof_1_a, prof_2]


def test_validar_acesso_nega_atividade_nao_associada(monkeypatch):
    configurar_document_reference(monkeypatch)
    snapshot = FakeDoc("atv-1", True, {"professores_associados": [FakeRef("outro-prof")]})

    with pytest.raises(service.RegraNegocioError) as exc:
        service._validar_acesso(snapshot, "atv-1", "prof-1")

    assert exc.value.status_code == 403
    assert "Acesso negado" in exc.value.mensagem


def test_validar_acesso_aceita_professor_associado(monkeypatch):
    configurar_document_reference(monkeypatch)
    dados = {"professores_associados": [FakeRef("prof-1")]}
    snapshot = FakeDoc("atv-1", True, dados)

    assert service._validar_acesso(snapshot, "atv-1", "prof-1") == dados


def test_criar_atividade_persiste_campos_controlados_pelo_backend(monkeypatch):
    configurar_document_reference(monkeypatch)
    agora = datetime(2026, 6, 27, 10, 0, 0)
    atividade_ref = FakeRef("atividade-1")
    fake_db = FakeDB({
        "atividade": FakeCollection("atividade", new_ref=atividade_ref),
        "usuario": FakeCollection("usuario"),
    })

    monkeypatch.setattr(service, "db", fake_db)
    monkeypatch.setattr(service, "_agora", lambda: agora)
    monkeypatch.setattr(
        service,
        "_validar_put",
        lambda payload: {
            "titulo": "Atividade teste",
            "descricao": "Descrição",
            "professores_ids": ["prof-2"],
            "questoes": [
                {
                    "enunciado": "Pergunta",
                    "alternativas": ["A", "B"],
                    "alternativa_correta": 1,
                }
            ],
        },
    )
    professores_refs = [FakeRef("prof-1"), FakeRef("prof-2")]
    monkeypatch.setattr(service, "_montar_professores_refs", lambda professor_id, professores_ids=None, refs_obrigatorias=None: professores_refs)

    resultado = service.criar_atividade({"payload": "ignorado"}, professor_id="prof-1")

    assert resultado["mensagem"] == "Atividade criada com sucesso"
    assert resultado["dados"]["id"] == "atividade-1"
    assert atividade_ref.set_payload["liberada"] is True
    assert atividade_ref.set_payload["usuario_criador"].id == "prof-1"
    assert atividade_ref.set_payload["professor_associado"].id == "prof-1"
    assert [ref.id for ref in atividade_ref.set_payload["professores_associados"]] == ["prof-1", "prof-2"]
    assert atividade_ref.set_payload["data_criacao"] == agora
    assert atividade_ref.set_payload["data_atualizacao"] == agora


def test_editar_atividade_patch_atualiza_campos_permitidos(monkeypatch):
    configurar_document_reference(monkeypatch)
    agora = datetime(2026, 6, 27, 11, 0, 0)
    atividade_ref = FakeRef("atv-1")
    atividade_ref.snapshot = FakeDoc(
        "atv-1",
        True,
        {
            "titulo": "Título antigo",
            "descricao": "Descrição antiga",
            "professores_associados": [FakeRef("prof-1")],
        },
    )
    fake_db = FakeDB({"atividade": FakeCollection("atividade", docs={"atv-1": atividade_ref})})

    monkeypatch.setattr(service, "db", fake_db)
    monkeypatch.setattr(service, "_agora", lambda: agora)
    monkeypatch.setattr(service.firestore, "transactional", lambda func: func, raising=False)
    monkeypatch.setattr(service, "_validar_patch", lambda payload: {"titulo": "Título novo"})

    resultado = service.editar_atividade_patch("atv-1", {"titulo": "Título novo"}, "prof-1")

    assert resultado["mensagem"] == "Atividade atualizada com sucesso"
    assert resultado["dados"]["titulo"] == "Título novo"
    assert fake_db.last_transaction.update_calls[0][0] is atividade_ref
    assert fake_db.last_transaction.update_calls[0][1]["titulo"] == "Título novo"
    assert fake_db.last_transaction.update_calls[0][1]["data_atualizacao"] == agora


def test_excluir_atividade_remove_documento_quando_professor_tem_acesso(monkeypatch):
    configurar_document_reference(monkeypatch)
    atividade_ref = FakeRef("atv-1")
    atividade_ref.snapshot = FakeDoc(
        "atv-1",
        True,
        {"professores_associados": [FakeRef("prof-1")]},
    )
    fake_db = FakeDB({"atividade": FakeCollection("atividade", docs={"atv-1": atividade_ref})})

    monkeypatch.setattr(service, "db", fake_db)
    monkeypatch.setattr(service.firestore, "transactional", lambda func: func, raising=False)

    resultado = service.excluir_atividade("atv-1", "prof-1")

    assert resultado == {
        "mensagem": "Atividade excluída com sucesso",
        "dados": {"id": "atv-1"},
    }
    assert fake_db.last_transaction.delete_calls == [atividade_ref]
    assert atividade_ref.deleted is True

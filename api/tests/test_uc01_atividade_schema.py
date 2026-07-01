import sys
import types
from pathlib import Path
from unittest.mock import MagicMock

import pytest
from marshmallow import ValidationError


APP_DIR = Path(__file__).resolve().parents[1] / "app"


def _fake_app_imports():
    app_pkg = types.ModuleType("app")
    app_pkg.__path__ = [str(APP_DIR)]
    sys.modules.setdefault("app", app_pkg)

    schemas_pkg = types.ModuleType("app.schemas")
    schemas_pkg.__path__ = [str(APP_DIR / "schemas")]
    sys.modules.setdefault("app.schemas", schemas_pkg)

    fake_firebase = types.ModuleType("app.firebase")
    fake_firebase.db = MagicMock(name="db")
    fake_firebase.bucket = MagicMock(name="bucket")
    sys.modules.setdefault("app.firebase", fake_firebase)


_fake_app_imports()

from app.schemas.AtividadeSchema import AtividadePatchSchema, AtividadeSchema  # noqa: E402


def atividade_valida(**overrides):
    payload = {
        "titulo": "  Atividade de vocabulário  ",
        "descricao": "  Prática inicial  ",
        "professores_ids": [" prof-2 "],
        "questoes": [
            {
                "enunciado": "  Como se diz água?  ",
                "alternativas": ["  Ipa  ", "Tato"],
                "alternativa_correta": 0,
            }
        ],
    }
    payload.update(overrides)
    return payload


def test_atividade_schema_normaliza_strings_e_professores_ids():
    resultado = AtividadeSchema().load(atividade_valida())

    assert resultado["titulo"] == "Atividade de vocabulário"
    assert resultado["descricao"] == "Prática inicial"
    assert resultado["professores_ids"] == ["prof-2"]
    assert resultado["questoes"][0]["enunciado"] == "Como se diz água?"
    assert resultado["questoes"][0]["alternativas"] == ["Ipa", "Tato"]


def test_atividade_schema_converte_descricao_vazia_para_none():
    resultado = AtividadeSchema().load(atividade_valida(descricao="   "))

    assert resultado["descricao"] is None


def test_atividade_schema_rejeita_alternativas_duplicadas():
    payload = atividade_valida(
        questoes=[
            {
                "enunciado": "Escolha a tradução correta",
                "alternativas": ["Ipa", " ipa "],
                "alternativa_correta": 0,
            }
        ]
    )

    with pytest.raises(ValidationError) as exc:
        AtividadeSchema().load(payload)

    assert "alternativas" in exc.value.messages["questoes"][0]


def test_atividade_schema_rejeita_alternativa_correta_inexistente():
    payload = atividade_valida(
        questoes=[
            {
                "enunciado": "Escolha a tradução correta",
                "alternativas": ["Ipa", "Tato"],
                "alternativa_correta": 3,
            }
        ]
    )

    with pytest.raises(ValidationError) as exc:
        AtividadeSchema().load(payload)

    assert "alternativa_correta" in exc.value.messages["questoes"][0]


def test_atividade_schema_rejeita_professores_ids_duplicados():
    payload = atividade_valida(professores_ids=["prof-2", " prof-2 "])

    with pytest.raises(ValidationError) as exc:
        AtividadeSchema().load(payload)

    assert "professores_ids" in exc.value.messages


def test_atividade_patch_schema_permite_atualizacao_parcial():
    resultado = AtividadePatchSchema().load({"titulo": "  Novo título  "})

    assert resultado == {"titulo": "Novo título"}


def test_atividade_patch_schema_rejeita_payload_desconhecido():
    with pytest.raises(ValidationError) as exc:
        AtividadePatchSchema().load({"campo_inexistente": "valor"})

    assert "campo_inexistente" in exc.value.messages

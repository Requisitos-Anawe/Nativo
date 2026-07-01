from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

from app.services import FavoritoService as service


class FakeDoc:
    def __init__(self, doc_id, data=None, exists=True):
        self.id = doc_id
        self._data = data or {}
        self.exists = exists

    def to_dict(self):
        return dict(self._data)


def _db_com_traducao_e_favorito(traducao_doc, favorito_doc):
    traducao_ref = MagicMock()
    traducao_ref.get.return_value = traducao_doc

    traducao_collection = MagicMock()
    traducao_collection.document.return_value = traducao_ref

    favorito_ref = MagicMock()
    favorito_ref.get.return_value = favorito_doc

    favorito_collection = MagicMock()
    favorito_collection.document.return_value = favorito_ref

    db = MagicMock()
    db.collection.side_effect = lambda name: {
        service.TRADUCAO_COLLECTION: traducao_collection,
        service.COLLECTION: favorito_collection,
    }[name]

    return db, favorito_ref


def test_alternar_favorito_cria_quando_traducao_existe_e_nao_estava_favoritada(monkeypatch):
    db, favorito_ref = _db_com_traducao_e_favorito(
        traducao_doc=FakeDoc("trad1", {"termo": "casa"}, exists=True),
        favorito_doc=FakeDoc("user1__trad1", exists=False),
    )
    monkeypatch.setattr(service, "db", db)

    resposta, status = service.alternar_favorito("user1", "trad1")

    assert status == 201
    assert resposta["favoritado"] is True
    assert resposta["id"] == "user1__trad1"
    favorito_ref.set.assert_called_once()
    favorito_ref.delete.assert_not_called()


def test_alternar_favorito_remove_quando_ja_estava_favoritada(monkeypatch):
    db, favorito_ref = _db_com_traducao_e_favorito(
        traducao_doc=FakeDoc("trad1", {"termo": "casa"}, exists=True),
        favorito_doc=FakeDoc("user1__trad1", {"usuario_id": "user1"}, exists=True),
    )
    monkeypatch.setattr(service, "db", db)

    resposta, status = service.alternar_favorito("user1", "trad1")

    assert status == 200
    assert resposta["favoritado"] is False
    assert resposta["traducao_id"] == "trad1"
    favorito_ref.delete.assert_called_once()
    favorito_ref.set.assert_not_called()


def test_alternar_favorito_retorna_404_quando_traducao_nao_existe(monkeypatch):
    db, favorito_ref = _db_com_traducao_e_favorito(
        traducao_doc=FakeDoc("trad1", exists=False),
        favorito_doc=FakeDoc("user1__trad1", exists=False),
    )
    monkeypatch.setattr(service, "db", db)

    resposta, status = service.alternar_favorito("user1", "trad1")

    assert status == 404
    assert resposta == {"erro": "Tradução não encontrada"}
    favorito_ref.set.assert_not_called()
    favorito_ref.delete.assert_not_called()


def test_remover_favorito_deleta_quando_existe(monkeypatch):
    favorito_ref = MagicMock()
    favorito_ref.get.return_value = FakeDoc("user1__trad1", exists=True)

    favorito_collection = MagicMock()
    favorito_collection.document.return_value = favorito_ref


    db = MagicMock()
    db.collection.return_value = favorito_collection
    monkeypatch.setattr(service, "db", db)

    resposta, status = service.remover_favorito("user1", "trad1")

    assert status == 200
    assert resposta["favoritado"] is False
    favorito_ref.delete.assert_called_once()


def test_status_favorito_indica_true_quando_documento_existe(monkeypatch):
    db, _ = _db_com_traducao_e_favorito(
        traducao_doc=FakeDoc("trad1", {"termo": "casa"}, exists=True),
        favorito_doc=FakeDoc("user1__trad1", exists=True),
    )
    monkeypatch.setattr(service, "db", db)

    resposta, status = service.status_favorito("user1", "trad1")

    assert status == 200
    assert resposta == {
        "id": "user1__trad1",
        "traducao_id": "trad1",
        "favoritado": True,
    }


def test_listar_favoritos_usuario_ordena_por_data_e_respeita_limit(monkeypatch):
    antigo = datetime(2026, 1, 1, tzinfo=timezone.utc)
    recente = datetime(2026, 2, 1, tzinfo=timezone.utc)

    favoritos_docs = [
        FakeDoc("fav_antigo", {"usuario_id": "user1", "traducao_id": "trad_antiga", "data_favorito": antigo}),
        FakeDoc("fav_recente", {"usuario_id": "user1", "traducao_id": "trad_recente", "data_favorito": recente}),
    ]

    favorito_collection = MagicMock()
    favorito_collection.where.return_value.stream.return_value = favoritos_docs

    traducao_collection = MagicMock()

    def document(traducao_id):
        ref = MagicMock()
        ref.get.return_value = FakeDoc(traducao_id, {"termo": traducao_id}, exists=True)
        return ref

    traducao_collection.document.side_effect = document

    db = MagicMock()
    db.collection.side_effect = lambda name: {
        service.COLLECTION: favorito_collection,
        service.TRADUCAO_COLLECTION: traducao_collection,
    }[name]
    monkeypatch.setattr(service, "db", db)

    resposta, status = service.listar_favoritos_usuario("user1", limit=1)

    assert status == 200
    assert resposta["total"] == 2
    assert resposta["limit"] == 1
    assert len(resposta["dados"]) == 1
    assert resposta["dados"][0]["id"] == "fav_recente"
    assert resposta["dados"][0]["traducao"]["id"] == "trad_recente"


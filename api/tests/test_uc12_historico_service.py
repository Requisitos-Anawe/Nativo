from datetime import datetime, timezone
from unittest.mock import MagicMock

from app.services.HistoricoService import HistoricoService
from app.services import HistoricoService as service_module


class FakeDoc:
    def __init__(self, doc_id, data=None, exists=True):
        self.id = doc_id
        self._data = data or {}
        self.exists = exists

    def to_dict(self):
        return dict(self._data)


def test_registrar_consulta_salva_historico_do_usuario(monkeypatch):
    doc_ref = MagicMock()
    doc_ref.id = "hist1"

    collection = MagicMock()
    collection.document.return_value = doc_ref

    db = MagicMock()
    db.collection.return_value = collection
    monkeypatch.setattr(service_module, "db", db)

    resposta, status = HistoricoService.registrar_consulta(
        usuario_id="user1",
        termo_pesquisado="casa",
        traducao_resultado="oka",
    )

    assert status == 201
    assert resposta == {"mensagem": "Consulta registrada no histórico", "id": "hist1"}
    doc_ref.set.assert_called_once()
    payload = doc_ref.set.call_args.args[0]
    assert payload["usuario_id"] == "user1"
    assert payload["termo_pesquisado"] == "casa"
    assert payload["traducao_resultado"] == "oka"
    assert "data_consulta" in payload


def test_listar_historico_usuario_ordena_do_mais_recente_para_o_mais_antigo(monkeypatch):
    antigo = datetime(2026, 1, 1, tzinfo=timezone.utc)
    recente = datetime(2026, 2, 1, tzinfo=timezone.utc)
    docs = [
        FakeDoc("hist_antigo", {"usuario_id": "user1", "termo_pesquisado": "a", "data_consulta": antigo}),
        FakeDoc("hist_recente", {"usuario_id": "user1", "termo_pesquisado": "b", "data_consulta": recente}),
    ]

    collection = MagicMock()
    collection.where.return_value.stream.return_value = docs

    db = MagicMock()
    db.collection.return_value = collection
    monkeypatch.setattr(service_module, "db", db)

    resposta, status = HistoricoService.listar_historico_usuario("user1", limit=10)

    assert status == 200
    assert resposta["mensagem"] == "Histórico listado com sucesso"
    assert [item["id"] for item in resposta["dados"]] == ["hist_recente", "hist_antigo"]
    assert resposta["dados"][0]["data_consulta"] == recente.isoformat()


def test_deletar_item_historico_retorna_404_quando_item_nao_existe(monkeypatch):
    historico_ref = MagicMock()
    historico_ref.get.return_value = FakeDoc("hist1", exists=False)

    collection = MagicMock()
    collection.document.return_value = historico_ref

    db = MagicMock()
    db.collection.return_value = collection
    monkeypatch.setattr(service_module, "db", db)

    resposta, status = HistoricoService.deletar_item_historico_usuario("user1", "hist1")

    assert status == 404
    assert resposta == {"erro": "Item de histórico não encontrado"}
    historico_ref.delete.assert_not_called()


def test_deletar_item_historico_retorna_403_quando_item_pertence_a_outro_usuario(monkeypatch):
    historico_ref = MagicMock()
    historico_ref.get.return_value = FakeDoc("hist1", {"usuario_id": "outro"}, exists=True)

    collection = MagicMock()
    collection.document.return_value = historico_ref
    db = MagicMock()
    db.collection.return_value = collection
    monkeypatch.setattr(service_module, "db", db)

    resposta, status = HistoricoService.deletar_item_historico_usuario("user1", "hist1")

    assert status == 403
    assert resposta == {"erro": "Usuário não autorizado a remover este item de histórico"}
    historico_ref.delete.assert_not_called()


def test_deletar_item_historico_remove_quando_pertence_ao_usuario(monkeypatch):
    historico_ref = MagicMock()
    historico_ref.get.return_value = FakeDoc("hist1", {"usuario_id": "user1"}, exists=True)

    collection = MagicMock()
    collection.document.return_value = historico_ref
    db = MagicMock()
    db.collection.return_value = collection
    monkeypatch.setattr(service_module, "db", db)

    resposta, status = HistoricoService.deletar_item_historico_usuario("user1", "hist1")

    assert status == 200
    assert resposta == {"mensagem": "Item de histórico removido com sucesso"}
    historico_ref.delete.assert_called_once()


def test_deletar_historico_usuario_remove_todos_os_itens_do_usuario(monkeypatch):
    docs = [FakeDoc("hist1"), FakeDoc("hist2")]

    collection = MagicMock()
    collection.where.return_value.stream.return_value = docs

    refs_por_id = {doc.id: MagicMock() for doc in docs}
    collection.document.side_effect = lambda doc_id: refs_por_id[doc_id]

    db = MagicMock()
    db.collection.return_value = collection
    monkeypatch.setattr(service_module, "db", db)

    resposta, status = HistoricoService.deletar_historico_usuario("user1")

    assert status == 200
    assert resposta == {"mensagem": "2 itens deletados do histórico"}
    refs_por_id["hist1"].delete.assert_called_once()
    refs_por_id["hist2"].delete.assert_called_once()


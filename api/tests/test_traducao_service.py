import pytest
from unittest.mock import patch, MagicMock
from app.services.TraducaoService import TraducaoService
@patch('app.services.TraducaoService.db')
def test_buscar_traducao_existente(mock_db):
    # Prepara um documento falso fingindo ser um retorno do Firestore
    mock_doc = MagicMock()
    mock_doc.exists = True
    mock_doc.id = "id_falso_123"
    mock_doc.to_dict.return_value = {"texto": "Exemplo", "idioma": "Português"}
    
    # Configura o mock do banco para retornar o nosso documento falso
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

    resultado = TraducaoService.buscar("id_falso_123")

    assert resultado is not None
    assert resultado["id"] == "id_falso_123"
    assert resultado["texto"] == "Exemplo"
    
    # Verifica se buscou na coleção certa
    mock_db.collection.assert_called_with("traducao")
    mock_db.collection().document.assert_called_with("id_falso_123")

@patch('app.services.TraducaoService.db')
def test_buscar_traducao_nao_encontrada(mock_db):
    # Prepara o documento falso indicando que NÃO existe no banco
    mock_doc = MagicMock()
    mock_doc.exists = False
    
    mock_db.collection.return_value.document.return_value.get.return_value = mock_doc

    resultado = TraducaoService.buscar("id_inexistente")

    assert resultado is None

@patch('app.services.TraducaoService.db')
def test_atualizar_traducao_sucesso(mock_db):
    dados_mock = {"texto": "Texto atualizado"}
    
    # Executa a função
    resultado, erro = TraducaoService.atualizar("id_123", dados_mock)

    assert erro is None
    assert resultado["id"] == "id_123"
    assert resultado["texto"] == "Texto atualizado"
    
    # Verifica se a função disparou a atualização no Firebase corretamente
    mock_db.collection.return_value.document.return_value.update.assert_called_once_with(dados_mock)

@patch('app.services.TraducaoService.db')
def test_atualizar_traducao_erro(mock_db):
    dados_mock = {"texto": "Texto atualizado"}
    
    # Força o Firebase a disparar um erro na hora do update
    mock_db.collection.return_value.document.return_value.update.side_effect = Exception("Permissão negada")

    resultado, erro = TraducaoService.atualizar("id_123", dados_mock)

    assert resultado is None
    assert "Erro ao atualizar tradução: Permissão negada" in erro
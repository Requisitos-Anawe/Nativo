import pytest
from io import BytesIO
from unittest.mock import patch, MagicMock
from flask import Flask
from app.routes.UploadRoute import bp 

@pytest.fixture
def client():
    app = Flask(__name__)
    app.register_blueprint(bp)
    app.testing = True
    with app.test_client() as client:
        yield client

# Caminho do patch corrigido para UploadRoute
@patch('app.routes.UploadRoute.bucket') 
def test_upload_midia_sucesso(mock_bucket, client):
    mock_blob = MagicMock()
    mock_blob.public_url = "https://storage.googleapis.com/fake-url/arquivo.mp4"
    mock_bucket.blob.return_value = mock_blob

    fake_file = (BytesIO(b"conteudo binario"), "video.mp4")

    response = client.post('/upload_midia', data={
        'file': fake_file,
        'pasta': 'traducoes'
    }, content_type='multipart/form-data')

    assert response.status_code == 200
    assert response.json['mensagem'] == "Upload concluído com sucesso"
    assert response.json['url'] == mock_blob.public_url
    
    mock_bucket.blob.assert_called_once()
    mock_blob.upload_from_file.assert_called_once()
    mock_blob.make_public.assert_called_once()

def test_upload_midia_sem_arquivo(client):
    response = client.post('/upload_midia', data={
        'pasta': 'traducoes'
    }, content_type='multipart/form-data')

    assert response.status_code == 400
    assert response.json['erro'] == "Nenhum arquivo enviado"

def test_upload_midia_pasta_nao_permitida(client):
    fake_file = (BytesIO(b"conteudo"), "foto.png")

    response = client.post('/upload_midia', data={
        'file': fake_file,
        'pasta': 'pasta_invasora'
    }, content_type='multipart/form-data')

    assert response.status_code == 400
    assert "não é permitida" in response.json['erro']

def test_upload_midia_nome_arquivo_vazio(client):
    fake_file = (BytesIO(b"conteudo"), "") 

    response = client.post('/upload_midia', data={
        'file': fake_file,
        'pasta': 'perfis'
    }, content_type='multipart/form-data')

    assert response.status_code == 400
    assert response.json['erro'] == "Arquivo inválido"

# Caminho do patch corrigido para UploadRoute
@patch('app.routes.UploadRoute.bucket')
def test_upload_midia_erro_firebase(mock_bucket, client):
    mock_bucket.blob.side_effect = Exception("Falha de conexão com o Storage")
    
    fake_file = (BytesIO(b"conteudo"), "foto.png")

    response = client.post('/upload_midia', data={
        'file': fake_file,
        'pasta': 'comunidade'
    }, content_type='multipart/form-data')

    assert response.status_code == 500
    assert "Falha de conexão com o Storage" in response.json['erro']
import unittest
from unittest.mock import patch, MagicMock
from flask import Flask
import jwt

# Mock db before importing any services that might initialize Firebase
with patch('app.firebase.db') as mock_db:
    from app.routes.InsigniaRoute import bp
    from app.services import InsigniaService

class TestInsigniaRoute(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['JWT_SECRET'] = 'testsecret'
        # Override the secret in the environment for the middleware
        self.patcher_env = patch('os.getenv', return_value='testsecret')
        self.patcher_env.start()
        
        self.app.register_blueprint(bp)
        self.client = self.app.test_client()

    def tearDown(self):
        self.patcher_env.stop()

    @patch("app.routes.InsigniaRoute.InsigniaService")
    @patch("jwt.decode")
    def test_obter_insignias_sucesso(self, mock_jwt_decode, mock_insignia_service):
        # Mock JWT validation
        mock_jwt_decode.return_value = {"usuario_id": "user123"}
        
        # Mock InsigniaService response
        mock_resultado = {
            "total_atividades": 12,
            "insignias": [
                {
                    "id": "insignia_1",
                    "titulo": "Despertar do Saber",
                    "descricao": "Completou 1 atividade",
                    "imagem": "insignia1.svg",
                    "imagem_bloqueada": "ocultInsignia1.svg",
                    "limite": 1,
                    "adquirida": True
                },
                {
                    "id": "insignia_10",
                    "titulo": "Caçador de Palavras",
                    "descricao": "Completou 10 atividades",
                    "imagem": "insignia2.svg",
                    "imagem_bloqueada": "ocultInsignia2.svg",
                    "limite": 10,
                    "adquirida": True
                },
                {
                    "id": "insignia_20",
                    "titulo": "Protetor das Tradições",
                    "descricao": "Completou 20 atividades",
                    "imagem": "insignia3.svg",
                    "imagem_bloqueada": "ocultInsignia3.svg",
                    "limite": 20,
                    "adquirida": False
                }
            ]
        }
        mock_insignia_service.obter_insignias_usuario.return_value = mock_resultado

        headers = {"Authorization": "Bearer valid_token"}
        response = self.client.get("/usuarios/user123/insignias", headers=headers)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), mock_resultado)
        mock_insignia_service.obter_insignias_usuario.assert_called_once_with("user123")

    def test_obter_insignias_sem_token(self):
        response = self.client.get("/usuarios/user123/insignias")
        self.assertEqual(response.status_code, 401)
        self.assertIn("Token JWT ausente ou inválido", response.get_json()["erro"])

    @patch("jwt.decode")
    def test_obter_insignias_token_expirado(self, mock_jwt_decode):
        mock_jwt_decode.side_effect = jwt.ExpiredSignatureError("Token expirado")
        headers = {"Authorization": "Bearer expired_token"}
        response = self.client.get("/usuarios/user123/insignias", headers=headers)
        self.assertEqual(response.status_code, 401)
        self.assertIn("Token expirado", response.get_json()["erro"])


class TestInsigniaService(unittest.TestCase):
    @patch("app.services.InsigniaService.db")
    def test_obter_insignias_usuario_logica(self, mock_db):
        # Mocking Firestore collection and stream
        mock_query = MagicMock()
        mock_stream = MagicMock()
        
        # Simulating 12 completed activities
        mock_docs = []
        for i in range(12):
            doc = MagicMock()
            doc.to_dict.return_value = {"usuario_id": "user123", "concluida": True}
            mock_docs.append(doc)
            
        mock_stream.return_value = mock_docs
        mock_query.stream = mock_stream
        mock_db.collection.return_value.where.return_value.where.return_value = mock_query

        resultado = InsigniaService.obter_insignias_usuario("user123")

        self.assertEqual(resultado["total_atividades"], 12)
        insignias = resultado["insignias"]
        self.assertEqual(len(insignias), 4)
        
        # 1 and 10 activity badges should be acquired, 20 and 30 should not
        self.assertTrue(insignias[0]["adquirida"])  # 1 activity
        self.assertTrue(insignias[1]["adquirida"])  # 10 activities
        self.assertFalse(insignias[2]["adquirida"]) # 20 activities
        self.assertFalse(insignias[3]["adquirida"]) # 30 activities

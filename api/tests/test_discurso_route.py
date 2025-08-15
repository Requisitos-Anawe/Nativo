import unittest
from unittest.mock import patch
from flask import Flask
from app.routes.DiscursoRoute import bp

class TestDiscursoRoute(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.register_blueprint(bp)
        self.client = self.app.test_client()

    @patch("app.routes.DiscursoRoute.DiscursoService")
    def test_buscar_discurso_sucesso(self, mock_service):
        mock_resultado = {
            "categoria": "Saudações",
            "discurso": "Eu cheguei",
            "traducao": [
                {
                    "texto": "õn cuk o a jem"
                }
            ]
        }
        mock_service.buscar_discurso_e_traducao_por_texto.return_value = (mock_resultado, None)

        response = self.client.post("/discurso/buscar", json={"texto": "Eu cheguei"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), mock_resultado)

    @patch("app.routes.DiscursoRoute.DiscursoService")
    def test_buscar_discurso_nao_encontrado(self, mock_service):
        mock_service.buscar_discurso_e_traducao_por_texto.return_value = (None, "Discurso não encontrado")

        response = self.client.post("/discurso/buscar", json={"texto": "Desconhecido"})

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json(), {"erro": "Discurso não encontrado"})

    def test_buscar_discurso_faltando_texto(self):
        response = self.client.post("/discurso/buscar", json={"idioma": "portugues"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json(), {"erro": "Campo 'texto' é obrigatório no corpo da requisição."})
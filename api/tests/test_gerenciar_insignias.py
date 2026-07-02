import unittest
from unittest.mock import patch, MagicMock
from flask import Flask, g
import jwt
from marshmallow import ValidationError
from firebase_admin import firestore

# Custom Mock Document Reference that inherits from the real firestore.DocumentReference
# so that isinstance(..., firestore.DocumentReference) returns True.
class MockDocRef(firestore.DocumentReference):
    def __init__(self, doc_id, data=None, exists=True):
        self._id = doc_id
        self._data = data if data is not None else {}
        self._exists = exists

    @property
    def id(self):
        return self._id

    @property
    def exists(self):
        return self._exists

    def get(self, transaction=None):
        return self

    def to_dict(self):
        return self._data

    def set(self, data, merge=None):
        self._data = data

    def delete(self):
        pass

# We patch firebase client before importing routes/services to avoid real Firebase initialization
with patch('firebase_admin.firestore.client') as mock_fs_client, patch('app.firebase.db') as mock_db:
    from app.routes.AtividadeRoute import bp as atividade_bp
    from app.routes.InsigniaRoute import bp as insignia_bp
    from app.services import InsigniaService
    from app.services import AtividadeService

class TestGerenciarInsignias(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config['JWT_SECRET'] = 'testsecret'
        self.patcher_env = patch('os.getenv', return_value='testsecret')
        self.patcher_env.start()
        
        self.app.register_blueprint(atividade_bp, url_prefix='/api')
        self.app.register_blueprint(insignia_bp, url_prefix='/api')
        self.client = self.app.test_client()

        # Create mocks for db
        self.mock_db = MagicMock()
        
        # Patch the db references in services and middlewares
        self.patcher_db_service = patch('app.services.AtividadeService.db', self.mock_db)
        self.patcher_db_middleware = patch('app.middlewares.verificar_professor.db', self.mock_db)
        self.patcher_db_insignia = patch('app.services.InsigniaService.db', self.mock_db)
        
        self.patcher_db_service.start()
        self.patcher_db_middleware.start()
        self.patcher_db_insignia.start()

    def tearDown(self):
        self.patcher_env.stop()
        self.patcher_db_service.stop()
        self.patcher_db_middleware.stop()
        self.patcher_db_insignia.stop()

    def _auth_headers(self, token="valid_token"):
        return {"Authorization": f"Bearer {token}"}

    @patch("jwt.decode")
    def test_criar_insignia_sucesso(self, mock_jwt_decode):
        """FP01 - Criar Insígnia com todos os dados válidos."""
        mock_jwt_decode.return_value = {"usuario_id": "prof123"}
        
        # We need to mock document retrieval for 'usuario' collection
        mock_prof_ref = MockDocRef("prof123", {"perfil": "professor"})
        
        # Setup mock db behaviors
        self.mock_db.collection.return_value.document.return_value = mock_prof_ref
        
        payload = {
            "titulo": "Atividade de Tabuada",
            "questoes": [
                {
                    "enunciado": "Quanto é 2x2?",
                    "alternativas": ["3", "4", "5"],
                    "alternativa_correta": 1
                }
            ],
            "insignia_titulo": "Mestre da Tabuada",
            "insignia_descricao": "Completou a atividade com 100% de acertos",
            "insignia_imagem_url": "tabuada_badge.svg",
            "insignia_porcentagem_minima": 100
        }

        response = self.client.post("/api/atividades", json=payload, headers=self._auth_headers())
        
        self.assertEqual(response.status_code, 201)
        res_data = response.get_json()
        self.assertIn("dados", res_data)
        self.assertEqual(res_data["dados"]["insignia_titulo"], "Mestre da Tabuada")
        self.assertEqual(res_data["dados"]["insignia_porcentagem_minima"], 100)

    @patch("jwt.decode")
    def test_criar_insignia_dados_obrigatorios_ausentes(self, mock_jwt_decode):
        """FE02 - Impedir criação com dados obrigatórios da insígnia ausentes."""
        mock_jwt_decode.return_value = {"usuario_id": "prof123"}
        
        mock_prof_ref = MockDocRef("prof123", {"perfil": "professor"})
        self.mock_db.collection.return_value.document.return_value = mock_prof_ref

        payload = {
            "titulo": "Atividade de Tabuada",
            "questoes": [
                {
                    "enunciado": "Quanto é 2x2?",
                    "alternativas": ["3", "4", "5"],
                    "alternativa_correta": 1
                }
            ],
            "insignia_titulo": "Mestre da Tabuada"
        }

        response = self.client.post("/api/atividades", json=payload, headers=self._auth_headers())
        
        self.assertEqual(response.status_code, 400)
        res_data = response.get_json()
        self.assertIn("erro", res_data)
        self.assertIn("insignia_descricao", res_data["detalhes"])
        self.assertIn("insignia_imagem_url", res_data["detalhes"])
        self.assertIn("insignia_porcentagem_minima", res_data["detalhes"])

    @patch("jwt.decode")
    def test_criar_insignia_porcentagem_minima_invalida(self, mock_jwt_decode):
        """FE03 - Impedir criação com porcentagem mínima inválida (<0 ou >100)."""
        mock_jwt_decode.return_value = {"usuario_id": "prof123"}
        
        mock_prof_ref = MockDocRef("prof123", {"perfil": "professor"})
        self.mock_db.collection.return_value.document.return_value = mock_prof_ref

        payload = {
            "titulo": "Atividade de Tabuada",
            "questoes": [
                {
                    "enunciado": "Quanto é 2x2?",
                    "alternativas": ["3", "4", "5"],
                    "alternativa_correta": 1
                }
            ],
            "insignia_titulo": "Mestre da Tabuada",
            "insignia_descricao": "Descrição",
            "insignia_imagem_url": "badge.svg",
            "insignia_porcentagem_minima": 150
        }

        response = self.client.post("/api/atividades", json=payload, headers=self._auth_headers())
        
        self.assertEqual(response.status_code, 400)

    @patch("jwt.decode")
    def test_perfil_sem_permissao(self, mock_jwt_decode):
        """FE01 - Usuário sem perfil de professor/admin impedido de gerenciar."""
        mock_jwt_decode.return_value = {"usuario_id": "user123"}
        
        mock_aluno_ref = MockDocRef("user123", {"perfil": "aluno"})
        self.mock_db.collection.return_value.document.return_value = mock_aluno_ref

        payload = {
            "titulo": "Atividade",
            "questoes": [{"enunciado": "Q1", "alternativas": ["A", "B"], "alternativa_correta": 0}]
        }

        response = self.client.post("/api/atividades", json=payload, headers=self._auth_headers())
        
        self.assertEqual(response.status_code, 403)
        self.assertIn("Apenas usuários com perfil professor", response.get_json()["erro"])

    @patch("jwt.decode")
    def test_editar_insignia_sucesso(self, mock_jwt_decode):
        """FA02 - Editar insígnia/atividade com sucesso."""
        mock_jwt_decode.return_value = {"usuario_id": "prof123"}
        
        mock_prof_ref = MockDocRef("prof123", {"perfil": "professor"})
        mock_activity_ref = MockDocRef("act123", {
            "titulo": "Atividade Antiga",
            "questoes": [],
            "professores_associados": [mock_prof_ref]
        })
        
        def get_doc(doc_id):
            if doc_id == "prof123":
                return mock_prof_ref
            elif doc_id == "act123":
                return mock_activity_ref
            return MagicMock(exists=False)

        self.mock_db.collection.return_value.document.side_effect = get_doc

        payload = {
            "titulo": "Atividade Atualizada",
            "questoes": [
                {
                    "enunciado": "Quanto é 2x2?",
                    "alternativas": ["3", "4", "5"],
                    "alternativa_correta": 1
                }
            ],
            "insignia_titulo": "Novo Nome Insignia",
            "insignia_descricao": "Nova Descricao",
            "insignia_imagem_url": "nova.svg",
            "insignia_porcentagem_minima": 80
        }

        response = self.client.put("/api/atividades/act123", json=payload, headers=self._auth_headers())
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["dados"]["insignia_titulo"], "Novo Nome Insignia")

    @patch("jwt.decode")
    def test_editar_ou_excluir_entidade_inexistente(self, mock_jwt_decode):
        """FE04 - Tentativa de editar/excluir atividade/insígnia inexistente."""
        mock_jwt_decode.return_value = {"usuario_id": "prof123"}
        
        mock_prof_ref = MockDocRef("prof123", {"perfil": "professor"})
        mock_nonexistent_ref = MockDocRef("nonexistent", exists=False)
        
        def get_doc(doc_id):
            if doc_id == "prof123":
                return mock_prof_ref
            return mock_nonexistent_ref

        self.mock_db.collection.return_value.document.side_effect = get_doc

        payload = {
            "titulo": "Atividade Atualizada",
            "questoes": [{"enunciado": "Q1", "alternativas": ["A", "B"], "alternativa_correta": 0}]
        }

        response_put = self.client.put("/api/atividades/nonexistent", json=payload, headers=self._auth_headers())
        self.assertEqual(response_put.status_code, 404)

        response_del = self.client.delete("/api/atividades/nonexistent", headers=self._auth_headers())
        self.assertEqual(response_del.status_code, 404)

    @patch("jwt.decode")
    def test_excluir_insignia_sucesso(self, mock_jwt_decode):
        """FA03 / RN07 - Excluir atividade e consequentemente sua insígnia."""
        mock_jwt_decode.return_value = {"usuario_id": "prof123"}
        
        mock_prof_ref = MockDocRef("prof123", {"perfil": "professor"})
        mock_activity_ref = MockDocRef("act123", {
            "titulo": "Atividade",
            "questoes": [],
            "professores_associados": [mock_prof_ref],
            "insignia_titulo": "Insignia a ser apagada"
        })
        
        # Mock the transaction and its delete method
        mock_transaction = MagicMock()
        self.mock_db.transaction.return_value = mock_transaction
        
        def get_doc(doc_id):
            if doc_id == "prof123":
                return mock_prof_ref
            elif doc_id == "act123":
                return mock_activity_ref
            return MagicMock(exists=False)

        self.mock_db.collection.return_value.document.side_effect = get_doc

        response = self.client.delete("/api/atividades/act123", headers=self._auth_headers())
        
        self.assertEqual(response.status_code, 200)
        mock_transaction.delete.assert_called_once_with(mock_activity_ref)

    @patch("jwt.decode")
    def test_listar_insignias_customizadas(self, mock_jwt_decode):
        """FA01 - Listar insígnias do usuário incluindo as customizadas conquistadas."""
        mock_jwt_decode.return_value = {"usuario_id": "user123"}

        # Stream mock for completed results (0 completed activities for simplicity)
        mock_stream_resultados = MagicMock()
        mock_stream_resultados.return_value = []
        self.mock_db.collection.return_value.where.return_value.where.return_value.stream = mock_stream_resultados

        # Stream mock for active activities to find custom insignias
        mock_stream_atividades = MagicMock()
        mock_doc = MagicMock()
        mock_doc.id = "act999"
        mock_doc.to_dict.return_value = {
            "liberada": True,
            "insignia_titulo": "Insignia Customizada",
            "insignia_descricao": "Descricao da custom",
            "insignia_imagem_url": "custom.svg",
            "insignia_porcentagem_minima": 70
        }
        mock_stream_atividades.return_value = [mock_doc]
        self.mock_db.collection.return_value.where.return_value.stream = mock_stream_atividades

        response = self.client.get("/api/usuarios/user123/insignias", headers=self._auth_headers())
        
        self.assertEqual(response.status_code, 200)
        res_data = response.get_json()
        custom_badges = [badge for badge in res_data["insignias"] if badge["id"] == "custom_act999"]
        self.assertEqual(len(custom_badges), 1)
        self.assertEqual(custom_badges[0]["titulo"], "Insignia Customizada")
        self.assertFalse(custom_badges[0]["adquirida"])

    @patch("jwt.decode")
    def test_erro_interno_firestore(self, mock_jwt_decode):
        """FE06 - Tratamento de erro interno no banco de dados (Firestore)."""
        mock_jwt_decode.return_value = {"usuario_id": "prof123"}
        
        # We need verifying professor to succeed first
        mock_prof_ref = MockDocRef("prof123", {"perfil": "professor"})
        
        # We mock document retrieval to return the professor document
        # But we mock database collection/document write to raise an exception
        mock_error_doc = MagicMock()
        mock_error_doc.set.side_effect = Exception("Firestore Connection Error")
        
        def get_doc(doc_id):
            if doc_id == "prof123":
                return mock_prof_ref
            return mock_error_doc

        self.mock_db.collection.return_value.document.side_effect = get_doc

        payload = {
            "titulo": "Atividade",
            "questoes": [{"enunciado": "Q1", "alternativas": ["A", "B"], "alternativa_correta": 0}]
        }

        response = self.client.post("/api/atividades", json=payload, headers=self._auth_headers())
        
        self.assertEqual(response.status_code, 500)
        self.assertIn("Erro interno ao criar atividade", response.get_json()["erro"])

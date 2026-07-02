import unittest
from unittest.mock import patch, MagicMock
from flask import Flask
from datetime import datetime, timedelta
import pytz

# Custom Mock Document Reference/Snapshot for Firestore
class MockDocRef:
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

    def get(self):
        return self

    def to_dict(self):
        return self._data

    def set(self, data, merge=None):
        self._data = data

    def delete(self):
        pass

    def update(self, data):
        self._data.update(data)

# Pre-patch firebase connection before importing AuthRoute
with patch('firebase_admin.firestore.client') as mock_fs_client, patch('app.firebase.db') as mock_db:
    from app.routes.AuthRoute import bp as auth_bp

class TestRecuperarSenha(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.register_blueprint(auth_bp, url_prefix='/api')
        self.client = self.app.test_client()

        # Mock db
        self.mock_db = MagicMock()
        self.patcher_db = patch('app.routes.AuthRoute.db', self.mock_db)
        self.patcher_db.start()

    def tearDown(self):
        self.patcher_db.stop()

    def test_recuperar_senha_email_obrigatorio(self):
        """Validar que e-mail é obrigatório na recuperação de senha."""
        response = self.client.post("/api/auth/recuperar-senha", json={})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["erro"], "E-mail é obrigatório")

    @patch("app.routes.AuthRoute.enviar_email_codigo")
    def test_recuperar_senha_email_nao_encontrado_mensagem_generica(self, mock_enviar_email):
        """FE01 - E-mail não encontrado deve retornar mensagem genérica (anti-enumeração)."""
        email = "nao_existe@teste.com"
        
        # Mock that no code request is pending (cooldown check passes)
        mock_cooldown_doc = MockDocRef(email, exists=False)
        
        def get_doc(doc_id):
            if doc_id == email:
                return mock_cooldown_doc
            return MagicMock(exists=False)

        self.mock_db.collection.return_value.document.side_effect = get_doc
        self.mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = []

        response = self.client.post("/api/auth/recuperar-senha", json={"email": email})
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("código de recuperação foi enviado", response.get_json()["mensagem"])
        
        # Should NOT call email sender since email doesn't exist
        mock_enviar_email.assert_not_called()

    @patch("app.routes.AuthRoute.enviar_email_codigo")
    def test_recuperar_senha_sucesso(self, mock_enviar_email):
        """FP01 - Recuperar senha com sucesso para usuário existente."""
        email = "usuario@teste.com"
        mock_enviar_email.return_value = True

        # Cooldown doc does not exist
        mock_cooldown_doc = MockDocRef(email, exists=False)
        
        # User exists query mock
        mock_user_ref = MockDocRef("usr123", {"email": email, "perfil": "aluno"})

        def get_doc(doc_id):
            if doc_id == email:
                return mock_cooldown_doc
            return MagicMock(exists=False)

        self.mock_db.collection.return_value.document.side_effect = get_doc
        self.mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = [mock_user_ref]

        response = self.client.post("/api/auth/recuperar-senha", json={"email": email})
        
        self.assertEqual(response.status_code, 200)
        self.assertIn("código de recuperação foi enviado", response.get_json()["mensagem"])
        mock_enviar_email.assert_called_once()

    @patch("app.routes.AuthRoute.enviar_email_codigo")
    def test_recuperar_senha_cooldown_bloqueio(self, mock_enviar_email):
        """FA01 / RN13 - Impedir solicitação em intervalo menor que 3 minutos (cooldown)."""
        email = "usuario@teste.com"
        
        # Mock existing verification code within cooldown (created 1 minute ago)
        now = datetime.now(pytz.timezone("America/Sao_Paulo"))
        mock_cooldown_doc = MockDocRef(email, {
            "email": email,
            "criado_em": now - timedelta(minutes=1),
            "expira_em": now + timedelta(minutes=14)
        }, exists=True)

        self.mock_db.collection.return_value.document.return_value = mock_cooldown_doc

        response = self.client.post("/api/auth/recuperar-senha", json={"email": email})
        
        self.assertEqual(response.status_code, 429)
        self.assertIn("Por favor, aguarde", response.get_json()["erro"])
        mock_enviar_email.assert_not_called()

    def test_validar_codigo_sucesso(self):
        """Validar código com sucesso."""
        email = "usuario@teste.com"
        codigo = "123456"
        now = datetime.now(pytz.timezone("America/Sao_Paulo"))
        
        # Valid active verification code (expiring in 10 minutes)
        mock_code_doc = MockDocRef(email, {
            "email": email,
            "codigo": codigo,
            "expira_em": now + timedelta(minutes=10)
        }, exists=True)

        self.mock_db.collection.return_value.document.return_value = mock_code_doc

        response = self.client.post("/api/auth/validar-codigo", json={"email": email, "codigo": codigo})
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["mensagem"], "Código validado com sucesso")

    def test_validar_codigo_expirado(self):
        """FE02 - Código expirado deve ser rejeitado."""
        email = "usuario@teste.com"
        codigo = "123456"
        now = datetime.now(pytz.timezone("America/Sao_Paulo"))
        
        # Expired verification code
        mock_code_doc = MockDocRef(email, {
            "email": email,
            "codigo": codigo,
            "expira_em": now - timedelta(minutes=5)
        }, exists=True)

        self.mock_db.collection.return_value.document.return_value = mock_code_doc

        response = self.client.post("/api/auth/validar-codigo", json={"email": email, "codigo": codigo})
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("A solicitação não é mais válida", response.get_json()["erro"])

    def test_validar_codigo_incorreto(self):
        """FE02 - Código incorreto deve ser rejeitado."""
        email = "usuario@teste.com"
        codigo_correto = "123456"
        codigo_enviado = "999999"
        now = datetime.now(pytz.timezone("America/Sao_Paulo"))
        
        mock_code_doc = MockDocRef(email, {
            "email": email,
            "codigo": codigo_correto,
            "expira_em": now + timedelta(minutes=10)
        }, exists=True)

        self.mock_db.collection.return_value.document.return_value = mock_code_doc

        response = self.client.post("/api/auth/validar-codigo", json={"email": email, "codigo": codigo_enviado})
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("A solicitação não é mais válida", response.get_json()["erro"])

    def test_redefinir_senha_sucesso(self):
        """FP01 - Redefinir senha com sucesso (senha válida e código correto)."""
        email = "usuario@teste.com"
        codigo = "123456"
        now = datetime.now(pytz.timezone("America/Sao_Paulo"))
        
        # Mock verification code
        mock_code_doc = MockDocRef(email, {
            "email": email,
            "codigo": codigo,
            "expira_em": now + timedelta(minutes=10)
        }, exists=True)
        
        # Mock user document
        mock_user_doc = MockDocRef("usr123", {"email": email, "senha": "oldpasswordhash"})

        def get_doc(doc_id):
            if doc_id == email:
                return mock_code_doc
            elif doc_id == "usr123":
                return mock_user_doc
            return MagicMock(exists=False)

        self.mock_db.collection.return_value.document.side_effect = get_doc
        self.mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = [mock_user_doc]

        payload = {
            "email": email,
            "codigo": codigo,
            "nova_senha": "SenhaForte123@"
        }

        response = self.client.post("/api/auth/redefinir-senha", json=payload)
        
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["mensagem"], "Senha redefinida com sucesso")
        
        # User password in document should be updated (hashed)
        self.assertNotEqual(mock_user_doc.to_dict()["senha"], "oldpasswordhash")

    def test_redefinir_senha_invalida(self):
        """FE03 / RN14 - Redefinição deve falhar para senhas que não atendem requisitos mínimos."""
        email = "usuario@teste.com"
        codigo = "123456"
        now = datetime.now(pytz.timezone("America/Sao_Paulo"))
        
        mock_code_doc = MockDocRef(email, {
            "email": email,
            "codigo": codigo,
            "expira_em": now + timedelta(minutes=10)
        }, exists=True)

        self.mock_db.collection.return_value.document.return_value = mock_code_doc

        payload = {
            "email": email,
            "codigo": codigo,
            "nova_senha": "123"  # Too weak
        }

        response = self.client.post("/api/auth/redefinir-senha", json=payload)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("Senha inválida", response.get_json()["erro"])

    @patch("app.routes.AuthRoute.enviar_email_codigo")
    def test_recuperar_senha_erro_envio_email(self, mock_enviar_email):
        """FE04 - Falha ao enviar o e-mail de recuperação."""
        email = "usuario@teste.com"
        mock_enviar_email.return_value = False  # Simulate failure

        mock_cooldown_doc = MockDocRef(email, exists=False)
        mock_user_ref = MockDocRef("usr123", {"email": email})

        def get_doc(doc_id):
            if doc_id == email:
                return mock_cooldown_doc
            return MagicMock(exists=False)

        self.mock_db.collection.return_value.document.side_effect = get_doc
        self.mock_db.collection.return_value.where.return_value.limit.return_value.stream.return_value = [mock_user_ref]

        response = self.client.post("/api/auth/recuperar-senha", json={"email": email})
        
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.get_json()["erro"], "Falha ao enviar e-mail de recuperação")

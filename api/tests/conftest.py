import os
import sys
import types
from unittest.mock import MagicMock

# Ambiente mínimo para testes
os.environ.setdefault("JWT_SECRET", "testsecret")
os.environ.setdefault("FLASK_ENV", "testing")
os.environ.setdefault("FIREBASE_STORAGE_BUCKET", "test-bucket")

# Mocka firebase_admin antes de qualquer import de app.*
try:
    import firebase_admin
    from firebase_admin import credentials, firestore, storage

    credentials.Certificate = MagicMock(return_value=MagicMock())
    firestore.client = MagicMock(return_value=MagicMock(name="firestore_client"))
    storage.bucket = MagicMock(return_value=MagicMock(name="storage_bucket"))
    firebase_admin.initialize_app = MagicMock(return_value=MagicMock(name="firebase_app"))
except Exception:
    pass

# Evita executar app/firebase.py real durante os testes
fake_firebase = types.ModuleType("app.firebase")
fake_firebase.db = MagicMock(name="db")
fake_firebase.bucket = MagicMock(name="bucket")
sys.modules["app.firebase"] = fake_firebase

import firebase_admin
import os
import json
from dotenv import load_dotenv
from firebase_admin import credentials, firestore, storage

load_dotenv()
cred_json = os.environ.get("FIREBASE_KEY_JSON")
if not cred_json:
    raise RuntimeError("A variável FIREBASE_KEY_JSON não está definida!")

cred_dict = json.loads(cred_json)
cred = credentials.Certificate(cred_dict)

storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET")

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        'storageBucket': storage_bucket
    })

db = firestore.client()

bucket = storage.bucket()

__all__ = ['db', 'bucket']

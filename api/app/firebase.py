import firebase_admin
import os
from dotenv import load_dotenv
from firebase_admin import credentials, firestore, storage

load_dotenv()

cred = credentials.Certificate('app/credentials/firebase_key.json')

storage_bucket = os.getenv("FIREBASE_STORAGE_BUCKET")

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred, {
        'storageBucket': storage_bucket
    })

db = firestore.client()

bucket = storage.bucket()

__all__ = ['db', 'bucket']

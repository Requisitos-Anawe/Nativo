import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate('app/credentials/firebase_key.json')

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

__all__ = ['db']

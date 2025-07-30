from marshmallow import ValidationError
from app.firebase import db

def validate_ref_exists(collection_name):
    def _validator(value):
        doc = db.collection(collection_name).document(value).get()
        if not doc.exists:
            raise ValidationError(f"Referência inválida: {collection_name}/{value}")
    return _validator
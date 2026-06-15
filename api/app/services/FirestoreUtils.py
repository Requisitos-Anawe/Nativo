from app.firebase import db

def listar_documentos(collection, order_by=None, limit=None):
    query = db.collection(collection)

    if order_by:
        query = query.order_by(order_by)

    if limit:
        query = query.limit(limit)

    docs = query.stream()

    return [
        {**doc.to_dict(), "id": doc.id}
        for doc in docs
    ]
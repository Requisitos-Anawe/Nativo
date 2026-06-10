from datetime import datetime
from app.firebase import db
import pytz

def run():
    idiomas = {
        "1": "Português",
        "2": "Munduruku"
    }

    for idioma_id, descricao in idiomas.items():
        db.collection("idioma").document(idioma_id).set({
            "descricao": descricao,
            "data_criacao": datetime.now(pytz.timezone("America/Sao_Paulo"))
        })

    print("Idiomas inseridos com sucesso.")

from datetime import datetime
from app.firebase import db
import pytz

def run():
    idiomas = {
        "1": "Português",
        "2": "Munduruku"  
    }

    for _id, nome in idiomas.items():
        db.collection("idioma").document(_id).set({
            "nome": nome,
            "data_criacao": datetime.now(pytz.timezone("America/Sao_Paulo"))
        })

    print("Idiomas inseridos com sucesso.")

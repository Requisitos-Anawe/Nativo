from datetime import datetime
from app.firebase import db
import pytz

def run():
    perfis = {
        "1": "Padrão",
        "2": "Administrador",
        "3": "Professor",
        "4": "Moderador"
    }

    for perfil_id, descricao in perfis.items():
        db.collection("perfil").document(perfil_id).set({
            "descricao": descricao,
            "data_criacao": datetime.now(pytz.timezone("America/Sao_Paulo"))
        })

    print("Perfis inseridos com sucesso.")

from datetime import datetime
from app.firebase import db
import pytz

def run():
    reportes_tipo = {
        "1": "Denúncia",
        "2": "Sugestão",
        "3": "Erro"
    }

    for _id, descricao in reportes_tipo.items():
        db.collection("reporte_tipo").document(_id).set({
            "descricao": descricao,
            "data_criacao": datetime.now(pytz.timezone("America/Sao_Paulo"))
        })

    print("Tipos de reportes inseridos com sucesso.")

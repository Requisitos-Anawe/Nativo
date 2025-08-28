from datetime import datetime
from app.firebase import db
import pytz

def run():
    categorias = {
        "1": "Apresentação",
        "2": "Rotina e tempo",
        "3": "Comida e bebida",
        "4": "Localização",
        "5": "Conversas básicas",
        "6": "Aprendizado",
        "7": "Família",
        "8": "Clima e tempo",
        "9": "Alimentação",
        "10": "Saúde",
        "11": "Transporte e locomoção",
        "12": "Emoções e sentimentos",
        "13": "Relacionamentos",
        "14": "Animais e natureza",
        "15": "Outros",
    }


    for _id, descricao in categorias.items():
        db.collection("discurso_categoria").document(_id).set({
            "descricao": descricao,
            "data_criacao": datetime.now(pytz.timezone("America/Sao_Paulo"))
        })

    print("Categorias de discursos inseridos com sucesso.")

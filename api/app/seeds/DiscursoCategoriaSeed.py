from datetime import datetime
from app.firebase import db
import pytz

def run():
    categorias = {
        "1": "Saudações",
        "2": "Apresentação pessoal",
        "3": "Dia a dia",
        "4": "Estudo e escola",
        "5": "Trabalho",
        "6": "Fofoca e conversa informal",
        "7": "Família",
        "8": "Clima e tempo",
        "9": "Alimentação",
        "10": "Compras",
        "11": "Saúde",
        "12": "Transporte e locomoção",
        "13": "Lazer e hobbies",
        "14": "Emoções e sentimentos",
        "15": "Relacionamentos",
        "16": "Humor e piadas",
        "17": "Tecnologia e internet",
        "18": "Reclamações e opiniões",
        "19": "Cultura e tradições",
        "20": "Animais e natureza"
    }


    for _id, descricao in categorias.items():
        db.collection("categoria").document(_id).set({
            "descricao": descricao,
            "data_criacao": datetime.now(pytz.timezone("America/Sao_Paulo"))
        })

    print("Categorias de discursos inseridos com sucesso.")

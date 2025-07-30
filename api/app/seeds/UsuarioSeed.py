
from datetime import datetime
from app.firebase import db
import pytz
from firebase_admin import firestore
from werkzeug.security import generate_password_hash

def run():
    usuarios = [
        {
            "nome": "Admin",
            "email": "admin@site.com",
            "senha": generate_password_hash("admin123"),
            "cpf": "000.000.000-00",
            "data_nascimento": datetime(1990, 1, 1),
            "perfil": firestore.client().document("perfil/2"),
        },
        {
            "nome": "Professor",
            "email": "joao@site.com",
            "senha": generate_password_hash("prof123"),
            "cpf": "111.111.111-11",
            "data_nascimento": datetime(1985, 6, 20),
            "perfil": firestore.client().document("perfil/3"),
        },
        {
            "nome": "Moderadora",
            "email": "ana@site.com",
            "senha": generate_password_hash("mod123"),
            "cpf": "222.222.222-22",
            "data_nascimento": datetime(1992, 3, 15),
            "perfil": firestore.client().document("perfil/4"),
        },
        {
            "nome": "Usuário Padrão",
            "email": "user@site.com",
            "senha": generate_password_hash("user123"),
            "cpf": "333.333.333-33",
            "data_nascimento": datetime(2000, 12, 5),
            "perfil": firestore.client().document("perfil/1"),
        },
    ]

    for user in usuarios:
        user["data_criacao"] = datetime.now(pytz.timezone("America/Sao_Paulo"))
        db.collection("usuario").add(user)

    print("Usuários adicionados com sucesso.")
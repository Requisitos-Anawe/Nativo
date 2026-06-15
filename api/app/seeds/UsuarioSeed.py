
from datetime import datetime
from app.firebase import db
import pytz
from firebase_admin import firestore
import bcrypt

def run():
    senha = 'Usuario123*'
    senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt())
    senha_hash_str = senha_hash.decode('utf-8')
    usuarios = [
        {
            "nome": "Admin",
            "email": "admin@site.com",
            "senha": senha_hash_str,
            "data_nascimento": datetime(1990, 1, 1),
            "perfil": firestore.client().document("perfil/2"),
        },
        {
            "nome": "Professor",
            "email": "joao@site.com",
            "senha": senha_hash_str,
            "data_nascimento": datetime(1985, 6, 20),
            "perfil": firestore.client().document("perfil/3"),
        },
        {
            "nome": "Moderadora",
            "email": "ana@site.com",
            "senha": senha_hash_str,
            "data_nascimento": datetime(1992, 3, 15),
            "perfil": firestore.client().document("perfil/4"),
        },
        {
            "nome": "Usuário Padrão",
            "cpf": "25224271053",
            "email": "user@site.com",
            "senha": senha_hash_str,
            "data_nascimento": datetime(2000, 12, 5),
            "perfil": firestore.client().document("perfil/1"),
        },
    ]

    for user in usuarios:
        user["data_criacao"] = datetime.now(pytz.timezone("America/Sao_Paulo"))
        db.collection("usuario").add(user)

    print("Usuários adicionados com sucesso.")
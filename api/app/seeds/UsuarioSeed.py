
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
            "cpf": "25224271053",
            "email": "admin@site.com",
            "senha": senha_hash_str,
            "data_nascimento": datetime(1990, 1, 1),
            "perfil": "admin",
        },
        {
            "nome": "Professor",
            "cpf": "99500069024",
            "email": "joao@site.com",
            "senha": senha_hash_str,
            "data_nascimento": datetime(1985, 6, 20),
            "perfil": "professor",
        },
        {
            "nome": "Moderadora",
            "cpf": "57879595074",
            "email": "ana@site.com",
            "senha": senha_hash_str,
            "data_nascimento": datetime(1992, 3, 15),
            "perfil": "moderador",
        },
        {
            "nome": "Usuário Padrão",
            "cpf": "01421229048",
            "email": "user@site.com",
            "senha": senha_hash_str,
            "data_nascimento": datetime(2000, 12, 5),
            "perfil": "padrao",
        },
    ]

    for user in usuarios:
        user["data_criacao"] = datetime.now(pytz.timezone("America/Sao_Paulo"))
        db.collection("usuario").add(user)

    print("Usuários adicionados com sucesso.")

if __name__ == '__main__':
    run()
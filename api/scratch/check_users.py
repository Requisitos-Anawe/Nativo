from app.firebase import db
import bcrypt
from flask_bcrypt import check_password_hash

print("Buscando todos os usuários no Firestore...")
usuarios_ref = db.collection("usuario").stream()
usuarios = [doc.to_dict() for doc in usuarios_ref]

print(f"Total de usuários encontrados: {len(usuarios)}")
for u in usuarios:
    nome = u.get("nome")
    email = u.get("email")
    cpf = u.get("cpf")
    senha_db = u.get("senha")
    
    # Check if password verifies
    senha_teste = 'Usuario123*'
    verificou = False
    if senha_db:
        try:
            verificou = check_password_hash(senha_db, senha_teste)
        except Exception as e:
            verificou = f"Erro: {str(e)}"
            
    print(f"- Nome: {nome} | Email: {email} | CPF: {cpf} | Senha Válida para 'Usuario123*': {verificou}")

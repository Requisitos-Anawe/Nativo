import re
from flask import jsonify

def validar_senha(senha):
    erros = []

    if len(senha) < 8:
        erros.append("A senha deve ter pelo menos 8 caracteres.")
    
    if not re.search(r"[A-Z]", senha):
        erros.append("A senha deve conter pelo menos uma letra maiúscula.")
    
    if not re.search(r"[a-z]", senha):
        erros.append("A senha deve conter pelo menos uma letra minúscula.")
    
    if not re.search(r"\d", senha):
        erros.append("A senha deve conter pelo menos um número.")
    
    if not re.search(r"[!@#$%^&*()_+=\[\]{};':\"\\|,.<>/?`~\-]", senha):
        erros.append("A senha deve conter pelo menos um caractere especial.")

    if erros:
        return False, erros
    
    return True, None

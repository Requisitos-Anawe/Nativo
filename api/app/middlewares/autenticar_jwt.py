import jwt, os
from functools import wraps
from flask import request, jsonify, g
from dotenv import load_dotenv

load_dotenv()
JWT_SECRET = os.getenv("JWT_SECRET")

def autenticar_jwt(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"erro": "Token JWT ausente ou inválido"}), 401
        
        token = auth_header.split(" ")[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            g.usuario_id = payload.get("usuario_id")
            if not g.usuario_id:
                return jsonify({"erro": "Token inválido: sem ID de usuário"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"erro": "Token expirado"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"erro": "Token inválido"}), 401
        
        return f(*args, **kwargs)
    return decorated_function

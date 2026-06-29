import bcrypt
from flask_bcrypt import check_password_hash
from flask import Flask
from flask_bcrypt import Bcrypt

app = Flask(__name__)
bcrypt_flask = Bcrypt(app)

senha = 'Usuario123*'
senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt())
senha_hash_str = senha_hash.decode('utf-8')

print("Hash:", senha_hash_str)
try:
    res = check_password_hash(senha_hash_str, senha)
    print("Verification result:", res)
except Exception as e:
    print("Verification raised exception:", str(e))


from flask import Blueprint, jsonify
from app.services.SyncService import SyncService
from app.middlewares.autenticar_jwt import autenticar_jwt  

sync_bp = Blueprint('sync', __name__)

@sync_bp.route('/sync/banco_traducoes', methods=['GET'])
@autenticar_jwt
def obter_banco_traducoes():
    try:
        banco_traducoes = SyncService.gerar_banco_traducoes_sync()
        return jsonify(banco_traducoes), 200
    except Exception as e:
        return jsonify({"erro": f"Erro ao gerar banco_traducoes: {str(e)}"}), 500
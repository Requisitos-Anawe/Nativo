
from flask import Blueprint, jsonify
from app.services.SyncService import SyncService
from app.middlewares.autenticar_jwt import autenticar_jwt

sync_bp = Blueprint('sync', __name__)


def _montar_resposta(payload, status_code):
    response = jsonify(payload)
    response.headers['Content-Length'] = str(len(response.get_data(as_text=True)))
    return response, status_code


@sync_bp.route('/sync/banco_traducoes', methods=['GET'])
@autenticar_jwt
def obter_banco_traducoes():
    try:
        banco_traducoes = SyncService.gerar_banco_traducoes_sync()
        return _montar_resposta(banco_traducoes, 200)
    except Exception as e:
        return _montar_resposta({"erro": f"Erro ao gerar banco_traducoes: {str(e)}"}, 500)
from flask import Blueprint, request, jsonify
from app.firebase import bucket
import uuid

bp = Blueprint('upload', __name__)

@bp.route('/upload_midia', methods=['POST'])
def upload_midia():
    if 'file' not in request.files:
        return jsonify({"erro": "Nenhum arquivo enviado"}), 400
        
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"erro": "Arquivo inválido"}), 400

    try:
        extensao = file.filename.split('.')[-1]
        nome_unico = f"{uuid.uuid4()}.{extensao}"
        
        blob = bucket.blob(f"traducoes/{nome_unico}")
        
        blob.upload_from_file(file.stream, content_type=file.content_type)
        blob.make_public()
        
        return jsonify({
            "mensagem": "Upload concluído com sucesso", 
            "url": blob.public_url
        }), 200
        
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
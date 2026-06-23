from app.firebase import db

# Definições estáticas das insígnias, estruturadas de forma extensível
INSIGNIAS_DEFINITIONS = [
    {
        "id": "insignia_1",
        "titulo": "Despertar do Saber",
        "descricao": "Completou 1 atividade",
        "imagem": "insignia1.svg",
        "imagem_bloqueada": "ocultInsignia1.svg",
        "regra": {
            "tipo": "quantidade_atividades",
            "valor": 1
        }
    },
    {
        "id": "insignia_10",
        "titulo": "Caçador de Palavras",
        "descricao": "Completou 10 atividades",
        "imagem": "insignia2.svg",
        "imagem_bloqueada": "ocultInsignia2.svg",
        "regra": {
            "tipo": "quantidade_atividades",
            "valor": 10
        }
    },
    {
        "id": "insignia_20",
        "titulo": "Protetor das Tradições",
        "descricao": "Completou 20 atividades",
        "imagem": "insignia3.svg",
        "imagem_bloqueada": "ocultInsignia3.svg",
        "regra": {
            "tipo": "quantidade_atividades",
            "valor": 20
        }
    },
    {
        "id": "insignia_30",
        "titulo": "Lenda da Floresta",
        "descricao": "Completou 30 atividades",
        "imagem": "insignia4.svg",
        "imagem_bloqueada": "ocultInsignia4.png",
        "regra": {
            "tipo": "quantidade_atividades",
            "valor": 30
        }
    }
]

def obter_insignias_usuario(usuario_id):
    """
    Busca os resultados das atividades do usuário no Firestore e avalia quais
    insígnias foram conquistadas com base em regras extensíveis.
    """
    from datetime import datetime
    
    # Consulta todos os resultados concluídos do usuário
    resultados_ref = (
        db.collection("atividade_resultado")
        .where("usuario_id", "==", usuario_id)
        .where("concluida", "==", True)
        .stream()
    )
    resultados = [doc.to_dict() for doc in resultados_ref]
    
    def get_date(res):
        d = res.get("data_criacao")
        if not d:
            return datetime.min
        if hasattr(d, "isoformat"):
            # If it's a firestore timestamp or datetime object, ensure it's timezone-naive or comparable
            if hasattr(d, "tzinfo") and d.tzinfo is not None:
                return d.replace(tzinfo=None)
            return d
        try:
            # Replace Z with +00:00 to support fromisoformat
            dt = datetime.fromisoformat(d.replace("Z", "+00:00"))
            if dt.tzinfo is not None:
                return dt.replace(tzinfo=None)
            return dt
        except Exception:
            return datetime.min

    resultados.sort(key=get_date)
    total_atividades = len(resultados)
    
    # Map results by activity_id for quick lookup
    resultados_map = {res.get("atividade_id"): res for res in resultados if res.get("atividade_id")}
    
    insignias_processadas = []
    
    for definition in INSIGNIAS_DEFINITIONS:
        regra = definition["regra"]
        tipo = regra["tipo"]
        valor_regra = regra["valor"]
        
        adquirida = False
        data_conquista = None
        
        if tipo == "quantidade_atividades":
            adquirida = total_atividades >= valor_regra
            if adquirida:
                nth_result = resultados[valor_regra - 1]
                raw_date = nth_result.get("data_criacao")
                if hasattr(raw_date, "isoformat"):
                    data_conquista = raw_date.isoformat()
                else:
                    data_conquista = str(raw_date)
        elif tipo == "porcentagem_acerto":
            adquirida = any(res.get("percentual", 0) >= valor_regra for res in resultados)
            
        insignias_processadas.append({
            "id": definition["id"],
            "titulo": definition["titulo"],
            "descricao": definition["descricao"],
            "imagem": definition["imagem"],
            "imagem_bloqueada": definition["imagem_bloqueada"],
            "limite": valor_regra if tipo == "quantidade_atividades" else None,
            "adquirida": adquirida,
            "data_conquista": data_conquista
        })
        
    # Fetch all active activities to see if they have custom insignias associated
    atividades_ref = (
        db.collection("atividade")
        .where("liberada", "==", True)
        .stream()
    )
    
    custom_insignias = []
    for doc in atividades_ref:
        dados = doc.to_dict()
        if dados.get("insignia_titulo"):
            atividade_id = doc.id
            res = resultados_map.get(atividade_id)
            
            adquirida = False
            data_conquista = None
            
            if res:
                min_percentage = dados.get("insignia_porcentagem_minima") or 0
                user_percentage = res.get("percentual") or 0
                if user_percentage >= min_percentage:
                    adquirida = True
                    raw_date = res.get("data_criacao")
                    if hasattr(raw_date, "isoformat"):
                        data_conquista = raw_date.isoformat()
                    else:
                        data_conquista = str(raw_date)
            
            # The custom insignia's image will be insignia_imagem_url if acquired, otherwise we can show a placeholder or blocked silhouette
            custom_insignias.append({
                "id": f"custom_{atividade_id}",
                "titulo": dados.get("insignia_titulo"),
                "descricao": dados.get("insignia_descricao") or f"Obter no mínimo {dados.get('insignia_porcentagem_minima')}% na atividade {dados.get('titulo')}",
                "imagem": dados.get("insignia_imagem_url") or "insignia1.svg",
                "imagem_bloqueada": "ocultInsignia1.svg",
                "limite": dados.get("insignia_porcentagem_minima"),
                "adquirida": adquirida,
                "data_conquista": data_conquista
            })
            
    insignias_processadas.extend(custom_insignias)
        
    return {
        "total_atividades": total_atividades,
        "insignias": insignias_processadas
    }

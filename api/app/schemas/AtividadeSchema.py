from marshmallow import RAISE, Schema, ValidationError, fields, pre_load, validate, validates_schema


CAMPOS_PROTEGIDOS = {
    "id",
    "professor_associado",
    "professores_associados",
    "usuario_criador",
    "data_criacao",
    "data_atualizacao",
    "max_alunos",
}


class QuestaoSchema(Schema):
    class Meta:
        unknown = RAISE

    enunciado = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=1000),
        error_messages={
            "required": "Enunciado da questão é obrigatório.",
            "invalid": "Enunciado da questão deve ser texto.",
            "null": "Enunciado da questão não pode ser nulo.",
        },
    )

    alternativas = fields.List(
        fields.Str(
            validate=validate.Length(min=1, max=300),
            error_messages={
                "invalid": "Cada alternativa deve ser texto.",
                "null": "Alternativas não podem conter valores nulos.",
            },
        ),
        required=True,
        validate=validate.Length(min=2, max=10),
        error_messages={
            "required": "Alternativas são obrigatórias.",
            "invalid": "Alternativas devem ser uma lista.",
            "null": "Alternativas não podem ser nulas.",
        },
    )

    alternativa_correta = fields.Int(
        required=True,
        validate=validate.Range(min=0, max=9),
        error_messages={
            "required": "Alternativa correta é obrigatória.",
            "invalid": "Alternativa correta deve ser um índice inteiro.",
            "null": "Alternativa correta não pode ser nula.",
        },
    )

    @pre_load
    def normalizar_questao(self, data, **kwargs):
        if not isinstance(data, dict):
            return data

        normalizado = dict(data)

        enunciado = normalizado.get("enunciado")
        if isinstance(enunciado, str):
            normalizado["enunciado"] = enunciado.strip()

        alternativas = normalizado.get("alternativas")
        if isinstance(alternativas, list):
            normalizado["alternativas"] = [
                item.strip() if isinstance(item, str) else item
                for item in alternativas
            ]

        return normalizado

    @validates_schema
    def validar_questao(self, data, **kwargs):
        alternativas = data.get("alternativas") or []
        alternativa_correta = data.get("alternativa_correta")

        alternativas_normalizadas = [
            alternativa.strip().lower()
            for alternativa in alternativas
            if isinstance(alternativa, str)
        ]

        if len(alternativas_normalizadas) != len(set(alternativas_normalizadas)):
            raise ValidationError({
                "alternativas": ["As alternativas não podem conter textos duplicados."]
            })

        if alternativa_correta is not None and alternativa_correta >= len(alternativas):
            raise ValidationError({
                "alternativa_correta": [
                    "Alternativa correta deve apontar para uma alternativa existente."
                ]
            })


class BaseAtividadeSchema(Schema):
    """
    Schema fechado para atividade educacional com múltiplas questões.

    Campos aceitos pelo cliente:
    - titulo: obrigatório no POST/PUT;
    - questoes: obrigatório no POST/PUT;
    - descricao: opcional;
    - professores_ids: opcional, lista de IDs de professores adicionais.

    O campo max_alunos é técnico e será definido pela equipe técnica depois de teste de carga.
    """

    class Meta:
        unknown = RAISE

    titulo = fields.Str(
        required=True,
        validate=validate.Length(min=1, max=120),
        error_messages={
            "required": "Título é obrigatório.",
            "invalid": "Título deve ser texto.",
            "null": "Título não pode ser nulo.",
        },
    )

    questoes = fields.List(
        fields.Nested(QuestaoSchema),
        required=True,
        validate=validate.Length(min=1, max=30),
        error_messages={
            "required": "A atividade deve conter ao menos uma questão.",
            "invalid": "Questões devem ser enviadas em uma lista.",
            "null": "Questões não podem ser nulas.",
        },
    )

    descricao = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=1000),
        error_messages={
            "invalid": "Descrição deve ser texto.",
        },
    )

    professores_ids = fields.List(
        fields.Str(
            validate=validate.Length(min=1, max=80),
            error_messages={
                "invalid": "Cada professor deve ser informado pelo ID textual do usuário.",
                "null": "A lista de professores não pode conter valores nulos.",
            },
        ),
        required=False,
        allow_none=True,
        validate=validate.Length(max=10),
        error_messages={
            "invalid": "Professores devem ser informados in uma lista de IDs.",
        },
    )

    insignia_titulo = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=120),
    )

    insignia_descricao = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=1000),
    )

    insignia_imagem_url = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=1000),
    )

    insignia_porcentagem_minima = fields.Int(
        required=False,
        allow_none=True,
        validate=validate.Range(min=0, max=100),
    )

    @pre_load
    def normalizar_strings(self, data, **kwargs):
        if not isinstance(data, dict):
            return data

        normalizado = dict(data)

        for campo in ["titulo", "descricao", "insignia_titulo", "insignia_descricao", "insignia_imagem_url"]:
            valor = normalizado.get(campo)
            if isinstance(valor, str):
                normalizado[campo] = valor.strip()

        if normalizado.get("descricao") == "":
            normalizado["descricao"] = None

        if normalizado.get("insignia_titulo") == "":
            normalizado["insignia_titulo"] = None

        if normalizado.get("insignia_descricao") == "":
            normalizado["insignia_descricao"] = None

        if normalizado.get("insignia_imagem_url") == "":
            normalizado["insignia_imagem_url"] = None

        professores_ids = normalizado.get("professores_ids")
        if isinstance(professores_ids, list):
            normalizado["professores_ids"] = [
                item.strip() if isinstance(item, str) else item
                for item in professores_ids
            ]

        return normalizado

    @validates_schema
    def validar_regras_de_negocio(self, data, **kwargs):
        professores_ids = data.get("professores_ids")

        if professores_ids is not None:
            professores_normalizados = [
                professor_id.strip()
                for professor_id in professores_ids
                if isinstance(professor_id, str)
            ]

            if len(professores_normalizados) != len(set(professores_normalizados)):
                raise ValidationError({
                    "professores_ids": [
                        "A lista de professores não pode conter IDs duplicados."
                    ]
                })

        # Validar consistência dos campos da insígnia (FE02 / RN06)
        # Campos: insignia_titulo, insignia_descricao, insignia_imagem_url, insignia_porcentagem_minima
        insignia_campos = {
            "insignia_titulo": data.get("insignia_titulo"),
            "insignia_descricao": data.get("insignia_descricao"),
            "insignia_imagem_url": data.get("insignia_imagem_url"),
            "insignia_porcentagem_minima": data.get("insignia_porcentagem_minima"),
        }

        # Identifica se algum campo foi preenchido
        campos_preenchidos = {k: v for k, v in insignia_campos.items() if v is not None and v != ""}

        if campos_preenchidos and len(campos_preenchidos) < 4:
            erros_insignia = {}
            for campo, valor in insignia_campos.items():
                if valor is None or valor == "":
                    erros_insignia[campo] = ["Todos os campos da insígnia (título, descrição, imagem e porcentagem mínima) devem ser preenchidos se um deles for especificado."]
            raise ValidationError(erros_insignia)


class AtividadeSchema(BaseAtividadeSchema):
    """Schema usado em POST e PUT."""
    pass


class AtividadePatchSchema(BaseAtividadeSchema):
    """Schema usado em PATCH. Todos os campos são opcionais."""

    titulo = fields.Str(
        required=False,
        validate=validate.Length(min=1, max=120),
        allow_none=False,
        error_messages={
            "invalid": "Título deve ser texto.",
            "null": "Título não pode ser nulo.",
        },
    )

    questoes = fields.List(
        fields.Nested(QuestaoSchema),
        required=False,
        validate=validate.Length(min=1, max=30),
        allow_none=False,
        error_messages={
            "invalid": "Questões devem ser enviadas em uma lista.",
            "null": "Questões não podem ser nulas.",
        },
    )

    descricao = fields.Str(
        required=False,
        allow_none=True,
        validate=validate.Length(max=1000),
        error_messages={
            "invalid": "Descrição deve ser texto.",
        },
    )

    professores_ids = fields.List(
        fields.Str(
            validate=validate.Length(min=1, max=80),
            error_messages={
                "invalid": "Cada professor deve ser informado pelo ID textual do usuário.",
                "null": "A lista de professores não pode conter valores nulos.",
            },
        ),
        required=False,
        allow_none=True,
        validate=validate.Length(max=10),
        error_messages={
            "invalid": "Professores devem ser informados em uma lista de IDs.",
        },
    )
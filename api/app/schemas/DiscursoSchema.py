from marshmallow import Schema, fields

class DiscursoSchema(Schema):
    id = fields.Str(dump_only=True)
    texto = fields.Str(required=True)
    data_criacao = fields.DateTime(dump_only=True)
    idioma = fields.Str(required=True)
    discurso_categoria = fields.Str(required=True)
    usuario = fields.Str(required=True)

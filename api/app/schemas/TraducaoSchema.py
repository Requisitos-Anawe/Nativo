from marshmallow import Schema, fields

class TraducaoSchema(Schema):
    id = fields.Str(dump_only=True)
    texto = fields.Str(required=True)
    data_criacao = fields.DateTime(dump_only=True)
    idioma = fields.Str(required=True)
    discurso = fields.Str(required=True)
    usuario = fields.Str(required=True)

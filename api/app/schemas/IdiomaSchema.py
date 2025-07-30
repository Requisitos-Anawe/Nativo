from marshmallow import Schema, fields

class IdiomaSchema(Schema):
    id = fields.Str(dump_only=True)
    nome = fields.Str(required=True)
    data_criacao = fields.DateTime(dump_only=True)

from marshmallow import Schema, fields

class ReporteTipoSchema(Schema):
    id = fields.Str(dump_only=True)
    descricao = fields.Str(required=True)
    data_criacao = fields.DateTime(dump_only=True)

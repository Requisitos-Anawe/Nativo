from marshmallow import Schema, fields

class ReporteSchema(Schema):
    id = fields.Str(dump_only=True)
    descricao = fields.Str(required=True)
    data_criacao = fields.DateTime(dump_only=True)
    reporte_tipo = fields.Str(required=True)
    usuario = fields.Str(required=True)

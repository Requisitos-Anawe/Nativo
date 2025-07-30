from app.helpers.validation import validate_ref_exists
from marshmallow import validates_schema, fields, ValidationError, Schema
from app.firebase import db

class UsuarioSchema(Schema):
    id = fields.Str(dump_only=True)
    cpf = fields.Str(required=True)
    email = fields.Email(required=True)
    senha = fields.Str(required=True, load_only=True)
    data_nascimento = fields.DateTime(required=True)
    nome = fields.Str(required=True)
    data_criacao = fields.DateTime(dump_only=True)
    perfil = fields.Str(required=True, validate=validate_ref_exists("perfil"))

    @validates_schema
    def validate_unique(self, data, **kwargs):
        cpf = data.get('cpf')
        email = data.get('email')
        
        if cpf:
            usuarios = db.collection('usuario').where('cpf', '==', cpf).stream()
            if any(True for _ in usuarios):
                raise ValidationError('CPF já cadastrado.', field_name='cpf')
        
        if email:
            usuarios = db.collection('usuario').where('email', '==', email).stream()
            if any(True for _ in usuarios):
                raise ValidationError('Email já cadastrado.', field_name='email')
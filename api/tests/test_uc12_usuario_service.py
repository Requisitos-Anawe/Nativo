from unittest.mock import MagicMock

from app.services import UsuarioService as service


class FakeDoc:
    def __init__(self, doc_id, data=None, exists=True):
        self.id = doc_id
        self._data = data or {}
        self.exists = exists

    def to_dict(self):
        return dict(self._data)


def _db_usuario_existente(usuario_id="user1"):
    usuario_doc = FakeDoc(
        usuario_id,
        {
            "nome": "Pedro",
            "email": "pedro@teste.com",
            "cpf": "12345678901",
            "perfil": "padrão",
        },
        exists=True,
    )

    usuario_ref = MagicMock()
    usuario_ref.get.return_value = usuario_doc

    collection = MagicMock()
    collection.document.return_value = usuario_ref
    collection.where.return_value.stream.return_value = []

    db = MagicMock()
    db.collection.return_value = collection
    return db, usuario_ref, collection


def test_atualizar_dados_usuario_atualiza_nome_email_data_foto_e_imagem(monkeypatch):
    db, usuario_ref, _ = _db_usuario_existente()
    monkeypatch.setattr(service, "db", db)

    resultado = service.atualizar_dados_usuario(
        "user1",
        {
            "nome": "  Pedro Silva  ",
            "email": "PEDRO@TESTE.COM",
            "data_nascimento": "2000-01-01",
            "imagem_url": "https://cdn/avatar.png",
            "foto": "foto-base64",
        },
    )

    assert isinstance(resultado, dict)
    usuario_ref.update.assert_called_once()
    payload = usuario_ref.update.call_args.args[0]
    assert payload["nome"] == "Pedro Silva"
    assert payload["email"] == "pedro@teste.com"
    assert payload["imagem_url"] == "https://cdn/avatar.png"
    assert payload["foto"] == "foto-base64"
    assert "data_nascimento" in payload
    assert "data_atualizacao" in payload


def test_atualizar_dados_usuario_rejeita_nome_vazio(monkeypatch):
    db, usuario_ref, _ = _db_usuario_existente()
    monkeypatch.setattr(service, "db", db)

    resultado = service.atualizar_dados_usuario("user1", {"nome": "   "})

    assert resultado == "Nome não pode ser vazio"
    usuario_ref.update.assert_not_called()


def test_atualizar_dados_usuario_rejeita_email_invalido(monkeypatch):
    db, usuario_ref, _ = _db_usuario_existente()
    monkeypatch.setattr(service, "db", db)

    resultado = service.atualizar_dados_usuario("user1", {"email": "email-invalido"})

    assert resultado == "E-mail inválido"
    usuario_ref.update.assert_not_called()


def test_atualizar_dados_usuario_rejeita_email_ja_usado_por_outro_usuario(monkeypatch):
    db, usuario_ref, collection = _db_usuario_existente()
    collection.where.return_value.stream.return_value = [FakeDoc("outro", {"email": "usado@teste.com"})]
    monkeypatch.setattr(service, "db", db)

    resultado = service.atualizar_dados_usuario("user1", {"email": "usado@teste.com"})

    assert resultado == "Email já cadastrado"
    usuario_ref.update.assert_not_called()


def test_atualizar_dados_usuario_rejeita_data_nascimento_invalida(monkeypatch):
    db, usuario_ref, _ = _db_usuario_existente()
    monkeypatch.setattr(service, "db", db)

    resultado = service.atualizar_dados_usuario("user1", {"data_nascimento": "data inválida"})

    assert resultado == "Data de nascimento inválida"
    usuario_ref.update.assert_not_called()


def test_atualizar_dados_usuario_rejeita_senha_invalida(monkeypatch):
    db, usuario_ref, _ = _db_usuario_existente()
    monkeypatch.setattr(service, "db", db)
    monkeypatch.setattr(service, "validar_senha", lambda senha: (False, ["mínimo de 8 caracteres"]))

    resultado = service.atualizar_dados_usuario("user1", {"senha": "123"})

    assert resultado == {"erro": "Senha inválida", "detalhes": ["mínimo de 8 caracteres"]}
    usuario_ref.update.assert_not_called()


def test_atualizar_dados_usuario_hasheia_senha_valida(monkeypatch):
    db, usuario_ref, _ = _db_usuario_existente()
    monkeypatch.setattr(service, "db", db)
    monkeypatch.setattr(service, "validar_senha", lambda senha: (True, []))
    monkeypatch.setattr(service.bcrypt, "gensalt", lambda: b"salt")
    monkeypatch.setattr(service.bcrypt, "hashpw", lambda senha, salt: b"hash-gerado")

    resultado = service.atualizar_dados_usuario("user1", {"senha": "SenhaValida123!"})

    assert isinstance(resultado, dict)
    payload = usuario_ref.update.call_args.args[0]
    assert payload["senha"] == "hash-gerado"


def test_atualizar_dados_usuario_respeita_campos_permitidos(monkeypatch):
    db, usuario_ref, _ = _db_usuario_existente()
    monkeypatch.setattr(service, "db", db)

    service.atualizar_dados_usuario(
        "user1",
        {"nome": "Novo Nome", "email": "novo@teste.com"},
        campos_permitidos=["nome"],
    )

    payload = usuario_ref.update.call_args.args[0]
    assert payload["nome"] == "Novo Nome"
    assert "email" not in payload


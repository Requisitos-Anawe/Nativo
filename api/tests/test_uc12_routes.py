from unittest.mock import patch

import pytest
from flask import Flask


@pytest.fixture
def auth_headers():
    return {"Authorization": "Bearer token-valido"}


@pytest.fixture
def favorito_client():
    from app.routes.FavoritoRoute import bp

    app = Flask(__name__)
    app.register_blueprint(bp)
    return app.test_client()


@pytest.fixture
def historico_client():
    from app.routes.HistoricoRoute import bp

    app = Flask(__name__)
    app.register_blueprint(bp)
    return app.test_client()


@pytest.fixture
def usuario_client():
    from app.routes.UsuarioRoute import bp

    app = Flask(__name__)
    app.register_blueprint(bp)
    return app.test_client()


@pytest.fixture(autouse=True)
def jwt_valido():
    with patch("app.middlewares.autenticar_jwt.jwt.decode", return_value={"usuario_id": "user1"}):
        yield


def test_rota_alternar_favorito_chama_service_com_usuario_autenticado(favorito_client, auth_headers):
    with patch("app.routes.FavoritoRoute.alternar_favorito", return_value=({"favoritado": True}, 201)) as service:
        response = favorito_client.post("/traducao/trad1/favorito", headers=auth_headers)

    assert response.status_code == 201
    assert response.get_json() == {"favoritado": True}
    service.assert_called_once_with("user1", "trad1")


def test_rota_listar_favoritos_limita_valor_maximo_para_100(favorito_client, auth_headers):
    with patch("app.routes.FavoritoRoute.listar_favoritos_usuario", return_value=({"dados": []}, 200)) as service:
        response = favorito_client.get("/usuarios/me/favoritos?limit=150", headers=auth_headers)

    assert response.status_code == 200
    service.assert_called_once_with("user1", limit=100)


def test_rota_listar_favoritos_rejeita_limit_menor_que_um(favorito_client, auth_headers):
    with patch("app.routes.FavoritoRoute.listar_favoritos_usuario") as service:
        response = favorito_client.get("/usuarios/me/favoritos?limit=0", headers=auth_headers)

    assert response.status_code == 400
    assert response.get_json() == {"erro": "O parâmetro limit deve ser maior que zero"}
    service.assert_not_called()


def test_rota_registrar_historico_rejeita_termo_obrigatorio(historico_client, auth_headers):
    response = historico_client.post("/usuarios/me/historico", json={}, headers=auth_headers)

    assert response.status_code == 400
    assert response.get_json() == {"erro": "Campo termo_pesquisado é obrigatório"}


def test_rota_registrar_historico_chama_service(historico_client, auth_headers):
    with patch(
        "app.routes.HistoricoRoute.HistoricoService.registrar_consulta",
        return_value=({"id": "hist1"}, 201),
    ) as service:
        response = historico_client.post(
            "/usuarios/me/historico",
            json={"termo_pesquisado": "casa", "traducao_resultado": "oka"},
            headers=auth_headers,
        )

    assert response.status_code == 201
    assert response.get_json() == {"id": "hist1"}
    service.assert_called_once_with(
        usuario_id="user1",
        termo_pesquisado="casa",
        traducao_resultado="oka",
    )


def test_rota_listar_historico_rejeita_limit_invalido(historico_client, auth_headers):
    response = historico_client.get("/usuarios/me/historico?limit=abc", headers=auth_headers)

    assert response.status_code == 400
    assert response.get_json() == {"erro": "Parâmetro limit inválido"}


def test_rota_deletar_item_historico_chama_service(historico_client, auth_headers):
    with patch(
        "app.routes.HistoricoRoute.HistoricoService.deletar_item_historico_usuario",
        return_value=({"mensagem": "ok"}, 200),
    ) as service:
        response = historico_client.delete("/usuarios/me/historico/hist1", headers=auth_headers)

    assert response.status_code == 200
    service.assert_called_once_with(usuario_id="user1", historico_id="hist1")


def test_rota_atualizar_usuario_rejeita_payload_vazio(usuario_client, auth_headers):
    response = usuario_client.put("/usuarios/user1", json={}, headers=auth_headers)

    assert response.status_code == 400
    assert response.get_json() == {"erro": "Dados não fornecidos"}


def test_rota_atualizar_usuario_rejeita_campo_perfil(usuario_client, auth_headers):
    with patch("app.routes.UsuarioRoute.UsuarioService.buscar_usuario_por_id", return_value={"id": "user1"}):
        response = usuario_client.put(
            "/usuarios/user1",
            json={"perfil": "admin"},
            headers=auth_headers,
        )

    assert response.status_code == 400
    assert response.get_json() == {"erro": "O campo perfil deve ser alterado apenas pelo endpoint específico de perfil"}


def test_rota_atualizar_proprio_usuario_chama_service_com_campos_completos(usuario_client, auth_headers):
    with patch("app.routes.UsuarioRoute.UsuarioService.buscar_usuario_por_id", return_value={"id": "user1"}), patch(
        "app.routes.UsuarioRoute.UsuarioService.atualizar_dados_usuario",
        return_value={"id": "user1", "nome": "Novo Nome"},
    ) as service:
        response = usuario_client.put(
            "/usuarios/user1",
            json={"nome": "Novo Nome"},
            headers=auth_headers,
        )

    assert response.status_code == 200
    assert response.get_json() == {"id": "user1", "nome": "Novo Nome"}
    service.assert_called_once()
    assert service.call_args.args[0] == "user1"
    assert service.call_args.args[1] == {"nome": "Novo Nome"}
    assert set(service.call_args.kwargs["campos_permitidos"]) == {
        "nome",
        "data_nascimento",
        "email",
        "senha",
        "imagem_url",
        "foto",
    }


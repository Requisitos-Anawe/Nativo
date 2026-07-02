import unittest
from unittest.mock import patch
from flask import Flask, g
from app.routes.UsuarioRoute import (
    _campos_permitidos_para_atualizacao,
    CAMPOS_USUARIO_COMPLETO,
    editar_status_usuario,
)


class TestUsuarioRoutePermissoes(unittest.TestCase):

    def setUp(self):
        self.app = Flask(__name__)

    def _executar_editar_status(self, usuario_alvo_id, usuario_id, payload=None):
        with self.app.test_request_context(json=payload or {'status': 'banido', 'motivo': 'teste'}):
            g.usuario_id = usuario_id
            return editar_status_usuario.__wrapped__.__wrapped__(usuario_alvo_id)

    @patch('app.routes.UsuarioRoute._perfil')
    def test_admin_pode_editar_qualquer_usuario_como_administrador(self, mock_perfil):
        mock_perfil.side_effect = lambda uid: 'admin' if uid == 1 else 'padrão'
        campos, erro = _campos_permitidos_para_atualizacao(usuario_logado_id=1, usuario_alvo_id=2)
        self.assertEqual(campos, CAMPOS_USUARIO_COMPLETO)
        self.assertIsNone(erro)

    @patch('app.routes.UsuarioRoute._perfil')
    def test_moderador_nao_pode_editar_usuarios(self, mock_perfil):
        mock_perfil.side_effect = lambda uid: 'moderador' if uid == 1 else 'admin'
        campos, erro = _campos_permitidos_para_atualizacao(usuario_logado_id=1, usuario_alvo_id=2)
        self.assertIsNone(campos)
        self.assertEqual(erro[1], 403)
        self.assertIn('Moderadores não podem editar', erro[0]['erro'])

    @patch('app.routes.UsuarioRoute.UsuarioService')
    def test_moderador_nao_pode_realizar_acoes_de_gestao(self, mock_service):
        mock_service.buscar_usuario_por_id.return_value = {'perfil': 'moderador'}

        response, status_code = self._executar_editar_status('id_alvo', 'id_moderador')

        self.assertEqual(status_code, 403)
        self.assertIn('Acesso negado', response.json['erro'])

    @patch('app.routes.UsuarioRoute.UsuarioService')
    def test_usuario_comum_nao_pode_realizar_acoes_de_gestao(self, mock_service):
        mock_service.buscar_usuario_por_id.return_value = {'perfil': 'padrão'}

        response, status_code = self._executar_editar_status('id_alvo', 'id_usuario')

        self.assertEqual(status_code, 403)
        self.assertIn('Acesso negado', response.json['erro'])

    @patch('app.routes.UsuarioRoute.UsuarioService')
    @patch('app.routes.UsuarioRoute.db.collection')
    def test_admin_nao_pode_banir_ultimo_admin(self, mock_collection, mock_service):
        mock_service.buscar_usuario_por_id.side_effect = [
            {'perfil': 'admin'},
            {'perfil': 'admin'},
        ]

        class DocFake:
            id = 'id_admin'

            def to_dict(self):
                return {'perfil': 'admin', 'status': 'ativo'}

        mock_collection.return_value.stream.return_value = [DocFake()]

        response, status_code = self._executar_editar_status('id_admin', 'id_admin')

        self.assertEqual(status_code, 400)
        self.assertIn('Operação bloqueada', response.json['erro'])

    @patch('app.routes.UsuarioRoute.UsuarioService')
    def test_admin_pode_banir_usuario_comum(self, mock_service):
        mock_service.buscar_usuario_por_id.side_effect = [
            {'perfil': 'admin'},
            {'perfil': 'padrão'},
        ]
        mock_service.atualizar_status_usuario.return_value = None

        response, status_code = self._executar_editar_status('id_alvo', 'id_admin')

        self.assertEqual(status_code, 200)
        self.assertIn('Status do usuário atualizado', response.json['mensagem'])

    @patch('app.routes.UsuarioRoute._perfil')
    def test_professor_nao_pode_editar_usuarios(self, mock_perfil):
        mock_perfil.side_effect = lambda uid: 'professor' if uid == 1 else 'padrão'
        campos, erro = _campos_permitidos_para_atualizacao(usuario_logado_id=1, usuario_alvo_id=2)
        self.assertIsNone(campos)
        self.assertEqual(erro[1], 403)
        self.assertIn('Usuário não autorizado', erro[0]['erro'])

    @patch('app.routes.UsuarioRoute.UsuarioService')
    def test_professor_nao_pode_banir_usuarios(self, mock_service):
        mock_service.buscar_usuario_por_id.return_value = {'perfil': 'professor'}

        response, status_code = self._executar_editar_status('id_alvo', 'id_professor')

        self.assertEqual(status_code, 403)
        self.assertIn('Acesso negado', response.json['erro'])


if __name__ == '__main__':
    unittest.main()
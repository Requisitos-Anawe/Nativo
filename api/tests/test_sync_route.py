import importlib
import unittest
from unittest.mock import patch
from flask import Flask


class TestSyncRoute(unittest.TestCase):
    def _criar_cliente(self, bypass_auth=False):
        if bypass_auth:
            with patch('app.middlewares.autenticar_jwt.autenticar_jwt', new=lambda f: f):
                import app.routes.SyncRoute as sync_route_module
                importlib.reload(sync_route_module)
                app = Flask(__name__)
                app.register_blueprint(sync_route_module.sync_bp, url_prefix='/api')
                return app.test_client(), sync_route_module

        import app.routes.SyncRoute as sync_route_module
        importlib.reload(sync_route_module)
        app = Flask(__name__)
        app.register_blueprint(sync_route_module.sync_bp, url_prefix='/api')
        return app.test_client(), sync_route_module

    def test_sync_banco_traducoes_sucesso(self):
        client, sync_route_module = self._criar_cliente(bypass_auth=True)

        with patch.object(sync_route_module.SyncService, 'gerar_banco_traducoes_sync') as mock_gerar_banco:
            mock_gerar_banco.return_value = {
                'discursos': [{'id': '1', 'texto': 'Olá'}],
                'traducoes': [{'id': '10', 'discurso_id': '1', 'texto': 'Hi'}],
            }

            response = client.get(
                '/api/sync/banco_traducoes',
                headers={'Authorization': 'Bearer token-fake'}
            )

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json(), mock_gerar_banco.return_value)
            self.assertIn('Content-Length', response.headers)

    def test_sync_banco_traducoes_sem_token(self):
        client, sync_route_module = self._criar_cliente(bypass_auth=False)

        with patch.object(sync_route_module.SyncService, 'gerar_banco_traducoes_sync') as mock_gerar_banco:
            response = client.get('/api/sync/banco_traducoes')

            self.assertEqual(response.status_code, 401)
            self.assertIn('erro', response.get_json())
            mock_gerar_banco.assert_not_called()

    def test_sync_banco_traducoes_erro_interno(self):
        client, sync_route_module = self._criar_cliente(bypass_auth=True)

        with patch.object(sync_route_module.SyncService, 'gerar_banco_traducoes_sync', side_effect=Exception('erro de teste')):
            response = client.get(
                '/api/sync/banco_traducoes',
                headers={'Authorization': 'Bearer token-fake'}
            )

            self.assertEqual(response.status_code, 500)
            self.assertIn('erro', response.get_json())

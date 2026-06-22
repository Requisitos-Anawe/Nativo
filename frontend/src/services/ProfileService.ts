import api from './api';

export async function buscarMeuPerfil() {
  const response = await api.get('/usuarios/me');
  return response.data;
}

export async function atualizarUsuario(
  usuarioId: string,
  dados: {
    nome?: string;
    email?: string;
    senha?: string;
    data_nascimento?: string;
  },
) {
  const response = await api.put(`/usuarios/${usuarioId}`, dados);
  return response.data;
}

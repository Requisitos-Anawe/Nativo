import api from './api';

export async function listarFavoritos(limit = 50) {
  const response = await api.get(`/usuarios/me/favoritos?limit=${limit}`);
  return response.data;
}

export async function alternarFavorito(traducaoId: string) {
  const response = await api.post(`/traducao/${traducaoId}/favorito`);
  return response.data;
}

export async function statusFavorito(traducaoId: string) {
  const response = await api.get(`/traducao/${traducaoId}/favorito`);
  return response.data;
}

export async function removerFavorito(traducaoId: string) {
  const response = await api.delete(`/traducao/${traducaoId}/favorito`);
  return response.data;
}

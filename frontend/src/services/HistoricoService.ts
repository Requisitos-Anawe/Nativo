import api from './api';

export async function listarHistorico(limit = 10) {
  const response = await api.get(`/usuarios/me/historico?limit=${limit}`);
  return response.data;
}

export async function registrarHistorico(dados: {
  termo_pesquisado: string;
  traducao_resultado?: string;
}) {
  const response = await api.post('/usuarios/me/historico', dados);
  return response.data;
}

export async function removerHistoricoItem(historicoId: string) {
  const response = await api.delete(`/usuarios/me/historico/${historicoId}`);
  return response.data;
}

export async function limparHistorico() {
  const response = await api.delete('/usuarios/me/historico');
  return response.data;
}

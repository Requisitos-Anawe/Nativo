import api from './api';

import {
  BuscarPraticaAtividadeResponse,
  ListaPraticaAtividadesResponse,
  ResultadoAtividadeResponse,
} from '../interfaces/PraticaAtividadeInterface';

export async function listarAtividadesPratica(): Promise<ListaPraticaAtividadesResponse> {
  const response = await api.get<ListaPraticaAtividadesResponse>(
    '/pratica/atividades',
  );

  return response.data;
}

export async function buscarAtividadePratica(
  atividadeId: string,
): Promise<BuscarPraticaAtividadeResponse> {
  const response = await api.get<BuscarPraticaAtividadeResponse>(
    `/pratica/atividades/${atividadeId}`,
  );

  return response.data;
}

export async function submeterAtividadePratica(
  atividadeId: string,
  respostas: number[],
): Promise<ResultadoAtividadeResponse> {
  const response = await api.post<ResultadoAtividadeResponse>(
    `/pratica/atividades/${atividadeId}/responder`,
    {respostas},
  );

  return response.data;
}

export async function buscarResultadoAtividade(
  atividadeId: string,
): Promise<ResultadoAtividadeResponse> {
  const response = await api.get<ResultadoAtividadeResponse>(
    `/pratica/atividades/${atividadeId}/resultado`,
  );

  return response.data;
}

export async function reiniciarAtividadePratica(
  atividadeId: string,
): Promise<BuscarPraticaAtividadeResponse> {
  const response = await api.post<BuscarPraticaAtividadeResponse>(
    `/pratica/atividades/${atividadeId}/reiniciar`,
  );

  return response.data;
}
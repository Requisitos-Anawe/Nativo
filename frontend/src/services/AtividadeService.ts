import api from './api';

import {
  Atividade,
  AtividadeListResponse,
  AtividadePayload,
  AtividadeSingleResponse,
  ProfessorOption,
} from '../interfaces/AtividadeInterface';

type UsuarioApi = {
  id: string;
  nome?: string;
  email?: string;
  perfil?:
    | string
    | {
        id?: string;
        descricao?: string;
      };
};

const isProfessor = (usuario: UsuarioApi): boolean => {
  if (typeof usuario.perfil === 'string') {
    return usuario.perfil.toLowerCase() === 'professor';
  }

  return usuario.perfil?.descricao?.toLowerCase() === 'professor';
};

export async function listarAtividades(
  limit = 20,
  cursor?: string | null,
): Promise<AtividadeListResponse> {
  const params: Record<string, string | number> = {limit};

  if (cursor) {
    params.cursor = cursor;
  }

  const response = await api.get<AtividadeListResponse>('/atividades', {
    params,
  });

  return response.data;
}

export async function buscarAtividade(atividadeId: string): Promise<Atividade> {
  const response = await api.get<AtividadeSingleResponse>(
    `/atividades/${atividadeId}`,
  );

  return response.data.dados;
}

export async function criarAtividade(
  payload: AtividadePayload,
): Promise<Atividade> {
  const response = await api.post<AtividadeSingleResponse>(
    '/atividades',
    payload,
  );

  return response.data.dados;
}

export async function atualizarAtividade(
  atividadeId: string,
  payload: AtividadePayload,
): Promise<Atividade> {
  const response = await api.put<AtividadeSingleResponse>(
    `/atividades/${atividadeId}`,
    payload,
  );

  return response.data.dados;
}

export async function atualizarAtividadeParcial(
  atividadeId: string,
  payload: Partial<AtividadePayload>,
): Promise<Atividade> {
  const response = await api.patch<AtividadeSingleResponse>(
    `/atividades/${atividadeId}`,
    payload,
  );

  return response.data.dados;
}

export async function excluirAtividade(atividadeId: string): Promise<void> {
  await api.delete(`/atividades/${atividadeId}`);
}

export async function listarProfessores(): Promise<ProfessorOption[]> {
  const response = await api.get<UsuarioApi[]>('/usuarios');

  return response.data
    .filter(isProfessor)
    .map(usuario => ({
      id: usuario.id,
      nome: usuario.nome || 'Professor sem nome',
      email: usuario.email || '',
    }));
}
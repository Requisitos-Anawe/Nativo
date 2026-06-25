import api from './api';
import { ObterInsigniasResponse } from '../interfaces/InsigniaInterface';

export async function obterInsigniasUsuario(usuarioId: string): Promise<ObterInsigniasResponse> {
  const response = await api.get<ObterInsigniasResponse>(`/usuarios/${usuarioId}/insignias`);
  return response.data;
}

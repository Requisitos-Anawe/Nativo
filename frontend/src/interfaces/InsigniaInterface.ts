export interface Insignia {
  id: string;
  titulo: string;
  descricao: string;
  imagem: string;
  imagem_bloqueada: string;
  limite: number | null;
  adquirida: boolean;
  data_conquista?: string | null;
}

export interface ObterInsigniasResponse {
  total_atividades: number;
  insignias: Insignia[];
}

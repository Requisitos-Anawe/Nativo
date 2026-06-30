export interface FavoritoTraducaoResumo {
  id: string;
  discurso?: string;
  texto?: string;
  idioma?: string;
  imagem_url?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
}

export interface FavoritoItem {
  id: string;
  traducao_id: string;
  data_favorito?: string;
  traducao?: FavoritoTraducaoResumo | null;
}

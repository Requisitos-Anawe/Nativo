export interface QuestaoAtividade {
  enunciado: string;
  alternativas: string[];
  alternativa_correta: number;
}

export interface AtividadePayload {
  titulo: string;
  descricao?: string | null;
  questoes: QuestaoAtividade[];
  professores_ids?: string[] | null;
  insignia_titulo?: string | null;
  insignia_descricao?: string | null;
  insignia_imagem_url?: string | null;
  insignia_porcentagem_minima?: number | null;
}

export interface Atividade extends AtividadePayload {
  id: string;
  professor_associado?: string;
  professores_associados?: string[];
  usuario_criador?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  max_alunos?: number | null;
}

export interface AtividadeListResponse {
  mensagem: string;
  dados: Atividade[];
  paginacao?: {
    limit: number;
    proximo_cursor?: string | null;
  };
}

export interface AtividadeSingleResponse {
  mensagem: string;
  dados: Atividade;
}

export interface ProfessorOption {
  id: string;
  nome: string;
  email: string;
}
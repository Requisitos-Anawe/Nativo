export interface PraticaAtividadeResumo {
  id: string;
  titulo: string;
  descricao?: string | null;
  total_questoes: number;
  concluida: boolean;
  resultado?: ResultadoAtividade | null;
  data_criacao?: string;
  data_atualizacao?: string;
}

export interface QuestaoPratica {
  enunciado: string;
  alternativas: string[];
}

export interface ExercicioAtividade {
  id: string;
  titulo: string;
  descricao?: string | null;
  questoes: QuestaoPratica[];
  total_questoes: number;
}

export interface ResultadoResposta {
  questao_index: number;
  resposta: number;
  correta: number;
  acertou: boolean;
}

export interface ResultadoAtividade {
  id: string;
  atividade_id: string;
  atividade_titulo: string;
  acertos: number;
  erros: number;
  total: number;
  percentual: number;
  respostas: ResultadoResposta[];
  concluida: boolean;
  data_criacao?: string;
  data_atualizacao?: string;
}

export interface ListaPraticaAtividadesResponse {
  mensagem: string;
  dados: PraticaAtividadeResumo[];
}

export interface BuscarPraticaAtividadeResponse {
  mensagem: string;
  status: 'pendente' | 'concluida';
  dados: ExercicioAtividade | ResultadoAtividade;
}

export interface ResultadoAtividadeResponse {
  mensagem: string;
  dados: ResultadoAtividade;
}
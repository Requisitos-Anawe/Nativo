export interface UsuarioPerfil {
  id: string;
  nome: string;
  email?: string;
  cpf_mascarado?: string;
  data_nascimento?: string;
  perfil?: string;
}

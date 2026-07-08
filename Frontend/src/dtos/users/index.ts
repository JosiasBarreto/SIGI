
export interface UserDTO {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
}
export interface CreateUserDTO {
  name: string;
  email: string;
  password?: string;
  role: string;
}
export interface UpdateUserDTO extends Partial<CreateUserDTO> {
  is_active?: boolean;
}
export interface ClienteDTO {
  id: number;
  nome: string;
  empresa?: string;
  nif?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  morada?: string;
  observacoes?: string;
}

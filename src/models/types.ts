export interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  dataNascimento: Date;
  telefone: string;
  email: string;
  endereco?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePacienteDTO {
  nome: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  endereco?: string;
}

export interface UpdatePacienteDTO {
  nome?: string;
  cpf?: string;
  dataNascimento?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

export interface Medico {
  id: string;
  nome: string;
  crm: string;
  especialidade: string;
  telefone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMedicoDTO {
  nome: string;
  crm: string;
  especialidade: string;
  telefone: string;
  email: string;
}

export interface UpdateMedicoDTO {
  nome?: string;
  crm?: string;
  especialidade?: string;
  telefone?: string;
  email?: string;
}
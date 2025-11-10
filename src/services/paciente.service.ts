import { PacienteRepository } from '../repositories/paciente.repository';
import { CreatePacienteDTO, UpdatePacienteDTO } from '../models/types';

export class PacienteService {
  private repository: PacienteRepository;

  constructor() {
    this.repository = new PacienteRepository();
  }

  async listarTodos() {
    return await this.repository.findAll();
  }

  async buscarPorId(id: string) {
    const paciente = await this.repository.findById(id);
    
    if (!paciente) {
      throw new Error('Paciente não encontrado');
    }

    return paciente;
  }

  async criar(data: CreatePacienteDTO) {
    // Validar CPF único
    const cpfExistente = await this.repository.findByCpf(data.cpf);
    if (cpfExistente) {
      throw new Error('CPF já cadastrado');
    }

    // Validar email único
    const emailExistente = await this.repository.findByEmail(data.email);
    if (emailExistente) {
      throw new Error('Email já cadastrado');
    }

    return await this.repository.create(data);
  }

  async atualizar(id: string, data: UpdatePacienteDTO) {
    // Verificar se paciente existe
    await this.buscarPorId(id);

    // Validar CPF único (se estiver sendo alterado)
    if (data.cpf) {
      const cpfExistente = await this.repository.findByCpf(data.cpf);
      if (cpfExistente && cpfExistente.id !== id) {
        throw new Error('CPF já cadastrado');
      }
    }

    // Validar email único (se estiver sendo alterado)
    if (data.email) {
      const emailExistente = await this.repository.findByEmail(data.email);
      if (emailExistente && emailExistente.id !== id) {
        throw new Error('Email já cadastrado');
      }
    }

    return await this.repository.update(id, data);
  }

  async deletar(id: string) {
    // Verificar se paciente existe
    await this.buscarPorId(id);

    return await this.repository.delete(id);
  }
}
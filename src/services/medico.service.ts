import { MedicoRepository } from '../repositories/medico.repository';
import { CreateMedicoDTO, UpdateMedicoDTO } from '../models/types';

export class MedicoService {
  private repository: MedicoRepository;

  constructor() {
    this.repository = new MedicoRepository();
  }

  async listarTodos() {
    return await this.repository.findAll();
  }

  async buscarPorId(id: string) {
    const medico = await this.repository.findById(id);
    
    if (!medico) {
      throw new Error('Médico não encontrado');
    }

    return medico;
  }

  async criar(data: CreateMedicoDTO) {
    // Validar CRM único
    const crmExistente = await this.repository.findByCrm(data.crm);
    if (crmExistente) {
      throw new Error('CRM já cadastrado');
    }

    // Validar email único
    const emailExistente = await this.repository.findByEmail(data.email);
    if (emailExistente) {
      throw new Error('Email já cadastrado');
    }

    return await this.repository.create(data);
  }

  async atualizar(id: string, data: UpdateMedicoDTO) {
    // Verificar se médico existe
    await this.buscarPorId(id);

    // Validar CRM único (se estiver sendo alterado)
    if (data.crm) {
      const crmExistente = await this.repository.findByCrm(data.crm);
      if (crmExistente && crmExistente.id !== id) {
        throw new Error('CRM já cadastrado');
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
    // Verificar se médico existe
    await this.buscarPorId(id);

    return await this.repository.delete(id);
  }
}
// src/repositories/paciente.repository.ts
import prisma from '../config/database';
import { CreatePacienteDTO, UpdatePacienteDTO } from '../models/types';

export class PacienteRepository {
  async findAll() {
    return await prisma.paciente.findMany({
      orderBy: { nome: 'asc' }
    });
  }

  async findById(id: string) {
    return await prisma.paciente.findUnique({
      where: { id }
    });
  }

  async findByCpf(cpf: string) {
    return await prisma.paciente.findUnique({
      where: { cpf }
    });
  }

  async findByEmail(email: string) {
    return await prisma.paciente.findUnique({
      where: { email }
    });
  }

  async create(data: CreatePacienteDTO) {
    return await prisma.paciente.create({
      data: {
        ...data,
        dataNascimento: new Date(data.dataNascimento)
      }
    });
  }

  async update(id: string, data: UpdatePacienteDTO) {
    const updateData: any = { ...data };
    
    if (data.dataNascimento) {
      updateData.dataNascimento = new Date(data.dataNascimento);
    }

    return await prisma.paciente.update({
      where: { id },
      data: updateData
    });
  }

  async delete(id: string) {
    return await prisma.paciente.delete({
      where: { id }
    });
  }
}
import prisma from '../config/database';
import { CreateMedicoDTO, UpdateMedicoDTO } from '../models/types';

export class MedicoRepository {
  async findAll() {
    return await prisma.medico.findMany({
      orderBy: { nome: 'asc' }
    });
  }

  async findById(id: string) {
    return await prisma.medico.findUnique({
      where: { id }
    });
  }

  async findByCrm(crm: string) {
    return await prisma.medico.findUnique({
      where: { crm }
    });
  }

  async findByEmail(email: string) {
    return await prisma.medico.findUnique({
      where: { email }
    });
  }

  async create(data: CreateMedicoDTO) {
    return await prisma.medico.create({
      data
    });
  }

  async update(id: string, data: UpdateMedicoDTO) {
    return await prisma.medico.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return await prisma.medico.delete({
      where: { id }
    });
  }
}
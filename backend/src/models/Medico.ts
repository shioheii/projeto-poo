import { PrismaClient, Medico as MedicoPrisma } from '../../../generated/prisma';
import { BaseModel } from './BaseModel';

export interface IMedico {
  id?: string;
  nome: string;
  crm: string;
  especialidade: string;
  telefone: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Medico extends BaseModel<MedicoPrisma> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(data: IMedico): Promise<MedicoPrisma> {
    try {
      // Validações de negócio
      this.validateRequiredFields(data, ['nome', 'crm', 'especialidade', 'telefone', 'email']);
      this.validateEmail(data.email);
      this.validateCRM(data.crm);

      // Verificar se CRM já existe
      const existingMedico = await this.prisma.medico.findUnique({
        where: { crm: data.crm }
      });

      if (existingMedico) {
        throw new Error('CRM já cadastrado');
      }

      // Criar médico
      return await this.prisma.medico.create({
        data: {
          nome: data.nome,
          crm: data.crm,
          especialidade: data.especialidade,
          telefone: data.telefone,
          email: data.email
        }
      });
    } catch (error: any) {
      throw new Error(`Erro ao criar médico: ${error.message}`);
    }
  }

  async findById(id: string): Promise<MedicoPrisma | null> {
    try {
      return await this.prisma.medico.findUnique({
        where: { id }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar médico: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<IMedico>): Promise<MedicoPrisma> {
    try {
      if (data.email) {
        this.validateEmail(data.email);
      }

      if (data.crm) {
        this.validateCRM(data.crm);
        
        // Verificar se outro médico já usa esse CRM
        const existingMedico = await this.prisma.medico.findFirst({
          where: {
            crm: data.crm,
            NOT: { id }
          }
        });

        if (existingMedico) {
          throw new Error('CRM já está em uso por outro médico');
        }
      }

      return await this.prisma.medico.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Médico não encontrado');
      }
      throw new Error(`Erro ao atualizar médico: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.medico.delete({
        where: { id }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Médico não encontrado');
      }
      throw new Error(`Erro ao deletar médico: ${error.message}`);
    }
  }

  async list(page: number = 1, limit: number = 10): Promise<{ data: MedicoPrisma[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.medico.findMany({
          skip,
          take: limit,
          orderBy: { nome: 'asc' }
        }),
        this.prisma.medico.count()
      ]);

      return { data, total };
    } catch (error: any) {
      throw new Error(`Erro ao listar médicos: ${error.message}`);
    }
  }

  async findByEspecialidade(especialidade: string): Promise<MedicoPrisma[]> {
    try {
      return await this.prisma.medico.findMany({
        where: { especialidade },
        orderBy: { nome: 'asc' }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar médicos por especialidade: ${error.message}`);
    }
  }

  private validateCRM(crm: string): void {
    if (!crm || crm.length < 4) {
      throw new Error('CRM inválido');
    }
  }
}
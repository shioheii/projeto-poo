import { PrismaClient, Consulta as ConsultaPrisma } from '../../../generated/prisma';
import { BaseModel } from './BaseModel';

export interface IConsulta {
  id?: string;
  pacienteId: string;
  medicoId: string;
  dataHora: Date;
  status?: string;
  observacoes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Consulta extends BaseModel<ConsultaPrisma> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(data: IConsulta): Promise<ConsultaPrisma> {
    try {
      this.validateRequiredFields(data, ['pacienteId', 'medicoId', 'dataHora']);
      this.validateDataHora(data.dataHora);

      // Verificar conflitos de horário
      const conflito = await this.prisma.consulta.findFirst({
        where: {
          medicoId: data.medicoId,
          dataHora: data.dataHora,
          status: { in: ['AGENDADA', 'CONFIRMADA'] }
        }
      });

      if (conflito) {
        throw new Error('Já existe uma consulta agendada para este horário');
      }

      return await this.prisma.consulta.create({
        data: {
          pacienteId: data.pacienteId,
          medicoId: data.medicoId,
          dataHora: data.dataHora,
          status: data.status || 'AGENDADA',
          observacoes: data.observacoes
        },
        include: {
          paciente: true,
          medico: true
        }
      });
    } catch (error: any) {
      throw new Error(`Erro ao criar consulta: ${error.message}`);
    }
  }

  async findById(id: string): Promise<ConsultaPrisma | null> {
    try {
      return await this.prisma.consulta.findUnique({
        where: { id },
        include: {
          paciente: true,
          medico: true
        }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar consulta: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<IConsulta>): Promise<ConsultaPrisma> {
    try {
      if (data.dataHora) {
        this.validateDataHora(data.dataHora);
      }

      return await this.prisma.consulta.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          paciente: true,
          medico: true
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Consulta não encontrada');
      }
      throw new Error(`Erro ao atualizar consulta: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.consulta.delete({
        where: { id }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Consulta não encontrada');
      }
      throw new Error(`Erro ao deletar consulta: ${error.message}`);
    }
  }

  async list(page: number = 1, limit: number = 10): Promise<{ data: ConsultaPrisma[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.consulta.findMany({
          skip,
          take: limit,
          orderBy: { dataHora: 'desc' },
          include: {
            paciente: true,
            medico: true
          }
        }),
        this.prisma.consulta.count()
      ]);

      return { data, total };
    } catch (error: any) {
      throw new Error(`Erro ao listar consultas: ${error.message}`);
    }
  }

  async findByMedico(medicoId: string, data?: Date): Promise<ConsultaPrisma[]> {
    try {
      const where: any = { medicoId };
      
      if (data) {
        const startOfDay = new Date(data);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(data);
        endOfDay.setHours(23, 59, 59, 999);
        
        where.dataHora = {
          gte: startOfDay,
          lte: endOfDay
        };
      }

      return await this.prisma.consulta.findMany({
        where,
        include: {
          paciente: true,
          medico: true
        },
        orderBy: { dataHora: 'asc' }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar consultas do médico: ${error.message}`);
    }
  }

  async findByPaciente(pacienteId: string): Promise<ConsultaPrisma[]> {
    try {
      return await this.prisma.consulta.findMany({
        where: { pacienteId },
        include: {
          paciente: true,
          medico: true
        },
        orderBy: { dataHora: 'desc' }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar consultas do paciente: ${error.message}`);
    }
  }

  private validateDataHora(dataHora: Date): void {
    const agora = new Date();
    if (dataHora < agora) {
      throw new Error('Data da consulta não pode ser no passado');
    }
  }
}
import { PrismaClient, Consulta as ConsultaPrisma } from '../../../generated/prisma';
import { BaseModel } from './BaseModel';

export interface IConsulta {
  id?: string;
  pacienteId: string;
  medicoId: string;
  horarioId: string;
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
      this.validateRequiredFields(data, ['pacienteId', 'medicoId', 'horarioId']);

      // Verificar se o horário existe e está disponível
      const horario = await this.prisma.horarioDisponivel.findUnique({
        where: { id: data.horarioId },
        include: { consulta: true }
      });

      if (!horario) {
        throw new Error('Horário não encontrado');
      }

      if (!horario.ativo) {
        throw new Error('Este horário está inativo');
      }

      if (horario.consulta) {
        throw new Error('Este horário já está ocupado');
      }

      // Verificar se o horário pertence ao médico
      if (horario.medicoId !== data.medicoId) {
        throw new Error('Este horário não pertence ao médico selecionado');
      }

      return await this.prisma.consulta.create({
        data: {
          pacienteId: data.pacienteId,
          medicoId: data.medicoId,
          horarioId: data.horarioId,
          status: data.status || 'AGENDADA',
          observacoes: data.observacoes
        },
        include: {
          paciente: true,
          medico: true,
          horario: true
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
          medico: true,
          horario: true
        }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar consulta: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<IConsulta>): Promise<ConsultaPrisma> {
    try {
      // Se está mudando o horário
      if (data.horarioId) {
        const horario = await this.prisma.horarioDisponivel.findUnique({
          where: { id: data.horarioId },
          include: { consulta: true }
        });

        if (!horario) {
          throw new Error('Horário não encontrado');
        }

        if (horario.consulta && horario.consulta.id !== id) {
          throw new Error('Este horário já está ocupado');
        }
      }

      return await this.prisma.consulta.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          paciente: true,
          medico: true,
          horario: true
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
          include: {
            paciente: {
              select: {
                id: true,
                nome: true,
                cpf: true
              }
            },
            medico: {
              select: {
                id: true,
                nome: true,
                especialidade: true
              }
            },
            horario: {
              select: {
                data: true,
                horaInicio: true,
                horaFim: true
              }
            }
          },
          orderBy: {
            horario: {
              data: 'desc'
            }
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

        where.horario = {
          data: {
            gte: startOfDay,
            lte: endOfDay
          }
        };
      }

      return await this.prisma.consulta.findMany({
        where,
        include: {
          paciente: true,
          horario: true
        },
        orderBy: {
          horario: {
            data: 'asc'
          }
        }
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
          medico: true,
          horario: true
        },
        orderBy: {
          horario: {
            data: 'desc'
          }
        }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar consultas do paciente: ${error.message}`);
    }
  }
}
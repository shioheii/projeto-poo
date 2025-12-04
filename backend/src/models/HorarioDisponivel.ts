import { PrismaClient, HorarioDisponivel as HorarioDisponivelPrisma } from '../../../generated/prisma';
import { BaseModel } from './BaseModel';

export interface IHorarioDisponivel {
  id?: string;
  medicoId: string;
  data: Date;
  horaInicio: string;
  horaFim: string;
  ativo?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class HorarioDisponivel extends BaseModel<HorarioDisponivelPrisma> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(data: IHorarioDisponivel): Promise<HorarioDisponivelPrisma> {
    try {
      this.validateRequiredFields(data, ['medicoId', 'data', 'horaInicio', 'horaFim']);
      this.validateHorario(data.horaInicio, data.horaFim);
      this.validateData(data.data);

      return await this.prisma.horarioDisponivel.create({
        data: {
          medicoId: data.medicoId,
          data: data.data,
          horaInicio: data.horaInicio,
          horaFim: data.horaFim,
          ativo: data.ativo ?? true
        }
      });
    } catch (error: any) {
      throw new Error(`Erro ao criar horário disponível: ${error.message}`);
    }
  }

  async findById(id: string): Promise<HorarioDisponivelPrisma | null> {
    try {
      return await this.prisma.horarioDisponivel.findUnique({
        where: { id },
        include: {
          consulta: {
            select: {
              id: true,
              paciente: {
                select: { nome: true }
              },
              status: true
            }
          }
        }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar horário disponível: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<IHorarioDisponivel>): Promise<HorarioDisponivelPrisma> {
    try {
      return await this.prisma.horarioDisponivel.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Horário disponível não encontrado');
      }
      throw new Error(`Erro ao atualizar horário disponível: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Verificar se tem consulta vinculada
      const horario = await this.prisma.horarioDisponivel.findUnique({
        where: { id },
        include: { consulta: true }
      });

      if (horario?.consulta) {
        throw new Error('Não é possível excluir horário com consulta agendada');
      }

      await this.prisma.horarioDisponivel.delete({
        where: { id }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Horário disponível não encontrado');
      }
      throw new Error(`Erro ao deletar horário disponível: ${error.message}`);
    }
  }

  async list(page: number = 1, limit: number = 10): Promise<{ data: HorarioDisponivelPrisma[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.horarioDisponivel.findMany({
          skip,
          take: limit,
          orderBy: [
            { data: 'asc' },
            { horaInicio: 'asc' }
          ],
          include: {
            medico: true,
            consulta: true
          }
        }),
        this.prisma.horarioDisponivel.count()
      ]);

      return { data, total };
    } catch (error: any) {
      throw new Error(`Erro ao listar horários disponíveis: ${error.message}`);
    }
  }

  async listByMedico(medicoId: string, dataInicio?: Date, dataFim?: Date): Promise<HorarioDisponivelPrisma[]> {
    try {
      const where: any = { medicoId };

      if (dataInicio || dataFim) {
        where.data = {};
        if (dataInicio) where.data.gte = dataInicio;
        if (dataFim) where.data.lte = dataFim;
      }

      return await this.prisma.horarioDisponivel.findMany({
        where,
        include: {
          consulta: {
            select: {
              id: true,
              paciente: {
                select: { nome: true }
              },
              status: true
            }
          }
        },
        orderBy: [
          { data: 'asc' },
          { horaInicio: 'asc' }
        ]
      });
    } catch (error: any) {
      throw new Error(`Erro ao listar horários do médico: ${error.message}`);
    }
  }

  async getHorariosDisponiveis(medicoId: string, data: Date): Promise<HorarioDisponivelPrisma[]> {
    try {
      const startOfDay = new Date(data);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(data);
      endOfDay.setHours(23, 59, 59, 999);

      return await this.prisma.horarioDisponivel.findMany({
        where: {
          medicoId,
          data: {
            gte: startOfDay,
            lte: endOfDay
          },
          ativo: true,
          consulta: null // Apenas slots sem consulta
        },
        orderBy: { horaInicio: 'asc' }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar horários disponíveis: ${error.message}`);
    }
  }

  async createMultiple(horarios: IHorarioDisponivel[]): Promise<HorarioDisponivelPrisma[]> {
    try {
      const horariosCriados: HorarioDisponivelPrisma[] = [];

      for (const horario of horarios) {
        try {
          // Verificar se já existe
          const existe = await this.prisma.horarioDisponivel.findFirst({
            where: {
              medicoId: horario.medicoId,
              data: horario.data,
              horaInicio: horario.horaInicio
            }
          });

          if (!existe) {
            const created = await this.create(horario);
            horariosCriados.push(created);
          }
        } catch (error) {
          // Ignora duplicados
        }
      }

      return horariosCriados;
    } catch (error: any) {
      throw new Error(`Erro ao criar múltiplos horários: ${error.message}`);
    }
  }

  private validateHorario(horaInicio: string, horaFim: string): void {
    const horaRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!horaRegex.test(horaInicio) || !horaRegex.test(horaFim)) {
      throw new Error('Formato de horário inválido. Use HH:MM (24h)');
    }

    if (horaInicio >= horaFim) {
      throw new Error('Hora de início deve ser anterior à hora de fim');
    }
  }

  private validateData(data: Date): void {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (data < hoje) {
      throw new Error('Não é possível cadastrar horários para datas passadas');
    }
  }
}
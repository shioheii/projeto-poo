import { PrismaClient, HorarioDisponivel as HorarioDisponivelPrisma } from '../../../generated/prisma';
import { BaseModel } from './BaseModel';

export interface IHorarioDisponivel {
  id?: string;
  medicoId: string;
  diaSemana: number; // 0-6 (Domingo-Sábado)
  horaInicio: string; // formato "HH:MM"
  horaFim: string; // formato "HH:MM"
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
      this.validateRequiredFields(data, ['medicoId', 'diaSemana', 'horaInicio', 'horaFim']);
      this.validateDiaSemana(data.diaSemana);
      this.validateHorario(data.horaInicio, data.horaFim);

      // Verificar sobreposição de horários
      const sobreposicao = await this.prisma.horarioDisponivel.findFirst({
        where: {
          medicoId: data.medicoId,
          diaSemana: data.diaSemana,
          ativo: true,
          OR: [
            {
              horaInicio: { lte: data.horaInicio },
              horaFim: { gt: data.horaInicio }
            },
            {
              horaInicio: { lt: data.horaFim },
              horaFim: { gte: data.horaFim }
            }
          ]
        }
      });

      if (sobreposicao) {
        throw new Error('Já existe um horário cadastrado para este período');
      }

      return await this.prisma.horarioDisponivel.create({
        data: {
          medicoId: data.medicoId,
          diaSemana: data.diaSemana,
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
        where: { id }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar horário disponível: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<IHorarioDisponivel>): Promise<HorarioDisponivelPrisma> {
    try {
      if (data.diaSemana !== undefined) {
        this.validateDiaSemana(data.diaSemana);
      }

      if (data.horaInicio || data.horaFim) {
        this.validateHorario(data.horaInicio || '', data.horaFim || '');
      }

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

  async listByMedico(medicoId: string): Promise<HorarioDisponivelPrisma[]> {
    try {
      return await this.prisma.horarioDisponivel.findMany({
        where: { medicoId, ativo: true },
        orderBy: [
          { diaSemana: 'asc' },
          { horaInicio: 'asc' }
        ]
      });
    } catch (error: any) {
      throw new Error(`Erro ao listar horários do médico: ${error.message}`);
    }
  }

  private validateDiaSemana(diaSemana: number): void {
    if (diaSemana < 0 || diaSemana > 6) {
      throw new Error('Dia da semana deve estar entre 0 (Domingo) e 6 (Sábado)');
    }
  }

  private validateHorario(horaInicio: string, horaFim: string): void {
    const horaInicioRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const horaFimRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!horaInicioRegex.test(horaInicio) || !horaFimRegex.test(horaFim)) {
      throw new Error('Formato de horário inválido. Use HH:MM');
    }

    if (horaInicio >= horaFim) {
      throw new Error('Hora de início deve ser anterior à hora de fim');
    }
  }
}
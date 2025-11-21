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

      // Verificar se já existe horário para o mesmo médico, data e horário
      const horarioExistente = await this.prisma.horarioDisponivel.findFirst({
        where: {
          medicoId: data.medicoId,
          data: data.data,
          horaInicio: data.horaInicio,
          horaFim: data.horaFim
        }
      });

      if (horarioExistente) {
        throw new Error('Já existe um horário cadastrado para esta data e período');
      }

      // Verificar sobreposição de horários
      const sobreposicao = await this.prisma.horarioDisponivel.findFirst({
        where: {
          medicoId: data.medicoId,
          data: data.data,
          ativo: true,
          OR: [
            {
              horaInicio: { lte: data.horaInicio },
              horaFim: { gt: data.horaInicio }
            },
            {
              horaInicio: { lt: data.horaFim },
              horaFim: { gte: data.horaFim }
            },
            {
              horaInicio: { gte: data.horaInicio },
              horaFim: { lte: data.horaFim }
            }
          ]
        }
      });

      if (sobreposicao) {
        throw new Error('Já existe um horário cadastrado que sobrepõe este período');
      }

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
        where: { id }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar horário disponível: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<IHorarioDisponivel>): Promise<HorarioDisponivelPrisma> {
    try {
      if (data.data) {
        this.validateData(data.data);
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

  async listByMedico(medicoId: string, dataInicio?: Date, dataFim?: Date): Promise<HorarioDisponivelPrisma[]> {
    try {
      const where: any = { 
        medicoId, 
        ativo: true 
      };

      if (dataInicio || dataFim) {
        where.data = {};
        if (dataInicio) where.data.gte = dataInicio;
        if (dataFim) where.data.lte = dataFim;
      }

      return await this.prisma.horarioDisponivel.findMany({
        where,
        orderBy: [
          { data: 'asc' },
          { horaInicio: 'asc' }
        ]
      });
    } catch (error: any) {
      throw new Error(`Erro ao listar horários do médico: ${error.message}`);
    }
  }

  async listByData(medicoId: string, data: Date): Promise<HorarioDisponivelPrisma[]> {
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
          ativo: true
        },
        orderBy: { horaInicio: 'asc' }
      });
    } catch (error: any) {
      throw new Error(`Erro ao listar horários por data: ${error.message}`);
    }
  }

  async criarHorariosRecorrentes(medicoId: string, dataInicio: Date, dataFim: Date, diasDaSemana: number[], horaInicio: string, horaFim: string): Promise<HorarioDisponivelPrisma[]> {
    try {
      this.validateHorario(horaInicio, horaFim);
      
      const horariosCriados: HorarioDisponivelPrisma[] = [];
      const dataAtual = new Date(dataInicio);

      while (dataAtual <= dataFim) {
        if (diasDaSemana.includes(dataAtual.getDay())) {
          try {
            const horario = await this.create({
              medicoId,
              data: new Date(dataAtual),
              horaInicio,
              horaFim,
              ativo: true
            });
            horariosCriados.push(horario);
          } catch (error: any) {
            // Ignora erros de horário duplicado, apenas continua
            if (!error.message.includes('já existe um horário cadastrado')) {
              throw error;
            }
          }
        }
        
        // Avança para o próximo dia
        dataAtual.setDate(dataAtual.getDate() + 1);
      }

      return horariosCriados;
    } catch (error: any) {
      throw new Error(`Erro ao criar horários recorrentes: ${error.message}`);
    }
  }

  private validateHorario(horaInicio: string, horaFim: string): void {
    const horaInicioRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const horaFimRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

    if (!horaInicioRegex.test(horaInicio) || !horaFimRegex.test(horaFim)) {
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
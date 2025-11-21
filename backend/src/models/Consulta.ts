import { PrismaClient, Consulta as ConsultaPrisma } from '../../../generated/prisma';
import { BaseModel } from './BaseModel';

export interface IConsulta {
  id?: string;
  pacienteId: string;
  medicoId: string;
  dataHora: Date;      // Início da consulta
  dataFim: Date;       // NOVO: Fim da consulta
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
      this.validateRequiredFields(data, ['pacienteId', 'medicoId', 'dataHora', 'dataFim']);
      this.validateDataHora(data.dataHora, data.dataFim);

      // Verificar conflitos de horário - agora considerando o período completo
      const conflito = await this.prisma.consulta.findFirst({
        where: {
          medicoId: data.medicoId,
          status: { in: ['AGENDADA', 'CONFIRMADA'] },
          OR: [
            // Nova consulta começa durante uma existente
            {
              dataHora: { lte: data.dataHora },
              dataFim: { gt: data.dataHora }
            },
            // Nova consulta termina durante uma existente
            {
              dataHora: { lt: data.dataFim },
              dataFim: { gte: data.dataFim }
            },
            // Nova consulta engloba uma existente
            {
              dataHora: { gte: data.dataHora },
              dataFim: { lte: data.dataFim }
            }
          ]
        }
      });

      if (conflito) {
        throw new Error('Já existe uma consulta agendada para este período');
      }

      // Verificar se o horário está dentro dos horários disponíveis do médico
      const horarioDisponivel = await this.verificarHorarioDisponivel(data.medicoId, data.dataHora, data.dataFim);
      if (!horarioDisponivel) {
        throw new Error('O médico não possui horário disponível para este período');
      }

      return await this.prisma.consulta.create({
        data: {
          pacienteId: data.pacienteId,
          medicoId: data.medicoId,
          dataHora: data.dataHora,
          dataFim: data.dataFim,
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
      if (data.dataHora || data.dataFim) {
        const consultaAtual = await this.findById(id);
        if (!consultaAtual) {
          throw new Error('Consulta não encontrada');
        }

        const dataHora = data.dataHora || consultaAtual.dataHora;
        const dataFim = data.dataFim || consultaAtual.dataFim;

        this.validateDataHora(dataHora, dataFim);

        // Verificar conflitos (excluindo a própria consulta)
        const conflito = await this.prisma.consulta.findFirst({
          where: {
            id: { not: id },
            medicoId: consultaAtual.medicoId,
            status: { in: ['AGENDADA', 'CONFIRMADA'] },
            OR: [
              {
                dataHora: { lte: dataHora },
                dataFim: { gt: dataHora }
              },
              {
                dataHora: { lt: dataFim },
                dataFim: { gte: dataFim }
              },
              {
                dataHora: { gte: dataHora },
                dataFim: { lte: dataFim }
              }
            ]
          }
        });

        if (conflito) {
          throw new Error('Já existe uma consulta agendada para este período');
        }

        // Verificar horário disponível
        const horarioDisponivel = await this.verificarHorarioDisponivel(
          consultaAtual.medicoId, 
          dataHora, 
          dataFim
        );
        if (!horarioDisponivel) {
          throw new Error('O médico não possui horário disponível para este período');
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

  async getHorariosDisponiveis(medicoId: string, data: Date): Promise<{ horario: string; disponivel: boolean }[]> {
    try {
      // Buscar horários disponíveis do médico para essa data específica
      const horariosDisponiveis = await this.prisma.horarioDisponivel.findMany({
        where: {
          medicoId,
          data: {
            gte: new Date(data.setHours(0, 0, 0, 0)),
            lte: new Date(data.setHours(23, 59, 59, 999))
          },
          ativo: true
        },
        orderBy: { horaInicio: 'asc' }
      });

      // Buscar consultas já agendadas para esse médico na data
      const startOfDay = new Date(data);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(data);
      endOfDay.setHours(23, 59, 59, 999);

      const consultasAgendadas = await this.prisma.consulta.findMany({
        where: {
          medicoId,
          OR: [
            {
              dataHora: {
                gte: startOfDay,
                lte: endOfDay
              }
            },
            {
              dataFim: {
                gte: startOfDay,
                lte: endOfDay
              }
            }
          ],
          status: { in: ['AGENDADA', 'CONFIRMADA'] }
        },
        select: {
          dataHora: true,
          dataFim: true
        }
      });

      // Gerar todos os horários possíveis (intervalos de 30 minutos)
      const todosHorarios: { horario: string; disponivel: boolean }[] = [];

      horariosDisponiveis.forEach(horario => {
        const [inicioHora, inicioMinuto] = horario.horaInicio.split(':').map(Number);
        const [fimHora, fimMinuto] = horario.horaFim.split(':').map(Number);

        let horaAtual = inicioHora;
        let minutoAtual = inicioMinuto;

        while (horaAtual < fimHora || (horaAtual === fimHora && minutoAtual < fimMinuto)) {
          const horarioStr = `${horaAtual.toString().padStart(2, '0')}:${minutoAtual.toString().padStart(2, '0')}`;
          
          // Verificar se este horário está ocupado por alguma consulta
          const horarioOcupado = consultasAgendadas.some(consulta => {
            const consultaInicio = new Date(consulta.dataHora);
            const consultaFim = new Date(consulta.dataFim);
            
            const horarioData = new Date(data);
            const [hora, minuto] = horarioStr.split(':').map(Number);
            horarioData.setHours(hora, minuto, 0, 0);
            
            return horarioData >= consultaInicio && horarioData < consultaFim;
          });

          todosHorarios.push({
            horario: horarioStr,
            disponivel: !horarioOcupado
          });

          // Avançar 30 minutos
          minutoAtual += 30;
          if (minutoAtual >= 60) {
            horaAtual += 1;
            minutoAtual = 0;
          }
        }
      });

      return todosHorarios;
    } catch (error: any) {
      throw new Error(`Erro ao buscar horários disponíveis: ${error.message}`);
    }
  }

  private async verificarHorarioDisponivel(medicoId: string, dataHora: Date, dataFim: Date): Promise<boolean> {
    try {
      // Buscar horários disponíveis do médico para essa data
      const horariosDisponiveis = await this.prisma.horarioDisponivel.findMany({
        where: {
          medicoId,
          data: {
            gte: new Date(dataHora.setHours(0, 0, 0, 0)),
            lte: new Date(dataHora.setHours(23, 59, 59, 999))
          },
          ativo: true
        }
      });

      // Verificar se o período da consulta está dentro de algum horário disponível
      return horariosDisponiveis.some(horario => {
        const horarioInicio = new Date(dataHora);
        const [inicioHora, inicioMinuto] = horario.horaInicio.split(':').map(Number);
        horarioInicio.setHours(inicioHora, inicioMinuto, 0, 0);

        const horarioFim = new Date(dataHora);
        const [fimHora, fimMinuto] = horario.horaFim.split(':').map(Number);
        horarioFim.setHours(fimHora, fimMinuto, 0, 0);

        return dataHora >= horarioInicio && dataFim <= horarioFim;
      });
    } catch (error) {
      return false;
    }
  }

  private validateDataHora(dataHora: Date, dataFim: Date): void {
    const agora = new Date();
    
    if (dataHora < agora) {
      throw new Error('Data da consulta não pode ser no passado');
    }
    
    if (dataFim <= dataHora) {
      throw new Error('Horário de fim deve ser após o horário de início');
    }

    // Verificar duração mínima (30 minutos) e máxima (4 horas)
    const duracao = (dataFim.getTime() - dataHora.getTime()) / (1000 * 60); // duração em minutos
    if (duracao < 30) {
      throw new Error('Duração mínima da consulta é de 30 minutos');
    }
    if (duracao > 240) {
      throw new Error('Duração máxima da consulta é de 4 horas');
    }
  }
}
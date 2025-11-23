import { Request, Response } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { HorarioDisponivel, IHorarioDisponivel } from '../models/HorarioDisponivel';

const prisma = new PrismaClient();
const horarioModel = new HorarioDisponivel(prisma);

export const horarioController = {
  async listByMedico(req: Request, res: Response) {
    try {
      const { medicoId } = req.params;
      const { dataInicio, dataFim } = req.query;

      const horarios = await horarioModel.listByMedico(
        medicoId,
        dataInicio ? new Date(dataInicio as string) : undefined,
        dataFim ? new Date(dataFim as string) : undefined
      );

      res.json(horarios);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getHorariosDisponiveis(req: Request, res: Response) {
    try {
      const { medicoId, data } = req.params;
      const horarios = await horarioModel.getHorariosDisponiveis(medicoId, new Date(data));
      res.json(horarios);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { medicoId, data, horaInicio, horaFim } = req.body;

      // Gerar slots de 30 minutos
      const slots = gerarSlots(horaInicio, horaFim);
      const horariosParaCriar: IHorarioDisponivel[] = slots.map(slot => ({
        medicoId,
        data: new Date(data),
        horaInicio: slot.inicio,
        horaFim: slot.fim,
        ativo: true
      }));

      const horariosCriados = await horarioModel.createMultiple(horariosParaCriar);

      res.status(201).json({
        message: `${horariosCriados.length} slot(s) criado(s) com sucesso`,
        horarios: horariosCriados
      });
    } catch (error: any) {
      if (error.message.includes('Formato de horário inválido') || error.message.includes('passadas')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async createRecorrentes(req: Request, res: Response) {
    try {
      const { medicoId, dataInicio, dataFim, diasDaSemana, horaInicio, horaFim } = req.body;

      if (!Array.isArray(diasDaSemana) || diasDaSemana.length === 0) {
        return res.status(400).json({ error: 'Selecione pelo menos um dia da semana' });
      }

      // Gerar slots de 30 minutos
      const slots = gerarSlots(horaInicio, horaFim);
      const horariosParaCriar: IHorarioDisponivel[] = [];

      const dataAtual = new Date(dataInicio);
      const dataFinal = new Date(dataFim);

      while (dataAtual <= dataFinal) {
        if (diasDaSemana.includes(dataAtual.getDay())) {
          slots.forEach(slot => {
            horariosParaCriar.push({
              medicoId,
              data: new Date(dataAtual),
              horaInicio: slot.inicio,
              horaFim: slot.fim,
              ativo: true
            });
          });
        }
        dataAtual.setDate(dataAtual.getDate() + 1);
      }

      const horariosCriados = await horarioModel.createMultiple(horariosParaCriar);

      res.status(201).json({
        message: `${horariosCriados.length} slot(s) criado(s) com sucesso`,
        horarios: horariosCriados
      });
    } catch (error: any) {
      if (error.message.includes('Formato de horário inválido')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { ativo } = req.body;

      const horario = await horarioModel.update(id, { ativo });
      res.json(horario);
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await horarioModel.delete(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      if (error.message.includes('consulta agendada')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
};

// Função auxiliar para gerar slots de 30 minutos
function gerarSlots(horaInicio: string, horaFim: string): Array<{ inicio: string; fim: string }> {
  const slots = [];
  const [horaIni, minIni] = horaInicio.split(':').map(Number);
  const [horaFin, minFin] = horaFim.split(':').map(Number);

  let minutoAtual = horaIni * 60 + minIni;
  const minutoFim = horaFin * 60 + minFin;

  while (minutoAtual < minutoFim) {
    const proximoMinuto = minutoAtual + 30;
    
    if (proximoMinuto <= minutoFim) {
      const hIni = Math.floor(minutoAtual / 60).toString().padStart(2, '0');
      const mIni = (minutoAtual % 60).toString().padStart(2, '0');
      const hFim = Math.floor(proximoMinuto / 60).toString().padStart(2, '0');
      const mFim = (proximoMinuto % 60).toString().padStart(2, '0');

      slots.push({
        inicio: `${hIni}:${mIni}`,
        fim: `${hFim}:${mFim}`
      });
    }

    minutoAtual = proximoMinuto;
  }

  return slots;
}
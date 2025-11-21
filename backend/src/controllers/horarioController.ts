import { Request, Response } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { HorarioDisponivel } from '../models/HorarioDisponivel';

const prisma = new PrismaClient();
const horarioModel = new HorarioDisponivel(prisma);

export const horarioController = {
   async list(req: Request, res: Response) {
    try {
      const { medicoId, dataInicio, dataFim, ativo } = req.query;

      // Se não há filtros específicos, busca todos os horários
      if (!medicoId && !dataInicio && !dataFim) {
        const horarios = await prisma.horarioDisponivel.findMany({
          include: {
            medico: true
          },
          orderBy: [
            { data: 'asc' },
            { horaInicio: 'asc' }
          ]
        });
        return res.json(horarios);
      }

      // Se há médicoId, usa o método do model
      if (medicoId) {
        const horarios = await horarioModel.listByMedico(
          medicoId as string,
          dataInicio ? new Date(dataInicio as string) : undefined,
          dataFim ? new Date(dataFim as string) : undefined
        );
        return res.json(horarios);
      }

      // Filtro geral sem médico específico
      const where: any = {};

      if (dataInicio || dataFim) {
        where.data = {};
        if (dataInicio) where.data.gte = new Date(dataInicio as string);
        if (dataFim) where.data.lte = new Date(dataFim as string);
      }

      if (ativo !== undefined) {
        where.ativo = ativo === 'true';
      }

      const horarios = await prisma.horarioDisponivel.findMany({
        where,
        include: {
          medico: true
        },
        orderBy: [
          { data: 'asc' },
          { horaInicio: 'asc' }
        ]
      });

      res.json(horarios);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { medicoId, data, horaInicio, horaFim, ativo } = req.body;

      const horario = await horarioModel.create({
        medicoId,
        data: new Date(data),
        horaInicio,
        horaFim,
        ativo
      });

      res.status(201).json(horario);
    } catch (error: any) {
      if (error.message.includes('já existe um horário') || error.message.includes('Formato de horário inválido')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async createRecorrentes(req: Request, res: Response) {
    try {
      const { medicoId, dataInicio, dataFim, diasDaSemana, horaInicio, horaFim } = req.body;

      const horarios = await horarioModel.criarHorariosRecorrentes(
        medicoId,
        new Date(dataInicio),
        new Date(dataFim),
        diasDaSemana,
        horaInicio,
        horaFim
      );

      res.status(201).json({
        message: `${horarios.length} horários criados com sucesso`,
        horarios
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { data, horaInicio, horaFim, ativo } = req.body;

      const horario = await horarioModel.update(id, {
        data: data ? new Date(data) : undefined,
        horaInicio,
        horaFim,
        ativo
      });

      res.json(horario);
    } catch (error: any) {
      if (error.message.includes('não encontrado') || error.message.includes('Formato de horário inválido')) {
        return res.status(400).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  },

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

  async listByData(req: Request, res: Response) {
    try {
      const { medicoId, data } = req.params;
      const horarios = await horarioModel.listByData(medicoId, new Date(data));
      res.json(horarios);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
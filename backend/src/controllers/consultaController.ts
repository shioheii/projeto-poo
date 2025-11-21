import { Request, Response } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { Consulta } from '../models/Consulta';

const prisma = new PrismaClient();
const consultaModel = new Consulta(prisma);

export const consultaController = {
  async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;

      const result = await consultaModel.list(page, limit);

      res.json({
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const consulta = await consultaModel.findById(id);

      if (!consulta) {
        return res.status(404).json({ error: 'Consulta não encontrada' });
      }

      res.json(consulta);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
  try {
    const { pacienteId, medicoId, dataHora, dataFim, observacoes } = req.body;

    const consulta = await consultaModel.create({
      pacienteId,
      medicoId,
      dataHora: new Date(dataHora),
      dataFim: new Date(dataFim),
      observacoes
    });

    res.status(201).json(consulta);
  } catch (error: any) {
    if (error.message.includes('já existe uma consulta') || 
        error.message.includes('não possui horário disponível') ||
        error.message.includes('não pode ser no passado')) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
},

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { dataHora, status, observacoes } = req.body;

      const consulta = await consultaModel.update(id, {
        dataHora: dataHora ? new Date(dataHora) : undefined,
        status,
        observacoes
      });

      res.json(consulta);
    } catch (error: any) {
      if (error.message.includes('não encontrada') || error.message.includes('não pode ser no passado')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await consultaModel.delete(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async findByMedico(req: Request, res: Response) {
    try {
      const { medicoId } = req.params;
      const { data } = req.query;

      const consultas = await consultaModel.findByMedico(
        medicoId, 
        data ? new Date(data as string) : undefined
      );

      res.json(consultas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async findByPaciente(req: Request, res: Response) {
    try {
      const { pacienteId } = req.params;
      const consultas = await consultaModel.findByPaciente(pacienteId);
      res.json(consultas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getHorariosDisponiveis(req: Request, res: Response) {
    try {
      const { medicoId, data } = req.params;
      const horariosDisponiveis = await consultaModel.getHorariosDisponiveis(
        medicoId, 
        new Date(data)
      );
      res.json(horariosDisponiveis);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};
import { Request, Response } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { Paciente } from '../models/Paciente';

const prisma = new PrismaClient();
const pacienteModel = new Paciente(prisma);

export const pacienteController = {
  async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;

      const result = await pacienteModel.list(page, limit);

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
      const paciente = await pacienteModel.findById(id);

      if (!paciente) {
        return res.status(404).json({ error: 'Paciente não encontrado' });
      }

      res.json(paciente);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const { nome, cpf, dataNascimento, telefone, email, endereco } = req.body;

      const paciente = await pacienteModel.create({
        nome,
        cpf,
        dataNascimento: new Date(dataNascimento),
        telefone,
        email,
        endereco
      });

      res.status(201).json(paciente);
    } catch (error: any) {
      if (error.message.includes('já cadastrado')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { nome, cpf, dataNascimento, telefone, email, endereco } = req.body;

      const paciente = await pacienteModel.update(id, {
        nome,
        cpf,
        dataNascimento: dataNascimento ? new Date(dataNascimento) : undefined,
        telefone,
        email,
        endereco
      });

      res.json(paciente);
    } catch (error: any) {
      if (error.message.includes('não encontrado') || error.message.includes('já está em uso')) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await pacienteModel.delete(id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: error.message });
    }
  }
};
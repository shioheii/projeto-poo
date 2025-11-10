import { Request, Response } from 'express';
import { MedicoService } from '../services/medico.service';

export class MedicoController {
  private service: MedicoService;

  constructor() {
    this.service = new MedicoService();
  }

  listarTodos = async (req: Request, res: Response) => {
    try {
      const medicos = await this.service.listarTodos();
      res.json(medicos);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const medico = await this.service.buscarPorId(id);
      res.json(medico);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  criar = async (req: Request, res: Response) => {
    try {
      const medico = await this.service.criar(req.body);
      res.status(201).json(medico);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  atualizar = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const medico = await this.service.atualizar(id, req.body);
      res.json(medico);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  deletar = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      await this.service.deletar(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
}
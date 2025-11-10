import { Request, Response } from 'express';
import { PacienteService } from '../services/paciente.service';

export class PacienteController {
  private service: PacienteService;

  constructor() {
    this.service = new PacienteService();
  }

  listarTodos = async (req: Request, res: Response) => {
    try {
      const pacientes = await this.service.listarTodos();
      res.json(pacientes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  buscarPorId = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const paciente = await this.service.buscarPorId(id);
      res.json(paciente);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  };

  criar = async (req: Request, res: Response) => {
    try {
      const paciente = await this.service.criar(req.body);
      res.status(201).json(paciente);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  atualizar = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const paciente = await this.service.atualizar(id, req.body);
      res.json(paciente);
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
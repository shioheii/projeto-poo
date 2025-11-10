import { Router } from 'express';
import { PacienteController } from '../controllers/paciente.controller';
import { MedicoController } from '../controllers/medico.controller';

const router = Router();

const pacienteController = new PacienteController();
const medicoController = new MedicoController();

// Rotas de Pacientes
router.get('/pacientes', pacienteController.listarTodos);
router.get('/pacientes/:id', pacienteController.buscarPorId);
router.post('/pacientes', pacienteController.criar);
router.put('/pacientes/:id', pacienteController.atualizar);
router.delete('/pacientes/:id', pacienteController.deletar);

// Rotas de Médicos
router.get('/medicos', medicoController.listarTodos);
router.get('/medicos/:id', medicoController.buscarPorId);
router.post('/medicos', medicoController.criar);
router.put('/medicos/:id', medicoController.atualizar);
router.delete('/medicos/:id', medicoController.deletar);

export default router;
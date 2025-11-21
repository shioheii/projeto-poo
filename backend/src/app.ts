import express from 'express';
import cors from 'cors';
import { pacienteController } from './controllers/pacienteController';
import { medicoController } from './controllers/medicoController';
import { consultaController } from './controllers/consultaController';
import { horarioController } from './controllers/horarioController';

const app = express();

app.use(cors());
app.use(express.json());

// Rotas de Pacientes
app.get('/api/pacientes', pacienteController.list);
app.get('/api/pacientes/:id', pacienteController.getById);
app.post('/api/pacientes', pacienteController.create);
app.put('/api/pacientes/:id', pacienteController.update);
app.delete('/api/pacientes/:id', pacienteController.delete);

// Rotas de Médicos
app.get('/api/medicos', medicoController.list);
app.get('/api/medicos/:id', medicoController.getById);
app.post('/api/medicos', medicoController.create);
app.put('/api/medicos/:id', medicoController.update);
app.delete('/api/medicos/:id', medicoController.delete);

// Rotas para Consultas
app.get('/api/consultas', consultaController.list);
app.get('/api/consultas/:id', consultaController.getById);
app.post('/api/consultas', consultaController.create);
app.put('/api/consultas/:id', consultaController.update);
app.delete('/api/consultas/:id', consultaController.delete);
app.get('/api/consultas/medico/:medicoId', consultaController.findByMedico);
app.get('/api/consultas/paciente/:pacienteId', consultaController.findByPaciente);
app.get('/api/consultas/horarios-disponiveis/:medicoId/:data', consultaController.getHorariosDisponiveis);

// Rotas para Horários Disponíveis
app.post('/api/horarios', horarioController.create);
app.post('/api/horarios/recorrentes', horarioController.createRecorrentes);
app.put('/api/horarios/:id', horarioController.update);
app.delete('/api/horarios/:id', horarioController.delete);
app.get('/api/horarios/medico/:medicoId', horarioController.listByMedico);
app.get('/api/horarios/medico/:medicoId/data/:data', horarioController.listByData);
app.get('/api/horarios', horarioController.list);

export default app;
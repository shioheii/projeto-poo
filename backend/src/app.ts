import express from 'express';
import cors from 'cors';
import { pacienteController } from './controllers/pacienteController';
import { medicoController } from './controllers/medicoController';

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

export default app;
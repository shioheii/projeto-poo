import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Request, Response } from 'express';
import { horarioController } from '../../src/controllers/horarioController';
import { HorarioDisponivel } from '../../src/models/HorarioDisponivel';

describe('HorarioController', () => {
  let mockReq: Partial<Request>;
  let mockRes: any;
  let jsonMock: ReturnType<typeof mock.fn>;
  let statusMock: ReturnType<typeof mock.fn>;
  let sendMock: ReturnType<typeof mock.fn>;

  beforeEach(() => {
    jsonMock = mock.fn();
    sendMock = mock.fn();
    statusMock = mock.fn(() => ({ json: jsonMock, send: sendMock }));
    
    mockReq = {
      params: {},
      query: {},
      body: {}
    };
    
    mockRes = {
      json: jsonMock,
      status: statusMock,
      send: sendMock
    };
  });

  describe('listByMedico', () => {
    it('deve listar horários por médico', async () => {
      const mockHorarios = [
        {
          id: '1',
          medicoId: 'm1',
          data: new Date('2024-12-01'),
          horaInicio: '09:00',
          horaFim: '09:30',
          ativo: true
        }
      ];

      mock.method(HorarioDisponivel.prototype, 'listByMedico', async () => mockHorarios);

      mockReq.params = { medicoId: 'm1' };
      mockReq.query = {
        dataInicio: '2024-12-01',
        dataFim: '2024-12-31'
      };

      await horarioController.listByMedico(mockReq as Request, mockRes as Response);

      assert.strictEqual(jsonMock.mock.calls.length, 1);
      assert.deepStrictEqual(jsonMock.mock.calls[0].arguments[0], mockHorarios);
    });

    it('deve retornar erro 500 em caso de falha', async () => {
      mock.method(HorarioDisponivel.prototype, 'listByMedico', async () => {
        throw new Error('Erro no banco');
      });

      mockReq.params = { medicoId: 'm1' };

      await horarioController.listByMedico(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 500);
    });
  });

  describe('getHorariosDisponiveis', () => {
    it('deve retornar horários disponíveis para um médico em uma data', async () => {
      const mockHorarios = [
        {
          id: '1',
          medicoId: 'm1',
          data: new Date('2024-12-01'),
          horaInicio: '09:00',
          horaFim: '09:30',
          ativo: true
        }
      ];

      mock.method(HorarioDisponivel.prototype, 'getHorariosDisponiveis', async () => mockHorarios);

      mockReq.params = {
        medicoId: 'm1',
        data: '2024-12-01'
      };

      await horarioController.getHorariosDisponiveis(mockReq as Request, mockRes as Response);

      assert.strictEqual(jsonMock.mock.calls.length, 1);
      assert.deepStrictEqual(jsonMock.mock.calls[0].arguments[0], mockHorarios);
    });
  });

  describe('create', () => {
    it('deve criar slots de horários', async () => {
      const mockHorarios = [
        {
          id: '1',
          medicoId: 'm1',
          data: new Date('2024-12-01'),
          horaInicio: '09:00',
          horaFim: '09:30',
          ativo: true
        },
        {
          id: '2',
          medicoId: 'm1',
          data: new Date('2024-12-01'),
          horaInicio: '09:30',
          horaFim: '10:00',
          ativo: true
        }
      ];

      mock.method(HorarioDisponivel.prototype, 'createMultiple', async () => mockHorarios);

      mockReq.body = {
        medicoId: 'm1',
        data: '2024-12-01',
        horaInicio: '09:00',
        horaFim: '10:00'
      };

      await horarioController.create(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 201);
      
      const response = jsonMock.mock.calls[0].arguments[0] as any;
      assert.strictEqual(response.message, '2 slot(s) criado(s) com sucesso');
      assert.strictEqual(response.horarios.length, 2);
    });

    it('deve retornar 400 para formato de horário inválido', async () => {
      mock.method(HorarioDisponivel.prototype, 'createMultiple', async () => {
        throw new Error('Formato de horário inválido');
      });

      mockReq.body = {
        medicoId: 'm1',
        data: '2024-12-01',
        horaInicio: '25:00',
        horaFim: '10:00'
      };

      await horarioController.create(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 400);
    });
  });

  describe('createRecorrentes', () => {
    it('deve criar horários recorrentes', async () => {
      const mockHorarios = [
        {
          id: '1',
          medicoId: 'm1',
          data: new Date('2024-12-02'),
          horaInicio: '09:00',
          horaFim: '09:30',
          ativo: true
        }
      ];

      mock.method(HorarioDisponivel.prototype, 'createMultiple', async () => mockHorarios);

      mockReq.body = {
        medicoId: 'm1',
        dataInicio: '2024-12-01',
        dataFim: '2024-12-07',
        diasDaSemana: [1, 3, 5], // Segunda, Quarta, Sexta
        horaInicio: '09:00',
        horaFim: '09:30'
      };

      await horarioController.createRecorrentes(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 201);
    });

    it('deve retornar 400 se nenhum dia da semana for selecionado', async () => {
      mockReq.body = {
        medicoId: 'm1',
        dataInicio: '2024-12-01',
        dataFim: '2024-12-07',
        diasDaSemana: [],
        horaInicio: '09:00',
        horaFim: '09:30'
      };

      await horarioController.createRecorrentes(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 400);
    });
  });

  describe('update', () => {
    it('deve atualizar um horário', async () => {
      const mockHorario = {
        id: '1',
        medicoId: 'm1',
        data: new Date('2024-12-01'),
        horaInicio: '09:00',
        horaFim: '09:30',
        ativo: false
      };

      mock.method(HorarioDisponivel.prototype, 'update', async () => mockHorario);

      mockReq.params = { id: '1' };
      mockReq.body = { ativo: false };

      await horarioController.update(mockReq as Request, mockRes as Response);

      assert.strictEqual(jsonMock.mock.calls.length, 1);
      assert.deepStrictEqual(jsonMock.mock.calls[0].arguments[0], mockHorario);
    });

    it('deve retornar 404 se horário não for encontrado', async () => {
      mock.method(HorarioDisponivel.prototype, 'update', async () => {
        throw new Error('Horário não encontrado');
      });

      mockReq.params = { id: '999' };
      mockReq.body = { ativo: false };

      await horarioController.update(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 404);
    });
  });

  describe('delete', () => {
    it('deve deletar um horário', async () => {
      mock.method(HorarioDisponivel.prototype, 'delete', async () => {});

      mockReq.params = { id: '1' };

      await horarioController.delete(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 204);
    });

    it('deve retornar 404 se horário não for encontrado', async () => {
      mock.method(HorarioDisponivel.prototype, 'delete', async () => {
        throw new Error('Horário não encontrado');
      });

      mockReq.params = { id: '999' };

      await horarioController.delete(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 404);
    });

    it('deve retornar 400 se horário tem consulta agendada', async () => {
      mock.method(HorarioDisponivel.prototype, 'delete', async () => {
        throw new Error('Não é possível excluir horário com consulta agendada');
      });

      mockReq.params = { id: '1' };

      await horarioController.delete(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 400);
    });
  });
});
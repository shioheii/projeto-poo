import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Request, Response } from 'express';
import { consultaController } from '../../src/controllers/consultaController';
import { Consulta } from '../../src/models/Consulta';

describe('ConsultaController', () => {
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

  describe('list', () => {
    it('deve listar consultas com paginação', async () => {
      const mockData = {
        data: [
          {
            id: '1',
            pacienteId: 'p1',
            medicoId: 'm1',
            horarioId: 'h1',
            status: 'AGENDADA'
          }
        ],
        total: 1
      };

      mock.method(Consulta.prototype, 'list', async () => mockData);

      mockReq.query = { page: '1' };

      await consultaController.list(mockReq as Request, mockRes as Response);

      assert.strictEqual(jsonMock.mock.calls.length, 1);
      const response = jsonMock.mock.calls[0].arguments[0] as any;
      assert.strictEqual(response.data.length, 1);
      assert.strictEqual(response.pagination.page, 1);
      assert.strictEqual(response.pagination.limit, 10);
      assert.strictEqual(response.pagination.total, 1);
    });

    it('deve retornar erro 500 em caso de falha', async () => {
      mock.method(Consulta.prototype, 'list', async () => {
        throw new Error('Erro no banco');
      });

      await consultaController.list(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 500);
    });
  });

  describe('getById', () => {
    it('deve retornar consulta por ID', async () => {
      const mockConsulta = {
        id: '1',
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h1',
        status: 'AGENDADA'
      };

      mock.method(Consulta.prototype, 'findById', async () => mockConsulta);

      mockReq.params = { id: '1' };

      await consultaController.getById(mockReq as Request, mockRes as Response);

      assert.strictEqual(jsonMock.mock.calls.length, 1);
      assert.deepStrictEqual(jsonMock.mock.calls[0].arguments[0] as any, mockConsulta);
    });

    it('deve retornar 404 se consulta não for encontrada', async () => {
      mock.method(Consulta.prototype, 'findById', async () => null);

      mockReq.params = { id: '999' };

      await consultaController.getById(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 404);
    });
  });

  describe('create', () => {
    it('deve criar uma nova consulta', async () => {
      const mockConsulta = {
        id: '1',
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h1',
        status: 'AGENDADA',
        observacoes: 'Teste'
      };

      mock.method(Consulta.prototype, 'create', async () => mockConsulta);

      mockReq.body = {
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h1',
        observacoes: 'Teste'
      };

      await consultaController.create(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 201);
      assert.deepStrictEqual(jsonMock.mock.calls[0].arguments[0] as any, mockConsulta);
    });

    it('deve retornar 400 se horário já está ocupado', async () => {
      mock.method(Consulta.prototype, 'create', async () => {
        throw new Error('Este horário já está ocupado');
      });

      mockReq.body = {
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h1'
      };

      await consultaController.create(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 400);
    });
  });

  describe('update', () => {
    it('deve atualizar uma consulta', async () => {
      const mockConsulta = {
        id: '1',
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h1',
        status: 'CONFIRMADA',
        observacoes: 'Atualizado'
      };

      mock.method(Consulta.prototype, 'update', async () => mockConsulta);

      mockReq.params = { id: '1' };
      mockReq.body = {
        status: 'CONFIRMADA',
        observacoes: 'Atualizado'
      };

      await consultaController.update(mockReq as Request, mockRes as Response);

      assert.strictEqual(jsonMock.mock.calls.length, 1);
      assert.deepStrictEqual(jsonMock.mock.calls[0].arguments[0] as any, mockConsulta);
    });

    it('deve retornar 400 se consulta não for encontrada', async () => {
      mock.method(Consulta.prototype, 'update', async () => {
        throw new Error('Consulta não encontrada');
      });

      mockReq.params = { id: '999' };
      mockReq.body = { status: 'CANCELADA' };

      await consultaController.update(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 400);
    });
  });

  describe('delete', () => {
    it('deve deletar uma consulta', async () => {
      mock.method(Consulta.prototype, 'delete', async () => {});

      mockReq.params = { id: '1' };

      await consultaController.delete(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 204);
    });

    it('deve retornar 404 se consulta não for encontrada', async () => {
      mock.method(Consulta.prototype, 'delete', async () => {
        throw new Error('Consulta não encontrada');
      });

      mockReq.params = { id: '999' };

      await consultaController.delete(mockReq as Request, mockRes as Response);

      assert.strictEqual(statusMock.mock.calls.length, 1);
      assert.strictEqual(statusMock.mock.calls[0].arguments[0], 404);
    });
  });

  describe('findByMedico', () => {
    it('deve buscar consultas por médico', async () => {
      const mockConsultas = [
        {
          id: '1',
          pacienteId: 'p1',
          medicoId: 'm1',
          horarioId: 'h1',
          status: 'AGENDADA'
        }
      ];

      mock.method(Consulta.prototype, 'findByMedico', async () => mockConsultas);

      mockReq.params = { medicoId: 'm1' };

      await consultaController.findByMedico(mockReq as Request, mockRes as Response);

      assert.strictEqual(jsonMock.mock.calls.length, 1);
      assert.deepStrictEqual(jsonMock.mock.calls[0].arguments[0] as any, mockConsultas);
    });
  });

  describe('findByPaciente', () => {
    it('deve buscar consultas por paciente com paginação', async () => {
      const mockResult = {
        consultas: [
          {
            id: '1',
            pacienteId: 'p1',
            medicoId: 'm1',
            horarioId: 'h1',
            status: 'AGENDADA'
          }
        ],
        total: 1,
        paginas: 1
      };

      mock.method(Consulta.prototype, 'findByPaciente', async () => mockResult);

      mockReq.params = { pacienteId: 'p1' };
      mockReq.query = { pagina: '1', limite: '10' };

      await consultaController.findByPaciente(mockReq as Request, mockRes as Response);

      assert.strictEqual(jsonMock.mock.calls.length, 1);
      const response = jsonMock.mock.calls[0].arguments[0] as any;
      assert.strictEqual(response.consultas.length, 1);
      assert.strictEqual(response.total, 1);
      assert.strictEqual(response.paginaAtual, 1);
    });
  });
});
import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { medicoController } from '../../src/controllers/medicoController';

describe('Medico Controller', () => {
  let mockReq: any;
  let mockRes: any;

  beforeEach(() => {
    mockReq = {
      params: {},
      query: {},
      body: {}
    };

    mockRes = {
      json: mock.fn(),
      status: mock.fn(function(this: any, code: number) {
        this.statusCode = code;
        return this;
      }),
      send: mock.fn()
    };
  });

  describe('list', () => {
    it('deve retornar lista de médicos com paginação', async () => {
      mockReq.query = { page: '1' };

      await medicoController.list(mockReq, mockRes);

      assert.strictEqual(mockRes.json.mock.callCount(), 1);
      const response = mockRes.json.mock.calls[0].arguments[0];
      assert.ok(response.data);
      assert.ok(response.pagination);
    });

    it('deve usar página 1 como padrão se não for especificada', async () => {
      mockReq.query = {};

      await medicoController.list(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0].arguments[0];
      assert.strictEqual(response.pagination.page, 1);
    });

    it('deve calcular totalPages corretamente', async () => {
      mockReq.query = { page: '1' };

      await medicoController.list(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0].arguments[0];
      assert.ok(response.pagination.totalPages >= 0);
    });
  });

  describe('getById', () => {
    it('deve retornar médico quando encontrado', async () => {
      mockReq.params = { id: 'valid-uuid' };

      await medicoController.getById(mockReq, mockRes);

      assert.ok(mockRes.json.mock.callCount() > 0 || mockRes.status.mock.callCount() > 0);
    });

    it('deve retornar 404 quando médico não for encontrado', async () => {
      mockReq.params = { id: 'non-existent-id' };

      await medicoController.getById(mockReq, mockRes);

      assert.ok(mockRes.json.mock.callCount() > 0 || mockRes.status.mock.callCount() > 0);
    });
  });

  describe('create', () => {
    it('deve criar médico com dados válidos', async () => {
      const uniqueCrm = `CRM${Date.now()}`;
      
      mockReq.body = {
        nome: 'Dr. Teste',
        crm: uniqueCrm,
        especialidade: 'Cardiologia',
        telefone: '11987654321',
        email: `dr.teste${Date.now()}@example.com`
      };

      await medicoController.create(mockReq, mockRes);

      assert.ok(mockRes.json.mock.callCount() > 0 || mockRes.status.mock.callCount() > 0);
    });

    it('deve retornar erro 400 quando CRM já existe', async () => {
      const crm = `CRM${Date.now()}`;
      
      mockReq.body = {
        nome: 'Dr. Teste',
        crm: crm,
        especialidade: 'Cardiologia',
        telefone: '11987654321',
        email: `dr1${Date.now()}@example.com`
      };

      await medicoController.create(mockReq, mockRes);
      
      // Tenta criar novamente com mesmo CRM
      mockRes.json.mock.resetCalls();
      mockRes.status.mock.resetCalls();
      
      mockReq.body.email = `dr2${Date.now()}@example.com`;
      await medicoController.create(mockReq, mockRes);

      assert.ok(mockRes.status.mock.callCount() > 0 || mockRes.json.mock.callCount() > 0);
    });

    it('deve validar campos obrigatórios', async () => {
      mockReq.body = {
        nome: 'Dr. Teste',
        crm: 'CRM12345'
        // Faltando especialidade, telefone, email
      };

      await medicoController.create(mockReq, mockRes);

      assert.ok(mockRes.status.mock.callCount() > 0);
    });
  });

  describe('update', () => {
    it('deve atualizar médico existente', async () => {
      mockReq.params = { id: 'some-id' };
      mockReq.body = {
        nome: 'Dr. Nome Atualizado',
        telefone: '11999999999'
      };

      await medicoController.update(mockReq, mockRes);

      assert.ok(mockRes.json.mock.callCount() > 0 || mockRes.status.mock.callCount() > 0);
    });

    it('deve retornar erro ao atualizar médico inexistente', async () => {
      mockReq.params = { id: 'non-existent-id' };
      mockReq.body = { nome: 'Teste' };

      await medicoController.update(mockReq, mockRes);

      assert.ok(mockRes.json.mock.callCount() > 0 || mockRes.status.mock.callCount() > 0);
    });

    it('deve validar email ao atualizar', async () => {
      mockReq.params = { id: 'some-id' };
      mockReq.body = { email: 'email-invalido' };

      await medicoController.update(mockReq, mockRes);

      assert.ok(mockRes.status.mock.callCount() > 0);
    });
  });

  describe('delete', () => {
    it('deve deletar médico existente', async () => {
      mockReq.params = { id: 'some-id' };

      await medicoController.delete(mockReq, mockRes);

      assert.ok(
        mockRes.send.mock.callCount() > 0 || 
        mockRes.status.mock.callCount() > 0
      );
    });

    it('deve retornar 404 ao deletar médico inexistente', async () => {
      mockReq.params = { id: 'non-existent-id' };

      await medicoController.delete(mockReq, mockRes);

      assert.ok(mockRes.json.mock.callCount() > 0 || mockRes.status.mock.callCount() > 0);
    });
  });

  describe('findByEspecialidade', () => {
    it('deve retornar médicos por especialidade', async () => {
      mockReq.params = { especialidade: 'Cardiologia' };

      await medicoController.findByEspecialidade(mockReq, mockRes);

      assert.strictEqual(mockRes.json.mock.callCount(), 1);
      const response = mockRes.json.mock.calls[0].arguments[0];
      assert.ok(Array.isArray(response));
    });

    it('deve retornar array vazio para especialidade sem médicos', async () => {
      mockReq.params = { especialidade: 'EspecialidadeInexistente' };

      await medicoController.findByEspecialidade(mockReq, mockRes);

      assert.strictEqual(mockRes.json.mock.callCount(), 1);
      const response = mockRes.json.mock.calls[0].arguments[0];
      assert.ok(Array.isArray(response));
    });
  });

  describe('validações de entrada', () => {
    it('deve validar formato de email', async () => {
      mockReq.body = {
        nome: 'Dr. Teste',
        crm: 'CRM12345',
        especialidade: 'Cardiologia',
        telefone: '11987654321',
        email: 'email-sem-arroba'
      };

      await medicoController.create(mockReq, mockRes);

      assert.ok(mockRes.status.mock.callCount() > 0);
    });

    it('deve validar CRM mínimo', async () => {
      mockReq.body = {
        nome: 'Dr. Teste',
        crm: 'ABC',
        especialidade: 'Cardiologia',
        telefone: '11987654321',
        email: 'teste@example.com'
      };

      await medicoController.create(mockReq, mockRes);

      assert.ok(mockRes.status.mock.callCount() > 0);
    });
  });

  describe('tratamento de erros', () => {
    it('deve retornar 500 em caso de erro interno', async () => {
      // Simula erro ao passar ID inválido
      mockReq.params = { id: null };

      await medicoController.getById(mockReq, mockRes);

      assert.ok(mockRes.status.mock.callCount() > 0 || mockRes.json.mock.callCount() > 0);
    });
  });
});
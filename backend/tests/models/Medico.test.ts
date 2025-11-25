import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Medico } from '../../src/models/Medico';

describe('Medico Model', () => {
  let medicoModel: Medico;
  let mockPrisma: any;

  beforeEach(() => {
    // Mock do Prisma Client
    mockPrisma = {
      medico: {
        create: mock.fn(),
        findUnique: mock.fn(),
        findFirst: mock.fn(),
        findMany: mock.fn(),
        update: mock.fn(),
        delete: mock.fn(),
        count: mock.fn()
      }
    };

    medicoModel = new Medico(mockPrisma);
  });

  describe('create', () => {
    it('deve criar um médico com dados válidos', async () => {
      const medicoData = {
        nome: 'Dr. João Silva',
        crm: 'CRM12345',
        especialidade: 'Cardiologia',
        telefone: '11987654321',
        email: 'dr.joao@example.com'
      };

      const mockResult = { id: '123', ...medicoData };
      mockPrisma.medico.findUnique.mock.mockImplementation(() => Promise.resolve(null));
      mockPrisma.medico.create.mock.mockImplementation(() => Promise.resolve(mockResult));

      const result = await medicoModel.create(medicoData);

      assert.strictEqual(result.nome, medicoData.nome);
      assert.strictEqual(result.crm, medicoData.crm);
      assert.strictEqual(result.especialidade, medicoData.especialidade);
      assert.strictEqual(mockPrisma.medico.create.mock.callCount(), 1);
    });

    it('deve lançar erro se CRM já estiver cadastrado', async () => {
      const medicoData = {
        nome: 'Dr. João Silva',
        crm: 'CRM12345',
        especialidade: 'Cardiologia',
        telefone: '11987654321',
        email: 'dr.joao@example.com'
      };

      mockPrisma.medico.findUnique.mock.mockImplementation(() => 
        Promise.resolve({ id: '999', crm: 'CRM12345' })
      );

      await assert.rejects(
        async () => await medicoModel.create(medicoData),
        { message: /CRM já cadastrado/ }
      );
    });

    it('deve lançar erro se email for inválido', async () => {
      const medicoData = {
        nome: 'Dr. João Silva',
        crm: 'CRM12345',
        especialidade: 'Cardiologia',
        telefone: '11987654321',
        email: 'email-invalido'
      };

      await assert.rejects(
        async () => await medicoModel.create(medicoData),
        { message: /Email inválido/ }
      );
    });

    it('deve lançar erro se CRM for inválido', async () => {
      const medicoData = {
        nome: 'Dr. João Silva',
        crm: 'ABC',
        especialidade: 'Cardiologia',
        telefone: '11987654321',
        email: 'dr.joao@example.com'
      };

      await assert.rejects(
        async () => await medicoModel.create(medicoData),
        { message: /CRM inválido/ }
      );
    });

    it('deve lançar erro se campos obrigatórios estiverem faltando', async () => {
      const medicoData = {
        nome: 'Dr. João Silva',
        crm: 'CRM12345',
        especialidade: 'Cardiologia',
        telefone: '',
        email: 'dr.joao@example.com'
      };

      await assert.rejects(
        async () => await medicoModel.create(medicoData),
        { message: /Campo obrigatório faltando/ }
      );
    });
  });

  describe('findById', () => {
    it('deve retornar um médico quando encontrado', async () => {
      const mockMedico = {
        id: '123',
        nome: 'Dr. João Silva',
        crm: 'CRM12345',
        especialidade: 'Cardiologia',
        email: 'dr.joao@example.com'
      };

      mockPrisma.medico.findUnique.mock.mockImplementation(() => 
        Promise.resolve(mockMedico)
      );

      const result = await medicoModel.findById('123');

      assert.strictEqual(result?.id, '123');
      assert.strictEqual(result?.nome, 'Dr. João Silva');
      assert.strictEqual(result?.crm, 'CRM12345');
    });

    it('deve retornar null quando médico não for encontrado', async () => {
      mockPrisma.medico.findUnique.mock.mockImplementation(() => 
        Promise.resolve(null)
      );

      const result = await medicoModel.findById('999');

      assert.strictEqual(result, null);
    });
  });

  describe('update', () => {
    it('deve atualizar um médico com sucesso', async () => {
      const updateData = {
        nome: 'Dr. João Silva Atualizado',
        telefone: '11999999999'
      };

      const mockUpdated = {
        id: '123',
        nome: 'Dr. João Silva Atualizado',
        crm: 'CRM12345',
        especialidade: 'Cardiologia',
        telefone: '11999999999',
        email: 'dr.joao@example.com'
      };

      mockPrisma.medico.update.mock.mockImplementation(() => 
        Promise.resolve(mockUpdated)
      );

      const result = await medicoModel.update('123', updateData);

      assert.strictEqual(result.nome, updateData.nome);
      assert.strictEqual(result.telefone, updateData.telefone);
    });

    it('deve lançar erro ao atualizar médico não encontrado', async () => {
      mockPrisma.medico.update.mock.mockImplementation(() => {
        const error: any = new Error('Record not found');
        error.code = 'P2025';
        throw error;
      });

      await assert.rejects(
        async () => await medicoModel.update('999', { nome: 'Teste' }),
        { message: /Médico não encontrado/ }
      );
    });

    it('deve lançar erro ao tentar usar CRM de outro médico', async () => {
      mockPrisma.medico.findFirst.mock.mockImplementation(() => 
        Promise.resolve({ id: '456', crm: 'CRM12345' })
      );

      await assert.rejects(
        async () => await medicoModel.update('123', { crm: 'CRM12345' }),
        { message: /CRM já está em uso/ }
      );
    });
  });

  describe('delete', () => {
    it('deve deletar um médico com sucesso', async () => {
      mockPrisma.medico.delete.mock.mockImplementation(() => 
        Promise.resolve({ id: '123' })
      );

      await assert.doesNotReject(
        async () => await medicoModel.delete('123')
      );

      assert.strictEqual(mockPrisma.medico.delete.mock.callCount(), 1);
    });

    it('deve lançar erro ao deletar médico não encontrado', async () => {
      mockPrisma.medico.delete.mock.mockImplementation(() => {
        const error: any = new Error('Record not found');
        error.code = 'P2025';
        throw error;
      });

      await assert.rejects(
        async () => await medicoModel.delete('999'),
        { message: /Médico não encontrado/ }
      );
    });
  });

  describe('list', () => {
    it('deve listar médicos com paginação', async () => {
      const mockMedicos = [
        { id: '1', nome: 'Dr. A', crm: 'CRM111', especialidade: 'Cardiologia' },
        { id: '2', nome: 'Dr. B', crm: 'CRM222', especialidade: 'Ortopedia' }
      ];

      mockPrisma.medico.findMany.mock.mockImplementation(() => 
        Promise.resolve(mockMedicos)
      );
      mockPrisma.medico.count.mock.mockImplementation(() => 
        Promise.resolve(2)
      );

      const result = await medicoModel.list(1, 10);

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.total, 2);
    });

    it('deve aplicar paginação corretamente', async () => {
      mockPrisma.medico.findMany.mock.mockImplementation(() => 
        Promise.resolve([])
      );
      mockPrisma.medico.count.mock.mockImplementation(() => 
        Promise.resolve(25)
      );

      await medicoModel.list(3, 10);

      const calls = mockPrisma.medico.findMany.mock.calls;
      const lastCall = calls[calls.length - 1];
      
      assert.strictEqual(lastCall.arguments[0].skip, 20);
      assert.strictEqual(lastCall.arguments[0].take, 10);
    });
  });

  describe('findByEspecialidade', () => {
    it('deve retornar médicos da especialidade especificada', async () => {
      const mockMedicos = [
        { id: '1', nome: 'Dr. A', especialidade: 'Cardiologia' },
        { id: '2', nome: 'Dr. B', especialidade: 'Cardiologia' }
      ];

      mockPrisma.medico.findMany.mock.mockImplementation(() => 
        Promise.resolve(mockMedicos)
      );

      const result = await medicoModel.findByEspecialidade('Cardiologia');

      assert.strictEqual(result.length, 2);
      assert.strictEqual(result[0].especialidade, 'Cardiologia');
    });

    it('deve retornar array vazio se não houver médicos da especialidade', async () => {
      mockPrisma.medico.findMany.mock.mockImplementation(() => 
        Promise.resolve([])
      );

      const result = await medicoModel.findByEspecialidade('Neurologia');

      assert.strictEqual(result.length, 0);
    });
  });
});
import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { Paciente } from '../../src/models/Paciente';

describe('Paciente Model', () => {
  let pacienteModel: Paciente;
  let mockPrisma: any;

  beforeEach(() => {
    // Mock do Prisma Client
    mockPrisma = {
      paciente: {
        create: mock.fn(),
        findUnique: mock.fn(),
        findFirst: mock.fn(),
        update: mock.fn(),
        delete: mock.fn(),
        findMany: mock.fn(),
        count: mock.fn()
      }
    };

    pacienteModel = new Paciente(mockPrisma);
  });

  describe('create', () => {
    it('deve criar um paciente com dados válidos', async () => {
      const pacienteData = {
        nome: 'João Silva',
        cpf: '12345678901',
        dataNascimento: new Date('1990-01-01'),
        telefone: '11987654321',
        email: 'joao@example.com',
        endereco: 'Rua A, 123'
      };

      const mockResult = { id: '123', ...pacienteData };
      mockPrisma.paciente.findUnique.mock.mockImplementation(() => Promise.resolve(null));
      mockPrisma.paciente.create.mock.mockImplementation(() => Promise.resolve(mockResult));

      const result = await pacienteModel.create(pacienteData);

      assert.strictEqual(result.nome, pacienteData.nome);
      assert.strictEqual(result.cpf, pacienteData.cpf);
      assert.strictEqual(mockPrisma.paciente.create.mock.callCount(), 1);
    });

    it('deve lançar erro se CPF já estiver cadastrado', async () => {
      const pacienteData = {
        nome: 'João Silva',
        cpf: '12345678901',
        dataNascimento: new Date('1990-01-01'),
        telefone: '11987654321',
        email: 'joao@example.com'
      };

      mockPrisma.paciente.findUnique.mock.mockImplementation(() => 
        Promise.resolve({ id: '999', cpf: '12345678901' })
      );

      await assert.rejects(
        async () => await pacienteModel.create(pacienteData),
        { message: /CPF já cadastrado/ }
      );
    });

    it('deve lançar erro se email for inválido', async () => {
      const pacienteData = {
        nome: 'João Silva',
        cpf: '12345678901',
        dataNascimento: new Date('1990-01-01'),
        telefone: '11987654321',
        email: 'email-invalido'
      };

      await assert.rejects(
        async () => await pacienteModel.create(pacienteData),
        { message: /Email inválido/ }
      );
    });

    it('deve lançar erro se CPF for inválido', async () => {
      const pacienteData = {
        nome: 'João Silva',
        cpf: '123',
        dataNascimento: new Date('1990-01-01'),
        telefone: '11987654321',
        email: 'joao@example.com'
      };

      await assert.rejects(
        async () => await pacienteModel.create(pacienteData),
        { message: /CPF inválido/ }
      );
    });

    it('deve lançar erro se data de nascimento for no futuro', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const pacienteData = {
        nome: 'João Silva',
        cpf: '12345678901',
        dataNascimento: futureDate,
        telefone: '11987654321',
        email: 'joao@example.com'
      };

      mockPrisma.paciente.findUnique.mock.mockImplementation(() => Promise.resolve(null));

      await assert.rejects(
        async () => await pacienteModel.create(pacienteData),
        { message: /Data de nascimento não pode ser no futuro/ }
      );
    });
  });

  describe('findById', () => {
    it('deve retornar um paciente quando encontrado', async () => {
      const mockPaciente = {
        id: '123',
        nome: 'João Silva',
        cpf: '12345678901',
        email: 'joao@example.com'
      };

      mockPrisma.paciente.findUnique.mock.mockImplementation(() => 
        Promise.resolve(mockPaciente)
      );

      const result = await pacienteModel.findById('123');

      assert.strictEqual(result?.id, '123');
      assert.strictEqual(result?.nome, 'João Silva');
    });

    it('deve retornar null quando paciente não for encontrado', async () => {
      mockPrisma.paciente.findUnique.mock.mockImplementation(() => 
        Promise.resolve(null)
      );

      const result = await pacienteModel.findById('999');

      assert.strictEqual(result, null);
    });
  });

  describe('update', () => {
    it('deve atualizar um paciente com sucesso', async () => {
      const updateData = {
        nome: 'João Silva Atualizado',
        telefone: '11999999999'
      };

      const mockUpdated = {
        id: '123',
        nome: 'João Silva Atualizado',
        cpf: '12345678901',
        telefone: '11999999999',
        email: 'joao@example.com'
      };

      mockPrisma.paciente.update.mock.mockImplementation(() => 
        Promise.resolve(mockUpdated)
      );

      const result = await pacienteModel.update('123', updateData);

      assert.strictEqual(result.nome, updateData.nome);
      assert.strictEqual(result.telefone, updateData.telefone);
    });

    it('deve lançar erro ao atualizar paciente não encontrado', async () => {
      mockPrisma.paciente.update.mock.mockImplementation(() => {
        const error: any = new Error('Record not found');
        error.code = 'P2025';
        throw error;
      });

      await assert.rejects(
        async () => await pacienteModel.update('999', { nome: 'Teste' }),
        { message: /Paciente não encontrado/ }
      );
    });

    it('deve lançar erro ao tentar usar CPF de outro paciente', async () => {
      mockPrisma.paciente.findFirst.mock.mockImplementation(() => 
        Promise.resolve({ id: '456', cpf: '12345678901' })
      );

      await assert.rejects(
        async () => await pacienteModel.update('123', { cpf: '12345678901' }),
        { message: /CPF já está em uso/ }
      );
    });
  });

  describe('delete', () => {
    it('deve deletar um paciente com sucesso', async () => {
      mockPrisma.paciente.delete.mock.mockImplementation(() => 
        Promise.resolve({ id: '123' })
      );

      await assert.doesNotReject(
        async () => await pacienteModel.delete('123')
      );

      assert.strictEqual(mockPrisma.paciente.delete.mock.callCount(), 1);
    });

    it('deve lançar erro ao deletar paciente não encontrado', async () => {
      mockPrisma.paciente.delete.mock.mockImplementation(() => {
        const error: any = new Error('Record not found');
        error.code = 'P2025';
        throw error;
      });

      await assert.rejects(
        async () => await pacienteModel.delete('999'),
        { message: /Paciente não encontrado/ }
      );
    });
  });

  describe('list', () => {
    it('deve listar pacientes com paginação', async () => {
      const mockPacientes = [
        { id: '1', nome: 'Paciente 1', cpf: '11111111111' },
        { id: '2', nome: 'Paciente 2', cpf: '22222222222' }
      ];

      mockPrisma.paciente.findMany.mock.mockImplementation(() => 
        Promise.resolve(mockPacientes)
      );
      mockPrisma.paciente.count.mock.mockImplementation(() => 
        Promise.resolve(2)
      );

      const result = await pacienteModel.list(1, 10);

      assert.strictEqual(result.data.length, 2);
      assert.strictEqual(result.total, 2);
    });

    it('deve aplicar paginação corretamente', async () => {
      mockPrisma.paciente.findMany.mock.mockImplementation(() => 
        Promise.resolve([])
      );
      mockPrisma.paciente.count.mock.mockImplementation(() => 
        Promise.resolve(25)
      );

      await pacienteModel.list(2, 10);

      const calls = mockPrisma.paciente.findMany.mock.calls;
      const lastCall = calls[calls.length - 1];
      
      assert.strictEqual(lastCall.arguments[0].skip, 10);
      assert.strictEqual(lastCall.arguments[0].take, 10);
    });
  });
});
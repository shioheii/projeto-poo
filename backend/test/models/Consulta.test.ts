import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '../../../generated/prisma';
import { Consulta, IConsulta } from '../../src/models/Consulta';

describe('Consulta Model', () => {
  let consultaModel: Consulta;
  let mockPrisma: any;

  beforeEach(() => {
    // Criar mock do Prisma
    mockPrisma = {
      consulta: {
        create: mock.fn(),
        findUnique: mock.fn(),
        update: mock.fn(),
        delete: mock.fn(),
        findMany: mock.fn(),
        count: mock.fn()
      },
      horarioDisponivel: {
        findUnique: mock.fn(),
        findFirst: mock.fn()
      }
    };

    consultaModel = new Consulta(mockPrisma as unknown as PrismaClient);
  });

  describe('create', () => {
    it('deve criar uma consulta com sucesso', async () => {
      const mockHorario = {
        id: 'h1',
        medicoId: 'm1',
        data: new Date(),
        horaInicio: '09:00',
        horaFim: '09:30',
        ativo: true,
        consulta: null
      };

      const mockConsulta = {
        id: 'c1',
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h1',
        status: 'AGENDADA',
        observacoes: 'Teste',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.horarioDisponivel.findUnique.mock.mockImplementation(async () => mockHorario);
      mockPrisma.consulta.create.mock.mockImplementation(async () => mockConsulta);

      const data: IConsulta = {
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h1',
        observacoes: 'Teste'
      };

      const result = await consultaModel.create(data);

      assert.strictEqual(result.id, 'c1');
      assert.strictEqual(result.status, 'AGENDADA');
    });

    it('deve lançar erro se horário não existir', async () => {
      mockPrisma.horarioDisponivel.findUnique.mock.mockImplementation(async () => null);

      const data: IConsulta = {
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h999'
      };

      await assert.rejects(
        async () => await consultaModel.create(data),
        /Horário não encontrado/
      );
    });

    it('deve lançar erro se horário estiver inativo', async () => {
      const mockHorario = {
        id: 'h1',
        medicoId: 'm1',
        data: new Date(),
        horaInicio: '09:00',
        horaFim: '09:30',
        ativo: false,
        consulta: null
      };

      mockPrisma.horarioDisponivel.findUnique.mock.mockImplementation(async () => mockHorario);

      const data: IConsulta = {
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h1'
      };

      await assert.rejects(
        async () => await consultaModel.create(data),
        /Este horário está inativo/
      );
    });

    it('deve lançar erro se horário já estiver ocupado', async () => {
      const mockHorario = {
        id: 'h1',
        medicoId: 'm1',
        data: new Date(),
        horaInicio: '09:00',
        horaFim: '09:30',
        ativo: true,
        consulta: { id: 'c1' }
      };

      mockPrisma.horarioDisponivel.findUnique.mock.mockImplementation(async () => mockHorario);

      const data: IConsulta = {
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h1'
      };

      await assert.rejects(
        async () => await consultaModel.create(data),
        /Este horário já está ocupado/
      );
    });

    it('deve lançar erro se horário não pertencer ao médico', async () => {
      const mockHorario = {
        id: 'h1',
        medicoId: 'm2',
        data: new Date(),
        horaInicio: '09:00',
        horaFim: '09:30',
        ativo: true,
        consulta: null
      };

      mockPrisma.horarioDisponivel.findUnique.mock.mockImplementation(async () => mockHorario);

      const data: IConsulta = {
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h1'
      };

      await assert.rejects(
        async () => await consultaModel.create(data),
        /Este horário não pertence ao médico selecionado/
      );
    });
  });

  describe('findById', () => {
    it('deve retornar uma consulta por ID', async () => {
      const mockConsulta = {
        id: 'c1',
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h1',
        status: 'AGENDADA',
        observacoes: 'Teste',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.consulta.findUnique.mock.mockImplementation(async () => mockConsulta);

      const result = await consultaModel.findById('c1');

      assert.strictEqual(result?.id, 'c1');
      assert.strictEqual(result?.status, 'AGENDADA');
    });

    it('deve retornar null se consulta não existir', async () => {
      mockPrisma.consulta.findUnique.mock.mockImplementation(async () => null);

      const result = await consultaModel.findById('c999');

      assert.strictEqual(result, null);
    });
  });

  describe('update', () => {
    it('deve atualizar uma consulta', async () => {
      const mockConsulta = {
        id: 'c1',
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h1',
        status: 'CONFIRMADA',
        observacoes: 'Atualizado',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.consulta.update.mock.mockImplementation(async () => mockConsulta);

      const result = await consultaModel.update('c1', {
        status: 'CONFIRMADA',
        observacoes: 'Atualizado'
      });

      assert.strictEqual(result.status, 'CONFIRMADA');
      assert.strictEqual(result.observacoes, 'Atualizado');
    });

    it('deve validar novo horário se estiver sendo alterado', async () => {
      const mockHorario = {
        id: 'h2',
        medicoId: 'm1',
        data: new Date(),
        horaInicio: '10:00',
        horaFim: '10:30',
        ativo: true,
        consulta: null
      };

      const mockConsultaAtualizada = {
        id: 'c1',
        pacienteId: 'p1',
        medicoId: 'm1',
        horarioId: 'h2',
        status: 'AGENDADA',
        observacoes: '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.horarioDisponivel.findUnique.mock.mockImplementation(async () => mockHorario);
      mockPrisma.consulta.update.mock.mockImplementation(async () => mockConsultaAtualizada);

      const result = await consultaModel.update('c1', { horarioId: 'h2' });

      assert.strictEqual(result.horarioId, 'h2');
    });

    it('deve lançar erro se novo horário já estiver ocupado', async () => {
      const mockHorario = {
        id: 'h2',
        medicoId: 'm1',
        data: new Date(),
        horaInicio: '10:00',
        horaFim: '10:30',
        ativo: true,
        consulta: { id: 'c2' }
      };

      mockPrisma.horarioDisponivel.findUnique.mock.mockImplementation(async () => mockHorario);

      await assert.rejects(
        async () => await consultaModel.update('c1', { horarioId: 'h2' }),
        /Este horário já está ocupado/
      );
    });

    it('deve lançar erro se consulta não for encontrada', async () => {
      mockPrisma.consulta.update.mock.mockImplementation(async () => {
        const error: any = new Error('Not found');
        error.code = 'P2025';
        throw error;
      });

      await assert.rejects(
        async () => await consultaModel.update('c999', { status: 'CANCELADA' }),
        /Consulta não encontrada/
      );
    });
  });

  describe('delete', () => {
    it('deve deletar uma consulta', async () => {
      mockPrisma.consulta.delete.mock.mockImplementation(async () => ({}));

      await assert.doesNotReject(async () => {
        await consultaModel.delete('c1');
      });
    });

    it('deve lançar erro se consulta não for encontrada', async () => {
      mockPrisma.consulta.delete.mock.mockImplementation(async () => {
        const error: any = new Error('Not found');
        error.code = 'P2025';
        throw error;
      });

      await assert.rejects(
        async () => await consultaModel.delete('c999'),
        /Consulta não encontrada/
      );
    });
  });

  describe('list', () => {
    it('deve listar consultas com paginação', async () => {
      const mockConsultas = [
        {
          id: 'c1',
          pacienteId: 'p1',
          medicoId: 'm1',
          horarioId: 'h1',
          status: 'AGENDADA',
          observacoes: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.consulta.findMany.mock.mockImplementation(async () => mockConsultas);
      mockPrisma.consulta.count.mock.mockImplementation(async () => 1);

      const result = await consultaModel.list(1, 10);

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.total, 1);
    });
  });

  describe('findByMedico', () => {
    it('deve buscar consultas por médico', async () => {
      const mockConsultas = [
        {
          id: 'c1',
          pacienteId: 'p1',
          medicoId: 'm1',
          horarioId: 'h1',
          status: 'AGENDADA',
          observacoes: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.consulta.findMany.mock.mockImplementation(async () => mockConsultas);

      const result = await consultaModel.findByMedico('m1');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].medicoId, 'm1');
    });

    it('deve filtrar por data quando fornecida', async () => {
      const mockConsultas = [
        {
          id: 'c1',
          pacienteId: 'p1',
          medicoId: 'm1',
          horarioId: 'h1',
          status: 'AGENDADA',
          observacoes: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.consulta.findMany.mock.mockImplementation(async () => mockConsultas);

      const data = new Date('2024-12-01');
      const result = await consultaModel.findByMedico('m1', data);

      assert.strictEqual(result.length, 1);
    });
  });

  describe('findByPaciente', () => {
    it('deve buscar consultas por paciente com paginação', async () => {
      const mockConsultas = [
        {
          id: 'c1',
          pacienteId: 'p1',
          medicoId: 'm1',
          horarioId: 'h1',
          status: 'AGENDADA',
          observacoes: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.consulta.findMany.mock.mockImplementation(async () => mockConsultas);
      mockPrisma.consulta.count.mock.mockImplementation(async () => 1);

      const result = await consultaModel.findByPaciente('p1', 1, 10);

      assert.strictEqual(result.consultas.length, 1);
      assert.strictEqual(result.total, 1);
      assert.strictEqual(result.paginas, 1);
    });

    it('deve filtrar por data e status quando fornecidos', async () => {
      const mockConsultas = [
        {
          id: 'c1',
          pacienteId: 'p1',
          medicoId: 'm1',
          horarioId: 'h1',
          status: 'CONFIRMADA',
          observacoes: '',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.consulta.findMany.mock.mockImplementation(async () => mockConsultas);
      mockPrisma.consulta.count.mock.mockImplementation(async () => 1);

      const result = await consultaModel.findByPaciente(
        'p1',
        1,
        10,
        '2024-12-01',
        'CONFIRMADA'
      );

      assert.strictEqual(result.consultas.length, 1);
      assert.strictEqual(result.consultas[0].status, 'CONFIRMADA');
    });
  });
});
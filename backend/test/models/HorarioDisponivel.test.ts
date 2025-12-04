import { describe, it, mock, beforeEach } from 'node:test';
import assert from 'node:assert';
import { PrismaClient } from '../../../generated/prisma';
import { HorarioDisponivel, IHorarioDisponivel } from '../../src/models/HorarioDisponivel';

describe('HorarioDisponivel Model', () => {
  let horarioModel: HorarioDisponivel;
  let mockPrisma: any;

  beforeEach(() => {
    // Criar mock do Prisma
    mockPrisma = {
      horarioDisponivel: {
        create: mock.fn(),
        findUnique: mock.fn(),
        findFirst: mock.fn(),
        findMany: mock.fn(),
        update: mock.fn(),
        delete: mock.fn(),
        count: mock.fn()
      }
    };

    horarioModel = new HorarioDisponivel(mockPrisma as unknown as PrismaClient);
  });

  describe('create', () => {
    it('deve criar um horário disponível', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockHorario = {
        id: 'h1',
        medicoId: 'm1',
        data: tomorrow,
        horaInicio: '09:00',
        horaFim: '09:30',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.horarioDisponivel.create.mock.mockImplementation(async () => mockHorario);

      const data: IHorarioDisponivel = {
        medicoId: 'm1',
        data: tomorrow,
        horaInicio: '09:00',
        horaFim: '09:30'
      };

      const result = await horarioModel.create(data);

      assert.strictEqual(result.id, 'h1');
      assert.strictEqual(result.horaInicio, '09:00');
      assert.strictEqual(result.ativo, true);
    });

    it('deve lançar erro para formato de horário inválido', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const data: IHorarioDisponivel = {
        medicoId: 'm1',
        data: tomorrow,
        horaInicio: '25:00',
        horaFim: '09:30'
      };

      await assert.rejects(
        async () => await horarioModel.create(data),
        /Formato de horário inválido/
      );
    });

    it('deve lançar erro se hora de início for após hora de fim', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const data: IHorarioDisponivel = {
        medicoId: 'm1',
        data: tomorrow,
        horaInicio: '10:00',
        horaFim: '09:00'
      };

      await assert.rejects(
        async () => await horarioModel.create(data),
        /Hora de início deve ser anterior à hora de fim/
      );
    });

    it('deve lançar erro para datas passadas', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const data: IHorarioDisponivel = {
        medicoId: 'm1',
        data: yesterday,
        horaInicio: '09:00',
        horaFim: '09:30'
      };

      await assert.rejects(
        async () => await horarioModel.create(data),
        /Não é possível cadastrar horários para datas passadas/
      );
    });
  });

  describe('findById', () => {
    it('deve retornar um horário por ID', async () => {
      const mockHorario = {
        id: 'h1',
        medicoId: 'm1',
        data: new Date(),
        horaInicio: '09:00',
        horaFim: '09:30',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.horarioDisponivel.findUnique.mock.mockImplementation(async () => mockHorario);

      const result = await horarioModel.findById('h1');

      assert.strictEqual(result?.id, 'h1');
      assert.strictEqual(result?.ativo, true);
    });

    it('deve retornar null se horário não existir', async () => {
      mockPrisma.horarioDisponivel.findUnique.mock.mockImplementation(async () => null);

      const result = await horarioModel.findById('h999');

      assert.strictEqual(result, null);
    });
  });

  describe('update', () => {
    it('deve atualizar um horário', async () => {
      const mockHorario = {
        id: 'h1',
        medicoId: 'm1',
        data: new Date(),
        horaInicio: '09:00',
        horaFim: '09:30',
        ativo: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.horarioDisponivel.update.mock.mockImplementation(async () => mockHorario);

      const result = await horarioModel.update('h1', { ativo: false });

      assert.strictEqual(result.ativo, false);
    });

    it('deve lançar erro se horário não for encontrado', async () => {
      mockPrisma.horarioDisponivel.update.mock.mockImplementation(async () => {
        const error: any = new Error('Not found');
        error.code = 'P2025';
        throw error;
      });

      await assert.rejects(
        async () => await horarioModel.update('h999', { ativo: false }),
        /Horário disponível não encontrado/
      );
    });
  });

  describe('delete', () => {
    it('deve deletar um horário sem consulta', async () => {
      const mockHorario = {
        id: 'h1',
        medicoId: 'm1',
        data: new Date(),
        horaInicio: '09:00',
        horaFim: '09:30',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        consulta: null
      };

      mockPrisma.horarioDisponivel.findUnique.mock.mockImplementation(async () => mockHorario);
      mockPrisma.horarioDisponivel.delete.mock.mockImplementation(async () => ({}));

      await assert.doesNotReject(async () => {
        await horarioModel.delete('h1');
      });
    });

    it('deve lançar erro se horário tiver consulta agendada', async () => {
      const mockHorario = {
        id: 'h1',
        medicoId: 'm1',
        data: new Date(),
        horaInicio: '09:00',
        horaFim: '09:30',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        consulta: { id: 'c1' }
      };

      mockPrisma.horarioDisponivel.findUnique.mock.mockImplementation(async () => mockHorario);

      await assert.rejects(
        async () => await horarioModel.delete('h1'),
        /Não é possível excluir horário com consulta agendada/
      );
    });

    it('deve lançar erro se horário não for encontrado', async () => {
      mockPrisma.horarioDisponivel.findUnique.mock.mockImplementation(async () => null);
      mockPrisma.horarioDisponivel.delete.mock.mockImplementation(async () => {
        const error: any = new Error('Not found');
        error.code = 'P2025';
        throw error;
      });

      await assert.rejects(
        async () => await horarioModel.delete('h999'),
        /Horário disponível não encontrado/
      );
    });
  });

  describe('list', () => {
    it('deve listar horários com paginação', async () => {
      const mockHorarios = [
        {
          id: 'h1',
          medicoId: 'm1',
          data: new Date(),
          horaInicio: '09:00',
          horaFim: '09:30',
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.horarioDisponivel.findMany.mock.mockImplementation(async () => mockHorarios);
      mockPrisma.horarioDisponivel.count.mock.mockImplementation(async () => 1);

      const result = await horarioModel.list(1, 10);

      assert.strictEqual(result.data.length, 1);
      assert.strictEqual(result.total, 1);
    });
  });

  describe('listByMedico', () => {
    it('deve listar horários por médico', async () => {
      const mockHorarios = [
        {
          id: 'h1',
          medicoId: 'm1',
          data: new Date(),
          horaInicio: '09:00',
          horaFim: '09:30',
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.horarioDisponivel.findMany.mock.mockImplementation(async () => mockHorarios);

      const result = await horarioModel.listByMedico('m1');

      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].medicoId, 'm1');
    });

    it('deve filtrar por intervalo de datas', async () => {
      const mockHorarios = [
        {
          id: 'h1',
          medicoId: 'm1',
          data: new Date('2024-12-15'),
          horaInicio: '09:00',
          horaFim: '09:30',
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.horarioDisponivel.findMany.mock.mockImplementation(async () => mockHorarios);

      const dataInicio = new Date('2024-12-01');
      const dataFim = new Date('2024-12-31');
      const result = await horarioModel.listByMedico('m1', dataInicio, dataFim);

      assert.strictEqual(result.length, 1);
    });
  });

  describe('getHorariosDisponiveis', () => {
    it('deve retornar apenas horários disponíveis (sem consulta)', async () => {
      const mockHorarios = [
        {
          id: 'h1',
          medicoId: 'm1',
          data: new Date(),
          horaInicio: '09:00',
          horaFim: '09:30',
          ativo: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.horarioDisponivel.findMany.mock.mockImplementation(async () => mockHorarios);

      const data = new Date('2024-12-01');
      const result = await horarioModel.getHorariosDisponiveis('m1', data);

      assert.strictEqual(result.length, 1);
    });
  });

  describe('createMultiple', () => {
    it('deve criar múltiplos horários', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const horarios: IHorarioDisponivel[] = [
        {
          medicoId: 'm1',
          data: tomorrow,
          horaInicio: '09:00',
          horaFim: '09:30',
          ativo: true
        },
        {
          medicoId: 'm1',
          data: tomorrow,
          horaInicio: '09:30',
          horaFim: '10:00',
          ativo: true
        }
      ];

      const mockHorario = {
        id: 'h1',
        medicoId: 'm1',
        data: tomorrow,
        horaInicio: '09:00',
        horaFim: '09:30',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.horarioDisponivel.findFirst.mock.mockImplementation(async () => null);
      mockPrisma.horarioDisponivel.create.mock.mockImplementation(async () => mockHorario);

      const result = await horarioModel.createMultiple(horarios);

      assert.strictEqual(result.length, 2);
    });

    it('deve ignorar horários duplicados', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const horarios: IHorarioDisponivel[] = [
        {
          medicoId: 'm1',
          data: tomorrow,
          horaInicio: '09:00',
          horaFim: '09:30',
          ativo: true
        }
      ];

      const mockExistente = {
        id: 'h1',
        medicoId: 'm1',
        data: tomorrow,
        horaInicio: '09:00',
        horaFim: '09:30',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.horarioDisponivel.findFirst.mock.mockImplementation(async () => mockExistente);

      const result = await horarioModel.createMultiple(horarios);

      assert.strictEqual(result.length, 0);
    });
  });
});
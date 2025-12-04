import { PrismaClient, Paciente as PacientePrisma } from '../../../generated/prisma';
import { BaseModel } from './BaseModel';

export interface IPaciente {
  id?: string;
  nome: string;
  cpf: string;
  dataNascimento: Date;
  telefone: string;
  email: string;
  endereco?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Paciente extends BaseModel<PacientePrisma> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async create(data: IPaciente): Promise<PacientePrisma> {
    try {
      // Validações de negócio
      this.validateRequiredFields(data, ['nome', 'cpf', 'dataNascimento', 'telefone', 'email']);
      this.validateEmail(data.email);
      this.validateCPF(data.cpf);
      this.validateDataNascimento(data.dataNascimento);

      // Verificar se CPF já existe
      const existingPaciente = await this.prisma.paciente.findUnique({
        where: { cpf: data.cpf }
      });

      if (existingPaciente) {
        throw new Error('CPF já cadastrado');
      }

      // Criar paciente
      return await this.prisma.paciente.create({
        data: {
          nome: data.nome,
          cpf: data.cpf,
          dataNascimento: data.dataNascimento,
          telefone: data.telefone,
          email: data.email,
          endereco: data.endereco
        }
      });
    } catch (error: any) {
      throw new Error(`Erro ao criar paciente: ${error.message}`);
    }
  }

  async findById(id: string): Promise<PacientePrisma | null> {
    try {
      return await this.prisma.paciente.findUnique({
        where: { id }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar paciente: ${error.message}`);
    }
  }

  async update(id: string, data: Partial<IPaciente>): Promise<PacientePrisma> {
    try {
      if (data.email) {
        this.validateEmail(data.email);
      }

      if (data.cpf) {
        this.validateCPF(data.cpf);
        
        // Verificar se outro paciente já usa esse CPF
        const existingPaciente = await this.prisma.paciente.findFirst({
          where: {
            cpf: data.cpf,
            NOT: { id }
          }
        });

        if (existingPaciente) {
          throw new Error('CPF já está em uso por outro paciente');
        }
      }

      if (data.dataNascimento) {
        this.validateDataNascimento(data.dataNascimento);
      }

      return await this.prisma.paciente.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Paciente não encontrado');
      }
      throw new Error(`Erro ao atualizar paciente: ${error.message}`);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.paciente.delete({
        where: { id }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('Paciente não encontrado');
      }
      throw new Error(`Erro ao deletar paciente: ${error.message}`);
    }
  }

  async list(page: number = 1, limit: number = 10): Promise<{ data: PacientePrisma[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.paciente.findMany({
          skip,
          take: limit,
          orderBy: { nome: 'asc' }
        }),
        this.prisma.paciente.count()
      ]);

      return { data, total };
    } catch (error: any) {
      throw new Error(`Erro ao listar pacientes: ${error.message}`);
    }
  }

  async findByEmail(email: string): Promise<PacientePrisma | null> {
    try {
      return await this.prisma.paciente.findUnique({
        where: { email }
      });
    } catch (error: any) {
      throw new Error(`Erro ao buscar paciente por email: ${error.message}`);
    }
  }

  private validateDataNascimento(dataNascimento: Date): void {
    const hoje = new Date();
    const idade = hoje.getFullYear() - dataNascimento.getFullYear();
    
    if (idade > 120) {
      throw new Error('Data de nascimento inválida');
    }
    
    if (idade < 0) {
      throw new Error('Data de nascimento não pode ser no futuro');
    }
  }
}
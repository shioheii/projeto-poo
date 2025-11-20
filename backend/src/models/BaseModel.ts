import { PrismaClient } from '../../../generated/prisma';

export abstract class BaseModel<T> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  abstract create(data: any): Promise<T>;
  abstract findById(id: string): Promise<T | null>;
  abstract update(id: string, data: any): Promise<T>;
  abstract delete(id: string): Promise<void>;
  abstract list(page: number, limit: number): Promise<{ data: T[]; total: number }>;

  protected validateRequiredFields(data: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Campo obrigatório faltando: ${field}`);
      }
    }
  }

  protected validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }
  }

  protected validateCPF(cpf: string): void {
    // Implementação básica - pode ser expandida
    if (!cpf || cpf.length !== 11) {
      throw new Error('CPF inválido');
    }
  }
}
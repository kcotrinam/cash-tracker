import { TransactionType } from '@prisma/client';

export const defaultCategories = [
  { name: 'Salario', normalizedName: 'salario', type: TransactionType.INCOME },
  { name: 'Freelance', normalizedName: 'freelance', type: TransactionType.INCOME },
  {
    name: 'Otros ingresos',
    normalizedName: 'otros ingresos',
    type: TransactionType.INCOME,
    isFallback: true,
  },
  { name: 'Vivienda', normalizedName: 'vivienda', type: TransactionType.EXPENSE },
  { name: 'Alimentación', normalizedName: 'alimentacion', type: TransactionType.EXPENSE },
  { name: 'Transporte', normalizedName: 'transporte', type: TransactionType.EXPENSE },
  { name: 'Servicios', normalizedName: 'servicios', type: TransactionType.EXPENSE },
  { name: 'Salud', normalizedName: 'salud', type: TransactionType.EXPENSE },
  {
    name: 'Entretenimiento',
    normalizedName: 'entretenimiento',
    type: TransactionType.EXPENSE,
  },
  {
    name: 'Otros gastos',
    normalizedName: 'otros gastos',
    type: TransactionType.EXPENSE,
    isFallback: true,
  },
] as const;

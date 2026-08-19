import { AppLanguage, TransactionType } from '@prisma/client';
import { normalizeCategoryName } from './category-normalization';

type DefaultCategory = {
  key: string;
  type: TransactionType;
  isFallback?: boolean;
  names: Record<AppLanguage, string>;
};

const definitions: readonly DefaultCategory[] = [
  { key: 'salary', type: TransactionType.INCOME, names: { EN: 'Salary', ES: 'Salario' } },
  { key: 'freelance', type: TransactionType.INCOME, names: { EN: 'Freelance', ES: 'Freelance' } },
  {
    key: 'other-income',
    type: TransactionType.INCOME,
    isFallback: true,
    names: { EN: 'Other income', ES: 'Otros ingresos' },
  },
  { key: 'housing', type: TransactionType.EXPENSE, names: { EN: 'Housing', ES: 'Vivienda' } },
  { key: 'food', type: TransactionType.EXPENSE, names: { EN: 'Food', ES: 'Alimentación' } },
  { key: 'transport', type: TransactionType.EXPENSE, names: { EN: 'Transport', ES: 'Transporte' } },
  { key: 'utilities', type: TransactionType.EXPENSE, names: { EN: 'Utilities', ES: 'Servicios' } },
  { key: 'health', type: TransactionType.EXPENSE, names: { EN: 'Health', ES: 'Salud' } },
  {
    key: 'entertainment',
    type: TransactionType.EXPENSE,
    names: { EN: 'Entertainment', ES: 'Entretenimiento' },
  },
  {
    key: 'other-expenses',
    type: TransactionType.EXPENSE,
    isFallback: true,
    names: { EN: 'Other expenses', ES: 'Otros gastos' },
  },
];

export function defaultCategories(language: AppLanguage) {
  return definitions.map(({ key, type, isFallback, names }) => {
    const name = names[language];
    return { defaultKey: key, name, normalizedName: normalizeCategoryName(name), type, isFallback };
  });
}

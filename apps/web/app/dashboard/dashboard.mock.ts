import type { DashboardData, DashboardDataSource } from './dashboard.types';
import { subtractAmounts, sumAmounts } from './money';

const penTransactions: DashboardData['recentTransactions'] = [
  {
    id: 'pen-income-extra',
    description: 'Ingreso adicional por asesoría',
    occurredOn: '2026-10-29',
    type: 'INCOME',
    amount: '1150.00',
    currencyCode: 'PEN',
    category: { id: 'other-income', name: 'Ingresos adicionales', icon: 'spark' },
  },
  {
    id: 'pen-income-freelance',
    description: 'Proyecto freelance',
    occurredOn: '2026-10-28',
    type: 'INCOME',
    amount: '1200.00',
    currencyCode: 'PEN',
    category: { id: 'freelance', name: 'Trabajo freelance', icon: 'briefcase' },
  },
  {
    id: 'pen-income-salary',
    description: 'Salario mensual',
    occurredOn: '2026-10-25',
    type: 'INCOME',
    amount: '3500.00',
    currencyCode: 'PEN',
    category: { id: 'salary', name: 'Salario', icon: 'wallet' },
  },
  {
    id: 'pen-expense-food',
    description: 'Compras de alimentación',
    occurredOn: '2026-10-18',
    type: 'EXPENSE',
    amount: '600.00',
    currencyCode: 'PEN',
    category: { id: 'food', name: 'Alimentación', icon: 'utensils' },
  },
  {
    id: 'pen-expense-transport',
    description: 'Movilidad y transporte',
    occurredOn: '2026-10-14',
    type: 'EXPENSE',
    amount: '300.00',
    currencyCode: 'PEN',
    category: { id: 'transport', name: 'Transporte', icon: 'car' },
  },
  {
    id: 'pen-expense-services',
    description: 'Servicios del hogar',
    occurredOn: '2026-10-09',
    type: 'EXPENSE',
    amount: '250.50',
    currencyCode: 'PEN',
    category: { id: 'services', name: 'Servicios', icon: 'bolt' },
  },
  {
    id: 'pen-expense-other',
    description: 'Gasto imprevisto',
    occurredOn: '2026-10-05',
    type: 'EXPENSE',
    amount: '80.00',
    currencyCode: 'PEN',
    category: { id: 'other', name: 'Otros gastos', icon: 'dots' },
  },
  {
    id: 'pen-expense-rent',
    description: 'Alquiler de octubre',
    occurredOn: '2026-10-01',
    type: 'EXPENSE',
    amount: '1200.00',
    currencyCode: 'PEN',
    category: { id: 'housing', name: 'Vivienda', icon: 'home' },
  },
];
function createData(
  month: string,
  currency: DashboardData['currency'],
  transactions: DashboardData['recentTransactions'],
  spending: DashboardData['spendingByCategory'],
  recurringItems: DashboardData['recurringItems'],
): DashboardData {
  const income = sumAmounts(
    transactions.filter((item) => item.type === 'INCOME').map((item) => item.amount),
  );
  const expenses = sumAmounts(
    transactions.filter((item) => item.type === 'EXPENSE').map((item) => item.amount),
  );
  return {
    month,
    currency,
    summary: { income, expenses, netBalance: subtractAmounts(income, expenses) },
    spendingByCategory: spending,
    recentTransactions: transactions,
    recurringItems,
  };
}
const penData = createData(
  '2026-10',
  'PEN',
  penTransactions,
  [
    {
      categoryId: 'housing',
      categoryName: 'Vivienda',
      amount: '1200.00',
      percentage: '49.37',
      color: '#b8c3b8',
    },
    {
      categoryId: 'food',
      categoryName: 'Alimentación',
      amount: '600.00',
      percentage: '24.69',
      color: '#9ea9b3',
    },
    {
      categoryId: 'transport',
      categoryName: 'Transporte',
      amount: '300.00',
      percentage: '12.34',
      color: '#84959b',
    },
    {
      categoryId: 'services',
      categoryName: 'Servicios',
      amount: '250.50',
      percentage: '10.31',
      color: '#a79d8e',
    },
    {
      categoryId: 'other',
      categoryName: 'Otros gastos',
      amount: '80.00',
      percentage: '3.29',
      color: '#737d86',
    },
  ],
  [
    {
      id: 'salary-recurring',
      name: 'Salario mensual',
      type: 'INCOME',
      amount: '3500.00',
      currencyCode: 'PEN',
      scheduledOn: '2026-10-25',
      periodStatus: 'RECORDED',
      recordedTransactionId: 'pen-income-salary',
    },
    {
      id: 'rent-recurring',
      name: 'Alquiler',
      type: 'EXPENSE',
      amount: '1200.00',
      currencyCode: 'PEN',
      scheduledOn: '2026-10-01',
      periodStatus: 'RECORDED',
      recordedTransactionId: 'pen-expense-rent',
    },
    {
      id: 'internet-recurring',
      name: 'Internet',
      type: 'EXPENSE',
      amount: '99.00',
      currencyCode: 'PEN',
      scheduledOn: '2026-10-12',
      periodStatus: 'PENDING',
    },
  ],
);
const usdData = createData(
  '2026-10',
  'USD',
  [
    {
      id: 'usd-income',
      description: 'Proyecto para cliente internacional',
      occurredOn: '2026-10-21',
      type: 'INCOME',
      amount: '900.00',
      currencyCode: 'USD',
      category: { id: 'freelance', name: 'Trabajo freelance', icon: 'briefcase' },
    },
    {
      id: 'usd-expense',
      description: 'Herramientas de trabajo',
      occurredOn: '2026-10-12',
      type: 'EXPENSE',
      amount: '120.00',
      currencyCode: 'USD',
      category: { id: 'tools', name: 'Servicios', icon: 'bolt' },
    },
  ],
  [
    {
      categoryId: 'tools',
      categoryName: 'Servicios',
      amount: '120.00',
      percentage: '100.00',
      color: '#a79d8e',
    },
  ],
  [
    {
      id: 'usd-subscription',
      name: 'Suscripción profesional',
      type: 'EXPENSE',
      amount: '20.00',
      currencyCode: 'USD',
      scheduledOn: '2026-10-18',
      periodStatus: 'PENDING',
    },
  ],
);
const data = new Map<string, DashboardData>([
  ['2026-10:PEN', penData],
  ['2026-10:USD', usdData],
]);
export const dashboardMockDataSource: DashboardDataSource = {
  async getDashboard({ month, currency }) {
    await new Promise((resolve) => setTimeout(resolve, 180));
    return data.get(`${month}:${currency}`) ?? null;
  },
};

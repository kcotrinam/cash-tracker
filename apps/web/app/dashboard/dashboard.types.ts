export type CurrencyCode = 'PEN' | 'USD';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type PeriodStatus = 'PENDING' | 'RECORDED' | 'INACTIVE';

export type DashboardData = {
  month: string;
  currency: CurrencyCode;
  summary: {
    income: string;
    expenses: string;
    netBalance: string;
    cardPaymentsDue: string;
    availableAfterCardPayments: string;
  };
  spendingByCategory: Array<{
    categoryId: string;
    categoryName: string;
    color?: string;
    amount: string;
    percentage: string;
  }>;
  recentTransactions: Array<{
    id: string;
    description: string;
    occurredOn: string;
    type: TransactionType;
    amount: string;
    currencyCode: CurrencyCode;
    category: { id: string; name: string; icon?: string };
  }>;
  recurringItems: Array<{
    id: string;
    name: string;
    type: TransactionType;
    amount: string;
    currencyCode: CurrencyCode;
    scheduledOn: string;
    periodStatus: PeriodStatus;
    recordedTransactionId?: string;
  }>;
  creditCards: Array<{
    id: string;
    name: string;
    creditLimit: string;
    outstandingBalance: string;
    availableCredit: string;
    dueOn?: string;
    statementBalance?: string;
    minimumPayment?: string | null;
  }>;
};

export type DashboardRequest = { month: string; currency: CurrencyCode };
export type DashboardDataSource = {
  getDashboard(request: DashboardRequest): Promise<DashboardData | null>;
};

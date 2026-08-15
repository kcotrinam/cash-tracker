/** Currencies supported in the initial CashTracker release. */
export const CurrencyCode = {
  PEN: 'PEN',
  USD: 'USD',
} as const;

export type CurrencyCode = (typeof CurrencyCode)[keyof typeof CurrencyCode];

/** The only supported financial transaction directions. */
export const TransactionType = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

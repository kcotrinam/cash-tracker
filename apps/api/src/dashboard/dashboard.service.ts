import { Injectable } from '@nestjs/common';
import { Prisma, RecurringTransactionStatus, TransactionType } from '@prisma/client';
import {
  dateOnlyString,
  firstScheduledOnOrAfter,
  parseDateOnly,
} from '../recurring-transactions/recurrence-date';
import { PrismaService } from '../prisma/prisma.service';
import { GetDashboardDto } from './dashboard.dto';

const categorySelect = { id: true, name: true, color: true, icon: true } as const;

function monthRange(month: string) {
  const start = parseDateOnly(`${month}-01`);
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1, 12));
  return { start, end, lastDay: new Date(end.getTime() - 86400000) };
}
function amount(value: Prisma.Decimal) {
  return value.toFixed();
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string, dto: GetDashboardDto) {
    const { start, end, lastDay } = monthRange(dto.month);
    const where = {
      userId,
      currencyCode: dto.currency,
      occurredOn: { gte: start, lt: end },
    };
    const [transactions, grouped, recurring, creditCards] =
      await this.prisma.$transaction([
        this.prisma.transaction.findMany({
          where,
          include: { category: { select: categorySelect } },
          orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
          take: 20,
        }),
        this.prisma.transaction.groupBy({
          by: ['type'],
          where,
          _sum: { amount: true },
        }),
        this.prisma.recurringTransaction.findMany({
          where: {
            userId,
            currency: dto.currency,
            status: RecurringTransactionStatus.ACTIVE,
            startDate: { lte: lastDay },
            OR: [{ endDate: null }, { endDate: { gte: start } }],
          },
          include: { recordedTransactions: { where, select: { id: true } } },
        }),
        this.prisma.creditCard.findMany({
          where: { userId, currency: dto.currency, isActive: true },
          include: {
            statements: {
              where: { status: { not: 'PAID' } },
              orderBy: { dueOn: 'asc' },
              take: 1,
            },
            transactions: {
              where: { type: TransactionType.EXPENSE },
              select: { amount: true },
            },
            payments: { select: { amount: true } },
          },
        }),
      ]);
    const incomes =
      grouped.find((row) => row.type === TransactionType.INCOME)?._sum.amount ??
      new Prisma.Decimal(0);
    const expenses =
      grouped.find((row) => row.type === TransactionType.EXPENSE)?._sum.amount ??
      new Prisma.Decimal(0);
    const spendingGroups = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { ...where, type: TransactionType.EXPENSE },
      _sum: { amount: true },
    });
    const categories = await this.prisma.category.findMany({
      where: { id: { in: spendingGroups.map((row) => row.categoryId) }, userId },
      select: { id: true, name: true, color: true },
    });
    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const cardPaymentsDue = creditCards.reduce((total, card) => {
      const statement = card.statements[0];
      return statement && statement.dueOn >= start && statement.dueOn < end
        ? total.plus(statement.remainingBalance)
        : total;
    }, new Prisma.Decimal(0));
    return {
      month: dto.month,
      currency: dto.currency,
      summary: {
        income: amount(incomes),
        expenses: amount(expenses),
        netBalance: amount(incomes.minus(expenses)),
        cardPaymentsDue: amount(cardPaymentsDue),
        availableAfterCardPayments: amount(
          incomes.minus(expenses).minus(cardPaymentsDue),
        ),
      },
      spendingByCategory: spendingGroups.map((row) => {
        const category = categoryById.get(row.categoryId);
        const value = row._sum.amount ?? new Prisma.Decimal(0);
        return {
          categoryId: row.categoryId,
          categoryName: category?.name ?? 'Uncategorized',
          ...(category?.color ? { color: category.color } : {}),
          amount: amount(value),
          percentage: expenses.isZero()
            ? '0'
            : value.dividedBy(expenses).times(100).toDecimalPlaces(2).toFixed(),
        };
      }),
      recentTransactions: transactions.map((transaction) => ({
        id: transaction.id,
        description: transaction.description ?? 'No description',
        occurredOn: dateOnlyString(transaction.occurredOn),
        type: transaction.type,
        amount: amount(transaction.amount),
        currencyCode: transaction.currencyCode,
        category: transaction.category,
      })),
      recurringItems: recurring.flatMap((item) => {
        const scheduledOn = firstScheduledOnOrAfter(
          item.startDate,
          item.frequency,
          item.interval,
          item.anchorDay,
          start,
        );
        if (scheduledOn >= end || (item.endDate && scheduledOn > item.endDate)) return [];
        const recorded = item.recordedTransactions[0];
        return [
          {
            id: item.id,
            name: item.description,
            type: item.type,
            amount: amount(item.amount),
            currencyCode: dto.currency,
            scheduledOn: dateOnlyString(scheduledOn),
            periodStatus: recorded ? 'RECORDED' : 'PENDING',
            ...(recorded ? { recordedTransactionId: recorded.id } : {}),
          },
        ];
      }),
      creditCards: creditCards.map((card) => {
        const debt = card.initialBalance
          .plus(
            card.transactions.reduce(
              (sum, item) => sum.plus(item.amount),
              new Prisma.Decimal(0),
            ),
          )
          .minus(
            card.payments.reduce(
              (sum, item) => sum.plus(item.amount),
              new Prisma.Decimal(0),
            ),
          );
        const statement = card.statements[0];
        return {
          id: card.id,
          name: card.name,
          outstandingBalance: amount(Prisma.Decimal.max(debt, 0)),
          ...(statement
            ? {
                dueOn: dateOnlyString(statement.dueOn),
                statementBalance: amount(statement.remainingBalance),
                minimumPayment: statement.minimumPayment
                  ? amount(statement.minimumPayment)
                  : null,
              }
            : {}),
        };
      }),
    };
  }
}

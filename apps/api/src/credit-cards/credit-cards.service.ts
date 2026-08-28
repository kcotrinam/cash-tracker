import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  CreditCardStatementStatus,
  CurrencyCode,
  Prisma,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCreditCardDto,
  CreateCreditCardPaymentDto,
  UpdateCreditCardDto,
} from './credit-cards.dto';

const money = (value: Prisma.Decimal) => value.toFixed();
const decimal = (value: string | undefined, fallback = '0') =>
  new Prisma.Decimal((value ?? fallback).replace(',', '.'));
const dateOnly = (value: string) => {
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new BadRequestException('The date is invalid.');
  return date;
};
const today = () => new Date(new Date().toLocaleDateString('en-CA') + 'T12:00:00.000Z');
const dueDate = (closedOn: Date, paymentDay: number) => {
  const date = new Date(
    Date.UTC(closedOn.getUTCFullYear(), closedOn.getUTCMonth() + 1, 1, 12),
  );
  date.setUTCDate(
    Math.min(
      paymentDay,
      new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate(),
    ),
  );
  return date;
};
function valid(value: Prisma.Decimal, positive = true) {
  return (
    value.isFinite() &&
    (positive ? value.gt(0) : value.gte(0)) &&
    value.decimalPlaces() <= 4
  );
}

@Injectable()
export class CreditCardsService {
  constructor(private readonly prisma: PrismaService) {}
  private async card(userId: string, id: string) {
    const card = await this.prisma.creditCard.findFirst({ where: { id, userId } });
    if (!card) throw new NotFoundException('The credit card does not exist.');
    return card;
  }
  private values(dto: CreateCreditCardDto | UpdateCreditCardDto) {
    const creditLimit = decimal(dto.creditLimit);
    const initialBalance = decimal(dto.initialBalance);
    if (!valid(creditLimit) || !valid(initialBalance, false))
      throw new BadRequestException(
        'Amounts must have at most four decimal places and be valid.',
      );
    return {
      name: dto.name,
      currency: dto.currency,
      creditLimit,
      initialBalance,
      closingDay: dto.closingDay,
      paymentDay: dto.paymentDay,
    };
  }
  async create(userId: string, dto: CreateCreditCardDto) {
    return this.prisma.creditCard.create({ data: { userId, ...this.values(dto) } });
  }
  async list(userId: string) {
    const cards = await this.prisma.creditCard.findMany({
      where: { userId },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });
    return Promise.all(
      cards.map(async (card) => ({ ...card, ...(await this.summary(userId, card.id)) })),
    );
  }
  async update(userId: string, id: string, dto: UpdateCreditCardDto) {
    await this.card(userId, id);
    return this.prisma.creditCard.update({ where: { id }, data: this.values(dto) });
  }
  async status(userId: string, id: string, isActive: boolean) {
    await this.card(userId, id);
    return this.prisma.creditCard.update({ where: { id }, data: { isActive } });
  }
  async assertUsable(userId: string, id: string, currency: CurrencyCode) {
    const card = await this.card(userId, id);
    if (!card.isActive) throw new BadRequestException('The credit card is inactive.');
    if (card.currency !== currency)
      throw new BadRequestException(
        'The credit card currency must match the transaction currency.',
      );
    return card;
  }
  private async materializeLatestStatement(userId: string, cardId: string) {
    const card = await this.card(userId, cardId);
    const now = today();
    const day = Math.min(
      card.closingDay,
      new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate(),
    );
    const closedOn = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() >= day ? day : 0,
        12,
      ),
    );
    if (closedOn.getUTCMonth() === now.getUTCMonth() && now.getUTCDate() < day)
      closedOn.setUTCMonth(closedOn.getUTCMonth() - 1);
    const existing = await this.prisma.creditCardStatement.findUnique({
      where: { creditCardId_closedOn: { creditCardId: cardId, closedOn } },
    });
    if (existing) return existing;
    const last = await this.prisma.creditCardStatement.findFirst({
      where: { creditCardId: cardId },
      orderBy: { closedOn: 'desc' },
    });
    const periodStart = last
      ? new Date(last.closedOn.getTime() + 86400000)
      : new Date('1970-01-01T12:00:00.000Z');
    const [expenses, payments] = await this.prisma.$transaction([
      this.prisma.transaction.aggregate({
        where: {
          userId,
          creditCardId: cardId,
          type: TransactionType.EXPENSE,
          occurredOn: { gte: periodStart, lte: closedOn },
        },
        _sum: { amount: true },
      }),
      this.prisma.creditCardPayment.aggregate({
        where: {
          userId,
          creditCardId: cardId,
          paidOn: { gte: periodStart, lte: closedOn },
        },
        _sum: { amount: true },
      }),
    ]);
    const balance = (last?.remainingBalance ?? card.initialBalance)
      .plus(expenses._sum.amount ?? 0)
      .minus(payments._sum.amount ?? 0);
    return this.prisma.creditCardStatement.create({
      data: {
        userId,
        creditCardId: cardId,
        periodStart,
        closedOn,
        dueOn: dueDate(closedOn, card.paymentDay),
        statementBalance: Prisma.Decimal.max(balance, 0),
        remainingBalance: Prisma.Decimal.max(balance, 0),
      },
    });
  }
  async summary(userId: string, cardId: string) {
    const card = await this.card(userId, cardId);
    const [expenses, payments, statements] = await this.prisma.$transaction([
      this.prisma.transaction.aggregate({
        where: { userId, creditCardId: cardId, type: TransactionType.EXPENSE },
        _sum: { amount: true },
      }),
      this.prisma.creditCardPayment.aggregate({
        where: { userId, creditCardId: cardId },
        _sum: { amount: true },
      }),
      this.prisma.creditCardStatement.findMany({
        where: { userId, creditCardId: cardId },
        orderBy: { closedOn: 'desc' },
      }),
    ]);
    const debt = card.initialBalance
      .plus(expenses._sum.amount ?? 0)
      .minus(payments._sum.amount ?? 0);
    const current = statements[0];
    return {
      outstandingBalance: money(Prisma.Decimal.max(debt, 0)),
      currentStatement: current
        ? {
            ...current,
            statementBalance: money(current.statementBalance),
            remainingBalance: money(current.remainingBalance),
            minimumPayment: current.minimumPayment ? money(current.minimumPayment) : null,
          }
        : null,
    };
  }
  async detail(userId: string, id: string) {
    await this.materializeLatestStatement(userId, id);
    const [card, summary, payments, statements, transactions] = await Promise.all([
      this.card(userId, id),
      this.summary(userId, id),
      this.prisma.creditCardPayment.findMany({
        where: { userId, creditCardId: id },
        orderBy: { paidOn: 'desc' },
      }),
      this.prisma.creditCardStatement.findMany({
        where: { userId, creditCardId: id },
        orderBy: { closedOn: 'desc' },
      }),
      this.prisma.transaction.findMany({
        where: { userId, creditCardId: id },
        orderBy: { occurredOn: 'desc' },
        take: 30,
        include: { category: { select: { id: true, name: true } } },
      }),
    ]);
    return {
      ...card,
      ...summary,
      payments: payments.map((p) => ({
        ...p,
        amount: money(p.amount),
        paidOn: p.paidOn.toISOString().slice(0, 10),
      })),
      statements: statements.map((s) => ({
        ...s,
        statementBalance: money(s.statementBalance),
        remainingBalance: money(s.remainingBalance),
        minimumPayment: s.minimumPayment ? money(s.minimumPayment) : null,
      })),
      transactions: transactions.map((t) => ({
        ...t,
        amount: money(t.amount),
        occurredOn: t.occurredOn.toISOString().slice(0, 10),
      })),
    };
  }
  async minimum(userId: string, cardId: string, statementId: string, value: string) {
    const amount = decimal(value);
    if (!valid(amount)) throw new BadRequestException('The minimum payment is invalid.');
    const statement = await this.prisma.creditCardStatement.findFirst({
      where: { id: statementId, creditCardId: cardId, userId },
    });
    if (!statement) throw new NotFoundException('The statement does not exist.');
    if (amount.gt(statement.statementBalance))
      throw new BadRequestException(
        'The minimum payment cannot exceed the statement balance.',
      );
    return this.prisma.creditCardStatement.update({
      where: { id: statementId },
      data: { minimumPayment: amount },
    });
  }
  async pay(userId: string, cardId: string, dto: CreateCreditCardPaymentDto) {
    const card = await this.card(userId, cardId);
    const amount = decimal(dto.amount);
    if (!valid(amount)) throw new BadRequestException('The payment amount is invalid.');
    if (dto.currency !== card.currency)
      throw new BadRequestException(
        'The payment currency must match the credit card currency.',
      );
    await this.materializeLatestStatement(userId, cardId);
    return this.prisma.$transaction(async (db) => {
      const payment = await db.creditCardPayment.create({
        data: {
          userId,
          creditCardId: cardId,
          amount,
          currency: dto.currency,
          paidOn: dateOnly(dto.paidOn),
          note: dto.note || null,
        },
      });
      let remaining = amount;
      const statements = await db.creditCardStatement.findMany({
        where: { userId, creditCardId: cardId, remainingBalance: { gt: 0 } },
        orderBy: { closedOn: 'asc' },
      });
      for (const statement of statements) {
        if (remaining.lte(0)) break;
        const applied = Prisma.Decimal.min(remaining, statement.remainingBalance);
        await db.creditCardPaymentApplication.create({
          data: { paymentId: payment.id, statementId: statement.id, amount: applied },
        });
        const left = statement.remainingBalance.minus(applied);
        await db.creditCardStatement.update({
          where: { id: statement.id },
          data: {
            remainingBalance: left,
            status: left.isZero()
              ? CreditCardStatementStatus.PAID
              : statement.dueOn < today()
                ? CreditCardStatementStatus.OVERDUE
                : CreditCardStatementStatus.PENDING,
          },
        });
        remaining = remaining.minus(applied);
      }
      return {
        ...payment,
        amount: money(payment.amount),
        paidOn: payment.paidOn.toISOString().slice(0, 10),
      };
    });
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  RecurrenceFrequency,
  RecurringTransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  applicationToday,
  dateOnlyString,
  firstScheduledOnOrAfter,
  nextScheduledDate,
  parseDateOnly,
} from './recurrence-date';
import {
  CreateRecurringTransactionDto,
  ListRecurringTransactionsDto,
  UpdateRecurringStatusDto,
  UpdateRecurringTransactionDto,
} from './recurring-transactions.dto';

const categorySelect = {
  id: true,
  name: true,
  type: true,
  color: true,
  icon: true,
} as const;
const include = { category: { select: categorySelect } } as const;
function serialize(row: {
  amount: Prisma.Decimal;
  startDate: Date;
  endDate: Date | null;
  nextOccurrenceDate: Date;
  category: unknown;
}) {
  return {
    ...row,
    amount: row.amount.toFixed(),
    startDate: dateOnlyString(row.startDate),
    endDate: row.endDate ? dateOnlyString(row.endDate) : null,
    nextOccurrenceDate: dateOnlyString(row.nextOccurrenceDate),
  };
}

@Injectable()
export class RecurringTransactionsService {
  constructor(private readonly prisma: PrismaService) {}
  private today() {
    return applicationToday();
  }
  private async validCategory(
    userId: string,
    categoryId: string,
    type: TransactionType,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const category = await db.category.findUnique({
      where: { id: categoryId },
      select: { userId: true, type: true, isActive: true },
    });
    if (!category) throw new NotFoundException('La categoría no existe.');
    if (category.userId !== userId)
      throw new ForbiddenException('No puedes usar esta categoría.');
    if (!category.isActive || category.type !== type)
      throw new BadRequestException('La categoría no corresponde al tipo de movimiento.');
  }
  private amount(raw: string) {
    const amount = new Prisma.Decimal(raw.replace(',', '.'));
    if (!amount.isFinite() || amount.lte(0) || amount.decimalPlaces() > 4)
      throw new BadRequestException(
        'El monto debe ser mayor que cero y tener como máximo cuatro decimales.',
      );
    return amount;
  }
  async create(userId: string, dto: CreateRecurringTransactionDto) {
    const startDate = parseDateOnly(dto.startDate);
    const endDate = dto.endDate ? parseDateOnly(dto.endDate) : null;
    if (endDate && endDate < startDate)
      throw new BadRequestException(
        'La fecha de finalización no puede ser anterior a la fecha de inicio.',
      );
    if (dto.createFirstOccurrenceNow && startDate > this.today())
      throw new BadRequestException(
        'La primera ocurrencia solo se puede registrar si la fecha de inicio es hoy o anterior.',
      );
    const amount = this.amount(dto.amount);
    return this.prisma.$transaction(async (db) => {
      await this.validCategory(userId, dto.categoryId, dto.type, db);
      const recurrence = await db.recurringTransaction.create({
        data: {
          userId,
          categoryId: dto.categoryId,
          type: dto.type,
          description: dto.description,
          amount,
          currency: dto.currency,
          note: dto.note || null,
          frequency: dto.frequency,
          interval: dto.interval,
          startDate,
          endDate,
          nextOccurrenceDate: startDate,
          anchorDay:
            dto.frequency === RecurrenceFrequency.MONTHLY ? startDate.getUTCDate() : null,
        },
        include,
      });
      if (!dto.createFirstOccurrenceNow) return serialize(recurrence);
      await db.transaction.create({
        data: {
          userId,
          categoryId: recurrence.categoryId,
          recurringTransactionId: recurrence.id,
          type: recurrence.type,
          amount: recurrence.amount,
          currencyCode: recurrence.currency,
          description: recurrence.description,
          note: recurrence.note,
          occurredOn: startDate,
        },
      });
      const next = nextScheduledDate(
        startDate,
        recurrence.frequency,
        recurrence.interval,
        recurrence.anchorDay,
      );
      return serialize(
        await db.recurringTransaction.update({
          where: { id: recurrence.id },
          data: {
            nextOccurrenceDate: next,
            ...(endDate && next > endDate
              ? { status: RecurringTransactionStatus.FINISHED }
              : {}),
          },
          include,
        }),
      );
    });
  }
  async list(userId: string, query: ListRecurringTransactionsDto) {
    const where: Prisma.RecurringTransactionWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { description: { contains: query.search.trim(), mode: 'insensitive' } }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.recurringTransaction.findMany({
        where,
        include,
        orderBy: [{ nextOccurrenceDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.recurringTransaction.count({ where }),
    ]);
    return {
      items: items.map(serialize),
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }
  async get(userId: string, id: string) {
    const row = await this.prisma.recurringTransaction.findFirst({
      where: { id, userId },
      include,
    });
    if (!row) throw new NotFoundException('La recurrencia no existe.');
    return serialize(row);
  }
  async update(userId: string, id: string, dto: UpdateRecurringTransactionDto) {
    const current = await this.prisma.recurringTransaction.findFirst({
      where: { id, userId },
    });
    if (!current) throw new NotFoundException('La recurrencia no existe.');
    const type = dto.type ?? current.type;
    const categoryId = dto.categoryId ?? current.categoryId;
    if (dto.categoryId || dto.type) await this.validCategory(userId, categoryId, type);
    const startDate = dto.startDate ? parseDateOnly(dto.startDate) : current.startDate;
    const endDate =
      dto.endDate === null
        ? null
        : dto.endDate
          ? parseDateOnly(dto.endDate)
          : current.endDate;
    if (endDate && endDate < startDate)
      throw new BadRequestException(
        'La fecha de finalización no puede ser anterior a la fecha de inicio.',
      );
    const frequency = dto.frequency ?? current.frequency;
    const interval = dto.interval ?? current.interval;
    const anchorDay =
      frequency === RecurrenceFrequency.MONTHLY
        ? dto.startDate
          ? startDate.getUTCDate()
          : (current.anchorDay ?? startDate.getUTCDate())
        : null;
    const nextOccurrenceDate =
      current.status === RecurringTransactionStatus.ACTIVE
        ? firstScheduledOnOrAfter(startDate, frequency, interval, anchorDay, this.today())
        : current.nextOccurrenceDate;
    const row = await this.prisma.recurringTransaction.update({
      where: { id },
      data: {
        type,
        categoryId,
        description: dto.description ?? current.description,
        amount: dto.amount ? this.amount(dto.amount) : current.amount,
        currency: dto.currency ?? current.currency,
        note: dto.note === undefined ? current.note : dto.note || null,
        frequency,
        interval,
        startDate,
        endDate,
        anchorDay,
        nextOccurrenceDate,
        ...(endDate && nextOccurrenceDate > endDate
          ? { status: RecurringTransactionStatus.FINISHED }
          : {}),
      },
      include,
    });
    return serialize(row);
  }
  async updateStatus(userId: string, id: string, dto: UpdateRecurringStatusDto) {
    const current = await this.prisma.recurringTransaction.findFirst({
      where: { id, userId },
    });
    if (!current) throw new NotFoundException('La recurrencia no existe.');
    let nextOccurrenceDate = current.nextOccurrenceDate;
    if (dto.status === RecurringTransactionStatus.ACTIVE)
      nextOccurrenceDate = firstScheduledOnOrAfter(
        current.startDate,
        current.frequency,
        current.interval,
        current.anchorDay,
        this.today(),
      );
    const row = await this.prisma.recurringTransaction.update({
      where: { id },
      data: { status: dto.status, nextOccurrenceDate },
      include,
    });
    return serialize(row);
  }
  async processDueRecurringTransactions(currentDate = this.today()) {
    const due = await this.prisma.recurringTransaction.findMany({
      where: {
        status: RecurringTransactionStatus.ACTIVE,
        nextOccurrenceDate: { lte: currentDate },
      },
      select: { id: true },
    });
    let processed = 0;
    for (const { id } of due) processed += await this.processRule(id, currentDate);
    return { processed };
  }
  private async processRule(id: string, currentDate: Date) {
    return this.prisma.$transaction(
      async (db) => {
        const rule = await db.recurringTransaction.findUnique({ where: { id } });
        if (
          !rule ||
          rule.status !== RecurringTransactionStatus.ACTIVE ||
          rule.nextOccurrenceDate > currentDate
        )
          return 0;
        let next = rule.nextOccurrenceDate;
        let count = 0;
        while (next <= currentDate && (!rule.endDate || next <= rule.endDate)) {
          try {
            await db.transaction.create({
              data: {
                userId: rule.userId,
                categoryId: rule.categoryId,
                recurringTransactionId: rule.id,
                type: rule.type,
                amount: rule.amount,
                currencyCode: rule.currency,
                description: rule.description,
                note: rule.note,
                occurredOn: next,
              },
            });
            count++;
          } catch (error) {
            if ((error as { code?: string }).code !== 'P2002') throw error;
          }
          next = nextScheduledDate(next, rule.frequency, rule.interval, rule.anchorDay);
        }
        await db.recurringTransaction.update({
          where: { id },
          data: {
            nextOccurrenceDate: next,
            ...(rule.endDate && next > rule.endDate
              ? { status: RecurringTransactionStatus.FINISHED }
              : {}),
          },
        });
        return count;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }
}

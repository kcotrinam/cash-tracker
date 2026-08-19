import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CurrencyCode, Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, ListTransactionsDto, UpdateTransactionDto } from './transactions.dto';

const categorySelect = {
  id: true,
  name: true,
  type: true,
  color: true,
  icon: true,
} as const;
function dateOnly(value: string) {
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    throw new BadRequestException('The date is invalid.');
  return date;
}
function serialize(transaction: {
  id: string;
  type: TransactionType;
  amount: Prisma.Decimal;
  currencyCode: CurrencyCode;
  description: string | null;
  note: string | null;
  occurredOn: Date;
  createdAt: Date;
  category: {
    id: string;
    name: string;
    type: TransactionType;
    color: string | null;
    icon: string | null;
  };
}) {
  return {
    ...transaction,
    amount: transaction.amount.toFixed(),
    occurredOn: transaction.occurredOn.toISOString().slice(0, 10),
  };
}

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTransactionDto) {
    const amount = new Prisma.Decimal(dto.amount.replace(',', '.'));
    if (!amount.isFinite() || amount.lte(0) || amount.decimalPlaces() > 4)
      throw new BadRequestException(
        'Amount must be greater than zero and have at most four decimal places.',
      );
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
      select: { userId: true, type: true, isActive: true },
    });
    if (!category) throw new NotFoundException('The category does not exist.');
    if (category.userId !== userId)
      throw new ForbiddenException('You cannot use this category.');
    if (!category.isActive || category.type !== dto.type)
      throw new BadRequestException('The category does not match the transaction type.');
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        categoryId: dto.categoryId,
        type: dto.type,
        amount,
        currencyCode: dto.currencyCode,
        description: dto.description,
        note: dto.note || null,
        occurredOn: dateOnly(dto.occurredOn),
      },
      include: { category: { select: categorySelect } },
    });
    return serialize(transaction);
  }

  async list(userId: string, query: ListTransactionsDto) {
    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(query.type ? { type: query.type } : {}),
      ...(query.currencyCode ? { currencyCode: query.currencyCode } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search
        ? { description: { contains: query.search.trim(), mode: 'insensitive' } }
        : {}),
    };
    if (query.month) {
      const start = new Date(`${query.month}-01T12:00:00.000Z`);
      const end = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1, 12),
      );
      where.occurredOn = { gte: start, lt: end };
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: { category: { select: categorySelect } },
        orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.transaction.count({ where }),
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

  async update(userId: string, id: string, dto: UpdateTransactionDto) {
    const current = await this.prisma.transaction.findFirst({ where: { id, userId } });
    if (!current) throw new NotFoundException('The transaction does not exist.');
    const amount = new Prisma.Decimal(dto.amount.replace(',', '.'));
    if (!amount.isFinite() || amount.lte(0) || amount.decimalPlaces() > 4)
      throw new BadRequestException(
        'Amount must be greater than zero and have at most four decimal places.',
      );
    if (dto.categoryId !== current.categoryId || dto.type !== current.type) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
        select: { userId: true, type: true, isActive: true },
      });
      if (!category) throw new NotFoundException('The category does not exist.');
      if (category.userId !== userId)
        throw new ForbiddenException('You cannot use this category.');
      if (!category.isActive || category.type !== dto.type)
        throw new BadRequestException('The category does not match the transaction type.');
    }
    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: {
        type: dto.type,
        amount,
        currencyCode: dto.currencyCode,
        description: dto.description,
        categoryId: dto.categoryId,
        occurredOn: dateOnly(dto.occurredOn),
        note: dto.note || null,
      },
      include: { category: { select: categorySelect } },
    });
    return serialize(transaction);
  }

  async remove(userId: string, id: string) {
    const result = await this.prisma.transaction.deleteMany({ where: { id, userId } });
    if (result.count !== 1) throw new NotFoundException('The transaction does not exist.');
  }
}

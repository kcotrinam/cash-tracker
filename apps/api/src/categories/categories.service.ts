import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { defaultCategories } from './category-defaults';
import { displayCategoryName, normalizeCategoryName } from './category-normalization';
import { CreateCategoryDto, ListCategoriesDto, UpdateCategoryDto } from './categories.dto';

const categorySelect = {
  id: true,
  name: true,
  type: true,
  isDefault: true,
  isFallback: true,
  isActive: true,
} as const;
const others = {
  [TransactionType.INCOME]: 'otros ingresos',
  [TransactionType.EXPENSE]: 'otros gastos',
};

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async provisionDefaults(
    userId: string,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    await Promise.all(
      defaultCategories.map((category) =>
        db.category.upsert({
          where: {
            userId_type_normalizedName: {
              userId,
              type: category.type,
              normalizedName: category.normalizedName,
            },
          },
          create: { userId, ...category, isDefault: true },
          update: {},
        }),
      ),
    );
  }

  async list(userId: string, query: ListCategoriesDto) {
    const normalizedSearch = query.search ? normalizeCategoryName(query.search) : '';
    const categories = await this.prisma.category.findMany({
      where: {
        userId,
        ...(!query.includeInactive ? { isActive: true } : {}),
        ...(query.type ? { type: query.type } : {}),
        ...(normalizedSearch ? { normalizedName: { contains: normalizedSearch } } : {}),
      },
      select: categorySelect,
      take: 50,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });
    return categories.sort((a, b) => {
      const rank = (category: typeof a) => {
        const normalized = normalizeCategoryName(category.name);
        if (!normalizedSearch) return normalized === others[category.type] ? 1 : 0;
        return normalized === normalizedSearch
          ? 0
          : normalized.startsWith(normalizedSearch)
            ? 1
            : 2;
      };
      return (
        rank(a) - rank(b) ||
        a.name.localeCompare(b.name, 'es') ||
        a.id.localeCompare(b.id)
      );
    });
  }

  async create(userId: string, dto: CreateCategoryDto) {
    const name = displayCategoryName(dto.name);
    const normalizedName = normalizeCategoryName(name);
    try {
      return await this.prisma.category.create({
        data: { userId, name, normalizedName, type: dto.type },
        select: categorySelect,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException('Ya existe una categoría con ese nombre.');
      throw error;
    }
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException('La categoría no existe.');
    const name = displayCategoryName(dto.name);
    const normalizedName = normalizeCategoryName(name);
    try {
      return await this.prisma.category.update({
        where: { id },
        data: { name, normalizedName },
        select: categorySelect,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException('Ya existe una categoría con ese nombre.');
      throw error;
    }
  }

  async updateStatus(userId: string, id: string, isActive: boolean) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException('La categoría no existe.');
    if (!isActive && category.isFallback)
      throw new ForbiddenException('Las categorías predeterminadas no se pueden desactivar.');
    return this.prisma.category.update({
      where: { id },
      data: { isActive },
      select: categorySelect,
    });
  }
}

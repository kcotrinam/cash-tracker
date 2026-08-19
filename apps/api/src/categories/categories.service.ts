import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppLanguage, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { defaultCategories } from './category-defaults';
import { displayCategoryName, normalizeCategoryName } from './category-normalization';
import { CreateCategoryDto, ListCategoriesDto, UpdateCategoryDto } from './categories.dto';

const categorySelect = {
  id: true,
  name: true,
  type: true,
  isDefault: true,
  defaultKey: true,
  isFallback: true,
  isActive: true,
} as const;
const fallbackDefaultKeys = new Set(['other-income', 'other-expenses']);

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async provisionDefaults(
    userId: string,
    language: AppLanguage = AppLanguage.EN,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    await Promise.all(
      defaultCategories(language).map((category) =>
        db.category.upsert({
          where: {
            userId_defaultKey: {
              userId,
              defaultKey: category.defaultKey,
            },
          },
          create: { userId, ...category, isDefault: true },
          update: {},
        }),
      ),
    );
  }

  async localizeDefaults(
    userId: string,
    language: AppLanguage,
    db: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    for (const category of defaultCategories(language)) {
      await db.category.updateMany({
        where: { userId, defaultKey: category.defaultKey },
        data: {
          name: category.name,
          normalizedName: category.normalizedName,
          isFallback: Boolean(category.isFallback),
        },
      });
    }
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
        if (!normalizedSearch) return fallbackDefaultKeys.has(category.defaultKey ?? '') ? 1 : 0;
        return normalized === normalizedSearch
          ? 0
          : normalized.startsWith(normalizedSearch)
            ? 1
            : 2;
      };
      return (
        rank(a) - rank(b) ||
        a.name.localeCompare(b.name, 'en') ||
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
        throw new ConflictException('A category with that name already exists.');
      throw error;
    }
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException('The category does not exist.');
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
        throw new ConflictException('A category with that name already exists.');
      throw error;
    }
  }

  async updateStatus(userId: string, id: string, isActive: boolean) {
    const category = await this.prisma.category.findFirst({ where: { id, userId } });
    if (!category) throw new NotFoundException('The category does not exist.');
    if (!isActive && category.isFallback)
      throw new ForbiddenException('Default categories cannot be deactivated.');
    return this.prisma.category.update({
      where: { id },
      data: { isActive },
      select: categorySelect,
    });
  }
}

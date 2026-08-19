import { BadRequestException, Injectable } from '@nestjs/common';
import { AppLanguage } from '@prisma/client';
import { CategoriesService } from '../categories/categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdatePreferencesDto } from './settings.dto';

function isIanaTimezone(value: string) {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
  ) {}
  async preferences(userId: string) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { defaultCurrency: true, timezone: true, language: true },
    });
  }
  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    if (!isIanaTimezone(dto.timezone))
      throw new BadRequestException('The selected time zone is invalid.');
    return this.prisma.$transaction(async (db) => {
      const current = await db.userSettings.upsert({
        where: { userId },
        create: { userId, ...dto },
        update: dto,
        select: { defaultCurrency: true, timezone: true, language: true },
      });
      await this.categories.localizeDefaults(userId, dto.language as AppLanguage, db);
      return current;
    });
  }
}

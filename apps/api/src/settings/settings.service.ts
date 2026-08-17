import { BadRequestException, Injectable } from '@nestjs/common';
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
  constructor(private readonly prisma: PrismaService) {}
  async preferences(userId: string) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId },
      update: {},
      select: { defaultCurrency: true, timezone: true },
    });
  }
  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    if (!isIanaTimezone(dto.timezone))
      throw new BadRequestException('La zona horaria no es válida.');
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
      select: { defaultCurrency: true, timezone: true },
    });
  }
}

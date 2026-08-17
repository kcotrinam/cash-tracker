import { IsEnum, IsString, MaxLength } from 'class-validator';
import { CurrencyCode } from '@prisma/client';

export class UpdatePreferencesDto {
  @IsEnum(CurrencyCode) defaultCurrency!: CurrencyCode;
  @IsString() @MaxLength(100) timezone!: string;
}

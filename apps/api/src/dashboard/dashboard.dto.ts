import { IsEnum, Matches } from 'class-validator';
import { CurrencyCode } from '@prisma/client';

export class GetDashboardDto {
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'The month is invalid.' })
  month!: string;

  @IsEnum(CurrencyCode)
  currency!: CurrencyCode;
}

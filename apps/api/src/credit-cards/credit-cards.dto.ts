import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CurrencyCode } from '@prisma/client';

const compact = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
const decimal = /^\d+(?:[.,]\d+)?$/;

export class CreateCreditCardDto {
  @Transform(compact) @IsString() @MaxLength(80) @Matches(/\S/) name!: string;
  @IsEnum(CurrencyCode) currency!: CurrencyCode;
  @Matches(decimal) creditLimit!: string;
  @IsOptional() @Matches(decimal) initialBalance?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(31) closingDay!: number;
  @Type(() => Number) @IsInt() @Min(1) @Max(31) paymentDay!: number;
}
export class UpdateCreditCardDto extends CreateCreditCardDto {}
export class UpdateCreditCardStatusDto {
  @IsBoolean() isActive!: boolean;
}
export class CreateCreditCardPaymentDto {
  @Matches(decimal) amount!: string;
  @IsEnum(CurrencyCode) currency!: CurrencyCode;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) paidOn!: string;
  @IsOptional() @Transform(compact) @IsString() @MaxLength(1000) note?: string;
}
export class UpdateMinimumPaymentDto {
  @Matches(decimal) minimumPayment!: string;
}

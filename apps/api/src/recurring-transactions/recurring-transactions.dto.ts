import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  CurrencyCode,
  RecurrenceFrequency,
  RecurringTransactionStatus,
  TransactionType,
} from '@prisma/client';

const compact = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
const date = /^\d{4}-\d{2}-\d{2}$/;

export class CreateRecurringTransactionDto {
  @IsEnum(TransactionType) type!: TransactionType;
  @Transform(compact)
  @IsString()
  @MaxLength(160)
  @Matches(/\S/, { message: 'La descripción es obligatoria.' })
  description!: string;
  @IsUUID() categoryId!: string;
  @IsString()
  @Matches(/^\d+(?:[.,]\d+)?$/, { message: 'El monto debe ser un decimal válido.' })
  amount!: string;
  @IsEnum(CurrencyCode) currency!: CurrencyCode;
  @IsEnum(RecurrenceFrequency) frequency!: RecurrenceFrequency;
  @Type(() => Number) @IsInt() @Min(1) @Max(1200) interval = 1;
  @Matches(date, { message: 'La fecha de inicio no es válida.' }) startDate!: string;
  @IsOptional()
  @Matches(date, { message: 'La fecha de finalización no es válida.' })
  endDate?: string;
  @IsOptional() @Transform(compact) @IsString() @MaxLength(1000) note?: string;
  @IsBoolean() createFirstOccurrenceNow = false;
}

export class ListRecurringTransactionsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @Transform(compact) @IsString() @MaxLength(160) search?: string;
  @IsOptional() @IsEnum(RecurringTransactionStatus) status?: RecurringTransactionStatus;
}

export class UpdateRecurringTransactionDto {
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional()
  @Transform(compact)
  @IsString()
  @MaxLength(160)
  @Matches(/\S/)
  description?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsString() @Matches(/^\d+(?:[.,]\d+)?$/) amount?: string;
  @IsOptional() @IsEnum(CurrencyCode) currency?: CurrencyCode;
  @IsOptional() @IsEnum(RecurrenceFrequency) frequency?: RecurrenceFrequency;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1200) interval?: number;
  @IsOptional() @Matches(date) startDate?: string;
  @IsOptional() @Matches(date) endDate?: string | null;
  @IsOptional() @Transform(compact) @IsString() @MaxLength(1000) note?: string | null;
}

export class UpdateRecurringStatusDto {
  @IsEnum(RecurringTransactionStatus) status!: RecurringTransactionStatus;
}

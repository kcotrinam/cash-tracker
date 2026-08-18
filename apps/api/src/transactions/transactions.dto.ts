import { Transform, Type } from 'class-transformer';
import {
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
import { CurrencyCode, TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @IsEnum(TransactionType) type!: TransactionType;
  @IsString()
  @Matches(/^\d+(?:[.,]\d+)?$/, { message: 'El monto debe ser un decimal válido.' })
  amount!: string;
  @IsEnum(CurrencyCode) currencyCode!: CurrencyCode;
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @IsString()
  @MaxLength(160)
  @Matches(/\S/, { message: 'La descripción es obligatoria.' })
  description!: string;
  @IsUUID() categoryId!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha no es válida.' })
  occurredOn!: string;
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(1000)
  note?: string;
}

export class UpdateTransactionDto extends CreateTransactionDto {}

export class ListTransactionsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsString() @MaxLength(160) search?: string;
  @IsOptional() @Matches(/^\d{4}-(0[1-9]|1[0-2])$/) month?: string;
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsEnum(CurrencyCode) currencyCode?: CurrencyCode;
}

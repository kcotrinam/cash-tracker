import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TransactionType } from '@prisma/client';

const compact = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

export class ListCategoriesDto {
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @Transform(compact) @IsString() @MaxLength(80) search?: string;
}

export class CreateCategoryDto {
  @Transform(compact) @IsString() @MinLength(1) @MaxLength(80) name!: string;
  @IsEnum(TransactionType) type!: TransactionType;
}

import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TransactionType } from '@prisma/client';

const compact = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

export class ListCategoriesDto {
  @IsOptional() @IsEnum(TransactionType) type?: TransactionType;
  @IsOptional() @Transform(compact) @IsString() @MaxLength(80) search?: string;
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  includeInactive?: boolean;
}

export class CreateCategoryDto {
  @Transform(compact) @IsString() @MinLength(1) @MaxLength(80) name!: string;
  @IsEnum(TransactionType) type!: TransactionType;
}

export class UpdateCategoryDto {
  @Transform(compact) @IsString() @MinLength(1) @MaxLength(80) name!: string;
}

export class UpdateCategoryStatusDto {
  @IsBoolean() isActive!: boolean;
}

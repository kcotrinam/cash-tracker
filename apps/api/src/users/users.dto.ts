import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

const compact = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

export class UpdateProfileDto {
  @Transform(compact) @IsString() @Length(1, 80) name!: string;
}

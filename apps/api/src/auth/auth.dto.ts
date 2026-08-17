import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
export class RegisterDto {
  @ApiProperty({ example: 'ana@example.com' }) @IsEmail() email!: string;
  @ApiProperty({ minLength: 10 }) @IsString() @Length(10, 128) password!: string;
  @ApiProperty({ example: 'Ana Pérez' }) @IsString() @Length(1, 80) displayName!: string;
}
export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MaxLength(128) password!: string;
}

export class ChangePasswordDto {
  @IsString() @MaxLength(128) currentPassword!: string;
  @IsString() @Length(10, 128) newPassword!: string;
  @IsString() @MaxLength(128) confirmPassword!: string;
}

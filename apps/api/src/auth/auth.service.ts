import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomBytes, createHash } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { ChangePasswordDto, LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    @Inject(forwardRef(() => CategoriesService)) private categories: CategoriesService,
  ) {}
  private safe(user: {
    id: string;
    email: string;
    displayName: string;
    settings: { defaultCurrency: string; timezone: string; themePreference: string } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      settings: user.settings,
    };
  }
  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }
  private async tokens(userId: string) {
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.config.getOrThrow<number>('refreshTokenTtlDays') * 86400000,
    );
    await this.prisma.refreshSession.create({
      data: { userId, tokenHash: this.hashToken(refreshToken), expiresAt },
    });
    return {
      accessToken: await this.jwt.signAsync({ sub: userId }),
      refreshToken,
      expiresAt,
    };
  }
  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();
    try {
      const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
      const user = await this.prisma.$transaction(async (db) => {
        const created = await db.user.create({
          data: {
            email,
            passwordHash,
            displayName: dto.displayName.trim(),
            settings: { create: {} },
          },
          include: { settings: true },
        });
        await this.categories.provisionDefaults(created.id, db);
        return created;
      });
      return { user: this.safe(user), ...(await this.tokens(user.id)) };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw new ConflictException('No se pudo crear la cuenta.');
      throw error;
    }
  }
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
      include: { settings: true },
    });
    if (!user || !(await argon2.verify(user.passwordHash, dto.password)))
      throw new UnauthorizedException('Credenciales inválidas.');
    return { user: this.safe(user), ...(await this.tokens(user.id)) };
  }
  async me(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { settings: true },
    });
    if (!user) throw new UnauthorizedException();
    return this.safe(user);
  }
  async refresh(token: string) {
    const hash = this.hashToken(token);
    const existing = await this.prisma.refreshSession.findFirst({
      where: { tokenHash: hash, revokedAt: null, expiresAt: { gt: new Date() } },
    });
    if (!existing) throw new UnauthorizedException('Sesión inválida.');
    const newRefresh = randomBytes(48).toString('base64url');
    const expiresAt = new Date(
      Date.now() + this.config.getOrThrow<number>('refreshTokenTtlDays') * 86400000,
    );
    const result = await this.prisma.refreshSession.updateMany({
      where: { id: existing.id, tokenHash: hash, revokedAt: null },
      data: { tokenHash: this.hashToken(newRefresh), expiresAt },
    });
    if (result.count !== 1) throw new UnauthorizedException('Sesión inválida.');
    return {
      accessToken: await this.jwt.signAsync({ sub: existing.userId }),
      refreshToken: newRefresh,
      expiresAt,
    };
  }
  async logout(token?: string) {
    if (token)
      await this.prisma.refreshSession.updateMany({
        where: { tokenHash: this.hashToken(token), revokedAt: null },
        data: { revokedAt: new Date() },
      });
  }
  async changePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword)
      throw new ConflictException('Las contraseñas nuevas no coinciden.');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await argon2.verify(user.passwordHash, dto.currentPassword)))
      throw new UnauthorizedException('La contraseña actual es incorrecta.');
    if (await argon2.verify(user.passwordHash, dto.newPassword))
      throw new ConflictException('La nueva contraseña debe ser diferente a la actual.');
    const passwordHash = await argon2.hash(dto.newPassword, { type: argon2.argon2id });
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return this.tokens(userId);
  }
}

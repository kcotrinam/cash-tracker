import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
    const token = bearerToken ?? request.cookies?.cashtracker_access;

    if (!token) throw new UnauthorizedException();

    try {
      (request as Request & { user?: { id: string } }).user = {
        id: (await this.jwt.verifyAsync<{ sub: string }>(token)).sub,
      };
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}

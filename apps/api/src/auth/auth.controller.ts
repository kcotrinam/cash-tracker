import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service'; import { LoginDto, RegisterDto } from './auth.dto'; import { AccessTokenGuard } from './access-token.guard'; import { CurrentUser } from './current-user.decorator';
@ApiTags('auth') @Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private config: ConfigService) {}
  private set(response: Response, tokens: { accessToken: string; refreshToken: string; expiresAt: Date }) { const secure = this.config.get('nodeEnv') === 'production'; const domain = this.config.get('cookieDomain'); response.cookie('cashtracker_access', tokens.accessToken, { httpOnly: true, secure, sameSite: 'lax', maxAge: 900000, domain, path: '/' }); response.cookie('cashtracker_refresh', tokens.refreshToken, { httpOnly: true, secure, sameSite: 'lax', expires: tokens.expiresAt, domain, path: '/auth' }); }
  @Post('register') @Throttle({ default: { limit: 5, ttl: 60000 } }) async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) { const result = await this.auth.register(dto); this.set(res, result); return { user: result.user }; }
  @Post('login') @HttpCode(200) @Throttle({ default: { limit: 10, ttl: 60000 } }) async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) { const result = await this.auth.login(dto); this.set(res, result); return { user: result.user }; }
  @Post('refresh') @HttpCode(200) @Throttle({ default: { limit: 20, ttl: 60000 } }) async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) { const result = await this.auth.refresh(req.cookies?.cashtracker_refresh ?? ''); this.set(res, result); return {}; }
  @Post('logout') @HttpCode(204) async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) { await this.auth.logout(req.cookies?.cashtracker_refresh); res.clearCookie('cashtracker_access', { path: '/' }); res.clearCookie('cashtracker_refresh', { path: '/auth' }); }
  @Get('me') @ApiCookieAuth() @UseGuards(AccessTokenGuard) async me(@CurrentUser() user: { id: string }) { return { user: await this.auth.me(user.id) }; }
}

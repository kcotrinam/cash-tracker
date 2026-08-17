import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AccessTokenGuard } from './access-token.guard';
import { CategoriesModule } from '../categories/categories.module';
@Module({
  imports: [
    forwardRef(() => CategoriesModule),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow('jwtAccessSecret'),
        signOptions: { expiresIn: config.getOrThrow('accessTokenTtl') },
      }),
    }),
  ],
  providers: [AuthService, AccessTokenGuard],
  controllers: [AuthController],
  exports: [AccessTokenGuard],
})
export class AuthModule {}

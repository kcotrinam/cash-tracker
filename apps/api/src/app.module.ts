import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, validateEnvironment } from './config/configuration';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TransactionsModule } from './transactions/transactions.module';
import { CategoriesModule } from './categories/categories.module';
import { RecurringTransactionsModule } from './recurring-transactions/recurring-transactions.module';
import { SettingsModule } from './settings/settings.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CreditCardsModule } from './credit-cards/credit-cards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    PrismaModule,
    HealthModule,
    CategoriesModule,
    AuthModule,
    TransactionsModule,
    RecurringTransactionsModule,
    SettingsModule,
    UsersModule,
    DashboardModule,
    CreditCardsModule,
  ],
})
export class AppModule {}

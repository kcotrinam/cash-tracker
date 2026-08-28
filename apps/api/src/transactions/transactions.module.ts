import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { CreditCardsModule } from '../credit-cards/credit-cards.module';
@Module({
  imports: [AuthModule, CreditCardsModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
})
export class TransactionsModule {}

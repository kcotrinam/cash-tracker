import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  CreateCreditCardDto,
  CreateCreditCardPaymentDto,
  UpdateCreditCardDto,
  UpdateCreditCardStatusDto,
  UpdateMinimumPaymentDto,
} from './credit-cards.dto';
import { CreditCardsService } from './credit-cards.service';

@ApiTags('credit-cards')
@ApiCookieAuth()
@UseGuards(AccessTokenGuard)
@Controller('credit-cards')
export class CreditCardsController {
  constructor(private readonly cards: CreditCardsService) {}
  @Get() list(@CurrentUser() user: { id: string }) {
    return this.cards.list(user.id);
  }
  @Post() create(@CurrentUser() user: { id: string }, @Body() dto: CreateCreditCardDto) {
    return this.cards.create(user.id, dto);
  }
  @Get(':id') detail(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.cards.detail(user.id, id);
  }
  @Patch(':id') update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateCreditCardDto,
  ) {
    return this.cards.update(user.id, id, dto);
  }
  @Patch(':id/status') status(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateCreditCardStatusDto,
  ) {
    return this.cards.status(user.id, id, dto.isActive);
  }
  @Post(':id/payments') pay(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: CreateCreditCardPaymentDto,
  ) {
    return this.cards.pay(user.id, id, dto);
  }
  @Patch(':id/statements/:statementId/minimum-payment') minimum(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Param('statementId') statementId: string,
    @Body() dto: UpdateMinimumPaymentDto,
  ) {
    return this.cards.minimum(user.id, id, statementId, dto.minimumPayment);
  }
}

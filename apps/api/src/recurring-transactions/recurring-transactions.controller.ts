import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  CreateRecurringTransactionDto,
  ListRecurringTransactionsDto,
  UpdateRecurringStatusDto,
  UpdateRecurringTransactionDto,
} from './recurring-transactions.dto';
import { RecurringTransactionsService } from './recurring-transactions.service';
@ApiTags('recurring-transactions')
@ApiCookieAuth()
@UseGuards(AccessTokenGuard)
@Controller('recurring-transactions')
export class RecurringTransactionsController {
  constructor(private readonly recurring: RecurringTransactionsService) {}
  @Get() list(
    @CurrentUser() user: { id: string },
    @Query() query: ListRecurringTransactionsDto,
  ) {
    return this.recurring.list(user.id, query);
  }
  @Post() create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateRecurringTransactionDto,
  ) {
    return this.recurring.create(user.id, dto);
  }
  @Get(':id') get(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.recurring.get(user.id, id);
  }
  @Patch(':id') update(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateRecurringTransactionDto,
  ) {
    return this.recurring.update(user.id, id, dto);
  }
  @Patch(':id/status') status(
    @CurrentUser() user: { id: string },
    @Param('id') id: string,
    @Body() dto: UpdateRecurringStatusDto,
  ) {
    return this.recurring.updateStatus(user.id, id, dto);
  }
}

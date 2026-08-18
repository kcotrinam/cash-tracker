import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateTransactionDto, ListTransactionsDto, UpdateTransactionDto } from './transactions.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiCookieAuth()
@UseGuards(AccessTokenGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}
  @Get() list(@CurrentUser() user: { id: string }, @Query() query: ListTransactionsDto) {
    return this.transactions.list(user.id, query);
  }
  @Post() create(@CurrentUser() user: { id: string }, @Body() dto: CreateTransactionDto) {
    return this.transactions.create(user.id, dto);
  }
  @Patch(':id') update(@CurrentUser() user: { id: string }, @Param('id') id: string, @Body() dto: UpdateTransactionDto) {
    return this.transactions.update(user.id, id, dto);
  }
  @Delete(':id') @HttpCode(204) remove(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.transactions.remove(user.id, id);
  }
}

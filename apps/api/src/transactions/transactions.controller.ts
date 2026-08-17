import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateTransactionDto, ListCategoriesDto, ListTransactionsDto } from './transactions.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions') @ApiCookieAuth() @UseGuards(AccessTokenGuard) @Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}
  @Get('categories') categories(@CurrentUser() user: { id: string }, @Query() query: ListCategoriesDto) { return this.transactions.categories(user.id, query.type); }
  @Get() list(@CurrentUser() user: { id: string }, @Query() query: ListTransactionsDto) { return this.transactions.list(user.id, query); }
  @Post() create(@CurrentUser() user: { id: string }, @Body() dto: CreateTransactionDto) { return this.transactions.create(user.id, dto); }
}

import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, ListCategoriesDto } from './categories.dto';

@ApiTags('categories')
@ApiCookieAuth()
@UseGuards(AccessTokenGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}
  @Get() list(@CurrentUser() user: { id: string }, @Query() query: ListCategoriesDto) {
    return this.categories.list(user.id, query);
  }
  @Post() create(@CurrentUser() user: { id: string }, @Body() dto: CreateCategoryDto) {
    return this.categories.create(user.id, dto);
  }
}

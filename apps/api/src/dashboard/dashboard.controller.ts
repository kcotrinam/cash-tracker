import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { GetDashboardDto } from './dashboard.dto';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiCookieAuth()
@UseGuards(AccessTokenGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}
  @Get() get(@CurrentUser() user: { id: string }, @Query() query: GetDashboardDto) {
    return this.dashboard.get(user.id, query);
  }
}

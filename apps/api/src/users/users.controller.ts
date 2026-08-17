import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdateProfileDto } from './users.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiCookieAuth()
@UseGuards(AccessTokenGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get('me') me(@CurrentUser() user: { id: string }) {
    return this.users.me(user.id);
  }
  @Patch('me') update(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ) {
    return this.users.update(user.id, dto);
  }
}

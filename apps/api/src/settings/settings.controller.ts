import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/access-token.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UpdatePreferencesDto } from './settings.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiCookieAuth()
@UseGuards(AccessTokenGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}
  @Get('preferences') preferences(@CurrentUser() user: { id: string }) {
    return this.settings.preferences(user.id);
  }
  @Patch('preferences') updatePreferences(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.settings.updatePreferences(user.id, dto);
  }
}

import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { CategoriesModule } from '../categories/categories.module';
@Module({ imports: [CategoriesModule], controllers: [SettingsController], providers: [SettingsService] })
export class SettingsModule {}

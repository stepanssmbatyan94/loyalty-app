import { Module } from '@nestjs/common';

import { BusinessesModule } from '../businesses/businesses.module';
import { UsersModule } from '../users/users.module';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [UsersModule, BusinessesModule],
  providers: [TelegramService, TelegramUpdate],
})
export class TelegramModule {}

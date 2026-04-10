import { Module } from '@nestjs/common';

import { UsersModule } from '../users/users.module';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [UsersModule],
  providers: [TelegramService, TelegramUpdate],
})
export class TelegramModule {}

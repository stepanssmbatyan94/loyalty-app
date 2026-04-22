import { forwardRef, Module } from '@nestjs/common';

import { BusinessesModule } from '../businesses/businesses.module';
import { MailModule } from '../mail/mail.module';
import { TelegramModule } from '../telegram/telegram.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    BusinessesModule,
    UsersModule,
    MailModule,
    forwardRef(() => TelegramModule),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

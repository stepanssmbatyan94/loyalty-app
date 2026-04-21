import { forwardRef, Module } from '@nestjs/common';

import { BusinessesModule } from '../businesses/businesses.module';
import { LoyaltyCardsModule } from '../loyalty-cards/loyalty-cards.module';
import { RedemptionsModule } from '../redemptions/redemptions.module';
import { ScanTokensModule } from '../scan-tokens/scan-tokens.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { UsersModule } from '../users/users.module';
import { NotificationService } from './notifications/notification.service';
import { ScanController } from './scan.controller';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => BusinessesModule),
    LoyaltyCardsModule,
    TransactionsModule,
    RedemptionsModule,
    ScanTokensModule,
  ],
  providers: [TelegramService, TelegramUpdate, NotificationService],
  controllers: [TelegramController, ScanController],
  exports: [TelegramService],
})
export class TelegramModule {}

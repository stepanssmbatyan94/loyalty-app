import { forwardRef, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { BusinessesModule } from '../businesses/businesses.module';
import { LocaleMiddleware } from '../common/middleware/locale.middleware';
import { LoyaltyCardsModule } from '../loyalty-cards/loyalty-cards.module';
import { RelationalRewardPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

const infrastructurePersistenceModule = RelationalRewardPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    forwardRef(() => LoyaltyCardsModule),
    forwardRef(() => BusinessesModule),
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService, infrastructurePersistenceModule],
})
export class RewardsModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LocaleMiddleware).forRoutes(RewardsController);
  }
}

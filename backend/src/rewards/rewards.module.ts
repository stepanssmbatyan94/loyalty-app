import { forwardRef, Module } from '@nestjs/common';

import { LoyaltyCardsModule } from '../loyalty-cards/loyalty-cards.module';
import { RelationalRewardPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';

const infrastructurePersistenceModule = RelationalRewardPersistenceModule;

@Module({
  imports: [
    infrastructurePersistenceModule,
    forwardRef(() => LoyaltyCardsModule),
  ],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService, infrastructurePersistenceModule],
})
export class RewardsModule {}

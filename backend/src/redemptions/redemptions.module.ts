import { Module } from '@nestjs/common';

import { LoyaltyCardsModule } from '../loyalty-cards/loyalty-cards.module';
import { RewardsModule } from '../rewards/rewards.module';
import { RelationalRedemptionPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { RedemptionsController } from './redemptions.controller';
import { RedemptionsService } from './redemptions.service';

const infrastructurePersistenceModule = RelationalRedemptionPersistenceModule;

@Module({
  imports: [infrastructurePersistenceModule, RewardsModule, LoyaltyCardsModule],
  controllers: [RedemptionsController],
  providers: [RedemptionsService],
  exports: [RedemptionsService],
})
export class RedemptionsModule {}
